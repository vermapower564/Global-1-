import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

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
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

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

      const isUserTeamLeader = p.teamLeaderId === authUser.id;
      const isUserMember = projectMembers.some((m) => m.id === authUser.id) || isUserTeamLeader;

      return {
        id: p.id,
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
        createdAt: p.createdAt,
        teamLeader: tl,
        teamLeaderId: p.teamLeaderId,
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
        },
        customerReview: review || null,
        isUserTeamLeader,
        isUserMember,
      };
    });

    // Scoping: Admin sees all projects. Non-admin sees projects where they are Team Leader OR Member
    const accessibleProjects = isAdmin
      ? enriched
      : enriched.filter((p) => p.isUserMember || p.isUserTeamLeader);

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

// POST: Admin creates a new project with Team Leader and Member assignments
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Administrators can create new projects." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      projectTitle,
      description,
      clientCompany,
      clientContactPerson,
      clientEmail,
      clientPhone,
      startDate,
      endDate,
      contractValue,
      status = "IN_PROGRESS",
      teamLeaderId,
      memberUserIds = [],
    } = body;

    if (!projectTitle || !projectTitle.trim()) {
      return NextResponse.json({ success: false, error: "Project title is required." }, { status: 400 });
    }

    const projectId = `PRJ-${Date.now().toString(36).toUpperCase()}`;

    await queryDb(
      `INSERT INTO project (
        id, projectTitle, description, clientCompany, clientContactPerson, clientEmail,
        clientPhone, startDate, endDate, contractValue, status, teamLeaderId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        projectId,
        projectTitle.trim(),
        description ? description.trim() : `Enterprise project: ${projectTitle.trim()}`,
        clientCompany ? clientCompany.trim() : "Global Enterprise Client",
        clientContactPerson ? clientContactPerson.trim() : "Client Representative",
        clientEmail ? clientEmail.trim() : "client@enterprise.com",
        clientPhone ? clientPhone.trim() : "+91 98765 00000",
        startDate ? new Date(startDate) : new Date(),
        endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 3600 * 1000),
        parseFloat(contractValue) || 250000,
        status,
        teamLeaderId || null,
      ]
    );

    // Associate assigned members in _assignedstaffprojects
    const allMemberIds = new Set<string>();
    if (teamLeaderId) allMemberIds.add(teamLeaderId);
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

    logAuditEvent(
      authUser.id,
      "PROJECT_CREATED",
      `Created project '${projectTitle.trim()}' with Team Leader ${teamLeaderId || "unassigned"} and ${allMemberIds.size} member(s)`,
      req.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      {
        success: true,
        message: "✓ Project successfully created with Team Leader & members!",
        data: { id: projectId, projectTitle, teamLeaderId, memberCount: allMemberIds.size },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Projects POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create project" }, { status: 500 });
  }
}

// PUT / PATCH: Admin updates project details, Team Leader, or Member assignments
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Administrators can modify project details." },
        { status: 403 }
      );
    }

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
      teamLeaderId,
      memberUserIds,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID is required." }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (projectTitle) {
      updates.push("projectTitle = ?");
      values.push(projectTitle.trim());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
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
    if (teamLeaderId !== undefined) {
      updates.push("teamLeaderId = ?");
      values.push(teamLeaderId || null);
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

    logAuditEvent(
      authUser.id,
      "PROJECT_UPDATED",
      `Updated project ${id} configuration`,
      req.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: "✓ Project successfully updated!",
    });
  } catch (error: any) {
    console.error("Projects PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update project" }, { status: 500 });
  }
}