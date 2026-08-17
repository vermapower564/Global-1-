import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/authService";
import { sendSmtpEmail } from "@/lib/smtpTransporter";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.email || body.employeeId || body.loginIdentity || body.username || "";
    const inputPassword = body.password || "";

    if (!identityInput || !inputPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid ID/email or password." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();

    // 1. Query MySQL User Table via Prisma (Find Account by Email or Employee ID)
    const { prisma } = await import("@/lib/prisma");
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanLower } },
          { employeeId: { equals: cleanIdentity } },
          { employeeId: { equals: cleanIdentity.toUpperCase() } },
        ],
      },
      include: { department: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Invalid ID/email or password." },
        { status: 401 }
      );
    }

    // 2. Perform Strict Bcrypt Password Verification Against Stored Hash
    const passwordMatches = await comparePassword(inputPassword, dbUser.password);
    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, error: "Invalid ID/email or password." },
        { status: 401 }
      );
    }

    // 3. Verify Account Active Status
    if (!dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: "Account deactivated: Please contact HR administrator." },
        { status: 403 }
      );
    }

    // 4. Automatic Server-Side Role Detection from Database Record
    const userRoleUpper = (dbUser.role || "").toUpperCase();
    const isAdmin = ADMIN_ROLES.includes(userRoleUpper);

    // 5. Construct Authenticated User Payload
    const authenticatedUser = {
      id: dbUser.id,
      employeeId: dbUser.employeeId,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      department: dbUser.department?.name || "Operations",
    };

    // 6. Generate JWT Session Token
    const token = generateToken({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    // 7. Set Secure HTTP-Only Session Cookie
    const response = NextResponse.json({
      success: true,
      message: `✓ Welcome back, ${authenticatedUser.name}!`,
      token,
      user: authenticatedUser,
      isAdmin,
    });

    response.cookies.set("oms_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 Days
    });

    // Security Audit Log & Email Notification
    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    prisma.auditlog.create({
      data: {
        userId: dbUser.id,
        action: "EMPLOYEE_LOGIN",
        details: `Successful login for ${dbUser.name} (${dbUser.employeeId})`,
      },
    }).catch((err: any) => console.warn("Audit log error:", err));

    sendSmtpEmail({
      to: authenticatedUser.email,
      subject: `🔐 Security Alert: Successful Login to OMS Portal (${authenticatedUser.employeeId})`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2>Security Alert: New Sign-In Detected</h2>
          <p>Hello <strong>${authenticatedUser.name}</strong>,</p>
          <p>Your OMS account was successfully signed into at <strong>${timestampStr} (IST)</strong>.</p>
        </div>
      `,
    }).catch((e) => console.warn("SMTP email dispatch warning:", e));

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Invalid ID/email or password." },
      { status: 500 }
    );
  }
}
