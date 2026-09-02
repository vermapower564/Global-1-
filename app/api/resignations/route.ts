import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const HR_ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"];
const MANAGEMENT_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "PROJECT_MANAGER", "TEAM_LEADER"];

// Helper to resolve reporting structure for a user
async function resolveReportingHierarchy(userId: string, employeeId: string) {
  const uRows = await queryDb<any[]>(
    `SELECT u.id, u.employeeId, u.name, u.email, u.role, u.departmentId, u.managerId, u.isActive, u.isResigned,
            d.name AS departmentName,
            m.id AS manager_id, m.name AS manager_name, m.email AS manager_email, m.role AS manager_role
     FROM user u
     LEFT JOIN department d ON u.departmentId = d.id
     LEFT JOIN user m ON u.managerId = m.id
     WHERE u.id = ? OR u.employeeId = ? LIMIT 1`,
    [userId, employeeId]
  );
  const u = uRows && uRows.length > 0 ? uRows[0] : null;

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
        u.name AS user_name, u.email AS user_email, u.employeeId AS user_employeeId, u.role AS user_role, u.salary AS user_salary, u.createdAt AS user_joinedAt, u.isActive AS user_isActive, u.isResigned AS user_isResigned,
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
        sql += ` AND (
          r.userId = ? OR r.employeeId = ?
          OR r.userId IN (
            SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE teamLeaderId = ?)
          )
          OR r.userId IN (SELECT id FROM user WHERE managerId = ?)
        )`;
        params.push(authUser.id, authEmployeeId, authUser.id, authUser.id);
      } else if (isPM) {
        sql += ` AND (
          r.userId = ? OR r.employeeId = ?
          OR r.userId IN (
            SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE projectManagerId = ?)
          )
          OR r.userId IN (SELECT id FROM user WHERE managerId = ?)
        )`;
        params.push(authUser.id, authEmployeeId, authUser.id, authUser.id);
      } else {
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

      let currentStage = "SUBMITTED";
      let stageDescription = "Submitted to Management for Review";
      if (r.status === "APPROVED") {
        currentStage = "APPROVED";
        stageDescription = "Resignation Approved — Employee Account Deactivated";
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

      const accountStatus = (r.user_isActive === 0 || r.user_isActive === false || r.status === "APPROVED" || r.status === "COMPLETED") ? "DEACTIVATED" : "ACTIVE";

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
        letterUrl: r.letterUrl || null,
        status: r.status || "SUBMITTED",
        currentStage,
        stageDescription,
        approvedByUserId: r.approvedByUserId || null,
        approvedByName: r.approvedByName || null,
        approverRole: r.approverRole || null,
        approvedAt: r.approvedAt || null,
        rejectedByUserId: r.rejectedByUserId || null,
        rejectedByName: r.rejectedByName || null,
        rejectedAt: r.rejectedAt || null,
        accountStatus,
        hrRemarks: r.hrRemarks || null,
        managerRemarks: typeof r.managerRemarks === "string" && !r.managerRemarks.startsWith("{") ? r.managerRemarks : (trackingMeta.summaryRemarks || null),
        trackingHistory: trackingMeta.history || [],
        teamLeader: trackingMeta.teamLeader || null,
        projectManager: trackingMeta.projectManager || null,
        submittedAt: r.submittedAt || r.createdAt,
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

// POST: Employee Submits Resignation
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
      letterUrl,
      attachmentUrl,
      documentUrl,
    } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: "Resignation reason is required." }, { status: 400 });
    }

    const authEmployeeId = (authUser as any).employeeId || authUser.id;
    const hierarchy = await resolveReportingHierarchy(authUser.id, authEmployeeId);
    const dbUser = hierarchy.user || authUser;

    // 1. Check if employee is already deactivated
    if (dbUser.isActive === 0 || dbUser.isActive === false || dbUser.isResigned === 1) {
      return NextResponse.json(
        { success: false, error: "Cannot submit a resignation request for an inactive or already resigned employee account." },
        { status: 400 }
      );
    }

    // 2. Check for active PENDING or APPROVED resignation (Duplicate protection)
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

    const finalLetterUrl = letterUrl || attachmentUrl || documentUrl || null;
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

    const newDbId = `res_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await queryDb(
      `INSERT INTO resignation (
        id, resignationId, userId, employeeId, employeeName, email,
        department, role, resignationDate, noticePeriodDays, lastWorkingDay, lastWorkingDayFormatted,
        reason, status, managerRemarks, hrRemarks, letterUrl, submittedAt, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, 'SUBMITTED', ?, ?, ?, NOW(3), NOW(3), NOW(3)
      )`,
      [
        newDbId,
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
        finalLetterUrl,
      ]
    );

    clearQueryCache("resignation");

    // Notify approver
    const approverUserId = hierarchy.teamLeader?.id || hierarchy.projectManager?.id;
    if (approverUserId) {
      try {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, 'WARNING', 0, '/resignation', NOW(3))`,
          [
            notifId,
            approverUserId,
            `📄 Resignation Submitted: ${dbUser.name}`,
            `${dbUser.name} submitted a resignation request for ${lwdFormatted}.`,
          ]
        );
      } catch (err) {
        console.warn("Failed to notify approver of resignation:", err);
      }
    }

    await logAuditEvent(
      dbUser.id,
      "RESIGNATION_SUBMITTED",
      `Employee ${dbUser.name} (${dbUser.employeeId}) submitted resignation ${resignationId} with proposed Last Working Day ${lwdFormatted}.`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      {
        success: true,
        message: "✓ Resignation submitted successfully.",
        resignationId,
        data: {
          id: newDbId,
          resignationId,
          employeeId: dbUser.employeeId,
          employeeName: dbUser.name,
          lastWorkingDay: lDate,
          lastWorkingDayFormatted: lwdFormatted,
          status: "SUBMITTED",
          letterUrl: finalLetterUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/resignations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit resignation." }, { status: 500 });
  }
}

// PATCH: Review, Approve, Reject, or Withdraw Resignation
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
    const { id, action, comments, remarks, adminRemarks, hrRemarks } = body;

    const resId = id || body.resignationId;
    if (!resId) {
      return NextResponse.json({ success: false, error: "Resignation ID is required." }, { status: 400 });
    }

    const existingRows = await queryDb<any[]>(
      `SELECT r.*, u.name AS user_name, u.email AS user_email, u.id AS user_id_real, u.employeeId AS user_emp_id
       FROM resignation r
       LEFT JOIN user u ON (r.userId = u.id OR r.employeeId = u.employeeId)
       WHERE r.id = ? OR r.resignationId = ?
       LIMIT 1`,
      [resId, resId]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Resignation request not found." }, { status: 404 });
    }

    const r = existingRows[0];
    const authEmpId = (authUser as any).employeeId || authUser.id;
    const isRequester = r.userId === authUser.id || r.employeeId === authEmpId || r.user_id_real === authUser.id;

    // Determine normalized target action
    let targetAction = (action || body.status || "").toUpperCase();

    // 1. Self-Approval Protection
    if (["APPROVE", "APPROVED", "HR_APPROVE", "REJECT", "REJECTED"].includes(targetAction)) {
      if (isRequester) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot approve or review your own resignation request." },
          { status: 403 }
        );
      }
    }

    // 2. Scope-based Authorization Verification
    if (["APPROVE", "APPROVED", "HR_APPROVE", "REJECT", "REJECTED", "TL_REVIEW", "TL_FORWARD", "PM_FORWARD"].includes(targetAction)) {
      if (!isHrAdmin) {
        let isAuthorizedManager = false;

        if (isTL) {
          const scopeCheck = await queryDb<any[]>(
            `SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE teamLeaderId = ?) AND B = ?
             UNION
             SELECT id FROM user WHERE managerId = ? AND id = ? LIMIT 1`,
            [authUser.id, r.userId, authUser.id, r.userId]
          );
          if (scopeCheck && scopeCheck.length > 0) isAuthorizedManager = true;
        } else if (isPM) {
          const scopeCheck = await queryDb<any[]>(
            `SELECT B FROM _assignedstaffprojects WHERE A IN (SELECT id FROM project WHERE projectManagerId = ?) AND B = ?
             UNION
             SELECT id FROM user WHERE managerId = ? AND id = ? LIMIT 1`,
            [authUser.id, r.userId, authUser.id, r.userId]
          );
          if (scopeCheck && scopeCheck.length > 0) isAuthorizedManager = true;
        }

        if (!isAuthorizedManager) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You do not have management authority over this employee's resignation." },
            { status: 403 }
          );
        }
      }
    }

    const commentText = comments || remarks || adminRemarks || hrRemarks || "";

    // 3. Handle Actions
    if (targetAction === "WITHDRAW" || targetAction === "WITHDRAWN") {
      if (!isRequester && !isHrAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden: You can only withdraw your own resignation." }, { status: 403 });
      }
      if (r.status === "APPROVED" || r.status === "COMPLETED") {
        return NextResponse.json({ success: false, error: "Cannot withdraw a resignation that has already been approved." }, { status: 400 });
      }

      await queryDb(
        `UPDATE resignation SET status = 'WITHDRAWN', updatedAt = NOW(3) WHERE (id = ? OR resignationId = ?) AND status IN ('SUBMITTED', 'UNDER_REVIEW')`,
        [resId, resId]
      );

      clearQueryCache("resignation");
      await logAuditEvent(authUser.id, "RESIGNATION_WITHDRAWN", `Employee ${r.employeeName} withdrew resignation ${r.resignationId}.`);

      return NextResponse.json({ success: true, message: "✓ Resignation request withdrawn.", status: "WITHDRAWN" });
    }

    // APPROVE
    if (["APPROVE", "APPROVED", "HR_APPROVE", "COMPLETED"].includes(targetAction)) {
      // Race condition check: Ensure record is currently PENDING/SUBMITTED/UNDER_REVIEW
      const updateResult = await queryDb<any>(
        `UPDATE resignation SET
          status = 'APPROVED',
          approvedByUserId = ?,
          approvedByName = ?,
          approverRole = ?,
          approvedAt = NOW(3),
          hrRemarks = ?,
          updatedAt = NOW(3)
         WHERE (id = ? OR resignationId = ?) AND status IN ('SUBMITTED', 'UNDER_REVIEW')`,
        [
          authUser.id,
          (authUser as any).name || authUser.email,
          authUser.role,
          commentText || "Resignation Approved",
          resId,
          resId,
        ]
      );

      if (updateResult.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "This resignation request has already been processed or status changed." },
          { status: 400 }
        );
      }

      // Deactivate Employee Account
      const targetUserId = r.userId || r.user_id_real;
      if (targetUserId) {
        await queryDb(
          `UPDATE user SET isActive = 0, isResigned = 1, updatedAt = NOW(3) WHERE id = ?`,
          [targetUserId]
        );
      }

      clearQueryCache("resignation");
      clearQueryCache("user");

      // Notify Employee
      if (targetUserId) {
        try {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'SUCCESS', 0, '/resignation', NOW(3))`,
            [
              notifId,
              targetUserId,
              "Your resignation request has been approved.",
              `Your resignation request (${r.resignationId}) has been approved by ${(authUser as any).name || authUser.role}. Your account has been deactivated.`,
            ]
          );
        } catch {}
      }

      await logAuditEvent(
        authUser.id,
        "RESIGNATION_APPROVED",
        `Resignation ${r.resignationId} for ${r.employeeName} APPROVED by ${(authUser as any).name} (${authUser.role}).`
      );

      await logAuditEvent(
        authUser.id,
        "EMPLOYEE_DEACTIVATED",
        `Employee account ${r.employeeName} (${r.employeeId}) DEACTIVATED following resignation approval.`
      );

      // Dispatch Resignation Approval Email to Employee's Registered DB Email
      const employeeEmail = (r.email || r.user_email || "").trim();
      const approverName = (authUser as any).name || authUser.email;
      const approverRole = authUser.role;
      const approvalDateStr = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const rDateStr = r.resignationDate ? new Date(r.resignationDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");

      if (employeeEmail && employeeEmail.includes("@")) {
        try {
          const { dispatchEmail } = await import("@/lib/email/send");
          const { renderResignationApprovedEmail } = await import("@/lib/email/templates");
          const emailData = renderResignationApprovedEmail({
            name: r.employeeName || r.user_name || "Employee",
            employeeId: r.employeeId || r.user_employeeId || "EMP",
            email: employeeEmail,
            resignationDate: rDateStr,
            reason: r.reason || "Resignation",
            approvedByName: approverName,
            approverRole: approverRole,
            approvalDate: approvalDateStr,
          });

          const emailResult = await dispatchEmail({
            to: employeeEmail,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            emailType: "RESIGNATION_APPROVED",
          });

          if (!emailResult.success) {
            console.warn(`⚠️ Warning: Resignation approved in DB but SMTP email to ${employeeEmail} failed: ${emailResult.error}`);
          }
        } catch (emailErr: any) {
          console.error(`❌ SMTP Resignation Approval Email Error for ${employeeEmail}:`, emailErr.message || emailErr);
          // Do NOT rollback DB transaction or fail approval response because SMTP delivery failed
        }
      } else {
        console.warn(`⚠️ Warning: Resignation approved in DB but no valid registered email found for user ID ${targetUserId}.`);
      }

      return NextResponse.json({
        success: true,
        message: `✓ Resignation approved. Account for ${r.employeeName} has been deactivated.`,
        status: "APPROVED",
        approvedBy: (authUser as any).name || authUser.email,
        approvedAt: new Date().toISOString(),
      });
    }

    // REJECT
    if (["REJECT", "REJECTED"].includes(targetAction)) {
      const updateResult = await queryDb<any>(
        `UPDATE resignation SET
          status = 'REJECTED',
          rejectedByUserId = ?,
          rejectedByName = ?,
          rejectedAt = NOW(3),
          hrRemarks = ?,
          updatedAt = NOW(3)
         WHERE (id = ? OR resignationId = ?) AND status IN ('SUBMITTED', 'UNDER_REVIEW')`,
        [
          authUser.id,
          (authUser as any).name || authUser.email,
          commentText || "Resignation Rejected",
          resId,
          resId,
        ]
      );

      if (updateResult.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "This resignation request has already been processed or status changed." },
          { status: 400 }
        );
      }

      clearQueryCache("resignation");

      // Notify Employee
      const targetUserId = r.userId || r.user_id_real;
      if (targetUserId) {
        try {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'DANGER', 0, '/resignation', NOW(3))`,
            [
              notifId,
              targetUserId,
              "Your resignation request has been rejected.",
              `Your resignation request (${r.resignationId}) was rejected by ${(authUser as any).name || authUser.role}. Remarks: ${commentText || "None"}`,
            ]
          );
        } catch {}
      }

      await logAuditEvent(
        authUser.id,
        "RESIGNATION_REJECTED",
        `Resignation ${r.resignationId} for ${r.employeeName} REJECTED by ${(authUser as any).name} (${authUser.role}).`
      );

      return NextResponse.json({
        success: true,
        message: `✓ Resignation request rejected.`,
        status: "REJECTED",
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action "${targetAction}".` }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/resignations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process resignation." }, { status: 500 });
  }
}