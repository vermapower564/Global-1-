import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/authService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email address and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");

    // Find active OTP record for email
    const otpRecord = await prisma.otptoken.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "No active OTP request found for this email." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return NextResponse.json(
        { success: false, error: "OTP expired: Please request a new verification code." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: "Too many attempts: Maximum verification limit exceeded. Please request a new OTP." },
        { status: 429 }
      );
    }

    // Compare OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      await prisma.otptoken.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      return NextResponse.json(
        { success: false, error: `Invalid OTP code. (${4 - otpRecord.attempts} attempts remaining)` },
        { status: 400 }
      );
    }

    // Find User
    const dbUser = await prisma.user.findFirst({ where: { email } });
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    // Generate short-lived reset token (15 mins)
    const resetToken = generateToken({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    });

    // Delete used OTP
    await prisma.otptoken.delete({ where: { id: otpRecord.id } });

    await prisma.auditlog.create({
      data: {
        userId: dbUser.id,
        action: "OTP_VERIFIED",
        details: `OTP verified for password reset by ${dbUser.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "✓ OTP verified successfully! You may now enter your new password.",
      resetToken,
      userId: dbUser.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
