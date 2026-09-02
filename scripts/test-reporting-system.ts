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
import { GET as getAdminReports } from "../app/api/admin/reports/route";

function makeReq(url: string, method: string, token: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Cookie: `oms_session=${token}`,
  };
  return new NextRequest(url, { method, headers });
}

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

async function runReportingSystemAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — REPORTING & RBAC EXPORT AUDIT (5/5) ===");
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
  const admins = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!admins || !emps || emps.length < 2) {
    throw new Error("Missing users for reporting audit.");
  }

  const realAdmin = admins[0];
  const realEmpA = emps[0];
  const realEmpB = emps[1];

  const tokenAdmin = generateToken({ id: realAdmin.id, email: realAdmin.email, role: realAdmin.role });
  const tokenEmpA = generateToken({ id: realEmpA.id, email: realEmpA.email, role: realEmpA.role });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: DB-Backed Executive Report Generation
    // -------------------------------------------------------------------------
    const req1 = makeReq("http://localhost:3000/api/admin/reports", "GET", tokenAdmin);
    const res1 = await getAdminReports(req1);
    const json1 = await res1.json();
    const test1Passed = res1.status === 200 && json1.success === true && Array.isArray(json1.reports);
    record(1, "DB-Backed Executive Report Generation", test1Passed, `Admin ${realAdmin.name} generated reports for ${json1.reports?.length} employees`);

    // -------------------------------------------------------------------------
    // TEST 2: Date Range & Status Filtering
    // -------------------------------------------------------------------------
    const req2 = makeReq(`http://localhost:3000/api/admin/reports?employeeId=${realEmpA.id}&month=August%202026`, "GET", tokenAdmin);
    const res2 = await getAdminReports(req2);
    const json2 = await res2.json();
    const test2Passed = res2.status === 200 && json2.reports?.length === 1 && json2.reports[0].employee.id === realEmpA.id;
    record(2, "Filtered Employee Report Generation", test2Passed, `Filtered report cleanly for ${realEmpA.name}`);

    // -------------------------------------------------------------------------
    // TEST 3: CSV Export Functionality
    // -------------------------------------------------------------------------
    const req3 = makeReq("http://localhost:3000/api/admin/reports?format=csv", "GET", tokenAdmin);
    const res3 = await getAdminReports(req3);
    const csvContent = await res3.text();
    const contentType = res3.headers.get("content-type") || "";
    const test3Passed = res3.status === 200 && contentType.includes("text/csv") && csvContent.includes("Employee ID,Name");
    record(3, "CSV Report Export Generation", test3Passed, `Generated text/csv attachment with ${csvContent.split("\n").length} data rows`);

    // -------------------------------------------------------------------------
    // TEST 4: Unauthorized Employee Report Access Rejection (HTTP 403)
    // -------------------------------------------------------------------------
    const req4 = makeReq(`http://localhost:3000/api/admin/reports?employeeId=${realEmpB.id}`, "GET", tokenEmpA);
    const res4 = await getAdminReports(req4);
    const json4 = await res4.json();
    const test4Passed = res4.status === 403 && json4.success === false;
    record(4, "Unauthorized Cross-Employee Report Access Blocked", test4Passed, `Employee A attempt to view Employee B report rejected with HTTP 403 ("${json4.error}")`);

    // -------------------------------------------------------------------------
    // TEST 5: Employee Authorized Self Report Access
    // -------------------------------------------------------------------------
    const req5 = makeReq(`http://localhost:3000/api/admin/reports?employeeId=${realEmpA.id}`, "GET", tokenEmpA);
    const res5 = await getAdminReports(req5);
    const json5 = await res5.json();
    const test5Passed = res5.status === 200 && json5.reports?.length === 1 && json5.reports[0].employee.id === realEmpA.id;
    record(5, "Employee Self-Report View Authorized", test5Passed, `Employee A successfully exported own report data`);

  } catch (err: any) {
    console.error("Reporting audit error:", err);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("REPORTING SYSTEM AUDIT SUMMARY");
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

runReportingSystemAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
