import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "PROJECT_MANAGER"];

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

    const isPureAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "FINANCE"].includes(authUser.role);
    const canStartTask = (isAssignee || isTeamLeader) && !isPureAdmin && authUser.role !== "PROJECT_MANAGER";
    const canEditProgress = (isAssignee || isTeamLeader) && !isPureAdmin && authUser.role !== "PROJECT_MANAGER";

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
      manualProjectName: t.manualProjectName || null,
      projectSource: t.project_id ? "Existing Project" : (t.manualProjectName ? "Manually Entered" : "None"),
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
        source: "Existing Project",
      } : (t.manualProjectName ? {
        id: null,
        projectTitle: t.manualProjectName,
        source: "Manually Entered",
      } : null),
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
      canStartTask,
      canEditProgress,
      isObserver: isPureAdmin || authUser.role === "PROJECT_MANAGER",
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
    if (!id || id === "undefined") {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

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
      `SELECT t.*, p.teamLeaderId AS project_teamLeaderId, p.projectManagerId AS project_projectManagerId
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

    const authUserRows = await queryDb<any[]>(
      `SELECT id, employeeId, role FROM user WHERE id = ? OR employeeId = ? OR email = ? LIMIT 1`,
      [authUser.id, authUser.id, authUser.email]
    );
    const resolvedAuth = authUserRows && authUserRows.length > 0 ? authUserRows[0] : authUser;

    const isAdmin = ADMIN_ROLES.includes(resolvedAuth.role || authUser.role);
    const isTeamLeader =
      existingTask.project_teamLeaderId === authUser.id ||
      existingTask.project_teamLeaderId === resolvedAuth.id ||
      existingTask.project_teamLeaderId === resolvedAuth.employeeId ||
      existingTask.createdById === authUser.id ||
      existingTask.createdById === resolvedAuth.id ||
      resolvedAuth.role === "TEAM_LEADER";
    const isProjectManager =
      existingTask.project_projectManagerId === authUser.id ||
      existingTask.project_projectManagerId === resolvedAuth.id ||
      resolvedAuth.role === "PROJECT_MANAGER";
    const isAssignee =
      existingTask.assignedToUserId === authUser.id ||
      existingTask.assignedToUserId === resolvedAuth.id ||
      existingTask.assignedToUserId === resolvedAuth.employeeId;

    // Authorization check: Must be Admin, Team Leader, Project Manager, or the Assigned Employee
    if (!isAdmin && !isTeamLeader && !isProjectManager && !isAssignee) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to modify another employee's task." },
        { status: 403 }
      );
    }

    // Security Rule: Admin and PM cannot execute or modify operational progress/status directly
    const isPureAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "FINANCE"].includes(authUser.role);
    const isProjectManagerObserver = authUser.role === "PROJECT_MANAGER" && !isAssignee && !isTeamLeader;

    if (action === "START_TASK") {
      if (isPureAdmin || isProjectManagerObserver) {
        await logAuditEvent(
          authUser.id,
          "START_TASK_REJECTED",
          `Rejected attempt to start task (${existingTask.title}) by user with role ${authUser.role}. Only assigned Team Leaders and Employees can start tasks.`,
          request.headers.get("x-forwarded-for") || "127.0.0.1"
        );
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Administrators and Project Managers cannot execute or start operational tasks. Task execution is restricted to assigned Team Leaders and Employees.",
          },
          { status: 403 }
        );
      }
    }

    if ((isPureAdmin || isProjectManagerObserver) && (progress !== undefined || status !== undefined)) {
      await logAuditEvent(
        authUser.id,
        "PROGRESS_UPDATE_REJECTED",
        `Rejected progress/status modification attempt by Admin/PM (${authUser.email}) on Task (${existingTask.title}). Operational progress reports are protected.`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Administrators and Project Managers have read-only observer access to operational task execution. Progress and status must be updated directly by the responsible Team Leader or assigned Employee.",
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
    let nextProjectId = existingTask.projectId;
    let nextManualProjectName = existingTask.manualProjectName;

    // Handle START_TASK action for assigned Employee or Team Leader
    if (action === "START_TASK") {
      nextStatus = "IN_PROGRESS";
      if (nextProgress === 0) nextProgress = 10;
    }

    // Handle manual vs existing project updates
    if (body.projectId !== undefined || body.manualProjectName !== undefined) {
      if (body.projectId === "__MANUAL__" || (!body.projectId && body.manualProjectName)) {
        if (!body.manualProjectName || !body.manualProjectName.trim()) {
          return NextResponse.json({ success: false, error: "Please enter a project name." }, { status: 400 });
        }
        nextProjectId = null;
        nextManualProjectName = body.manualProjectName.trim();
      } else if (body.projectId && body.projectId !== "__MANUAL__") {
        nextProjectId = body.projectId;
        nextManualProjectName = null;
      }
    }

    // Employee Actions: Status transition & progress updates
    if (isAssignee && !isAdmin && !isTeamLeader && !isProjectManager) {
      if (status) {
        if (status === "COMPLETED") {
          // Employees cannot self-approve task completion; automatically route for Team Leader review
          nextStatus = "IN_REVIEW";
          nextProgress = progress !== undefined ? Math.min(99, Math.max(0, parseInt(progress))) : 90;
        } else {
          nextStatus = status;
          if (status === "IN_REVIEW") {
            nextProgress = progress !== undefined ? Math.min(99, Math.max(0, parseInt(progress))) : 90;
          } else if (status === "IN_PROGRESS") {
            if (existingTask.status === "ASSIGNED" || existingTask.status === "PENDING") {
              nextProgress = Math.max(nextProgress, 10);
            }
          }
        }
      }
      if (progress !== undefined) {
        nextProgress = Math.min(99, Math.max(0, parseInt(progress)));
        if (nextProgress >= 90 && nextStatus === "COMPLETED") {
          nextStatus = "IN_REVIEW";
        }
      }
      if (blockerReason !== undefined) nextBlocker = blockerReason;
      if (actualHours !== undefined) nextActualHours = parseFloat(actualHours);
    }

    // Team Leader Actions: Full execution & Work Review
    if ((isTeamLeader || isAdmin || isProjectManager) && !isPureAdmin) {
      if (status) {
        nextStatus = status;
        if (status === "COMPLETED") {
          nextProgress = 100;
          nextCompletedAt = new Date();
          nextBlocker = null;
        } else if (status === "IN_PROGRESS" && existingTask.status === "IN_REVIEW") {
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
    }

    // Strict RBAC: Employees cannot assign, reassign, transfer, or change task owner
    if (assignedToUserId && assignedToUserId !== existingTask.assignedToUserId && !isAdmin && !isTeamLeader && !isProjectManager) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Employees cannot assign, reassign, or transfer tasks to other users." },
        { status: 403 }
      );
    }

    // Administrative metadata updates (priority, dates, reassignment)
    if (isAdmin || isProjectManager || isTeamLeader) {
      if (priority) nextPriority = priority;
      if (section) nextSection = section;
      if (dueDate) nextDueDate = new Date(dueDate);
      if (assignedToUserId && assignedToUserId !== existingTask.assignedToUserId) {
        const uRows = await queryDb<any[]>(`SELECT id, role, isActive, isResigned FROM user WHERE id = ? OR employeeId = ? LIMIT 1`, [assignedToUserId, assignedToUserId]);
        if (!uRows || uRows.length === 0) {
          return NextResponse.json({ success: false, error: "Target assignee not found." }, { status: 404 });
        }
        if (uRows[0].isActive === 0 || uRows[0].isResigned === 1) {
          return NextResponse.json({ success: false, error: "Cannot reassign task to a deactivated or resigned employee." }, { status: 400 });
        }
        nextAssignedTo = uRows[0].id;
      }
    }

    await queryDb(
      `UPDATE task SET
        status = ?, progress = ?, priority = ?, section = ?, reviewNotes = ?,
        blockerReason = ?, completedAt = ?, actualHours = ?, dueDate = ?, assignedToUserId = ?,
        projectId = ?, manualProjectName = ?,
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
        nextProjectId,
        nextManualProjectName,
        id,
      ]
    );

    const userLookupRows = await queryDb<any[]>(
      `SELECT id, name, employeeId, role FROM user WHERE id = ? OR employeeId = ? OR email = ? LIMIT 1`,
      [authUser.id, authUser.id, authUser.email]
    );
    const resolvedUser = userLookupRows && userLookupRows.length > 0 ? userLookupRows[0] : {
      id: authUser.id,
      name: authUser.email.split("@")[0],
      employeeId: authUser.id,
      role: authUser.role,
    };

    // Notifications for Status Transitions (Prevent duplicate notifications on unchanged status)
    if (existingTask.status !== nextStatus) {
      try {
        // 1. Employee Submits Completion for Review -> Notify Team Leader / PM
        if (nextStatus === "IN_REVIEW") {
          const reviewerId = existingTask.project_teamLeaderId || existingTask.project_projectManagerId || existingTask.createdById;
          if (reviewerId && reviewerId !== authUser.id) {
            const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
            await queryDb(
              `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
               VALUES (?, ?, ?, ?, 'INFO', 0, '/team-leader/tasks', NOW(3))`,
              [
                notifId,
                reviewerId,
                `📋 Task Completion Submitted: ${existingTask.title}`,
                `${resolvedUser.name} submitted task "${existingTask.title}" for review & approval.`,
              ]
            );
          }
        }

        // 2. Team Leader / PM Approves Task (COMPLETED) -> Notify Assigned Employee
        if (nextStatus === "COMPLETED" && existingTask.assignedToUserId) {
          if (existingTask.assignedToUserId !== authUser.id) {
            const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
            await queryDb(
              `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
               VALUES (?, ?, ?, ?, 'SUCCESS', 0, '/employee/tasks', NOW(3))`,
              [
                notifId,
                existingTask.assignedToUserId,
                `🎉 Task Approved & Completed: ${existingTask.title}`,
                `Your task "${existingTask.title}" has been approved and marked as COMPLETED by ${resolvedUser.name}.`,
              ]
            );
          }
        }

        // 3. Team Leader / PM Rejects Task or Requests Revisions -> Notify Assigned Employee
        if (existingTask.status === "IN_REVIEW" && (nextStatus === "IN_PROGRESS" || nextStatus === "BLOCKED")) {
          if (existingTask.assignedToUserId && existingTask.assignedToUserId !== authUser.id) {
            const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
            await queryDb(
              `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
               VALUES (?, ?, ?, ?, 'WARNING', 0, '/employee/tasks', NOW(3))`,
              [
                notifId,
                existingTask.assignedToUserId,
                `⚠️ Task Review Feedback: ${existingTask.title}`,
                `Your task "${existingTask.title}" requires revisions. Feedback: "${nextReviewNotes || 'Please check task review notes'}"`,
              ]
            );
          }
        }
      } catch (notifErr) {
        console.warn("Notification dispatch warning:", notifErr);
      }
    }

    const formatRole = (r: string) => {
      const u = (r || "").toUpperCase();
      if (u === "SUPER_ADMIN") return "Super Admin";
      if (u === "ADMIN_HR") return "Admin";
      if (u === "PROJECT_MANAGER") return "Project Manager";
      if (u === "TEAM_LEADER") return "Team Leader";
      if (u === "DEVELOPER") return "Developer";
      if (u === "EMPLOYEE") return "Employee";
      if (u === "HR") return "HR";
      return r.replace(/_/g, " ");
    };
    const formattedUserWithRole = `${resolvedUser.name} (${formatRole(resolvedUser.role)})`;

    // Audit log & task history
    const isProgressChange = nextProgress !== existingTask.progress;
    const historyAction = isProgressChange
      ? "PROGRESS_UPDATED"
      : isTeamLeader || isAdmin
      ? nextStatus === "COMPLETED"
        ? "WORK_APPROVED"
        : "TASK_REVIEWED"
      : nextStatus === "IN_REVIEW"
      ? "WORK_SUBMITTED"
      : "STATUS_UPDATED";

    const historyDesc =
      notes ||
      (isProgressChange
        ? `${formattedUserWithRole} updated progress: ${existingTask.progress}% → ${nextProgress}%.`
        : nextStatus === "COMPLETED"
        ? `Task approved and completed by ${formattedUserWithRole}.`
        : nextStatus === "IN_REVIEW"
        ? `Work submitted for Team Leader review with ${nextProgress}% progress.`
        : `Task updated from ${existingTask.status} to ${nextStatus} (${nextProgress}%).`);

    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        `TH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase(),
        id,
        resolvedUser.id,
        historyAction,
        isProgressChange ? `${existingTask.progress}%` : existingTask.status,
        isProgressChange ? `${nextProgress}%` : nextStatus,
        historyDesc,
      ]
    );

    // Record in immutable auditlog
    await logAuditEvent(
      resolvedUser.id,
      isProgressChange ? "PROGRESS_UPDATED" : historyAction,
      isProgressChange
        ? `${formattedUserWithRole} updated task "${existingTask.title}" progress: ${existingTask.progress}% → ${nextProgress}% (Project: ${existingTask.projectId || existingTask.manualProjectName || "Standalone"})`
        : `${formattedUserWithRole} updated task "${existingTask.title}" status to ${nextStatus}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
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
