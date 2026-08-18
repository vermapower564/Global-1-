import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/authService";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityInput =
      body.identity || body.email || body.employeeId || body.loginIdentity || body.username || "";
    const inputPassword = body.password || "";

    // 1. Validate required inputs
    if (!identityInput || !identityInput.toString().trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your Email or Employee ID." },
        { status: 400 }
      );
    }

    if (!inputPassword || !inputPassword.toString().trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your password." },
        { status: 400 }
      );
    }

    // 2. Normalize inputs
    const cleanIdentity = identityInput.toString().trim();
    const cleanLower = cleanIdentity.toLowerCase();
    const cleanUpper = cleanIdentity.toUpperCase();

    // 3. Query Prisma MySQL User Model (Search by Email OR Employee ID)
    let dbUser = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanLower } },
            { employeeId: { equals: cleanIdentity } },
            { employeeId: { equals: cleanUpper } },
            { employeeId: { equals: cleanLower } },
          ],
        },
        include: { department: true },
      });
    } catch (dbError: any) {
      console.error("Database connection error during login:", dbError?.message || dbError);
      return NextResponse.json(
        { success: false, error: "Unable to connect to the authentication service. Please try again." },
        { status: 500 }
      );
    }

    // 4. Verify Account Existence (Generic error to prevent user enumeration)
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email/employee ID or password" },
        { status: 401 }
      );
    }

    // 5. Verify Password Hash using Bcrypt
    const passwordMatches = await comparePassword(inputPassword, dbUser.password);
    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, error: "Invalid email/employee ID or password" },
        { status: 401 }
      );
    }

    // 6. Verify Active Account Status
    if (!dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: "Account deactivated: Please contact HR administrator." },
        { status: 403 }
      );
    }

    // 7. Automatic Server-Side Role Detection
    const userRole = (dbUser.role || "").toUpperCase();
    const isAdmin = ADMIN_ROLES.includes(userRole);
    const redirectTo = isAdmin ? "/admin" : "/employee";

    // 8. Construct Safe Authenticated User Object (Never expose password hash)
    const authenticatedUser = {
      id: dbUser.id,
      employeeId: dbUser.employeeId,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      department: dbUser.department?.name || "Operations",
    };

    // 9. Generate JWT Session Token
    const token = generateToken({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    // 10. Construct Response & Set HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      message: `✓ Welcome back, ${authenticatedUser.name}!`,
      token,
      user: authenticatedUser,
      redirectTo,
      isAdmin,
    });

    response.cookies.set("oms_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 Days
    });

    // Async Audit Logging (non-blocking)
    prisma.auditlog
      .create({
        data: {
          userId: dbUser.id,
          action: "USER_LOGIN",
          details: `User ${dbUser.name} (${dbUser.email} / ${dbUser.employeeId}) logged in successfully as ${dbUser.role}`,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      })
      .catch(() => {});

    return response;
  } catch (error: any) {
    console.error("Login processing error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to connect to the authentication service. Please try again." },
      { status: 500 }
    );
  }
}
