import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/email/smtp";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.identityInput || body.email || body.employeeId || "";

    if (!identityInput.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your registered Gmail or Employee ID." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();

    // If an email address was entered, validate @gmail.com strictly
    if (cleanIdentity.includes("@")) {
      const emailValidation = validateAndNormalizeGmail(cleanIdentity);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { success: false, error: emailValidation.error || "Only Gmail addresses ending with @gmail.com are allowed." },
          { status: 400 }
        );
      }
    }

    // 1. Find Account in MySQL User Table
    const userRows = await queryDb<any[]>(
      `SELECT id, employeeId, name, email FROM user WHERE email = ? OR employeeId = ? OR employeeId = ? LIMIT 1`,
      [cleanLower, cleanIdentity, cleanIdentity.toUpperCase()]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found for the entered ID or Gmail address." },
        { status: 404 }
      );
    }

    const dbUser = userRows[0];

    // 2. Validate registered DB email address is a valid @gmail.com
    const dbEmailCheck = validateAndNormalizeGmail(dbUser.email);
    if (!dbEmailCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Account recovery requires a valid @gmail.com address. Please contact administrator." },
        { status: 400 }
      );
    }

    // 3. Invalidate any existing active OTP tokens for this email
    await queryDb(`DELETE FROM otptoken WHERE email = ?`, [dbUser.email]).catch(() => {});

    // 4. Generate Cryptographically Secure 6-Digit Verification OTP (No Math.random)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes Expiration

    // 5. Store Hashed Token in Database otptoken table (Never store plain OTP)
    const tokenId = `otp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    await queryDb(
      `INSERT INTO otptoken (id, email, otpHash, expiresAt, attempts, createdAt) VALUES (?, ?, ?, ?, 0, NOW())`,
      [tokenId, dbUser.email, otpHash, expiresAt]
    );

    // 6. Build Clean Reset Link (No OTP in URL parameters)
    const appBaseUrl = getAppBaseUrl(request);
    const resetLink = `${appBaseUrl}/auth/forgot-password?identity=${encodeURIComponent(dbUser.employeeId)}`;

    // 7. Dispatch Email via Real SMTP Transporter
    const emailResult = await sendPasswordResetEmail(dbUser.email, {
      name: dbUser.name,
      employeeId: dbUser.employeeId,
      email: dbUser.email,
      otpCode,
      resetLink,
      expiresInMinutes: 15,
    });

    if (!emailResult.success) {
      console.error(`❌ [Auth] Password reset email dispatch failed for ${dbUser.email}:`, emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Failed to dispatch password reset email via SMTP. Please verify mail server configuration.",
        },
        { status: 502 }
      );
    }

    // Mask Email for UI Privacy
    const emailParts = dbUser.email.split("@");
    const prefix = emailParts[0];
    const maskedPrefix = prefix.length <= 3 ? prefix[0] + "***" : prefix.slice(0, 3) + "***";
    const maskedEmail = `${maskedPrefix}@${emailParts[1]}`;

    return NextResponse.json({
      success: true,
      message: "Password reset OTP sent successfully to your registered Gmail address.",
      maskedEmail,
      employeeId: dbUser.employeeId,
    });
  } catch (error: any) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process forgot password request." },
      { status: 500 }
    );
  }
}