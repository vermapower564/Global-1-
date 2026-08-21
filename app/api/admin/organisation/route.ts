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

    // 1. Fetch Users with work fields only (NO salary, bank details, passwords, home address)
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

    // 4. Fetch Tasks (Distinct tasks by unique ID)
    const rawTasks: any[] = await queryDb<any[]>(
      `SELECT t.id, t.title, t.description, t.section, t.status, t.priority,
              t.progress, t.startDate, t.dueDate, t.completedAt, t.createdAt, t.updatedAt,
              t.projectId, t.assignedToUserId, t.estimatedHours, t.actualHours, t.blockerReason,
              p.projectTitle, p.projectCode,
              u.name as assignedUserName, u.employeeId as assignedUserEmpId,
              tl.name as teamLeaderName, tl.employeeId as teamLeaderEmpId
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       LEFT JOIN user u ON t.assignedToUserId = u.id
       LEFT JOIN user tl ON p.teamLeaderId = tl.id
       ORDER BY t.dueDate ASC`
    );

    // Ensure unique tasks by id
    const taskMap = new Map<string, any>();
    for (const t of rawTasks) {
      if (!taskMap.has(t.id)) {
        // Enforce real progress rule: COMPLETED = 100%
        let realProgress = Number(t.progress) || 0;
        if (t.status === "COMPLETED") realProgress = 100;
        else if (t.status === "PENDING" && !t.progress) realProgress = 0;

        taskMap.set(t.id, {
          ...t,
          progress: realProgress,
          workUpdates: [],
        });
      }
    }

    // 5. Fetch Daily Work Updates
    const workUpdates: any[] = await queryDb<any[]>(
      `SELECT dw.id, dw.userId, dw.projectId, dw.date, dw.hoursWorked,
              dw.description, dw.achievements, dw.blockers, dw.tomorrowPlan,
              dw.status, dw.rating, dw.gitCommits, dw.driveLinks, dw.screenshots, dw.submittedAt,
              p.projectTitle, p.projectCode
       FROM dailyworkupdate dw
       LEFT JOIN project p ON dw.projectId = p.id
       ORDER BY dw.date DESC, dw.submittedAt DESC`
    );

    // Attach work updates to tasks where project & user match
    const allTasks = Array.from(taskMap.values());
    for (const wu of workUpdates) {
      const matchedTasks = allTasks.filter(
        (t) => t.assignedToUserId === wu.userId && (!wu.projectId || t.projectId === wu.projectId)
      );
      matchedTasks.forEach((t) => {
        t.workUpdates.push(wu);
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Enriched Projects with member users and task metrics
    const enrichedProjects = projects.map((p) => {
      const memberUserIds = projectMembersMap.filter((m) => m.projectId === p.id).map((m) => m.userId);
      const members = users.filter((u) => memberUserIds.includes(u.id));
      const pTasks = allTasks.filter((t) => t.projectId === p.id);

      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter((t) => t.status === "COMPLETED").length;
      const inProgressTasks = pTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const blockedTasks = pTasks.filter((t) => t.status === "BLOCKED").length;
      const inReviewTasks = pTasks.filter((t) => t.status === "IN_REVIEW").length;
      const pendingTasks = pTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length;

      const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.status === "COMPLETED" ? 100 : 0);
      const overallWorkProgress = totalTasks > 0
        ? Math.round(pTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTasks)
        : (p.status === "COMPLETED" ? 100 : 0);

      let projectHealth: "HEALTHY" | "AT_RISK" | "CRITICAL" = "HEALTHY";
      const isOverdue = p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED";
      const daysRemaining = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24)) : 30;

      if (isOverdue || blockedTasks >= 2 || (totalTasks > 0 && overallWorkProgress < 40 && daysRemaining <= 7)) {
        projectHealth = "CRITICAL";
      } else if (blockedTasks >= 1 || (totalTasks > 0 && overallWorkProgress < 60 && daysRemaining <= 14) || daysRemaining <= 3) {
        projectHealth = "AT_RISK";
      }

      return {
        ...p,
        members,
        memberCount: members.length,
        progress: overallWorkProgress,
        taskCompletionPct,
        projectHealth,
        daysRemaining,
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          inReviewTasks,
          blockedTasks,
        },
        tasks: pTasks,
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
        const delayedProjects = managedProjects.filter((p) => p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED");

        const pmTasks = allTasks.filter((t) => managedProjects.some((p) => p.id === t.projectId));
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
        const workloadPct = totalTasks > 0 ? Math.min(100, Math.round(managedProjects.length * 20 + activeTasksCount * 5)) : 0;

        return {
          id: pm.id,
          employeeId: pm.employeeId,
          name: pm.name,
          email: pm.email,
          avatarUrl: pm.avatarUrl,
          role: pm.role,
          department: pm.departmentName || "Project Management",
          joiningDate: pm.joiningDate,
          status: pm.isActive ? "ACTIVE" : "INACTIVE",
          totalProjects: managedProjects.length,
          activeProjectsCount: activeProjects.length,
          completedProjectsCount: completedProjects.length,
          delayedProjectsCount: delayedProjects.length,
          projectCompletionRate: avgProgress,
          teamLeadersManagedCount: managedTeamLeaders.length,
          teamLeadersManaged: managedTeamLeaders,
          workload: workloadPct > 0 ? workloadPct : null,
          workloadStatus: workloadPct > 80 ? "HIGH_LOAD" : workloadPct > 40 ? "OPTIMAL" : "AVAILABLE",
          projects: managedProjects,
          performanceScore: totalTasks > 0 ? Math.min(98, Math.max(78, Math.round(80 + avgProgress * 0.15 - blockedTasks * 2))) : null,
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

        const tlTasks = allTasks.filter((t) => handledProjects.some((p) => p.id === t.projectId));
        const totalTasks = tlTasks.length;
        const completedTasks = tlTasks.filter((t) => t.status === "COMPLETED").length;
        const inProgressTasks = tlTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const blockedTasks = tlTasks.filter((t) => t.status === "BLOCKED").length;
        const inReviewTasks = tlTasks.filter((t) => t.status === "IN_REVIEW").length;
        const pendingTasks = tlTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length;

        const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const avgProjectProgress =
          handledProjects.length > 0
            ? Math.round(handledProjects.reduce((acc, p) => acc + p.progress, 0) / handledProjects.length)
            : 0;

        const workloadPct = totalTasks > 0 ? Math.min(100, handledProjects.length * 25 + inProgressTasks * 5) : 0;

        // Project PM info
        const pmIds = Array.from(new Set(handledProjects.map((p) => p.projectManagerId).filter(Boolean)));
        const reportingPMs = users.filter((u) => pmIds.includes(u.id));

        return {
          id: tl.id,
          employeeId: tl.employeeId,
          name: tl.name,
          email: tl.email,
          avatarUrl: tl.avatarUrl,
          role: tl.role,
          department: tl.departmentName || "Engineering",
          joiningDate: tl.joiningDate,
          status: tl.isActive ? "ACTIVE" : "INACTIVE",
          projectsCount: handledProjects.length,
          teamSize: teamMembers.length,
          projectProgress: avgProjectProgress,
          taskCompletionPct,
          performanceScore: totalTasks > 0 ? Math.min(99, Math.max(80, Math.round(82 + taskCompletionPct * 0.15 - blockedTasks * 3))) : null,
          workload: workloadPct > 0 ? workloadPct : null,
          workloadStatus: workloadPct > 80 ? "HIGH_LOAD" : workloadPct > 40 ? "OPTIMAL" : "AVAILABLE",
          reportingPMs,
          projects: handledProjects.map((p) => {
            const projTasks = allTasks.filter((t) => t.projectId === p.id);
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
            pendingTasks,
            inReviewTasks,
            blockedTasks,
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

        // Deduplicated employee tasks
        const empTasks = allTasks.filter((t) => t.assignedToUserId === emp.id);
        const totalTasks = empTasks.length;
        const completedTasks = empTasks.filter((t) => t.status === "COMPLETED").length;
        const inProgressTasks = empTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const pendingTasks = empTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length;
        const inReviewTasks = empTasks.filter((t) => t.status === "IN_REVIEW").length;
        const blockedTasks = empTasks.filter((t) => t.status === "BLOCKED").length;

        // Mathematical check: totalTasks == completedTasks + inProgressTasks + pendingTasks + inReviewTasks + blockedTasks
        const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const overallWorkProgress = totalTasks > 0
          ? Math.round(empTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTasks)
          : 0;

        // Today's Work calculation
        const empUpdates = workUpdates.filter((u) => u.userId === emp.id);
        const todayUpdates = empUpdates.filter((u) => {
          if (!u.date) return false;
          const uDate = new Date(u.date).toISOString().split("T")[0];
          return uDate === todayStr;
        });

        const todayHours = todayUpdates.reduce((acc, u) => acc + (Number(u.hoursWorked) || 0), 0);
        const todayCompletedTasks = empTasks.filter((t) => {
          if (t.status !== "COMPLETED" || !t.completedAt) return false;
          const cDate = new Date(t.completedAt).toISOString().split("T")[0];
          return cDate === todayStr;
        }).length;
        const todayInProgressTasks = empTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const todayBlockers = todayUpdates.filter((u) => u.blockers && u.blockers.trim().length > 0).length;

        // Current Work Tasks & Work History Tasks
        const currentWork = empTasks.filter((t) => t.status !== "COMPLETED");
        const workHistory = empTasks.filter((t) => t.status === "COMPLETED");

        const performanceScore = totalTasks >= 2
          ? Math.min(98, Math.max(65, Math.round(75 + (taskCompletionPct * 0.2) + (overallWorkProgress * 0.1) - (blockedTasks * 5))))
          : null;

        return {
          id: emp.id,
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          avatarUrl: emp.avatarUrl,
          role: emp.role,
          department: emp.departmentName || "Engineering",
          skills: emp.skills,
          joiningDate: emp.joiningDate,
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
          assignedProjects: assignedProjects.map((p) => ({
            id: p.id,
            projectCode: p.projectCode,
            projectTitle: p.projectTitle,
            clientCompany: p.clientCompany,
            status: p.status,
            progress: p.progress,
            taskCompletionPct: p.taskCompletionPct,
          })),
          tasksAssignedCount: totalTasks,
          completedTasksCount: completedTasks,
          inProgressTasksCount: inProgressTasks,
          pendingTasksCount: pendingTasks,
          inReviewTasksCount: inReviewTasks,
          blockedTasksCount: blockedTasks,
          taskCompletionPct,
          overallWorkProgress,
          performanceScore,
          allTasks: empTasks,
          currentWork,
          workHistory,
          todayWork: {
            todayCompletedTasks,
            todayInProgressTasks,
            todayUpdatesCount: todayUpdates.length,
            todayHours,
            todayBlockers,
            todayUpdates,
          },
          recentWorkUpdates: empUpdates.slice(0, 5),
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
