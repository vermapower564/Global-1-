import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch current project team members + eligible employees with skills & workload
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
    const cleanId = decodeURIComponent(id).trim();
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"].includes(roleUpper);

    // Fetch project
    const projectRows = await queryDb<any[]>(
      `SELECT id, projectTitle, expectedTeamSize, teamLeaderId, projectManagerId FROM project WHERE id = ? LIMIT 1`,
      [cleanId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = projectRows[0];

    // Verify authorization
    const isPM = proj.projectManagerId === authUser.id;
    const isTL = proj.teamLeaderId === authUser.id;

    if (!isAdmin && !isPM && !isTL) {
      const memberCheck = await queryDb<any[]>(
        `SELECT B FROM _assignedstaffprojects WHERE A = ? AND B = ? LIMIT 1`,
        [proj.id, authUser.id]
      );
      if (!memberCheck || memberCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You do not have permission to manage this project team." },
          { status: 403 }
        );
      }
    }

    // Current Team Members
    const members = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.role, u.skills, u.avatarUrl, d.name AS departmentName,
              (SELECT COUNT(*) FROM task t WHERE t.assignedToUserId = u.id AND t.projectId = ? AND t.status != 'COMPLETED') AS activeTasksOnProject
       FROM _assignedstaffprojects asp
       JOIN user u ON asp.B = u.id
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE asp.A = ? AND u.isActive = 1`,
      [proj.id, proj.id]
    );

    // Eligible Employees for team building (excluding current team members & Admin roles)
    const currentMemberIds = members.map((m) => m.id);
    let eligibleSql = `
      SELECT u.id, u.employeeId, u.name, u.email, u.role, u.skills, u.avatarUrl, d.name AS departmentName,
             (SELECT COUNT(*) FROM task t WHERE t.assignedToUserId = u.id AND t.status != 'COMPLETED') AS totalActiveTasks,
             (SELECT COUNT(*) FROM _assignedstaffprojects asp2 WHERE asp2.B = u.id) AS totalActiveProjects
      FROM user u
      LEFT JOIN department d ON u.departmentId = d.id
      WHERE u.isActive = 1 AND u.role NOT IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR')
    `;

    const eligibleParams: any[] = [];
    if (currentMemberIds.length > 0) {
      const placeholders = currentMemberIds.map(() => "?").join(",");
      eligibleSql += ` AND u.id NOT IN (${placeholders})`;
      eligibleParams.push(...currentMemberIds);
    }

    eligibleSql += ` ORDER BY totalActiveTasks ASC, u.name ASC`;
    const eligibleEmployees = await queryDb<any[]>(eligibleSql, eligibleParams);

    const requiredTeamSize = proj.expectedTeamSize || 1;
    const currentTeamSize = members.length;
    const teamStatus = currentTeamSize >= requiredTeamSize ? "READY" : "INCOMPLETE";

    return NextResponse.json({
      success: true,
      projectId: proj.id,
      projectTitle: proj.projectTitle,
      requiredTeamSize,
      currentTeamSize,
      teamStatus,
      teamStatusLabel: teamStatus === "READY" ? "Team Ready" : `Team Incomplete (Need ${requiredTeamSize - currentTeamSize} more)`,
      members,
      eligibleEmployees,
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/team error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project team." }, { status: 500 });
  }
}

// POST: Add employee(s) to project team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(roleUpper);

    const projectRows = await queryDb<any[]>(
      `SELECT id, projectTitle, teamLeaderId, projectManagerId FROM project WHERE id = ? LIMIT 1`,
      [cleanId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = projectRows[0];
    const isPM = proj.projectManagerId === authUser.id;
    const isTL = proj.teamLeaderId === authUser.id;

    if (!isAdmin && !isPM && !isTL) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only the assigned Team Leader, Project Manager, or Admin can build the project team." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId, userIds } = body;

    const idsToAdd: string[] = Array.isArray(userIds) ? userIds : userId ? [userId] : [];

    if (idsToAdd.length === 0) {
      return NextResponse.json({ success: false, error: "Please specify at least one user ID to add to the team." }, { status: 400 });
    }

    let addedCount = 0;
    for (const uid of idsToAdd) {
      // Verify user exists, is active, and is not Admin
      const userRows = await queryDb<any[]>(`SELECT id, name, email, role, isActive, isResigned FROM user WHERE id = ? LIMIT 1`, [uid]);
      if (!userRows || userRows.length === 0) continue;

      const targetUser = userRows[0];
      if (targetUser.isActive === 0 || targetUser.isActive === false || targetUser.isResigned === 1) {
        continue; // Cannot add deactivated or resigned employee to project team
      }

      const targetRole = (targetUser.role || "").toUpperCase();
      if (["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(targetRole)) {
        continue; // Cannot add Admin as subordinate team member
      }

      await queryDb(`INSERT IGNORE INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [proj.id, uid]);
      addedCount++;

      // Send notification to added team member
      try {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, 'INFO', 0, '/employee/projects', NOW(3))`,
          [
            notifId,
            uid,
            `🚀 Added to Project Team: ${proj.projectTitle}`,
            `You have been added to the project team for "${proj.projectTitle}". Open your project workspace to view tasks and collaborate.`,
          ]
        );
      } catch (notifErr) {
        console.warn("Notification send warning:", notifErr);
      }
    }

    clearQueryCache("project");

    await logAuditEvent(
      authUser.id,
      "PROJECT_TEAM_UPDATED",
      `Added ${addedCount} member(s) to project: ${proj.projectTitle}`
    );

    return NextResponse.json({
      success: true,
      message: `✓ Added ${addedCount} employee(s) to project team for "${proj.projectTitle}".`,
    });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/team error:", error);
    return NextResponse.json({ success: false, error: "Failed to add team members." }, { status: 500 });
  }
}

// DELETE: Remove team member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(roleUpper);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId parameter is required." }, { status: 400 });
    }

    const projectRows = await queryDb<any[]>(
      `SELECT id, projectTitle, teamLeaderId, projectManagerId FROM project WHERE id = ? LIMIT 1`,
      [cleanId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = projectRows[0];
    const isPM = proj.projectManagerId === authUser.id;
    const isTL = proj.teamLeaderId === authUser.id;

    if (!isAdmin && !isPM && !isTL) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Team Leaders, PMs, or Admins can remove team members." },
        { status: 403 }
      );
    }

    // Check active tasks for employee on project
    const activeTasks = await queryDb<any[]>(
      `SELECT id, title FROM task WHERE projectId = ? AND assignedToUserId = ? AND status != 'COMPLETED'`,
      [proj.id, userId]
    );

    if (activeTasks && activeTasks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove employee: They have ${activeTasks.length} active pending/in-progress task(s) on this project. Please reassign or complete tasks first.`,
        },
        { status: 400 }
      );
    }

    await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ? AND B = ?`, [proj.id, userId]);
    clearQueryCache("project");

    return NextResponse.json({
      success: true,
      message: `✓ Employee removed from project team. Historical completed tasks preserved.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/team error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove team member." }, { status: 500 });
  }
}
