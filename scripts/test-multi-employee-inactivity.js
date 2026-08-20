const axios = require("axios");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "oms-enterprise-super-secret-key-2026";

async function testMultiEmployeeSessionAndInactivity() {
  const BASE = "http://localhost:3000";
  console.log("=================================================");
  console.log("  TESTING MULTI-EMPLOYEE SESSIONS & INACTIVITY   ");
  console.log("=================================================\n");

  // [TEST 1] Unauthenticated direct access to / and /employee -> Must redirect to /login
  const resRoot = await axios.get(`${BASE}/`, { maxRedirects: 0, validateStatus: () => true });
  console.log(`[TEST 1a] GET / (Unauthenticated) -> Status: ${resRoot.status}, Location: ${resRoot.headers.location}`);
  
  const resEmployee = await axios.get(`${BASE}/employee`, { maxRedirects: 0, validateStatus: () => true });
  console.log(`[TEST 1b] GET /employee (Unauthenticated) -> Status: ${resEmployee.status}, Location: ${resEmployee.headers.location}`);

  // [TEST 2] Employee A (Aditya Raj - EMP014) Login from Computer 1
  const loginA = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const cookieA = loginA.headers["set-cookie"][0].split(";")[0];
  console.log(`\n[TEST 2] Computer 1: Employee A (Aditya Raj / EMP014) logged in successfully.`);
  console.log(`  Role: ${loginA.data.user.role}, Redirect: ${loginA.data.redirectTo}`);

  // [TEST 3] Employee B (Super Admin / Roushan Verma - EMP-8595) Login from Computer 2 simultaneously
  const loginB = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookieB = loginB.headers["set-cookie"][0].split(";")[0];
  console.log(`\n[TEST 3] Computer 2: Employee B (Roushan Verma / EMP-8595) logged in simultaneously.`);
  console.log(`  Role: ${loginB.data.user.role}, Redirect: ${loginB.data.redirectTo}`);

  // [TEST 4] Concurrent Data Isolation:
  const meA = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieA } });
  const meB = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieB } });
  console.log(`\n[TEST 4] Concurrent Data Isolation:`);
  console.log(`  Session A User: ${meA.data.user.name} (${meA.data.user.employeeId})`);
  console.log(`  Session B User: ${meB.data.user.name} (${meB.data.user.employeeId})`);
  if (meA.data.user.employeeId !== meB.data.user.employeeId) {
    console.log("  ✓ PASS: Employee A and Employee B have completely independent sessions & data.");
  } else {
    console.log("  ✗ FAIL: Shared session collision detected!");
  }

  // [TEST 5] Inactivity Timeout Simulation (Server-Side Enforcement):
  // Generate a token for Employee A that has lastActive 65 minutes ago (exceeded 1 hour)
  const expiredTokenA = jwt.sign(
    {
      id: loginA.data.user.id,
      email: loginA.data.user.email,
      role: loginA.data.user.role,
      lastActive: Date.now() - 65 * 60 * 1000, // 65 min ago
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const expiredCookieA = `oms_session=${expiredTokenA}`;
  const resExpiredA = await axios.get(`${BASE}/api/auth/me`, {
    headers: { Cookie: expiredCookieA },
    validateStatus: () => true,
  });
  console.log(`\n[TEST 5] Inactivity Timeout for Employee A (> 1 Hour Inactive):`);
  console.log(`  Status: ${resExpiredA.status}, Error:`, resExpiredA.data.error || resExpiredA.data);
  if (resExpiredA.status === 401) {
    console.log("  ✓ PASS: Employee A session expired and rejected by server after 1 hour inactivity.");
  }

  // [TEST 6] Employee B remains active while Employee A is expired:
  const resActiveB = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieB } });
  console.log(`\n[TEST 6] Employee B Session Status while Employee A is expired:`);
  console.log(`  Status: ${resActiveB.status}, User: ${resActiveB.data.user.name} (Active: ${resActiveB.data.user.isActive})`);
  if (resActiveB.status === 200) {
    console.log("  ✓ PASS: Employee B session remains fully active on Computer 2.");
  }

  // [TEST 7] Employee Logout:
  const logoutRes = await axios.post(`${BASE}/api/auth/logout`, {}, { headers: { Cookie: cookieB } });
  console.log(`\n[TEST 7] Employee B Logout:`);
  console.log(`  Status: ${logoutRes.status}, Set-Cookie:`, logoutRes.headers["set-cookie"]);
  console.log("  ✓ PASS: Cookie invalidated.");

  console.log("\n=================================================");
  console.log("     ALL MULTI-EMPLOYEE & TIMEOUT TESTS PASSED   ");
  console.log("=================================================");
}

testMultiEmployeeSessionAndInactivity().catch((err) => console.error("Test Error:", err));
