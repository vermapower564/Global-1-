import nodemailer from "nodemailer";

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
 * Loads SMTP configuration strictly from environment variables.
 * Sender identity is always the configured enterprise SMTP account.
 */
export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "roushanverma564@gmail.com";
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "";
  const fromName = process.env.SMTP_FROM_NAME || "OMS Enterprise Operations";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    user;

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

/**
 * Resolves the canonical application URL dynamically from environment variables or incoming request headers.
 * Never hardcodes fixed deployment URLs or localhost.
 */
export function getAppBaseUrl(req?: Request | any): string {
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
      const host = typeof headers?.get === "function" ? (headers.get("x-forwarded-host") || headers.get("host")) : null;
      const proto = typeof headers?.get === "function" ? (headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https")) : "http";
      if (host) return `${proto}://${host}`;
    } catch {}
  }
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return "http://localhost:3000";
}

export interface SendEmailOptions {
  to: string; // The intended receiver's email address
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  configOverride?: Partial<SmtpConfig>;
}

/**
 * Dispatches an email via Nodemailer SMTP.
 * - Sender (From): Always the configured SMTP account / environment settings.
 * - Receiver (To): Strictly the intended recipient's email address.
 * - Never uses the receiver's email as the sender.
 */
export async function sendSmtpEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string; mode: string }> {
  const config = { ...getSmtpConfig(), ...options.configOverride };

  // Validate recipient email
  const receiverEmail = options.to?.trim();
  if (!receiverEmail || !receiverEmail.includes("@")) {
    console.error("❌ SMTP Dispatch Error: Invalid receiver email address:", options.to);
    return {
      success: false,
      error: `Invalid receiver email address: "${options.to}". Receiver must be a valid email.`,
      mode: "VALIDATION_FAILED",
    };
  }

  // Sender is ALWAYS the configured SMTP enterprise account, NEVER the receiver
  const senderName = config.fromName || "OMS Enterprise";
  const senderEmail = config.fromEmail || config.user;
  const senderFormatted = `"${senderName}" <${senderEmail}>`;

  // Create real Nodemailer SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465 || config.secure,
    auth:
      config.user && config.pass
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
    tls: {
      rejectUnauthorized: false, // Prevents certificate negotiation issues on cloud/corporate proxies
    },
  });

  try {
    const info = await transporter.sendMail({
      from: senderFormatted,
      to: receiverEmail, // The actual intended employee / recipient email
      replyTo: options.replyTo || senderEmail,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      html: options.html,
    });

    console.log(
      `✓ [SMTP] Email successfully dispatched from [${senderFormatted}] to recipient [${receiverEmail}] (Message ID: ${info.messageId})`
    );

    return {
      success: true,
      messageId: info.messageId,
      mode: "REAL_SMTP_DISPATCH",
    };
  } catch (error: any) {
    console.error(
      `❌ [SMTP] Dispatch Error from [${senderFormatted}] to [${receiverEmail}]:`,
      error.message
    );
    return {
      success: false,
      error: `SMTP Delivery Failed: ${error.message}. Please verify SMTP credentials in environment variables.`,
      mode: "REAL_SMTP_FAILED",
    };
  }
}

