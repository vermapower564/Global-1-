export * from "./email/smtp";
export * from "./email/templates";
export * from "./email/send";

import { dispatchEmail, DispatchEmailOptions } from "./email/send";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  configOverride?: Partial<import("./email/smtp").SmtpConfig>;
  attachments?: import("./email/send").EmailAttachment[];
}

/**
 * Backward-compatible wrapper for sendSmtpEmail.
 */
export async function sendSmtpEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string; mode: string }> {
  const result = await dispatchEmail(options as DispatchEmailOptions);
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    mode: result.success ? "REAL_SMTP_DISPATCH" : "REAL_SMTP_FAILED",
  };
}