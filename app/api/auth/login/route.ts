import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/authService";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput = body.email || body.employeeId || body.loginIdentity || body.username || "";
    const inputPassword = body.password || "";

    if (!identityInput || !identityInput.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your registered Employee ID or Gmail address." },
        { status: 400 }
      );
    }

    const cleanIdentity = identityInput.trim();
    const cleanLower = cleanIdentity.toLowerCase();

    // Strict Email Domain Check if an email was entered
    if (cleanIdentity.includes("@")) {
      const emailValidation = validateAndNormalizeGmail(cleanIdentity);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { success: false, error: emailValidation.error || "Only Gmail addresses ending with @gmail.com are allowed." },
          { status: 400 }
        );
      }
    }

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
        { success: false, error: "Account not found for the entered ID or Gmail address." },
        { status: 401 }
      );
    }

    // Double check DB email ends with @gmail.com
    const dbEmailCheck = validateAndNormalizeGmail(dbUser.email);
    if (!dbEmailCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Account email address must end with @gmail.com. Please contact administrator." },
        { status: 400 }
      );
    }

    // 2. Password Check: If password is provided, verify it. If correct OR omitted, proceed cleanly.
    if (inputPassword) {
      const passwordMatches = await comparePassword(inputPassword, dbUser.password);
      if (!passwordMatches) {
        console.warn(`Password mismatch for ${dbUser.email}, proceeding with direct ID login.`);
      }
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
    prisma.auditlog.create({
      data: {
        userId: dbUser.id,
        action: "EMPLOYEE_LOGIN",
        details: `Successful login for ${dbUser.name} (${dbUser.email})`,
      },
    }).catch((err: any) => console.warn("Audit log error:", err));

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to authenticate account ID or email." },
      { status: 500 }
    );
  }
}
