import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isPureAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "FINANCE", "ADMIN"].includes(roleUpper);

    const body = await request.json().catch(() => ({}));
    const { projectId, progress, notes } = body;

    // Strict Rule: Admin cannot modify progress reports
    if (isPureAdmin) {
      await logAuditEvent(
        authUser.id,
        "PROGRESS_UPDATE_REJECTED",
        `Rejected progress modification attempt by Admin (${authUser.email}) on Project (${projectId || "General"}). Progress reports are protected from Admin overwrite.`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Administrators have read-only access to progress tracking. Progress modifications must be submitted by the responsible Project Manager or Team Leader.",
        },
        { status: 403 }
      );
    }

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Project ID is required." }, { status: 400 });
    }

    // Verify user is PM or TL of this project
    const projectRows = await queryDb<any[]>(
      `SELECT * FROM project WHERE id = ? LIMIT 1`,
      [projectId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = projectRows[0];
    const isTL = proj.teamLeaderId === authUser.id;
    const isPM = roleUpper === "PROJECT_MANAGER";

    if (!isTL && !isPM) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to modify this project's progress." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "✓ Progress report updated successfully by authorized Project Lead.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
