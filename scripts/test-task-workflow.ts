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
import { generateToken, hashPassword } from "../lib/authService";

// Import real API route handlers
import { POST as createTaskPost } from "../app/api/tasks/route";
import { GET as getTaskDetailGet, PATCH as patchTaskDetailPatch } from "../app/api/tasks/[id]/route";

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

interface TestCheckResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

async function runTaskWorkflowAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — TASK MANAGEMENT & WORKFLOW AUDIT (8/8) ===");
  console.log("=========================================================================\n");

  const results: TestCheckResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(54, ".")} ${statusLabel}`);
    console.log(`      Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // 1. Resolve real database users across roles
  const admins = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const pms = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'PROJECT_MANAGER' AND isActive = 1 LIMIT 1`);
  const tls = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!admins || !pms || !tls || !emps || emps.length < 2) {
    throw new Error("Missing required database users for task workflow audit.");
  }

  const realAdmin = admins[0];
  const realPM = pms[0];
  const realTL = tls[0];
  const teamMemberEmp = emps[0];
  const nonMemberEmp = emps[1];

  // 2. Create temporary deactivated test user
  const deactUserId = `usr_task_deact_${Date.now()}`;
  const deactEmpId = `EMP-TDEACT-${Date.now().toString().slice(-4)}`;
  const deactEmail = `deact.task.${Date.now()}@global1.com`;
  const hashedPw = await hashPassword("Password123!");

  await queryDb(
    `INSERT INTO user (id, employeeId, name, email, password, role, isActive, isResigned, createdAt, updatedAt)
     VALUES (?, ?, 'Deactivated Task Test User', ?, ?, 'DEVELOPER', 0, 1, NOW(3), NOW(3))`,
    [deactUserId, deactEmpId, deactEmail, hashedPw]
  );

  // 3. Create test project & assign teamMemberEmp to project team
  const tempProjId = `PRJ-TASK-${Date.now()}`;
  await queryDb(
    `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
     VALUES (?, 'Task Workflow Audit Project', 'Acme', 'Contact', 'c@acme.com', '+91 99999', NOW(), NOW(), 10000, ?, ?, NOW())`,
    [tempProjId, realPM.id, realTL.id]
  );
  await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [tempProjId, teamMemberEmp.id]);

  const tokenTL = generateToken({ id: realTL.id, email: realTL.email, role: realTL.role });
  const tokenMember = generateToken({ id: teamMemberEmp.id, email: teamMemberEmp.email, role: teamMemberEmp.role });
  const tokenNonMember = generateToken({ id: nonMemberEmp.id, email: nonMemberEmp.email, role: nonMemberEmp.role });

  let testTaskId = "";

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Task Creation & Assignment to Project Team Member
    // -------------------------------------------------------------------------
    const reqCreate = makeReq("http://localhost:3000/api/tasks", "POST", tokenTL, {
      title: "Integrate Real Task Workflow API",
      description: "Implement scope checks, self-approval prevention and notifications.",
      projectId: tempProjId,
      assignedToUserId: teamMemberEmp.id,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    });
    const resCreate = await createTaskPost(reqCreate);
    const jsonCreate = await resCreate.json();
    testTaskId = jsonCreate.taskId || jsonCreate.task?.id || jsonCreate.id;

    const dbTask = await queryDb<any[]>(`SELECT * FROM task WHERE id = ?`, [testTaskId]);
    const test1Passed = (resCreate.status === 200 || resCreate.status === 201) && dbTask.length > 0;
    record(1, "Task Creation & Assignment to Project Team Member", test1Passed, `Task ${testTaskId} created for ${teamMemberEmp.name} in project ${tempProjId}`);

    // -------------------------------------------------------------------------
    // TEST 2: Assignment Scope Protection (Prevents Non-Project / Deactivated)
    // -------------------------------------------------------------------------
    const reqAssignDeact = makeReq("http://localhost:3000/api/tasks", "POST", tokenTL, {
      title: "Task for Deactivated Employee",
      projectId: tempProjId,
      assignedToUserId: deactUserId,
    });
    const resAssignDeact = await createTaskPost(reqAssignDeact);

    const reqAssignNonMember = makeReq("http://localhost:3000/api/tasks", "POST", tokenTL, {
      title: "Task for Non-Project Member",
      projectId: tempProjId,
      assignedToUserId: nonMemberEmp.id,
    });
    const resAssignNonMember = await createTaskPost(reqAssignNonMember);

    const test2Passed = resAssignDeact.status === 400 && resAssignNonMember.status === 400;
    record(2, "Assignment Scope Protection Enforced", test2Passed, `Backend rejected assignment to deactivated employee (HTTP ${resAssignDeact.status}) and non-team employee (HTTP ${resAssignNonMember.status})`);

    // -------------------------------------------------------------------------
    // TEST 3: Assignee Receives Notification
    // -------------------------------------------------------------------------
    const notifsAssign = await queryDb<any[]>(`SELECT * FROM notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`, [teamMemberEmp.id]);
    const test3Passed = notifsAssign.length > 0 && notifsAssign[0].title.includes("Assigned");
    record(3, "Assignee Receives Task Assignment Notification", test3Passed, `Verified notification in DB: "${notifsAssign[0]?.title}"`);

    // -------------------------------------------------------------------------
    // TEST 4: Self-Approval Prevention for Task Completion
    // -------------------------------------------------------------------------
    const reqSelfComplete = makeReq(`http://localhost:3000/api/tasks/${encodeURIComponent(testTaskId)}`, "PATCH", tokenMember, {
      status: "COMPLETED",
      progress: 100,
    });
    const resSelfComplete = await patchTaskDetailPatch(reqSelfComplete, { params: Promise.resolve({ id: testTaskId }) });

    const dbTaskAfterSelf = await queryDb<any[]>(`SELECT status, progress FROM task WHERE id = ?`, [testTaskId]);
    const test4Passed = dbTaskAfterSelf.length > 0 && dbTaskAfterSelf[0].status === "IN_REVIEW";
    record(4, "Self-Approval Prevention for Task Completion", test4Passed, `Employee set status COMPLETED -> Automatically mapped to "${dbTaskAfterSelf[0]?.status}" for Team Leader review`);

    // -------------------------------------------------------------------------
    // TEST 5: Team Leader Receives Completion Review Notification
    // -------------------------------------------------------------------------
    const notifsTL = await queryDb<any[]>(`SELECT * FROM notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`, [realTL.id]);
    const test5Passed = notifsTL.length > 0 && notifsTL[0].title.includes("Submitted");
    record(5, "Team Leader Receives Completion Review Notification", test5Passed, `Verified TL notification in DB: "${notifsTL[0]?.title}"`);

    // -------------------------------------------------------------------------
    // TEST 6: Team Leader Approves Task (COMPLETED)
    // -------------------------------------------------------------------------
    const reqTLApprove = makeReq(`http://localhost:3000/api/tasks/${encodeURIComponent(testTaskId)}`, "PATCH", tokenTL, {
      status: "COMPLETED",
      progress: 100,
      reviewNotes: "Excellently implemented and verified.",
    });
    const resTLApprove = await patchTaskDetailPatch(reqTLApprove, { params: Promise.resolve({ id: testTaskId }) });

    const dbTaskAfterTL = await queryDb<any[]>(`SELECT status, progress, completedAt FROM task WHERE id = ?`, [testTaskId]);
    const test6Passed = resTLApprove.status === 200 && dbTaskAfterTL[0]?.status === "COMPLETED" && Boolean(dbTaskAfterTL[0]?.completedAt);
    record(6, "Team Leader Approves & Completes Task", test6Passed, `TL ${realTL.name} approved task -> Status: COMPLETED, Progress: 100%`);

    // -------------------------------------------------------------------------
    // TEST 7: Employee Receives Approval Notification
    // -------------------------------------------------------------------------
    const notifsApprove = await queryDb<any[]>(`SELECT * FROM notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`, [teamMemberEmp.id]);
    const test7Passed = notifsApprove.length > 0 && notifsApprove[0].title.includes("Approved");
    record(7, "Employee Receives Approval Notification", test7Passed, `Verified employee notification in DB: "${notifsApprove[0]?.title}"`);

    // -------------------------------------------------------------------------
    // TEST 8: ID Manipulation & Cross-Project Access Protection
    // -------------------------------------------------------------------------
    const reqCrossView = makeReq(`http://localhost:3000/api/tasks/${encodeURIComponent(testTaskId)}`, "GET", tokenNonMember);
    const resCrossView = await getTaskDetailGet(reqCrossView, { params: Promise.resolve({ id: testTaskId }) });
    const jsonCrossView = await resCrossView.json();
    const test8Passed = resCrossView.status === 403 && jsonCrossView.success === false;
    record(8, "ID Manipulation & Cross-Project Access Protection", test8Passed, `Non-project member access rejected with HTTP 403 ("${jsonCrossView.error}")`);

    // Cleanup test records
    if (testTaskId) await queryDb(`DELETE FROM task WHERE id = ?`, [testTaskId]);
    await queryDb(`DELETE FROM notification WHERE userId = ?`, [teamMemberEmp.id]);
    await queryDb(`DELETE FROM notification WHERE userId = ?`, [realTL.id]);
    if (tempProjId) {
      await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [tempProjId]);
      await queryDb(`DELETE FROM project WHERE id = ?`, [tempProjId]);
    }
    await queryDb(`DELETE FROM user WHERE id = ?`, [deactUserId]);

  } catch (err: any) {
    console.error("Task audit error:", err);
    if (testTaskId) await queryDb(`DELETE FROM task WHERE id = ?`, [testTaskId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [deactUserId]);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("TASK WORKFLOW & SECURITY AUDIT SUMMARY");
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

runTaskWorkflowAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
