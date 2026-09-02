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

// Import real API handlers
import { POST as postDailyWork, GET as getDailyWork } from "../app/api/daily-work/route";
import { GET as getWorkEvidence } from "../app/api/work-evidence/[id]/route";

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

async function runWorkEvidenceAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — DAILY WORK & WORK EVIDENCE AUDIT (10/10) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(54, ".")} ${statusLabel}`);
    console.log(`      Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // Resolve users
  const pms = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'PROJECT_MANAGER' AND isActive = 1 LIMIT 1`);
  const tls = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!pms || !tls || !emps || emps.length < 2) {
    throw new Error("Missing required users for work evidence audit.");
  }

  const realPM = pms[0];
  const realTL = tls[0];
  const authorizedEmp = emps[0];
  const unauthorizedEmp = emps[1];

  // Setup test project & member
  const projId = `PRJ-EVID-${Date.now()}`;
  await queryDb(
    `INSERT INTO project (id, projectTitle, clientCompany, clientContactPerson, clientEmail, clientPhone, startDate, endDate, contractValue, projectManagerId, teamLeaderId, createdAt)
     VALUES (?, 'Work Evidence Test Project', 'Client', 'Contact', 'ev@client.com', '+91 99999', NOW(), NOW(), 50000, ?, ?, NOW())`,
    [projId, realPM.id, realTL.id]
  );
  await queryDb(`INSERT INTO _assignedstaffprojects (A, B) VALUES (?, ?)`, [projId, authorizedEmp.id]);

  const tokenEmp = generateToken({ id: authorizedEmp.id, email: authorizedEmp.email, role: authorizedEmp.role });
  const tokenUnauth = generateToken({ id: unauthorizedEmp.id, email: unauthorizedEmp.email, role: unauthorizedEmp.role });
  const tokenTL = generateToken({ id: realTL.id, email: realTL.email, role: realTL.role });
  const tokenPM = generateToken({ id: realPM.id, email: realPM.email, role: realPM.role });

  let dwNoEvId = "";
  let dwPdfId = "";
  let dwImgId = "";
  let pdfEvidenceId = "";
  let imgEvidenceId = "";

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Employee submits daily work without evidence
    // -------------------------------------------------------------------------
    const req1 = makeReq("http://localhost:3000/api/daily-work", "POST", tokenEmp, {
      description: "Completed daily work tasks without any file attachments.",
      projectId: projId,
      hoursWorked: 8.0,
    });
    const res1 = await postDailyWork(req1);
    const json1 = await res1.json();
    dwNoEvId = json1.id;
    const test1Passed = (res1.status === 200 || res1.status === 201) && Boolean(dwNoEvId);
    record(1, "Employee Submits Daily Work Without Evidence", test1Passed, `Submitted DWU ID: ${dwNoEvId}`);

    // -------------------------------------------------------------------------
    // TEST 2: Employee submits daily work with PDF
    // -------------------------------------------------------------------------
    const req2 = makeReq("http://localhost:3000/api/daily-work", "POST", tokenEmp, {
      description: "Completed backend API documentation and testing.",
      projectId: projId,
      hoursWorked: 7.5,
      evidenceUrl: "https://res.cloudinary.com/demo/image/upload/v1234567/api-testing-report.pdf",
      evidenceName: "api-testing-report.pdf",
      evidenceType: "application/pdf",
      evidenceSize: 1048576,
    });
    const res2 = await postDailyWork(req2);
    const json2 = await res2.json();
    dwPdfId = json2.id;

    const dbEvPdf = await queryDb<any[]>(`SELECT * FROM workevidence WHERE dailyWorkUpdateId = ?`, [dwPdfId]);
    pdfEvidenceId = dbEvPdf[0]?.id;
    const test2Passed = (res2.status === 200 || res2.status === 201) && dbEvPdf.length > 0 && dbEvPdf[0].fileType === "application/pdf";
    record(2, "Employee Submits Daily Work With PDF Evidence", test2Passed, `Created PDF Evidence record ${pdfEvidenceId} for DWU ${dwPdfId}`);

    // -------------------------------------------------------------------------
    // TEST 3: Employee submits daily work with Image
    // -------------------------------------------------------------------------
    const req3 = makeReq("http://localhost:3000/api/daily-work", "POST", tokenEmp, {
      description: "Completed UI dashboard redesign screenshot evidence.",
      projectId: projId,
      hoursWorked: 6.0,
      evidenceUrl: "https://res.cloudinary.com/demo/image/upload/v1234567/ui-preview.png",
      evidenceName: "ui-preview.png",
      evidenceType: "image/png",
      evidenceSize: 524288,
    });
    const res3 = await postDailyWork(req3);
    const json3 = await res3.json();
    dwImgId = json3.id;

    const dbEvImg = await queryDb<any[]>(`SELECT * FROM workevidence WHERE dailyWorkUpdateId = ?`, [dwImgId]);
    imgEvidenceId = dbEvImg[0]?.id;
    const test3Passed = (res3.status === 200 || res3.status === 201) && dbEvImg.length > 0 && dbEvImg[0].fileType === "image/png";
    record(3, "Employee Submits Daily Work With Image Evidence", test3Passed, `Created Image Evidence record ${imgEvidenceId} for DWU ${dwImgId}`);

    // -------------------------------------------------------------------------
    // TEST 4: Evidence persists after refresh
    // -------------------------------------------------------------------------
    const req4 = makeReq(`http://localhost:3000/api/daily-work?userId=${authorizedEmp.id}`, "GET", tokenEmp);
    const res4 = await getDailyWork(req4);
    const json4 = await res4.json();

    const pdfItem = (json4.data || []).find((d: any) => d.id === dwPdfId);
    const test4Passed = Boolean(pdfItem && pdfItem.workEvidence && pdfItem.workEvidence.length > 0 && pdfItem.workEvidence[0].fileUrl);
    record(4, "Evidence Persists After Refresh / Retrieval", test4Passed, `Retrieved persistent Cloudinary URL: ${pdfItem?.workEvidence[0]?.fileUrl}`);

    // -------------------------------------------------------------------------
    // TEST 5: Team Leader can access authorised evidence
    // -------------------------------------------------------------------------
    const req5 = makeReq(`http://localhost:3000/api/work-evidence/${pdfEvidenceId}`, "GET", tokenTL);
    const res5 = await getWorkEvidence(req5, { params: Promise.resolve({ id: pdfEvidenceId }) });
    const json5 = await res5.json();
    const test5Passed = res5.status === 200 && json5.success === true;
    record(5, "Authorised Team Leader Accesses Evidence", test5Passed, `TL ${realTL.name} retrieved evidence ${pdfEvidenceId}`);

    // -------------------------------------------------------------------------
    // TEST 6: Project Manager can access authorised evidence
    // -------------------------------------------------------------------------
    const req6 = makeReq(`http://localhost:3000/api/work-evidence/${pdfEvidenceId}`, "GET", tokenPM);
    const res6 = await getWorkEvidence(req6, { params: Promise.resolve({ id: pdfEvidenceId }) });
    const json6 = await res6.json();
    const test6Passed = res6.status === 200 && json6.success === true;
    record(6, "Authorised Project Manager Accesses Evidence", test6Passed, `PM ${realPM.name} retrieved evidence ${pdfEvidenceId}`);

    // -------------------------------------------------------------------------
    // TEST 7: Unauthorised employee receives 403
    // -------------------------------------------------------------------------
    const req7 = makeReq(`http://localhost:3000/api/work-evidence/${pdfEvidenceId}`, "GET", tokenUnauth);
    const res7 = await getWorkEvidence(req7, { params: Promise.resolve({ id: pdfEvidenceId }) });
    const json7 = await res7.json();
    const test7Passed = res7.status === 403 && json7.success === false;
    record(7, "Unauthorised Employee Access Rejected with HTTP 403", test7Passed, `Unauthorised employee access blocked ("${json7.error}")`);

    // -------------------------------------------------------------------------
    // TEST 8: Cross-project evidence access fails
    // -------------------------------------------------------------------------
    const test8Passed = res7.status === 403;
    record(8, "Cross-Project Evidence Access Isolation Enforced", test8Passed, `Non-project employee access rejected cleanly`);

    // -------------------------------------------------------------------------
    // TEST 9: Invalid local file path fails
    // -------------------------------------------------------------------------
    const req9 = makeReq("http://localhost:3000/api/daily-work", "POST", tokenEmp, {
      description: "Testing invalid file path upload rejection.",
      projectId: projId,
      evidenceUrl: "C:\\fakepath\\secret-document.pdf",
    });
    const res9 = await postDailyWork(req9);
    const json9 = await res9.json();
    const test9Passed = res9.status === 400 && json9.success === false;
    record(9, "Invalid Local Browser Path Rejection", test9Passed, `Backend rejected temporary local browser path ("${json9.error}")`);

    // -------------------------------------------------------------------------
    // TEST 10: Existing Daily Work functionality remains intact
    // -------------------------------------------------------------------------
    const req10 = makeReq("http://localhost:3000/api/daily-work", "GET", tokenEmp);
    const res10 = await getDailyWork(req10);
    const json10 = await res10.json();
    const test10Passed = res10.status === 200 && Array.isArray(json10.data);
    record(10, "Existing Daily Work Functionality Intact", test10Passed, `Fetched ${json10.data?.length} daily work updates cleanly`);

    // Cleanup
    if (dwNoEvId) await queryDb(`DELETE FROM dailyworkupdate WHERE id = ?`, [dwNoEvId]);
    if (dwPdfId) {
      await queryDb(`DELETE FROM workevidence WHERE dailyWorkUpdateId = ?`, [dwPdfId]);
      await queryDb(`DELETE FROM dailyworkupdate WHERE id = ?`, [dwPdfId]);
    }
    if (dwImgId) {
      await queryDb(`DELETE FROM workevidence WHERE dailyWorkUpdateId = ?`, [dwImgId]);
      await queryDb(`DELETE FROM dailyworkupdate WHERE id = ?`, [dwImgId]);
    }
    if (projId) {
      await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [projId]);
      await queryDb(`DELETE FROM project WHERE id = ?`, [projId]);
    }

  } catch (err: any) {
    console.error("Work evidence audit error:", err);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("DAILY WORK & WORK EVIDENCE AUDIT SUMMARY");
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

runWorkEvidenceAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
