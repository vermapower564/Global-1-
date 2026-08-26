import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";
import { ensureNotificationTablesExist } from "@/lib/announcementService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await ensureNotificationTablesExist();

    const userId = authResult.user.id;
    const employeeId = (authResult.user as any).employeeId || userId;

    const notifications = await queryDb<any[]>(
      `SELECT * FROM notification 
       WHERE userId = ? OR userId = ?
       ORDER BY createdAt DESC 
       LIMIT 30`,
      [userId, employeeId]
    );

    const countRows = await queryDb<any[]>(
      `SELECT COUNT(*) AS unreadCount FROM notification 
       WHERE (userId = ? OR userId = ?) AND isRead = 0`,
      [userId, employeeId]
    );

    const unreadCount = Number(countRows?.[0]?.unreadCount || 0);

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: (notifications || []).map((n) => ({
        ...n,
        isRead: Boolean(n.isRead === 1 || n.isRead === true),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await ensureNotificationTablesExist();

    const body = await request.json();
    const { notificationId, markAllRead } = body;
    const userId = authResult.user.id;
    const employeeId = (authResult.user as any).employeeId || userId;

    if (markAllRead) {
      await queryDb(
        `UPDATE notification SET isRead = 1 
         WHERE (userId = ? OR userId = ?) AND isRead = 0`,
        [userId, employeeId]
      );
      clearQueryCache("notification");
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (notificationId) {
      await queryDb(
        `UPDATE notification SET isRead = 1 
         WHERE id = ? AND (userId = ? OR userId = ?)`,
        [notificationId, userId, employeeId]
      );
      clearQueryCache("notification");
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
