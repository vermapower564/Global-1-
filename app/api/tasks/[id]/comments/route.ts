import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatRole(role?: string): string {
  if (!role) return "Member";
  const r = role.toUpperCase();
  if (r === "SUPER_ADMIN") return "Super Admin";
  if (r === "ADMIN_HR") return "Admin";
  if (r === "PROJECT_MANAGER") return "Project Manager";
  if (r === "TEAM_LEADER") return "Team Leader";
  if (r === "DEVELOPER") return "Developer";
  if (r === "HR") return "HR";
  if (r === "FINANCE") return "Finance";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const taskId = resolvedParams?.id;
    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const comments = await queryDb<any[]>(
      `SELECT c.id, c.taskId, c.userId, c.commentText, c.createdAt,
              u.name, u.employeeId, u.role, u.avatarUrl
       FROM taskcomment c
       LEFT JOIN user u ON c.userId = u.id
       WHERE c.taskId = ?
       ORDER BY c.createdAt ASC`,
      [taskId]
    );

    const enrichedComments = (comments || []).map((c) => ({
      id: c.id,
      taskId: c.taskId,
      userId: c.userId,
      commentText: c.commentText,
      createdAt: c.createdAt,
      displayName: `${c.name || "User"} (${formatRole(c.role)})`,
      user: {
        id: c.userId,
        name: c.name || "User",
        employeeId: c.employeeId || "EMP",
        role: c.role || "EMPLOYEE",
        avatarUrl: c.avatarUrl,
        formattedPost: formatRole(c.role),
      },
    }));

    return NextResponse.json({
      success: true,
      total: enrichedComments.length,
      comments: enrichedComments,
    });
  } catch (error: any) {
    console.error("Task comments GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const taskId = resolvedParams?.id;
    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authUser = authResult.user;

    // Resolve user CUID
    const userRows = await queryDb<any[]>(
      `SELECT id, name, employeeId, role FROM user WHERE id = ? OR employeeId = ? OR email = ? LIMIT 1`,
      [authUser.id, authUser.id, authUser.email]
    );
    const resolvedUser = userRows && userRows.length > 0 ? userRows[0] : {
      id: authUser.id,
      name: authUser.email.split("@")[0],
      employeeId: authUser.id,
      role: authUser.role,
    };

    const body = await request.json().catch(() => ({}));
    const { commentText } = body;

    if (!commentText || !commentText.trim()) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty." }, { status: 400 });
    }

    // Check task existence
    const taskRows = await queryDb<any[]>(
      `SELECT id, title, projectId FROM task WHERE id = ? LIMIT 1`,
      [taskId]
    );
    if (!taskRows || taskRows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }
    const currentTask = taskRows[0];

    const commentId = `TC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    const cleanText = commentText.trim();
    const formattedUserWithRole = `${resolvedUser.name} (${formatRole(resolvedUser.role)})`;

    // 1. Insert comment
    await queryDb(
      `INSERT INTO taskcomment (id, taskId, userId, commentText, createdAt)
       VALUES (?, ?, ?, ?, NOW(3))`,
      [commentId, taskId, resolvedUser.id, cleanText]
    );

    // 2. Insert task history
    const historyId = `TH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    await queryDb(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'COMMENT_ADDED', NULL, ?, ?, NOW(3))`,
      [
        historyId,
        taskId,
        resolvedUser.id,
        cleanText.substring(0, 100),
        `${formattedUserWithRole} commented: "${cleanText.substring(0, 80)}${cleanText.length > 80 ? "..." : ""}"`,
      ]
    );

    clearQueryCache("task");

    // 3. Record Audit Log
    await logAuditEvent(
      resolvedUser.id,
      "COMMENT_ADDED",
      `${formattedUserWithRole} posted a comment on task "${currentTask.title}": "${cleanText.substring(0, 60)}"`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    const createdComment = {
      id: commentId,
      taskId,
      userId: resolvedUser.id,
      commentText: cleanText,
      createdAt: new Date().toISOString(),
      displayName: formattedUserWithRole,
      user: {
        id: resolvedUser.id,
        name: resolvedUser.name,
        employeeId: resolvedUser.employeeId,
        role: resolvedUser.role,
        formattedPost: formatRole(resolvedUser.role),
      },
    };

    return NextResponse.json({ success: true, comment: createdComment }, { status: 201 });
  } catch (error: any) {
    console.error("Task comment POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to post comment" }, { status: 500 });
  }
}
