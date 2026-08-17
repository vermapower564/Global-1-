import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendSmtpEmail } from "@/lib/smtpTransporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailOrIdentity = (body.email || body.mobile || body.identity || "").trim();

    if (!emailOrIdentity) {
      return NextResponse.json(
        { success: false, error: "Please enter your registered Email address or Mobile number." },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");

    // Find User in MySQL
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: emailOrIdentity.toLowerCase() } },
          { phone: { contains: emailOrIdentity } },
          { employeeId: { equals: emailOrIdentity.toUpperCase() } },
        ],
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Account not found: No registered employee matches this identity." },
        { status: 404 }
      );
    }

    if (!dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is inactive. Please contact your HR Administrator." },
        { status: 403 }
      );
    }

    // Generate 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store in MySQL otptoken table
    await prisma.otptoken.create({
      data: {
        email: dbUser.email,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Security Audit Event
    await prisma.auditlog.create({
      data: {
        userId: dbUser.id,
        action: "OTP_GENERATED",
        details: `Password reset OTP generated for ${dbUser.name} (${dbUser.employeeId})`,
      },
    });

    // Send OTP via Nodemailer SMTP
    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    try {
      await sendSmtpEmail({
        to: dbUser.email,
        subject: `🔑 Security Code: Your OMS Password Reset OTP (${rawOtp})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; border: 2px solid #0f172a; padding: 24px; border-radius: 12px;">
            <h2 style="color: #2563eb;">OMS Password Reset Verification</h2>
            <p>Dear <strong>${dbUser.name}</strong> (${dbUser.employeeId}),</p>
            <p>Your one-time verification OTP for password reset is:</p>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin: 16px 0;">
              ${rawOtp}
            </div>
            <p style="font-size: 12px; color: #64748b;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; pt: 12px;">Nodemailer Transport • OMS Security (${timestampStr})</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn("SMTP OTP email dispatch warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `✓ OTP security code generated and sent to ${dbUser.email}!`,
      email: dbUser.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate OTP." },
      { status: 500 }
    );
  }
}
