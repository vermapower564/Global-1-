import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedToUserId = searchParams.get("assignedToUserId") || searchParams.get("userId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search") || "";
    const isOverdueParam = searchParams.get("overdue") === "true";
    const isBlockedParam = searchParams.get("blocked") === "true";

    let sql = `
      SELECT 
        t.id, t.title, t.description, t.projectId, t.assignedToUserId, t.createdById,
        t.status, t.priority, t.progress, t.startDate, t.dueDate, t.completedAt,
        t.estimatedHours, t.actualHours, t.blockerReason, t.createdAt, t.updatedAt,
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role, u.departmentId AS user_departmentId,
        c.name AS creator_name, c.employeeId AS creator_employeeId,
        p.projectTitle AS project_title, p.status AS project_status
      FROM task t
      LEFT JOIN user u ON t.assignedToUserId = u.id
      LEFT JOIN user c ON t.createdById = c.id
      LEFT JOIN project p ON t.projectId = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based visibility scoping: individual workers only see their own tasks
    const roleStr = (authResult.user.role || "").toString();
    const isWorker = [
      "DEVELOPER",
      "UI_UX_DESIGNER",
      "GRAPHIC_DESIGNER",
      "VIDEO_EDITOR",
      "CAMERA_TEAM",
      "INTERN",
      "CONTENT_WRITER",
      "SEO_EXECUTIVE",
      "EMPLOYEE",
    ].includes(roleStr);

    if (isWorker) {
      sql += ` AND t.assignedToUserId = ?`;
      params.push(authResult.user.id);
    } else if (assignedToUserId) {
      sql += ` AND t.assignedToUserId = ?`;
      params.push(assignedToUserId);
    }

    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (isBlockedParam) {
      sql += ` AND t.status = 'BLOCKED'`;
    }

    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY FIELD(t.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), t.dueDate ASC`;

    const rawRows = await queryDbCached<any[]>(sql, params, 10);

    const now = new Date();

    const tasks = (rawRows || []).map((r) => {
      const dueDate = r.dueDate ? new Date(r.dueDate) : now;
      const isOverdue = r.status !== "COMPLETED" && r.status !== "CANCELLED" && dueDate < now;
      const overdueDays = isOverdue
        ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
        : 0;

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        projectId: r.projectId,
        project: r.project_title ? { id: r.projectId, projectTitle: r.project_title, status: r.project_status } : null,
        assignedToUserId: r.assignedToUserId,
        assignedToUser: {
          id: r.user_id,
          name: r.user_name,
          employeeId: r.user_employeeId,
          email: r.user_email,
          role: r.user_role,
          departmentId: r.user_departmentId,
        },
        createdById: r.createdById,
        createdBy: {
          id: r.createdById,
          name: r.creator_name,
          employeeId: r.creator_employeeId,
        },
        status: r.status,
        priority: r.priority,
        progress: r.progress || 0,
        startDate: r.startDate,
        dueDate: r.dueDate,
        completedAt: r.completedAt,
        estimatedHours: r.estimatedHours || 0,
        actualHours: r.actualHours || 0,
        blockerReason: r.blockerReason,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isOverdue,
        overdueDays,
      };
    });

    const finalTasks = isOverdueParam ? tasks.filter((t) => t.isOverdue) : tasks;

    const total = finalTasks.length;
    const inProgress = finalTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = finalTasks.filter((t) => t.status === "COMPLETED").length;
    const pending = finalTasks.filter((t) => t.status === "ASSIGNED" || t.status === "BACKLOG").length;
    const inReview = finalTasks.filter((t) => t.status === "IN_REVIEW").length;
    const blocked = finalTasks.filter((t) => t.status === "BLOCKED").length;
    const overdue = finalTasks.filter((t) => t.isOverdue).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let workloadLevel: "LOW" | "NORMAL" | "HIGH" | "OVERLOADED" = "NORMAL";
    const activeTaskCount = inProgress + pending + blocked + inReview;
    if (activeTaskCount === 0) workloadLevel = "LOW";
    else if (activeTaskCount <= 2) workloadLevel = "NORMAL";
    else if (activeTaskCount <= 4) workloadLevel = "HIGH";
    else workloadLevel = "OVERLOADED";

    return NextResponse.json({
      success: true,
      tasks: finalTasks,
      summary: {
        total,
        inProgress,
        completed,
        pending,
        inReview,
        blocked,
        overdue,
        completionRate,
        workloadLevel,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, assignedToUserId, priority, dueDate, estimatedHours, projectId } = body;

    if (!title || !assignedToUserId || !dueDate) {
      return NextResponse.json(
        { success: false, error: "Task title, assigned employee ID, and due date are required." },
        { status: 400 }
      );
    }

    const taskId = `TSK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const estHours = estimatedHours ? parseFloat(estimatedHours) : 8.0;
    const priorityVal = priority || "MEDIUM";
    const due = new Date(dueDate);

    // Insert Task directly into TiDB Cloud
    await queryDb(
      `INSERT INTO task (
        id, title, description, projectId, assignedToUserId, createdById,
        status, priority, progress, startDate, dueDate, completedAt,
        estimatedHours, actualHours, blockerReason, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'ASSIGNED', ?, 0, NOW(), ?, NULL, ?, 0, NULL, NOW(), NOW())`,
      [
        taskId,
        title.trim(),
        description ? description.trim() : null,
        projectId || null,
        assignedToUserId,
        authResult.user.id,
        priorityVal,
        due,
        estHours,
      ]
    );

    // Insert TaskHistory record
    const histId = `HIST-${Date.now()}`;
    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'ASSIGNED', NULL, 'ASSIGNED', ?, NOW())`,
      [
        histId,
        taskId,
        authResult.user.id,
        `Task created by ${authResult.user.email} and assigned to user ID ${assignedToUserId} with ${priorityVal} priority`,
      ]
    );

    // Invalidate task cache
    clearQueryCache("task");

    // Fetch newly created task with user details for immediate client return
    const [taskRow] = await queryDb<any[]>(
      `SELECT t.*, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email
       FROM task t
       LEFT JOIN user u ON t.assignedToUserId = u.id
       WHERE t.id = ?`,
      [taskId]
    );

    await logAuditEvent(
      authResult.user.id,
      "TASK_CREATED",
      `Task "${title.trim()}" assigned to employee ${taskRow?.user_name || assignedToUserId}`
    );

    return NextResponse.json({
      success: true,
      message: "✓ Task created & assigned successfully in TiDB Cloud!",
      task: {
        ...taskRow,
        assignedToUser: {
          id: taskRow?.assignedToUserId,
          name: taskRow?.user_name,
          employeeId: taskRow?.user_employeeId,
          email: taskRow?.user_email,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task." },
      { status: 500 }
    );
  }
}
