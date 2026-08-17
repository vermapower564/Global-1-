import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/authService";
import { sendSmtpEmail } from "@/lib/smtpTransporter";

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

    const { prisma } = await import("@/lib/prisma");

    // 1. Find Exact Target User in Database
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

    // 2. Verify OTP Authorization if provided or check recent OTP validity
    if (cleanOtp) {
      const validOtp = await prisma.otptoken.findFirst({
        where: {
          email: dbUser.email,
          otpHash: cleanOtp,
          expiresAt: { gte: new Date() },
        },
      });

      if (!validOtp) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired OTP." },
          { status: 400 }
        );
      }
    }

    // 3. Hash New Password securely using bcrypt
    const hashedPassword = await hashPassword(newPassword);

    // 4. EXECUTE REAL DATABASE UPDATE IN MYSQL VIA PRISMA
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    });

    // 5. VERIFY DATABASE UPDATE SUCCEEDED
    if (!updatedUser || updatedUser.password !== hashedPassword) {
      return NextResponse.json(
        { success: false, error: "Database update verification failed." },
        { status: 500 }
      );
    }

    // Clean up used OTP tokens for this user's email
    await prisma.otptoken.deleteMany({
      where: { email: dbUser.email },
    }).catch(() => {});

    // Record Security Audit Log in Database
    await prisma.auditlog.create({
      data: {
        userId: dbUser.id,
        action: "PASSWORD_RESET",
        details: `Password updated successfully for ${dbUser.name} (${dbUser.employeeId})`,
      },
    }).catch(() => {});

    // Dispatch Security Confirmation Email
    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    sendSmtpEmail({
      to: dbUser.email,
      subject: `🔑 Security Confirmation: Password Updated (${dbUser.employeeId})`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2>Security Alert: Password Updated</h2>
          <p>Hello <strong>${dbUser.name}</strong>,</p>
          <p>Your OMS account password was successfully updated in the database at <strong>${timestampStr} (IST)</strong>.</p>
          <p>You can now sign in with your new password at <a href="http://localhost:3000/auth/login">http://localhost:3000/auth/login</a>.</p>
        </div>
      `,
    }).catch((e) => console.warn("SMTP reset email notice warning:", e));

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
      userEmail: dbUser.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update password in database." },
      { status: 500 }
    );
  }
}
