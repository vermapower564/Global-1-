import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { maskAccountNumber, maskIfscCode, maskAccountHolderName } from "@/lib/bankOtpService";

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

    // 1. Fetch Users with non-sensitive account metadata
    const users: any[] = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.departmentId, u.managerId,
              u.joiningDate, u.isActive, u.isResigned, u.avatarUrl, u.skills, u.experienceYears,
              d.name as departmentName, d.code as departmentCode,
              m.name as managerName, m.employeeId as managerEmpId
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       LEFT JOIN user m ON u.managerId = m.id
       ORDER BY u.name ASC`
    );

    // 2. Fetch Masked Bank Details
    const bankDetailsRows: any[] = await queryDb<any[]>(
      `SELECT userId, accountHolderName, bankName, accountNumber, ifscCode, branchName, accountType, isActive
       FROM bankdetail`
    );
    const bankMap = new Map<string, any>();
    for (const b of bankDetailsRows) {
      bankMap.set(b.userId, {
        hasBankDetails: true,
        bankName: b.bankName,
        accountHolderNameMasked: maskAccountHolderName(b.accountHolderName),
        accountNumberMasked: maskAccountNumber(b.accountNumber),
        ifscCodeMasked: maskIfscCode(b.ifscCode),
        branchName: b.branchName || "Main Branch",
        accountType: b.accountType || "Savings",
        isActive: b.isActive,
      });
    }

    // 3. Fetch Departments
    const departments: any[] = await queryDb<any[]>(
      `SELECT id, name, code FROM department ORDER BY name ASC`
    );

    // 4. Fetch Projects
    const projects: any[] = await queryDb<any[]>(
      `SELECT p.id, p.projectCode, p.projectTitle, p.description, p.clientCompany,
              p.startDate, p.endDate, p.status, p.priority, p.projectType,
              p.projectManagerId, p.teamLeaderId, p.requiredSkills, p.expectedTeamSize,
              pm.name as projectManagerName, pm.employeeId as projectManagerEmpId, pm.avatarUrl as projectManagerAvatar,
              tl.name as teamLeaderName, tl.employeeId as teamLeaderEmpId, tl.avatarUrl as teamLeaderAvatar
       FROM project p
       LEFT JOIN user pm ON p.projectManagerId = pm.id
       LEFT JOIN user tl ON p.teamLeaderId = tl.id
       ORDER BY p.createdAt DESC`
    );

    // 5. Fetch Project Member Mappings
    const projectMembersMap: any[] = await queryDb<any[]>(
      `SELECT A as projectId, B as userId FROM _assignedstaffprojects`
    );

    // 6. Fetch Tasks
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

    const taskMap = new Map<string, any>();
    for (const t of rawTasks) {
      if (!taskMap.has(t.id)) {
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

    // 7. Fetch Daily Work Updates
    const workUpdates: any[] = await queryDb<any[]>(
      `SELECT dw.id, dw.userId, dw.projectId, dw.date, dw.hoursWorked,
              dw.description, dw.achievements, dw.blockers, dw.tomorrowPlan,
              dw.status, dw.rating, dw.gitCommits, dw.driveLinks, dw.screenshots, dw.submittedAt,
              p.projectTitle, p.projectCode
       FROM dailyworkupdate dw
       LEFT JOIN project p ON dw.projectId = p.id
       ORDER BY dw.date DESC, dw.submittedAt DESC`
    );

    const allTasks = Array.from(taskMap.values());
    for (const wu of workUpdates) {
      const matchedTasks = allTasks.filter(
        (t) => t.assignedToUserId === wu.userId && (!wu.projectId || t.projectId === wu.projectId)
      );
      matchedTasks.forEach((t) => t.workUpdates.push(wu));
    }

    // 8. Fetch Attendance & Leave Summaries
    const attendanceStats: any[] = await queryDb<any[]>(
      `SELECT userId, COUNT(*) as totalDays,
              SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as presentDays,
              SUM(hoursWorked) as totalHours
       FROM attendance
       GROUP BY userId`
    );
    const attMap = new Map<string, any>();
    for (const a of attendanceStats) {
      attMap.set(a.userId, {
        totalDays: Number(a.totalDays) || 0,
        presentDays: Number(a.presentDays) || 0,
        totalHours: Number(a.totalHours) || 0,
      });
    }

    const leaveStats: any[] = await queryDb<any[]>(
      `SELECT userId,
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approvedLeaves,
              SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingLeaves
       FROM leaverequest
       GROUP BY userId`
    );
    const leaveMap = new Map<string, any>();
    for (const l of leaveStats) {
      leaveMap.set(l.userId, {
        approvedLeaves: Number(l.approvedLeaves) || 0,
        pendingLeaves: Number(l.pendingLeaves) || 0,
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Map Projects
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

    const superAdmin = users.find((u) => u.role === "SUPER_ADMIN") || {
      id: "super_admin_root",
      name: "Roushan Verma",
      employeeId: "EMP-8595",
      role: "SUPER_ADMIN",
      email: "roushanverma564@gmail.com",
    };

    // -------------------------------------------------------------
    // 1. Process Project Managers (Strictly role === "PROJECT_MANAGER")
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
        const avgProgress =
          managedProjects.length > 0
            ? Math.round(managedProjects.reduce((acc, p) => acc + p.progress, 0) / managedProjects.length)
            : 0;

        const tlIds = Array.from(new Set(managedProjects.map((p) => p.teamLeaderId).filter(Boolean)));
        const managedTeamLeaders = users.filter((u) => tlIds.includes(u.id));

        // Subordinate employees in PM's projects
        const memberIds = Array.from(new Set(managedProjects.flatMap((p) => p.members.map((m: any) => m.id))));
        const managedEmployees = users.filter((u) => memberIds.includes(u.id) && u.role !== "PROJECT_MANAGER" && u.role !== "TEAM_LEADER");

        const activeTasksCount = pmTasks.filter((t) => ["IN_PROGRESS", "ASSIGNED", "IN_REVIEW"].includes(t.status)).length;
        const workloadPct = totalTasks > 0 ? Math.min(100, Math.round(managedProjects.length * 20 + activeTasksCount * 5)) : 0;

        // Dynamic Org Hierarchy
        const orgHierarchy = {
          level1: { role: "ADMIN", title: "Super Admin", user: superAdmin },
          level2: { role: "PROJECT_MANAGER", title: "Project Manager", user: pm },
          level3: managedTeamLeaders.map((tl) => ({
            role: "TEAM_LEADER",
            title: "Team Leader",
            user: tl,
            employees: managedEmployees.filter((e) =>
              managedProjects.some((p) => p.teamLeaderId === tl.id && p.members.some((m: any) => m.id === e.id))
            ),
          })),
        };

        const bankData = bankMap.get(pm.id) || {
          hasBankDetails: false,
          bankName: "Not on file",
          accountHolderNameMasked: "••••••",
          accountNumberMasked: "••••••••••••",
          ifscCodeMasked: "•••••••••••",
          branchName: "N/A",
          accountType: "Savings",
          isActive: false,
        };

        const att = attMap.get(pm.id) || { totalDays: 0, presentDays: 0, totalHours: 0 };
        const leaves = leaveMap.get(pm.id) || { approvedLeaves: 0, pendingLeaves: 0 };

        return {
          id: pm.id,
          employeeId: pm.employeeId,
          name: pm.name,
          email: pm.email,
          phone: pm.phone || "+91 98765 00000",
          avatarUrl: pm.avatarUrl,
          role: pm.role,
          departmentId: pm.departmentId,
          department: pm.departmentName || "Project Management",
          joiningDate: pm.joiningDate,
          status: pm.isActive ? "ACTIVE" : "INACTIVE",
          employmentStatus: pm.isResigned ? "RESIGNED" : "REGULAR_FULL_TIME",
          managerName: superAdmin.name,
          managerEmpId: superAdmin.employeeId,
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
          performanceScore: totalTasks > 0 ? Math.min(98, Math.max(78, Math.round(80 + avgProgress * 0.15))) : null,
          bankDetails: bankData,
          attendanceSummary: att,
          leaveSummary: leaves,
          orgHierarchy,
        };
      });

    // -------------------------------------------------------------
    // 2. Process Team Leaders (Strictly role === "TEAM_LEADER")
    // -------------------------------------------------------------
    const teamLeaders = users
      .filter((u) => u.role === "TEAM_LEADER")
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

        // Project Manager reporting to
        const pmIds = Array.from(new Set(handledProjects.map((p) => p.projectManagerId).filter(Boolean)));
        const reportingPM = users.find((u) => pmIds.includes(u.id)) || users.find((u) => u.role === "PROJECT_MANAGER") || null;

        // Dynamic Org Hierarchy for TL
        const orgHierarchy = {
          level1: reportingPM
            ? { role: "PROJECT_MANAGER", title: "Project Manager", user: reportingPM }
            : { role: "ADMIN", title: "Super Admin", user: superAdmin },
          level2: { role: "TEAM_LEADER", title: "Team Leader", user: tl },
          level3: teamMembers.map((emp) => ({
            role: "EMPLOYEE",
            title: "Employee",
            user: emp,
          })),
        };

        const bankData = bankMap.get(tl.id) || {
          hasBankDetails: false,
          bankName: "Not on file",
          accountHolderNameMasked: "••••••",
          accountNumberMasked: "••••••••••••",
          ifscCodeMasked: "•••••••••••",
          branchName: "N/A",
          accountType: "Savings",
          isActive: false,
        };

        const att = attMap.get(tl.id) || { totalDays: 0, presentDays: 0, totalHours: 0 };
        const leaves = leaveMap.get(tl.id) || { approvedLeaves: 0, pendingLeaves: 0 };

        return {
          id: tl.id,
          employeeId: tl.employeeId,
          name: tl.name,
          email: tl.email,
          phone: tl.phone || "+91 98765 00000",
          avatarUrl: tl.avatarUrl,
          role: tl.role,
          departmentId: tl.departmentId,
          department: tl.departmentName || "Engineering",
          joiningDate: tl.joiningDate,
          status: tl.isActive ? "ACTIVE" : "INACTIVE",
          employmentStatus: tl.isResigned ? "RESIGNED" : "REGULAR_FULL_TIME",
          reportingManager: reportingPM ? { name: reportingPM.name, employeeId: reportingPM.employeeId, id: reportingPM.id } : null,
          projectsCount: handledProjects.length,
          teamSize: teamMembers.length,
          projectProgress: avgProjectProgress,
          taskCompletionPct,
          performanceScore: totalTasks > 0 ? Math.min(99, Math.max(80, Math.round(82 + taskCompletionPct * 0.15 - blockedTasks * 3))) : null,
          workload: workloadPct > 0 ? workloadPct : null,
          workloadStatus: workloadPct > 80 ? "HIGH_LOAD" : workloadPct > 40 ? "OPTIMAL" : "AVAILABLE",
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
          bankDetails: bankData,
          attendanceSummary: att,
          leaveSummary: leaves,
          orgHierarchy,
        };
      });

    // -------------------------------------------------------------
    // 3. Process Employees (Strictly non-PM, non-TL, non-HR, non-SuperAdmin)
    // -------------------------------------------------------------
    const employees = users
      .filter((u) => u.role !== "SUPER_ADMIN" && u.role !== "PROJECT_MANAGER" && u.role !== "TEAM_LEADER" && u.role !== "HR" && u.role !== "ADMIN_HR")
      .map((emp) => {
        const assignedProjects = enrichedProjects.filter((p) =>
          p.members.some((m: any) => m.id === emp.id)
        );

        const currentProject = assignedProjects.find((p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS") || assignedProjects[0] || null;

        let teamLeader = null;
        let projectManager = null;
        if (currentProject) {
          if (currentProject.teamLeaderId) {
            teamLeader = users.find((u) => u.id === currentProject.teamLeaderId) || null;
          }
          if (currentProject.projectManagerId) {
            projectManager = users.find((u) => u.id === currentProject.projectManagerId) || null;
          }
        }

        const empTasks = allTasks.filter((t) => t.assignedToUserId === emp.id);
        const totalTasks = empTasks.length;
        const completedTasks = empTasks.filter((t) => t.status === "COMPLETED").length;
        const inProgressTasks = empTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const pendingTasks = empTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length;
        const inReviewTasks = empTasks.filter((t) => t.status === "IN_REVIEW").length;
        const blockedTasks = empTasks.filter((t) => t.status === "BLOCKED").length;

        const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const overallWorkProgress = totalTasks > 0
          ? Math.round(empTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTasks)
          : 0;

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

        const performanceScore = totalTasks >= 2
          ? Math.min(98, Math.max(65, Math.round(75 + (taskCompletionPct * 0.2) + (overallWorkProgress * 0.1) - (blockedTasks * 5))))
          : null;

        // Dynamic Org Hierarchy for Employee
        const orgHierarchy = {
          level1: projectManager
            ? { role: "PROJECT_MANAGER", title: "Project Manager", user: projectManager }
            : { role: "ADMIN", title: "Super Admin", user: superAdmin },
          level2: teamLeader
            ? { role: "TEAM_LEADER", title: "Team Leader", user: teamLeader }
            : null,
          level3: [{ role: "EMPLOYEE", title: "Selected Employee", user: emp, isSelected: true }],
        };

        const bankData = bankMap.get(emp.id) || {
          hasBankDetails: false,
          bankName: "Not on file",
          accountHolderNameMasked: "••••••",
          accountNumberMasked: "••••••••••••",
          ifscCodeMasked: "•••••••••••",
          branchName: "N/A",
          accountType: "Savings",
          isActive: false,
        };

        const att = attMap.get(emp.id) || { totalDays: 0, presentDays: 0, totalHours: 0 };
        const leaves = leaveMap.get(emp.id) || { approvedLeaves: 0, pendingLeaves: 0 };

        return {
          id: emp.id,
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || "+91 98765 00000",
          avatarUrl: emp.avatarUrl,
          role: emp.role,
          departmentId: emp.departmentId,
          department: emp.departmentName || "Engineering",
          skills: emp.skills,
          joiningDate: emp.joiningDate,
          status: emp.isActive ? "ACTIVE" : "INACTIVE",
          employmentStatus: emp.isResigned ? "RESIGNED" : "REGULAR_FULL_TIME",
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
          reportingManager: projectManager
            ? {
                id: projectManager.id,
                employeeId: projectManager.employeeId,
                name: projectManager.name,
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
          currentWork: empTasks.filter((t) => t.status !== "COMPLETED"),
          workHistory: empTasks.filter((t) => t.status === "COMPLETED"),
          todayWork: {
            todayCompletedTasks,
            todayInProgressTasks,
            todayUpdatesCount: todayUpdates.length,
            todayHours,
            todayBlockers,
            todayUpdates,
          },
          recentWorkUpdates: empUpdates.slice(0, 5),
          bankDetails: bankData,
          attendanceSummary: att,
          leaveSummary: leaves,
          orgHierarchy,
        };
      });

    // -------------------------------------------------------------
    // 4. Process Human Resources (Strictly role === "HR" || role === "ADMIN_HR")
    // -------------------------------------------------------------
    const pendingLeavesCount = Array.from(leaveMap.values()).reduce((acc, l) => acc + (l.pendingLeaves || 0), 0);
    const activeStaffCount = users.filter((u) => u.isActive && u.role !== "SUPER_ADMIN").length;

    const humanResources = users
      .filter((u) => u.role === "HR" || u.role === "ADMIN_HR")
      .map((hr) => {
        const bankData = bankMap.get(hr.id) || {
          hasBankDetails: false,
          bankName: "Not on file",
          accountHolderNameMasked: "••••••",
          accountNumberMasked: "••••••••••••",
          ifscCodeMasked: "•••••••••••",
          branchName: "N/A",
          accountType: "Savings",
          isActive: false,
        };

        const att = attMap.get(hr.id) || { totalDays: 0, presentDays: 0, totalHours: 0 };
        const leaves = leaveMap.get(hr.id) || { approvedLeaves: 0, pendingLeaves: 0 };

        // Dynamic Org Hierarchy for HR (Reporting directly to Super Admin)
        const orgHierarchy = {
          level1: { role: "ADMIN", title: "Super Admin", user: superAdmin },
          level2: { role: "HR", title: "Human Resources Specialist", user: hr },
          level3: users
            .filter((u) => u.role !== "SUPER_ADMIN" && u.role !== "HR" && u.role !== "ADMIN_HR")
            .slice(0, 8)
            .map((u) => ({
              role: u.role,
              title: u.role.replace(/_/g, " "),
              user: u,
            })),
        };

        return {
          id: hr.id,
          employeeId: hr.employeeId,
          name: hr.name,
          email: hr.email,
          phone: hr.phone || "+91 98765 00000",
          avatarUrl: hr.avatarUrl,
          role: "HR",
          departmentId: hr.departmentId,
          department: hr.departmentName || "Human Resources",
          joiningDate: hr.joiningDate,
          status: hr.isActive ? "ACTIVE" : "INACTIVE",
          employmentStatus: hr.isResigned ? "RESIGNED" : "REGULAR_FULL_TIME",
          managerName: superAdmin.name,
          managerEmpId: superAdmin.employeeId,
          responsibilities: [
            "Employee onboarding and offboarding",
            "Employee records & directory governance",
            "Leave management & 24-day annual quota approvals",
            "Attendance & work hours oversight",
            "Recruitment & onboarding records",
            "Department & organizational role management",
            "HR documents & statutory compliance",
            "Employee performance & rating records",
            "Resignation & employee exit process",
          ],
          metrics: {
            activeEmployeesCount: activeStaffCount,
            totalDepartmentsCount: departments.length,
            pendingLeavesCount,
          },
          bankDetails: bankData,
          attendanceSummary: att,
          leaveSummary: leaves,
          orgHierarchy,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        projectManagers,
        teamLeaders,
        employees,
        humanResources,
        projects: enrichedProjects,
        departments,
      },
    });
  } catch (err: any) {
    console.error("Admin Organisation API Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load organisation data" }, { status: 500 });
  }
}
