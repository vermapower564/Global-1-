import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const HR_APPROVER_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"];

// Helper to determine file MIME type and file classification
function classifyAttachment(url: string) {
  const clean = (url || "").toLowerCase().split("?")[0];
  if (clean.endsWith(".pdf") || url.includes("/pdf/") || url.includes("format=pdf")) {
    return { mimeType: "application/pdf", isPdf: true, isImage: false, isOfficeDoc: false };
  }
  if (clean.endsWith(".doc") || clean.endsWith(".docx")) {
    return { mimeType: "application/msword", isPdf: false, isImage: false, isOfficeDoc: true };
  }
  if (clean.endsWith(".xls") || clean.endsWith(".xlsx")) {
    return { mimeType: "application/vnd.ms-excel", isPdf: false, isImage: false, isOfficeDoc: true };
  }
  if (clean.endsWith(".csv")) {
    return { mimeType: "text/csv", isPdf: false, isImage: false, isOfficeDoc: true };
  }
  if (clean.endsWith(".txt")) {
    return { mimeType: "text/plain", isPdf: false, isImage: false, isOfficeDoc: true };
  }
  if (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif") ||
    url.includes("/image/upload/")
  ) {
    const ext = clean.split(".").pop() || "png";
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    return { mimeType: mime, isPdf: false, isImage: true, isOfficeDoc: false };
  }
  return { mimeType: "application/octet-stream", isPdf: false, isImage: false, isOfficeDoc: true };
}

// GET: Securely view or access a Leave Request attachment by Leave Request ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isHrApprover = HR_APPROVER_ROLES.includes(roleUpper);

    if (!cleanId) {
      return NextResponse.json({ success: false, error: "Leave request ID is required." }, { status: 400 });
    }

    // 1. Fetch Leave Request & Attachment metadata
    const leaveRows = await queryDb<any[]>(
      `SELECT l.id, l.userId, l.leaveType, l.startDate, l.endDate, l.totalDays, l.reason, l.status, l.attachmentUrl,
              u.id AS user_cuid, u.name AS employeeName, u.employeeId, u.email AS employeeEmail
       FROM leaverequest l
       LEFT JOIN user u ON l.userId = u.id
       WHERE l.id = ? LIMIT 1`,
      [cleanId]
    );

    if (!leaveRows || leaveRows.length === 0) {
      return NextResponse.json({ success: false, error: "Leave request record not found." }, { status: 404 });
    }

    const l = leaveRows[0];
    const attachmentUrl = (l.attachmentUrl || "").trim();

    if (!attachmentUrl) {
      return NextResponse.json(
        { success: false, error: "No document attachment associated with this leave request." },
        { status: 404 }
      );
    }

    // Reject local browser temporary / blob paths
    if (
      attachmentUrl.startsWith("blob:") ||
      attachmentUrl.startsWith("file:") ||
      attachmentUrl.toLowerCase().includes("fakepath")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid temporary file path. Persistent Cloudinary URL is required." },
        { status: 400 }
      );
    }

    // 2. Strict Authorization Verification
    const authEmpId = (authUser as any).employeeId || authUser.id;
    const isOwner =
      authUser.id === l.userId ||
      authUser.id === l.user_cuid ||
      authEmpId === l.employeeId ||
      authUser.email.toLowerCase() === (l.employeeEmail || "").toLowerCase();

    let isAuthorized = isOwner || isHrApprover;

    if (!isAuthorized) {
      if (roleUpper === "TEAM_LEADER" || roleUpper === "PROJECT_MANAGER") {
        const managerCheck = await queryDb<any[]>(
          `SELECT B FROM _assignedstaffprojects WHERE A IN (
             SELECT id FROM project WHERE teamLeaderId = ? OR projectManagerId = ?
           ) AND B = ?
           UNION
           SELECT id FROM user WHERE managerId = ? AND id = ? LIMIT 1`,
          [authUser.id, authUser.id, l.userId, authUser.id, l.userId]
        );
        if (managerCheck && managerCheck.length > 0) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to view or download this employee's leave document." },
        { status: 403 }
      );
    }

    // 3. Log Audit Event
    try {
      await logAuditEvent(
        authUser.id,
        "LEAVE_ATTACHMENT_ACCESSED",
        `Accessed leave attachment for request ${l.id} (${l.leaveType}) belonging to employee ${l.employeeName || l.userId}`
      );
    } catch (auditErr) {
      console.warn("Leave attachment audit log error:", auditErr);
    }

    // 4. Classify attachment
    const classification = classifyAttachment(attachmentUrl);

    const { searchParams } = new URL(request.url);
    const redirectParam = searchParams.get("redirect") === "1";
    const downloadParam = searchParams.get("download") === "1";

    if (redirectParam || downloadParam) {
      return NextResponse.redirect(attachmentUrl);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: l.id,
        leaveRequestId: l.id,
        leaveType: l.leaveType,
        employeeId: l.employeeId || l.userId,
        employeeName: l.employeeName || "Employee",
        attachmentUrl: attachmentUrl,
        fileType: classification.mimeType,
        isPdf: classification.isPdf,
        isImage: classification.isImage,
        isOfficeDoc: classification.isOfficeDoc,
        status: l.status,
      },
    });
  } catch (error: any) {
    console.error("GET /api/leave/attachment/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to access leave attachment." }, { status: 500 });
  }
}
