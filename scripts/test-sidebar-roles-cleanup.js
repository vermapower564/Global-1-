const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testRolesAndNavigationCleanup() {
  console.log("==================================================================");
  console.log("  TESTING COMPLETE OMS SIDEBAR & ROLE-BASED NAVIGATION CLEANUP");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✓ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${label}`);
      failed++;
    }
  }

  // 1. Super Admin Role Verification
  console.log("[1] Testing Super Admin Navigation & Auth:");
  const superAdminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  assert(superAdminLogin.data.success, "Super Admin login succeeds");
  assert(superAdminLogin.data.redirectTo === "/admin/dashboard", "Super Admin redirects to /admin/dashboard");
  const superAdminCookie = superAdminLogin.headers["set-cookie"][0].split(";")[0];

  const superAdminOrgRes = await axios.get(`${BASE_URL}/api/admin/organisation`, {
    headers: { Cookie: superAdminCookie },
  });
  assert(superAdminOrgRes.status === 200, "Super Admin can access Organisation data");

  // 2. Project Manager Role Verification
  console.log("\n[2] Testing Project Manager Navigation & Auth:");
  const pmLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  assert(pmLogin.data.success, "Project Manager login succeeds");
  assert(pmLogin.data.redirectTo === "/project-manager", "PM redirects to /project-manager");
  const pmCookie = pmLogin.headers["set-cookie"][0].split(";")[0];

  const pmProjectsRes = await axios.get(`${BASE_URL}/api/projects`, {
    headers: { Cookie: pmCookie },
  });
  assert(pmProjectsRes.status === 200, "PM can access Projects API");

  // 3. Team Leader Role Verification
  console.log("\n[3] Testing Team Leader Navigation & Auth:");
  const tlLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  assert(tlLogin.data.success, "Team Leader login succeeds");
  assert(tlLogin.data.redirectTo === "/team-leader", "TL redirects to /team-leader");
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];

  const tlSummaryRes = await axios.get(`${BASE_URL}/api/team-leader/summary`, {
    headers: { Cookie: tlCookie },
  });
  assert(tlSummaryRes.status === 200 && tlSummaryRes.data.isTeamLeader, "TL summary verifies leadership status");

  // 4. Employee Role Verification & RBAC Boundary
  console.log("\n[4] Testing Employee Navigation & RBAC Boundary:");
  const empLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  assert(empLogin.data.success, "Employee login succeeds");
  assert(empLogin.data.redirectTo === "/employee/dashboard", "Employee redirects to /employee/dashboard");
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];

  // Verify Employee CANNOT access Admin Organisation API
  try {
    await axios.get(`${BASE_URL}/api/admin/organisation`, {
      headers: { Cookie: empCookie },
    });
    assert(false, "Employee should be forbidden from accessing Admin Organisation API");
  } catch (err) {
    assert(err.response?.status === 403, "Employee strictly blocked with 403 Forbidden on Admin API");
  }

  // 5. Verify Employee Can Access Employee APIs
  const empTasksRes = await axios.get(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: empCookie },
  });
  assert(empTasksRes.status === 200, "Employee can access My Tasks API");

  console.log(`\n==================================================================`);
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`==================================================================\n`);

  if (failed > 0) process.exit(1);
}

testRolesAndNavigationCleanup().catch((err) => {
  console.error("Test Suite Error:", err.response ? err.response.data : err.message);
  process.exit(1);
});
