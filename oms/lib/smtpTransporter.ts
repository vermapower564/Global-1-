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

export function getSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true" || false,
    user: process.env.SMTP_USER || "roushanverma564@gmail.com",
    pass: process.env.SMTP_PASS || "", // Insert your Gmail 16-character App Password in .env
    fromName: process.env.SMTP_FROM_NAME || "OMS Enterprise Operations",
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "roushanverma564@gmail.com",
  };
}

export async function sendSmtpEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  configOverride?: Partial<SmtpConfig>;
}): Promise<{ success: boolean; messageId?: string; error?: string; mode: string }> {
  const config = { ...getSmtpConfig(), ...options.configOverride };

  // Create real Nodemailer SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465 || config.secure,
    auth: config.user && config.pass ? {
      user: config.user,
      pass: config.pass,
    } : undefined,
    tls: {
      rejectUnauthorized: false, // Prevents certificate rejection errors
    },
  });

  try {
    // Send Real Email over SMTP Server
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail || config.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      html: options.html,
    });

    console.log(`✓ Real SMTP Email delivered to ${options.to} (Message ID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
      mode: "REAL_SMTP_DISPATCH",
    };
  } catch (error: any) {
    console.error(`❌ Real SMTP Dispatch Error for ${options.to}:`, error.message);
    return {
      success: false,
      error: `Real SMTP Delivery Failed: ${error.message}. Check SMTP_USER & SMTP_PASS in .env`,
      mode: "REAL_SMTP_FAILED",
    };
  }
}
