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
    const dateParam = searchParams.get("date") || ""; // e.g. YYYY-MM-DD

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

    if (status && status !== "ALL") {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority && priority !== "ALL") {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (isBlockedParam) {
      sql += ` AND t.status = 'BLOCKED'`;
    }

    if (dateParam && dateParam !== "ALL") {
      sql += ` AND (
        DATE(t.dueDate) = ? 
        OR DATE(t.completedAt) = ? 
        OR DATE(t.updatedAt) = ?
        OR (DATE(t.createdAt) <= ? AND (t.status != 'COMPLETED' OR DATE(t.completedAt) >= ?))
      )`;
      params.push(dateParam, dateParam, dateParam, dateParam, dateParam);
    }

    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ? OR u.name LIKE ? OR u.employeeId LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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
        },
        createdById: r.createdById,
        creator: {
          name: r.creator_name,
          employeeId: r.creator_employeeId,
        },
        status: r.status,
        priority: r.priority,
        progress: r.progress,
        startDate: r.startDate,
        dueDate: r.dueDate,
        completedAt: r.completedAt,
        estimatedHours: r.estimatedHours,
        actualHours: r.actualHours,
        blockerReason: r.blockerReason,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isOverdue,
        overdueDays,
      };
    });

    const summary = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "ASSIGNED" || t.status === "PENDING" || t.status === "BACKLOG").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      inReview: tasks.filter((t) => t.status === "IN_REVIEW").length,
      blocked: tasks.filter((t) => t.status === "BLOCKED").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
      critical: tasks.filter((t) => t.priority === "CRITICAL").length,
      overdue: tasks.filter((t) => t.isOverdue).length,
      targetDate: dateParam || null,
    };

    return NextResponse.json({
      success: true,
      tasks,
      summary,
    });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "PROJECT_MANAGER", "ADMIN_HR"];

    if (!authResult.user || !adminRoles.includes(authResult.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Only admins/managers can create tasks." }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      projectId,
      assignedToUserId,
      priority = "MEDIUM",
      dueDate,
      estimatedHours = 8,
      startDate,
    } = body;

    if (!title || !assignedToUserId) {
      return NextResponse.json(
        { success: false, error: "Task title and assigned employee are required." },
        { status: 400 }
      );
    }

    const taskId = `TSK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    await queryDb(
      `INSERT INTO task (
        id, title, description, projectId, assignedToUserId, createdById,
        status, priority, progress, startDate, dueDate, estimatedHours, actualHours,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        'ASSIGNED', ?, 0, ?, ?, ?, 0,
        NOW(), NOW()
      )`,
      [
        taskId,
        title,
        description || null,
        projectId || null,
        assignedToUserId,
        authResult.user.id,
        priority,
        startDate || new Date().toISOString().split("T")[0],
        dueDate ? new Date(dueDate).toISOString().split("T")[0] : null,
        parseFloat(estimatedHours) || 8,
      ]
    );

    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'TASK_CREATED', NULL, 'ASSIGNED', ?, NOW())`,
      [
        `TH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        taskId,
        authResult.user.id,
        `Task "${title}" created and assigned by ${(authResult.user as any).name || authResult.user.email}.`,
      ]
    );

    clearQueryCache("task");

    return NextResponse.json({
      success: true,
      message: "✓ Task assigned successfully!",
      taskId,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to create task." }, { status: 500 });
  }
}
