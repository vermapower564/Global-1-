import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.identityInput || body.email || body.employeeId || "";
    const otpCode = body.otpCode || body.otp || "";

    if (!identityInput.trim() || !otpCode.trim()) {
      return NextResponse.json(
        { success: false, error: "Email/Employee ID and OTP code are required." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();
    const cleanOtp = otpCode.trim();

    const { prisma } = await import("@/lib/prisma");

    // 1. Find Account
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

    // 2. Query OTP record in database otptoken table
    const validOtp = await prisma.otptoken.findFirst({
      where: {
        email: dbUser.email,
        otpHash: cleanOtp,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validOtp) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
      resetVerified: true,
      userEmail: dbUser.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
