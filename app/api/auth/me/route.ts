import { NextRequest, NextResponse } from "next/server";
import { verifyToken, generateToken } from "@/lib/authService";
import { getRolePermissions, Role } from "@/lib/rbac";
import { getEmployeeAvatarUrl } from "@/lib/avatarHelper";
import { queryDbCached } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("oms_session")?.value;
    
    let token: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated: No active session cookie or token found." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      // Clear expired cookie
      const res = NextResponse.json(
        { success: false, error: "Unauthorized: Session has expired due to 1 hour of inactivity." },
        { status: 401 }
      );
      res.cookies.set("oms_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    // Verify user exists and is active via Prisma Client
    let dbUser: any = null;
    try {
      const { prisma } = await import("@/lib/prisma");
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: decoded.id },
            { employeeId: decoded.id },
            { email: decoded.email || decoded.id },
          ],
        },
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isResigned: true,
          avatarUrl: true,
          department: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });
    } catch (dbErr: any) {
      console.warn("Prisma auth validation error:", dbErr.message);
    }

    if (!dbUser || dbUser.isActive === false || dbUser.isActive === 0) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Account is inactive or non-existent." },
        { status: 401 }
      );
    }

    const userRole = (dbUser.role || decoded.role || "DEVELOPER") as Role;
    const permissions = getRolePermissions(userRole);
    const avatarUrl = getEmployeeAvatarUrl(dbUser);

    // Sliding Window: Generate refreshed token extending active session by 1 hour
    const renewedToken = generateToken({
      id: dbUser.id,
      email: dbUser.email,
      role: userRole,
    });

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: dbUser.id,
        employeeId: dbUser.employeeId || "EMP-001",
        name: dbUser.name,
        email: dbUser.email,
        role: userRole,
        department: dbUser.department?.name || dbUser.departmentName || "Operations",
        avatarUrl,
        phone: dbUser.phone || "+91 98765 00000",
        joiningDate: dbUser.joiningDate,
        isActive: Boolean(dbUser.isActive),
        isProfileCompleted: Boolean(dbUser.isProfileCompleted),
        documentsVerified: Boolean(dbUser.documentsVerified),
      },
      permissions,
      token: renewedToken,
    });

    // Refresh HttpOnly session cookie with renewed 1-hour window
    response.cookies.set("oms_session", renewedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 Hour Inactivity Sliding Window
    });

    return response;
  } catch (error: any) {
    console.error("Auth /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
