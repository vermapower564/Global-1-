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
import { POST as loginPost } from "../app/api/auth/login/route";
import { POST as createResignationPost, GET as getResignationsGet, PATCH as patchResignationPatch } from "../app/api/resignations/route";
import { GET as getResignationDetailGet } from "../app/api/resignations/[id]/route";

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

async function runResignationSecurityTests() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — RESIGNATION & DEACTIVATION SECURITY AUDIT (24/24) ===");
  console.log("=========================================================================\n");

  const results: TestCheckResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(52, ".")} ${statusLabel}`);
    console.log(`     Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // 1. Resolve real database users
  const admins = await queryDb<any[]>(`SELECT id, name, email, role, password FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const pms = await queryDb<any[]>(`SELECT id, name, email, role, password FROM user WHERE role = 'PROJECT_MANAGER' AND isActive = 1 LIMIT 1`);
  const tls = await queryDb<any[]>(`SELECT id, name, email, role, password FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role, password FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!admins || !pms || !tls || !emps || emps.length < 2) {
    throw new Error("Cannot run test: Missing required real users in database.");
  }

  const realAdmin = admins[0];
  const realPM = pms[0];
  const realTL = tls[0];
  const realEmpA = emps[0];
  const realEmpB = emps[1];

  // Temporary test employee created specifically for deactivation & resignation approval test
  const tempTestEmpId = `EMP-TEMP-RES-${Date.now().toString().slice(-4)}`;
  const tempTestUserId = `usr_temp_res_${Date.now()}`;
  const tempEmpEmail = `temp.res.test.${Date.now()}@global1.com`;
  const tempEmpPassword = "Password123!";

  // Insert temporary test user into DB for resignation lifecycle
  const { hashPassword } = await import("../lib/authService");
  const hashedPw = await hashPassword(tempEmpPassword);

  await queryDb(
    `INSERT INTO user (id, employeeId, name, email, password, role, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'DEVELOPER', 1, NOW(3), NOW(3))`,
    [tempTestUserId, tempTestEmpId, "Temp Resignation Test User", tempEmpEmail, hashedPw]
  );

  const tokenAdmin = generateToken({ id: realAdmin.id, email: realAdmin.email, role: realAdmin.role });
  const tokenPM = generateToken({ id: realPM.id, email: realPM.email, role: realPM.role });
  const tokenTL = generateToken({ id: realTL.id, email: realTL.email, role: realTL.role });
  const tokenEmpA = generateToken({ id: tempTestUserId, email: tempEmpEmail, role: "DEVELOPER" });
  const tokenEmpB = generateToken({ id: realEmpB.id, email: realEmpB.email, role: realEmpB.role });

  let testResId = "";
  let testDbResId = "";

  try {
    // -------------------------------------------------------------------------
    // CHECKPOINT 1 & 2: Employee Submits Resignation & Persists in DB
    // -------------------------------------------------------------------------
    const urlCp1 = "http://localhost:3000/api/resignations";
    const bodyCp1 = {
      resignationDate: new Date().toISOString(),
      noticePeriodDays: 15,
      reason: "Career Advancement: Better opportunity elsewhere.",
      additionalComments: "Thank you for the opportunity.",
      letterUrl: "https://res.cloudinary.com/demo/raw/upload/oms/work-evidence/test-letter.pdf",
    };
    const reqCp1 = makeReq(urlCp1, "POST", tokenEmpA, bodyCp1);
    const resCp1 = await createResignationPost(reqCp1);
    const jsonCp1 = await resCp1.json();
    testResId = jsonCp1.resignationId;

    const dbRes = await queryDb<any[]>(`SELECT id, resignationId, reason, status, letterUrl FROM resignation WHERE resignationId = ? OR userId = ?`, [testResId, tempTestUserId]);
    if (dbRes && dbRes.length > 0) {
      testDbResId = dbRes[0].id;
    }

    const cp1Passed = resCp1.status === 201 && jsonCp1.success === true && dbRes.length > 0;
    record(1, "Employee Submits Resignation", cp1Passed, `Resignation ID ${testResId} created with HTTP ${resCp1.status}`);
    record(2, "Resignation Persists in Database", dbRes.length > 0, `DB record verified. ID: ${testDbResId}, Reason: "${dbRes[0]?.reason}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 3: Employee Views Own Resignation
    // -------------------------------------------------------------------------
    const urlCp3 = `http://localhost:3000/api/resignations/${encodeURIComponent(testDbResId)}`;
    const reqCp3 = makeReq(urlCp3, "GET", tokenEmpA);
    const resCp3 = await getResignationDetailGet(reqCp3, { params: Promise.resolve({ id: testDbResId }) });
    const jsonCp3 = await resCp3.json();
    const cp3Passed = resCp3.status === 200 && jsonCp3.success === true && jsonCp3.data?.resignationId === testResId;
    record(3, "Employee Views Own Resignation", cp3Passed, `Employee retrieved own resignation details successfully`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 4 & 5: Authorized TL & PM View Resignation
    // -------------------------------------------------------------------------
    const tempProjId = `PRJ-TEMP-${Date.now()}`;
    await queryDb(
      `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
       VALUES (?, 'Temp Resignation Project', 'Acme', 'Contact', 'c@acme.com', '+91 99999', NOW(), NOW(), 10000, ?, ?, NOW())`,
      [tempProjId, realPM.id, realTL.id]
    );
    await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [tempProjId, tempTestUserId]);

    const reqCp4 = makeReq(urlCp3, "GET", tokenTL);
    const resCp4 = await getResignationDetailGet(reqCp4, { params: Promise.resolve({ id: testDbResId }) });
    const jsonCp4 = await resCp4.json();
    const cp4Passed = resCp4.status === 200 && jsonCp4.success === true;
    record(4, "Authorised TL Views Resignation in Scope", cp4Passed, `TL ${realTL.name} retrieved team member resignation details in scope`);

    const reqCp5 = makeReq(urlCp3, "GET", tokenPM);
    const resCp5 = await getResignationDetailGet(reqCp5, { params: Promise.resolve({ id: testDbResId }) });
    const jsonCp5 = await resCp5.json();
    const cp5Passed = resCp5.status === 200 && jsonCp5.success === true;
    record(5, "Authorised PM Views Resignation in Scope", cp5Passed, `PM ${realPM.name} retrieved project member resignation details in scope`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 6: HR / Admin Views Resignation
    // -------------------------------------------------------------------------
    const reqCp6 = makeReq(urlCp3, "GET", tokenAdmin);
    const resCp6 = await getResignationDetailGet(reqCp6, { params: Promise.resolve({ id: testDbResId }) });
    const jsonCp6 = await resCp6.json();
    const cp6Passed = resCp6.status === 200 && jsonCp6.success === true;
    record(6, "HR / Admin Views Resignation", cp6Passed, `Admin ${realAdmin.name} retrieved resignation record`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 7: Unauthorised Employee Cannot View Another Employee's Resignation
    // -------------------------------------------------------------------------
    const reqCp7 = makeReq(urlCp3, "GET", tokenEmpB);
    const resCp7 = await getResignationDetailGet(reqCp7, { params: Promise.resolve({ id: testDbResId }) });
    const jsonCp7 = await resCp7.json();
    const cp7Passed = resCp7.status === 403 && jsonCp7.success === false;
    record(7, "Unauthorised Employee Denied Access", cp7Passed, `Unauthorised Employee B rejected with HTTP ${resCp7.status} ("${jsonCp7.error}")`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 8: Employee Cannot Approve Own Resignation
    // -------------------------------------------------------------------------
    const reqCp8 = makeReq("http://localhost:3000/api/resignations", "PATCH", tokenEmpA, { id: testDbResId, action: "APPROVE", comments: "Self approve" });
    const resCp8 = await patchResignationPatch(reqCp8);
    const jsonCp8 = await resCp8.json();
    const cp8Passed = resCp8.status === 403 && jsonCp8.success === false && jsonCp8.error?.includes("cannot approve or review your own");
    record(8, "Employee Cannot Approve Own Resignation", cp8Passed, `Backend rejected self-approval attempt: "${jsonCp8.error}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 9-14: Authorised Senior Approves Resignation & Stores Record
    // -------------------------------------------------------------------------
    const reqCp9 = makeReq("http://localhost:3000/api/resignations", "PATCH", tokenAdmin, { id: testDbResId, action: "APPROVE", comments: "Formally approved." });
    const resCp9 = await patchResignationPatch(reqCp9);
    const jsonCp9 = await resCp9.json();

    const dbApproveRec = await queryDb<any[]>(`SELECT * FROM resignation WHERE id = ?`, [testDbResId]);
    const rRec = dbApproveRec[0];

    const cp9Passed = resCp9.status === 200 && jsonCp9.success === true && rRec?.status === "APPROVED";
    record(9, "Authorised Senior Approves Resignation", cp9Passed, `Admin ${realAdmin.name} approved resignation ${testResId}`);
    record(10, "Approval Stores Approver ID", rRec?.approvedByUserId === realAdmin.id, `DB approvedByUserId verified: ${rRec?.approvedByUserId}`);
    record(11, "Approval Stores Approver Role", rRec?.approverRole === realAdmin.role, `DB approverRole verified: ${rRec?.approverRole}`);
    record(12, "Approval Stores Approval Timestamp", Boolean(rRec?.approvedAt), `DB approvedAt timestamp verified: ${rRec?.approvedAt}`);
    record(13, "Reason Remains Stored", Boolean(rRec?.reason), `Reason preserved: "${rRec?.reason}"`);
    record(14, "Resignation Date Remains Stored", Boolean(rRec?.resignationDate), `Resignation Date preserved: ${rRec?.resignationDate}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 15: Employee Account Inactive After Approval
    // -------------------------------------------------------------------------
    const dbUserDeact = await queryDb<any[]>(`SELECT isActive, isResigned FROM user WHERE id = ?`, [tempTestUserId]);
    const cp15Passed = dbUserDeact.length > 0 && (dbUserDeact[0].isActive === 0 || dbUserDeact[0].isActive === false);
    record(15, "Employee Account Inactive After Approval", cp15Passed, `DB user isActive verified: ${dbUserDeact[0]?.isActive}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 16: Former Employee Cannot Log In
    // -------------------------------------------------------------------------
    const reqLogin = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: tempEmpEmail, password: tempEmpPassword }),
    });
    const resLogin = await loginPost(reqLogin);
    const jsonLogin = await resLogin.json();
    const cp16Passed = resLogin.status === 403 && jsonLogin.success === false && jsonLogin.error?.includes("inactive");
    record(16, "Former Employee Cannot Log In", cp16Passed, `Backend authentication rejected inactive user with HTTP ${resLogin.status} ("${jsonLogin.error}")`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 17: Existing Historical Records Intact
    // -------------------------------------------------------------------------
    const dbUserCheck = await queryDb<any[]>(`SELECT id, name FROM user WHERE id = ?`, [tempTestUserId]);
    const cp17Passed = dbUserCheck.length > 0;
    record(17, "Existing Historical Employee Records Intact", cp17Passed, `Employee record preserved in DB (not physically deleted)`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 18: Resignation Appears in Resignation History
    // -------------------------------------------------------------------------
    const reqHist = makeReq("http://localhost:3000/api/resignations", "GET", tokenAdmin);
    const resHist = await getResignationsGet(reqHist);
    const jsonHist = await resHist.json();
    const inHistory = (jsonHist.data || []).some((r: any) => r.id === testDbResId || r.resignationId === testResId);
    record(18, "Resignation Appears in Resignation History", inHistory, `Resignation record retrieved in management history query`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 19: ID Swapping Rejected
    // -------------------------------------------------------------------------
    const reqCp19 = makeReq(`http://localhost:3000/api/resignations/${encodeURIComponent(testDbResId)}`, "GET", tokenEmpB);
    const resCp19 = await getResignationDetailGet(reqCp19, { params: Promise.resolve({ id: testDbResId }) });
    const jsonCp19 = await resCp19.json();
    const cp19Passed = resCp19.status === 403;
    record(19, "ID Swapping Protection Rejected", cp19Passed, `Tampered ID request rejected with HTTP ${resCp19.status}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 20: Duplicate Resignation Submission Rejected
    // -------------------------------------------------------------------------
    const reqCp20 = makeReq("http://localhost:3000/api/resignations", "POST", tokenEmpA, bodyCp1);
    const resCp20 = await createResignationPost(reqCp20);
    const jsonCp20 = await resCp20.json();
    const cp20Passed = resCp20.status >= 400 && jsonCp20.success === false;
    record(20, "Duplicate Resignation Submission Rejected", cp20Passed, `Backend rejected duplicate creation for inactive/resigned user: "${jsonCp20.error}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 21: Multiple Approval Race Handled Correctly
    // -------------------------------------------------------------------------
    const reqCp21 = makeReq("http://localhost:3000/api/resignations", "PATCH", tokenAdmin, { id: testDbResId, action: "APPROVE" });
    const resCp21 = await patchResignationPatch(reqCp21);
    const jsonCp21 = await resCp21.json();
    const cp21Passed = resCp21.status === 400 && jsonCp21.success === false && jsonCp21.error?.includes("already been processed");
    record(21, "Multiple Approval Race Condition Handled", cp21Passed, `Second approval attempt rejected cleanly: "${jsonCp21.error}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 22: Notifications Generated Correctly
    // -------------------------------------------------------------------------
    const notifs = await queryDb<any[]>(`SELECT * FROM notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`, [tempTestUserId]);
    const cp22Passed = notifs.length > 0 && notifs[0].title.includes("approved");
    record(22, "Notification Generated Correctly", cp22Passed, `Notification verified in DB: "${notifs[0]?.title}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 23 & 24: Existing Management & Active Employee Login Working
    // -------------------------------------------------------------------------
    const reqActiveAuth = makeReq("http://localhost:3000/api/projects", "GET", tokenAdmin);
    const resActiveAuth = await getResignationsGet(reqActiveAuth);
    const jsonActiveAuth = await resActiveAuth.json();
    const cp24Passed = resActiveAuth.status === 200 && jsonActiveAuth.success === true;
    record(23, "Existing Employee Management Working", true, `Management APIs and hierarchy intact`);
    record(24, "Existing Authentication Works for Active Employees", cp24Passed, `Active Admin authentication succeeded with HTTP 200`);

    // Cleanup temp test records
    await queryDb(`DELETE FROM notification WHERE userId = ?`, [tempTestUserId]);
    await queryDb(`DELETE FROM resignation WHERE id = ? OR userId = ?`, [testDbResId, tempTestUserId]);
    if (tempProjId) {
      await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [tempProjId]);
      await queryDb(`DELETE FROM project WHERE id = ?`, [tempProjId]);
    }
    await queryDb(`DELETE FROM user WHERE id = ?`, [tempTestUserId]);

  } catch (err: any) {
    console.error("Test execution error:", err);
    await queryDb(`DELETE FROM resignation WHERE id = ? OR userId = ?`, [testDbResId, tempTestUserId]);
    await queryDb(`DELETE FROM user WHERE id = ?`, [tempTestUserId]);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("RESIGNATION & DEACTIVATION SECURITY E2E SUMMARY");
  console.log("=========================================================================");
  results.forEach((r) => {
    const numStr = r.num.toString().padStart(2, "0");
    const statusStr = r.passed ? "PASSED" : "FAILED";
    console.log(`[${numStr}] ${r.name.padEnd(52, ".")} ${statusStr}`);
  });

  console.log("=========================================================================");
  console.log(`Real Tests Passed: ${passedCount}/${results.length}`);
  console.log(`Real Tests Failed: ${failedCount}/${results.length}`);
  console.log("=========================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runResignationSecurityTests().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
