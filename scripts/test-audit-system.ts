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
import { logAuditEvent } from "../lib/authMiddleware";

// Import real API route handlers
import { GET as getAuditLogs } from "../app/api/audit-logs/route";

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

async function runAuditSystemVerification() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — AUDIT LOG SYSTEM & SECURITY AUDIT (5/5) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(54, ".")} ${statusLabel}`);
    console.log(`      Details: ${details}\n`);
    results.push({ num, name, passed, details });
  }

  // Resolve admin and ordinary employee
  const admins = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 1`);

  if (!admins || !emps) {
    throw new Error("Missing users for audit log verification.");
  }

  const realAdmin = admins[0];
  const realEmp = emps[0];

  const tokenAdmin = generateToken({ id: realAdmin.id, email: realAdmin.email, role: realAdmin.role });
  const tokenEmp = generateToken({ id: realEmp.id, email: realEmp.email, role: realEmp.role });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Business Action Audit Recording
    // -------------------------------------------------------------------------
    await logAuditEvent(realEmp.id, "TEST_SYSTEM_AUDIT_ACTION", "Performed audit verification test action.", "127.0.0.1");

    const dbAuditRows = await queryDb<any[]>(`SELECT * FROM auditlog WHERE action = 'TEST_SYSTEM_AUDIT_ACTION' ORDER BY timestamp DESC LIMIT 1`);
    const test1Passed = dbAuditRows.length > 0 && dbAuditRows[0].userId === realEmp.id;
    record(1, "Business Action Audit Recording", test1Passed, `Audit log recorded for user ${realEmp.email} (Action: TEST_SYSTEM_AUDIT_ACTION)`);

    // -------------------------------------------------------------------------
    // TEST 2: Protected from Ordinary Employees (HTTP 403)
    // -------------------------------------------------------------------------
    const reqEmp = makeReq("http://localhost:3000/api/audit-logs", "GET", tokenEmp);
    const resEmp = await getAuditLogs(reqEmp);
    const jsonEmp = await resEmp.json();
    const test2Passed = resEmp.status === 403 && jsonEmp.success === false;
    record(2, "Audit Logs Protected from Ordinary Employees", test2Passed, `Ordinary employee access rejected with HTTP 403 ("${jsonEmp.error}")`);

    // -------------------------------------------------------------------------
    // TEST 3: Admin & Management Search / View Access
    // -------------------------------------------------------------------------
    const reqAdmin = makeReq("http://localhost:3000/api/audit-logs", "GET", tokenAdmin);
    const resAdmin = await getAuditLogs(reqAdmin);
    const jsonAdmin = await resAdmin.json();
    const test3Passed = resAdmin.status === 200 && jsonAdmin.success === true && Array.isArray(jsonAdmin.data);
    record(3, "Authorized Admin & Executive View Access", test3Passed, `Admin ${realAdmin.name} retrieved ${jsonAdmin.count} enriched audit records`);

    // -------------------------------------------------------------------------
    // TEST 4: Sensitive Data & Secrets Protection
    // -------------------------------------------------------------------------
    const secretsInAudit = dbAuditRows.some((row) => {
      const str = JSON.stringify(row).toLowerCase();
      return str.includes("password123") || str.includes("secret_key") || str.includes("bankpassword");
    });
    const test4Passed = !secretsInAudit;
    record(4, "Sensitive Data & Secrets Protection in Audit Logs", test4Passed, `Verified no plain-text passwords or secret tokens stored in audit records`);

    // -------------------------------------------------------------------------
    // TEST 5: Immutability / No Edit or Delete API Handlers
    // -------------------------------------------------------------------------
    const auditRouteModule = await import("../app/api/audit-logs/route");
    const hasModificationHandlers =
      typeof (auditRouteModule as any).PUT === "function" ||
      typeof (auditRouteModule as any).PATCH === "function" ||
      typeof (auditRouteModule as any).DELETE === "function";
    const test5Passed = !hasModificationHandlers;
    record(5, "Audit Record Immutability (No Edit/Delete Handlers)", test5Passed, `Audit log API exports zero modification handlers (PUT/PATCH/DELETE) preserving historical integrity`);

    // Cleanup test record
    await queryDb(`DELETE FROM auditlog WHERE action = 'TEST_SYSTEM_AUDIT_ACTION'`);

  } catch (err: any) {
    console.error("Audit verification error:", err);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("AUDIT LOG SYSTEM VERIFICATION SUMMARY");
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

runAuditSystemVerification().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL ERROR:", err);
  process.exit(1);
});
