import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/authService";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR", "ADMIN"];

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request format. Please provide valid JSON." },
        { status: 400 }
      );
    }

    const identityInput =
      body?.identity || body?.email || body?.employeeId || body?.loginIdentity || body?.username || "";
    const inputPassword = body?.password || "";

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

    // 3. Query Database for User via Prisma Client (Search by Email OR Employee ID OR CUID)
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanLower },
            { employeeId: cleanIdentity },
            { employeeId: cleanUpper },
            { employeeId: cleanLower },
            { id: cleanIdentity },
          ],
        },
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          password: true,
          role: true,
          isActive: true,
          isResigned: true,
          avatarUrl: true,
          failedLoginAttempts: true,
          lockoutUntil: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      console.error("[Prisma Login Error] Database query failed:", dbError?.message || dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Database service is temporarily unavailable. Please try again in a few moments.",
        },
        { status: 503 }
      );
    }

    // 4. Verify Account Existence
    if (!dbUser) {
      const { logAuditEvent } = await import("@/lib/authMiddleware");
      await logAuditEvent(null, "USER_LOGIN_FAILED", `Failed login attempt for identity: ${cleanIdentity}`);
      return NextResponse.json(
        { success: false, error: "Invalid Employee ID or password." },
        { status: 401 }
      );
    }

    // 5. Account Lockout Verification (Calculated strictly from Backend DB)
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 15;

    if (dbUser.lockoutUntil) {
      let lockoutTime = new Date(dbUser.lockoutUntil).getTime();
      if (typeof dbUser.lockoutUntil === "string" && !dbUser.lockoutUntil.includes("Z") && !dbUser.lockoutUntil.includes("+")) {
        lockoutTime = new Date(dbUser.lockoutUntil.replace(" ", "T") + "Z").getTime();
        // If string was stored in local time, check difference
        if (isNaN(lockoutTime) || lockoutTime < Date.now() - 24 * 3600 * 1000) {
          lockoutTime = new Date(dbUser.lockoutUntil).getTime();
        }
      }
      const now = Date.now();
      if (lockoutTime > now) {
        const remainingMs = lockoutTime - now;
        const remainingMins = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));
        const { logAuditEvent } = await import("@/lib/authMiddleware");
        await logAuditEvent(dbUser.id, "USER_LOGIN_REJECTED_LOCKED", `Login attempt rejected for locked account ${dbUser.employeeId}`);
        return NextResponse.json(
          {
            success: false,
            error: `Invalid username or password. Account locked. Please try again in ${remainingMins} minute${remainingMins === 1 ? "" : "s"}.`,
            isLocked: true,
            remainingMinutes: remainingMins,
          },
          { status: 423 }
        );
      } else {
        // Lockout expired -> Clear lock status in DB
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { failedLoginAttempts: 0, lockoutUntil: null },
        }).catch(() => {});
        dbUser.failedLoginAttempts = 0;
        dbUser.lockoutUntil = null;
      }
    }

    // 6. Verify Password Hash using Bcrypt
    const passwordMatches = await comparePassword(inputPassword, dbUser.password);
    if (!passwordMatches) {
      const currentAttempts = (dbUser.failedLoginAttempts || 0) + 1;
      let isNowLocked = false;
      let lockoutUntilDate: Date | null = null;

      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        isNowLocked = true;
        lockoutUntilDate = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          failedLoginAttempts: currentAttempts,
          lockoutUntil: lockoutUntilDate,
        },
      }).catch(() => {});

      const { logAuditEvent } = await import("@/lib/authMiddleware");
      if (isNowLocked) {
        await logAuditEvent(dbUser.id, "USER_ACCOUNT_LOCKED", `Account ${dbUser.employeeId} locked due to ${currentAttempts} consecutive failed login attempts`);
        return NextResponse.json(
          {
            success: false,
            error: `Invalid username or password. Account locked. Please try again in ${LOCKOUT_MINUTES} minutes.`,
            isLocked: true,
            remainingMinutes: LOCKOUT_MINUTES,
          },
          { status: 423 }
        );
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - currentAttempts;
        await logAuditEvent(dbUser.id, "USER_LOGIN_FAILED", `Invalid password for employee ${dbUser.employeeId} (${currentAttempts}/${MAX_FAILED_ATTEMPTS} attempts)`);
        return NextResponse.json(
          {
            success: false,
            error: `Invalid Employee ID or password. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
            remainingAttempts,
          },
          { status: 401 }
        );
      }
    }

    // 7. On Successful Password Match -> Reset Failed Login Counter
    if ((dbUser.failedLoginAttempts || 0) > 0 || dbUser.lockoutUntil) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null },
      }).catch(() => {});
    }

    // 8. Verify Active Account Status
    if (dbUser.isActive === false || dbUser.isActive === 0 || dbUser.isResigned) {
      const { logAuditEvent } = await import("@/lib/authMiddleware");
      await logAuditEvent(dbUser.id, "USER_LOGIN_REJECTED_INACTIVE", `Login rejected for inactive account ${dbUser.employeeId}`);
      return NextResponse.json(
        { success: false, error: "Your account is inactive. Please contact the organisation administrator." },
        { status: 403 }
      );
    }

    // 7. Determine Role-Based Redirection Target
    const userRole = (dbUser.role || "EMPLOYEE").toUpperCase();
    const isAdmin = ADMIN_ROLES.includes(userRole);

    let redirectTo = "/employee/dashboard";
    if (userRole === "HR" || userRole === "ADMIN_HR") {
      redirectTo = "/hr";
    } else if (["SUPER_ADMIN", "DIRECTOR", "ADMIN"].includes(userRole)) {
      redirectTo = "/admin/dashboard";
    } else if (userRole === "PROJECT_MANAGER") {
      redirectTo = "/project-manager";
    } else if (userRole === "TEAM_LEADER") {
      redirectTo = "/team-leader";
    } else {
      // Check if user is a designated Team Leader for projects via Prisma
      try {
        const ledProject = await prisma.project.findFirst({
          where: { teamLeaderId: dbUser.id },
          select: { id: true },
        });
        if (ledProject) {
          redirectTo = "/team-leader";
        } else {
          redirectTo = "/employee/dashboard";
        }
      } catch {
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
      department: dbUser.department?.name || "Operations",
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

    // 11. Async Non-blocking Login Audit Log via Prisma
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

    const { logAuditEvent } = await import("@/lib/authMiddleware");
    await logAuditEvent(dbUser.id, "USER_LOGIN_SUCCESS", `User ${dbUser.email} (${dbUser.role}) logged in successfully`);

    return response;
  } catch (error: any) {
    console.error("Login processing error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to process login. Please try again." },
      { status: 500 }
    );
  }
}
