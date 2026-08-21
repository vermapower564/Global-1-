import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);
    const isPM = authUser.role === "PROJECT_MANAGER" || isAdmin;

    if (!isPM) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Project Manager permissions required." },
        { status: 403 }
      );
    }

    // 1. Fetch Projects managed by this PM (or all projects if Admin)
    let pmProjects: any[] = [];
    if (isAdmin) {
      pmProjects = await queryDb<any[]>(
        `SELECT p.*, tl.name AS tl_name, tl.employeeId AS tl_employeeId, tl.email AS tl_email
         FROM project p
         LEFT JOIN user tl ON p.teamLeaderId = tl.id
         ORDER BY p.createdAt DESC`
      );
    } else {
      // Fetch projects where PM is assigned main tasks OR has members
      pmProjects = await queryDb<any[]>(
        `SELECT DISTINCT p.*, tl.name AS tl_name, tl.employeeId AS tl_employeeId, tl.email AS tl_email
         FROM project p
         LEFT JOIN user tl ON p.teamLeaderId = tl.id
         LEFT JOIN task t ON t.projectId = p.id
         WHERE t.assignedToUserId = ? OR p.teamLeaderId = ?
         ORDER BY p.createdAt DESC`,
        [authUser.id, authUser.id]
      );
    }

    const projectIds = (pmProjects || []).map((p) => p.id);

    // 2. Fetch Main Tasks assigned by Admin to this Project Manager
    let adminMainTasks: any[] = [];
    if (isAdmin) {
      adminMainTasks = await queryDb<any[]>(
        `SELECT t.*, p.projectTitle AS project_title, c.name AS creator_name, c.employeeId AS creator_employeeId,
                u.name AS pm_name, u.employeeId AS pm_employeeId, u.role AS pm_role,
                tl.name AS project_tl_name, tl.employeeId AS project_tl_employeeId, tl.id AS project_tl_id
         FROM task t
         LEFT JOIN project p ON t.projectId = p.id
         LEFT JOIN user c ON t.createdById = c.id
         LEFT JOIN user u ON t.assignedToUserId = u.id
         LEFT JOIN user tl ON p.teamLeaderId = tl.id
         WHERE t.isMainTask = 1 OR t.parentTaskId IS NULL
         ORDER BY t.createdAt DESC`
      );
    } else {
      adminMainTasks = await queryDb<any[]>(
        `SELECT t.*, p.projectTitle AS project_title, c.name AS creator_name, c.employeeId AS creator_employeeId,
                u.name AS pm_name, u.employeeId AS pm_employeeId, u.role AS pm_role,
                tl.name AS project_tl_name, tl.employeeId AS project_tl_employeeId, tl.id AS project_tl_id
         FROM task t
         LEFT JOIN project p ON t.projectId = p.id
         LEFT JOIN user c ON t.createdById = c.id
         LEFT JOIN user u ON t.assignedToUserId = u.id
         LEFT JOIN user tl ON p.teamLeaderId = tl.id
         WHERE (t.assignedToUserId = ? OR t.projectId IN (${projectIds.length > 0 ? projectIds.map(() => "?").join(",") : "''"}))
           AND (t.isMainTask = 1 OR t.parentTaskId IS NULL)
         ORDER BY t.createdAt DESC`,
        projectIds.length > 0 ? [authUser.id, ...projectIds] : [authUser.id]
      );
    }

    // 3. Fetch Work Sections assigned to Team Leaders (child tasks of main tasks)
    let workSections: any[] = [];
    if (projectIds.length > 0) {
      workSections = await queryDb<any[]>(
        `SELECT t.*, p.projectTitle AS project_title, mt.title AS main_task_title,
                tl.name AS tl_name, tl.employeeId AS tl_employeeId, tl.role AS tl_role
         FROM task t
         LEFT JOIN project p ON t.projectId = p.id
         LEFT JOIN task mt ON t.parentTaskId = mt.id
         LEFT JOIN user tl ON t.assignedToUserId = tl.id
         WHERE t.parentTaskId IS NOT NULL
           AND t.projectId IN (${projectIds.map(() => "?").join(",")})
         ORDER BY t.createdAt DESC`,
        projectIds
      );
    }

    // 4. Fetch Project Team Leaders
    let teamLeaders: any[] = [];
    if (projectIds.length > 0) {
      teamLeaders = await queryDb<any[]>(
        `SELECT DISTINCT tl.id, tl.name, tl.employeeId, tl.email, tl.role, tl.avatarUrl, p.id AS projectId, p.projectTitle
         FROM project p
         JOIN user tl ON p.teamLeaderId = tl.id
         WHERE p.id IN (${projectIds.map(() => "?").join(",")})`,
        projectIds
      );
    }
    if (teamLeaders.length === 0) {
      teamLeaders = await queryDb<any[]>(
        `SELECT id, name, employeeId, email, role, avatarUrl FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 ORDER BY name ASC`
      );
    }

    // 5. Fetch Blockers across PM's projects
    let projectBlockers: any[] = [];
    if (projectIds.length > 0) {
      projectBlockers = await queryDb<any[]>(
        `SELECT t.*, u.name AS user_name, u.employeeId AS user_employeeId, p.projectTitle AS project_title
         FROM task t
         LEFT JOIN user u ON t.assignedToUserId = u.id
         LEFT JOIN project p ON t.projectId = p.id
         WHERE t.status = 'BLOCKED'
           AND t.projectId IN (${projectIds.map(() => "?").join(",")})
         ORDER BY t.updatedAt DESC`,
        projectIds
      );
    }

    const summary = {
      activeProjectsCount: pmProjects.filter((p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE").length,
      mainTasksCount: adminMainTasks.length,
      pendingMainTasksCount: adminMainTasks.filter((t) => t.status === "ASSIGNED" || t.status === "NEW" || t.status === "PENDING").length,
      workSectionsCount: workSections.length,
      sectionsInProgress: workSections.filter((s) => s.status === "IN_PROGRESS" || s.status === "ASSIGNED").length,
      sectionsCompleted: workSections.filter((s) => s.status === "COMPLETED").length,
      blockersCount: projectBlockers.length,
      teamLeadersCount: teamLeaders.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      pmProjects: pmProjects.map((p) => ({
        id: p.id,
        projectTitle: p.projectTitle,
        description: p.description,
        clientCompany: p.clientCompany,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        teamLeader: {
          id: p.teamLeaderId,
          name: p.tl_name,
          employeeId: p.tl_employeeId,
          email: p.tl_email,
        },
      })),
      adminMainTasks: adminMainTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        section: t.section,
        projectId: t.projectId,
        projectTitle: t.project_title,
        priority: t.priority,
        status: t.status,
        progress: t.progress || 0,
        dueDate: t.dueDate,
        startDate: t.startDate,
        estimatedHours: t.estimatedHours,
        assignedBy: t.creator_name ? `${t.creator_name} (${t.creator_employeeId})` : "System Admin",
        projectTeamLeader: t.project_tl_id
          ? {
              id: t.project_tl_id,
              name: t.project_tl_name,
              employeeId: t.project_tl_employeeId,
            }
          : null,
      })),
      workSections: workSections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        section: s.section || "General",
        projectId: s.projectId,
        projectTitle: s.project_title,
        parentTaskId: s.parentTaskId,
        mainTaskTitle: s.main_task_title,
        priority: s.priority,
        status: s.status,
        progress: s.progress || 0,
        dueDate: s.dueDate,
        teamLeader: {
          id: s.assignedToUserId,
          name: s.tl_name,
          employeeId: s.tl_employeeId,
          role: s.tl_role,
        },
      })),
      teamLeaders,
      projectBlockers: projectBlockers.map((b) => ({
        id: b.id,
        title: b.title,
        blockerReason: b.blockerReason || "Blocker reported",
        projectTitle: b.project_title,
        reportedBy: `${b.user_name} (${b.user_employeeId})`,
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/project-manager/summary error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Project Manager summary." },
      { status: 500 }
    );
  }
}
