import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch all blocked tasks scoped to user permissions
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(roleUpper);
    const isPM = roleUpper === "PROJECT_MANAGER";
    const isTL = roleUpper === "TEAM_LEADER";

    let sql = `
      SELECT 
        t.id, t.title, t.description, t.section, t.status, t.priority, t.progress,
        t.startDate, t.dueDate, t.estimatedHours, t.actualHours, t.blockerReason, t.updatedAt,
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email,
        c.id AS creator_id, c.name AS creator_name, c.employeeId AS creator_employeeId,
        p.id AS project_id, p.projectTitle AS project_title, p.teamLeaderId AS project_teamLeaderId, p.projectManagerId AS project_projectManagerId,
        tl.name AS teamLeaderName, pm.name AS projectManagerName
      FROM task t
      LEFT JOIN user u ON t.assignedToUserId = u.id
      LEFT JOIN user c ON t.createdById = c.id
      LEFT JOIN project p ON t.projectId = p.id
      LEFT JOIN user tl ON p.teamLeaderId = tl.id
      LEFT JOIN user pm ON p.projectManagerId = pm.id
      WHERE t.status = 'BLOCKED'
    `;
    const params: any[] = [];

    if (!isAdmin) {
      if (isTL) {
        sql += ` AND (p.teamLeaderId = ? OR t.createdById = ? OR t.assignedToUserId = ?)`;
        params.push(authUser.id, authUser.id, authUser.id);
      } else if (isPM) {
        sql += ` AND (p.projectManagerId = ? OR t.createdById = ? OR t.assignedToUserId = ?)`;
        params.push(authUser.id, authUser.id, authUser.id);
      } else {
        sql += ` AND t.assignedToUserId = ?`;
        params.push(authUser.id);
      }
    }

    sql += ` ORDER BY t.updatedAt DESC`;

    const blockedTasks = await queryDb<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      totalBlocked: (blockedTasks || []).length,
      blockedTasks: blockedTasks || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Report a task blocker (Employee / Assignee)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json().catch(() => ({}));
    const { taskId, blockerReason, severity = "HIGH" } = body;

    if (!taskId || !blockerReason || !blockerReason.trim()) {
      return NextResponse.json({ success: false, error: "Task ID and blocker explanation reason are required." }, { status: 400 });
    }

    const taskRows = await queryDb<any[]>(
      `SELECT t.*, p.teamLeaderId, p.projectManagerId, p.projectTitle, u.name AS assigneeName
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       LEFT JOIN user u ON t.assignedToUserId = u.id
       WHERE t.id = ? LIMIT 1`,
      [taskId]
    );

    if (!taskRows || taskRows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const task = taskRows[0];
    const isAssignee = task.assignedToUserId === authUser.id;
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "PROJECT_MANAGER", "TEAM_LEADER"].includes(authUser.role);

    if (!isAssignee && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Only the assigned employee or manager can report a blocker on this task." }, { status: 403 });
    }

    await queryDb(
      `UPDATE task SET status = 'BLOCKED', blockerReason = ?, priority = ?, updatedAt = NOW(3) WHERE id = ?`,
      [blockerReason.trim(), severity.toUpperCase(), taskId]
    );

    const histId = `TH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'BLOCKER_REPORTED', ?, 'BLOCKED', ?, NOW(3))`,
      [
        histId,
        taskId,
        authUser.id,
        task.status,
        `Blocker reported by ${(authUser as any).name || authUser.email} (Severity: ${severity}): "${blockerReason.trim()}"`,
      ]
    );

    clearQueryCache("task");

    // Notify Team Leader
    if (task.teamLeaderId && task.teamLeaderId !== authUser.id) {
      try {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, 'WARNING', 0, '/team-leader/tasks', NOW(3))`,
          [
            notifId,
            task.teamLeaderId,
            `⚠️ Blocker Reported: ${task.title}`,
            `${(authUser as any).name || "Employee"} reported a ${severity} blocker on task "${task.title}": "${blockerReason.trim()}"`,
          ]
        );
      } catch {}
    }

    await logAuditEvent(
      authUser.id,
      "TASK_BLOCKER_REPORTED",
      `Reported blocker on task "${task.title}" (Reason: ${blockerReason.trim()}, Severity: ${severity})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: "✓ Blocker reported successfully. Team Leader has been notified.",
      taskId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to report blocker." }, { status: 500 });
  }
}

