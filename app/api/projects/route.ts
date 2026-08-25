import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"];

// Helper to get initials
function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// GET: Fetch all projects with real database Team Leader, Project Members, Sections & Calculated Progress
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ADMIN_ROLES.includes(roleUpper);
    const isPM = roleUpper === "PROJECT_MANAGER";

    // Fetch projects from TiDB Cloud
    const dbProjects: any[] = await queryDbCached(
      `SELECT p.*, 
              tl.id AS tl_id, tl.name AS tl_name, tl.employeeId AS tl_employeeId, tl.email AS tl_email, tl.role AS tl_role, tl.avatarUrl AS tl_avatarUrl
       FROM project p
       LEFT JOIN user tl ON p.teamLeaderId = tl.id
       ORDER BY p.createdAt DESC`,
      [],
      5
    );

    // Fetch all project-member mappings
    const memberRows: any[] = await queryDbCached(
      `SELECT asp.A AS projectId, u.id, u.name, u.employeeId, u.email, u.role, u.avatarUrl, d.name AS departmentName
       FROM _assignedstaffprojects asp
       JOIN user u ON asp.B = u.id
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE u.isActive = 1`,
      [],
      5
    );

    // Fetch all project tasks
    const taskRows: any[] = await queryDbCached(
      `SELECT t.*, u.name AS user_name, u.employeeId AS user_employeeId, u.role AS user_role, u.avatarUrl AS user_avatarUrl,
              c.name AS creator_name, c.employeeId AS creator_employeeId
       FROM task t
       LEFT JOIN user u ON t.assignedToUserId = u.id
       LEFT JOIN user c ON t.createdById = c.id
       ORDER BY t.createdAt DESC`,
      [],
      5
    );

    // Fetch customer reviews if available
    const reviewRows: any[] = await queryDbCached(`SELECT * FROM customerreview ORDER BY createdAt DESC`, [], 5);

    const enriched = dbProjects.map((p) => {
      // Find Team Leader (from DB join or fallback to first assigned member)
      const tl = p.tl_id
        ? {
            id: p.tl_id,
            name: p.tl_name,
            employeeId: p.tl_employeeId,
            email: p.tl_email,
            role: p.tl_role ? p.tl_role.replace(/_/g, " ") : "Team Leader",
            avatar: p.tl_avatarUrl || getInitials(p.tl_name),
          }
        : null;

      // Find all Project Members
      const projectMembers = memberRows
        .filter((m) => m.projectId === p.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          employeeId: m.employeeId,
          email: m.email,
          role: m.role ? m.role.replace(/_/g, " ") : "Member",
          department: m.departmentName || "Engineering",
          avatar: m.avatarUrl || getInitials(m.name),
        }));

      // Find all tasks for this project
      const pTasks = taskRows.filter((t) => t.projectId === p.id);

      // Section-wise progress calculation
      const sectionMap: Record<string, { total: number; completed: number; inProgress: number; tasks: any[] }> = {};
      pTasks.forEach((t) => {
        const sec = t.section || "General";
        if (!sectionMap[sec]) {
          sectionMap[sec] = { total: 0, completed: 0, inProgress: 0, tasks: [] };
        }
        sectionMap[sec].total += 1;
        if (t.status === "COMPLETED") sectionMap[sec].completed += 1;
        else if (t.status === "IN_PROGRESS") sectionMap[sec].inProgress += 1;
        sectionMap[sec].tasks.push({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          progress: t.progress,
          assignedTo: {
            id: t.assignedToUserId,
            name: t.user_name,
            employeeId: t.user_employeeId,
          },
        });
      });

      const sections = Object.keys(sectionMap).map((secName) => {
        const data = sectionMap[secName];
        const progress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        return {
          name: secName,
          totalTasks: data.total,
          completedTasks: data.completed,
          inProgressTasks: data.inProgress,
          progress,
          tasks: data.tasks,
        };
      });

      // Employee-wise progress calculation
      const empProgressMap: Record<string, { id: string; name: string; employeeId: string; section: string; total: number; completed: number }> = {};
      
      // Initialize with all members
      projectMembers.forEach((pm) => {
        empProgressMap[pm.id] = {
          id: pm.id,
          name: pm.name,
          employeeId: pm.employeeId,
          section: "General",
          total: 0,
          completed: 0,
        };
      });

      pTasks.forEach((t) => {
        const uid = t.assignedToUserId;
        if (!empProgressMap[uid]) {
          empProgressMap[uid] = {
            id: uid,
            name: t.user_name || "Employee",
            employeeId: t.user_employeeId || "EMP",
            section: t.section || "General",
            total: 0,
            completed: 0,
          };
        }
        empProgressMap[uid].total += 1;
        if (t.section) empProgressMap[uid].section = t.section;
        if (t.status === "COMPLETED") empProgressMap[uid].completed += 1;
      });

      const employeeProgress = Object.values(empProgressMap).map((ep) => ({
        ...ep,
        progress: ep.total > 0 ? Math.round((ep.completed / ep.total) * 100) : 0,
      }));

      // Metrics calculation
      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter((t) => t.status === "COMPLETED").length;
      const inProgressTasks = pTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const blockedTasks = pTasks.filter((t) => t.status === "BLOCKED").length;
      const inReviewTasks = pTasks.filter((t) => t.status === "IN_REVIEW").length;
      const pendingTasks = pTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length;

      const overallProgress =
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : p.status === "COMPLETED"
          ? 100
          : 0;

      // Matching customer review
      const review = reviewRows.find((r) => r.projectId === p.id || r.projectName === p.projectTitle);

      const now = new Date();
      let projectHealth: "HEALTHY" | "AT_RISK" | "CRITICAL" = "HEALTHY";
      const isOverdue = p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED";
      const daysRemaining = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24)) : 30;

      if (isOverdue || blockedTasks >= 2 || (totalTasks > 0 && overallProgress < 40 && daysRemaining <= 7)) {
        projectHealth = "CRITICAL";
      } else if (blockedTasks >= 1 || (totalTasks > 0 && overallProgress < 60 && daysRemaining <= 14) || daysRemaining <= 3) {
        projectHealth = "AT_RISK";
      }

      const isUserTeamLeader = p.teamLeaderId === authUser.id;
      const isUserMember = projectMembers.some((m) => m.id === authUser.id) || isUserTeamLeader;

      return {
        id: p.id,
        projectCode: p.projectCode || p.id,
        projectTitle: p.projectTitle,
        description: p.description || `Enterprise deliverable for ${p.projectTitle}.`,
        clientCompany: p.clientCompany,
        clientContactPerson: p.clientContactPerson,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone,
        startDate: p.startDate,
        endDate: p.endDate,
        contractValue: p.contractValue,
        status: p.status,
        priority: p.priority || "MEDIUM",
        projectType: p.projectType || "WEB_APPLICATION",
        requiredSkills: p.requiredSkills || "React, Next.js, Node.js, MySQL, UI/UX",
        requiredRoles: p.requiredRoles || "Developer, UI/UX Designer, QA",
        techStack: p.techStack || "React, Next.js, MySQL",
        expectedTeamSize: p.expectedTeamSize || 5,
        projectHealth,
        daysRemaining,
        createdAt: p.createdAt,
        teamLeader: tl,
        teamLeaderId: p.teamLeaderId,
        projectManagerId: p.projectManagerId,
        teamMembers: projectMembers,
        memberCount: projectMembers.length,
        sections,
        employeeProgress,
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          inReviewTasks,
          pendingTasks,
          overallProgress,
          projectHealth,
        },
        customerReview: review || null,
        isUserTeamLeader,
        isUserMember,
      };
    });

    // Scoping:
    // 1. Admin sees all projects (including drafts).
    // 2. Project Manager sees active projects they belong to/lead + their OWN private drafts.
    const accessibleProjects = enriched.filter((p) => {
      if (p.status === "DRAFT") {
        if (isAdmin) return true;
        if (isPM && (p.projectManagerId === authUser.id || !p.projectManagerId)) return true;
        return false; // TL and employees cannot see drafts
      }
      if (isAdmin || isPM) return true;
      return p.isUserMember || p.isUserTeamLeader;
    });

    const totalRevenue = accessibleProjects.reduce((acc, p) => acc + (Number(p.contractValue) || 0), 0);

    return NextResponse.json({
      success: true,
      total: accessibleProjects.length,
      totalRevenue,
      projects: accessibleProjects,
      data: accessibleProjects,
    });
  } catch (error: any) {
    console.error("Projects GET Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

// Validation helper for Project Manager and Team Leader project role assignment
export async function validateProjectRoleAssignment(
  userId: string | null | undefined,
  expectedRole: "PROJECT_MANAGER" | "TEAM_LEADER"
): Promise<{ valid: boolean; resolvedId: string | null; user?: any; error?: string }> {
  if (!userId) return { valid: true, resolvedId: null };

  const rows = await queryDb<any[]>(
    `SELECT u.id, u.employeeId, u.name, u.role, u.isActive, d.name as departmentName 
     FROM user u 
     LEFT JOIN department d ON u.departmentId = d.id 
     WHERE u.id = ? OR u.employeeId = ? LIMIT 1`,
    [userId, userId]
  );

  if (!rows || rows.length === 0) {
    return {
      valid: false,
      resolvedId: null,
      error: `Assigned ${expectedRole === "PROJECT_MANAGER" ? "Project Manager" : "Team Leader"} user does not exist.`,
    };
  }

  const u = rows[0];

  if (!u.isActive) {
    return {
      valid: false,
      resolvedId: null,
      error: `Employee ${u.name} (${u.employeeId}) is currently inactive and cannot be assigned to projects.`,
    };
  }

  const roleUpper = (u.role || "").toUpperCase();

  if (expectedRole === "PROJECT_MANAGER") {
    if (roleUpper !== "PROJECT_MANAGER") {
      return {
        valid: false,
        resolvedId: null,
        error: "Validation failed: Only users with the PROJECT_MANAGER role can be assigned as Project Manager.",
      };
    }
  } else if (expectedRole === "TEAM_LEADER") {
    if (roleUpper !== "TEAM_LEADER") {
      return {
        valid: false,
        resolvedId: null,
        error: "Forbidden: Projects can only be assigned to a user with the TEAM_LEADER role. Direct assignment to Employees, Developers, HR, or other roles is strictly prohibited.",
      };
    }
  }

  return { valid: true, resolvedId: u.id, user: u };
}

// POST: Project Manager or Admin creates a new project or saves a draft with Team Leader and Skill specifications
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const canCreateProject = ["SUPER_ADMIN", "DIRECTOR", "PROJECT_MANAGER", "ADMIN_HR"].includes((authUser.role || "").toUpperCase());

    if (!canCreateProject) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Project Managers and Super Admins can create new projects." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      projectTitle,
      projectCode,
      description,
      clientCompany,
      clientContactPerson,
      clientEmail,
      clientPhone,
      startDate,
      endDate,
      contractValue,
      status: requestedStatus,
      isDraft,
      priority = "MEDIUM",
      projectType = "WEB_APPLICATION",
      requiredSkills = "React, Next.js, Node.js, MySQL, UI/UX",
      requiredRoles = "Developer, UI/UX Designer, QA Tester",
      techStack = "React, Next.js, Node.js, Tailwind CSS",
      expectedTeamSize = 5,
      projectManagerId: requestedPMId,
      teamLeaderId,
      memberUserIds = [],
    } = body;

    const status = isDraft || requestedStatus === "DRAFT" ? "DRAFT" : (requestedStatus || "ACTIVE");

    if (!projectTitle || !projectTitle.trim()) {
      return NextResponse.json({ success: false, error: "Project title is required." }, { status: 400 });
    }

    // 1. Validate Project Manager
    const targetPMId = requestedPMId || authUser.id;
    const pmValidation = await validateProjectRoleAssignment(targetPMId, "PROJECT_MANAGER");
    if (!pmValidation.valid) {
      return NextResponse.json({ success: false, error: pmValidation.error }, { status: 400 });
    }
    const resolvedPMId = pmValidation.resolvedId || authUser.id;

    // 2. Validate Team Leader
    let finalTeamLeaderId = teamLeaderId || null;

    if (finalTeamLeaderId && finalTeamLeaderId !== "AUTO") {
      const tlValidation = await validateProjectRoleAssignment(finalTeamLeaderId, "TEAM_LEADER");
      if (!tlValidation.valid) {
        return NextResponse.json({ success: false, error: tlValidation.error }, { status: 400 });
      }
      finalTeamLeaderId = tlValidation.resolvedId;
    } else if (!finalTeamLeaderId || finalTeamLeaderId === "AUTO") {
      // Auto-allocate: Compare active project workloads and assign to the freest Team Leader (excluding HR)
      const freeTLRows = await queryDb<any[]>(
        `SELECT u.id, u.employeeId, u.name, u.email,
                COUNT(p.id) AS activeProjectCount
         FROM user u
         LEFT JOIN project p ON u.id = p.teamLeaderId AND p.status IN ('ACTIVE', 'PLANNING', 'IN_PROGRESS', 'DRAFT')
         WHERE u.role = 'TEAM_LEADER' AND u.isActive = 1
         GROUP BY u.id, u.employeeId, u.name, u.email
         ORDER BY activeProjectCount ASC, u.createdAt ASC
         LIMIT 1`
      );
      if (freeTLRows && freeTLRows.length > 0) {
        finalTeamLeaderId = freeTLRows[0].id;
      }
    }

    const projectId = projectCode ? `PRJ-${projectCode.trim().toUpperCase()}` : `PRJ-${Date.now().toString(36).toUpperCase()}`;

    await queryDb(
      `INSERT INTO project (
        id, projectCode, projectTitle, description, clientCompany, clientContactPerson, clientEmail,
        clientPhone, startDate, endDate, contractValue, status, priority, projectType,
        requiredSkills, requiredRoles, techStack, expectedTeamSize, projectManagerId, teamLeaderId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        projectId,
        projectCode ? projectCode.trim().toUpperCase() : projectId,
        projectTitle.trim(),
        description ? description.trim() : `Enterprise deliverable: ${projectTitle.trim()}`,
        clientCompany ? clientCompany.trim() : "Enterprise Client",
        clientContactPerson ? clientContactPerson.trim() : "Client Representative",
        clientEmail ? clientEmail.trim() : "client@enterprise.com",
        clientPhone ? clientPhone.trim() : "+91 98765 00000",
        startDate ? new Date(startDate) : new Date(),
        endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 3600 * 1000),
        parseFloat(contractValue) || 0,
        status,
        priority,
        projectType,
        requiredSkills ? requiredSkills.trim() : null,
        requiredRoles ? requiredRoles.trim() : null,
        techStack ? techStack.trim() : null,
        parseInt(expectedTeamSize) || 5,
        resolvedPMId,
        finalTeamLeaderId,
      ]
    );

    // Associate assigned members in _assignedstaffprojects
    const allMemberIds = new Set<string>();
    if (finalTeamLeaderId) allMemberIds.add(finalTeamLeaderId);
    if (Array.isArray(memberUserIds)) {
      memberUserIds.forEach((uid: string) => uid && allMemberIds.add(uid));
    }

    for (const memberId of allMemberIds) {
      try {
        await queryDb(`INSERT IGNORE INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [projectId, memberId]);
      } catch (err) {
        console.warn("Failed inserting member mapping:", err);
      }
    }

    clearQueryCache("project");

    const auditAction = status === "DRAFT" ? "PROJECT_DRAFT_CREATED" : "PROJECT_CREATED";
    const auditDetail =
      status === "DRAFT"
        ? `Project Manager ${authUser.email} saved project draft '${projectTitle.trim()}' (Code: ${projectId})`
        : `Project Manager ${authUser.email} created and published project '${projectTitle.trim()}' (Code: ${projectId}) with Team Leader ${teamLeaderId || "unassigned"}`;

    await logAuditEvent(
      authUser.id,
      auditAction,
      auditDetail,
      req.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      {
        success: true,
        message: status === "DRAFT" ? "✓ Project draft saved successfully!" : "✓ Project created successfully!",
        project: {
          id: projectId,
          projectCode: projectId,
          projectTitle,
          status,
          priority,
          teamLeaderId,
          memberCount: allMemberIds.size,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Projects POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create project" }, { status: 500 });
  }
}

// PUT: Update Project or Publish Draft
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await req.json();
    const {
      id,
      projectTitle,
      description,
      clientCompany,
      clientContactPerson,
      clientEmail,
      clientPhone,
      startDate,
      endDate,
      contractValue,
      status,
      priority,
      projectType,
      requiredSkills,
      requiredRoles,
      techStack,
      expectedTeamSize,
      projectManagerId,
      teamLeaderId,
      memberUserIds,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID is required." }, { status: 400 });
    }

    // Verify existing project & ownership
    const existing = await queryDb<any[]>(`SELECT * FROM project WHERE id = ? LIMIT 1`, [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = existing[0];
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(authUser.role.toUpperCase());
    const isOwnerPM = proj.projectManagerId === authUser.id || authUser.role === "PROJECT_MANAGER";

    if (!isAdmin && !isOwnerPM) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to modify this project." },
        { status: 403 }
      );
    }

    // Validate Project Manager if changing
    let resolvedPMId: string | null = undefined as any;
    if (projectManagerId !== undefined) {
      const pmValidation = await validateProjectRoleAssignment(projectManagerId, "PROJECT_MANAGER");
      if (!pmValidation.valid) {
        return NextResponse.json({ success: false, error: pmValidation.error }, { status: 400 });
      }
      resolvedPMId = pmValidation.resolvedId;
    }

    // Validate Team Leader if changing
    let resolvedTLId: string | null = undefined as any;
    if (teamLeaderId !== undefined) {
      const tlValidation = await validateProjectRoleAssignment(teamLeaderId, "TEAM_LEADER");
      if (!tlValidation.valid) {
        return NextResponse.json({ success: false, error: tlValidation.error }, { status: 400 });
      }
      resolvedTLId = tlValidation.resolvedId;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (projectTitle) {
      updates.push("projectTitle = ?");
      values.push(projectTitle.trim());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description.trim());
    }
    if (clientCompany) {
      updates.push("clientCompany = ?");
      values.push(clientCompany.trim());
    }
    if (clientContactPerson) {
      updates.push("clientContactPerson = ?");
      values.push(clientContactPerson.trim());
    }
    if (clientEmail) {
      updates.push("clientEmail = ?");
      values.push(clientEmail.trim());
    }
    if (clientPhone) {
      updates.push("clientPhone = ?");
      values.push(clientPhone.trim());
    }
    if (startDate) {
      updates.push("startDate = ?");
      values.push(new Date(startDate));
    }
    if (endDate) {
      updates.push("endDate = ?");
      values.push(new Date(endDate));
    }
    if (contractValue !== undefined) {
      updates.push("contractValue = ?");
      values.push(parseFloat(contractValue));
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    if (priority) {
      updates.push("priority = ?");
      values.push(priority);
    }
    if (projectType) {
      updates.push("projectType = ?");
      values.push(projectType);
    }
    if (requiredSkills !== undefined) {
      updates.push("requiredSkills = ?");
      values.push(requiredSkills);
    }
    if (requiredRoles !== undefined) {
      updates.push("requiredRoles = ?");
      values.push(requiredRoles);
    }
    if (techStack !== undefined) {
      updates.push("techStack = ?");
      values.push(techStack);
    }
    if (expectedTeamSize !== undefined) {
      updates.push("expectedTeamSize = ?");
      values.push(parseInt(expectedTeamSize) || 5);
    }
    if (resolvedPMId !== undefined) {
      updates.push("projectManagerId = ?");
      values.push(resolvedPMId);
    }
    if (resolvedTLId !== undefined) {
      updates.push("teamLeaderId = ?");
      values.push(resolvedTLId);
    }

    if (updates.length > 0) {
      values.push(id);
      await queryDb(`UPDATE project SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    // Sync members if provided
    if (Array.isArray(memberUserIds)) {
      await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [id]);
      const set = new Set<string>(memberUserIds);
      if (teamLeaderId) set.add(teamLeaderId);

      for (const uid of set) {
        if (uid) {
          try {
            await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [id, uid]);
          } catch {}
        }
      }
    }

    clearQueryCache("project");

    let auditAction = "PROJECT_UPDATED";
    let auditDetail = `Updated project ${id} configuration`;

    if (resolvedTLId !== undefined && resolvedTLId !== proj.teamLeaderId) {
      const actorName = (authUser as any).name || authUser.email || "Project Manager";
      const actorRole = (authUser.role || "PROJECT_MANAGER").replace(/_/g, " ");
      const formattedActor = `${actorName} (${actorRole})`;

      const tlRows = await queryDb<any[]>(`SELECT name, role, employeeId FROM user WHERE id = ? LIMIT 1`, [resolvedTLId]);
      const tlUser = tlRows && tlRows.length > 0 ? tlRows[0] : null;
      const tlFormatted = tlUser ? `${tlUser.name} (${tlUser.role?.replace(/_/g, " ") || "Team Leader"})` : "Team Leader";

      if (!proj.teamLeaderId) {
        auditAction = "PROJECT_ASSIGNED_TO_TEAM_LEADER";
        auditDetail = `${formattedActor} assigned project '${proj.projectTitle}' to ${tlFormatted}`;
      } else {
        auditAction = "TEAM_LEADER_REASSIGNED";
        auditDetail = `${formattedActor} reassigned project '${proj.projectTitle}' to ${tlFormatted}`;
      }
    } else if (proj.status === "DRAFT" && status && status !== "DRAFT") {
      auditAction = "PROJECT_DRAFT_PUBLISHED";
      auditDetail = `Project Manager ${authUser.email} published draft project '${proj.projectTitle}' (ID: ${id}) to status ${status}`;
    } else if (proj.status === "DRAFT") {
      auditAction = "PROJECT_DRAFT_UPDATED";
      auditDetail = `Project Manager ${authUser.email} updated saved draft project '${proj.projectTitle}' (ID: ${id})`;
    }

    await logAuditEvent(
      authUser.id,
      auditAction,
      auditDetail,
      req.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: auditAction === "PROJECT_ASSIGNED_TO_TEAM_LEADER"
        ? "✓ Project successfully assigned to Team Leader!"
        : auditAction === "TEAM_LEADER_REASSIGNED"
        ? "✓ Project successfully reassigned to new Team Leader!"
        : auditAction === "PROJECT_DRAFT_PUBLISHED"
        ? "✓ Project draft successfully published & activated!"
        : "✓ Project successfully updated!",
    });
  } catch (error: any) {
    console.error("Projects PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update project" }, { status: 500 });
  }
}

// DELETE: Delete Project or Draft
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID is required." }, { status: 400 });
    }

    const existing = await queryDb<any[]>(`SELECT * FROM project WHERE id = ? LIMIT 1`, [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = existing[0];
    const authUser = authResult.user;
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(authUser.role.toUpperCase());
    const isOwnerPM = proj.projectManagerId === authUser.id || (authUser.role === "PROJECT_MANAGER" && proj.status === "DRAFT");

    if (!isAdmin && !isOwnerPM) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this project." },
        { status: 403 }
      );
    }

    // Delete mappings & tasks
    await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [id]);
    await queryDb(`DELETE FROM task WHERE projectId = ?`, [id]);
    await queryDb(`DELETE FROM project WHERE id = ?`, [id]);

    clearQueryCache("project");

    const auditAction = proj.status === "DRAFT" ? "PROJECT_DRAFT_DELETED" : "PROJECT_DELETED";
    await logAuditEvent(
      authUser.id,
      auditAction,
      `User ${authUser.email} deleted ${proj.status === "DRAFT" ? "draft" : "project"} '${proj.projectTitle}' (ID: ${id})`,
      req.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `✓ Project ${proj.status === "DRAFT" ? "draft" : ""} successfully deleted.`,
    });
  } catch (error: any) {
    console.error("Projects DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete project." }, { status: 500 });
  }
}