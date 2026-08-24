import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/authService";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR", "ADMIN"];

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

    // 3. Query Database for User (Search by Email OR Employee ID)
    let dbUser: any = null;
    let dbErrorOccurred = false;

    try {
      const { prisma } = await import("@/lib/prisma");
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanLower } },
            { employeeId: { equals: cleanIdentity } },
            { employeeId: { equals: cleanUpper } },
            { employeeId: { equals: cleanLower } },
            { id: { equals: cleanIdentity } },
          ],
        },
        include: { department: true },
      });
    } catch (prismaError: any) {
      console.warn("Prisma login query warning, trying queryDb fallback:", prismaError?.message);
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
        console.error("Database connection error in login route:", dbError?.message);
        dbErrorOccurred = true;
      }
    }

    // 4. Handle Database Connection Error (Do NOT mask database errors as invalid credentials)
    if (!dbUser && dbErrorOccurred) {
      return NextResponse.json(
        {
          success: false,
          error: "Database service is temporarily unavailable. Please try again in a few moments.",
        },
        { status: 503 }
      );
    }

    // 5. Verify Account Existence
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Invalid Employee ID or password." },
        { status: 401 }
      );
    }

    // 5. Verify Password Hash using Bcrypt
    const passwordMatches = await comparePassword(inputPassword, dbUser.password);
    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, error: "Invalid Employee ID or password." },
        { status: 401 }
      );
    }

    // 6. Verify Active Account Status
    if (dbUser.isActive === false || dbUser.isActive === 0 || dbUser.isResigned) {
      return NextResponse.json(
        { success: false, error: "Account deactivated: Please contact HR administrator." },
        { status: 403 }
      );
    }

    // 7. Automatic Server-Side Role Detection & Exact Role Page Redirection
    const userRole = (dbUser.role || "").toUpperCase();
    const privilegedAdminRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "ADMIN"];
    const isAdmin = privilegedAdminRoles.includes(userRole);
    let redirectTo = "/employee/dashboard";

    if (userRole === "HR") {
      redirectTo = "/hr";
    } else if (isAdmin) {
      redirectTo = "/admin/dashboard";
    } else if (userRole === "PROJECT_MANAGER") {
      redirectTo = "/project-manager";
    } else if (userRole === "TEAM_LEADER") {
      redirectTo = "/team-leader";
    } else {
      // Check if user is a designated Team Leader for projects in TiDB
      const tlCheck = await queryDb<any[]>(
        `SELECT id FROM project WHERE teamLeaderId = ? LIMIT 1`,
        [dbUser.id]
      );
      if (tlCheck && tlCheck.length > 0) {
        redirectTo = "/team-leader";
      } else {
        redirectTo = "/employee/dashboard";
      }
    }

    // 8. Construct Safe Authenticated User Object (Never expose password hash)
    const authenticatedUser = {
      id: dbUser.id,
      employeeId: dbUser.employeeId,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      department: dbUser.department?.name || dbUser.departmentName || "Operations",
      avatarUrl: dbUser.avatarUrl || null,
    };

    // 9. Generate JWT Session Token
    const token = generateToken({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    // 10. Construct Response & Set Secure HTTP-Only Cookie
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
      maxAge: 60 * 60, // 1 Hour Inactivity Timeout (3600s)
    });

    // Async Audit Logging
    queryDb(
      "INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
      [
        `AUD-${Date.now()}`,
        dbUser.id,
        "USER_LOGIN",
        `User ${dbUser.name} (${dbUser.email} / ${dbUser.employeeId}) logged in successfully as ${dbUser.role}`,
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
