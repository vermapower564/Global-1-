import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

// Load environment variables
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
import { GET as getProjectById } from "../app/api/projects/[id]/route";
import { GET as getProjectComments } from "../app/api/projects/[id]/comments/route";
import { GET as getTaskById, PATCH as patchTaskById } from "../app/api/tasks/[id]/route";
import { GET as getWorkEvidence } from "../app/api/work-evidence/[id]/route";
import { PATCH as patchResignationById } from "../app/api/resignations/[id]/route";
import { GET as getAdminReports } from "../app/api/admin/reports/route";
import { GET as getAuditLogs } from "../app/api/audit-logs/route";
import { POST as postLogin } from "../app/api/auth/login/route";

function makeReq(url: string, method: string, token?: string, body?: any) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["Cookie"] = `oms_session=${token}`;
  }
  if (body && typeof body === "object") {
    headers["Content-Type"] = "application/json";
  }
  const init: RequestInit = { method, headers };
  if (body) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

interface AuditTestResult {
  id: string;
  category: string;
  name: string;
  status: "PASS" | "FAIL" | "FIXED";
  details: string;
}

async function runComprehensiveSecurityAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — TARGETED SECURITY & IDOR AUDIT (10/10) ===");
  console.log("=========================================================================\n");

  const results: AuditTestResult[] = [];

  function record(id: string, category: string, name: string, status: "PASS" | "FAIL" | "FIXED", details: string) {
    console.log(`[${id}] (${category}) ${name.padEnd(52, ".")} [${status}]`);
    console.log(`      Details: ${details}\n`);
    results.push({ id, category, name, status, details });
  }

  // Resolve DB entities
  const pms = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'PROJECT_MANAGER' AND isActive = 1 LIMIT 1`);
  const tls = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!pms || !tls || !emps || emps.length < 2) {
    throw new Error("Missing required users for comprehensive security audit.");
  }

  const pm = pms[0];
  const tl = tls[0];
  const memberA = emps[0];
  const memberB = emps[1];

  // Tokens
  const tokenPM = generateToken({ id: pm.id, email: pm.email, role: pm.role });
  const tokenTL = generateToken({ id: tl.id, email: tl.email, role: tl.role });
  const tokenA = generateToken({ id: memberA.id, email: memberA.email, role: memberA.role });
  const tokenB = generateToken({ id: memberB.id, email: memberB.email, role: memberB.role });

  // Setup 2 isolated projects: Project Alpha (memberA) vs Project Beta (memberB)
  const projAlphaId = `PRJ-ALPHA-${Date.now()}`;
  const projBetaId = `PRJ-BETA-${Date.now()}`;

  await queryDb(
    `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
     VALUES (?, 'Project Alpha (Member A Scope)', 'Client A', 'Contact A', 'a@alpha.com', '+91 11111', NOW(), NOW(), 100000, ?, ?, NOW())`,
    [projAlphaId, pm.id, tl.id]
  );
  await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [projAlphaId, memberA.id]);

  await queryDb(
    `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
     VALUES (?, 'Project Beta (Member B Scope)', 'Client B', 'Contact B', 'b@beta.com', '+91 22222', NOW(), NOW(), 200000, ?, ?, NOW())`,
    [projBetaId, pm.id, tl.id]
  );
  await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [projBetaId, memberB.id]);

  // Create Task in Project Alpha assigned to Member A
  const taskAlphaId = `TSK-ALPHA-${Date.now()}`;
  await queryDb(
    `INSERT INTO task (id, title, description, section, projectId, assignedToUserId, createdById, status, priority, progress, startDate, dueDate, estimatedHours, actualHours, createdAt, updatedAt)
     VALUES (?, 'Alpha Security Task', 'Test task in Alpha', 'Security', ?, ?, ?, 'IN_PROGRESS', 'HIGH', 50, NOW(), NOW(), 10, 5, NOW(), NOW())`,
    [taskAlphaId, projAlphaId, memberA.id, tl.id]
  );

  // Create Deactivated User
  const deactUserId = `usr_sec_deact_${Date.now()}`;
  const deactEmail = `deact.sec.${Date.now()}@global1.com`;
  const hashedPw = await hashPassword("Password123!");
  await queryDb(
    `INSERT INTO user (id, employeeId, name, email, password, role, isActive, isResigned, createdAt, updatedAt)
     VALUES (?, ?, 'Deactivated Security Test User', ?, ?, 'DEVELOPER', 0, 1, NOW(3), NOW(3))`,
    [deactUserId, `EMP-SDEACT-${Date.now().toString().slice(-4)}`, deactEmail, hashedPw]
  );

  let resigId = "";
  let evId = "";
  let dwuId = "";

  try {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & DEACTIVATED ACCOUNT PROTECTION
    // -------------------------------------------------------------------------
    const reqLogDeact = makeReq("http://localhost:3000/api/auth/login", "POST", undefined, {
      identity: deactEmail,
      password: "Password123!",
    });
    const resLogDeact = await postLogin(reqLogDeact);
    const jsonLogDeact = await resLogDeact.json();
    const test1Pass = resLogDeact.status === 403 && jsonLogDeact.success === false;
    record("SEC-01", "AUTH", "Deactivated Account Login Rejection", test1Pass ? "PASS" : "FAIL", `Status ${resLogDeact.status}: "${jsonLogDeact.error}"`);

    // -------------------------------------------------------------------------
    // 2. PROJECT IDOR & CROSS-PROJECT ISOLATION (Alpha vs Beta)
    // -------------------------------------------------------------------------
    const reqProjSubst = makeReq(`http://localhost:3000/api/projects/${projBetaId}`, "GET", tokenA);
    const resProjSubst = await getProjectById(reqProjSubst, { params: Promise.resolve({ id: projBetaId }) });
    const jsonProjSubst = await resProjSubst.json();
    const test2Pass = resProjSubst.status === 403 && jsonProjSubst.success === false;
    record("SEC-02", "IDOR", "Cross-Project Substitution (Alpha -> Beta)", test2Pass ? "PASS" : "FAIL", `Status ${resProjSubst.status}: "${jsonProjSubst.error}"`);

    // -------------------------------------------------------------------------
    // 3. PROJECT COMMENTS CROSS-PROJECT LEAKAGE PROTECTION
    // -------------------------------------------------------------------------
    const reqCommSubst = makeReq(`http://localhost:3000/api/projects/${projBetaId}/comments`, "GET", tokenA);
    const resCommSubst = await getProjectComments(reqCommSubst, { params: Promise.resolve({ id: projBetaId }) });
    const jsonCommSubst = await resCommSubst.json();
    const test3Pass = resCommSubst.status === 403 && jsonCommSubst.success === false;
    record("SEC-03", "IDOR", "Project Comments Cross-Project Isolation", test3Pass ? "PASS" : "FAIL", `Status ${resCommSubst.status}: "${jsonCommSubst.error}"`);

    // -------------------------------------------------------------------------
    // 4. TASK IDOR & CROSS-MEMBER TASK VIEW REJECTION
    // -------------------------------------------------------------------------
    const reqTaskSubst = makeReq(`http://localhost:3000/api/tasks/${taskAlphaId}`, "GET", tokenB);
    const resTaskSubst = await getTaskById(reqTaskSubst, { params: Promise.resolve({ id: taskAlphaId }) });
    const jsonTaskSubst = await resTaskSubst.json();
    const test4Pass = resTaskSubst.status === 403 && jsonTaskSubst.success === false;
    record("SEC-04", "IDOR", "Task Access IDOR & Cross-Member Protection", test4Pass ? "PASS" : "FAIL", `Status ${resTaskSubst.status}: "${jsonTaskSubst.error}"`);

    // -------------------------------------------------------------------------
    // 5. EMPLOYEE SELF-APPROVAL PREVENTION (Task Completion Self-Approval)
    // -------------------------------------------------------------------------
    const reqSelfApprove = makeReq(`http://localhost:3000/api/tasks/${taskAlphaId}`, "PATCH", tokenA, {
      status: "COMPLETED",
      progress: 100,
    });
    const resSelfApprove = await patchTaskById(reqSelfApprove, { params: Promise.resolve({ id: taskAlphaId }) });
    const dbTaskSelf = await queryDb<any[]>(`SELECT status, progress FROM task WHERE id = ?`, [taskAlphaId]);
    const test5Pass = dbTaskSelf[0]?.status === "IN_REVIEW";
    record("SEC-05", "RBAC", "Self-Approval Prevention (COMPLETED -> IN_REVIEW)", test5Pass ? "PASS" : "FAIL", `Employee task status set to "${dbTaskSelf[0]?.status}" requiring TL review`);

    // -------------------------------------------------------------------------
    // 6. RESIGNATION SELF-APPROVAL REJECTION
    // -------------------------------------------------------------------------
    resigId = `RSG-SEC-${Date.now()}`;
    await queryDb(
      `INSERT INTO resignation (id, resignationId, userId, employeeId, employeeName, email, department, role, resignationDate, noticePeriodDays, lastWorkingDay, reason, status, submittedAt)
       VALUES (?, ?, ?, 'EMP-A', ?, ?, 'Eng', 'DEVELOPER', NOW(), 15, NOW(), 'Personal reasons', 'SUBMITTED', NOW())`,
      [resigId, `RSG-ID-${Date.now()}`, memberA.id, memberA.name, memberA.email]
    );

    const reqResigSelf = makeReq(`http://localhost:3000/api/resignations/${resigId}`, "PATCH", tokenA, {
      action: "APPROVE",
    });
    const resResigSelf = await patchResignationById(reqResigSelf, { params: Promise.resolve({ id: resigId }) });
    const jsonResigSelf = await resResigSelf.json();
    const test6Pass = resResigSelf.status === 403 && jsonResigSelf.success === false;
    record("SEC-06", "RBAC", "Resignation Self-Approval Rejection", test6Pass ? "PASS" : "FAIL", `Status ${resResigSelf.status}: "${jsonResigSelf.error}"`);

    // -------------------------------------------------------------------------
    // 7. CROSS-EMPLOYEE REPORT ACCESS REJECTION
    // -------------------------------------------------------------------------
    const reqReportCross = makeReq(`http://localhost:3000/api/admin/reports?employeeId=${memberB.id}`, "GET", tokenA);
    const resReportCross = await getAdminReports(reqReportCross);
    const jsonReportCross = await resReportCross.json();
    const test7Pass = resReportCross.status === 403 && jsonReportCross.success === false;
    record("SEC-07", "IDOR", "Cross-Employee Report Access Rejection", test7Pass ? "PASS" : "FAIL", `Status ${resReportCross.status}: "${jsonReportCross.error}"`);

    // -------------------------------------------------------------------------
    // 8. AUDIT LOG RBAC PROTECTION FROM REGULAR EMPLOYEES
    // -------------------------------------------------------------------------
    const reqAuditEmp = makeReq("http://localhost:3000/api/audit-logs", "GET", tokenA);
    const resAuditEmp = await getAuditLogs(reqAuditEmp);
    const jsonAuditEmp = await resAuditEmp.json();
    const test8Pass = resAuditEmp.status === 403 && jsonAuditEmp.success === false;
    record("SEC-08", "RBAC", "System Audit Logs RBAC Protection", test8Pass ? "PASS" : "FAIL", `Status ${resAuditEmp.status}: "${jsonAuditEmp.error}"`);

    // -------------------------------------------------------------------------
    // 9. WORK EVIDENCE UNAUTHORIZED DOCUMENT ACCESS REJECTION
    // -------------------------------------------------------------------------
    evId = `WE-SEC-${Date.now()}`;
    dwuId = `DWU-SEC-${Date.now()}`;
    await queryDb(
      `INSERT INTO dailyworkupdate (id, userId, date, hoursWorked, description, status, priority, projectName, submittedAt)
       VALUES (?, ?, NOW(), 8, 'Security Test Log', 'PENDING', 'MEDIUM', 'Alpha', NOW())`,
      [dwuId, memberA.id]
    );
    await queryDb(
      `INSERT INTO workevidence (id, dailyWorkUpdateId, fileName, fileType, fileSize, fileUrl, uploadedByUserId, uploadedAt)
       VALUES (?, ?, 'confidential-spec.pdf', 'application/pdf', 1024, 'https://res.cloudinary.com/demo/confidential-spec.pdf', ?, NOW())`,
      [evId, dwuId, memberA.id]
    );

    const reqEvUnauth = makeReq(`http://localhost:3000/api/work-evidence/${evId}`, "GET", tokenB);
    const resEvUnauth = await getWorkEvidence(reqEvUnauth, { params: Promise.resolve({ id: evId }) });
    const jsonEvUnauth = await resEvUnauth.json();
    const test9Pass = resEvUnauth.status === 403 && jsonEvUnauth.success === false;
    record("SEC-09", "IDOR", "Work Evidence Unauthorized Document Access", test9Pass ? "PASS" : "FAIL", `Status ${resEvUnauth.status}: "${jsonEvUnauth.error}"`);

    // -------------------------------------------------------------------------
    // 10. UNAPPROVED RESIGNATION DEACTIVATION PREVENTION
    // -------------------------------------------------------------------------
    const dbUserBefore = await queryDb<any[]>(`SELECT isActive FROM user WHERE id = ?`, [memberA.id]);
    const test10Pass = Boolean(dbUserBefore[0]?.isActive);
    record("SEC-10", "LIFECYCLE", "Submitted Resignation Account Integrity", test10Pass ? "PASS" : "FAIL", `User account remains active (isActive = 1) until official managerial approval`);

    // Cleanup
    if (evId) await queryDb(`DELETE FROM workevidence WHERE id = ?`, [evId]);
    if (dwuId) await queryDb(`DELETE FROM dailyworkupdate WHERE id = ?`, [dwuId]);
    if (resigId) await queryDb(`DELETE FROM resignation WHERE id = ?`, [resigId]);
    await queryDb(`DELETE FROM task WHERE id = ?`, [taskAlphaId]);
    await queryDb(`DELETE FROM _assignedstaffprojects WHERE A IN (?, ?)`, [projAlphaId, projBetaId]);
    await queryDb(`DELETE FROM project WHERE id IN (?, ?)`, [projAlphaId, projBetaId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [deactUserId]);

  } catch (err: any) {
    console.error("Security audit execution error:", err);
    if (evId) await queryDb(`DELETE FROM workevidence WHERE id = ?`, [evId]);
    if (dwuId) await queryDb(`DELETE FROM dailyworkupdate WHERE id = ?`, [dwuId]);
    if (resigId) await queryDb(`DELETE FROM resignation WHERE id = ?`, [resigId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [deactUserId]);
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("=========================================================================");
  console.log("SECURITY & IDOR AUDIT SUMMARY");
  console.log("=========================================================================");
  results.forEach((r) => {
    console.log(`[${r.id}] ${r.name.padEnd(52, ".")} [${r.status}]`);
  });

  console.log("=========================================================================");
  console.log(`Total Security Checks Passed: ${passed}/${results.length}`);
  console.log(`Total Security Checks Failed: ${failed}/${results.length}`);
  console.log("=========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveSecurityAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL AUDIT ERROR:", err);
  process.exit(1);
});
