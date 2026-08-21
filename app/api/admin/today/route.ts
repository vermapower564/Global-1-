import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb, queryDbCached } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR", "ADMIN"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    if (!ADMIN_ROLES.includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin authorization required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "ALL"; // 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ASSIGNED' | 'PENDING'
    const searchQuery = searchParams.get("search") || "";

    // 1. Live Aggregated Summary Counts from TiDB
    const [
      empRows,
      presentRows,
      workingRows,
      inProgressTodayRows,
      completedTodayRows,
      blockedRows,
      allInProgressRows,
      totalTasksRows,
      allCompletedTasksRows,
    ]: any[] = await Promise.all([
      // Total Active Employees
      queryDbCached(`SELECT COUNT(*) as count FROM user WHERE isActive = 1`, [], 10),
      // Present Today
      queryDbCached(`SELECT COUNT(DISTINCT userId) as count FROM attendance WHERE DATE(date) = CURDATE()`, [], 5),
      // Currently Working (Checked in today, not checked out)
      queryDbCached(`SELECT COUNT(DISTINCT userId) as count FROM attendance WHERE DATE(date) = CURDATE() AND checkOutTime IS NULL`, [], 5),
      // Today's IN PROGRESS work/tasks (updated or active today)
      queryDbCached(
        `SELECT COUNT(*) as count FROM task 
         WHERE status = 'IN_PROGRESS' 
         AND (DATE(updatedAt) = CURDATE() OR DATE(startDate) = CURDATE() OR DATE(createdAt) = CURDATE())`,
        [],
        5
      ),
      // Completed Today
      queryDbCached(
        `SELECT COUNT(*) as count FROM task 
         WHERE status = 'COMPLETED' 
         AND (DATE(completedAt) = CURDATE() OR DATE(updatedAt) = CURDATE())`,
        [],
        5
      ),
      // Blocked
      queryDbCached(`SELECT COUNT(*) as count FROM task WHERE status = 'BLOCKED'`, [], 5),
      // All-Time Active IN PROGRESS tasks
      queryDbCached(`SELECT COUNT(*) as count FROM task WHERE status = 'IN_PROGRESS'`, [], 5),
      // Total Tasks
      queryDbCached(`SELECT COUNT(*) as count FROM task`, [], 10),
      // Total Completed Tasks
      queryDbCached(`SELECT COUNT(*) as count FROM task WHERE status = 'COMPLETED'`, [], 10),
    ]);

    const totalEmployees = Number(empRows?.[0]?.count || 0);
    const presentToday = Number(presentRows?.[0]?.count || 0);
    const currentlyWorking = Number(workingRows?.[0]?.count || 0);
    const inProgressToday = Number(inProgressTodayRows?.[0]?.count || 0);
    const completedToday = Number(completedTodayRows?.[0]?.count || 0);
    const blockedToday = Number(blockedRows?.[0]?.count || 0);
    const totalInProgress = Number(allInProgressRows?.[0]?.count || inProgressToday);
    const totalTasks = Number(totalTasksRows?.[0]?.count || 0);
    const totalCompleted = Number(allCompletedTasksRows?.[0]?.count || 0);

    // 2. Fetch Detailed Today's Work / Task Items
    let taskSql = `
      SELECT 
        t.id, t.title, t.description, t.projectId, t.assignedToUserId, t.createdById,
        t.status, t.priority, t.progress, t.startDate, t.dueDate, t.completedAt,
        t.estimatedHours, t.actualHours, t.blockerReason, t.createdAt, t.updatedAt,
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role,
        p.projectTitle AS project_title, p.status AS project_status
      FROM task t
      LEFT JOIN user u ON t.assignedToUserId = u.id
      LEFT JOIN project p ON t.projectId = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by Today's Activity or Today's Date
    taskSql += ` AND (
      DATE(t.updatedAt) = CURDATE() 
      OR DATE(t.startDate) = CURDATE() 
      OR DATE(t.dueDate) = CURDATE() 
      OR (t.status = 'IN_PROGRESS' AND DATE(t.createdAt) <= CURDATE())
      OR (t.status = 'BLOCKED')
    )`;

    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "IN_PROGRESS") {
        taskSql += ` AND t.status = 'IN_PROGRESS'`;
      } else if (statusFilter === "COMPLETED") {
        taskSql += ` AND t.status = 'COMPLETED'`;
      } else if (statusFilter === "BLOCKED") {
        taskSql += ` AND t.status = 'BLOCKED'`;
      } else if (statusFilter === "PENDING" || statusFilter === "ASSIGNED") {
        taskSql += ` AND (t.status = 'ASSIGNED' OR t.status = 'PENDING' OR t.status = 'BACKLOG')`;
      } else {
        taskSql += ` AND t.status = ?`;
        params.push(statusFilter);
      }
    }

    if (searchQuery.trim()) {
      taskSql += ` AND (t.title LIKE ? OR t.description LIKE ? OR u.name LIKE ? OR u.employeeId LIKE ? OR p.projectTitle LIKE ?)`;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    taskSql += ` ORDER BY FIELD(t.status, 'IN_PROGRESS', 'BLOCKED', 'ASSIGNED', 'COMPLETED'), t.updatedAt DESC`;

    const rawTasks = await queryDb<any[]>(taskSql, params);

    const tasks = (rawTasks || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      projectId: r.projectId,
      project: r.project_title ? { id: r.projectId, projectTitle: r.project_title, status: r.project_status } : null,
      assignedToUserId: r.assignedToUserId,
      assignedToUser: {
        id: r.user_id,
        name: r.user_name || "Unassigned",
        employeeId: r.user_employeeId || "EMP001",
        email: r.user_email,
        role: r.user_role,
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
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalEmployees,
        presentToday,
        currentlyWorking,
        inProgress: inProgressToday,
        completed: completedToday,
        blocked: blockedToday,
        totalInProgress,
        totalTasks,
        totalCompleted,
      },
      tasks,
    });
  } catch (error: any) {
    console.error("GET /api/admin/today error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load today data." },
      { status: 500 }
    );
  }
}
