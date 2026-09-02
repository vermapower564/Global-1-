import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const EVALUATOR_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "PROJECT_MANAGER", "TEAM_LEADER"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const { searchParams } = new URL(request.url);

    const filterUserId = searchParams.get("userId");
    const filterEmployeeId = searchParams.get("employeeId");
    const filterPeriod = searchParams.get("period"); // 'today' | 'yesterday' | 'daywise' | 'month' | 'year'
    const filterDate = searchParams.get("date");
    const filterMonth = searchParams.get("month");
    const filterYear = searchParams.get("year");
    const search = searchParams.get("search") || "";

    const userRole = (authUser.role || "").toUpperCase();
    const isHrOrAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"].includes(userRole);
    const isTeamLeader = userRole === "TEAM_LEADER";
    const isProjectManager = userRole === "PROJECT_MANAGER";
    const isManager = isHrOrAdmin || isTeamLeader || isProjectManager;

    let sql = `
      SELECT 
        w.*,
        u.id AS user_id, u.employeeId AS user_employeeId, u.name AS user_name, u.email AS user_email, u.role AS user_role,
        d.name AS department_name
      FROM dailyworkupdate w
      LEFT JOIN user u ON w.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // RBAC & Scope Scoping:
    // - Regular Employee: Strictly sees own updates
    // - Team Leader / PM: Sees own + updates of members in their team/projects
    // - HR / Admin: Sees all or filtered
    let teamMemberIds: string[] = [];
    if (isTeamLeader || isProjectManager) {
      const managedTeamRows = await queryDb<any[]>(
        `SELECT B AS memberId FROM _assignedstaffprojects WHERE A IN (
           SELECT id FROM project WHERE teamLeaderId = ? OR projectManagerId = ?
         )
         UNION
         SELECT id AS memberId FROM user WHERE managerId = ?`,
        [authUser.id, authUser.id, authUser.id]
      );
      teamMemberIds = (managedTeamRows || []).map((m) => m.memberId).filter(Boolean);
    }

    if (!isHrOrAdmin) {
      if (isTeamLeader || isProjectManager) {
        const allowedIds = Array.from(new Set([authUser.id, ...teamMemberIds]));
        const placeholders = allowedIds.map(() => "?").join(",");
        sql += ` AND w.userId IN (${placeholders})`;
        params.push(...allowedIds);
      } else {
        sql += ` AND w.userId = ?`;
        params.push(authUser.id);
      }
    } else {
      if (filterUserId) {
        sql += ` AND w.userId = ?`;
        params.push(filterUserId);
      }
      if (filterEmployeeId && filterEmployeeId !== "ALL") {
        sql += ` AND (u.employeeId = ? OR u.id = ?)`;
        params.push(filterEmployeeId, filterEmployeeId);
      }
    }

    // Time Slide / Period Filtering
    if (filterPeriod === "today") {
      sql += ` AND DATE(w.date) = CURDATE()`;
    } else if (filterPeriod === "yesterday") {
      sql += ` AND DATE(w.date) = SUBDATE(CURDATE(), 1)`;
    } else if (filterPeriod === "daywise" && filterDate) {
      sql += ` AND DATE(w.date) = DATE(?)`;
      params.push(filterDate);
    } else if (filterPeriod === "month") {
      const targetMonth = filterMonth || new Date().toISOString().slice(0, 7);
      sql += ` AND DATE_FORMAT(w.date, '%Y-%m') = ?`;
      params.push(targetMonth);
    } else if (filterPeriod === "year") {
      const targetYear = filterYear || new Date().getFullYear().toString();
      sql += ` AND YEAR(w.date) = ?`;
      params.push(targetYear);
    } else {
      if (filterDate) {
        sql += ` AND DATE(w.date) = DATE(?)`;
        params.push(filterDate);
      } else if (filterMonth) {
        sql += ` AND DATE_FORMAT(w.date, '%Y-%m') = ?`;
        params.push(filterMonth);
      } else if (filterYear) {
        sql += ` AND YEAR(w.date) = ?`;
        params.push(filterYear);
      }
    }

    if (search.trim()) {
      sql += ` AND (u.name LIKE ? OR u.employeeId LIKE ? OR w.projectName LIKE ? OR w.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY w.date DESC, w.submittedAt DESC, w.id DESC`;

    const rawRows = await queryDbCached<any[]>(sql, params, 5);

    // Batch fetch associated work evidence documents
    const workIds = (rawRows || []).map((r) => r.id);
    let evidenceMap: { [dwId: string]: any[] } = {};
    if (workIds.length > 0) {
      const placeholders = workIds.map(() => "?").join(",");
      const evidenceRows = await queryDb<any[]>(
        `SELECT id, dailyWorkUpdateId, fileName, fileType, fileSize, fileUrl, uploadedByUserId, uploadedAt 
         FROM workevidence 
         WHERE dailyWorkUpdateId IN (${placeholders})
         ORDER BY uploadedAt ASC`,
        workIds
      );
      (evidenceRows || []).forEach((ev) => {
        if (!evidenceMap[ev.dailyWorkUpdateId]) evidenceMap[ev.dailyWorkUpdateId] = [];
        evidenceMap[ev.dailyWorkUpdateId].push(ev);
      });
    }

    const updates = (rawRows || []).map((r) => {
      let workEvList = evidenceMap[r.id] || [];
      // Fallback to direct evidence columns if workevidence table row isn't created yet
      if (workEvList.length === 0 && r.evidenceUrl) {
        workEvList = [
          {
            id: `EV-${r.id}`,
            dailyWorkUpdateId: r.id,
            fileName: r.evidenceName || "work-evidence-document",
            fileType: r.evidenceType || "application/octet-stream",
            fileSize: r.evidenceSize || 0,
            fileUrl: r.evidenceUrl,
            uploadedByUserId: r.userId,
            uploadedAt: r.submittedAt,
          },
        ];
      }

      return {
        id: r.id,
        userId: r.userId,
        date: r.date,
        projectName: r.projectName,
        clientName: r.clientName,
        startTime: r.startTime,
        endTime: r.endTime,
        hoursWorked: r.hoursWorked,
        priority: r.priority,
        description: r.description,
        achievements: r.achievements,
        blockers: r.blockers,
        tomorrowPlan: r.tomorrowPlan,
        gitCommits: r.gitCommits,
        driveLinks: r.driveLinks,
        screenshots: r.screenshots,
        evidenceUrl: r.evidenceUrl,
        evidenceName: r.evidenceName,
        evidenceType: r.evidenceType,
        evidenceSize: r.evidenceSize,
        workEvidence: workEvList,
        status: r.status,
        rating: r.rating,
        managerRemarks: r.managerRemarks,
        submittedAt: r.submittedAt,
        user: {
          id: r.user_id,
          employeeId: r.user_employeeId,
          name: r.user_name,
          email: r.user_email,
          role: r.user_role,
          department: r.department_name ? { name: r.department_name } : null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      total: updates.length,
      data: updates,
    });
  } catch (error: any) {
    console.error("Daily work fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch work updates." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json().catch(() => ({}));
    const {
      projectId,
      taskId,
      projectName,
      clientName,
      startTime,
      endTime,
      hoursWorked,
      priority,
      description,
      achievements,
      blockers,
      tomorrowPlan,
      gitCommits,
      driveLinks,
      screenshots,
      evidenceUrl,
      evidenceName,
      evidenceType,
      evidenceSize,
      workEvidence,
    } = body;

    if (!description && !projectName && !projectId && !taskId) {
      return NextResponse.json(
        { success: false, error: "Project, task, or work description is required." },
        { status: 400 }
      );
    }

    // Resolve optional project and task titles
    let finalProjectName = projectName || "OMS Operations";
    let finalProjectId = projectId || null;
    let finalTaskId = taskId || null;

    if (finalProjectId) {
      const projRows = await queryDb<any[]>(`SELECT id, projectTitle FROM project WHERE id = ? LIMIT 1`, [finalProjectId]);
      if (projRows && projRows.length > 0) {
        finalProjectName = projRows[0].projectTitle;
      }
    }

    if (finalTaskId) {
      const taskRows = await queryDb<any[]>(`SELECT id, title, projectId FROM task WHERE id = ? LIMIT 1`, [finalTaskId]);
      if (taskRows && taskRows.length > 0) {
        if (!finalProjectId && taskRows[0].projectId) {
          finalProjectId = taskRows[0].projectId;
        }
      }
    }

    const updateId = `DWU-${authUser.id}-${Date.now()}`;
    const parsedHours = parseFloat(hoursWorked) || 8.0;

    // Resolve primary attachment metadata & validate persistent storage URL format
    const mainEvidence = Array.isArray(workEvidence) && workEvidence.length > 0 ? workEvidence[0] : null;
    const primaryUrl = evidenceUrl || mainEvidence?.fileUrl || null;
    const primaryName = evidenceName || mainEvidence?.fileName || null;
    const primaryType = evidenceType || mainEvidence?.fileType || null;
    const primarySize = Number(evidenceSize || mainEvidence?.fileSize) || null;

    // File URL persistence check: Reject local file system paths (e.g., C:\fakepath, blob:, file://)
    if (primaryUrl) {
      const lowerUrl = primaryUrl.toLowerCase();
      if (lowerUrl.includes("fakepath") || lowerUrl.startsWith("file:") || lowerUrl.startsWith("blob:")) {
        return NextResponse.json(
          { success: false, error: "Invalid evidence file: Temporary local browser paths are not permitted. Files must be stored via persistent storage." },
          { status: 400 }
        );
      }
    }

    // 1. Insert into dailyworkupdate
    try {
      await queryDb(
        `INSERT INTO dailyworkupdate (
          id, userId, date, hoursWorked, description, achievements, blockers, tomorrowPlan,
          status, priority, projectName, clientName, startTime, endTime, gitCommits, driveLinks, screenshots,
          evidenceUrl, evidenceName, evidenceType, evidenceSize, projectId, taskId, submittedAt
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          updateId,
          authUser.id,
          parsedHours,
          description || "Daily Task Work Log",
          achievements || null,
          blockers || null,
          tomorrowPlan || null,
          priority === "HIGH" ? "HIGH" : priority === "LOW" ? "LOW" : "MEDIUM",
          finalProjectName,
          clientName || "Internal Enterprise",
          startTime || "09:00 AM",
          endTime || "06:00 PM",
          gitCommits || null,
          driveLinks || null,
          screenshots || null,
          primaryUrl,
          primaryName,
          primaryType,
          primarySize,
          finalProjectId,
          finalTaskId,
        ]
      );
    } catch (insertErr: any) {
      // Fallback for schemas without taskId column
      await queryDb(
        `INSERT INTO dailyworkupdate (
          id, userId, date, hoursWorked, description, achievements, blockers, tomorrowPlan,
          status, priority, projectName, clientName, startTime, endTime, gitCommits, driveLinks, screenshots,
          evidenceUrl, evidenceName, evidenceType, evidenceSize, projectId, submittedAt
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          updateId,
          authUser.id,
          parsedHours,
          description || "Daily Task Work Log",
          achievements || null,
          blockers || null,
          tomorrowPlan || null,
          priority === "HIGH" ? "HIGH" : priority === "LOW" ? "LOW" : "MEDIUM",
          finalProjectName,
          clientName || "Internal Enterprise",
          startTime || "09:00 AM",
          endTime || "06:00 PM",
          gitCommits || null,
          driveLinks || null,
          screenshots || null,
          primaryUrl,
          primaryName,
          primaryType,
          primarySize,
          finalProjectId,
        ]
      );
    }

    // 2. Insert records into workevidence table for all attached evidence documents
    const attachmentsToSave = Array.isArray(workEvidence) && workEvidence.length > 0
      ? workEvidence
      : primaryUrl
      ? [{ fileName: primaryName || "work-evidence", fileType: primaryType || "application/octet-stream", fileSize: primarySize || 0, fileUrl: primaryUrl }]
      : [];

    for (const att of attachmentsToSave) {
      if (att.fileUrl) {
        const evId = `WE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO workevidence (id, dailyWorkUpdateId, fileName, fileType, fileSize, fileUrl, uploadedByUserId, uploadedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))`,
          [
            evId,
            updateId,
            att.fileName || "work-evidence-document",
            att.fileType || "application/octet-stream",
            Number(att.fileSize) || 0,
            att.fileUrl,
            authUser.id,
          ]
        );
      }
    }

    clearQueryCache("dailyworkupdate");

    // 3. Send Notification to Manager / Team Leader if evidence attached
    if (attachmentsToSave.length > 0) {
      try {
        const managerRows = await queryDb<any[]>(
          `SELECT managerId FROM user WHERE id = ? LIMIT 1`,
          [authUser.id]
        );
        const managerId = managerRows && managerRows[0]?.managerId;
        if (managerId) {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'INFO', 0, '/daily-work/approvals', NOW(3))`,
            [
              notifId,
              managerId,
              `📎 Work Evidence Submitted: ${authUser.email.split("@")[0]}`,
              `${authUser.email.split("@")[0]} submitted a Daily Work Update for project "${projectName || "General"}" with ${attachmentsToSave.length} work-evidence document(s) attached.`,
            ]
          );
        }
      } catch (notifErr) {
        console.warn("Failed sending evidence notification:", notifErr);
      }
    }

    await logAuditEvent(
      authUser.id,
      "WORK_UPDATE_SUBMITTED",
      `Submitted daily work report for project: ${projectName || "General"} with ${attachmentsToSave.length} evidence file(s)`
    );

    return NextResponse.json(
      {
        success: true,
        message: "✓ Daily Work EOD update and work evidence saved to database!",
        id: updateId,
        hasEvidence: attachmentsToSave.length > 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Submit work update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit work update." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const userRole = (authResult.user.role || "").toUpperCase();
    const isManager = EVALUATOR_ROLES.includes(userRole);
    if (!isManager) {
      return NextResponse.json({ success: false, error: "Forbidden: Only managers and team leaders can evaluate work updates." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, status, rating, managerRemarks } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Report ID and Status are required." }, { status: 400 });
    }

    await queryDb(
      `UPDATE dailyworkupdate SET status = ?, rating = ?, managerRemarks = ? WHERE id = ?`,
      [status.toUpperCase(), rating || 5, managerRemarks || "Approved by Manager", id]
    );

    clearQueryCache("dailyworkupdate");

    return NextResponse.json({
      success: true,
      message: `EOD report ${id} evaluated by Manager.`,
    });
  } catch (error: any) {
    console.error("Evaluate work update error:", error);
    return NextResponse.json({ success: false, error: "Failed to evaluate work update." }, { status: 500 });
  }
}
