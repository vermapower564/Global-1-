import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch project reviews
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
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"].includes(roleUpper);

    const projectRows = await queryDb<any[]>(
      `SELECT id, projectTitle, teamLeaderId, projectManagerId FROM project WHERE id = ? LIMIT 1`,
      [cleanId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = projectRows[0];
    const isPM = proj.projectManagerId === authUser.id;
    const isTL = proj.teamLeaderId === authUser.id;

    if (!isAdmin && !isPM && !isTL) {
      const memberCheck = await queryDb<any[]>(
        `SELECT B FROM _assignedstaffprojects WHERE A = ? AND B = ? LIMIT 1`,
        [proj.id, authUser.id]
      );
      if (!memberCheck || memberCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You do not have permission to view reviews for this project." },
          { status: 403 }
        );
      }
    }

    const reviews = await queryDb<any[]>(
      `SELECT pr.*, u.name AS reviewerName, u.email AS reviewerEmail, u.role AS reviewerUserRole
       FROM projectreview pr
       JOIN user u ON pr.reviewerUserId = u.id
       WHERE pr.projectId = ?
       ORDER BY pr.createdAt DESC`,
      [proj.id]
    );

    return NextResponse.json({
      success: true,
      projectId: proj.id,
      reviews,
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/review error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project reviews." }, { status: 500 });
  }
}

// POST: Team Leader, PM, or Admin submits project execution review
export async function POST(
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
    const roleUpper = (authUser.role || "").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(roleUpper);

    const projectRows = await queryDb<any[]>(
      `SELECT id, projectTitle, teamLeaderId, projectManagerId FROM project WHERE id = ? LIMIT 1`,
      [cleanId]
    );

    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const proj = projectRows[0];
    const isPM = proj.projectManagerId === authUser.id;
    const isTL = proj.teamLeaderId === authUser.id;

    // Self-review & role restriction: Regular employees CANNOT perform official managerial reviews
    if (!isAdmin && !isPM && !isTL) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Employees cannot perform official project reviews or approve their own project work. Reviews must be conducted by an authorized Team Leader, PM, or Admin.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { overallStatus = "HEALTHY", progressNotes, deliverables, blockers, rating = 5 } = body;

    if (!progressNotes || !progressNotes.trim()) {
      return NextResponse.json({ success: false, error: "Review progress notes are required." }, { status: 400 });
    }

    const reviewId = `PRV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
    const reviewerRole = isAdmin ? "ADMIN" : isPM ? "PROJECT_MANAGER" : "TEAM_LEADER";

    await queryDb(
      `INSERT INTO projectreview (id, projectId, reviewerUserId, reviewerRole, overallStatus, progressNotes, deliverables, blockers, rating, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        reviewId,
        proj.id,
        authUser.id,
        reviewerRole,
        overallStatus.toUpperCase(),
        progressNotes.trim(),
        deliverables ? deliverables.trim() : null,
        blockers ? blockers.trim() : null,
        Math.min(5, Math.max(1, Number(rating) || 5)),
      ]
    );

    clearQueryCache("project");

    await logAuditEvent(
      authUser.id,
      "PROJECT_REVIEW_SUBMITTED",
      `Submitted project review for "${proj.projectTitle}" (Status: ${overallStatus})`
    );

    return NextResponse.json(
      {
        success: true,
        message: `✓ Project execution review submitted by ${reviewerRole.replace(/_/g, " ")}.`,
        id: reviewId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/projects/[id]/review error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit project review." }, { status: 500 });
  }
}
