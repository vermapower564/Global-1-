import { NextRequest, NextResponse } from "next/server";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";

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

    const { prisma } = await import("@/lib/prisma");

    // 1. Find Account in MySQL User Table
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanLower } },
          { employeeId: { equals: cleanIdentity } },
          { employeeId: { equals: cleanIdentity.toUpperCase() } },
        ],
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Account not found for the entered ID or Gmail address." },
        { status: 404 }
      );
    }

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
    await prisma.otptoken.create({
      data: {
        email: dbUser.email,
        otpHash: otpCode,
        expiresAt,
      },
    });

    // 5. Build Dynamic Password Reset Link
    const { getAppBaseUrl } = await import("@/lib/smtpTransporter");
    const appBaseUrl = getAppBaseUrl(request);
    const resetLink = `${appBaseUrl}/auth/forgot-password?token=${encodeURIComponent(otpCode)}&email=${encodeURIComponent(dbUser.email)}&identity=${encodeURIComponent(dbUser.employeeId)}`;

    // 6. Dispatch Email via Real Nodemailer SMTP Transporter to verified email
    const emailResult = await sendSmtpEmail({
      to: dbUser.email,
      subject: `🔐 OMS Enterprise Password Reset: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 2px solid #0f172a; padding: 28px; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
          <div style="background-color: #0f172a; padding: 18px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">OMS ENTERPRISE SECURITY</h2>
            <p style="margin-top: 4px; font-size: 12px; color: #93c5fd;">Official Password Recovery Service</p>
          </div>

          <h3 style="color: #0f172a; font-size: 16px;">Dear ${dbUser.name},</h3>
          <p style="font-size: 13px; color: #334155; line-height: 1.6;">
            A password reset request was initiated for your OMS Enterprise account (<strong>${dbUser.employeeId}</strong>).
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              🔒 Reset Your Password Now →
            </a>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">Alternatively, use this 6-digit verification code on the reset page:</p>
            <div style="font-size: 26px; font-weight: 800; letter-spacing: 6px; color: #1e40af; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">
              ⏱️ This code & link will expire in 15 minutes. Single-use only.
            </p>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            Or copy and paste this link in your browser:<br/>
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
          </p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            If you did not request a password reset, please ignore this email or notify IT Security immediately.
          </p>
        </div>
      `,
    });

    // Mask Email for UI Privacy
    const emailParts = dbUser.email.split("@");
    const maskedEmail = emailParts[0].slice(0, 3) + "***@" + emailParts[1];

    return NextResponse.json({
      success: true,
      message: "Password reset link and OTP sent successfully to your registered email address.",
      email: dbUser.email,
      maskedEmail,
      employeeId: dbUser.employeeId,
      smtpMode: emailResult.mode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process forgot password request." },
      { status: 500 }
    );
  }
}
