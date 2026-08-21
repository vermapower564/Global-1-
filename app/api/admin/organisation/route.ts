import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "PROJECT_MANAGER"];

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    if (!ADMIN_ROLES.includes(roleUpper)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // 1. Fetch Users strictly with professional/work fields (NO salary, bank, password, address)
    const users: any[] = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.role, u.departmentId,
              u.joiningDate, u.isActive, u.avatarUrl, u.skills, u.experienceYears,
              d.name as departmentName
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       ORDER BY u.name ASC`
    );

    // 2. Fetch Projects with metadata
    const projects: any[] = await queryDb<any[]>(
      `SELECT p.id, p.projectCode, p.projectTitle, p.description, p.clientCompany,
              p.startDate, p.endDate, p.status, p.priority, p.projectType,
              p.projectManagerId, p.teamLeaderId, p.requiredSkills, p.expectedTeamSize,
              tl.name as teamLeaderName, tl.employeeId as teamLeaderEmpId, tl.avatarUrl as teamLeaderAvatar
       FROM project p
       LEFT JOIN user tl ON p.teamLeaderId = tl.id
       ORDER BY p.createdAt DESC`
    );

    // 3. Fetch Project Member Mappings
    const projectMembersMap: any[] = await queryDb<any[]>(
      `SELECT A as projectId, B as userId FROM _assignedstaffprojects`
    );

    // 4. Fetch Tasks with progress & status
    const tasks: any[] = await queryDb<any[]>(
      `SELECT t.id, t.title, t.description, t.section, t.status, t.priority,
              t.progress, t.startDate, t.dueDate, t.completedAt, t.projectId,
              t.assignedToUserId, t.estimatedHours, t.actualHours, t.blockerReason
       FROM task t
       ORDER BY t.dueDate ASC`
    );

    // 5. Fetch Daily Work Updates (Latest updates only)
    const workUpdates: any[] = await queryDb<any[]>(
      `SELECT dw.id, dw.userId, dw.projectId, dw.date, dw.hoursWorked,
              dw.description, dw.achievements, dw.blockers, dw.tomorrowPlan,
              dw.status, dw.rating, dw.submittedAt
       FROM dailyworkupdate dw
       ORDER BY dw.date DESC, dw.submittedAt DESC`
    );

    const now = new Date();

    // Map projects with member users
    const enrichedProjects = projects.map((p) => {
      const memberUserIds = projectMembersMap.filter((m) => m.projectId === p.id).map((m) => m.userId);
      const members = users.filter((u) => memberUserIds.includes(u.id));
      const pTasks = tasks.filter((t) => t.projectId === p.id);

      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter((t) => t.status === "COMPLETED").length;
      const inProgressTasks = pTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const blockedTasks = pTasks.filter((t) => t.status === "BLOCKED").length;
      const inReviewTasks = pTasks.filter((t) => t.status === "IN_REVIEW").length;

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.status === "COMPLETED" ? 100 : 0);

      let projectHealth: "HEALTHY" | "AT_RISK" | "CRITICAL" = "HEALTHY";
      const isOverdue = p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED";
      const daysRemaining = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24)) : 30;

      if (isOverdue || blockedTasks >= 2 || (totalTasks > 0 && progress < 40 && daysRemaining <= 7)) {
        projectHealth = "CRITICAL";
      } else if (blockedTasks >= 1 || (totalTasks > 0 && progress < 60 && daysRemaining <= 14) || daysRemaining <= 3) {
        projectHealth = "AT_RISK";
      }

      return {
        ...p,
        members,
        memberCount: members.length,
        progress,
        projectHealth,
        daysRemaining,
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          inReviewTasks,
        },
      };
    });

    // -------------------------------------------------------------
    // 1. Process Project Managers
    // -------------------------------------------------------------
    const projectManagers = users
      .filter((u) => u.role === "PROJECT_MANAGER")
      .map((pm) => {
        const managedProjects = enrichedProjects.filter(
          (p) => p.projectManagerId === pm.id || (!p.projectManagerId && p.teamLeaderId === pm.id)
        );

        const activeProjects = managedProjects.filter((p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS");
        const completedProjects = managedProjects.filter((p) => p.status === "COMPLETED");

        const pmTasks = tasks.filter((t) => managedProjects.some((p) => p.id === t.projectId));
        const totalTasks = pmTasks.length;
        const completedTasks = pmTasks.filter((t) => t.status === "COMPLETED").length;
        const blockedTasks = pmTasks.filter((t) => t.status === "BLOCKED").length;

        const avgProgress =
          managedProjects.length > 0
            ? Math.round(managedProjects.reduce((acc, p) => acc + p.progress, 0) / managedProjects.length)
            : 0;

        // Team Leaders under this PM
        const tlIds = Array.from(new Set(managedProjects.map((p) => p.teamLeaderId).filter(Boolean)));
        const managedTeamLeaders = users.filter((u) => tlIds.includes(u.id));

        const activeTasksCount = pmTasks.filter((t) => ["IN_PROGRESS", "ASSIGNED", "IN_REVIEW"].includes(t.status)).length;
        const workloadPct = Math.min(100, Math.round(managedProjects.length * 25 + activeTasksCount * 5));

        return {
          id: pm.id,
          employeeId: pm.employeeId,
          name: pm.name,
          email: pm.email,
          avatarUrl: pm.avatarUrl,
          department: pm.departmentName || "Project Management",
          status: pm.isActive ? "ACTIVE" : "INACTIVE",
          totalProjects: managedProjects.length,
          activeProjectsCount: activeProjects.length,
          completedProjectsCount: completedProjects.length,
          projectCompletionRate: avgProgress,
          teamLeadersManagedCount: managedTeamLeaders.length,
          teamLeadersManaged: managedTeamLeaders,
          workload: workloadPct,
          workloadStatus: workloadPct > 80 ? "HIGH_LOAD" : workloadPct > 40 ? "OPTIMAL" : "AVAILABLE",
          projects: managedProjects,
          performanceScore: Math.min(98, Math.max(78, Math.round(80 + avgProgress * 0.15 - blockedTasks * 2))),
        };
      });

    // -------------------------------------------------------------
    // 2. Process Team Leaders
    // -------------------------------------------------------------
    const teamLeaders = users
      .filter((u) => u.role === "TEAM_LEADER" || users.some((_) => enrichedProjects.some((p) => p.teamLeaderId === u.id)))
      .map((tl) => {
        const handledProjects = enrichedProjects.filter((p) => p.teamLeaderId === tl.id);
        const teamMemberIds = Array.from(
          new Set(
            handledProjects.flatMap((p) => p.members.map((m: any) => m.id)).filter((id) => id !== tl.id)
          )
        );
        const teamMembers = users.filter((u) => teamMemberIds.includes(u.id));

        const tlTasks = tasks.filter((t) => handledProjects.some((p) => p.id === t.projectId));
        const totalTasks = tlTasks.length;
        const completedTasks = tlTasks.filter((t) => t.status === "COMPLETED").length;
        const inProgressTasks = tlTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const blockedTasks = tlTasks.filter((t) => t.status === "BLOCKED").length;
        const inReviewTasks = tlTasks.filter((t) => t.status === "IN_REVIEW").length;

        const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const avgProjectProgress =
          handledProjects.length > 0
            ? Math.round(handledProjects.reduce((acc, p) => acc + p.progress, 0) / handledProjects.length)
            : 0;

        const workloadPct = Math.min(100, handledProjects.length * 30 + inProgressTasks * 5);

        // Project PM info
        const pmIds = Array.from(new Set(handledProjects.map((p) => p.projectManagerId).filter(Boolean)));
        const reportingPMs = users.filter((u) => pmIds.includes(u.id));

        return {
          id: tl.id,
          employeeId: tl.employeeId,
          name: tl.name,
          email: tl.email,
          avatarUrl: tl.avatarUrl,
          department: tl.departmentName || "Engineering",
          status: tl.isActive ? "ACTIVE" : "INACTIVE",
          projectsCount: handledProjects.length,
          teamSize: teamMembers.length,
          projectProgress: avgProjectProgress,
          taskCompletionPct,
          performanceScore: Math.min(99, Math.max(80, Math.round(82 + taskCompletionPct * 0.15 - blockedTasks * 3))),
          workload: workloadPct,
          workloadStatus: workloadPct > 80 ? "HIGH_LOAD" : workloadPct > 40 ? "OPTIMAL" : "AVAILABLE",
          reportingPMs,
          projects: handledProjects.map((p) => {
            const projTasks = tasks.filter((t) => t.projectId === p.id);
            return {
              id: p.id,
              projectCode: p.projectCode,
              projectTitle: p.projectTitle,
              clientCompany: p.clientCompany,
              status: p.status,
              progress: p.progress,
              projectHealth: p.projectHealth,
              members: p.members,
              tasks: projTasks,
              completedWorkCount: projTasks.filter((t) => t.status === "COMPLETED").length,
              blockedWorkCount: projTasks.filter((t) => t.status === "BLOCKED").length,
            };
          }),
          teamMembers,
          metrics: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            blockedTasks,
            inReviewTasks,
          },
        };
      });

    // -------------------------------------------------------------
    // 3. Process Employees
    // -------------------------------------------------------------
    const employees = users
      .filter((u) => u.role !== "SUPER_ADMIN" && u.role !== "DIRECTOR")
      .map((emp) => {
        const assignedProjects = enrichedProjects.filter((p) =>
          p.members.some((m: any) => m.id === emp.id) || p.teamLeaderId === emp.id
        );

        const currentProject = assignedProjects.find((p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS") || assignedProjects[0] || null;

        let teamLeader = null;
        if (currentProject?.teamLeaderId) {
          teamLeader = users.find((u) => u.id === currentProject.teamLeaderId) || null;
        }

        const empTasks = tasks.filter((t) => t.assignedToUserId === emp.id);
        const totalTasks = empTasks.length;
        const completedTasks = empTasks.filter((t) => t.status === "COMPLETED").length;
        const inProgressTasks = empTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const blockedTasks = empTasks.filter((t) => t.status === "BLOCKED").length;
        const inReviewTasks = empTasks.filter((t) => t.status === "IN_REVIEW").length;

        const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;

        // Current Work Tasks
        const currentWork = empTasks.filter((t) => ["IN_PROGRESS", "ASSIGNED", "PENDING", "BLOCKED", "IN_REVIEW"].includes(t.status));

        // Work History Tasks
        const completedHistory = empTasks.filter((t) => t.status === "COMPLETED");

        // Latest work updates
        const empUpdates = workUpdates.filter((u) => u.userId === emp.id);
        const latestUpdate = empUpdates[0] || null;

        const performanceScore = Math.min(98, Math.max(75, Math.round(80 + (completedTasks * 4) - (blockedTasks * 5))));

        return {
          id: emp.id,
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          avatarUrl: emp.avatarUrl,
          role: emp.role,
          department: emp.departmentName || "Engineering",
          skills: emp.skills,
          status: emp.isActive ? "ACTIVE" : "INACTIVE",
          currentProject: currentProject
            ? {
                id: currentProject.id,
                projectCode: currentProject.projectCode,
                projectTitle: currentProject.projectTitle,
                clientCompany: currentProject.clientCompany,
                status: currentProject.status,
                progress: currentProject.progress,
              }
            : null,
          teamLeader: teamLeader
            ? {
                id: teamLeader.id,
                employeeId: teamLeader.employeeId,
                name: teamLeader.name,
                avatarUrl: teamLeader.avatarUrl,
              }
            : null,
          assignedProjectsCount: assignedProjects.length,
          assignedProjects,
          tasksAssignedCount: totalTasks,
          completedTasksCount: completedTasks,
          inProgressTasksCount: inProgressTasks,
          blockedTasksCount: blockedTasks,
          inReviewTasksCount: inReviewTasks,
          completionPct,
          performanceScore,
          currentWork,
          workHistory: completedHistory,
          latestUpdate,
          workUpdates: empUpdates.slice(0, 5),
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        projectManagers,
        teamLeaders,
        employees,
        projects: enrichedProjects,
      },
    });
  } catch (err: any) {
    console.error("Admin Organisation API Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load organisation data" }, { status: 500 });
  }
}
