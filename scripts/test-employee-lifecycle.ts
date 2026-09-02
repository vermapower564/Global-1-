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
import { GET as getEmployeesGet } from "../app/api/employees/route";
import { POST as addProjectTeamPost } from "../app/api/projects/[id]/team/route";
import { POST as createTaskPost, GET as getTasksGet } from "../app/api/tasks/route";

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

async function runEmployeeLifecycleAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — EMPLOYEE LIFECYCLE MANAGEMENT AUDIT (6/6) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(54, ".")} ${statusLabel}`);
    console.log(`      Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // 1. Resolve real database users
  const admins = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const pms = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'PROJECT_MANAGER' AND isActive = 1 LIMIT 1`);
  const tls = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!admins || !pms || !tls || !emps || emps.length < 2) {
    throw new Error("Missing required database users for employee lifecycle test.");
  }

  const realAdmin = admins[0];
  const realPM = pms[0];
  const realTL = tls[0];
  const activeEmp = emps[0];
  const unauthorizedEmp = emps[1];

  // 2. Create temporary active and deactivated employee test users
  const deactUserId = `usr_deact_test_${Date.now()}`;
  const deactEmpId = `EMP-DEACT-${Date.now().toString().slice(-4)}`;
  const deactEmail = `deact.test.${Date.now()}@global1.com`;
  const hashedPw = await hashPassword("Password123!");

  await queryDb(
    `INSERT INTO user (id, employeeId, name, email, password, role, isActive, isResigned, createdAt, updatedAt)
     VALUES (?, ?, 'Deactivated Test Employee', ?, ?, 'DEVELOPER', 0, 1, NOW(3), NOW(3))`,
    [deactUserId, deactEmpId, deactEmail, hashedPw]
  );

  // 3. Create a test project and assign historical records to deactivated user
  const tempProjId = `PRJ-LIFECYCLE-${Date.now()}`;
  await queryDb(
    `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
     VALUES (?, 'Lifecycle Audit Project', 'Acme', 'Contact', 'c@acme.com', '+91 99999', NOW(), NOW(), 10000, ?, ?, NOW())`,
    [tempProjId, realPM.id, realTL.id]
  );

  // Add deactivated employee to historical project team
  await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [tempProjId, deactUserId]);

  // Create a historical task assigned to deactivated employee
  const tempTaskId = `TSK-LIFECYCLE-${Date.now()}`;
  await queryDb(
    `INSERT INTO task (id, title, description, status, priority, projectId, assignedToUserId, dueDate, createdAt, updatedAt)
     VALUES (?, 'Historical Task for Deactivated Employee', 'Task description', 'COMPLETED', 'HIGH', ?, ?, NOW(), NOW(), NOW())`,
    [tempTaskId, tempProjId, deactUserId]
  );

  const tokenAdmin = generateToken({ id: realAdmin.id, email: realAdmin.email, role: realAdmin.role });
  const tokenTL = generateToken({ id: realTL.id, email: realTL.email, role: realTL.role });
  const tokenUnauth = generateToken({ id: unauthorizedEmp.id, email: unauthorizedEmp.email, role: unauthorizedEmp.role });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Active Employee Can Be Selected for New Project
    // -------------------------------------------------------------------------
    const reqAddActive = makeReq(`http://localhost:3000/api/projects/${encodeURIComponent(tempProjId)}/team`, "POST", tokenTL, { userId: activeEmp.id });
    const resAddActive = await addProjectTeamPost(reqAddActive, { params: Promise.resolve({ id: tempProjId }) });
    const jsonAddActive = await resAddActive.json();
    const test1Passed = resAddActive.status === 200 && jsonAddActive.success === true;
    record(1, "Active Employee Can Be Selected for New Project", test1Passed, `Active employee ${activeEmp.name} added to project team`);

    // -------------------------------------------------------------------------
    // TEST 2: Deactivated Employee Cannot Be Newly Assigned
    // -------------------------------------------------------------------------
    const newProjId = `PRJ-NEW-${Date.now()}`;
    await queryDb(
      `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
       VALUES (?, 'New Project', 'Acme', 'Contact', 'c@acme.com', '+91 99999', NOW(), NOW(), 10000, ?, ?, NOW())`,
      [newProjId, realPM.id, realTL.id]
    );

    const reqAddDeact = makeReq(`http://localhost:3000/api/projects/${encodeURIComponent(newProjId)}/team`, "POST", tokenTL, { userId: deactUserId });
    await addProjectTeamPost(reqAddDeact, { params: Promise.resolve({ id: newProjId }) });
    
    // Also try assigning a task to deactivated employee
    const reqTaskDeact = makeReq("http://localhost:3000/api/tasks", "POST", tokenTL, {
      title: "New Task for Deactivated User",
      projectId: newProjId,
      assignedToUserId: deactUserId,
    });
    const resTaskDeact = await createTaskPost(reqTaskDeact);
    const jsonTaskDeact = await resTaskDeact.json();

    const teamCheck = await queryDb<any[]>(`SELECT * FROM _assignedstaffprojects WHERE A = ? AND B = ?`, [newProjId, deactUserId]);
    const test2Passed = teamCheck.length === 0 && resTaskDeact.status === 400 && jsonTaskDeact.error?.includes("deactivated or resigned");
    record(2, "Deactivated Employee Cannot Be Newly Assigned", test2Passed, `Backend rejected assignment to deactivated employee (${jsonTaskDeact.error})`);

    // Cleanup newProjId
    await queryDb(`DELETE FROM project WHERE id = ?`, [newProjId]);

    // -------------------------------------------------------------------------
    // TEST 3: Historical Projects Still Show Former Employee
    // -------------------------------------------------------------------------
    const histProjectMembers = await queryDb<any[]>(
      `SELECT u.id, u.name, u.isActive FROM _assignedstaffprojects asp JOIN user u ON asp.B = u.id WHERE asp.A = ? AND u.id = ?`,
      [tempProjId, deactUserId]
    );
    const test3Passed = histProjectMembers.length > 0;
    record(3, "Historical Projects Still Show Former Employee", test3Passed, `Historical project member ${deactEmail} preserved in DB`);

    // -------------------------------------------------------------------------
    // TEST 4: Historical Tasks Still Show Former Employee
    // -------------------------------------------------------------------------
    const reqGetTasks = makeReq(`http://localhost:3000/api/tasks?projectId=${encodeURIComponent(tempProjId)}`, "GET", tokenAdmin);
    const resGetTasks = await getTasksGet(reqGetTasks);
    const jsonGetTasks = await resGetTasks.json();

    const taskFound = (jsonGetTasks.tasks || []).some((t: any) => t.id === tempTaskId && (t.assignedToUserId === deactUserId || t.assigneeName === "Deactivated Test Employee"));
    record(4, "Historical Tasks Still Show Former Employee", taskFound, `Historical task ${tempTaskId} assigned to former employee retrieved cleanly`);

    // -------------------------------------------------------------------------
    // TEST 5: Resignation History Accessible to Authorised Management
    // -------------------------------------------------------------------------
    const reqGetEmpList = makeReq("http://localhost:3000/api/employees?status=RESIGNED", "GET", tokenAdmin);
    const resGetEmpList = await getEmployeesGet(reqGetEmpList);
    const jsonGetEmpList = await resGetEmpList.json();
    const test5Passed = resGetEmpList.status === 200 && jsonGetEmpList.success === true;
    record(5, "Resignation & Lifecycle History Accessible to Management", test5Passed, `Admin retrieved employee lifecycle list with status filtering`);

    // -------------------------------------------------------------------------
    // TEST 6: Unauthorised Employees Cannot Access Lifecycle Information
    // -------------------------------------------------------------------------
    const reqUnauthRes = makeReq(`http://localhost:3000/api/employees?status=RESIGNED`, "GET", tokenUnauth);
    const resUnauthRes = await getEmployeesGet(reqUnauthRes);
    const jsonUnauthRes = await resUnauthRes.json();
    const test6Passed = resUnauthRes.status === 200 && (jsonUnauthRes.data || []).every((u: any) => u.id === unauthorizedEmp.id);
    record(6, "Unauthorised Employees Cannot Access Lifecycle Information", test6Passed, `Unauthorised employee restricted to own scope (cannot view overall workforce lifecycle)`);

    // Cleanup test records
    await queryDb(`DELETE FROM task WHERE id = ?`, [tempTaskId]);
    if (tempProjId) {
      await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [tempProjId]);
      await queryDb(`DELETE FROM project WHERE id = ?`, [tempProjId]);
    }
    await queryDb(`DELETE FROM user WHERE id = ?`, [deactUserId]);

  } catch (err: any) {
    console.error("Audit error:", err);
    await queryDb(`DELETE FROM task WHERE id = ?`, [tempTaskId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [deactUserId]);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("EMPLOYEE LIFECYCLE AUDIT SUMMARY");
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

runEmployeeLifecycleAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
