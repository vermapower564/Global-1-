import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";
import { ensureNotificationTablesExist } from "@/lib/announcementService";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await ensureNotificationTablesExist();

    const resolvedParams = await Promise.resolve(context?.params);
    const rawId = resolvedParams?.id;
    if (!rawId) {
      return NextResponse.json({ success: false, error: "Notification ID required." }, { status: 400 });
    }

    const cleanId = decodeURIComponent(rawId).trim();
    const userId = authResult.user.id;
    const employeeId = (authResult.user as any).employeeId || userId;

    // Strict Ownership Check: Only retrieve if the notification belongs to this user
    const notifRows = await queryDb<any[]>(
      `SELECT * FROM notification 
       WHERE id = ? AND (userId = ? OR userId = ?)
       LIMIT 1`,
      [cleanId, userId, employeeId]
    );

    if (!notifRows || notifRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found or access denied." },
        { status: 404 }
      );
    }

    const notification = notifRows[0];

    // Automatically mark as read for this user if unread
    if (!notification.isRead || notification.isRead === 0) {
      await queryDb(
        `UPDATE notification SET isRead = 1 
         WHERE id = ? AND (userId = ? OR userId = ?)`,
        [cleanId, userId, employeeId]
      );
      clearQueryCache("notification");
      notification.isRead = true;
    } else {
      notification.isRead = true;
    }

    return NextResponse.json({
      success: true,
      notification: {
        ...notification,
        isRead: true,
      },
      data: {
        ...notification,
        isRead: true,
      },
    });
  } catch (error: any) {
    console.error("GET /api/notifications/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await ensureNotificationTablesExist();

    const resolvedParams = await Promise.resolve(context?.params);
    const rawId = resolvedParams?.id;
    if (!rawId) {
      return NextResponse.json({ success: false, error: "Notification ID required." }, { status: 400 });
    }

    const cleanId = decodeURIComponent(rawId).trim();
    const userId = authResult.user.id;
    const employeeId = (authResult.user as any).employeeId || userId;

    await queryDb(
      `UPDATE notification SET isRead = 1 
       WHERE id = ? AND (userId = ? OR userId = ?)`,
      [cleanId, userId, employeeId]
    );
    clearQueryCache("notification");

    return NextResponse.json({ success: true, message: "Notification marked as read." });
  } catch (error: any) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
