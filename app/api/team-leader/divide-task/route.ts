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
    const { mainTaskId, subtasks } = body;

    if (!mainTaskId || !Array.isArray(subtasks) || subtasks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Main Task ID and at least one subtask division are required." },
        { status: 400 }
      );
    }

    // Verify main task & project authorization
    const taskRows = await queryDb<any[]>(
      `SELECT t.*, p.id AS project_id, p.teamLeaderId AS project_teamLeaderId, p.projectTitle AS project_title
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       WHERE t.id = ?
       LIMIT 1`,
      [mainTaskId]
    );

    if (!taskRows || taskRows.length === 0) {
      return NextResponse.json({ success: false, error: "Main task not found." }, { status: 404 });
    }

    const mainTask = taskRows[0];
    const isAdmin = ADMIN_ROLES.includes(authUser.role);
    const isTeamLeader = mainTask.project_teamLeaderId === authUser.id || mainTask.assignedToUserId === authUser.id;

    if (!isAdmin && !isTeamLeader) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only designated Team Leader can divide this main task." },
        { status: 403 }
      );
    }

    const createdSubtaskIds: string[] = [];

    for (const sub of subtasks) {
      const {
        title,
        description,
        section = "General",
        assignedToUserId,
        priority = "HIGH",
        dueDate,
        estimatedHours = 8,
      } = sub;

      // Resolve assignedToUserId to cuid if employeeId passed
      const userRows = await queryDb<any[]>(
        `SELECT id FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
        [assignedToUserId, assignedToUserId]
      );
      const resolvedUserId = userRows && userRows.length > 0 ? userRows[0].id : assignedToUserId;

      const subtaskId = `TSK-SUB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      await queryDb(
        `INSERT INTO task (
          id, title, description, section, projectId, parentTaskId, isMainTask,
          assignedToUserId, createdById, status, priority, progress,
          startDate, dueDate, estimatedHours, actualHours, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, 0,
          ?, ?, 'ASSIGNED', ?, 0,
          NOW(), ?, ?, 0, NOW(), NOW()
        )`,
        [
          subtaskId,
          title.trim(),
          description ? description.trim() : null,
          section.trim(),
          mainTask.projectId,
          mainTaskId,
          resolvedUserId,
          authUser.id,
          priority,
          dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000),
          parseFloat(estimatedHours) || 8,
        ]
      );

      // Ensure member is linked in _assignedstaffprojects
      if (mainTask.projectId && resolvedUserId) {
        try {
          await queryDb(`INSERT IGNORE INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [
            mainTask.projectId,
            resolvedUserId,
          ]);
        } catch {}
      }

      await queryDb(
        `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
         VALUES (?, ?, ?, 'SUBTASK_ASSIGNED', NULL, 'ASSIGNED', ?, NOW())`,
        [
          `TH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          subtaskId,
          authUser.id,
          `Subtask "${title.trim()}" in section "${section}" assigned by Team Leader ${(authUser as any).name || authUser.email}.`,
        ]
      );

      createdSubtaskIds.push(subtaskId);
    }

    // Update main task to IN_PROGRESS
    await queryDb(
      `UPDATE task SET status = 'IN_PROGRESS', updatedAt = NOW() WHERE id = ?`,
      [mainTaskId]
    );

    clearQueryCache("task");
    clearQueryCache("project");

    logAuditEvent(
      authUser.id,
      "TASK_DIVIDED",
      `Team Leader divided main task "${mainTask.title}" into ${createdSubtaskIds.length} subtask(s)`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `✓ Successfully created and assigned ${createdSubtaskIds.length} subtask(s)!`,
      subtaskIds: createdSubtaskIds,
      mainTaskId,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/team-leader/divide-task error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to divide task." }, { status: 500 });
  }
}
