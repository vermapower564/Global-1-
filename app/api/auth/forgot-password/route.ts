import { NextRequest, NextResponse } from "next/server";
import { sendSmtpEmail } from "@/lib/smtpTransporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.identityInput || body.email || body.employeeId || "";

    if (!identityInput.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your registered Email or Employee ID." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();

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
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    // 2. Generate Secure 6-Digit OTP Code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes Expiration

    // 3. Store OTP in Database otptoken table
    await prisma.otptoken.create({
      data: {
        email: dbUser.email,
        otpHash: otpCode,
        expiresAt,
      },
    });

    // 4. Dispatch Email via Nodemailer SMTP Transporter
    sendSmtpEmail({
      to: dbUser.email,
      subject: `🔐 OMS Password Reset OTP: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 12px;">Password Reset Verification OTP</h2>
          <p>Dear <strong>${dbUser.name}</strong> (${dbUser.employeeId}),</p>
          <p>You requested to reset your OMS Enterprise account password. Use the verification code below:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #2563eb; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="font-size: 12px; color: #64748b;">This OTP code will expire in 10 minutes. If you did not request this, please contact your administrator immediately.</p>
        </div>
      `,
    }).catch((e) => console.warn("SMTP OTP email send warning:", e));

    // Mask Email for UI Privacy
    const emailParts = dbUser.email.split("@");
    const maskedEmail = emailParts[0].slice(0, 3) + "***@" + emailParts[1];

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your registered email address.",
      email: dbUser.email,
      maskedEmail,
      employeeId: dbUser.employeeId,
      demoOtp: otpCode, // Provided for instant testing
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process forgot password request." },
      { status: 500 }
    );
  }
}
