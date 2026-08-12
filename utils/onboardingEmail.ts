export interface OnboardingEmailRecord {
  id: string;
  recipientName: string;
  recipientEmail: string;
  employeeId: string;
  department: string;
  sentAt: string;
  emailSubject: string;
  emailBodyHtml: string;
  smtpStatus?: string;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  label: "Very Weak" | "Weak" | "Medium" | "Strong" | "Cyber Secure";
  colorClass: string;
  suggestions: string[];
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const suggestions: string[] = [];

  const hasMinLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (hasMinLength) score += 30;
  else suggestions.push("• Increase length to at least 12 characters");

  if (hasUpper) score += 20;
  else suggestions.push("• Add at least 1 UPPERCASE letter (A-Z)");

  if (hasLower) score += 15;
  else suggestions.push("• Add at least 1 lowercase letter (a-z)");

  if (hasNumber) score += 15;
  else suggestions.push("• Add at least 1 number (0-9)");

  if (hasSymbol) score += 20;
  else suggestions.push("• Add at least 1 special symbol (@, #, $, %, &, *, !)");

  if (/1234|qwerty|password|admin/i.test(password)) {
    score = Math.max(10, score - 30);
    suggestions.push("⚠️ Avoid common words like '1234', 'password', or 'admin'");
  }

  let label: PasswordStrengthResult["label"] = "Very Weak";
  let colorClass = "text-rose-600 font-extrabold";

  if (score >= 90) {
    label = "Cyber Secure";
    colorClass = "text-emerald-600 font-extrabold";
  } else if (score >= 70) {
    label = "Strong";
    colorClass = "text-emerald-500 font-bold";
  } else if (score >= 50) {
    label = "Medium";
    colorClass = "text-amber-500 font-bold";
  } else if (score >= 30) {
    label = "Weak";
    colorClass = "text-rose-500 font-bold";
  }

  return {
    score,
    label,
    colorClass,
    suggestions,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
  };
}

