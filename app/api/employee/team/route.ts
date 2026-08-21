import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const SENIOR_MANAGEMENT_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "HR",
  "PROJECT_MANAGER",
  "TEAM_LEADER",
  "ADMIN_HR",
  "DIRECTOR",
  "FINANCE",
];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;

    // Resolve user to DB record
    const userRows = await queryDb<any[]>(
      `SELECT id, employeeId, name, email, role, departmentId FROM user WHERE id = ? OR employeeId = ? OR email = ? LIMIT 1`,
      [authUser.id, authUser.id, authUser.email]
    );
    const dbUser = userRows && userRows.length > 0 ? userRows[0] : authUser;
    const userId = dbUser.id;
    const userEmpId = dbUser.employeeId || dbUser.id;

    // 1. Find only projects that the Employee is legitimately assigned to
    const isSuperRole = ["SUPER_ADMIN", "DIRECTOR"].includes(dbUser.role);

    let projectIds: string[] = [];

    if (isSuperRole) {
      const allProjects = await queryDb<any[]>(`SELECT id FROM project ORDER BY createdAt DESC`);
      projectIds = (allProjects || []).map((p) => p.id);
    } else {
      // Find projects via task assignments
      const taskProjects = await queryDb<any[]>(
        `SELECT DISTINCT projectId FROM task WHERE (assignedToUserId = ? OR assignedToUserId = ?) AND projectId IS NOT NULL`,
        [userId, userEmpId]
      );
      const tpIds = (taskProjects || []).map((t) => t.projectId);

      // Find projects via member table
      const memberProjects = await queryDb<any[]>(
        `SELECT DISTINCT A as projectId FROM _assignedstaffprojects WHERE B = ? OR B = ?`,
        [userId, userEmpId]
      );
      const mpIds = (memberProjects || []).map((m) => m.projectId);

      projectIds = Array.from(new Set([...tpIds, ...mpIds]));
    }

    if (projectIds.length === 0) {
      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          employeeId: dbUser.employeeId,
          role: dbUser.role,
        },
        projects: [],
        message: "No team activity available.",
      });
    }

    // 2. Fetch project details with PM and TL info for plain leadership context
    const projectsData = await queryDb<any[]>(
      `SELECT 
        p.id, p.projectTitle, p.projectCode, p.description, p.clientCompany,
        p.status, p.priority, p.startDate, p.endDate, p.createdAt,
        pm.name AS pm_name, pm.employeeId AS pm_employeeId,
        tl.name AS tl_name, tl.employeeId AS tl_employeeId
      FROM project p
      LEFT JOIN user pm ON p.projectManagerId = pm.id
      LEFT JOIN user tl ON p.teamLeaderId = tl.id
      WHERE p.id IN (${projectIds.map(() => "?").join(",")})
      ORDER BY p.createdAt DESC`,
      projectIds
    );

    // 3. Fetch all tasks for these projects
    const allTasks = await queryDb<any[]>(
      `SELECT 
        t.id, t.title, t.description, t.section, t.status, t.priority, t.progress,
        t.startDate, t.dueDate, t.completedAt, t.estimatedHours, t.actualHours,
        t.blockerReason, t.projectId, t.createdAt, t.updatedAt,
        u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role
      FROM task t
      LEFT JOIN user u ON t.assignedToUserId = u.id
      WHERE t.projectId IN (${projectIds.map(() => "?").join(",")})
      ORDER BY t.section ASC, t.updatedAt DESC, t.createdAt DESC`,
      projectIds
    );

    // 4. Construct enriched project data
    const enrichedProjects = projectsData.map((proj) => {
      const projTasks = (allTasks || []).filter((t) => t.projectId === proj.id);

      // Real Project Progress
      const totalTasks = projTasks.length;
      const completedTasks = projTasks.filter((t) => t.status === "COMPLETED").length;
      const inProgressTasks = projTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const inReviewTasks = projTasks.filter((t) => t.status === "IN_REVIEW").length;
      const blockedTasks = projTasks.filter((t) => t.status === "BLOCKED").length;
      const pendingTasks = projTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED" || t.status === "TODO").length;

      const sumProgress = projTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
      const overallProgress = totalTasks > 0 ? Math.round(sumProgress / totalTasks) : 0;

      // 1. MY WORK: Tasks assigned to the logged-in employee
      const myWork = projTasks
        .filter((t) => t.user_id === userId || t.user_employeeId === userEmpId)
        .map((t) => ({
          id: t.id,
          title: t.title,
          section: t.section || "General",
          status: t.status,
          priority: t.priority,
          progress: t.progress || 0,
          dueDate: t.dueDate
            ? typeof t.dueDate === "string"
              ? t.dueDate.split("T")[0]
              : new Date(t.dueDate).toISOString().split("T")[0]
            : null,
          estimatedHours: t.estimatedHours || 8,
          actualHours: t.actualHours || 0,
        }));

      // 2. MY TEAMMATES: Real fellow project workers (excluding senior management roles)
      const teammateMap = new Map<string, any>();

      projTasks.forEach((t) => {
        if (!t.user_id) return;
        const roleUpper = (t.user_role || "EMPLOYEE").toUpperCase();

        // Strictly exclude senior management roles from the peer teammates table
        if (SENIOR_MANAGEMENT_ROLES.includes(roleUpper)) return;

        if (!teammateMap.has(t.user_id)) {
          teammateMap.set(t.user_id, {
            id: t.user_id,
            name: t.user_name || "Teammate",
            employeeId: t.user_employeeId || "EMP",
            role: "EMPLOYEE",
            projectName: proj.projectTitle,
            currentWork: t.title,
            status: t.status,
            progress: t.progress || 0,
            activeTasksCount: t.status !== "COMPLETED" ? 1 : 0,
            isMe: t.user_id === userId || t.user_employeeId === userEmpId,
          });
        } else {
          const existing = teammateMap.get(t.user_id);
          if (t.status !== "COMPLETED") {
            existing.activeTasksCount += 1;
            // Prefer showing an active task as current work
            if (existing.status === "COMPLETED") {
              existing.currentWork = t.title;
              existing.status = t.status;
              existing.progress = t.progress || 0;
            }
          }
        }
      });

      const myTeammates = Array.from(teammateMap.values());

      // 3. TEAM WORK: Grouped deliverables / sections
      const sectionMap = new Map<string, any[]>();
      projTasks.forEach((t) => {
        const sec = t.section || "General";
        if (!sectionMap.has(sec)) sectionMap.set(sec, []);
        sectionMap.get(sec)!.push({
          id: t.id,
          title: t.title,
          status: t.status,
          progress: t.progress || 0,
          assignedToName: t.user_name || "Unassigned",
          assignedToRole: "Employee",
          isMyTask: t.user_id === userId || t.user_employeeId === userEmpId,
        });
      });

      const teamWorkSections = Array.from(sectionMap.entries()).map(([name, tasks]) => {
        const secTotal = tasks.length;
        const secDone = tasks.filter((t) => t.status === "COMPLETED").length;
        const secProgress = secTotal > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / secTotal) : 0;
        return {
          name,
          total: secTotal,
          completed: secDone,
          progress: secProgress,
          tasks,
        };
      });

      return {
        id: proj.id,
        projectTitle: proj.projectTitle,
        projectCode: proj.projectCode,
        description: proj.description,
        clientCompany: proj.clientCompany,
        status: proj.status,
        projectManager: proj.pm_name
          ? `${proj.pm_name} (Project Manager)`
          : "Assigned Project Manager",
        teamLeader: proj.tl_name
          ? `${proj.tl_name} (Team Leader)`
          : "Designated Team Leader",
        progress: {
          overallProgress,
          completed: completedTasks,
          inProgress: inProgressTasks,
          inReview: inReviewTasks,
          blocked: blockedTasks,
          pending: pendingTasks,
          total: totalTasks,
        },
        myWork,
        myTeammates,
        teamWorkSections,
      };
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        employeeId: dbUser.employeeId,
        role: dbUser.role,
      },
      projects: enrichedProjects,
    });
  } catch (error: any) {
    console.error("Employee team API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load team data." },
      { status: 500 }
    );
  }
}
