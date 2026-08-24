import fs from "fs";
import path from "path";

// Load .env variables
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

import { queryDb } from "../lib/db";
import { proxy } from "../proxy";
import { NextRequest } from "next/server";
import { generateToken, verifyToken } from "../lib/authService";
import bcrypt from "bcryptjs";

function makeReq(urlStr: string, cookieToken?: string, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookieToken) {
    headers["cookie"] = `oms_session=${cookieToken}`;
  }
  if (authHeader) {
    headers["authorization"] = authHeader;
  }
  return new NextRequest(new URL(urlStr, "http://localhost:3000"), {
    headers,
  });
}

async function runCompleteFinalQA() {
  console.log("==================================================================");
  console.log("  OMS COMPLETE FINAL QA, SECURITY, AND RBAC AUDIT");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? " -> " + detail : ""}`);
      failed++;
    }
  }

  // ==========================================
  // [1] DATABASE CONNECTION & USER AUDIT
  // ==========================================
  console.log("[1] Database Connection & Real User Accounts Audit:");
  const users: any[] = await queryDb(
    `SELECT id, name, email, employeeId, role, isActive, isResigned, password FROM user`
  );
  assert(users && users.length > 0, `Database online and returned ${users.length} registered personnel`);

  const adminUser = users.find((u) => u.role === "SUPER_ADMIN" || u.role === "ADMIN");
  const hrUser = users.find((u) => u.role === "HR" || u.role === "ADMIN_HR");
  const pmUser = users.find((u) => u.role === "PROJECT_MANAGER");
  const tlUser = users.find((u) => u.role === "TEAM_LEADER");
  const empUser = users.find((u) => u.role === "DEVELOPER" || u.role === "EMPLOYEE" || u.role === "UI_UX_DESIGNER");

  assert(!!adminUser, `Found active Admin account: ${adminUser?.name} (${adminUser?.employeeId})`);
  assert(!!hrUser, `Found active HR account: ${hrUser?.name} (${hrUser?.employeeId})`);
  assert(!!pmUser, `Found active Project Manager account: ${pmUser?.name} (${pmUser?.employeeId})`);
  assert(!!tlUser, `Found active Team Leader account: ${tlUser?.name} (${tlUser?.employeeId})`);
  assert(!!empUser, `Found active Employee account: ${empUser?.name} (${empUser?.employeeId})`);

  // ==========================================
  // [2] REAL CREDENTIALS BCRYPT VALIDATION
  // ==========================================
  console.log("\n[2] Password Hash & Bcrypt Authentication Validation:");
  if (adminUser) {
    const adminPassMatch = await bcrypt.compare("Roushan@123", adminUser.password);
    assert(adminPassMatch, `Admin password matches bcrypt hash for ${adminUser.name}`);
  }
  if (hrUser) {
    const hrPassMatch = await bcrypt.compare("Roushan@123", hrUser.password);
    assert(hrPassMatch, `HR password matches bcrypt hash for ${hrUser.name}`);
  }
  if (empUser) {
    const empPassMatch = await bcrypt.compare("Roushan@123", empUser.password);
    assert(empPassMatch, `Employee password matches bcrypt hash for ${empUser.name}`);
  }

  // ==========================================
  // [3] PROXY & ENTRYPOINT GATEKEEPER
  // ==========================================
  console.log("\n[3] Entrypoint & Unauthenticated Redirection Verification:");

  const resRoot = await proxy(makeReq("http://localhost:3000/"));
  assert(
    resRoot.headers.get("location")?.includes("/login"),
    "Unauthenticated visitor to root '/' is redirected to /login"
  );

  const resAdminUnauth = await proxy(makeReq("http://localhost:3000/admin"));
  assert(
    resAdminUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated visitor to '/admin' is redirected to /login"
  );

  const resHrUnauth = await proxy(makeReq("http://localhost:3000/hr"));
  assert(
    resHrUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated visitor to '/hr' is redirected to /login"
  );

  const resEmpUnauth = await proxy(makeReq("http://localhost:3000/employee"));
  assert(
    resEmpUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated visitor to '/employee' is redirected to /login"
  );

  const resApiUnauth = await proxy(makeReq("http://localhost:3000/api/admin/employees"));
  assert(
    resApiUnauth.status === 401,
    "Unauthenticated request to protected API returns 401 Unauthorized"
  );

  // ==========================================
  // [4] AUTHENTICATED ROLE ROUTING & RBAC
  // ==========================================
  console.log("\n[4] Authenticated Role Routing & Strict RBAC Enforcement:");

  const adminToken = generateToken({ id: adminUser?.id || "admin-1", email: adminUser?.email || "admin@oms.com", role: "SUPER_ADMIN" });
  const hrToken = generateToken({ id: hrUser?.id || "hr-1", email: hrUser?.email || "hr@oms.com", role: "HR" });
  const pmToken = generateToken({ id: pmUser?.id || "pm-1", email: pmUser?.email || "pm@oms.com", role: "PROJECT_MANAGER" });
  const tlToken = generateToken({ id: tlUser?.id || "tl-1", email: tlUser?.email || "tl@oms.com", role: "TEAM_LEADER" });
  const empToken = generateToken({ id: empUser?.id || "emp-1", email: empUser?.email || "emp@oms.com", role: "DEVELOPER" });

  const resAdminOnRoot = await proxy(makeReq("http://localhost:3000/", adminToken));
  assert(
    resAdminOnRoot.headers.get("location")?.includes("/admin/dashboard"),
    "Authenticated Admin on root '/' routed to /admin/dashboard"
  );

  const resHrOnRoot = await proxy(makeReq("http://localhost:3000/", hrToken));
  assert(
    resHrOnRoot.headers.get("location")?.includes("/hr"),
    "Authenticated HR on root '/' routed to /hr"
  );

  const resPmOnRoot = await proxy(makeReq("http://localhost:3000/", pmToken));
  assert(
    resPmOnRoot.headers.get("location")?.includes("/project-manager"),
    "Authenticated Project Manager on root '/' routed to /project-manager"
  );

  const resTlOnRoot = await proxy(makeReq("http://localhost:3000/", tlToken));
  assert(
    resTlOnRoot.headers.get("location")?.includes("/team-leader"),
    "Authenticated Team Leader on root '/' routed to /team-leader"
  );

  const resEmpOnRoot = await proxy(makeReq("http://localhost:3000/", empToken));
  assert(
    resEmpOnRoot.headers.get("location")?.includes("/employee/dashboard"),
    "Authenticated Employee on root '/' routed to /employee/dashboard"
  );

  // RBAC Cross-Role Protection:
  const resEmpToAdmin = await proxy(makeReq("http://localhost:3000/admin/organisation", empToken));
  assert(
    resEmpToAdmin.headers.get("location")?.includes("/employee/dashboard"),
    "Employee blocked from '/admin/organisation' and redirected to own dashboard"
  );

  const resEmpToHr = await proxy(makeReq("http://localhost:3000/hr/payroll", empToken));
  assert(
    resEmpToHr.headers.get("location")?.includes("/employee/dashboard"),
    "Employee blocked from '/hr/payroll' and redirected to own dashboard"
  );

  const resEmpToAdminApi = await proxy(makeReq("http://localhost:3000/api/admin/employees", empToken));
  assert(
    resEmpToAdminApi.status === 403,
    "Employee calling '/api/admin/employees' receives 403 Forbidden"
  );

  // ==========================================
  // [5] DATA INTEGRITY & CACHE DEFENSE
  // ==========================================
  console.log("\n[5] Session Integrity & Cache Security:");
  const resCache = await proxy(makeReq("http://localhost:3000/admin/dashboard", adminToken));
  assert(
    resCache.headers.get("Cache-Control")?.includes("no-store"),
    "Protected pages set 'Cache-Control: no-store' preventing back-button data leaks"
  );

  const decodedAdmin = verifyToken(adminToken);
  assert(decodedAdmin && decodedAdmin.id === (adminUser?.id || "admin-1"), "Session token decodes and verifies accurately");

  console.log("\n==================================================================");
  console.log(`  FINAL QA SUMMARY: ${passed + failed} CHECKS | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCompleteFinalQA().catch((err) => {
  console.error("QA script failed with error:", err);
  process.exit(1);
});
