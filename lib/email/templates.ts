/**
 * Professional HTML Email Templates for OMS Enterprise
 * Clean inline CSS, responsive layout, dark-slate header branding, fully compatible with Gmail and Outlook.
 */

export interface BaseTemplateOptions {
  companyName?: string;
  companyAddress?: string;
}

export interface WelcomeEmailData extends BaseTemplateOptions {
  name: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  activationLink: string;
}

export interface PasswordResetEmailData extends BaseTemplateOptions {
  name: string;
  employeeId: string;
  email: string;
  otpCode: string;
  resetLink: string;
  expiresInMinutes?: number;
}

export interface PasswordChangedEmailData extends BaseTemplateOptions {
  name: string;
  employeeId: string;
  email: string;
  timestamp: string;
}

export interface SalarySlipEmailData extends BaseTemplateOptions {
  name: string;
  employeeId: string;
  salaryMonth: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  paymentDate?: string;
  pdfFilename: string;
  viewOnlineUrl?: string;
}

export interface TaskAssignmentEmailData extends BaseTemplateOptions {
  name: string;
  employeeId: string;
  taskTitle: string;
  projectName: string;
  priority: string;
  dueDate: string;
  assignedByName: string;
  description?: string;
  taskUrl: string;
}

export interface NotificationEmailData extends BaseTemplateOptions {
  name: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  actionText?: string;
}

const DEFAULT_COMPANY = "OMS ENTERPRISE";
const DEFAULT_HQ = "DLF Cyber City, Tower B, Sector 25, Gurugram, HR 122002 • support@oms.com";

function formatCurrency(amount: number): string {
  return "INR " + Number(amount || 0).toLocaleString("en-IN");
}

/**
 * 1. Welcome & Account Activation Email
 */
