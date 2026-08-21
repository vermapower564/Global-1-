import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/authService";
import { getRolePermissions, Role, UserPermission } from "@/lib/rbac";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  permissions: UserPermission;
}

export async function authenticateRequest(
  req: Request,
  requiredPermission?: keyof UserPermission
): Promise<{ user: AuthenticatedUser | null; response?: NextResponse }> {
  try {
    // 1. Extract Token from Authorization Header or Cookie
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");
    
    let token: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/oms_session=([^;]+)/);
      if (match) token = match[1];
    }

    // Fallback: If no token provided, return 401 Unauthorized
    if (!token) {
      return {
        user: null,
        response: NextResponse.json(
          { success: false, error: "Unauthorized: Session token missing or expired. Please sign in." },
          { status: 401 }
        ),
      };
    }

    // 2. Verify Token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return {
        user: null,
        response: NextResponse.json(
          { success: false, error: "Unauthorized: Invalid or expired session token" },
          { status: 401 }
        ),
      };
    }

    const role = (decoded.role || "EMPLOYEE") as Role;
    const permissions = getRolePermissions(role);

    // 3. Permission Check
    if (requiredPermission && !permissions[requiredPermission]) {
      return {
        user: null,
        response: NextResponse.json(
          { success: false, error: "Forbidden: Required permission check failed" },
          { status: 403 }
        ),
      };
    }

    const user: AuthenticatedUser = {
      id: decoded.id,
      email: decoded.email,
      role,
      permissions,
    };

    return { user };
  } catch (error: any) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, error: "Authentication verification failed" },
        { status: 500 }
      ),
    };
  }
}

export async function logAuditEvent(
  userIdOrReq: string | Request | null,
  action: string,
  details: string | Record<string, any>,
  ipAddress?: string
) {
  try {
    const { queryDb } = await import("@/lib/db");
    let validUserId: string | null = null;
    if (typeof userIdOrReq === "string" && userIdOrReq) {
      const uRows = await queryDb<any[]>(
        `SELECT id FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
        [userIdOrReq, userIdOrReq]
      );
      if (uRows && uRows.length > 0) {
        validUserId = uRows[0].id;
      }
    }
    const detailStr = typeof details === "object" ? JSON.stringify(details) : String(details);
    const ip =
      ipAddress ||
      (typeof userIdOrReq === "object" && userIdOrReq !== null && "headers" in userIdOrReq
        ? (userIdOrReq as Request).headers.get("x-forwarded-for") || "127.0.0.1"
        : "127.0.0.1");

    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, NOW())`,
      [`AUD-${Date.now()}`, validUserId, action, detailStr, ip]
    );
  } catch (err: any) {
    console.warn("Audit Log Auto-Record Fallback:", err.message);
  }
}
