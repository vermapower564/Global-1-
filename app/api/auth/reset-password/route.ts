import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/authService";
import { sendPasswordChangedEmail } from "@/lib/email/send";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.identityInput || body.email || body.employeeId || "";
    const otpCode = body.otpCode || body.otp || "";
    const newPassword = body.newPassword || "";

    if (!identityInput || !newPassword) {
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
    const cleanOtp = otpCode ? otpCode.trim() : "";

    // 1. Find Exact Target User in Database
    const userRows = await queryDb<any[]>(
      `SELECT id, employeeId, name, email, password FROM user WHERE email = ? OR employeeId = ? OR employeeId = ? LIMIT 1`,
      [cleanLower, cleanIdentity, cleanIdentity.toUpperCase()]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    const dbUser = userRows[0];

    // 2. Verify OTP Authorization if provided
    if (cleanOtp) {
      const otpRows = await queryDb<any[]>(
        `SELECT id FROM otptoken WHERE email = ? AND otpHash = ? AND expiresAt >= NOW() LIMIT 1`,
        [dbUser.email, cleanOtp]
      );

      if (!otpRows || otpRows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired verification code." },
          { status: 400 }
        );
      }
    }

    // 3. Hash New Password securely using bcrypt
    const hashedPassword = await hashPassword(newPassword);

    // 4. EXECUTE DATABASE UPDATE
    await queryDb(
      `UPDATE user SET password = ?, updatedAt = NOW() WHERE id = ?`,
      [hashedPassword, dbUser.id]
    );

    // Clean up used OTP tokens for this user's email
    await queryDb(`DELETE FROM otptoken WHERE email = ?`, [dbUser.email]).catch(() => {});

    // Record Security Audit Log in Database
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, timestamp) VALUES (?, ?, 'PASSWORD_RESET', ?, NOW())`,
      [auditId, dbUser.id, `Password updated successfully for ${dbUser.name} (${dbUser.employeeId})`]
    ).catch(() => {});

    // Dispatch Security Confirmation Email
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
    }).catch((e) => console.warn("SMTP reset email notice warning:", e));

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
      userEmail: dbUser.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update password in database." },
      { status: 500 }
    );
  }
}