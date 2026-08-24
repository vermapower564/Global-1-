import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { generateToken } from "../lib/authService";

function makeRequest(urlStr: string, cookieToken?: string, authHeader?: string): NextRequest {
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

async function runAuthTests() {
  console.log("==================================================================");
  console.log("  OMS ENTERPRISE AUTHENTICATION & MIDDLEWARE SECURITY AUDIT");
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

  // --- Tokens for different roles ---
  const adminToken = generateToken({ id: "adm-1", email: "admin@global.com", role: "SUPER_ADMIN" });
  const hrToken = generateToken({ id: "hr-1", email: "hr@global.com", role: "HR" });
  const pmToken = generateToken({ id: "pm-1", email: "pm@global.com", role: "PROJECT_MANAGER" });
  const tlToken = generateToken({ id: "tl-1", email: "tl@global.com", role: "TEAM_LEADER" });
  const empToken = generateToken({ id: "emp-1", email: "emp@global.com", role: "DEVELOPER" });

  console.log("[1] Unauthenticated Access Tests (New/Incognito Browser):");

  // 1. Root '/' unauthenticated -> /login
  const resRoot = await proxy(makeRequest("http://localhost:3000/"));
  assert(
    resRoot.status === 307 || resRoot.status === 308 || resRoot.headers.get("location")?.includes("/login"),
    "Unauthenticated root '/' redirects to /login",
    `Status: ${resRoot.status}, Location: ${resRoot.headers.get("location")}`
  );

  // 2. '/admin' unauthenticated -> /login
  const resAdminUnauth = await proxy(makeRequest("http://localhost:3000/admin"));
  assert(
    resAdminUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated '/admin' redirects to /login"
  );

  // 3. '/employee' unauthenticated -> /login
  const resEmpUnauth = await proxy(makeRequest("http://localhost:3000/employee"));
  assert(
    resEmpUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated '/employee' redirects to /login"
  );

  // 4. '/project-manager' unauthenticated -> /login
  const resPmUnauth = await proxy(makeRequest("http://localhost:3000/project-manager"));
  assert(
    resPmUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated '/project-manager' redirects to /login"
  );

  // 5. '/team-leader' unauthenticated -> /login
  const resTlUnauth = await proxy(makeRequest("http://localhost:3000/team-leader"));
  assert(
    resTlUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated '/team-leader' redirects to /login"
  );

  // 6. '/hr' unauthenticated -> /login
  const resHrUnauth = await proxy(makeRequest("http://localhost:3000/hr"));
  assert(
    resHrUnauth.headers.get("location")?.includes("/login"),
    "Unauthenticated '/hr' redirects to /login"
  );

  // 7. Protected API unauthenticated -> 401 JSON
  const resApiUnauth = await proxy(makeRequest("http://localhost:3000/api/admin/organisation"));
  assert(
    resApiUnauth.status === 401,
    "Unauthenticated API '/api/admin/organisation' returns 401 Unauthorized",
    `Status: ${resApiUnauth.status}`
  );

  console.log("\n[2] Authenticated Root Access & Role-Based Entry Point Tests:");

  // 8. Super Admin on '/' -> /admin/dashboard
  const resAdminRoot = await proxy(makeRequest("http://localhost:3000/", adminToken));
  assert(
    resAdminRoot.headers.get("location")?.includes("/admin/dashboard"),
    "Authenticated Admin on root '/' redirects to /admin/dashboard"
  );

  // 9. HR on '/' -> /hr
  const resHrRoot = await proxy(makeRequest("http://localhost:3000/", hrToken));
  assert(
    resHrRoot.headers.get("location")?.includes("/hr"),
    "Authenticated HR on root '/' redirects to /hr"
  );

  // 10. Project Manager on '/' -> /project-manager
  const resPmRoot = await proxy(makeRequest("http://localhost:3000/", pmToken));
  assert(
    resPmRoot.headers.get("location")?.includes("/project-manager"),
    "Authenticated Project Manager on root '/' redirects to /project-manager"
  );

  // 11. Team Leader on '/' -> /team-leader
  const resTlRoot = await proxy(makeRequest("http://localhost:3000/", tlToken));
  assert(
    resTlRoot.headers.get("location")?.includes("/team-leader"),
    "Authenticated Team Leader on root '/' redirects to /team-leader"
  );

  // 12. Employee on '/' -> /employee/dashboard
  const resEmpRoot = await proxy(makeRequest("http://localhost:3000/", empToken));
  assert(
    resEmpRoot.headers.get("location")?.includes("/employee/dashboard"),
    "Authenticated Employee on root '/' redirects to /employee/dashboard"
  );

  console.log("\n[3] Authenticated Allowed Routes & RBAC Enforcement Tests:");

  // 13. Super Admin on '/admin' -> Allowed
  const resAdminAllow = await proxy(makeRequest("http://localhost:3000/admin", adminToken));
  assert(
    resAdminAllow.status === 200 || !resAdminAllow.headers.get("location"),
    "Authenticated Admin on '/admin' allowed through"
  );

  // 14. HR on '/hr' -> Allowed
  const resHrAllow = await proxy(makeRequest("http://localhost:3000/hr", hrToken));
  assert(
    resHrAllow.status === 200 || !resHrAllow.headers.get("location"),
    "Authenticated HR on '/hr' allowed through"
  );

  // 15. Employee on '/admin' -> Blocked & redirected to employee dashboard
  const resEmpOnAdmin = await proxy(makeRequest("http://localhost:3000/admin/employees", empToken));
  assert(
    resEmpOnAdmin.headers.get("location")?.includes("/employee/dashboard"),
    "Authenticated Employee on '/admin/employees' blocked & redirected to /employee/dashboard",
    `Location: ${resEmpOnAdmin.headers.get("location")}`
  );

  // 16. Employee on '/hr' -> Blocked & redirected to employee dashboard
  const resEmpOnHr = await proxy(makeRequest("http://localhost:3000/hr/payroll", empToken));
  assert(
    resEmpOnHr.headers.get("location")?.includes("/employee/dashboard"),
    "Authenticated Employee on '/hr/payroll' blocked & redirected to /employee/dashboard"
  );

  // 17. Employee on '/api/admin/employees' -> Returns 403 Forbidden
  const resEmpApiAdmin = await proxy(makeRequest("http://localhost:3000/api/admin/employees", empToken));
  assert(
    resEmpApiAdmin.status === 403,
    "Authenticated Employee on '/api/admin/employees' returns 403 Forbidden"
  );

  // 18. Authenticated user visiting '/login' -> Redirected to home dashboard
  const resAdminOnLogin = await proxy(makeRequest("http://localhost:3000/login", adminToken));
  assert(
    resAdminOnLogin.headers.get("location")?.includes("/admin/dashboard"),
    "Authenticated Admin on '/login' redirected to /admin/dashboard"
  );

  console.log("\n[4] Session Independent & Cache Security Tests:");

  // 19. Cache-Control headers on protected pages
  const resCacheCheck = await proxy(makeRequest("http://localhost:3000/employee/dashboard", empToken));
  assert(
    resCacheCheck.headers.get("Cache-Control")?.includes("no-store"),
    "Protected pages set Cache-Control: no-store to prevent post-logout back-button leak"
  );

  // 20. Public assets pass through without auth
  const resPublicAsset = await proxy(makeRequest("http://localhost:3000/favicon.ico"));
  assert(
    resPublicAsset.status === 200 || !resPublicAsset.headers.get("location"),
    "Public assets (/favicon.ico) allowed through without authentication"
  );

  console.log("\n==================================================================");
  console.log(`  TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests();
