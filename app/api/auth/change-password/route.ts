import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { comparePassword, hashPassword } from "@/lib/authService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Authenticate user session
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New password and confirm password do not match." },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const dbUser = await prisma.user.findUnique({ where: { id: authResult.user.id } });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await comparePassword(currentPassword, dbUser.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect password: Current password does not match." },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Save hash to MySQL
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: newHash },
    });

    await logAuditEvent(
      dbUser.id,
      "PASSWORD_CHANGE",
      `Self-service password change by ${dbUser.name} (${dbUser.employeeId})`
    );

    return NextResponse.json({
      success: true,
      message: "✓ Account password changed & Bcrypt hashed in MySQL successfully!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to change password." },
      { status: 500 }
    );
  }
}
