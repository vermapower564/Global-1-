import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.identityInput || body.email || body.employeeId || "";
    const otpCode = body.otpCode || body.otp || "";

    if (!identityInput.trim() || !otpCode.trim()) {
      return NextResponse.json(
        { success: false, error: "Email/Employee ID and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();
    const cleanOtp = otpCode.trim();

    // 1. Find User in database
    const userRows = await queryDb<any[]>(
      `SELECT id, employeeId, name, email FROM user WHERE email = ? OR employeeId = ? OR employeeId = ? LIMIT 1`,
      [cleanLower, cleanIdentity, cleanIdentity.toUpperCase()]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found for the entered ID or email." },
        { status: 404 }
      );
    }

    const dbUser = userRows[0];

    // 2. Fetch Active OTP Record for this User
    const otpRows = await queryDb<any[]>(
      `SELECT id, email, otpHash, expiresAt, attempts FROM otptoken WHERE email = ? AND expiresAt >= NOW() ORDER BY createdAt DESC LIMIT 1`,
      [dbUser.email]
    );

    if (!otpRows || otpRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP. Please request a new verification code." },
        { status: 400 }
      );
    }

    const otpRecord = otpRows[0];

    // 3. Check Attempt Limit
    if (Number(otpRecord.attempts || 0) >= MAX_FAILED_ATTEMPTS) {
      // Invalidate the compromised token
      await queryDb(`DELETE FROM otptoken WHERE id = ?`, [otpRecord.id]);
      return NextResponse.json(
        {
          success: false,
          error: "Maximum failed attempts exceeded. For security, this OTP is now invalid. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 4. Verify Entered OTP against stored Hash (SHA-256)
    const enteredOtpHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");

    if (enteredOtpHash !== otpRecord.otpHash) {
      // Increment failed attempt counter
      const newAttempts = Number(otpRecord.attempts || 0) + 1;
      await queryDb(`UPDATE otptoken SET attempts = ? WHERE id = ?`, [newAttempts, otpRecord.id]);

      const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new OTP."}`,
        },
        { status: 400 }
      );
    }

    // 5. Success: Issue a cryptographically secure, short-lived Reset Authorization Token
    const resetAuthToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetAuthToken).digest("hex");
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes

    // Store the reset authorization token hash in place of OTP
    await queryDb(
      `UPDATE otptoken SET otpHash = ?, attempts = 0, expiresAt = ? WHERE id = ?`,
      [resetTokenHash, resetExpiry, otpRecord.id]
    );

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. You may now set your new password.",
      resetVerified: true,
      resetToken: resetAuthToken,
      userEmail: dbUser.email,
    });
  } catch (error: any) {
    console.error("POST /api/auth/verify-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}