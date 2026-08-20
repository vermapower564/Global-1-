import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const assignedToUserId = searchParams.get("assignedToUserId") || searchParams.get("userId");
    const sectionParam = searchParams.get("section");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search") || "";
    const isOverdueParam = searchParams.get("overdue") === "true";
    const isBlockedParam = searchParams.get("blocked") === "true";
    const dateParam = searchParams.get("date") || "";

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    // Check which projects authUser is Team Leader of
    const ledProjectRows = await queryDb<any[]>(
      `SELECT id FROM project WHERE teamLeaderId = ?`,
      [authUser.id]
    );
    const ledProjectIds = (ledProjectRows || []).map((p) => p.id);

    let sql = `
      SELECT 
        t.id, t.title, t.description, t.section, t.reviewNotes, t.projectId, t.assignedToUserId, t.createdById,
        t.status, t.priority, t.progress, t.startDate, t.dueDate, t.completedAt,
        t.estimatedHours, t.actualHours, t.blockerReason, t.createdAt, t.updatedAt,
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role, u.avatarUrl AS user_avatarUrl,
        c.name AS creator_name, c.employeeId AS creator_employeeId,
        p.projectTitle AS project_title, p.status AS project_status, p.teamLeaderId AS project_teamLeaderId
      FROM task t
      LEFT JOIN user u ON t.assignedToUserId = u.id
      LEFT JOIN user c ON t.createdById = c.id
      LEFT JOIN project p ON t.projectId = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Authorization & Visibility Scoping:
    // 1. Admin: Can view all tasks or filter by assignedToUserId / projectId
    // 2. Team Leader of specific project: Can view all tasks in their led projects
    // 3. Normal Employee: Only sees tasks assigned directly to them
    if (!isAdmin) {
      if (projectIdParam && ledProjectIds.includes(projectIdParam)) {
        // User is Team Leader of this project -> allowed to see all tasks in this project
        sql += ` AND t.projectId = ?`;
        params.push(projectIdParam);
      } else if (ledProjectIds.length > 0 && !assignedToUserId) {
        // User is Team Leader of some projects -> sees own assigned tasks + tasks in their led projects
        sql += ` AND (t.assignedToUserId = ? OR t.projectId IN (${ledProjectIds.map(() => "?").join(",")}))`;
        params.push(authUser.id, ...ledProjectIds);
      } else {
        // Normal employee -> strictly own assigned tasks
        sql += ` AND t.assignedToUserId = ?`;
        params.push(authUser.id);
      }
    } else {
      if (projectIdParam) {
        sql += ` AND t.projectId = ?`;
        params.push(projectIdParam);
      }
      if (assignedToUserId && assignedToUserId !== "ALL") {
        sql += ` AND t.assignedToUserId = ?`;
        params.push(assignedToUserId);
      }
    }

    if (sectionParam && sectionParam !== "ALL") {
      sql += ` AND t.section = ?`;
      params.push(sectionParam);
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
      sql += ` AND (t.title LIKE ? OR t.description LIKE ? OR u.name LIKE ? OR u.employeeId LIKE ? OR t.section LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY FIELD(t.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), t.dueDate ASC`;

    const rawRows = await queryDbCached<any[]>(sql, params, 5);
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
        section: r.section || "General",
        reviewNotes: r.reviewNotes,
        projectId: r.projectId,
        project: r.project_title ? {
          id: r.projectId,
          projectTitle: r.project_title,
          status: r.project_status,
          teamLeaderId: r.project_teamLeaderId,
        } : null,
        assignedToUserId: r.assignedToUserId,
        assignedToUser: {
          id: r.user_id,
          name: r.user_name,
          employeeId: r.user_employeeId,
          email: r.user_email,
          role: r.user_role,
          avatarUrl: r.user_avatarUrl,
        },
        createdById: r.createdById,
        creator: {
          name: r.creator_name,
          employeeId: r.creator_employeeId,
        },
        status: r.status,
        priority: r.priority,
        progress: r.progress || 0,
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
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch tasks." }, { status: 500 });
  }
}

// POST: Team Leader or Admin creates and assigns a task to a project member
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json();
    const {
      title,
      description,
      projectId,
      section = "General",
      assignedToUserId,
      priority = "MEDIUM",
      status = "PENDING",
      dueDate,
      estimatedHours = 8,
      startDate,
    } = body;

    if (!title || !title.trim() || !assignedToUserId) {
      return NextResponse.json(
        { success: false, error: "Task title and assigned employee are required." },
        { status: 400 }
      );
    }

    const isAdmin = ADMIN_ROLES.includes(authUser.role);
    let isTeamLeader = false;

    if (projectId) {
      const pRows = await queryDb<any[]>(`SELECT id, teamLeaderId, projectTitle FROM project WHERE id = ? LIMIT 1`, [projectId]);
      if (pRows && pRows.length > 0 && pRows[0].teamLeaderId === authUser.id) {
        isTeamLeader = true;
      }
    }

    // Role check: Only Admin OR designated Team Leader of this project can create and assign tasks
    if (!isAdmin && !isTeamLeader) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Project Team Leaders and Admins can create and assign tasks." },
        { status: 403 }
      );
    }

    const taskId = `TSK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    await queryDb(
      `INSERT INTO task (
        id, title, description, section, projectId, assignedToUserId, createdById,
        status, priority, progress, startDate, dueDate, estimatedHours, actualHours,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 0, ?, ?, ?, 0,
        NOW(), NOW()
      )`,
      [
        taskId,
        title.trim(),
        description ? description.trim() : null,
        section ? section.trim() : "General",
        projectId || null,
        assignedToUserId,
        authUser.id,
        status,
        priority,
        startDate ? new Date(startDate) : new Date(),
        dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000),
        parseFloat(estimatedHours) || 8,
      ]
    );

    // If projectId provided, ensure assigned user is linked in _assignedstaffprojects
    if (projectId && assignedToUserId) {
      try {
        await queryDb(`INSERT IGNORE INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [projectId, assignedToUserId]);
      } catch {}
    }

    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'TASK_CREATED', NULL, ?, ?, NOW())`,
      [
        `TH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        taskId,
        authUser.id,
        status,
        `Task "${title.trim()}" in section "${section}" assigned by ${(authUser as any).name || authUser.email}.`,
      ]
    );

    clearQueryCache("task");
    clearQueryCache("project");

    logAuditEvent(
      authUser.id,
      "TASK_ASSIGNED",
      `Assigned task "${title.trim()}" in section "${section}" to user ${assignedToUserId}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      {
        success: true,
        message: "✓ Task assigned successfully!",
        taskId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to create task." }, { status: 500 });
  }
}
