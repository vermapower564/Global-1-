import { NextRequest, NextResponse } from "next/server";
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

    // 3. Generate Secure 6-Digit Verification OTP & Reset Token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes Expiration

    // 4. Store Token in Database otptoken table
    const tokenId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await queryDb(
      `INSERT INTO otptoken (id, email, otpHash, expiresAt, attempts, createdAt) VALUES (?, ?, ?, ?, 0, NOW())`,
      [tokenId, dbUser.email, otpCode, expiresAt]
    );

    // 5. Build Dynamic Password Reset Link
    const appBaseUrl = getAppBaseUrl(request);
    const resetLink = `${appBaseUrl}/auth/forgot-password?token=${encodeURIComponent(otpCode)}&email=${encodeURIComponent(dbUser.email)}&identity=${encodeURIComponent(dbUser.employeeId)}`;

    // 6. Dispatch Email via Real Nodemailer SMTP Transporter
    const emailResult = await sendPasswordResetEmail(dbUser.email, {
      name: dbUser.name,
      employeeId: dbUser.employeeId,
      email: dbUser.email,
      otpCode,
      resetLink,
      expiresInMinutes: 15,
    });

    if (!emailResult.success) {
      console.warn(`⚠️ Warning: Password reset email dispatch returned error: ${emailResult.error}`);
    }

    // Mask Email for UI Privacy
    const emailParts = dbUser.email.split("@");
    const maskedEmail = emailParts[0].slice(0, 3) + "***@" + emailParts[1];

    return NextResponse.json({
      success: true,
      message: "Password reset link and OTP sent to your registered email address.",
      email: dbUser.email,
      maskedEmail,
      employeeId: dbUser.employeeId,
      messageId: emailResult.messageId,
      emailDelivered: emailResult.success,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process forgot password request." },
      { status: 500 }
    );
  }
}