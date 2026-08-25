import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const HR_ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"];
const MANAGEMENT_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "PROJECT_MANAGER", "TEAM_LEADER"];

// Helper to resolve reporting structure for a user
async function resolveReportingHierarchy(userId: string, employeeId: string) {
  // 1. Find user and direct manager
  const uRows = await queryDb<any[]>(
    `SELECT u.id, u.employeeId, u.name, u.email, u.role, u.departmentId, u.managerId,
            d.name AS departmentName,
            m.id AS manager_id, m.name AS manager_name, m.email AS manager_email, m.role AS manager_role
     FROM user u
     LEFT JOIN department d ON u.departmentId = d.id
     LEFT JOIN user m ON u.managerId = m.id
     WHERE u.id = ? OR u.employeeId = ? LIMIT 1`,
    [userId, employeeId]
  );
  const u = uRows && uRows.length > 0 ? uRows[0] : null;

  // 2. Find assigned project, Team Leader, and Project Manager
  const pRows = await queryDb<any[]>(
    `SELECT p.id, p.projectTitle, p.teamLeaderId, p.projectManagerId,
            tl.name AS tl_name, tl.email AS tl_email, tl.employeeId AS tl_employeeId,
            pm.name AS pm_name, pm.email AS pm_email, pm.employeeId AS pm_employeeId
     FROM project p
     INNER JOIN _assignedstaffprojects asp ON asp.A = p.id
     LEFT JOIN user tl ON p.teamLeaderId = tl.id
     LEFT JOIN user pm ON p.projectManagerId = pm.id
     WHERE asp.B = ?
     ORDER BY p.createdAt DESC LIMIT 1`,
    [u?.id || userId]
  );
  const p = pRows && pRows.length > 0 ? pRows[0] : null;

  const teamLeader = p?.teamLeaderId ? {
    id: p.teamLeaderId,
    name: p.tl_name,
    email: p.tl_email,
    employeeId: p.tl_employeeId,
  } : (u?.managerId ? {
    id: u.manager_id,
    name: u.manager_name,
    email: u.manager_email,
    employeeId: u.manager_employeeId,
  } : null);

  const projectManager = p?.projectManagerId ? {
    id: p.projectManagerId,
    name: p.pm_name,
    email: p.pm_email,
    employeeId: p.pm_employeeId,
  } : null;

  return {
    user: u,
    project: p,
    teamLeader,
    projectManager,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isHrAdmin = HR_ADMIN_ROLES.includes(roleUpper);
    const isPM = roleUpper === "PROJECT_MANAGER";
    const isTL = roleUpper === "TEAM_LEADER";

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search") || "";

    let sql = `
      SELECT 
        r.*,
        u.name AS user_name, u.email AS user_email, u.employeeId AS user_employeeId, u.role AS user_role, u.salary AS user_salary, u.createdAt AS user_joinedAt,
        d.name AS department_name
      FROM resignation r
      LEFT JOIN user u ON (r.userId = u.id OR r.employeeId = u.employeeId)
      LEFT JOIN department d ON u.departmentId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    const authEmployeeId = (authUser as any).employeeId || authUser.id;

    if (!isHrAdmin) {
      if (isTL) {
        // Team Leader sees own resignation + resignations of team members in their led projects
        sql += ` AND (
          r.userId = ? OR r.employeeId = ?
          OR r.userId IN (
            SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE teamLeaderId = ?)
          )
          OR r.userId IN (SELECT id FROM user WHERE managerId = ?)
        )`;
        params.push(authUser.id, authEmployeeId, authUser.id, authUser.id);
      } else if (isPM) {
        // Project Manager sees own resignation + resignations of team members in their managed projects
        sql += ` AND (
          r.userId = ? OR r.employeeId = ?
          OR r.userId IN (
            SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE projectManagerId = ?)
          )
        )`;
        params.push(authUser.id, authEmployeeId, authUser.id);
      } else {
        // Employee strictly sees only their own resignation
        sql += ` AND (r.userId = ? OR r.employeeId = ?)`;
        params.push(authUser.id, authEmployeeId);
      }
    }

    if (statusFilter && statusFilter !== "ALL") {
      sql += ` AND r.status = ?`;
      params.push(statusFilter);
    }

    if (search.trim()) {
      sql += ` AND (r.employeeName LIKE ? OR r.employeeId LIKE ? OR r.reason LIKE ? OR r.department LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY r.submittedAt DESC`;

    const rawRows = await queryDb<any[]>(sql, params);

    const resignations = (rawRows || []).map((r) => {
      let trackingMeta: any = {};
      try {
        if (r.managerRemarks && (r.managerRemarks.startsWith("{") || r.managerRemarks.startsWith("["))) {
          trackingMeta = JSON.parse(r.managerRemarks);
        }
      } catch {}

      // Calculate Visual Workflow Stage
      let currentStage = "SUBMITTED";
      let stageDescription = "Submitted to Team Leader for Review";
      if (r.status === "APPROVED") {
        currentStage = "APPROVED";
        stageDescription = "Resignation Approved by HR";
      } else if (r.status === "COMPLETED") {
        currentStage = "COMPLETED";
        stageDescription = "Exit Clearance & Formal Handover Completed";
      } else if (r.status === "REJECTED") {
        currentStage = "REJECTED";
        stageDescription = "Resignation Rejected";
      } else if (r.status === "WITHDRAWN") {
        currentStage = "WITHDRAWN";
        stageDescription = "Withdrawn by Employee";
      } else if (trackingMeta.stage === "FORWARDED_TO_HR" || trackingMeta.stage === "UNDER_HR_PROCESSING") {
        currentStage = "UNDER_HR_PROCESSING";
        stageDescription = "Under Final HR Review & Processing";
      } else if (trackingMeta.stage === "FORWARDED_TO_SENIOR" || trackingMeta.stage === "UNDER_SENIOR_REVIEW") {
        currentStage = "UNDER_SENIOR_REVIEW";
        stageDescription = "Under Project Manager / Senior Review";
      } else if (trackingMeta.stage === "UNDER_TEAM_LEADER_REVIEW" || r.status === "UNDER_REVIEW") {
        currentStage = "UNDER_TEAM_LEADER_REVIEW";
        stageDescription = "Under Team Leader Evaluation";
      }

      return {
        id: r.id,
        resignationId: r.resignationId || `RES-${r.id.slice(0, 6)}`,
        userId: r.userId,
        employeeId: r.employeeId || r.user_employeeId,
        employeeName: r.employeeName || r.user_name,
        email: r.email || r.user_email,
        department: r.department || r.department_name || "Engineering",
        role: r.role || r.user_role || "Software Engineer",
        resignationDate: r.resignationDate,
        noticePeriodDays: r.noticePeriodDays || 15,
        lastWorkingDay: r.lastWorkingDay,
        lastWorkingDayFormatted: r.lastWorkingDayFormatted,
        reason: r.reason,
        status: r.status || "SUBMITTED",
        currentStage,
        stageDescription,
        hrRemarks: r.hrRemarks || null,
        managerRemarks: typeof r.managerRemarks === "string" && !r.managerRemarks.startsWith("{") ? r.managerRemarks : (trackingMeta.summaryRemarks || null),
        trackingHistory: trackingMeta.history || [],
        teamLeader: trackingMeta.teamLeader || null,
        projectManager: trackingMeta.projectManager || null,
        submittedAt: r.submittedAt || r.createdAt,
        approvedAt: r.approvedAt,
        rejectedAt: r.rejectedAt,
      };
    });

    const summary = {
      total: resignations.length,
      pending: resignations.filter((r) => ["SUBMITTED", "UNDER_REVIEW"].includes(r.status)).length,
      underTlReview: resignations.filter((r) => r.currentStage === "UNDER_TEAM_LEADER_REVIEW" || r.currentStage === "SUBMITTED").length,
      underSeniorReview: resignations.filter((r) => r.currentStage === "UNDER_SENIOR_REVIEW").length,
      underHrProcessing: resignations.filter((r) => r.currentStage === "UNDER_HR_PROCESSING").length,
      approved: resignations.filter((r) => r.status === "APPROVED" || r.status === "COMPLETED").length,
      rejected: resignations.filter((r) => r.status === "REJECTED").length,
    };

    return NextResponse.json({
      success: true,
      data: resignations,
      summary,
    });
  } catch (error: any) {
    console.error("GET /api/resignations error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch resignations." }, { status: 500 });
  }
}

// POST: Employee Submits Resignation along the Reporting Hierarchy
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json().catch(() => ({}));
    const {
      reason,
      resignationDate,
      proposedLastWorkingDate,
      lastWorkingDay,
      noticePeriodDays = 15,
      additionalComments,
      confirmationChecked,
    } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: "Resignation reason is required." }, { status: 400 });
    }

    // Resolve user's actual database profile & dynamic reporting hierarchy
    const authEmployeeId = (authUser as any).employeeId || authUser.id;
    const hierarchy = await resolveReportingHierarchy(authUser.id, authEmployeeId);
    const dbUser = hierarchy.user || authUser;

    // Check for existing active/pending resignation
    const existing = await queryDb<any[]>(
      `SELECT id, resignationId, status FROM resignation WHERE (userId = ? OR employeeId = ?) AND status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED') LIMIT 1`,
      [dbUser.id, dbUser.employeeId]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `You already have an active resignation request (${existing[0].resignationId}) with status "${existing[0].status}".`,
        },
        { status: 400 }
      );
    }

    // Compute Last Working Day
    const rDate = resignationDate ? new Date(resignationDate) : new Date();
    const lDate = lastWorkingDay || proposedLastWorkingDate
      ? new Date(lastWorkingDay || proposedLastWorkingDate)
      : new Date(rDate.getTime() + (Number(noticePeriodDays) || 15) * 24 * 3600 * 1000);

    const lwdFormatted = lDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const resignationId = `RES-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const initialTracking = {
      stage: "UNDER_TEAM_LEADER_REVIEW",
      teamLeader: hierarchy.teamLeader,
      projectManager: hierarchy.projectManager,
      summaryRemarks: additionalComments || null,
      history: [
        {
          action: "SUBMITTED",
          performedBy: dbUser.name,
          role: dbUser.role,
          timestamp: new Date().toISOString(),
          notes: reason.trim(),
        },
      ],
    };

    await queryDb(
      `INSERT INTO resignation (
        id, resignationId, userId, employeeId, employeeName, email,
        department, role, resignationDate, noticePeriodDays, lastWorkingDay, lastWorkingDayFormatted,
        reason, status, managerRemarks, hrRemarks, submittedAt, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, 'SUBMITTED', ?, ?, NOW(3), NOW(3), NOW(3)
      )`,
      [
        `res_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        resignationId,
        dbUser.id,
        dbUser.employeeId,
        dbUser.name,
        dbUser.email,
        dbUser.departmentName || body.department || "Engineering",
        dbUser.role || body.role || "Software Engineer",
        rDate,
        Number(noticePeriodDays) || 15,
        lDate,
        lwdFormatted,
        reason.trim(),
        JSON.stringify(initialTracking),
        additionalComments ? additionalComments.trim() : null,
      ]
    );

    clearQueryCache("resignation");

    // Send Notification to Team Leader / Reporting Manager
    if (hierarchy.teamLeader?.id) {
      try {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, 'WARNING', 0, '/team-leader', NOW(3))`,
          [
            notifId,
            hierarchy.teamLeader.id,
            `📄 Resignation Submitted: ${dbUser.name}`,
            `${dbUser.name} (${dbUser.employeeId}) has submitted a resignation request with proposed LWD: ${lwdFormatted}. Please review and forward to senior authority.`,
          ]
        );
      } catch (err) {
        console.warn("Failed to notify Team Leader of resignation:", err);
      }
    }

    // Record immutable audit log
    await logAuditEvent(
      dbUser.id,
      "RESIGNATION_SUBMITTED",
      `Employee ${dbUser.name} (${dbUser.employeeId}) submitted resignation ${resignationId} with proposed Last Working Day ${lwdFormatted}.`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      {
        success: true,
        message: "✓ Resignation submitted successfully to your Team Leader for review.",
        resignationId,
        data: {
          resignationId,
          employeeId: dbUser.employeeId,
          employeeName: dbUser.name,
          lastWorkingDay: lDate,
          lastWorkingDayFormatted: lwdFormatted,
          status: "SUBMITTED",
          teamLeader: hierarchy.teamLeader,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/resignations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit resignation." }, { status: 500 });
  }
}

// PATCH: Hierarchical Review & Forwarding (Employee -> Team Leader -> Senior Authority -> HR)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isHrAdmin = HR_ADMIN_ROLES.includes(roleUpper);
    const isPM = roleUpper === "PROJECT_MANAGER";
    const isTL = roleUpper === "TEAM_LEADER";

    const body = await request.json().catch(() => ({}));
    const { id, action, comments, recommendation, proposedLastWorkingDate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Resignation ID is required." }, { status: 400 });
    }

    const existingRows = await queryDb<any[]>(
      `SELECT r.*, u.name AS user_name, u.email AS user_email, u.id AS user_id_real
       FROM resignation r
       LEFT JOIN user u ON (r.userId = u.id OR r.employeeId = u.employeeId)
       WHERE r.id = ? OR r.resignationId = ?
       LIMIT 1`,
      [id, id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Resignation request not found." }, { status: 404 });
    }

    const r = existingRows[0];
    const authEmpId = (authUser as any).employeeId || authUser.id;
    const isRequester = r.userId === authUser.id || r.employeeId === authEmpId || r.user_id_real === authUser.id;

    let tracking: any = { history: [] };
    try {
      if (r.managerRemarks && (r.managerRemarks.startsWith("{") || r.managerRemarks.startsWith("["))) {
        tracking = JSON.parse(r.managerRemarks);
      }
    } catch {}

    let nextStatus = r.status;
    let nextStage = tracking.stage || "UNDER_TEAM_LEADER_REVIEW";
    let logAction = "RESIGNATION_UPDATED";
    let logDetails = "";

    // 1. Employee Action: Withdraw Resignation
    if (action === "WITHDRAW") {
      if (!isRequester && !isHrAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden: You can only withdraw your own resignation." }, { status: 403 });
      }
      if (r.status === "APPROVED" || r.status === "COMPLETED") {
        return NextResponse.json({ success: false, error: "Cannot withdraw a resignation that has already been approved or completed." }, { status: 400 });
      }

      nextStatus = "WITHDRAWN";
      nextStage = "WITHDRAWN";
      logAction = "RESIGNATION_WITHDRAWN";
      logDetails = `${(authUser as any).name || authUser.email} withdrew resignation ${r.resignationId}.`;

      tracking.history = tracking.history || [];
      tracking.history.push({
        action: "WITHDRAWN",
        performedBy: (authUser as any).name || authUser.email,
        role: authUser.role,
        timestamp: new Date().toISOString(),
        notes: comments || "Withdrawn by employee",
      });
    }

    // 2. Team Leader Action: Review and Forward to Senior Authority / Project Manager
    else if (action === "TL_REVIEW" || action === "TL_FORWARD") {
      if (!isTL && !isPM && !isHrAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden: Team Leader or Senior Authority authorization required." }, { status: 403 });
      }

      nextStatus = "UNDER_REVIEW";
      nextStage = "FORWARDED_TO_SENIOR";
      logAction = "RESIGNATION_FORWARDED_BY_TL";
      logDetails = `Team Leader ${(authUser as any).name || authUser.email} reviewed resignation ${r.resignationId} with recommendation: "${recommendation || "RECOMMENDED_APPROVAL"}". Forwarded to Senior Authority.`;

      tracking.history = tracking.history || [];
      tracking.history.push({
        action: "TL_REVIEWED",
        performedBy: (authUser as any).name || authUser.email,
        role: "TEAM_LEADER",
        recommendation: recommendation || "RECOMMENDED_APPROVAL",
        timestamp: new Date().toISOString(),
        notes: comments || "Reviewed and recommended for next approval tier.",
      });
      tracking.stage = nextStage;
      tracking.tlRecommendation = recommendation || "RECOMMENDED_APPROVAL";
      tracking.tlComments = comments || null;

      // Notify Project Manager / Senior Admin
      if (tracking.projectManager?.id) {
        try {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'WARNING', 0, '/project-manager', NOW(3))`,
            [
              notifId,
              tracking.projectManager.id,
              `📄 Resignation Forwarded: ${r.employeeName}`,
              `Team Leader has reviewed and forwarded ${r.employeeName}'s resignation to you for review.`,
            ]
          );
        } catch {}
      }
    }

    // 3. Project Manager / Senior Authority Action: Forward to HR
    else if (action === "SENIOR_FORWARD" || action === "PM_FORWARD") {
      if (!isPM && !isHrAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden: Project Manager or Senior Authority authorization required." }, { status: 403 });
      }

      nextStatus = "UNDER_REVIEW";
      nextStage = "FORWARDED_TO_HR";
      logAction = "RESIGNATION_FORWARDED_TO_HR";
      logDetails = `Project Manager ${(authUser as any).name || authUser.email} forwarded resignation ${r.resignationId} to Human Resources for final processing.`;

      tracking.history = tracking.history || [];
      tracking.history.push({
        action: "PM_REVIEWED",
        performedBy: (authUser as any).name || authUser.email,
        role: "PROJECT_MANAGER",
        timestamp: new Date().toISOString(),
        notes: comments || "Reviewed and forwarded to HR for formal exit processing.",
      });
      tracking.stage = nextStage;

      // Notify HR
      try {
        const hrUsers = await queryDb<any[]>(`SELECT id FROM user WHERE role IN ('HR', 'SUPER_ADMIN', 'ADMIN_HR') AND isActive = 1`);
        for (const hr of hrUsers || []) {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'INFO', 0, '/hr/resignation', NOW(3))`,
            [
              notifId,
              hr.id,
              `📋 Resignation Ready for HR: ${r.employeeName}`,
              `${r.employeeName}'s resignation has completed Team Leader & PM review and is awaiting final HR processing.`,
            ]
          );
        }
      } catch {}
    }

    // 4. HR / Super Admin Action: Final Approval, Completion, or Rejection
    else if (action === "HR_APPROVE" || action === "APPROVE" || body.status === "APPROVED") {
      if (!isHrAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden: Only Human Resources and Super Admins can formally approve resignations." }, { status: 403 });
      }

      nextStatus = "APPROVED";
      nextStage = "APPROVED";
      logAction = "RESIGNATION_APPROVED";
      logDetails = `Human Resources ${(authUser as any).name || authUser.email} formally APPROVED resignation ${r.resignationId}.`;

      tracking.history = tracking.history || [];
      tracking.history.push({
        action: "HR_APPROVED",
        performedBy: (authUser as any).name || authUser.email,
        role: authUser.role,
        timestamp: new Date().toISOString(),
        notes: comments || "Formally approved by Human Resources.",
      });
      tracking.stage = nextStage;

      // Update user isResigned in DB
      if (r.userId) {
        await queryDb(`UPDATE user SET isResigned = 1 WHERE id = ?`, [r.userId]);
      }
    }

    else if (action === "HR_COMPLETE" || action === "COMPLETE" || body.status === "COMPLETED") {
      if (!isHrAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden: Only Human Resources and Super Admins can complete employee exit clearance." }, { status: 403 });
      }

      nextStatus = "COMPLETED";
      nextStage = "COMPLETED";
      logAction = "RESIGNATION_COMPLETED";
      logDetails = `Human Resources completed final exit clearance and relieved employee ${r.employeeName} (${r.employeeId}).`;

      tracking.history = tracking.history || [];
      tracking.history.push({
        action: "HR_COMPLETED",
        performedBy: (authUser as any).name || authUser.email,
        role: authUser.role,
        timestamp: new Date().toISOString(),
        notes: comments || "Exit clearance complete. Employee relieved.",
      });
      tracking.stage = nextStage;

      // Deactivate user account
      if (r.userId) {
        await queryDb(`UPDATE user SET isResigned = 1, isActive = 0 WHERE id = ?`, [r.userId]);
      }
    }

    else if (action === "REJECT" || body.status === "REJECTED") {
      if (!isHrAdmin && !isPM && !isTL) {
        return NextResponse.json({ success: false, error: "Forbidden: Management authorization required." }, { status: 403 });
      }

      nextStatus = "REJECTED";
      nextStage = "REJECTED";
      logAction = "RESIGNATION_REJECTED";
      logDetails = `Resignation ${r.resignationId} was rejected by ${(authUser as any).name || authUser.email}. Remarks: ${comments || "None"}`;

      tracking.history = tracking.history || [];
      tracking.history.push({
        action: "REJECTED",
        performedBy: (authUser as any).name || authUser.email,
        role: authUser.role,
        timestamp: new Date().toISOString(),
        notes: comments || "Resignation rejected.",
      });
      tracking.stage = nextStage;
    } else {
      return NextResponse.json({ success: false, error: `Invalid action "${action}".` }, { status: 400 });
    }

    const hrRemarksText = comments || r.hrRemarks || null;

    await queryDb(
      `UPDATE resignation SET
        status = ?,
        managerRemarks = ?,
        hrRemarks = ?,
        approvedAt = ?,
        rejectedAt = ?,
        updatedAt = NOW(3)
       WHERE id = ? OR resignationId = ?`,
      [
        nextStatus,
        JSON.stringify(tracking),
        hrRemarksText,
        nextStatus === "APPROVED" || nextStatus === "COMPLETED" ? new Date() : r.approvedAt,
        nextStatus === "REJECTED" ? new Date() : r.rejectedAt,
        id,
        id,
      ]
    );

    clearQueryCache("resignation");

    // Notify employee of the status update
    if (r.userId) {
      try {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, ?, 0, '/resignation', NOW(3))`,
          [
            notifId,
            r.userId,
            `Resignation Update: ${nextStatus}`,
            `Your resignation request (${r.resignationId}) status has been updated to ${nextStatus} (${nextStage.replace(/_/g, " ")}).`,
            nextStatus === "APPROVED" || nextStatus === "COMPLETED" ? "SUCCESS" : nextStatus === "REJECTED" ? "DANGER" : "INFO",
          ]
        );
      } catch {}
    }

    await logAuditEvent(
      authUser.id,
      logAction,
      logDetails,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `✓ Resignation successfully transitioned to ${nextStatus} (${nextStage.replace(/_/g, " ")})!`,
      status: nextStatus,
      currentStage: nextStage,
    });
  } catch (error: any) {
    console.error("PATCH /api/resignations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process resignation." }, { status: 500 });
  }
}