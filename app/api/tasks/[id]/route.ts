import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

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

    const rows = await queryDb<any[]>(
      `SELECT 
        t.*,
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role,
        c.id AS creator_id, c.name AS creator_name, c.employeeId AS creator_employeeId,
        p.id AS project_id, p.projectTitle AS project_title, p.clientCompany AS project_clientCompany
      FROM task t
      LEFT JOIN user u ON t.assignedToUserId = u.id
      LEFT JOIN user c ON t.createdById = c.id
      LEFT JOIN project p ON t.projectId = p.id
      WHERE t.id = ?
      LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const t = rows[0];

    // Ownership check: If worker role, can only view own assigned task
    const isAdmin = ADMIN_ROLES.includes(authResult.user.role);
    if (!isAdmin && t.assignedToUserId !== authResult.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have permission to view this task." }, { status: 403 });
    }

    // Fetch Task History
    const historyRows = await queryDb<any[]>(
      `SELECT th.*, u.name AS user_name, u.employeeId AS user_employeeId
       FROM taskhistory th
       LEFT JOIN user u ON th.userId = u.id
       WHERE th.taskId = ?
       ORDER BY th.createdAt DESC`,
      [id]
    );

    const task = {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      progress: t.progress || 0,
      startDate: t.startDate,
      dueDate: t.dueDate,
      completedAt: t.completedAt,
      estimatedHours: t.estimatedHours || 8,
      actualHours: t.actualHours || 0,
      blockerReason: t.blockerReason,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      assignedToUser: {
        id: t.user_id,
        name: t.user_name,
        employeeId: t.user_employeeId,
        email: t.user_email,
        role: t.user_role,
      },
      createdBy: t.creator_id ? {
        id: t.creator_id,
        name: t.creator_name,
        employeeId: t.creator_employeeId,
      } : null,
      project: t.project_id ? {
        id: t.project_id,
        projectTitle: t.project_title,
        clientCompany: t.project_clientCompany,
      } : null,
      taskhistory: historyRows.map((h) => ({
        id: h.id,
        action: h.action,
        oldValue: h.oldValue,
        newValue: h.newValue,
        description: h.description,
        createdAt: h.createdAt,
        user: { name: h.user_name, employeeId: h.user_employeeId },
      })),
    };

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Fetch task error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load task details right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, progress, priority, blockerReason, actualHours, dueDate, assignedToUserId, action } = body;

    const existingRows = await queryDb<any[]>(`SELECT * FROM task WHERE id = ? LIMIT 1`, [id]);
    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const existingTask = existingRows[0];
    const isAdmin = ADMIN_ROLES.includes(authResult.user.role);

    // Ownership check: Workers can only update their own assigned tasks
    if (!isAdmin && existingTask.assignedToUserId !== authResult.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to modify another employee's task." },
        { status: 403 }
      );
    }

    let nextStatus = existingTask.status;
    let nextProgress = existingTask.progress || 0;
    let nextBlocker = existingTask.blockerReason;
    let nextCompletedAt = existingTask.completedAt;
    let nextStartedAt = existingTask.startDate;
    let nextPriority = existingTask.priority;
    let nextActualHours = existingTask.actualHours || 0;
    let nextDueDate = existingTask.dueDate;
    let nextAssignedTo = existingTask.assignedToUserId;

    const historyItems: Array<{ action: string; oldVal: string; newVal: string; desc: string }> = [];

    // 1. Handling "START_TASK" action or status transition to IN_PROGRESS
    if (action === "START_TASK" || status === "IN_PROGRESS") {
      if (existingTask.status === "ASSIGNED" || existingTask.status === "BACKLOG") {
        nextStatus = "IN_PROGRESS";
        nextStartedAt = new Date();
        historyItems.push({
          action: "START_TASK",
          oldVal: existingTask.status,
          newVal: "IN_PROGRESS",
          desc: `Task started by ${(authResult.user as any).name || authResult.user.email || "Employee"} at ${new Date().toLocaleTimeString("en-IN")}.`,
        });
      }
    }

    // 2. Status change handling
    if (status && status !== existingTask.status && action !== "START_TASK") {
      if (status === "BLOCKED" && (!blockerReason || !blockerReason.trim()) && !existingTask.blockerReason) {
        return NextResponse.json(
          { success: false, error: "Blocker reason is required when marking a task as BLOCKED." },
          { status: 400 }
        );
      }

      nextStatus = status;
      if (status === "COMPLETED") {
        nextProgress = 100;
        nextCompletedAt = new Date();
      } else if (status === "IN_PROGRESS" && !existingTask.startDate) {
        nextStartedAt = new Date();
      }

      if (blockerReason !== undefined) {
        nextBlocker = blockerReason;
      }

      historyItems.push({
        action: "STATUS_CHANGE",
        oldVal: existingTask.status,
        newVal: status,
        desc: `Status updated from ${existingTask.status} to ${status}${status === "BLOCKED" ? ` (Blocker: ${blockerReason})` : ""}`,
      });
    }

    // 3. Progress Update (Sanitized between 0 and 100)
    if (typeof progress === "number" || typeof progress === "string") {
      const parsedProg = parseInt(progress.toString(), 10);
      if (!isNaN(parsedProg)) {
        const validProg = Math.min(100, Math.max(0, parsedProg));
        if (validProg !== existingTask.progress) {
          nextProgress = validProg;
          if (validProg === 100 && nextStatus !== "COMPLETED") {
            nextStatus = "COMPLETED";
            nextCompletedAt = new Date();
          }
          historyItems.push({
            action: "PROGRESS_UPDATE",
            oldVal: `${existingTask.progress}%`,
            newVal: `${validProg}%`,
            desc: `Progress updated to ${validProg}%${validProg === 100 ? " (Task marked as COMPLETED)" : ""}.`,
          });
        }
      }
    }

    // 4. Admin-only updates (Priority, Reassignment, Due Date)
    if (isAdmin) {
      if (priority && priority !== existingTask.priority) {
        nextPriority = priority;
        historyItems.push({
          action: "PRIORITY_CHANGE",
          oldVal: existingTask.priority,
          newVal: priority,
          desc: `Priority changed to ${priority} by Admin.`,
        });
      }
      if (dueDate) {
        nextDueDate = new Date(dueDate);
      }
      if (assignedToUserId && assignedToUserId !== existingTask.assignedToUserId) {
        nextAssignedTo = assignedToUserId;
        historyItems.push({
          action: "REASSIGNED",
          oldVal: existingTask.assignedToUserId,
          newVal: assignedToUserId,
          desc: `Task reassigned to user ${assignedToUserId}.`,
        });
      }
    }

    if (actualHours !== undefined) {
      nextActualHours = Number(actualHours);
    }

    // Execute Update in TiDB Cloud
    await queryDb(
      `UPDATE task SET 
        status = ?,
        progress = ?,
        priority = ?,
        blockerReason = ?,
        completedAt = ?,
        startDate = ?,
        actualHours = ?,
        dueDate = ?,
        assignedToUserId = ?,
        updatedAt = NOW()
       WHERE id = ?`,
      [
        nextStatus,
        nextProgress,
        nextPriority,
        nextBlocker,
        nextCompletedAt,
        nextStartedAt,
        nextActualHours,
        nextDueDate,
        nextAssignedTo,
        id,
      ]
    );

    // Insert History Records
    for (const h of historyItems) {
      const histId = `TH-${id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await queryDb(
        `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [histId, id, authResult.user.id, h.action, h.oldVal, h.newVal, h.desc]
      );
    }

    clearQueryCache("tasks");

    await logAuditEvent(
      authResult.user.id,
      "TASK_UPDATED",
      `Task "${existingTask.title}" updated: Status=${nextStatus}, Progress=${nextProgress}%.`
    );

    return NextResponse.json({
      success: true,
      message: `✓ Task updated successfully! Status: ${nextStatus} (${nextProgress}%).`,
      task: {
        id,
        status: nextStatus,
        progress: nextProgress,
        priority: nextPriority,
        completedAt: nextCompletedAt,
      },
    });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update task. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = ADMIN_ROLES.includes(authResult.user.role);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Only administrators can delete tasks." }, { status: 403 });
    }

    const { id } = await params;
    await queryDb(`DELETE FROM task WHERE id = ?`, [id]);

    clearQueryCache("tasks");

    await logAuditEvent(authResult.user.id, "TASK_DELETED", `Task ${id} deleted by Admin.`);

    return NextResponse.json({ success: true, message: "Task deleted successfully." });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete task." }, { status: 500 });
  }
}
