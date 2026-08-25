import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "PROJECT_MANAGER"];

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    // Verify task and project ownership
    const taskRows = await queryDb<any[]>(
      `SELECT t.*, p.teamLeaderId AS project_teamLeaderId, p.projectTitle AS project_title
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       WHERE t.id = ?
       LIMIT 1`,
      [taskId]
    );

    if (!taskRows || taskRows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const targetTask = taskRows[0];
    const isAdmin = ADMIN_ROLES.includes(authUser.role);
    const isTeamLeader = targetTask.project_teamLeaderId === authUser.id || targetTask.assignedToUserId === authUser.id;

    if (!isAdmin && !isTeamLeader) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to accept this task." },
        { status: 403 }
      );
    }

    await queryDb(
      `UPDATE task SET status = 'ACCEPTED', updatedAt = NOW() WHERE id = ?`,
      [taskId]
    );

    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'TASK_ACCEPTED', ?, 'ACCEPTED', ?, NOW())`,
      [
        `TH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        taskId,
        authUser.id,
        targetTask.status,
        `Main Task "${targetTask.title}" accepted by Team Leader ${(authUser as any).name || authUser.email}. Work division initiated.`,
      ]
    );

    clearQueryCache("task");
    clearQueryCache("project");

    logAuditEvent(
      authUser.id,
      "MAIN_TASK_ACCEPTED",
      `Team Leader accepted main task "${targetTask.title}" for project "${targetTask.project_title}"`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: "✓ Task successfully accepted by Team Leader!",
      taskId,
      status: "ACCEPTED",
    });
  } catch (error: any) {
    console.error("POST /api/team-leader/accept-task error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to accept task." }, { status: 500 });
  }
}
