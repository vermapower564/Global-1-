import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/authService";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

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

    // 3. Query TiDB Database for User (Search by Email OR Employee ID)
    let dbUser: any = null;

    try {
      const rows: any = await queryDb(
        `SELECT u.*, d.name AS departmentName 
         FROM user u 
         LEFT JOIN department d ON u.departmentId = d.id 
         WHERE LOWER(u.email) = ? OR u.employeeId = ? OR u.employeeId = ? OR u.employeeId = ? OR u.id = ?
         LIMIT 1`,
        [cleanLower, cleanIdentity, cleanUpper, cleanLower, cleanIdentity]
      );

      if (rows && rows.length > 0) {
        dbUser = {
          ...rows[0],
          department: rows[0].departmentName ? { name: rows[0].departmentName } : null,
        };
      }
    } catch (dbError: any) {
      console.warn("TiDB login query error, trying Prisma fallback:", dbError?.message);
      try {
        const { prisma } = await import("@/lib/prisma");
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
      } catch (prismaError: any) {
        console.error("Prisma fallback error:", prismaError?.message);
      }
    }

    // 4. Verify Account Existence
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

    // 8. Construct Safe Authenticated User Object
    const authenticatedUser = {
      id: dbUser.id,
      employeeId: dbUser.employeeId,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      department: dbUser.department?.name || dbUser.departmentName || "Operations",
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

    // Async Audit Logging (non-blocking) on TiDB
    queryDb(
      "INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
      [
        `AUD-${Date.now()}`,
        dbUser.id,
        "USER_LOGIN",
        `User ${dbUser.name} (${dbUser.email} / ${dbUser.employeeId}) logged in successfully as ${dbUser.role} on TiDB Cloud`,
        request.headers.get("x-forwarded-for") || "127.0.0.1",
      ]
    ).catch(() => {});

    return response;
  } catch (error: any) {
    console.error("Login processing error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to process login. Please try again." },
      { status: 500 }
    );
  }
}
