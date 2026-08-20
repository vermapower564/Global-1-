import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb, queryDbCached } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    // 1. Fetch projects led by this user (or all projects if Admin)
    let ledProjects: any[] = [];
    if (isAdmin) {
      ledProjects = await queryDb<any[]>(
        `SELECT p.*, tl.name AS tl_name, tl.employeeId AS tl_employeeId, tl.email AS tl_email
         FROM project p
         LEFT JOIN user tl ON p.teamLeaderId = tl.id
         ORDER BY p.createdAt DESC`
      );
    } else {
      ledProjects = await queryDb<any[]>(
        `SELECT p.*, tl.name AS tl_name, tl.employeeId AS tl_employeeId, tl.email AS tl_email
         FROM project p
         LEFT JOIN user tl ON p.teamLeaderId = tl.id
         WHERE p.teamLeaderId = ?
         ORDER BY p.createdAt DESC`,
        [authUser.id]
      );
    }

    const ledProjectIds = (ledProjects || []).map((p) => p.id);
    const isTeamLeader = ledProjectIds.length > 0 || isAdmin;

    if (!isTeamLeader) {
      return NextResponse.json({
        success: true,
        isTeamLeader: false,
        message: "User is not currently designated as Team Leader for any projects.",
        summary: {
          newTasksCount: 0,
          activeProjectsCount: 0,
          teamMembersCount: 0,
          availableMembersCount: 0,
          workingMembersCount: 0,
          pendingReviewsCount: 0,
        },
        ledProjects: [],
        adminMainTasks: [],
        teamMembers: [],
        reviewTasks: [],
        teamProgress: [],
      });
    }

    // 2. Fetch Main Tasks assigned by Admin to this Team Leader
    const mainTasksSql = isAdmin
      ? `SELECT t.*, p.projectTitle AS project_title, c.name AS creator_name, c.employeeId AS creator_employeeId,
                u.name AS leader_name, u.employeeId AS leader_employeeId
         FROM task t
         LEFT JOIN project p ON t.projectId = p.id
         LEFT JOIN user c ON t.createdById = c.id
         LEFT JOIN user u ON t.assignedToUserId = u.id
         WHERE t.isMainTask = 1 OR (t.parentTaskId IS NULL AND t.projectId IS NOT NULL)
         ORDER BY t.createdAt DESC`
      : `SELECT t.*, p.projectTitle AS project_title, c.name AS creator_name, c.employeeId AS creator_employeeId,
                u.name AS leader_name, u.employeeId AS leader_employeeId
         FROM task t
         LEFT JOIN project p ON t.projectId = p.id
         LEFT JOIN user c ON t.createdById = c.id
         LEFT JOIN user u ON t.assignedToUserId = u.id
         WHERE (t.assignedToUserId = ? OR t.projectId IN (${ledProjectIds.map(() => "?").join(",")}))
           AND (t.isMainTask = 1 OR t.parentTaskId IS NULL)
         ORDER BY t.createdAt DESC`;

    const mainTaskParams = isAdmin ? [] : [authUser.id, ...ledProjectIds];
    const adminMainTasks = await queryDb<any[]>(mainTasksSql, mainTaskParams);

    // 3. Fetch all Subtasks across led projects
    let allSubtasks: any[] = [];
    if (ledProjectIds.length > 0) {
      allSubtasks = await queryDb<any[]>(
        `SELECT t.*, u.name AS user_name, u.employeeId AS user_employeeId, u.role AS user_role, u.avatarUrl AS user_avatarUrl,
                p.projectTitle AS project_title, mt.title AS parent_task_title
         FROM task t
         LEFT JOIN user u ON t.assignedToUserId = u.id
         LEFT JOIN project p ON t.projectId = p.id
         LEFT JOIN task mt ON t.parentTaskId = mt.id
         WHERE t.projectId IN (${ledProjectIds.map(() => "?").join(",")})
         ORDER BY t.createdAt DESC`,
        ledProjectIds
      );
    }

    // 4. Fetch unique Project Members belonging to these led projects
    let memberRows: any[] = [];
    if (ledProjectIds.length > 0) {
      memberRows = await queryDb<any[]>(
        `SELECT DISTINCT asp.A AS projectId, u.id, u.name, u.employeeId, u.email, u.role, u.avatarUrl, d.name AS departmentName
         FROM _assignedstaffprojects asp
         JOIN user u ON asp.B = u.id
         LEFT JOIN department d ON u.departmentId = d.id
         WHERE asp.A IN (${ledProjectIds.map(() => "?").join(",")}) AND u.isActive = 1`,
        ledProjectIds
      );
    }

    // Deduplicate members and calculate real workload & availability
    const uniqueMemberMap: Record<string, any> = {};
    memberRows.forEach((m) => {
      if (!uniqueMemberMap[m.id]) {
        uniqueMemberMap[m.id] = {
          id: m.id,
          name: m.name,
          employeeId: m.employeeId,
          email: m.email,
          role: m.role ? m.role.replace(/_/g, " ") : "Member",
          department: m.departmentName || "Engineering",
          avatar: m.avatarUrl,
          projects: [],
          activeTasks: [],
          currentWork: "—",
          workloadStatus: "AVAILABLE", // AVAILABLE | BUSY | OVERLOADED
        };
      }
      uniqueMemberMap[m.id].projects.push(m.projectId);
    });

    // Populate active tasks per member
    allSubtasks.forEach((t) => {
      const uid = t.assignedToUserId;
      if (uniqueMemberMap[uid]) {
        const isActive = t.status === "IN_PROGRESS" || t.status === "ASSIGNED" || t.status === "PENDING" || t.status === "UNDER_REVIEW" || t.status === "IN_REVIEW";
        if (isActive) {
          uniqueMemberMap[uid].activeTasks.push(t);
          if (t.status === "IN_PROGRESS" || t.status === "IN_REVIEW") {
            uniqueMemberMap[uid].currentWork = `${t.section ? `[${t.section}] ` : ""}${t.title}`;
          }
        }
      }
    });

    // Calculate Availability
    let availableMembersCount = 0;
    let workingMembersCount = 0;

    const teamMembers = Object.values(uniqueMemberMap).map((m: any) => {
      const count = m.activeTasks.length;
      let status: "AVAILABLE" | "BUSY" | "OVERLOADED" = "AVAILABLE";
      if (count === 0) {
        status = "AVAILABLE";
        availableMembersCount++;
      } else if (count <= 3) {
        status = "BUSY";
        workingMembersCount++;
      } else {
        status = "OVERLOADED";
        workingMembersCount++;
      }

      return {
        ...m,
        activeTaskCount: count,
        workloadStatus: status,
      };
    });

    // 5. Review Tasks (tasks in UNDER_REVIEW or IN_REVIEW)
    const reviewTasks = allSubtasks.filter(
      (t) => t.status === "UNDER_REVIEW" || t.status === "IN_REVIEW"
    );

    // 6. New Tasks assigned by Admin (status === 'NEW' or 'ASSIGNED' and createdById != authUser.id)
    const newAdminTasks = (adminMainTasks || []).filter(
      (t) => t.status === "NEW" || (t.status === "ASSIGNED" && t.createdById !== authUser.id)
    );

    const summary = {
      newTasksCount: newAdminTasks.length,
      activeProjectsCount: ledProjects.filter((p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE").length,
      teamMembersCount: teamMembers.length,
      availableMembersCount,
      workingMembersCount,
      pendingReviewsCount: reviewTasks.length,
    };

    return NextResponse.json({
      success: true,
      isTeamLeader: true,
      summary,
      ledProjects: ledProjects.map((p) => ({
        id: p.id,
        projectTitle: p.projectTitle,
        description: p.description,
        clientCompany: p.clientCompany,
        startDate: p.startDate,
        endDate: p.endDate,
        contractValue: p.contractValue,
        status: p.status,
        teamLeader: {
          id: p.teamLeaderId,
          name: p.tl_name,
          employeeId: p.tl_employeeId,
          email: p.tl_email,
        },
      })),
      adminMainTasks: (adminMainTasks || []).map((t) => ({
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
      })),
      teamMembers,
      reviewTasks: reviewTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        section: t.section || "General",
        projectId: t.projectId,
        projectTitle: t.project_title,
        assignedToUser: {
          id: t.assignedToUserId,
          name: t.user_name,
          employeeId: t.user_employeeId,
          role: t.user_role,
          avatarUrl: t.user_avatarUrl,
        },
        priority: t.priority,
        status: t.status,
        progress: t.progress || 0,
        reviewNotes: t.reviewNotes,
        updatedAt: t.updatedAt,
      })),
      teamProgress: allSubtasks.map((t) => ({
        id: t.id,
        title: t.title,
        section: t.section || "General",
        projectId: t.projectId,
        projectTitle: t.project_title,
        parentTaskTitle: t.parent_task_title,
        assignedToUser: {
          id: t.assignedToUserId,
          name: t.user_name,
          employeeId: t.user_employeeId,
          role: t.user_role,
        },
        priority: t.priority,
        status: t.status,
        progress: t.progress || 0,
        dueDate: t.dueDate,
        blockerReason: t.blockerReason,
        reviewNotes: t.reviewNotes,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/team-leader/summary error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch team leader summary." }, { status: 500 });
  }
}
