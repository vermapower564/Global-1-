import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { broadcastAnnouncement, ensureNotificationTablesExist, NotificationType, NotificationAudience } from "@/lib/announcementService";

export const dynamic = "force-dynamic";

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "HR", "ADMIN_HR"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await ensureNotificationTablesExist();

    const role = (authResult.user.role || "").toUpperCase();
    const isPrivileged = PRIVILEGED_ROLES.includes(role);

    let sql = `SELECT * FROM announcement`;
    const params: any[] = [];

    if (!isPrivileged) {
      // Non-privileged users see only published announcements intended for everyone or their specific department
      sql += ` WHERE status = 'PUBLISHED' AND (audience = 'ALL_EMPLOYEES' OR targetUserId = ?)`;
      params.push(authResult.user.id);
    }

    sql += ` ORDER BY createdAt DESC LIMIT 100`;

    const announcements = await queryDb<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      total: (announcements || []).length,
      announcements: announcements || [],
      data: announcements || [],
    });
  } catch (error: any) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch announcements." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (authResult.user.role || "").toUpperCase();
    const isPrivileged = PRIVILEGED_ROLES.includes(role);

    // Backend RBAC Authorization Enforcement
    if (!isPrivileged) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Executive, Admin, or HR personnel are authorized to broadcast company announcements.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      message,
      type = "GENERAL",
      audience = "ALL_EMPLOYEES",
      targetDepartmentId,
      targetDepartmentName,
      targetRole,
      targetUserId,
      targetUserName,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Announcement title is required." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Announcement message content is required." }, { status: 400 });
    }

    const validTypes: NotificationType[] = ["GENERAL", "HOLIDAY", "CELEBRATION", "MEETING", "IMPORTANT", "URGENT"];
    const validAudiences: NotificationAudience[] = ["ALL_EMPLOYEES", "DEPARTMENT", "TEAM", "INDIVIDUAL_EMPLOYEE"];

    const validatedType = validTypes.includes(type) ? type : "GENERAL";
    const validatedAudience = validAudiences.includes(audience) ? audience : "ALL_EMPLOYEES";

    const senderName = authResult.user.email ? authResult.user.email.split("@")[0] : "Admin";

    const result = await broadcastAnnouncement({
      title: title.trim(),
      message: message.trim(),
      type: validatedType,
      audience: validatedAudience,
      targetDepartmentId: targetDepartmentId || null,
      targetDepartmentName: targetDepartmentName || null,
      targetRole: targetRole || null,
      targetUserId: targetUserId || null,
      targetUserName: targetUserName || null,
      senderId: authResult.user.id,
      senderName: (authResult.user as any).name || senderName,
      senderRole: role,
    });

    return NextResponse.json({
      success: true,
      message: `? Announcement "${title.trim()}" published and delivered to ${result.recipientsCount} recipient(s).`,
      announcement: result,
      recipientsCount: result.recipientsCount,
    });
  } catch (error: any) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to broadcast announcement." },
      { status: 500 }
    );
  }
}
