import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch project-scoped comments
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

    // Verify project authorization
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
          { success: false, error: "Forbidden: You do not have permission to view comments for this project." },
          { status: 403 }
        );
      }
    }

    const comments = await queryDb<any[]>(
      `SELECT pc.id, pc.projectId, pc.comment, pc.createdAt,
              u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.role AS user_role, u.avatarUrl AS user_avatarUrl
       FROM projectcomment pc
       JOIN user u ON pc.userId = u.id
       WHERE pc.projectId = ?
       ORDER BY pc.createdAt ASC`,
      [proj.id]
    );

    const formatted = (comments || []).map((c) => ({
      id: c.id,
      projectId: c.projectId,
      comment: c.comment,
      createdAt: c.createdAt,
      user: {
        id: c.user_id,
        name: c.user_name,
        employeeId: c.user_employeeId,
        role: c.user_role ? c.user_role.replace(/_/g, " ") : "Member",
        avatarUrl: c.user_avatarUrl,
      },
    }));

    return NextResponse.json({
      success: true,
      projectId: proj.id,
      comments: formatted,
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/comments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project comments." }, { status: 500 });
  }
}

// POST: Add a project-scoped comment
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
          { success: false, error: "Forbidden: You must be a member of this project team to post comments." },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const commentText = (body.comment || "").trim();

    if (!commentText) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty." }, { status: 400 });
    }

    const commentId = `PC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();

    await queryDb(
      `INSERT INTO projectcomment (id, projectId, userId, comment, createdAt)
       VALUES (?, ?, ?, ?, NOW(3))`,
      [commentId, proj.id, authUser.id, commentText]
    );

    // Send notifications strictly to project team members / TL / PM (excluding commenter)
    try {
      const teamMembers = await queryDb<any[]>(
        `SELECT B AS userId FROM _assignedstaffprojects WHERE A = ? AND B != ?
         UNION
         SELECT teamLeaderId AS userId FROM project WHERE id = ? AND teamLeaderId IS NOT NULL AND teamLeaderId != ?
         UNION
         SELECT projectManagerId AS userId FROM project WHERE id = ? AND projectManagerId IS NOT NULL AND projectManagerId != ?`,
        [proj.id, authUser.id, proj.id, authUser.id, proj.id, authUser.id]
      );

      const recipientIds = (teamMembers || []).map((m) => m.userId).filter(Boolean);
      for (const rId of recipientIds) {
        const notifId = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
        await queryDb(
          `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
           VALUES (?, ?, ?, ?, 'INFO', 0, '/employee/projects', NOW(3))`,
          [
            notifId,
            rId,
            `💬 Project Comment: ${proj.projectTitle}`,
            `${authUser.email.split("@")[0]} commented on project "${proj.projectTitle}": "${commentText.slice(0, 80)}${commentText.length > 80 ? "..." : ""}"`,
          ]
        );
      }
    } catch (notifErr) {
      console.warn("Project comment notification warning:", notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "✓ Comment posted to project workspace.",
        id: commentId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/projects/[id]/comments error:", error);
    return NextResponse.json({ success: false, error: "Failed to post comment." }, { status: 500 });
  }
}
