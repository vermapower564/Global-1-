import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { verifySmtpConnection, getSmtpConfig } from "@/lib/email/smtp";
import { dispatchEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

// GET: Check SMTP Server Connection Status (Admin Only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "ADMIN"];

    if (!authResult.user || !adminRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only administrators can test SMTP server status." },
        { status: 403 }
      );
    }

    const verification = await verifySmtpConnection();

    return NextResponse.json({
      success: verification.success,
      message: verification.message,
      smtp: verification.config,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify SMTP connection." },
      { status: 500 }
    );
  }
}

// POST: Send a Real Test Email to Admin (Admin Only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "ADMIN"];

    if (!authResult.user || !adminRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only administrators can send SMTP test emails." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = body.to || authResult.user.email;

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid recipient email address is required." },
        { status: 400 }
      );
    }

    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const config = getSmtpConfig();

    const result = await dispatchEmail({
      to: targetEmail.trim(),
      subject: `🧪 OMS Enterprise SMTP Diagnostic Test (${timestampStr})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">OMS ENTERPRISE SMTP DIAGNOSTICS</h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #93c5fd;">Server-Side Communication Test</p>
          </div>
          <div style="padding: 20px 0;">
            <h3 style="color: #059669; font-size: 16px; margin-top: 0;">✓ SMTP Delivery Successful!</h3>
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">
              This diagnostic message confirms that your SMTP mail server settings in OMS Enterprise are fully operational and ready for production email dispatch.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 12px; color: #1e293b;">
              <p style="margin: 3px 0;"><strong>SMTP Host:</strong> <code style="color: #2563eb;">${config.host}:${config.port}</code></p>
              <p style="margin: 3px 0;"><strong>Sender Identity:</strong> ${config.fromName} &lt;${config.fromEmail}&gt;</p>
              <p style="margin: 3px 0;"><strong>Test Recipient:</strong> ${targetEmail.trim()}</p>
              <p style="margin: 3px 0;"><strong>Timestamp:</strong> ${timestampStr} (IST)</p>
            </div>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
            OMS Enterprise System Administration • DLF Cyber City, Gurugram
          </div>
        </div>
      `,
      emailType: "SMTP_DIAGNOSTIC_TEST",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "SMTP test delivery failed.",
          recipient: targetEmail,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `✓ SMTP test email successfully delivered to ${targetEmail}.`,
      messageId: result.messageId,
      recipient: targetEmail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch test email." },
      { status: 500 }
    );
  }
}