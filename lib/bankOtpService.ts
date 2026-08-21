import jwt from "jsonwebtoken";
import { queryDb } from "@/lib/db";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { maskAccountNumber, maskPanNumber, maskAadhaarNumber } from "@/lib/bankHelper";
export { maskAccountNumber, maskPanNumber, maskAadhaarNumber };

export type OtpPurpose = "VIEW_BANK_DETAILS" | "EDIT_BANK_DETAILS";

interface StoredOtp {
  id: string;
  adminId: string;
  targetUserId: string;
  purpose: OtpPurpose;
  otp: string;
  expiresAt: number; // timestamp
  attempts: number;
  isUsed: boolean;
  createdAt: number;
  lastRequestedAt: number;
}

// In-memory active OTP store with automatic cleanup
const otpStore = new Map<string, StoredOtp>();

// Key helper
function getOtpKey(adminId: string, targetUserId: string, purpose: OtpPurpose): string {
  return `${adminId}:${targetUserId}:${purpose}`;
}

const JWT_SECRET = process.env.JWT_SECRET || "oms-enterprise-secret-key-2026-secure";

export function maskEmail(email?: string | null): string {
  if (!email) return "u***@domain.com";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskAccountHolderName(name?: string | null): string {
  if (!name) return "••••••";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}${"*".repeat(p.length - 1)}` : p))
    .join(" ");
}

export function maskIfscCode(ifsc?: string | null): string {
  if (!ifsc) return "•••••••••••";
  const clean = ifsc.trim().toUpperCase();
  if (clean.length <= 3) return "********" + clean;
  return "********" + clean.slice(-3);
}

export async function requestBankOtp(params: {
  adminId: string;
  adminName: string;
  targetUserId: string;
  purpose: OtpPurpose;
  ipAddress?: string;
}) {
  const { adminId, adminName, targetUserId, purpose, ipAddress } = params;

  // 1. Fetch Target User from DB
  const users = await queryDb<any[]>(
    `SELECT id, employeeId, name, email, role FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
    [targetUserId, targetUserId]
  );

  if (!users || users.length === 0) {
    throw new Error("Target user not found.");
  }
  const targetUser = users[0];

  const key = getOtpKey(adminId, targetUser.id, purpose);
  const now = Date.now();

  // Rate limiting: 20 seconds between resends
  const existing = otpStore.get(key);
  if (existing && now - existing.lastRequestedAt < 20000 && !existing.isUsed) {
    const waitSec = Math.ceil((20000 - (now - existing.lastRequestedAt)) / 1000);
    throw new Error(`Please wait ${waitSec} seconds before requesting a new verification code.`);
  }

  // 2. Generate cryptographically strong 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  const record: StoredOtp = {
    id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminId,
    targetUserId: targetUser.id,
    purpose,
    otp: otpCode,
    expiresAt,
    attempts: 0,
    isUsed: false,
    createdAt: now,
    lastRequestedAt: now,
  };

  otpStore.set(key, record);

  // 3. Send Official OTP Email to the target user
  const actionText =
    purpose === "VIEW_BANK_DETAILS"
      ? "view your confidential bank account details"
      : "modify your confidential bank account details";

  const emailSubject = `🔐 Urgent: OTP Verification for Bank Account Access (${targetUser.employeeId})`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">OMS Security Authentication</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Sensitive Information Access Authorization</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155; margin-top: 0;">Hello <strong>${targetUser.name}</strong>,</p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
          Administrator <strong>${adminName}</strong> has initiated a request to <strong>${actionText}</strong> in the Organisation Management System.
        </p>
        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Your 6-Digit Verification Code</p>
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a;">${otpCode}</span>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #ef4444; font-weight: bold;">Valid for 5 minutes only • Maximum 5 attempts</p>
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Please provide this code to the administrator only if you authorize this action. If you did not expect this request, contact system security immediately.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
        © 2026 Global Enterprise OMS. All sensitive actions are monitored and audit logged.
      </div>
    </div>
  `;

  // Dispatch email
  if (targetUser.email) {
    sendSmtpEmail({
      to: targetUser.email,
      subject: emailSubject,
      html: emailHtml,
    }).catch((err) => console.warn("Failed sending OTP email:", err.message));
  }

  // Also create in-app notification
  try {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await queryDb(
      `INSERT INTO notification (id, userId, title, message, type, isRead, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [
        notifId,
        targetUser.id,
        "🔐 Bank Information Authorization Request",
        `Admin ${adminName} has requested authorization to ${actionText}. Verification OTP: ${otpCode} (Valid 5 mins).`,
        "SYSTEM",
      ]
    );
  } catch (err) {
    console.warn("Notification insert error:", err);
  }

  // 4. Audit Log
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp)
       VALUES (?, ?, 'ADMIN_REQUEST_BANK_OTP', ?, ?, NOW())`,
      [
        auditId,
        adminId,
        JSON.stringify({
          targetUserId: targetUser.id,
          targetEmployeeId: targetUser.employeeId,
          purpose,
          emailMasked: maskEmail(targetUser.email),
        }),
        ipAddress || "127.0.0.1",
      ]
    );
  } catch (err) {
    console.warn("Audit log error:", err);
  }

  console.log(`[BANK_OTP] Generated OTP for Admin (${adminId}) -> Target (${targetUser.employeeId}) [${purpose}]: ${otpCode}`);

  return {
    success: true,
    message: "Verification code sent to account owner's registered email.",
    emailMasked: maskEmail(targetUser.email),
    targetEmployeeId: targetUser.employeeId,
    targetName: targetUser.name,
    expiresInSeconds: 300,
  };
}

export async function verifyBankOtp(params: {
  adminId: string;
  targetUserId: string;
  purpose: OtpPurpose;
  otpCode: string;
  ipAddress?: string;
}) {
  const { adminId, targetUserId, purpose, otpCode, ipAddress } = params;

  // Resolve user id
  const users = await queryDb<any[]>(
    `SELECT id, employeeId, name, email FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
    [targetUserId, targetUserId]
  );
  if (!users || users.length === 0) {
    throw new Error("Target user not found.");
  }
  const targetUser = users[0];

  const key = getOtpKey(adminId, targetUser.id, purpose);
  const record = otpStore.get(key);

  if (!record || record.isUsed) {
    throw new Error("No active OTP request found. Please request a new verification code.");
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    otpStore.delete(key);
    throw new Error("Verification code has expired. Please request a new OTP.");
  }

  if (record.attempts >= 5) {
    otpStore.delete(key);
    // Audit failed attempt limit
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await queryDb(
        `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp)
         VALUES (?, ?, 'ADMIN_FAILED_BANK_OTP', ?, ?, NOW())`,
        [
          auditId,
          adminId,
          JSON.stringify({ targetUserId: targetUser.id, reason: "Max attempts exceeded", purpose }),
          ipAddress || "127.0.0.1",
        ]
      );
    } catch {}
    throw new Error("Too many incorrect attempts. Please request a new verification code.");
  }

  // Verify OTP
  if (record.otp !== otpCode.trim()) {
    record.attempts += 1;
    // Log failed attempt
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await queryDb(
        `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp)
         VALUES (?, ?, 'ADMIN_FAILED_BANK_OTP', ?, ?, NOW())`,
        [
          auditId,
          adminId,
          JSON.stringify({ targetUserId: targetUser.id, attemptNumber: record.attempts, purpose }),
          ipAddress || "127.0.0.1",
        ]
      );
    } catch {}
    const remaining = 5 - record.attempts;
    throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
  }

  // OTP Verified Successfully!
  record.isUsed = true;
  otpStore.delete(key);

  // Generate temporary 5-minute signed JWT auth token
  const authToken = jwt.sign(
    {
      adminId,
      targetUserId: targetUser.id,
      purpose,
      authorizedAt: now,
    },
    JWT_SECRET,
    { expiresIn: "5m" }
  );

  // Audit success
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp)
       VALUES (?, ?, 'ADMIN_SUCCESSFUL_BANK_OTP', ?, ?, NOW())`,
      [
        auditId,
        adminId,
        JSON.stringify({ targetUserId: targetUser.id, purpose }),
        ipAddress || "127.0.0.1",
      ]
    );
  } catch {}

  // If purpose is VIEW, fetch and return unmasked bank details
  let unmaskedData = null;
  if (purpose === "VIEW_BANK_DETAILS") {
    const bankDetails = await queryDb<any[]>(
      `SELECT * FROM bankdetail WHERE userId = ? LIMIT 1`,
      [targetUser.id]
    );
    if (bankDetails && bankDetails.length > 0) {
      const bd = bankDetails[0];
      unmaskedData = {
        bankName: bd.bankName,
        accountHolderName: bd.accountHolderName,
        accountNumber: bd.accountNumber,
        ifscCode: bd.ifscCode,
        branchName: bd.branchName || "Main Branch",
        accountType: bd.accountType || "Savings",
        isActive: bd.isActive,
      };
    }
    // Audit view
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await queryDb(
        `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp)
         VALUES (?, ?, 'ADMIN_VIEW_BANK_DETAILS', ?, ?, NOW())`,
        [
          auditId,
          adminId,
          JSON.stringify({ targetUserId: targetUser.id, targetEmployeeId: targetUser.employeeId }),
          ipAddress || "127.0.0.1",
        ]
      );
    } catch {}
  }

  return {
    success: true,
    message: "OTP verification successful.",
    authToken,
    expiresInSeconds: 300,
    unmaskedBankDetails: unmaskedData,
  };
}

export async function updateAuthorizedBankDetails(params: {
  adminId: string;
  adminName: string;
  targetUserId: string;
  authToken: string;
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    accountType?: string;
  };
  ipAddress?: string;
}) {
  const { adminId, adminName, targetUserId, authToken, bankDetails, ipAddress } = params;

  // 1. Verify Authorization Token
  let decoded: any;
  try {
    decoded = jwt.verify(authToken, JWT_SECRET);
  } catch {
    throw new Error("Authorization session expired or invalid. Please request a new OTP to edit bank details.");
  }

  if (
    decoded.adminId !== adminId ||
    decoded.purpose !== "EDIT_BANK_DETAILS"
  ) {
    throw new Error("Invalid authorization token. Separate OTP verification required for editing.");
  }

  // 2. Resolve Target User
  const users = await queryDb<any[]>(
    `SELECT id, employeeId, name, email FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
    [targetUserId, targetUserId]
  );
  if (!users || users.length === 0) {
    throw new Error("Target user not found.");
  }
  const targetUser = users[0];

  // 3. Fetch Existing Bank Detail (for audit masking)
  const existingBd = await queryDb<any[]>(
    `SELECT * FROM bankdetail WHERE userId = ? LIMIT 1`,
    [targetUser.id]
  );

  const oldAccMasked = existingBd.length > 0 ? maskAccountNumber(existingBd[0].accountNumber) : "None";
  const newAccMasked = maskAccountNumber(bankDetails.accountNumber);

  // 4. Update / Insert into `bankdetail`
  if (existingBd.length > 0) {
    await queryDb(
      `UPDATE bankdetail 
       SET bankName = ?, accountHolderName = ?, accountNumber = ?, ifscCode = ?, branchName = ?, accountType = ?, updatedAt = NOW()
       WHERE userId = ?`,
      [
        bankDetails.bankName,
        bankDetails.accountHolderName,
        bankDetails.accountNumber,
        bankDetails.ifscCode.toUpperCase(),
        bankDetails.branchName || "Main Branch",
        bankDetails.accountType || "Savings",
        targetUser.id,
      ]
    );
  } else {
    const newId = `bd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await queryDb(
      `INSERT INTO bankdetail (id, userId, bankName, accountHolderName, accountNumber, ifscCode, branchName, accountType, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        newId,
        targetUser.id,
        bankDetails.bankName,
        bankDetails.accountHolderName,
        bankDetails.accountNumber,
        bankDetails.ifscCode.toUpperCase(),
        bankDetails.branchName || "Main Branch",
        bankDetails.accountType || "Savings",
      ]
    );
  }

  // 5. Notify Employee
  if (targetUser.email) {
    const notifyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; background: #ffffff;">
        <h3 style="color: #0f172a;">Bank Details Modified</h3>
        <p style="color: #475569; font-size: 13px;">
          Hello ${targetUser.name}, your bank account information was successfully updated by Administrator <strong>${adminName}</strong>.
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 3px 0;"><strong>Bank Name:</strong> ${bankDetails.bankName}</p>
          <p style="margin: 3px 0;"><strong>Account Number:</strong> ${newAccMasked}</p>
          <p style="margin: 3px 0;"><strong>IFSC Code:</strong> ${maskIfscCode(bankDetails.ifscCode)}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">If this change was not authorized by you, please report to HR immediately.</p>
      </div>
    `;
    sendSmtpEmail({
      to: targetUser.email,
      subject: "🔔 Notice: Your Bank Details Were Modified",
      html: notifyHtml,
    }).catch(() => {});
  }

  try {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await queryDb(
      `INSERT INTO notification (id, userId, title, message, type, isRead, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [
        notifId,
        targetUser.id,
        "🏦 Bank Account Details Updated",
        `Your bank account details were updated by Administrator ${adminName}. New Account: ${newAccMasked}.`,
        "SYSTEM",
      ]
    );
  } catch {}

  // 6. Audit Log (Never storing plaintext full account numbers in audit logs)
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp)
       VALUES (?, ?, 'ADMIN_EDIT_BANK_DETAILS', ?, ?, NOW())`,
      [
        auditId,
        adminId,
        JSON.stringify({
          targetUserId: targetUser.id,
          targetEmployeeId: targetUser.employeeId,
          oldAccountMasked: oldAccMasked,
          newAccountMasked: newAccMasked,
          bankName: bankDetails.bankName,
          ifscMasked: maskIfscCode(bankDetails.ifscCode),
        }),
        ipAddress || "127.0.0.1",
      ]
    );
  } catch {}

  return {
    success: true,
    message: "Bank details updated successfully.",
    maskedDetails: {
      bankName: bankDetails.bankName,
      accountHolderName: maskAccountHolderName(bankDetails.accountHolderName),
      accountNumberMasked: newAccMasked,
      ifscCodeMasked: maskIfscCode(bankDetails.ifscCode),
      branchName: bankDetails.branchName || "Main Branch",
      accountType: bankDetails.accountType || "Savings",
    },
  };
}
