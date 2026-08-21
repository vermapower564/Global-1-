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
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role, u.avatarUrl AS user_avatarUrl,
        c.id AS creator_id, c.name AS creator_name, c.employeeId AS creator_employeeId,
        p.id AS project_id, p.projectTitle AS project_title, p.clientCompany AS project_clientCompany, p.teamLeaderId AS project_teamLeaderId
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
    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);
    const isTeamLeader = t.project_teamLeaderId === authUser.id;
    const isAssignee = t.assignedToUserId === authUser.id;

    // Authorization check: Admin, Team Leader, task assignee, or shared project members can view
    let isProjectMember = false;
    if (t.projectId) {
      const memberRows = await queryDb<any[]>(
        `SELECT B FROM _assignedstaffprojects WHERE A = ? AND B = ? LIMIT 1`,
        [t.projectId, authUser.id]
      );
      isProjectMember = memberRows && memberRows.length > 0;
    }

    if (!isAdmin && !isTeamLeader && !isAssignee && !isProjectMember) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to view tasks outside your assigned projects." },
        { status: 403 }
      );
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
      section: t.section || "General",
      reviewNotes: t.reviewNotes,
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
        avatarUrl: t.user_avatarUrl,
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
        teamLeaderId: t.project_teamLeaderId,
      } : null,
      taskhistory: (historyRows || []).map((h) => ({
        id: h.id,
        action: h.action,
        oldValue: h.oldValue,
        newValue: h.newValue,
        description: h.description,
        createdAt: h.createdAt,
        user: { name: h.user_name, employeeId: h.user_employeeId },
      })),
      isUserTeamLeader: isTeamLeader,
      isUserAssignee: isAssignee,
    };

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Fetch task error:", error);
    return NextResponse.json({ success: false, error: "Failed to load task details." }, { status: 500 });
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
    const {
      status,
      progress,
      priority,
      section,
      reviewNotes,
      blockerReason,
      actualHours,
      dueDate,
      assignedToUserId,
      action,
      notes,
    } = body;

    const existingRows = await queryDb<any[]>(
      `SELECT t.*, p.teamLeaderId AS project_teamLeaderId
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       WHERE t.id = ?
       LIMIT 1`,
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const existingTask = existingRows[0];
    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);
    const isTeamLeader = existingTask.project_teamLeaderId === authUser.id;
    const isAssignee = existingTask.assignedToUserId === authUser.id;

    // Authorization check: Must be Admin, Team Leader of this project, or the Assigned Employee
    if (!isAdmin && !isTeamLeader && !isAssignee) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to modify another employee's task." },
        { status: 403 }
      );
    }

    // Security Rule: Admin cannot modify operational progress reports directly
    const isPureAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "FINANCE"].includes(authUser.role);
    if (isPureAdmin && !isTeamLeader && !isAssignee && (progress !== undefined || status)) {
      await logAuditEvent(
        authUser.id,
        "PROGRESS_UPDATE_REJECTED",
        `Rejected progress modification attempt by Admin (${authUser.email}) on Task (${existingTask.title}). Operational progress reports are protected.`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Administrators have read-only access to operational progress reports. Progress must be updated directly by the responsible Project Manager, Team Leader, or Assignee.",
        },
        { status: 403 }
      );
    }

    let nextStatus = existingTask.status;
    let nextProgress = existingTask.progress || 0;
    let nextBlocker = existingTask.blockerReason;
    let nextCompletedAt = existingTask.completedAt;
    let nextPriority = existingTask.priority;
    let nextSection = existingTask.section;
    let nextReviewNotes = existingTask.reviewNotes;
    let nextActualHours = existingTask.actualHours || 0;
    let nextDueDate = existingTask.dueDate;
    let nextAssignedTo = existingTask.assignedToUserId;

    // Employee Actions: Status transition & progress updates
    if (isAssignee && !isAdmin && !isTeamLeader) {
      if (status) {
        // Employees can move tasks between IN_PROGRESS, BLOCKED, IN_REVIEW
        // Or if submitting completed work for Team Leader review -> IN_REVIEW or COMPLETED
        nextStatus = status;
        if (status === "COMPLETED") {
          nextProgress = 100;
          nextCompletedAt = new Date();
        } else if (status === "IN_REVIEW") {
          nextProgress = progress !== undefined ? Math.min(100, Math.max(0, parseInt(progress))) : 90;
        } else if (status === "IN_PROGRESS") {
          if (existingTask.status === "ASSIGNED" || existingTask.status === "PENDING") {
            nextProgress = Math.max(nextProgress, 10);
          }
        }
      }
      if (progress !== undefined) {
        nextProgress = Math.min(100, Math.max(0, parseInt(progress)));
        if (nextProgress === 100 && nextStatus !== "COMPLETED") {
          nextStatus = "IN_REVIEW"; // Ready for TL review
        }
      }
      if (blockerReason !== undefined) nextBlocker = blockerReason;
      if (actualHours !== undefined) nextActualHours = parseFloat(actualHours);
    }

    // Team Leader or Admin Actions: Full management & Work Review
    if (isAdmin || isTeamLeader) {
      if (status) {
        nextStatus = status;
        if (status === "COMPLETED") {
          nextProgress = 100;
          nextCompletedAt = new Date();
          nextBlocker = null;
        } else if (status === "IN_PROGRESS" && existingTask.status === "IN_REVIEW") {
          // TL requesting changes/revisions
          nextProgress = progress !== undefined ? parseInt(progress) : 75;
          nextCompletedAt = null;
        }
      }
      if (progress !== undefined) nextProgress = Math.min(100, Math.max(0, parseInt(progress)));
      if (priority) nextPriority = priority;
      if (section) nextSection = section;
      if (reviewNotes !== undefined) nextReviewNotes = reviewNotes;
      if (blockerReason !== undefined) nextBlocker = blockerReason;
      if (actualHours !== undefined) nextActualHours = parseFloat(actualHours);
      if (dueDate) nextDueDate = new Date(dueDate);
      if (assignedToUserId) nextAssignedTo = assignedToUserId;
    }

    await queryDb(
      `UPDATE task SET
        status = ?, progress = ?, priority = ?, section = ?, reviewNotes = ?,
        blockerReason = ?, completedAt = ?, actualHours = ?, dueDate = ?, assignedToUserId = ?,
        updatedAt = NOW()
       WHERE id = ?`,
      [
        nextStatus,
        nextProgress,
        nextPriority,
        nextSection,
        nextReviewNotes,
        nextBlocker,
        nextCompletedAt,
        nextActualHours,
        nextDueDate,
        nextAssignedTo,
        id,
      ]
    );

    // Audit log & task history
    const historyAction =
      isTeamLeader || isAdmin
        ? nextStatus === "COMPLETED"
          ? "WORK_APPROVED"
          : "TASK_REVIEWED"
        : nextStatus === "IN_REVIEW"
        ? "WORK_SUBMITTED"
        : "STATUS_UPDATED";

    const historyDesc =
      notes ||
      (nextStatus === "COMPLETED"
        ? `Task approved and completed by ${(authUser as any).name || authUser.email}.`
        : nextStatus === "IN_REVIEW"
        ? `Work submitted for Team Leader review with ${nextProgress}% progress.`
        : `Task updated from ${existingTask.status} to ${nextStatus} (${nextProgress}%).`);

    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        `TH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        id,
        authUser.id,
        historyAction,
        existingTask.status,
        nextStatus,
        historyDesc,
      ]
    );

    clearQueryCache("task");
    clearQueryCache("project");

    return NextResponse.json({
      success: true,
      message: `✓ Task updated to ${nextStatus}!`,
      task: {
        id,
        status: nextStatus,
        progress: nextProgress,
        priority: nextPriority,
        section: nextSection,
        reviewNotes: nextReviewNotes,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update task." }, { status: 500 });
  }
}
