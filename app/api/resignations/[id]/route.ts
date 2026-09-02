import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { PATCH as handlePatch } from "../route";

export const dynamic = "force-dynamic";

const HR_ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const cleanId = (id || "").trim();

    if (!cleanId) {
      return NextResponse.json({ success: false, error: "Resignation ID is required." }, { status: 400 });
    }

    const rows = await queryDb<any[]>(
      `SELECT 
        r.*,
        u.name AS user_name, u.email AS user_email, u.employeeId AS user_employeeId, u.role AS user_role, u.isActive AS user_isActive,
        d.name AS department_name
       FROM resignation r
       LEFT JOIN user u ON (r.userId = u.id OR r.employeeId = u.employeeId)
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE r.id = ? OR r.resignationId = ?
       LIMIT 1`,
      [cleanId, cleanId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Resignation record not found." }, { status: 404 });
    }

    const r = rows[0];
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isHrAdmin = HR_ADMIN_ROLES.includes(roleUpper);
    const authEmpId = (authUser as any).employeeId || authUser.id;

    // ID-Tampering & Scoped Access Control Verification
    const isOwner = r.userId === authUser.id || r.employeeId === authEmpId;
    let isAuthorized = isOwner || isHrAdmin;

    if (!isAuthorized) {
      if (roleUpper === "TEAM_LEADER") {
        const scopeCheck = await queryDb<any[]>(
          `SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE teamLeaderId = ?) AND B = ?
           UNION
           SELECT id FROM user WHERE managerId = ? AND id = ? LIMIT 1`,
          [authUser.id, r.userId, authUser.id, r.userId]
        );
        if (scopeCheck && scopeCheck.length > 0) isAuthorized = true;
      } else if (roleUpper === "PROJECT_MANAGER") {
        const scopeCheck = await queryDb<any[]>(
          `SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE projectManagerId = ?) AND B = ?
           UNION
           SELECT id FROM user WHERE managerId = ? AND id = ? LIMIT 1`,
          [authUser.id, r.userId, authUser.id, r.userId]
        );
        if (scopeCheck && scopeCheck.length > 0) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to view this resignation record." },
        { status: 403 }
      );
    }

    const accountStatus = (r.user_isActive === 0 || r.user_isActive === false || r.status === "APPROVED" || r.status === "COMPLETED") ? "DEACTIVATED" : "ACTIVE";

    return NextResponse.json({
      success: true,
      data: {
        id: r.id,
        resignationId: r.resignationId || `RES-${r.id.slice(0, 6)}`,
        userId: r.userId,
        employeeId: r.employeeId || r.user_employeeId,
        employeeName: r.employeeName || r.user_name,
        email: r.email || r.user_email,
        department: r.department || r.department_name || "Engineering",
        role: r.role || r.user_role || "Software Engineer",
        reason: r.reason,
        resignationDate: r.resignationDate,
        submittedAt: r.submittedAt || r.createdAt,
        lastWorkingDay: r.lastWorkingDay,
        lastWorkingDayFormatted: r.lastWorkingDayFormatted,
        noticePeriodDays: r.noticePeriodDays || 15,
        letterUrl: r.letterUrl || null,
        status: r.status,
        approvedByUserId: r.approvedByUserId || null,
        approvedByName: r.approvedByName || null,
        approverRole: r.approverRole || null,
        approvedAt: r.approvedAt || null,
        rejectedByUserId: r.rejectedByUserId || null,
        rejectedByName: r.rejectedByName || null,
        rejectedAt: r.rejectedAt || null,
        accountStatus,
        hrRemarks: r.hrRemarks || null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/resignations/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch resignation details." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const mergedBody = { ...body, id: id || body.id };
  
  const modifiedReq = new NextRequest(request.url, {
    method: "PATCH",
    headers: request.headers,
    body: JSON.stringify(mergedBody),
  });

  return handlePatch(modifiedReq);
}
