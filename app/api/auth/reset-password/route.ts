import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hashPassword } from "@/lib/authService";
import { sendPasswordChangedEmail } from "@/lib/email/send";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.identityInput || body.email || body.employeeId || "";
    const resetToken = body.resetToken || "";
    const otpCode = body.otpCode || body.otp || "";
    const newPassword = body.newPassword || "";

    if (!identityInput.trim() || !newPassword.trim()) {
      return NextResponse.json(
        { success: false, error: "Employee Email/ID and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();

    // 1. Find User in Database
    const userRows = await queryDb<any[]>(
      `SELECT id, employeeId, name, email FROM user WHERE email = ? OR employeeId = ? OR employeeId = ? LIMIT 1`,
      [cleanLower, cleanIdentity, cleanIdentity.toUpperCase()]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    const dbUser = userRows[0];

    // 2. Validate Server-Side Reset Authorization
    // Check either the reset authorization token or direct OTP hash
    let authorized = false;

    if (resetToken && resetToken.trim()) {
      const tokenHash = crypto.createHash("sha256").update(resetToken.trim()).digest("hex");
      const validTokenRows = await queryDb<any[]>(
        `SELECT id FROM otptoken WHERE email = ? AND otpHash = ? AND expiresAt >= NOW() LIMIT 1`,
        [dbUser.email, tokenHash]
      );
      if (validTokenRows && validTokenRows.length > 0) {
        authorized = true;
      }
    }

    if (!authorized && otpCode && otpCode.trim()) {
      const otpHash = crypto.createHash("sha256").update(otpCode.trim()).digest("hex");
      const validOtpRows = await queryDb<any[]>(
        `SELECT id FROM otptoken WHERE email = ? AND otpHash = ? AND expiresAt >= NOW() LIMIT 1`,
        [dbUser.email, otpHash]
      );
      if (validOtpRows && validOtpRows.length > 0) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired password reset session. Please verify OTP again." },
        { status: 403 }
      );
    }

    // 3. Hash New Password securely using bcrypt
    const hashedPassword = await hashPassword(newPassword);

    // 4. Update Password in Database
    await queryDb(
      `UPDATE user SET password = ?, updatedAt = NOW() WHERE id = ?`,
      [hashedPassword, dbUser.id]
    );

    // 5. Invalidate All OTP and Reset Tokens for this User
    await queryDb(`DELETE FROM otptoken WHERE email = ?`, [dbUser.email]).catch(() => {});

    // 6. Record Audit Log in Database
    const auditId = `aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, timestamp) VALUES (?, ?, 'PASSWORD_RESET', ?, NOW())`,
      [auditId, dbUser.id, `Password reset completed successfully for ${dbUser.name} (${dbUser.employeeId})`]
    ).catch(() => {});

    // 7. Dispatch Security Confirmation Email via SMTP
    const timestampStr = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " (IST)";

    sendPasswordChangedEmail(dbUser.email, {
      name: dbUser.name,
      employeeId: dbUser.employeeId,
      email: dbUser.email,
      timestamp: timestampStr,
    }).catch((e) => console.warn("Password changed email dispatch warning:", e));

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
      userEmail: dbUser.email,
    });
  } catch (error: any) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update password in database." },
      { status: 500 }
    );
  }
}