// PATCH: Resolve Blocker OR Escalate to Project Manager (Team Leader / Senior)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json().catch(() => ({}));
    const { taskId, action = "RESOLVE", resolutionNotes, escalationNotes } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    const taskRows = await queryDb<any[]>(
      `SELECT t.*, p.teamLeaderId, p.projectManagerId, p.projectTitle, u.name AS assigneeName
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       LEFT JOIN user u ON t.assignedToUserId = u.id
       WHERE t.id = ? LIMIT 1`,
      [taskId]
    );

    if (!taskRows || taskRows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const task = taskRows[0];
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(roleUpper);
    const isPM = roleUpper === "PROJECT_MANAGER" || task.projectManagerId === authUser.id;
    const isTL = roleUpper === "TEAM_LEADER" || task.teamLeaderId === authUser.id;
    const isAssignee = task.assignedToUserId === authUser.id;

    if (action === "ESCALATE") {
      if (!isTL && !isAdmin && !isPM) {
        return NextResponse.json({ success: false, error: "Forbidden: Only Team Leaders and Managers can escalate task blockers." }, { status: 403 });
      }

      const escalationMessage = escalationNotes || "Escalated by Team Leader to Project Manager for senior intervention.";
      const updatedReason = `[ESCALATED TO PM]: ${task.blockerReason || ""} | Notes: ${escalationMessage}`;

      await queryDb(
        `UPDATE task SET blockerReason = ?, priority = 'CRITICAL', updatedAt = NOW(3) WHERE id = ?`,
        [updatedReason, taskId]
      );

      const histId = `TH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
      await queryDb(
        `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
         VALUES (?, ?, ?, 'BLOCKER_ESCALATED', 'BLOCKED', 'BLOCKED_ESCALATED', ?, NOW(3))`,
        [
          histId,
          taskId,
          authUser.id,
          `Blocker escalated to Project Manager by ${(authUser as any).name || authUser.email}: "${escalationMessage}"`,
        ]
      );

      clearQueryCache("task");

      // Notify Project Manager / Admins
      const targetManagerId = task.projectManagerId;
      if (targetManagerId) {
        try {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'DANGER', 0, '/project-manager/tasks', NOW(3))`,
            [
              notifId,
              targetManagerId,
              `🚨 Blocker Escalation: ${task.title}`,
              `Team Leader has escalated a critical blocker on "${task.title}" (Project: ${task.projectTitle || "General"}): "${escalationMessage}"`,
            ]
          );
        } catch {}
      }

      await logAuditEvent(
        authUser.id,
        "TASK_BLOCKER_ESCALATED",
        `Escalated blocker on task "${task.title}" to Project Manager. Notes: ${escalationMessage}`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );

      return NextResponse.json({
        success: true,
        message: "✓ Blocker successfully escalated to Project Manager.",
        taskId,
      });
    } else {
      // Resolve blocker
      if (!isTL && !isAdmin && !isPM && !isAssignee) {
        return NextResponse.json({ success: false, error: "Forbidden: You are not authorized to resolve this blocker." }, { status: 403 });
      }

      await queryDb(
        `UPDATE task SET status = 'IN_PROGRESS', blockerReason = NULL, updatedAt = NOW(3) WHERE id = ?`,
        [taskId]
      );

      const histId = `TH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
      await queryDb(
        `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
         VALUES (?, ?, ?, 'BLOCKER_RESOLVED', 'BLOCKED', 'IN_PROGRESS', ?, NOW(3))`,
        [
          histId,
          taskId,
          authUser.id,
          `${(authUser as any).name || authUser.email} resolved blocker: "${resolutionNotes || "Blocker cleared, task resumed."}"`,
        ]
      );

      clearQueryCache("task");

      // Notify Assignee if resolved by TL/Manager
      if (task.assignedToUserId && task.assignedToUserId !== authUser.id) {
        try {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'SUCCESS', 0, '/employee/tasks', NOW(3))`,
            [
              notifId,
              task.assignedToUserId,
              `✅ Blocker Cleared: ${task.title}`,
              `The blocker on your task "${task.title}" was resolved by ${(authUser as any).name || "Team Leader"}. Task is back IN PROGRESS.`,
            ]
          );
        } catch {}
      }

      await logAuditEvent(
        authUser.id,
        "TASK_BLOCKER_RESOLVED",
        `Resolved blocker on task "${task.title}": "${resolutionNotes || "Blocker cleared"}"`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );

      return NextResponse.json({
        success: true,
        message: "✓ Blocker resolved successfully and task status restored to IN_PROGRESS.",
        taskId,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update blocker." }, { status: 500 });
  }
}

