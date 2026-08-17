import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authService";
import { getRolePermissions, Role } from "@/lib/rbac";
import { getEmployeeAvatarUrl } from "@/lib/avatarHelper";

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
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired session token." },
        { status: 401 }
      );
    }

    // Verify user exists and is active in MySQL Database via Prisma
    let dbUser: any = null;
    try {
      const { prisma } = await import("@/lib/prisma");
      const whereConditions: any[] = [{ id: decoded.id }];
      if (decoded.email) whereConditions.push({ email: decoded.email });

      dbUser = await prisma.user.findFirst({
        where: { OR: whereConditions },
        include: { department: { select: { name: true, code: true } } },
      });
    } catch (dbErr: any) {
      console.warn("Prisma user validation error:", dbErr.message);
    }

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Account is inactive or non-existent." },
        { status: 401 }
      );
    }

    const userRole = (dbUser.role || decoded.role || "DEVELOPER") as Role;
    const permissions = getRolePermissions(userRole);
    const avatarUrl = getEmployeeAvatarUrl(dbUser);

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        employeeId: dbUser.employeeId || dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: userRole,
        department: dbUser.department?.name || "Operations",
        avatarUrl,
        permissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to authenticate session." },
      { status: 500 }
    );
  }
}
