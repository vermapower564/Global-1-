import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required." },
        { status: 400 }
      );
    }

    const cleanId = decodeURIComponent(id).trim();
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isFullAdmin = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"].includes(roleUpper);

    // Fetch Project
    const projectRows = await queryDb<any[]>(
      `SELECT p.*, tl.name as tl_name, tl.email as tl_email, tl.employeeId as tl_employeeId, tl.avatarUrl as tl_avatarUrl
       FROM project p
       LEFT JOIN user tl ON p.teamLeaderId = tl.id
       WHERE p.id = ? OR LOWER(p.projectTitle) = LOWER(?)
       LIMIT 1`,
      [cleanId, cleanId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    const proj = projectRows[0];

    // Check membership authorization
    if (!isFullAdmin) {
      const isTL = proj.teamLeaderId === authUser.id;
      const memberCheck = await queryDb<any[]>(
        `SELECT B FROM _assignedstaffprojects WHERE A = ? AND B = ?
         UNION
         SELECT id FROM task WHERE projectId = ? AND assignedToUserId = ?`,
        [proj.id, authUser.id, proj.id, authUser.id]
      );

      const isMember = isTL || (memberCheck && memberCheck.length > 0);

      if (!isMember) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: You do not have permission to access project records outside your assigned projects.",
          },
          { status: 403 }
        );
      }
    }

    // Fetch assigned members
    const members = await queryDb<any[]>(
      `SELECT u.id, u.name, u.employeeId, u.email, u.role, u.avatarUrl, d.name as departmentName
       FROM _assignedstaffprojects asp
       JOIN user u ON asp.B = u.id
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE asp.A = ? AND u.isActive = 1`,
      [proj.id]
    );

    // Fetch tasks
    const tasks = await queryDb<any[]>(
      `SELECT t.*, u.name as user_name, u.employeeId as user_employeeId, u.avatarUrl as user_avatarUrl
       FROM task t
       LEFT JOIN user u ON t.assignedToUserId = u.id
       WHERE t.projectId = ?
       ORDER BY t.createdAt DESC`,
      [proj.id]
    );

    return NextResponse.json({
      success: true,
      project: {
        ...proj,
        contractValue: isFullAdmin ? proj.contractValue : undefined,
        teamLeader: proj.teamLeaderId
          ? {
              id: proj.teamLeaderId,
              name: proj.tl_name,
              email: proj.tl_email,
              employeeId: proj.tl_employeeId,
              avatarUrl: proj.tl_avatarUrl,
            }
          : null,
        members,
        tasks,
      },
    });
  } catch (err: any) {
    console.error("Project GET [id] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch project." },
      { status: 500 }
    );
  }
}
