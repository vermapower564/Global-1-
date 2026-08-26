import { queryDb, clearQueryCache } from "@/lib/db";
import crypto from "crypto";

export type NotificationType =
  | "GENERAL"
  | "HOLIDAY"
  | "CELEBRATION"
  | "MEETING"
  | "IMPORTANT"
  | "URGENT";

export type NotificationAudience =
  | "ALL_EMPLOYEES"
  | "DEPARTMENT"
  | "TEAM"
  | "INDIVIDUAL_EMPLOYEE";

export interface AnnouncementInput {
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  targetDepartmentId?: string | null;
  targetDepartmentName?: string | null;
  targetRole?: string | null;
  targetUserId?: string | null;
  targetUserName?: string | null;
  senderId: string;
  senderName: string;
  senderRole: string;
}

let tablesInitialized = false;

/**
 * Ensure notification & announcement tables exist in TiDB / MySQL
 */
export async function ensureNotificationTablesExist(): Promise<void> {
  if (tablesInitialized) return;

  try {
    // 1. Notification table for per-user independent read state
    await queryDb(`
      CREATE TABLE IF NOT EXISTS notification (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        linkUrl VARCHAR(500) NULL,
        senderName VARCHAR(255) NULL,
        senderRole VARCHAR(50) NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_user (userId),
        INDEX idx_notif_read (userId, isRead)
      )
    `);

    // Add columns if they don't exist yet on existing table
    try {
      await queryDb(`ALTER TABLE notification ADD COLUMN senderName VARCHAR(255) NULL`);
    } catch {}
    try {
      await queryDb(`ALTER TABLE notification ADD COLUMN senderRole VARCHAR(50) NULL`);
    } catch {}

    // 2. Announcement table for global master broadcast records
    await queryDb(`
      CREATE TABLE IF NOT EXISTS announcement (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
        audience VARCHAR(50) NOT NULL DEFAULT 'ALL_EMPLOYEES',
        targetDepartmentId VARCHAR(191) NULL,
        targetDepartmentName VARCHAR(255) NULL,
        targetRole VARCHAR(50) NULL,
        targetUserId VARCHAR(191) NULL,
        targetUserName VARCHAR(255) NULL,
        senderId VARCHAR(191) NOT NULL,
        senderName VARCHAR(255) NOT NULL,
        senderRole VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
        recipientsCount INT NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_announcement_created (createdAt)
      )
    `);

    tablesInitialized = true;
  } catch (err: any) {
    console.error("Error creating notification/announcement tables:", err);
  }
}

/**
 * Broadcast an announcement and fan-out per-user notifications
 */
export async function broadcastAnnouncement(input: AnnouncementInput) {
  await ensureNotificationTablesExist();

  const announcementId = `ANN-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  // 1. Identify recipient users based on audience
  let recipientUsers: { id: string; name: string; email: string }[] = [];

  if (input.audience === "ALL_EMPLOYEES") {
    recipientUsers = await queryDb<{ id: string; name: string; email: string }[]>(
      `SELECT id, name, email FROM user WHERE isActive IS NULL OR isActive = 1 OR isActive = true`
    );
  } else if (input.audience === "DEPARTMENT" && input.targetDepartmentId) {
    recipientUsers = await queryDb<{ id: string; name: string; email: string }[]>(
      `SELECT id, name, email FROM user WHERE departmentId = ? AND (isActive IS NULL OR isActive = 1 OR isActive = true)`,
      [input.targetDepartmentId]
    );
  } else if (input.audience === "TEAM" && input.targetRole) {
    recipientUsers = await queryDb<{ id: string; name: string; email: string }[]>(
      `SELECT id, name, email FROM user WHERE role = ? AND (isActive IS NULL OR isActive = 1 OR isActive = true)`,
      [input.targetRole]
    );
  } else if (input.audience === "INDIVIDUAL_EMPLOYEE" && input.targetUserId) {
    recipientUsers = await queryDb<{ id: string; name: string; email: string }[]>(
      `SELECT id, name, email FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
      [input.targetUserId, input.targetUserId]
    );
  }

  // Fallback: If no users retrieved, ensure sender at least exists
  if (!recipientUsers || recipientUsers.length === 0) {
    recipientUsers = [{ id: input.senderId, name: input.senderName, email: "" }];
  }

  const recipientsCount = recipientUsers.length;

  // 2. Insert master Announcement record
  await queryDb(
    `INSERT INTO announcement (
      id, title, message, type, audience,
      targetDepartmentId, targetDepartmentName, targetRole,
      targetUserId, targetUserName, senderId, senderName, senderRole,
      status, recipientsCount, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      'PUBLISHED', ?, NOW(), NOW()
    )`,
    [
      announcementId,
      input.title,
      input.message,
      input.type,
      input.audience,
      input.targetDepartmentId || null,
      input.targetDepartmentName || null,
      input.targetRole || null,
      input.targetUserId || null,
      input.targetUserName || null,
      input.senderId,
      input.senderName,
      input.senderRole,
      recipientsCount,
    ]
  );

  // 3. Fan-out individual notification records for each recipient
  // Each employee has their own independent isRead state
  for (const user of recipientUsers) {
    const notifId = `NOTIF-${crypto.randomUUID()}`;
    await queryDb(
      `INSERT INTO notification (
        id, userId, title, message, type, isRead, linkUrl, senderName, senderRole, createdAt
      ) VALUES (
        ?, ?, ?, ?, ?, FALSE, '/admin/announcements', ?, ?, NOW()
      )`,
      [notifId, user.id, input.title, input.message, input.type, input.senderName, input.senderRole]
    );
  }

  clearQueryCache("notification");
  clearQueryCache("announcement");

  return {
    id: announcementId,
    title: input.title,
    message: input.message,
    type: input.type,
    audience: input.audience,
    recipientsCount,
    createdAt: new Date(),
  };
}
