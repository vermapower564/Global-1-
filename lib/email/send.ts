import { getSmtpConfig, getSmtpTransporter, SmtpConfig } from "./smtp";
import {
  renderWelcomeEmail,
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderSalarySlipEmail,
  renderTaskAssignmentEmail,
  renderNotificationEmail,
  WelcomeEmailData,
  PasswordResetEmailData,
  PasswordChangedEmailData,
  SalarySlipEmailData,
  TaskAssignmentEmailData,
  NotificationEmailData,
} from "./templates";
import { queryDb } from "@/lib/db";

export interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array | string;
  contentType?: string;
  cid?: string;
}

export interface DispatchEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  emailType?: string;
  attachments?: EmailAttachment[];
  configOverride?: Partial<SmtpConfig>;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: string;
  emailType: string;
}

/**
 * Centrally logs email dispatch outcomes into the database smtplog table.
 */
async function logEmailTransaction(params: {
  recipient: string;
  subject: string;
  emailType: string;
  status: "SENT" | "FAILED";
  messageId?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const id = `smtp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await queryDb(
      `INSERT INTO smtplog (id, recipient, subject, emailType, status, messageId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        params.recipient.trim(),
        params.subject.slice(0, 255),
        params.emailType,
        params.status,
        params.messageId || null,
      ]
    );
  } catch (err: any) {
    console.warn("⚠️ Warning: Failed to record smtplog in database:", err.message);
  }
}

/**
 * Core SMTP email dispatcher.
 * Validates recipient, uses pooled transporter, logs to DB, and handles all errors safely.
 */
export async function dispatchEmail(options: DispatchEmailOptions): Promise<EmailDispatchResult> {
  const emailType = options.emailType || "GENERAL_COMMUNICATION";
  const recipient = (options.to || "").trim();

  // Validate recipient
  if (!recipient || !recipient.includes("@")) {
    const errorMsg = `Invalid recipient email: "${options.to}". An authentic email address is required.`;
    console.error(`❌ [SMTP] Dispatch Rejected: ${errorMsg}`);
    await logEmailTransaction({
      recipient: recipient || "unknown",
      subject: options.subject,
      emailType,
      status: "FAILED",
      errorMessage: errorMsg,
    });
    return {
      success: false,
      error: errorMsg,
      recipient,
      emailType,
    };
  }

  const config = { ...getSmtpConfig(), ...options.configOverride };
  const senderName = config.fromName || "OMS Enterprise";
  const senderEmail = config.fromEmail || config.user || "no-reply@oms.com";
  const senderFormatted = `"${senderName}" <${senderEmail}>`;

  try {
    const transporter = getSmtpTransporter();

    const mailOptions: any = {
      from: senderFormatted,
      to: recipient,
      replyTo: options.replyTo || senderEmail,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      html: options.html,
    };

    if (options.attachments && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content),
        contentType: a.contentType,
        cid: a.cid,
      }));
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `✓ [SMTP] Email (${emailType}) dispatched successfully to [${recipient}] | Message ID: ${info.messageId}`
    );

    await logEmailTransaction({
      recipient,
      subject: options.subject,
      emailType,
      status: "SENT",
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
      recipient,
      emailType,
    };
  } catch (err: any) {
    const errorMsg = err.message || "Failed to dispatch email via SMTP.";
    console.error(`❌ [SMTP] Delivery Failed for [${recipient}] (${emailType}):`, errorMsg);

    await logEmailTransaction({
      recipient,
      subject: options.subject,
      emailType,
      status: "FAILED",
      errorMessage: errorMsg,
    });

    return {
      success: false,
      error: `SMTP Delivery Failed: ${errorMsg}. Please verify SMTP credentials in environment variables.`,
      recipient,
      emailType,
    };
  }
}

/**
 * Dispatches Employee Welcome & Account Activation Email
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<EmailDispatchResult> {
  const { subject, html, text } = renderWelcomeEmail(data);
  return dispatchEmail({
    to,
    subject,
    html,
    text,
    emailType: "EMPLOYEE_WELCOME",
  });
}

/**
 * Dispatches Password Reset Request Email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetEmailData
): Promise<EmailDispatchResult> {
  const { subject, html, text } = renderPasswordResetEmail(data);
  return dispatchEmail({
    to,
    subject,
    html,
    text,
    emailType: "PASSWORD_RESET",
  });
}

/**
 * Dispatches Password Changed Security Confirmation Email
 */
export async function sendPasswordChangedEmail(
  to: string,
  data: PasswordChangedEmailData
): Promise<EmailDispatchResult> {
  const { subject, html, text } = renderPasswordChangedEmail(data);
  return dispatchEmail({
    to,
    subject,
    html,
    text,
    emailType: "PASSWORD_CHANGED",
  });
}

/**
 * Dispatches Official Salary Slip Email with Binary PDF Attachment
 */
export async function sendSalarySlipEmail(
  to: string,
  data: SalarySlipEmailData,
  pdfBuffer: Buffer | Uint8Array
): Promise<EmailDispatchResult> {
  const { subject, html, text } = renderSalarySlipEmail(data);
  return dispatchEmail({
    to,
    subject,
    html,
    text,
    emailType: "SALARY_SLIP",
    attachments: [
      {
        filename: data.pdfFilename || `Salary-Slip-${data.employeeId}-${data.salaryMonth.replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Dispatches Task Assignment Notification Email
 */
export async function sendTaskAssignmentEmail(
  to: string,
  data: TaskAssignmentEmailData
): Promise<EmailDispatchResult> {
  const { subject, html, text } = renderTaskAssignmentEmail(data);
  return dispatchEmail({
    to,
    subject,
    html,
    text,
    emailType: "TASK_ASSIGNED",
  });
}

/**
 * Dispatches General Notification / Announcement Email
 */
export async function sendNotificationEmail(
  to: string,
  data: NotificationEmailData
): Promise<EmailDispatchResult> {
  const { subject, html, text } = renderNotificationEmail(data);
  return dispatchEmail({
    to,
    subject,
    html,
    text,
    emailType: "COMPANY_NOTIFICATION",
  });
}