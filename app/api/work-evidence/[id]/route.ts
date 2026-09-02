import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Securely access or download Daily Work Evidence document by evidence ID
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
    const cleanId = decodeURIComponent(id).trim();
    const authUser = authResult.user;
    const userRole = (authUser.role || "").toUpperCase();
    const isHrOrAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"].includes(userRole);

    // 1. Fetch work evidence record
    const evidenceRows = await queryDb<any[]>(
      `SELECT e.*, dw.userId AS updateUserId, dw.projectName
       FROM workevidence e
       LEFT JOIN dailyworkupdate dw ON e.dailyWorkUpdateId = dw.id
       WHERE e.id = ? OR e.dailyWorkUpdateId = ? LIMIT 1`,
      [cleanId, cleanId]
    );

    if (!evidenceRows || evidenceRows.length === 0) {
      return NextResponse.json({ success: false, error: "Work evidence document not found." }, { status: 404 });
    }

    const ev = evidenceRows[0];
    const targetUserId = ev.uploadedByUserId || ev.updateUserId;

    // 2. Authorization Check
    let isAuthorized = false;

    if (authUser.id === targetUserId) {
      // Owner can always access own evidence
      isAuthorized = true;
    } else if (isHrOrAdmin) {
      // Admin / HR role access within org scope
      isAuthorized = true;
    } else if (userRole === "TEAM_LEADER" || userRole === "PROJECT_MANAGER") {
      // Check if senior manages this employee via project team or direct manager relationship
      const managerCheck = await queryDb<any[]>(
        `SELECT B FROM _assignedstaffprojects WHERE A IN (
           SELECT id FROM project WHERE teamLeaderId = ? OR projectManagerId = ?
         ) AND B = ?
         UNION
         SELECT id FROM user WHERE managerId = ? AND id = ? LIMIT 1`,
        [authUser.id, authUser.id, targetUserId, authUser.id, targetUserId]
      );
      if (managerCheck && managerCheck.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to view or download this employee's work evidence.",
        },
        { status: 403 }
      );
    }

    try {
      const { logAuditEvent } = await import("@/lib/authMiddleware");
      await logAuditEvent(
        authUser.id,
        "WORK_EVIDENCE_ACCESSED",
        `Accessed work evidence ${ev.fileName} (ID: ${ev.id}) for user ${targetUserId}`
      );
    } catch {}

    return NextResponse.json({
      success: true,
      evidence: {
        id: ev.id,
        dailyWorkUpdateId: ev.dailyWorkUpdateId,
        fileName: ev.fileName,
        fileType: ev.fileType,
        fileSize: ev.fileSize,
        fileUrl: ev.fileUrl,
        uploadedByUserId: ev.uploadedByUserId,
        uploadedAt: ev.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/work-evidence/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to access work evidence." }, { status: 500 });
  }
}