export function generateCongratulationsWelcomeEmail(
  name: string,
  email: string,
  employeeId: string,
  department: string
): OnboardingEmailRecord {
  const sentAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const id = `EML-${Math.floor(100000 + Math.random() * 900000)}`;

  const subject = `🎉 Congratulations & Welcome to OMS Enterprise! Your Employee ID is ${employeeId}`;

  const emailBodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
      <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; text-transform: uppercase;">🎉 CONGRATULATIONS & WELCOME!</h1>
        <p style="margin-top: 6px; font-size: 13px; color: #f87171;">OMS Enterprise Global Pvt. Ltd. • DLF Cyber City, Gurugram</p>
      </div>

      <div style="padding: 20px 0;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Dear ${name},</h2>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Congratulations! We are thrilled to officially welcome you to the <strong>${department}</strong> team at OMS Enterprise Global. Your candidate account and initial password have been registered successfully.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">🪪 Your Official Corporate Login Identity</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Assigned Employee ID:</strong> <span style="font-family: monospace; color: #dc2626; font-size: 15px; font-weight: bold;">${employeeId}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Company Email:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${email}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Department:</strong> ${department}</p>
        </div>

        <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #c2410c;">🔐 CRITICAL PASSWORD SECURITY & RESET GUIDELINES</h3>
          <p style="font-size: 12px; color: #7c2d12; line-height: 1.5; margin: 0 0 10px 0;">
            If you ever forget your password or want to update it in the future, you can use our instant Email Reset Service:
          </p>
          <ul style="font-size: 12px; color: #9a3412; margin: 0; padding-left: 20px; line-height: 1.7;">
            <li><strong>Forgot Password Service:</strong> Visit <a href="http://localhost:3000/auth/forget-password">http://localhost:3000/auth/forget-password</a> anytime.</li>
            <li><strong>Instant Reset Code:</strong> Enter your email to receive a new password or reset OTP directly in your mail.</li>
            <li><strong>Minimum 12+ Chars:</strong> Always maintain a strong password with UPPERCASE, lowercase, numbers, and special symbols (@#$%!).</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000/auth/login" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 4px; display: inline-block;">
            👉 Access OMS Employee Login Desk
          </a>
        </div>
      </div>
    </div>
  `;

  const record: OnboardingEmailRecord = {
    id,
    recipientName: name,
    recipientEmail: email,
    employeeId,
    department,
    sentAt,
    emailSubject: subject,
    emailBodyHtml,
  };

  // Trigger Real SMTP Dispatch API
  if (typeof window !== "undefined") {
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "WELCOME",
        to: email,
        name,
        employeeId,
        subject,
        customHtml: emailBodyHtml,
      }),
    }).catch((err) => console.warn("SMTP API dispatch fallback:", err));

    try {
      const existing = localStorage.getItem("oms_onboarding_emails");
      const list: OnboardingEmailRecord[] = existing ? JSON.parse(existing) : [];
      localStorage.setItem("oms_onboarding_emails", JSON.stringify([record, ...list]));
    } catch (e) {
      console.warn("Failed to store onboarding email:", e);
    }
  }

  return record;
}

export function generatePasswordResetEmail(
  emailOrEmpId: string,
  tempPasswordOrOtp: string
): OnboardingEmailRecord {
  const sentAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const id = `RST-${Math.floor(100000 + Math.random() * 900000)}`;

  const recipientEmail = emailOrEmpId.includes("@") ? emailOrEmpId : `${emailOrEmpId}@oms.com`;
  const subject = `🔑 Password Reset & New Security Access Credentials for ${emailOrEmpId}`;

  const emailBodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
      <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">🔑 EMPLOYEE PASSWORD RESET SERVICE</h1>
        <p style="margin-top: 6px; font-size: 12px; color: #f87171;">OMS Enterprise Security Center • DLF Cyber City, Gurugram</p>
      </div>

      <div style="padding: 20px 0;">
        <h2 style="color: #0f172a; font-size: 16px;">Password Reset Request Verified</h2>
        <p style="font-size: 13px; color: #334155; line-height: 1.6;">
          We received a request to reset your OMS Employee Account password for <strong>${emailOrEmpId}</strong>.
        </p>

        <div style="background-color: #f1f5f9; border: 2px dashed #0f172a; padding: 18px; margin: 20px 0; text-align: center;">
          <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 6px;">
            Your New Account Password / Reset OTP Code:
          </span>
          <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px;">
            ${tempPasswordOrOtp}
          </span>
          <p style="font-size: 11px; color: #475569; margin-top: 8px;">
            Use this password immediately to sign in to your Employee Portal.
          </p>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #93c5fd; padding: 14px; margin: 20px 0; font-size: 12px; color: #1e3a8a;">
          <strong>💡 Security Tip:</strong> After signing in, you can update this password anytime in your Profile Settings or Password Manager.
        </div>

        <div style="text-align: center; margin: 26px 0;">
          <a href="http://localhost:3000/auth/login" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 4px; display: inline-block;">
            👉 Go to Employee Sign-In Desk
          </a>
        </div>
      </div>
    </div>
  `;

  const record: OnboardingEmailRecord = {
    id,
    recipientName: emailOrEmpId,
    recipientEmail,
    employeeId: emailOrEmpId.includes("@") ? "EMP-USER" : emailOrEmpId,
    department: "Security Management",
    sentAt,
    emailSubject: subject,
    emailBodyHtml,
  };

  // Trigger Real SMTP Dispatch API
  if (typeof window !== "undefined") {
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PASSWORD_RESET",
        to: recipientEmail,
        password: tempPasswordOrOtp,
        subject,
        customHtml: emailBodyHtml,
      }),
    }).catch((err) => console.warn("SMTP API password reset fallback:", err));
  }

  return record;
}

export function saveEmployeeUserPassword(emailOrEmpId: string, newPassword: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = `oms_password_${emailOrEmpId.toLowerCase().trim()}`;
    localStorage.setItem(key, newPassword);
  } catch (e) {
    console.warn("Failed to store password:", e);
  }
}
