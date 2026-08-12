import { NextResponse } from "next/server";
import { sendSmtpEmail, getSmtpConfig } from "@/lib/smtpTransporter";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, name, password, lwdFormatted, resignationId, reason, employeeId, role, department, salary, subject, customHtml, isFirstLogin } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: "Recipient 'to' email address is required for Nodemailer SMTP dispatch." }, { status: 400 });
    }

    let emailSubject = subject || "Official Communication from OMS Enterprise";
    let htmlContent = customHtml || "";

    const timestampStr = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // 📩 TEMPLATE 1: Employee Added / Onboarding Welcome Email (Nodemailer SMTP)
    if (type === "WELCOME" || type === "EMPLOYEE_ADDED") {
      emailSubject = `🎉 Welcome to OMS Enterprise! Your Employee ID is ${employeeId || "EMP"}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; text-transform: uppercase;">WELCOME TO OMS ENTERPRISE</h1>
            <p style="margin-top: 4px; font-size: 12px; color: #f87171;">Nodemailer Corporate Onboarding Service</p>
          </div>
          <div style="padding: 20px 0;">
            <h2 style="color: #0f172a; font-size: 18px;">Congratulations, ${name || "Team Member"}! 🎉</h2>
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">
              We are delighted to welcome you to the <strong>${department || "Engineering"}</strong> department at OMS Enterprise. Your corporate employee identity has been provisioned.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">🪪 OFFICIAL EMPLOYEE CREDENTIALS</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Employee Name:</strong> ${name}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Assigned Employee ID:</strong> <span style="font-family: monospace; color: #dc2626; font-size: 15px; font-weight: bold;">${employeeId || "EMP"}</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Corporate Email:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${to}</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Initial Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #059669;">${password || "password123"}</span></p>
            </div>
            <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #c2410c;">🔒 PASSWORD SECURITY ADVICE:</h3>
              <ul style="font-size: 12px; color: #7c2d12; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Maintain a minimum password length of 12+ characters combining uppercase, lowercase, numbers, and symbols (@#$%!).</li>
                <li>You can update your password anytime at <a href="http://localhost:3000/auth/forget-password" style="color: #dc2626;">http://localhost:3000/auth/forget-password</a>.</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    } 
    // 📩 TEMPLATE 2: Employee Profile & ID Updated Notice (Nodemailer SMTP)
    else if (type === "EMPLOYEE_UPDATED") {
      emailSubject = `✏️ Profile & Employee ID Update Notification (${employeeId || "EMP"})`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">EMPLOYEE PROFILE UPDATE ALERT</h1>
            <p style="margin-top: 6px; font-size: 12px; color: #f87171;">OMS Enterprise HR Operations Desk</p>
          </div>
          <div style="padding: 20px 0;">
            <h2 style="color: #0f172a; font-size: 16px;">Dear ${name || "Employee"},</h2>
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">
              This email confirms that your employee user profile and corporate credentials were updated by HR/Admin on <strong>${timestampStr} (IST)</strong>.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #f59e0b; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a;">📋 UPDATED EMPLOYEE DETAILS</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Employee Name:</strong> ${name}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Employee ID:</strong> <span style="font-family: monospace; color: #d97706; font-weight: bold;">${employeeId}</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Department:</strong> ${department || "Engineering"}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Designation / Role:</strong> ${role || "Developer"}</p>
            </div>
          </div>
        </div>
      `;
    }
    // 📩 TEMPLATE 3: Employee Account Deactivation / ID Deleted (Nodemailer SMTP)
    else if (type === "EMPLOYEE_DELETED") {
      emailSubject = `⚠️ Account Deactivation Notice: Employee ID ${employeeId || "EMP"}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
          <div style="background-color: #991b1b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">EMPLOYEE ACCOUNT DEACTIVATED</h1>
            <p style="margin-top: 6px; font-size: 12px; color: #fecaca;">OMS Enterprise Corporate System Admin</p>
          </div>
          <div style="padding: 20px 0;">
            <h2 style="color: #0f172a; font-size: 16px;">Dear ${name || "Employee"},</h2>
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">
              Please be advised that your employee user profile and access ID (<strong>${employeeId}</strong>) were deactivated in the XAMPP MySQL database on <strong>${timestampStr} (IST)</strong>.
            </p>
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #991b1b;">If you believe this deactivation was performed in error, please contact corporate HR immediately at hr@oms.com.</p>
            </div>
          </div>
        </div>
      `;
    }
    // 📩 TEMPLATE 4: Employee Login Security Notification (Nodemailer SMTP)
    else if (type === "LOGIN_NOTIFICATION") {
      const loginTitle = isFirstLogin
        ? `🎉 Welcome! First Successful Login to OMS Enterprise Portal (${employeeId || to})`
        : `🔐 Security Alert: Successful Login to OMS Enterprise Portal (${employeeId || to})`;

      emailSubject = loginTitle;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">ACCOUNT LOGIN NOTIFICATION</h1>
            <p style="margin-top: 6px; font-size: 12px; color: #f87171;">Nodemailer Security Center • DLF Cyber City, Gurugram</p>
          </div>

          <div style="padding: 20px 0;">
            <h2 style="color: #0f172a; font-size: 16px;">Dear ${name || "Employee"},</h2>
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">
              ${isFirstLogin 
                ? `Congratulations on your <strong>FIRST successful sign-in</strong> to the OMS Enterprise Portal!`
                : `This email confirms that your OMS Employee account was successfully signed into.`}
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #10b981; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">📋 LOGIN AUDIT DETAILS</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Employee Identity:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${name || "User"} (${employeeId || "EMP"})</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Registered Email:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${to}</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Login Timestamp:</strong> <span style="font-family: monospace; font-weight: bold; color: #059669;">${timestampStr} (IST)</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Session Type:</strong> ${isFirstLogin ? "🎉 Initial First Login" : "🔑 Standard Active Session"}</p>
            </div>

            <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #c2410c;">🛡️ SECURITY NOTICE:</h3>
              <p style="font-size: 12px; color: #7c2d12; line-height: 1.5; margin: 0;">
                If you performed this login, no action is required. If you did <strong>NOT</strong> sign in at this time, please reset your password immediately at <a href="http://localhost:3000/auth/forget-password" style="color: #dc2626; font-weight: bold;">http://localhost:3000/auth/forget-password</a>.
              </p>
            </div>
          </div>
        </div>
      `;
    }
    // 📩 TEMPLATE 5: Employee Password Reset (Nodemailer SMTP)
    else if (type === "PASSWORD_RESET") {
      emailSubject = `🔑 Account Password Reset & Security Update - OMS Enterprise`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 16px; text-align: center;">
            <h2 style="margin: 0;">PASSWORD RESET INSTRUCTIONS</h2>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 13px; color: #334155;">Hello ${name || "Employee"}, a password reset request was processed for your corporate account <strong>${to}</strong>.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 14px; margin: 16px 0;">
              <p style="margin: 0; font-size: 13px;"><strong>New Security Password:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #991b1b;">${password}</span></p>
            </div>
          </div>
        </div>
      `;
    }
    // 📩 TEMPLATE 6: Resignation & 15-Day Notice Acceptance (Nodemailer SMTP)
    else if (type === "RESIGNATION_NOTICE") {
      emailSubject = `📄 Official Resignation & 15-Day Notice Period Acknowledgment (${resignationId || "RSG-2026"})`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">RESIGNATION & 15-DAY NOTICE ACKNOWLEDGMENT</h1>
            <p style="margin-top: 6px; font-size: 12px; color: #f87171;">OMS Enterprise • HR Exit Cell</p>
          </div>
          <div style="padding: 20px 0;">
            <h2 style="color: #0f172a; font-size: 16px;">Dear ${name || "Team Member"},</h2>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #dc2626; padding: 18px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 13px;"><strong>Notice Period:</strong> <span style="color: #b91c1c; font-weight: bold;">15 Calendar Days</span></p>
              <p style="margin: 4px 0; font-size: 13px; background-color: #fee2e2; padding: 8px;">
                <strong>🎯 OFFICIAL LAST WORKING DAY (LWD):</strong> ${lwdFormatted}
              </p>
            </div>
            <p style="font-size: 12px; color: #475569;">Stated Reason: <em>"${reason}"</em></p>
          </div>
        </div>
      `;
    }

    const result = await sendSmtpEmail({
      to,
      subject: emailSubject,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: `✓ Nodemailer SMTP email dispatched successfully to ${to}!`,
      smtpDetails: {
        mode: result.mode,
        messageId: result.messageId,
        host: getSmtpConfig().host,
        port: getSmtpConfig().port,
        sender: getSmtpConfig().fromEmail,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to dispatch Nodemailer SMTP email." }, { status: 500 });
  }
}
