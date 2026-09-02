import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

// 1. Load environment variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const k = trimmed.substring(0, eqIdx).trim();
      let v = trimmed.substring(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.substring(1, v.length - 1);
      }
      process.env[k] = v;
    }
  });
}

import { queryDb } from "../lib/db";
import { generateToken } from "../lib/authService";

// Import real API route handlers
import { GET as getNotifications, PATCH as patchNotifications } from "../app/api/notifications/route";
import { GET as getNotificationById } from "../app/api/notifications/[id]/route";

function makeReq(url: string, method: string, token: string, body?: any) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Cookie: `oms_session=${token}`,
  };
  if (body && typeof body === "object") {
    headers["Content-Type"] = "application/json";
  }
  const init: RequestInit = {
    method,
    headers,
  };
  if (body) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

async function runNotificationAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — NOTIFICATION LIFECYCLE & ISOLATION AUDIT (6/6) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(54, ".")} ${statusLabel}`);
    console.log(`      Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // Resolve 2 real active employees
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);
  if (!emps || emps.length < 2) {
    throw new Error("Missing 2 active employees for notification audit.");
  }

  const userA = emps[0];
  const userB = emps[1];

  const tokenA = generateToken({ id: userA.id, email: userA.email, role: userA.role });
  const tokenB = generateToken({ id: userB.id, email: userB.email, role: userB.role });

  const testNotifId = `NOTIF-AUDIT-${Date.now()}`;

  try {
    // Insert a test notification for User A
    await queryDb(
      `INSERT INTO notification (id, userId, title, message, type, isRead, linkUrl, createdAt)
       VALUES (?, ?, '🚀 Task Assigned: Audit Verification Task', 'You have been assigned a task.', 'INFO', 0, '/employee/tasks', NOW(3))`,
      [testNotifId, userA.id]
    );

    // -------------------------------------------------------------------------
    // TEST 1: Recipient-Specific Delivery (User A receives own notification)
    // -------------------------------------------------------------------------
    const req1 = makeReq("http://localhost:3000/api/notifications", "GET", tokenA);
    const res1 = await getNotifications(req1);
    const json1 = await res1.json();
    const userANotifs = json1.notifications || [];
    const found1 = userANotifs.find((n: any) => n.id === testNotifId);
    const test1Passed = res1.status === 200 && Boolean(found1) && found1.isRead === false;
    record(1, "Recipient-Specific Notification Delivery to User A", test1Passed, `User A retrieved notification ${testNotifId} with UNREAD status (isRead = false)`);

    // -------------------------------------------------------------------------
    // TEST 2: Recipient Isolation (User B cannot see User A's notification)
    // -------------------------------------------------------------------------
    const req2 = makeReq("http://localhost:3000/api/notifications", "GET", tokenB);
    const res2 = await getNotifications(req2);
    const json2 = await res2.json();
    const userBNotifs = json2.notifications || [];
    const found2 = userBNotifs.find((n: any) => n.id === testNotifId);
    const test2Passed = res2.status === 200 && !found2;
    record(2, "Notification Recipient Isolation (User B Isolated)", test2Passed, `User B GET /api/notifications did not expose User A's notification ${testNotifId}`);

    // -------------------------------------------------------------------------
    // TEST 3: ID Tampering Protection on Single Notification Endpoint
    // -------------------------------------------------------------------------
    const req3 = makeReq(`http://localhost:3000/api/notifications/${encodeURIComponent(testNotifId)}`, "GET", tokenB);
    const res3 = await getNotificationById(req3, { params: Promise.resolve({ id: testNotifId }) });
    const json3 = await res3.json();
    const test3Passed = res3.status === 404 && json3.success === false;
    record(3, "ID Tampering Protection on Single Notification", test3Passed, `User B direct access attempt rejected with HTTP 404 ("${json3.error}")`);

    // -------------------------------------------------------------------------
    // TEST 4: UNREAD -> READ Lifecycle Transition
    // -------------------------------------------------------------------------
    const req4 = makeReq("http://localhost:3000/api/notifications", "PATCH", tokenA, { notificationId: testNotifId });
    const res4 = await patchNotifications(req4);
    const json4 = await res4.json();

    const req4Check = makeReq("http://localhost:3000/api/notifications", "GET", tokenA);
    const res4Check = await getNotifications(req4Check);
    const json4Check = await res4Check.json();
    const found4 = (json4Check.notifications || []).find((n: any) => n.id === testNotifId);

    const test4Passed = res4.status === 200 && found4 && found4.isRead === true;
    record(4, "UNREAD -> READ Lifecycle State Transition", test4Passed, `Notification ${testNotifId} status updated to READ (isRead = true)`);

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Prevention on Page Refresh / Repeated GET
    // -------------------------------------------------------------------------
    const req5a = makeReq("http://localhost:3000/api/notifications", "GET", tokenA);
    await getNotifications(req5a);
    const req5b = makeReq("http://localhost:3000/api/notifications", "GET", tokenA);
    await getNotifications(req5b);

    const countRows = await queryDb<any[]>(`SELECT COUNT(*) AS total FROM notification WHERE id = ?`, [testNotifId]);
    const test5Passed = Number(countRows[0]?.total) === 1;
    record(5, "Duplicate Prevention on Page Refresh / Repeated GET", test5Passed, `Repeated GET requests produced exactly 1 notification record in DB`);

    // -------------------------------------------------------------------------
    // TEST 6: Mark All Read Functionality
    // -------------------------------------------------------------------------
    const req6 = makeReq("http://localhost:3000/api/notifications", "PATCH", tokenA, { markAllRead: true });
    const res6 = await patchNotifications(req6);
    const json6 = await res6.json();

    const unreadCheck = await queryDb<any[]>(`SELECT COUNT(*) AS unreadCount FROM notification WHERE userId = ? AND isRead = 0`, [userA.id]);
    const test6Passed = res6.status === 200 && Number(unreadCheck[0]?.unreadCount) === 0;
    record(6, "Mark All Notifications Read Functionality", test6Passed, `All notifications marked read (Unread count: 0)`);

    // Cleanup test notification
    await queryDb(`DELETE FROM notification WHERE id = ?`, [testNotifId]);

  } catch (err: any) {
    console.error("Notification audit error:", err);
    await queryDb(`DELETE FROM notification WHERE id = ?`, [testNotifId]);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("NOTIFICATION LIFECYCLE & ISOLATION AUDIT SUMMARY");
  console.log("=========================================================================");
  results.forEach((r) => {
    const numStr = r.num.toString().padStart(2, "0");
    const statusStr = r.passed ? "PASSED" : "FAILED";
    console.log(`[${numStr}] ${r.name.padEnd(54, ".")} ${statusStr}`);
  });

  console.log("=========================================================================");
  console.log(`Real Tests Passed: ${passedCount}/${results.length}`);
  console.log(`Real Tests Failed: ${failedCount}/${results.length}`);
  console.log("=========================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runNotificationAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
