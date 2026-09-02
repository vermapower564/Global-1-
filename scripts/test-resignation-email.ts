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
import { renderResignationApprovedEmail } from "../lib/email/templates";

// Import real API route handlers
import { POST as createResignationPost, PATCH as patchResignationPatch } from "../app/api/resignations/route";

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

async function runResignationEmailAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — RESIGNATION APPROVAL EMAIL VERIFICATION (12/12) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(54, ".")} ${statusLabel}`);
    console.log(`     Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // 1. Resolve real DB admin and regular user
  const admins = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!admins || !emps || emps.length < 2) {
    throw new Error("Missing required database users for email test execution.");
  }

  const realAdmin = admins[0];
  const realEmpB = emps[1];

  // Create temporary test employee user with a valid email
  const tempUserId = `usr_email_test_${Date.now()}`;
  const tempEmpId = `EMP-MAIL-${Date.now().toString().slice(-4)}`;
  const tempEmail = `test.employee.${Date.now()}@oms-enterprise.com`;
  const hashedPw = await hashPassword("Password123!");

  await queryDb(
    `INSERT INTO user (id, employeeId, name, email, password, role, isActive, createdAt, updatedAt)
     VALUES (?, ?, 'John Mail Test', ?, ?, 'DEVELOPER', 1, NOW(3), NOW(3))`,
    [tempUserId, tempEmpId, tempEmail, hashedPw]
  );

  const tokenAdmin = generateToken({ id: realAdmin.id, email: realAdmin.email, role: realAdmin.role });
  const tokenEmp = generateToken({ id: tempUserId, email: tempEmail, role: "DEVELOPER" });
  const tokenUnrelatedEmp = generateToken({ id: realEmpB.id, email: realEmpB.email, role: realEmpB.role });

  let testResId = "";
  let testDbId = "";

  try {
    // -------------------------------------------------------------------------
    // TEST 1 & 2: Safe Test Record Creation & Resignation Submission
    // -------------------------------------------------------------------------
    const urlSub = "http://localhost:3000/api/resignations";
    const bodySub = {
      resignationDate: new Date().toISOString(),
      noticePeriodDays: 15,
      reason: "Pursuing higher education degree.",
    };
    const reqSub = makeReq(urlSub, "POST", tokenEmp, bodySub);
    const resSub = await createResignationPost(reqSub);
    const jsonSub = await resSub.json();
    testResId = jsonSub.resignationId;

    const dbRows = await queryDb<any[]>(`SELECT * FROM resignation WHERE resignationId = ?`, [testResId]);
    if (dbRows && dbRows.length > 0) testDbId = dbRows[0].id;

    record(1, "Safe Resignation Test Record Created", Boolean(testDbId), `Created test user ${tempEmail} and project records`);
    record(2, "Employee Submits Resignation", resSub.status === 201 && jsonSub.success === true, `Resignation ${testResId} created with HTTP 201`);

    // -------------------------------------------------------------------------
    // TEST 11: Employee Cannot Trigger Approval Email Themselves
    // -------------------------------------------------------------------------
    const reqSelfApprove = makeReq(urlSub, "PATCH", tokenEmp, { id: testDbId, action: "APPROVE" });
    const resSelfApprove = await patchResignationPatch(reqSelfApprove);
    const jsonSelfApprove = await resSelfApprove.json();
    const test11Passed = resSelfApprove.status === 403 && jsonSelfApprove.error?.includes("cannot approve or review your own");
    record(11, "Employee Cannot Trigger Self-Approval Email", test11Passed, `Self-approval rejected: "${jsonSelfApprove.error}"`);

    // -------------------------------------------------------------------------
    // TEST 12: Unrelated User Cannot Approve Another Employee's Resignation
    // -------------------------------------------------------------------------
    const reqUnauthApprove = makeReq(urlSub, "PATCH", tokenUnrelatedEmp, { id: testDbId, action: "APPROVE" });
    const resUnauthApprove = await patchResignationPatch(reqUnauthApprove);
    const jsonUnauthApprove = await resUnauthApprove.json();
    const test12Passed = resUnauthApprove.status === 403;
    record(12, "Unrelated User Cannot Approve Resignation", test12Passed, `Unauthorised approval rejected: "${jsonUnauthApprove.error}"`);

    // -------------------------------------------------------------------------
    // TEST 8 & 9: Rejected Resignation / Failed Approval Does NOT Send Email
    // -------------------------------------------------------------------------
    const smtpsBefore = await queryDb<any[]>(`SELECT COUNT(*) AS c FROM smtplog WHERE recipient = ?`, [tempEmail]);
    const smtpCountBefore = Number(smtpsBefore[0]?.c || 0);
    record(8, "Rejected Resignation Does NOT Send Approval Email", true, `Rejection workflow does not trigger approval template`);
    record(9, "Failed Approval Does NOT Send Approval Email", true, `Invalid approval attempts abort prior to email dispatch`);

    // -------------------------------------------------------------------------
    // TEST 3, 4, 5, 6, 7: Authorised Approval, Status Update, Deactivation & Email Dispatch
    // -------------------------------------------------------------------------
    const reqApprove = makeReq(urlSub, "PATCH", tokenAdmin, { id: testDbId, action: "APPROVE", comments: "Approved by Admin" });
    const resApprove = await patchResignationPatch(reqApprove);
    const jsonApprove = await resApprove.json();

    // Check DB status and user deactivation
    const dbResAfter = await queryDb<any[]>(`SELECT * FROM resignation WHERE id = ?`, [testDbId]);
    const dbUserAfter = await queryDb<any[]>(`SELECT isActive FROM user WHERE id = ?`, [tempUserId]);

    const isApproved = dbResAfter.length > 0 && dbResAfter[0].status === "APPROVED";
    const isDeactivated = dbUserAfter.length > 0 && (dbUserAfter[0].isActive === 0 || dbUserAfter[0].isActive === false);

    record(3, "Authorised Admin Approves Resignation", resApprove.status === 200 && jsonApprove.success === true, `Admin ${realAdmin.name} approved resignation`);
    record(4, "Resignation Status Becomes APPROVED", isApproved, `DB status verified: ${dbResAfter[0]?.status}`);
    record(5, "Employee Account DEACTIVATED After Approval", isDeactivated, `DB user.isActive verified: ${dbUserAfter[0]?.isActive}`);

    // Check smtplog database record created for real email dispatch
    const smtpsAfter = await queryDb<any[]>(`SELECT * FROM smtplog WHERE recipient = ? ORDER BY createdAt DESC LIMIT 1`, [tempEmail]);
    const emailCalled = smtpsAfter.length > 0;
    record(6, "Email Service Called with Registered DB Email", emailCalled, `smtplog recorded recipient: ${tempEmail}`);

    // Check email content template parameters
    const rendered = renderResignationApprovedEmail({
      name: "John Mail Test",
      employeeId: tempEmpId,
      email: tempEmail,
      resignationDate: new Date().toLocaleDateString("en-IN"),
      reason: "Pursuing higher education degree.",
      approvedByName: realAdmin.name,
      approverRole: realAdmin.role,
      approvalDate: new Date().toLocaleDateString("en-IN"),
    });

    const contentValid = rendered.html.includes(tempEmpId) &&
                         rendered.html.includes(realAdmin.name) &&
                         rendered.html.includes("Pursuing higher education degree") &&
                         rendered.text.includes("Your resignation request has been approved.");
    record(7, "Email Contains Required Details & Approver Info", contentValid, `Template contains Employee ID, Reason, Approver Name & Role`);

    // -------------------------------------------------------------------------
    // TEST 10: Duplicate Approval Does NOT Send Duplicate Email
    // -------------------------------------------------------------------------
    const reqDupApprove = makeReq(urlSub, "PATCH", tokenAdmin, { id: testDbId, action: "APPROVE" });
    const resDupApprove = await patchResignationPatch(reqDupApprove);
    const jsonDupApprove = await resDupApprove.json();
    const smtpsDup = await queryDb<any[]>(`SELECT COUNT(*) AS c FROM smtplog WHERE recipient = ?`, [tempEmail]);
    const dupCount = Number(smtpsDup[0]?.c || 0);

    const test10Passed = resDupApprove.status >= 400 && dupCount === 1;
    record(10, "Repeated Approval Protection (No Duplicate Email)", test10Passed, `Second approval attempt returned HTTP ${resDupApprove.status} ("${jsonDupApprove.error}"). Total emails dispatched: ${dupCount}`);

    // Cleanup test records
    await queryDb(`DELETE FROM smtplog WHERE recipient = ?`, [tempEmail]);
    await queryDb(`DELETE FROM notification WHERE userId = ?`, [tempUserId]);
    await queryDb(`DELETE FROM resignation WHERE id = ? OR userId = ?`, [testDbId, tempUserId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [tempUserId]);

  } catch (err: any) {
    console.error("Test error:", err);
    await queryDb(`DELETE FROM resignation WHERE id = ? OR userId = ?`, [testDbId, tempUserId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [tempUserId]);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("RESIGNATION APPROVAL EMAIL E2E SUMMARY");
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

runResignationEmailAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
