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
        l.reason, l.status, l.hrRemarks, l.reviewedByUserId, l.reviewedAt,
        l.attachmentUrl, l.appliedAt,
        u.id AS user_id, u.name AS employeeName, u.employeeId, u.email AS employeeEmail,
        u.role AS employeeRole, u.avatarUrl,
        d.id AS departmentId, d.name AS departmentName,
        r.name AS reviewerName, r.employeeId AS reviewerEmployeeId
      FROM leaverequest l
      LEFT JOIN user u ON l.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      LEFT JOIN user r ON l.reviewedByUserId = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // RBAC Scoping:
    // - HR / Super Admin: Can view all leave requests or filter across any employee
    // - Non-HR (PM, Team Leader, Employee): Strictly sees own leave requests
    if (!isHrApprover) {
      sql += ` AND (l.userId = ? OR l.userId = ?)`;
      params.push(resolvedUser.id, authUser.id);
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

    return NextResponse.json({
      success: true,
      total: (rawRows || []).length,
      data: rawRows || [],
      leaveBalance,
      isHrApprover,
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

    // 2. Overlap & Duplicate Check for Active Pending Requests
    const existingOverlaps = await queryDb<any[]>(
      `SELECT id FROM leaverequest 
       WHERE userId = ? 
         AND status = 'PENDING'
         AND ((DATE(startDate) BETWEEN ? AND ?) OR (DATE(endDate) BETWEEN ? AND ?))
       LIMIT 1`,
      [resolvedUser.id, startDate, endDate, startDate, endDate]
    );

    if (existingOverlaps && existingOverlaps.length > 0) {
      return NextResponse.json(
        { success: false, error: "You already have a pending leave request overlapping with the selected date range." },
        { status: 400 }
      );
    }

    // 3. Generate Request ID (e.g. LR-YYYYMM-XXXX)
    const timestamp = Date.now().toString(36).toUpperCase();
    const requestId = `LR-${timestamp}`;

    // 4. Insert into Database using resolved user cuid
    await queryDb(
      `INSERT INTO leaverequest (id, userId, leaveType, startDate, endDate, totalDays, reason, status, attachmentUrl, appliedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(3))`,
      [
        requestId,
        resolvedUser.id,
        leaveType || "Casual Leave",
        sDate,
        eDate,
        finalTotalDays,
        reason.trim(),
        attachmentUrl || null,
      ]
    );

    clearQueryCache();

    // 5. Notify HR / Admin Personnel
    try {
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
            `📋 New Leave Request: ${resolvedUser.name}`,
            `${resolvedUser.name} (${resolvedUser.employeeId}) has submitted a ${leaveType || "Casual Leave"} request for ${finalTotalDays} day(s) (${startDate} to ${endDate}).`,
          ]
        );
      }
    } catch (notifErr) {
      console.warn("Failed sending HR notification:", notifErr);
    }

    // 6. Record Audit Log
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
      appliedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Leave request submitted successfully directly to HR.",
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
    const isHrApprover = HR_APPROVER_ROLES.includes(resolvedUser.role) || HR_APPROVER_ROLES.includes(authUser.role);

    // Strict Backend RBAC: Only authorized HR roles can approve or reject
    if (!isHrApprover) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only authorized HR personnel can approve or reject leave requests." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, status, hrRemarks } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing leave request ID or target status." }, { status: 400 });
    }

    const targetStatus = status.toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(targetStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid status transition. Allowed target statuses: APPROVED, REJECTED." },
        { status: 400 }
      );
    }

    // 1. Fetch Current Request & Check for Double-Action / Stale State
    const existingRows = await queryDb<any[]>(
      `SELECT l.*, u.name AS employeeName, u.email AS employeeEmail, u.employeeId
       FROM leaverequest l
       JOIN user u ON l.userId = u.id
       WHERE l.id = ?`,
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Leave request not found." }, { status: 404 });
    }

    const currentReq = existingRows[0];

    // Double-Action Protection: Do not permit re-approving or re-rejecting already decided requests
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

    const remarksText = hrRemarks ? hrRemarks.trim() : (targetStatus === "APPROVED" ? "Approved by HR" : "Rejected by HR");

    // 2. Atomic Database Update (Concurrent Request Protection)
    const updateResult: any = await queryDb(
      `UPDATE leaverequest 
       SET status = ?, hrRemarks = ?, reviewedByUserId = ?, reviewedAt = NOW(3)
       WHERE id = ? AND status = 'PENDING'`,
      [targetStatus, remarksText, resolvedUser.id, id]
    );

    if (updateResult && updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Concurrent update detected: This leave request was already processed by another HR reviewer." },
        { status: 409 }
      );
    }

    clearQueryCache();

    // 3. Notify Requester
    try {
      const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
      const notifTitle = targetStatus === "APPROVED" ? "✅ Leave Request Approved" : "❌ Leave Request Rejected";
      const notifMessage = targetStatus === "APPROVED"
        ? `Your ${currentReq.leaveType} request for ${currentReq.totalDays} day(s) has been APPROVED by HR. Remarks: ${remarksText}`
        : `Your ${currentReq.leaveType} request for ${currentReq.totalDays} day(s) has been REJECTED by HR. Reason: ${remarksText}`;

      await queryDb(
        `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
         VALUES (?, ?, ?, ?, ?, 0, '/leave', NOW(3))`,
        [notifId, currentReq.userId, notifTitle, notifMessage, targetStatus === "APPROVED" ? "SUCCESS" : "WARNING"]
      );
    } catch (notifErr) {
      console.warn("Failed sending requester notification:", notifErr);
    }

    // 4. Record Audit Log
    const auditAction = targetStatus === "APPROVED" ? "LEAVE_REQUEST_APPROVED" : "LEAVE_REQUEST_REJECTED";
    logAuditEvent(
      resolvedUser.id,
      auditAction,
      `HR ${resolvedUser.name} (${resolvedUser.employeeId}) ${targetStatus.toLowerCase()} leave request ${id} for ${currentReq.employeeName} (${currentReq.employeeId}). Remarks: ${remarksText}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `Leave request has been successfully ${targetStatus}.`,
      data: {
        id,
        status: targetStatus,
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