export function renderWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const subject = `🎉 Welcome to OMS Enterprise! Activate Your Account (${data.employeeId})`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 28px; text-align: center;">
              <table role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #2563eb; color: #ffffff; width: 44px; height: 44px; line-height: 44px; font-size: 22px; font-weight: 900; border-radius: 12px; margin-bottom: 12px;">O</div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase;">${company}</h1>
                    <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #93c5fd; letter-spacing: 1.5px; text-transform: uppercase;">Corporate Employee Provisioning</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">Welcome aboard, ${data.name}! 👋</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Your corporate account has been officially provisioned in the OMS Enterprise operations management system. Please activate your account and configure your secure password.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 1px; margin-bottom: 10px;">🪪 Corporate Profile Details</div>
                    <table role="presentation" width="100%" style="font-size: 13px; color: #1e293b;">
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 140px;">Employee Name:</td>
                        <td style="padding: 4px 0; font-weight: 700;">${data.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Employee ID:</td>
                        <td style="padding: 4px 0; font-family: monospace; font-weight: 800; color: #2563eb;">${data.employeeId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Department:</td>
                        <td style="padding: 4px 0; font-weight: 600;">${data.department}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Designation:</td>
                        <td style="padding: 4px 0; font-weight: 600;">${data.role}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Registered Email:</td>
                        <td style="padding: 4px 0; font-family: monospace; color: #0284c7;">${data.email}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.activationLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                      🚀 Activate Account & Set Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                Or copy and paste this direct activation link into your browser:<br/>
                <a href="${data.activationLink}" style="color: #2563eb; word-break: break-all;">${data.activationLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
              <p style="margin: 4px 0 0 0;">${hq}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
WELCOME TO ${company}
=====================================================
Hello ${data.name},

Your corporate employee account has been created on OMS Enterprise.

Employee Details:
- Name: ${data.name}
- Employee ID: ${data.employeeId}
- Department: ${data.department}
- Designation: ${data.role}
- Email: ${data.email}

To activate your account and configure your password, please visit:
${data.activationLink}

Regards,
${company} Operations & HR Team
`;

  return { subject, html, text };
}

/**
 * 2. Password Reset Email
 */
export function renderPasswordResetEmail(data: PasswordResetEmailData): { subject: string; html: string; text: string } {
  const subject = `🔐 Password Reset Request (${data.otpCode}) - OMS Enterprise`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;
  const expiry = data.expiresInMinutes || 15;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; text-transform: uppercase;">${company} SECURITY</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #93c5fd; letter-spacing: 1px; text-transform: uppercase;">Account Password Recovery</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Dear ${data.name},</h2>
              <p style="margin: 0 0 18px 0; font-size: 13px; line-height: 1.6; color: #334155;">
                We received a request to reset the password for your OMS account (<strong>${data.employeeId}</strong> / <strong>${data.email}</strong>).
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">Your Single-Use Verification Code</div>
                <div style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #2563eb;">${data.otpCode}</div>
                <div style="font-size: 11px; color: #b45309; font-weight: 600; margin-top: 6px;">⏳ This code expires in ${expiry} minutes</div>
              </div>

              <!-- Direct Reset Button -->
              <table role="presentation" width="100%" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.resetLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                      🔒 Reset Password Directly →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Advice -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
                <p style="margin: 0; font-size: 11px; color: #991b1b; line-height: 1.5;">
                  <strong>⚠️ Security Notice:</strong> If you did not request this password reset, please disregard this email. Your password will remain unchanged. Never share this OTP with anyone.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${company}. ${hq}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
PASSWORD RESET REQUEST - ${company}
=====================================================
Dear ${data.name},

A password reset request was initiated for your account (${data.employeeId}).

Your 6-Digit OTP Code is: ${data.otpCode}
(Expires in ${expiry} minutes)

Or reset directly at:
${data.resetLink}

If you did not request this reset, please ignore this email.

Regards,
${company} Information Security Team
`;

  return { subject, html, text };
}

/**
 * 3. Password Changed Confirmation
 */
export function renderPasswordChangedEmail(data: PasswordChangedEmailData): { subject: string; html: string; text: string } {
  const subject = `🔐 Security Alert: Password Updated for (${data.employeeId})`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800;">SECURITY ALERT: PASSWORD MODIFIED</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155;">Hello ${data.name},</p>
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #334155;">
                This email confirms that the password for your OMS Enterprise account (<strong>${data.employeeId}</strong>) was successfully updated on <strong>${data.timestamp}</strong>.
              </p>
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 18px 0; font-size: 12px; color: #065f46;">
                ✓ Your account credentials are now secured with the new password.
              </div>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 18px 0; font-size: 12px; color: #991b1b;">
                If you did not perform this change, contact your corporate administrator immediately at <strong>support@oms.com</strong>.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} ${company}. ${hq}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
SECURITY ALERT - ${company}
=====================================================
Hello ${data.name},

The password for your account (${data.employeeId}) was updated on ${data.timestamp}.

If you did not make this change, contact support@oms.com immediately.
`;

  return { subject, html, text };
}

/**
 * 4. Salary Slip Email with Binary PDF Attachment Notice
 */
export function renderSalarySlipEmail(data: SalarySlipEmailData): { subject: string; html: string; text: string } {
  const subject = `📄 Official Salary Slip — ${data.salaryMonth} (${data.employeeId})`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase;">${company} PAYROLL</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #93c5fd; letter-spacing: 1px; text-transform: uppercase;">Official Payslip Disbursal • ${data.salaryMonth}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Dear ${data.name},</h2>
              <p style="margin: 0 0 18px 0; font-size: 13px; line-height: 1.6; color: #334155;">
                Your official salary slip for the month of <strong>${data.salaryMonth}</strong> has been generated and disbursed. The complete digitally signed payslip is attached to this email as a PDF document.
              </p>

              <!-- Payroll Breakdown Card -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 20px 0; overflow: hidden;">
                <tr>
                  <td style="background-color: #1e293b; color: #ffffff; padding: 12px 18px; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                    💰 Compensation Summary
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" width="100%" style="font-size: 13px; color: #334155;">
                      <tr>
                        <td style="padding: 5px 0;">Total Gross Earnings:</td>
                        <td align="right" style="padding: 5px 0; font-family: monospace; font-weight: 700; color: #0f172a;">${formatCurrency(data.grossSalary)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">Total Deductions (PF/Tax):</td>
                        <td align="right" style="padding: 5px 0; font-family: monospace; font-weight: 700; color: #e11d48;">- ${formatCurrency(data.totalDeductions)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #e2e8f0;">
                        <td style="padding: 10px 0 0 0; font-weight: 800; color: #0f172a; font-size: 14px;">NET TAKE-HOME SALARY:</td>
                        <td align="right" style="padding: 10px 0 0 0; font-family: monospace; font-weight: 900; color: #059669; font-size: 16px;">${formatCurrency(data.netSalary)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment Notification -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
                  📎 <strong>Attached File:</strong> <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #1d4ed8;">${data.pdfFilename}</code><br/>
                  Please review the attached PDF for itemized breakdowns of basic pay, HRA, statutory PF, TDS deductions, and authorized bank reference numbers.
                </p>
              </div>

              ${data.viewOnlineUrl ? `
              <table role="presentation" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.viewOnlineUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 10px 24px; border-radius: 8px;">
                      👁️ View in OMS Employee Portal →
                    </a>
                  </td>
                </tr>
              </table>` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">This is a computer-generated payroll record from ${company}.</p>
              <p style="margin: 4px 0 0 0;">${hq}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
SALARY SLIP - ${company} (${data.salaryMonth})
=====================================================
Dear ${data.name} (${data.employeeId}),

Your salary slip for ${data.salaryMonth} has been generated.

Summary:
- Gross Salary: ${formatCurrency(data.grossSalary)}
- Total Deductions: ${formatCurrency(data.totalDeductions)}
- Net Salary Disbursed: ${formatCurrency(data.netSalary)}

Please find your official payslip attached as: ${data.pdfFilename}

Regards,
${company} Corporate Finance & Payroll
`;

  return { subject, html, text };
}

/**
 * 5. Task Assignment Email
 */
export function renderTaskAssignmentEmail(data: TaskAssignmentEmailData): { subject: string; html: string; text: string } {
  const subject = `📋 Task Assigned: ${data.taskTitle} [${data.priority}]`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800;">TASK ASSIGNMENT NOTIFICATION</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase;">OMS Project Management Hub</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #334155;">Hello ${data.name},</p>
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #334155;">
                A new project task has been assigned to you by <strong>${data.assignedByName}</strong>.
              </p>

              <!-- Task Card -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; margin: 18px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${data.taskTitle}</div>
                    <table role="presentation" width="100%" style="font-size: 12px; color: #475569;">
                      <tr>
                        <td style="padding: 3px 0; width: 100px; font-weight: 600;">Project:</td>
                        <td style="padding: 3px 0; font-weight: 700; color: #0f172a;">${data.projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-weight: 600;">Priority:</td>
                        <td style="padding: 3px 0; font-weight: 700; color: #2563eb;">${data.priority}</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-weight: 600;">Due Date:</td>
                        <td style="padding: 3px 0; font-weight: 700; color: #d97706;">${data.dueDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-weight: 600;">Assigned By:</td>
                        <td style="padding: 3px 0;">${data.assignedByName}</td>
                      </tr>
                    </table>
                    ${data.description ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #334155; line-height: 1.5;">
                      <strong>Description:</strong> ${data.description}
                    </div>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table role="presentation" width="100%" style="margin: 22px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.taskUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px;">
                      🚀 Open Task in Workspace →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} ${company}. ${hq}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
TASK ASSIGNMENT - ${company}
=====================================================
Hello ${data.name},

A new task has been assigned to you:
- Task: ${data.taskTitle}
- Project: ${data.projectName}
- Priority: ${data.priority}
- Due Date: ${data.dueDate}
- Assigned By: ${data.assignedByName}

View task online:
${data.taskUrl}
`;

  return { subject, html, text };
}

/**
 * 6. General Notification / Announcement Email
 */
export function renderNotificationEmail(data: NotificationEmailData): { subject: string; html: string; text: string } {
  const subject = `📢 ${data.title} — OMS Enterprise`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800;">COMPANY NOTIFICATION</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase;">${data.type || "Official Communication"}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #0f172a;">${data.title}</h2>
              <div style="font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 20px; white-space: pre-line;">
                ${data.message}
              </div>
              ${data.actionUrl ? `
              <table role="presentation" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.actionUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px;">
                      ${data.actionText || "View Details in Portal →"}
                    </a>
                  </td>
                </tr>
              </table>` : ""}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} ${company}. ${hq}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
COMPANY NOTIFICATION - ${company}
=====================================================
${data.title}
Type: ${data.type || "INFO"}

${data.message}

${data.actionUrl ? `View Details: ${data.actionUrl}` : ""}
`;

  return { subject, html, text };
}

export interface ResignationApprovedEmailData extends BaseTemplateOptions {
  name: string;
  employeeId: string;
  email: string;
  resignationDate: string;
  reason: string;
  approvedByName: string;
  approverRole: string;
  approvalDate: string;
}

/**
 * 7. Resignation Approved Notification Email
 */
export function renderResignationApprovedEmail(data: ResignationApprovedEmailData): { subject: string; html: string; text: string } {
  const subject = `Resignation Request Approved — OMS Enterprise`;
  const company = data.companyName || DEFAULT_COMPANY;
  const hq = data.companyAddress || DEFAULT_HQ;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; text-transform: uppercase;">RESIGNATION REQUEST APPROVED</h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; font-weight: 700; color: #34d399; text-transform: uppercase;">OMS Enterprise Corporate HR Operations</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 0;">Dear ${data.name},</p>
              <p style="font-size: 13px; color: #334155; line-height: 1.6;">
                Your resignation request has been approved.
              </p>

              <!-- Resignation Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">📋 RESIGNATION DETAILS</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
                  <tr>
                    <td width="35%" style="font-weight: 600; color: #64748b;">Employee ID:</td>
                    <td style="font-weight: 700; color: #0f172a; font-family: monospace;">${data.employeeId}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Resignation Date:</td>
                    <td style="font-weight: 600; color: #0f172a;">${data.resignationDate}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Reason:</td>
                    <td style="font-weight: 600; color: #0f172a;">${data.reason}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Approved By:</td>
                    <td style="font-weight: 700; color: #059669;">${data.approvedByName} (${data.approverRole})</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Approval Date:</td>
                    <td style="font-weight: 600; color: #0f172a;">${data.approvalDate}</td>
                  </tr>
                </table>
              </div>

              <!-- Notice Box -->
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #9f1239; font-weight: 600;">
                  ⚠️ Your employee account has been deactivated following the approval of your resignation.
                </p>
              </div>

              <p style="font-size: 13px; color: #334155; margin-top: 24px; margin-bottom: 0;">
                Regards,<br>
                <strong style="color: #0f172a;">OMS Enterprise Operations</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} ${company}. ${hq}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Dear ${data.name},

Your resignation request has been approved.

Resignation Details:

Employee ID: ${data.employeeId}
Resignation Date: ${data.resignationDate}
Reason: ${data.reason}
Approved By: ${data.approvedByName}
Approver Role: ${data.approverRole}
Approval Date: ${data.approvalDate}

Your employee account has been deactivated following the approval of your resignation.

Regards,
OMS Enterprise
  `.trim();

  return { subject, html, text };
}