import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

// Authorized HR Roles permitted to Approve / Reject leave applications
const HR_APPROVER_ROLES = ["HR", "SUPER_ADMIN", "ADMIN_HR", "DIRECTOR"];

const ANNUAL_LEAVE_ALLOWANCE = 24;

async function resolveUserCuid(authUser: { id: string; email: string; role: string }) {
  const userRows = await queryDb<any[]>(
    `SELECT id, name, employeeId, email, role, departmentId FROM user WHERE id = ? OR employeeId = ? OR email = ? LIMIT 1`,
    [authUser.id, authUser.id, authUser.email]
  );
  if (userRows && userRows.length > 0) {
    return userRows[0];
  }
  return {
    id: authUser.id,
    name: authUser.email.split("@")[0],
    employeeId: authUser.id,
    email: authUser.email,
    role: authUser.role,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const resolvedUser = await resolveUserCuid(authUser);
    const isHrApprover = HR_APPROVER_ROLES.includes(resolvedUser.role) || HR_APPROVER_ROLES.includes(authUser.role);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const leaveTypeParam = searchParams.get("leaveType");
    const departmentParam = searchParams.get("departmentId") || searchParams.get("department");
    const employeeIdParam = searchParams.get("employeeId") || searchParams.get("userId");
    const search = searchParams.get("search") || "";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let sql = `
      SELECT 
        l.id, l.userId, l.leaveType, l.startDate, l.endDate, l.totalDays,
        l.reason, l.status, l.approvalStage, l.currentApproverId, l.hrRemarks, l.reviewedByUserId, l.reviewedAt,
        l.attachmentUrl, l.appliedAt,
        u.id AS user_id, u.name AS employeeName, u.employeeId, u.email AS employeeEmail,
        u.role AS employeeRole, u.avatarUrl, u.managerId,
        d.id AS departmentId, d.name AS departmentName,
        r.name AS reviewerName, r.employeeId AS reviewerEmployeeId, r.role AS reviewerRole
      FROM leaverequest l
      LEFT JOIN user u ON l.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      LEFT JOIN user r ON l.reviewedByUserId = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // RBAC Scoping:
    // - HR / Super Admin: Can view all leave requests or filter across any employee
    // - Team Leader / PM: Can view own leave requests + leave requests of their project team members
    // - Employee: Strictly sees own leave requests
    const isTeamLeader = resolvedUser.role === "TEAM_LEADER" || authUser.role === "TEAM_LEADER";
    const isProjectManager = resolvedUser.role === "PROJECT_MANAGER" || authUser.role === "PROJECT_MANAGER";
    const scopeParam = searchParams.get("scope");

    let teamMemberIds: string[] = [];
    if (isTeamLeader || isProjectManager) {
      const managedTeamRows = await queryDb<any[]>(
        `SELECT B AS memberId FROM _assignedstaffprojects WHERE A IN (
           SELECT id FROM project WHERE teamLeaderId = ? OR projectManagerId = ?
         )
         UNION
         SELECT id AS memberId FROM user WHERE managerId = ?`,
        [resolvedUser.id, resolvedUser.id, resolvedUser.id]
      );
      teamMemberIds = (managedTeamRows || []).map((m) => m.memberId).filter(Boolean);
    }

    if (!isHrApprover) {
      if ((isTeamLeader || isProjectManager) && (scopeParam === "team" || scopeParam === "all" || !scopeParam)) {
        const allowedIds = Array.from(new Set([resolvedUser.id, authUser.id, ...teamMemberIds]));
        const placeholders = allowedIds.map(() => "?").join(",");
        sql += ` AND (l.userId IN (${placeholders}) OR l.currentApproverId = ?)`;
        params.push(...allowedIds, resolvedUser.id);
      } else {
        sql += ` AND (l.userId = ? OR l.userId = ?)`;
        params.push(resolvedUser.id, authUser.id);
      }
    } else {
      if (employeeIdParam && employeeIdParam !== "ALL") {
        sql += ` AND (l.userId = ? OR u.employeeId = ? OR u.id = ?)`;
        params.push(employeeIdParam, employeeIdParam, employeeIdParam);
      }
    }

    if (statusParam && statusParam !== "ALL") {
      sql += ` AND l.status = ?`;
      params.push(statusParam.toUpperCase());
    }

    if (leaveTypeParam && leaveTypeParam !== "ALL") {
      sql += ` AND l.leaveType = ?`;
      params.push(leaveTypeParam);
    }

    if (departmentParam && departmentParam !== "ALL") {
      sql += ` AND (d.id = ? OR d.name LIKE ?)`;
      params.push(departmentParam, `%${departmentParam}%`);
    }

    if (startDateParam) {
      sql += ` AND DATE(l.startDate) >= ?`;
      params.push(startDateParam);
    }

    if (endDateParam) {
      sql += ` AND DATE(l.endDate) <= ?`;
      params.push(endDateParam);
    }

    if (search.trim()) {
      sql += ` AND (u.name LIKE ? OR u.employeeId LIKE ? OR l.id LIKE ? OR l.reason LIKE ? OR l.leaveType LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Deterministic latest-first sorting
    sql += ` ORDER BY l.appliedAt DESC, l.id DESC`;

    const rawRows = await queryDb<any[]>(sql, params);

    // Batch Fetch Approval History for returned requests
    const leaveIds = (rawRows || []).map((r) => r.id);
    let historyMap: { [reqId: string]: any[] } = {};
    if (leaveIds.length > 0) {
      const placeholders = leaveIds.map(() => "?").join(",");
      const historyRows = await queryDb<any[]>(
        `SELECT id, leaveRequestId, actorId, actorName, actorRole, action, fromStage, toStage, comments, timestamp 
         FROM leaveapprovalhistory 
         WHERE leaveRequestId IN (${placeholders}) 
         ORDER BY timestamp ASC`,
        leaveIds
      );
      (historyRows || []).forEach((h) => {
        if (!historyMap[h.leaveRequestId]) historyMap[h.leaveRequestId] = [];
        historyMap[h.leaveRequestId].push(h);
      });
    }

    // Attach Approval History to each leave record
    const enrichedData = (rawRows || []).map((r) => ({
      ...r,
      approvalHistory: historyMap[r.id] || [],
    }));

    // Compute User Leave Balances
    const userAllRequests = await queryDb<any[]>(
      `SELECT status, totalDays FROM leaverequest WHERE userId = ? OR userId = ?`,
      [resolvedUser.id, authUser.id]
    );

    let approvedDays = 0;
    let pendingDays = 0;
    let rejectedDays = 0;

    (userAllRequests || []).forEach((req) => {
      const days = Number(req.totalDays) || 0;
      if (req.status === "APPROVED") approvedDays += days;
      else if (req.status === "PENDING") pendingDays += days;
      else if (req.status === "REJECTED") rejectedDays += days;
    });

    const availableDays = Math.max(0, ANNUAL_LEAVE_ALLOWANCE - approvedDays);

    const leaveBalance = {
      totalAnnualAllowance: ANNUAL_LEAVE_ALLOWANCE,
      availableLeave: availableDays,
      usedLeave: approvedDays,
      pendingLeave: pendingDays,
      rejectedLeave: rejectedDays,
    };

    // Calculate Team Availability & Conflict Warning for Team Leader / Manager
    let teamAvailability: any = null;
    if (isTeamLeader || isProjectManager || isHrApprover) {
      const totalTeamSize = teamMemberIds.length > 0 ? teamMemberIds.length : 1;
      const dateMap: { [dateStr: string]: { date: string; employees: string[]; count: number } } = {};

      (rawRows || []).forEach((req) => {
        if (["APPROVED", "PENDING"].includes(req.status)) {
          const s = new Date(req.startDate);
          const e = new Date(req.endDate);
          const cur = new Date(s);
          while (cur <= e) {
            const dStr = cur.toISOString().split("T")[0];
            if (!dateMap[dStr]) {
              dateMap[dStr] = { date: dStr, employees: [], count: 0 };
            }
            if (!dateMap[dStr].employees.includes(req.employeeName || req.user_id)) {
              dateMap[dStr].employees.push(req.employeeName || req.user_id);
              dateMap[dStr].count += 1;
            }
            cur.setDate(cur.getDate() + 1);
          }
        }
      });

      const conflicts = Object.values(dateMap)
        .filter((d) => totalTeamSize > 1 && d.count / totalTeamSize >= 0.4)
        .map((d) => ({
          date: d.date,
          absentCount: d.count,
          totalTeamSize,
          affectedEmployees: d.employees,
          warningMessage: `⚠️ Team Availability Warning: ${d.count} of ${totalTeamSize} team members have requested leave for ${d.date}. Critical project coverage may be affected.`,
        }));

      teamAvailability = {
        totalTeamSize,
        dailyAbsences: Object.values(dateMap),
        conflicts,
        hasConflicts: conflicts.length > 0,
      };
    }

    return NextResponse.json({
      success: true,
      total: enrichedData.length,
      data: enrichedData,
      leaveBalance,
      teamAvailability,
      isHrApprover,
      isTeamLeader,
    });
  } catch (error: any) {
    console.error("Failed to fetch leave requests:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch leave requests." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const resolvedUser = await resolveUserCuid(authUser);

    const body = await request.json().catch(() => ({}));
    const { leaveType, startDate, endDate, totalDays, reason, attachmentUrl } = body;

    // 1. Validation
    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: "Leave reason is required." }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Start Date and End Date are required." }, { status: 400 });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date format." }, { status: 400 });
    }

    if (eDate < sDate) {
      return NextResponse.json({ success: false, error: "End Date cannot be earlier than Start Date." }, { status: 400 });
    }

    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const computedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const finalTotalDays = Number(totalDays) || computedDays || 1;

    // 2. Overlap & Duplicate Check for Active Pending/Approved Requests
    const existingOverlaps = await queryDb<any[]>(
      `SELECT id FROM leaverequest 
       WHERE userId = ? 
         AND status IN ('PENDING', 'APPROVED')
         AND ((DATE(startDate) BETWEEN ? AND ?) OR (DATE(endDate) BETWEEN ? AND ?))
       LIMIT 1`,
      [resolvedUser.id, startDate, endDate, startDate, endDate]
    );

    if (existingOverlaps && existingOverlaps.length > 0) {
      return NextResponse.json(
        { success: false, error: "You already have an active or pending leave request overlapping with the selected date range." },
        { status: 400 }
      );
    }

    // 3. Resolve Approver Hierarchy (Check for Team Leader / Manager)
    let initialApproverId: string | null = null;
    let initialStage = "HIGHER_APPROVAL";

    const managerRows = await queryDb<any[]>(
      `SELECT managerId FROM user WHERE id = ? LIMIT 1`,
      [resolvedUser.id]
    );
    if (managerRows && managerRows[0]?.managerId) {
      initialApproverId = managerRows[0].managerId;
      initialStage = "TEAM_LEADER";
    } else {
      // Check project team leader assignment
      const projectTlRows = await queryDb<any[]>(
        `SELECT p.teamLeaderId 
         FROM _assignedstaffprojects asp
         JOIN project p ON asp.A = p.id
         WHERE asp.B = ? AND p.teamLeaderId IS NOT NULL AND p.teamLeaderId != ?
         LIMIT 1`,
        [resolvedUser.id, resolvedUser.id]
      );
      if (projectTlRows && projectTlRows[0]?.teamLeaderId) {
        initialApproverId = projectTlRows[0].teamLeaderId;
        initialStage = "TEAM_LEADER";
      }
    }

    // 4. Generate Request ID (e.g. LR-YYYYMM-XXXX)
    const timestamp = Date.now().toString(36).toUpperCase();
    const requestId = `LR-${timestamp}`;

    // 5. Insert into Database
    await queryDb(
      `INSERT INTO leaverequest (id, userId, leaveType, startDate, endDate, totalDays, reason, status, approvalStage, currentApproverId, attachmentUrl, appliedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, NOW(3))`,
      [
        requestId,
        resolvedUser.id,
        leaveType || "Casual Leave",
        sDate,
        eDate,
        finalTotalDays,
        reason.trim(),
        initialStage,
        initialApproverId,
        attachmentUrl || null,
      ]
    );

    // 6. Record Initial Audit History Entry
    const histId = `H-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
    await queryDb(
      `INSERT INTO leaveapprovalhistory (id, leaveRequestId, actorId, actorName, actorRole, action, fromStage, toStage, comments, timestamp)
       VALUES (?, ?, ?, ?, ?, 'SUBMITTED', NULL, ?, ?, NOW(3))`,
      [
        histId,
        requestId,
        resolvedUser.id,
        resolvedUser.name || "Employee",
        resolvedUser.role || "EMPLOYEE",
        initialStage,
        `Submitted leave application for ${finalTotalDays} day(s) (${leaveType || "Casual Leave"})`,
      ]
    );

    clearQueryCache();

    // 7. Notify Approver(s)
    try {
      if (initialApproverId) {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, 'INFO', 0, '/hr/leave', NOW(3))`,
          [
            notifId,
            initialApproverId,
            `📋 Team Member Leave Request: ${resolvedUser.name}`,
            `${resolvedUser.name} (${resolvedUser.employeeId}) has submitted a ${leaveType || "Casual Leave"} request for ${finalTotalDays} day(s) requiring your review.`,
          ]
        );
      } else {
        const hrUsers = await queryDb<any[]>(
          `SELECT id FROM user WHERE role IN ('HR', 'SUPER_ADMIN', 'ADMIN_HR', 'DIRECTOR') AND isActive = 1`
        );
        for (const hr of hrUsers || []) {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'INFO', 0, '/hr/leave', NOW(3))`,
            [
              notifId,
              hr.id,
              `📋 New Leave Application: ${resolvedUser.name}`,
              `${resolvedUser.name} (${resolvedUser.employeeId}) has submitted a ${leaveType || "Casual Leave"} request for ${finalTotalDays} day(s) (${startDate} to ${endDate}).`,
            ]
          );
        }
      }
    } catch (notifErr) {
      console.warn("Failed sending approver notifications:", notifErr);
    }

    // 8. Record System Audit Log
    logAuditEvent(
      resolvedUser.id,
      "LEAVE_REQUEST_CREATED",
      `Submitted leave request ${requestId} for ${finalTotalDays} day(s) (${leaveType || "Casual Leave"} from ${startDate} to ${endDate})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    const createdRecord = {
      id: requestId,
      userId: resolvedUser.id,
      leaveType: leaveType || "Casual Leave",
      startDate: sDate,
      endDate: eDate,
      totalDays: finalTotalDays,
      reason: reason.trim(),
      status: "PENDING",
      approvalStage: initialStage,
      appliedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Leave request submitted successfully.",
        data: createdRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to submit leave request:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit leave request." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const resolvedUser = await resolveUserCuid(authUser);
    const userRole = (resolvedUser.role || authUser.role || "EMPLOYEE").toUpperCase();

    const isHrApprover = HR_APPROVER_ROLES.includes(userRole);
    const isTeamLeader = userRole === "TEAM_LEADER";
    const isProjectManager = userRole === "PROJECT_MANAGER";

    const body = await request.json().catch(() => ({}));
    const { id, action, status, hrRemarks, escalationReason } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing leave request ID." }, { status: 400 });
    }

    // Determine target action (APPROVE, REJECT, ESCALATE)
    const targetAction = (action || status || "").toUpperCase();
    if (!["APPROVE", "APPROVED", "REJECT", "REJECTED", "ESCALATE", "ESCALATED"].includes(targetAction)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Allowed actions: APPROVE, REJECT, ESCALATE." },
        { status: 400 }
      );
    }

    const isApprove = ["APPROVE", "APPROVED"].includes(targetAction);
    const isReject = ["REJECT", "REJECTED"].includes(targetAction);
    const isEscalate = ["ESCALATE", "ESCALATED"].includes(targetAction);

    // 1. Fetch Current Request
    const existingRows = await queryDb<any[]>(
      `SELECT l.*, u.name AS employeeName, u.email AS employeeEmail, u.employeeId, u.role AS employeeRole
       FROM leaverequest l
       JOIN user u ON l.userId = u.id
       WHERE l.id = ?`,
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Leave request not found." }, { status: 404 });
    }

    const currentReq = existingRows[0];

    // 2. RBAC & Scope Check
    let isAuthorizedToReview = isHrApprover;
    if (!isAuthorizedToReview && (isTeamLeader || isProjectManager)) {
      if (currentReq.currentApproverId === resolvedUser.id) {
        isAuthorizedToReview = true;
      } else {
        const teamCheck = await queryDb<any[]>(
          `SELECT B AS memberId FROM _assignedstaffprojects WHERE A IN (
             SELECT id FROM project WHERE teamLeaderId = ? OR projectManagerId = ?
           ) AND B = ?
           UNION
           SELECT id FROM user WHERE managerId = ? AND id = ?`,
          [resolvedUser.id, resolvedUser.id, currentReq.userId, resolvedUser.id, currentReq.userId]
        );
        if (teamCheck && teamCheck.length > 0) {
          isAuthorizedToReview = true;
        }
      }
    }

    if (!isAuthorizedToReview) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to review or approve this leave request." },
        { status: 403 }
      );
    }

    // 3. Double-Action & State Transition Protection
    if (currentReq.status === "APPROVED") {
      return NextResponse.json(
        { success: false, error: "This leave request has already been APPROVED and cannot be modified." },
        { status: 400 }
      );
    }

    if (currentReq.status === "REJECTED") {
      return NextResponse.json(
        { success: false, error: "This leave request has already been REJECTED and cannot be modified." },
        { status: 400 }
      );
    }

    if (currentReq.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "This leave request was cancelled by the employee." },
        { status: 400 }
      );
    }

    const remarksText = hrRemarks ? hrRemarks.trim() : (isApprove ? `Approved by ${resolvedUser.name} (${userRole})` : `Rejected by ${resolvedUser.name} (${userRole})`);

    if (isReject && !hrRemarks?.trim()) {
      return NextResponse.json(
        { success: false, error: "An explicit rejection reason is required when rejecting a leave request." },
        { status: 400 }
      );
    }

    let nextStatus = currentReq.status;
    let nextStage = currentReq.approvalStage;
    let histAction = "UPDATED";
    let histComment = remarksText;

    if (isEscalate) {
      nextStatus = "PENDING";
      nextStage = "HIGHER_APPROVAL";
      histAction = "ESCALATED";
      histComment = escalationReason?.trim() || hrRemarks?.trim() || `Escalated by ${resolvedUser.name} (${userRole}) for executive review`;

      // Perform atomic update for Escalation
      const updateResult: any = await queryDb(
        `UPDATE leaverequest 
         SET status = 'PENDING', approvalStage = 'HIGHER_APPROVAL', currentApproverId = NULL, hrRemarks = ?
         WHERE id = ? AND status = 'PENDING'`,
        [histComment, id]
      );

      if (updateResult && updateResult.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "Concurrent update detected: This leave request was already updated by another reviewer." },
          { status: 409 }
        );
      }
    } else if (isApprove) {
      nextStatus = "APPROVED";
      nextStage = "FINAL_DECISION";
      histAction = "APPROVED";

      const updateResult: any = await queryDb(
        `UPDATE leaverequest 
         SET status = 'APPROVED', approvalStage = 'FINAL_DECISION', hrRemarks = ?, reviewedByUserId = ?, reviewedAt = NOW(3)
         WHERE id = ? AND status = 'PENDING'`,
        [remarksText, resolvedUser.id, id]
      );

      if (updateResult && updateResult.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "Concurrent update detected: This leave request was already processed by another reviewer." },
          { status: 409 }
        );
      }
    } else if (isReject) {
      nextStatus = "REJECTED";
      histAction = "REJECTED";

      const updateResult: any = await queryDb(
        `UPDATE leaverequest 
         SET status = 'REJECTED', hrRemarks = ?, reviewedByUserId = ?, reviewedAt = NOW(3)
         WHERE id = ? AND status = 'PENDING'`,
        [remarksText, resolvedUser.id, id]
      );

      if (updateResult && updateResult.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "Concurrent update detected: This leave request was already processed by another reviewer." },
          { status: 409 }
        );
      }
    }

    clearQueryCache();

    // 4. Record Audit History Entry
    const histId = `H-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
    await queryDb(
      `INSERT INTO leaveapprovalhistory (id, leaveRequestId, actorId, actorName, actorRole, action, fromStage, toStage, comments, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        histId,
        id,
        resolvedUser.id,
        resolvedUser.name || "Approver",
        userRole,
        histAction,
        currentReq.approvalStage,
        nextStage,
        histComment,
      ]
    );

    // 5. Attendance Integration: Automatically mark attendance as ON_LEAVE for approved leave dates
    if (isApprove) {
      try {
        const start = new Date(currentReq.startDate);
        const end = new Date(currentReq.endDate);
        const cur = new Date(start);
        while (cur <= end) {
          const dateStr = cur.toISOString().split("T")[0];
          const attRows = await queryDb<any[]>(
            `SELECT id FROM attendance WHERE userId = ? AND DATE(date) = ? LIMIT 1`,
            [currentReq.userId, dateStr]
          );
          if (attRows && attRows.length > 0) {
            await queryDb(
              `UPDATE attendance SET status = 'ON_LEAVE', hoursWorked = 8.0 WHERE id = ?`,
              [attRows[0].id]
            );
          } else {
            const attId = `ATT-LV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
            await queryDb(
              `INSERT INTO attendance (id, userId, date, checkInTime, checkOutTime, hoursWorked, status, createdAt)
               VALUES (?, ?, ?, ?, ?, 8.0, 'ON_LEAVE', NOW(3))`,
              [
                attId,
                currentReq.userId,
                new Date(`${dateStr}T00:00:00Z`),
                new Date(`${dateStr}T09:00:00Z`),
                new Date(`${dateStr}T17:00:00Z`),
              ]
            );
          }
          cur.setDate(cur.getDate() + 1);
        }
      } catch (attErr) {
        console.warn("Failed integrating approved leave with attendance:", attErr);
      }
    }

    // 6. Notify Requester / Next Approvers
    try {
      if (isEscalate) {
        const hrUsers = await queryDb<any[]>(
          `SELECT id FROM user WHERE role IN ('HR', 'SUPER_ADMIN', 'ADMIN_HR', 'DIRECTOR') AND isActive = 1`
        );
        for (const hr of hrUsers || []) {
          const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
          await queryDb(
            `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
             VALUES (?, ?, ?, ?, 'INFO', 0, '/hr/leave', NOW(3))`,
            [
              notifId,
              hr.id,
              `⚠️ Leave Request Escalated: ${currentReq.employeeName}`,
              `Leave request for ${currentReq.employeeName} (${currentReq.totalDays} day(s)) was escalated by ${resolvedUser.name} (${userRole}). Reason: ${histComment}`,
            ]
          );
        }
      } else {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        const notifTitle = isApprove ? "✅ Leave Request Approved" : "❌ Leave Request Rejected";
        const notifMessage = isApprove
          ? `Your ${currentReq.leaveType} request for ${currentReq.totalDays} day(s) has been APPROVED by ${resolvedUser.name} (${userRole}). Remarks: ${remarksText}`
          : `Your ${currentReq.leaveType} request for ${currentReq.totalDays} day(s) has been REJECTED by ${resolvedUser.name} (${userRole}). Reason: ${remarksText}`;

        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, ?, 0, '/leave', NOW(3))`,
          [notifId, currentReq.userId, notifTitle, notifMessage, isApprove ? "SUCCESS" : "WARNING"]
        );
      }
    } catch (notifErr) {
      console.warn("Failed sending notifications:", notifErr);
    }

    // 7. Audit Logging
    logAuditEvent(
      resolvedUser.id,
      `LEAVE_REQUEST_${histAction}`,
      `${userRole} ${resolvedUser.name} (${resolvedUser.employeeId}) ${histAction.toLowerCase()} leave request ${id} for ${currentReq.employeeName}. Remarks: ${histComment}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `Leave request has been successfully ${histAction.toLowerCase()}.`,
      data: {
        id,
        status: nextStatus,
        approvalStage: nextStage,
        hrRemarks: remarksText,
        reviewedByUserId: resolvedUser.id,
        reviewedByName: resolvedUser.name,
      },
    });
  } catch (error: any) {
    console.error("Failed to update leave status:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update leave status." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const resolvedUser = await resolveUserCuid(authUser);
    const isHrApprover = HR_APPROVER_ROLES.includes(resolvedUser.role) || HR_APPROVER_ROLES.includes(authUser.role);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Leave request ID is required." }, { status: 400 });
    }

    const existingRows = await queryDb<any[]>(
      `SELECT * FROM leaverequest WHERE id = ?`,
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Leave request not found." }, { status: 404 });
    }

    const currentReq = existingRows[0];

    // Only requester or Super Admin can cancel a pending request
    if (currentReq.userId !== resolvedUser.id && currentReq.userId !== authUser.id && !isHrApprover) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only cancel your own pending leave requests." },
        { status: 403 }
      );
    }

    if (currentReq.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Cannot cancel a leave request that is already ${currentReq.status}.` },
        { status: 400 }
      );
    }

    await queryDb(
      `UPDATE leaverequest SET status = 'CANCELLED', hrRemarks = 'Cancelled by requester' WHERE id = ?`,
      [id]
    );

    // Record Cancellation History
    const histId = `H-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
    await queryDb(
      `INSERT INTO leaveapprovalhistory (id, leaveRequestId, actorId, actorName, actorRole, action, fromStage, toStage, comments, timestamp)
       VALUES (?, ?, ?, ?, ?, 'CANCELLED', ?, 'CANCELLED', 'Leave request cancelled by requester', NOW(3))`,
      [
        histId,
        id,
        resolvedUser.id,
        resolvedUser.name || "Employee",
        resolvedUser.role || "EMPLOYEE",
        currentReq.approvalStage,
      ]
    );

    clearQueryCache();

    logAuditEvent(
      resolvedUser.id,
      "LEAVE_REQUEST_CANCELLED",
      `Cancelled pending leave request ${id} (${currentReq.leaveType})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: "Leave request cancelled successfully.",
    });
  } catch (error: any) {
    console.error("Failed to cancel leave request:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to cancel leave request." }, { status: 500 });
  }
}
