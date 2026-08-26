import nodemailer, { Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

/**
 * Loads SMTP configuration strictly from server-side environment variables.
 * Never exposes credentials to client-side components.
 */
export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "";
  const fromName = process.env.SMTP_FROM_NAME || "OMS Enterprise Operations";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    user ||
    "no-reply@oms.com";

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
  };
}

let cachedTransporter: Transporter | null = null;
let lastTransporterConfigKey = "";

/**
 * Returns a pooled/reusable Nodemailer Transporter instance.
 */
export function getSmtpTransporter(): Transporter {
  const config = getSmtpConfig();
  const currentKey = `${config.host}:${config.port}:${config.secure}:${config.user}:${config.pass}`;

  if (cachedTransporter && lastTransporterConfigKey === currentKey) {
    return cachedTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.pass
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
    tls: {
      rejectUnauthorized: false, // Prevents TLS negotiation failures on cloud hosting/corporate proxies
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  cachedTransporter = transporter;
  lastTransporterConfigKey = currentKey;

  return transporter;
}

/**
 * Tests and verifies the SMTP server connection and authentication.
 */
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  message: string;
  config: { host: string; port: number; secure: boolean; fromEmail: string; configured: boolean };
}> {
  const config = getSmtpConfig();
  const isConfigured = Boolean(config.host && config.user && config.pass);

  if (!isConfigured) {
    return {
      success: false,
      message: "SMTP is not fully configured. Missing SMTP_USER or SMTP_PASSWORD in environment variables.",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        fromEmail: config.fromEmail,
        configured: false,
      },
    };
  }

  try {
    const transporter = getSmtpTransporter();
    await transporter.verify();
    return {
      success: true,
      message: `✓ SMTP connection and authentication verified successfully with ${config.host}:${config.port}.`,
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        fromEmail: config.fromEmail,
        configured: true,
      },
    };
  } catch (error: any) {
    console.error("❌ SMTP Verification Error:", error.message);
    return {
      success: false,
      message: `SMTP Connection Failed: ${error.message}`,
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        fromEmail: config.fromEmail,
        configured: true,
      },
    };
  }
}

/**
 * Resolves the canonical application base URL dynamically.
 * Prioritizes canonical production APP_BASE_URL to avoid spoofing.
 */
export function getAppBaseUrl(req?: Request | any): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.APP_URL && !process.env.APP_URL.includes("localhost")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (req) {
    try {
      const headers = req.headers;
      const host =
        typeof headers?.get === "function"
          ? headers.get("x-forwarded-host") || headers.get("host")
          : null;
      const proto =
        typeof headers?.get === "function"
          ? headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https")
          : "http";
      if (host) return `${proto}://${host}`;
    } catch {}
  }
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return "http://localhost:3000";
}