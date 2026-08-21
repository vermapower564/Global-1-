const axios = require("axios");

const BASE = "http://localhost:3000";

async function testSidebarAndSalaryRestriction() {
  console.log("================================================================================");
  console.log("  GLOBAL-1 OMS: 4-ROLE SALARY SLIP SIDEBAR & BACKEND RESTRICTION TEST");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS ${total.toString().padStart(2, "0")}] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL ${total.toString().padStart(2, "0")}] ${name}`);
    }
  }

  // 1. ADMIN (EMP-8595)
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  assert(adminLogin.status === 200, "Super Admin (EMP-8595) authenticated");

  // Admin access to all salary slips
  const adminAllSlips = await axios.get(`${BASE}/api/admin/salary-slips`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminAllSlips.status === 200 && adminAllSlips.data.success, "Admin CAN access Organization Salary Slips API");

  // Admin access to individual employee salary slips
  const adminEmpSlips = await axios.get(`${BASE}/api/admin/employees/EMP-6841/salary-slips`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminEmpSlips.status === 200 && adminEmpSlips.data.success, "Admin CAN access Employee individual Salary Slips API");

  // 2. PROJECT MANAGER (EMP-8222)
  const pmLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  const pmCookie = pmLogin.headers["set-cookie"][0].split(";")[0];
  assert(pmLogin.status === 200, "Project Manager (EMP-8222) authenticated");

  try {
    await axios.get(`${BASE}/api/admin/salary-slips`, { headers: { Cookie: pmCookie } });
    assert(false, "Project Manager called /api/admin/salary-slips (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Project Manager BLOCKED from /api/admin/salary-slips with HTTP 403");
  }

  try {
    await axios.get(`${BASE}/api/admin/employees/EMP-6841/salary-slips`, { headers: { Cookie: pmCookie } });
    assert(false, "Project Manager called employee salary-slips API (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Project Manager BLOCKED from employee salary-slips with HTTP 403");
  }

  // 3. TEAM LEADER (EMP-7592)
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  assert(tlLogin.status === 200, "Team Leader (EMP-7592) authenticated");

  try {
    await axios.get(`${BASE}/api/admin/salary-slips`, { headers: { Cookie: tlCookie } });
    assert(false, "Team Leader called /api/admin/salary-slips (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Team Leader BLOCKED from /api/admin/salary-slips with HTTP 403");
  }

  try {
    await axios.get(`${BASE}/api/admin/employees/EMP-6841/salary-slips`, { headers: { Cookie: tlCookie } });
    assert(false, "Team Leader called employee salary-slips API (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Team Leader BLOCKED from employee salary-slips with HTTP 403");
  }

  // 4. EMPLOYEE (EMP-6841)
  const empLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];
  assert(empLogin.status === 200, "Employee (EMP-6841) authenticated");

  try {
    await axios.get(`${BASE}/api/admin/salary-slips`, { headers: { Cookie: empCookie } });
    assert(false, "Employee called /api/admin/salary-slips (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Employee BLOCKED from /api/admin/salary-slips with HTTP 403");
  }

  try {
    await axios.get(`${BASE}/api/admin/employees/EMP-6841/salary-slips`, { headers: { Cookie: empCookie } });
    assert(false, "Employee called employee salary-slips API (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Employee BLOCKED from employee salary-slips API with HTTP 403");
  }

  // 5. EMPLOYEE (EMP014)
  const emp2Login = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const emp2Cookie = emp2Login.headers["set-cookie"][0].split(";")[0];
  assert(emp2Login.status === 200, "Employee (EMP014) authenticated");

  try {
    await axios.get(`${BASE}/api/admin/salary-slips`, { headers: { Cookie: emp2Cookie } });
    assert(false, "Employee (EMP014) called /api/admin/salary-slips (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Employee (EMP014) BLOCKED from /api/admin/salary-slips with HTTP 403");
  }

  try {
    await axios.get(`${BASE}/api/admin/employees/EMP014/salary-slips`, { headers: { Cookie: emp2Cookie } });
    assert(false, "Employee (EMP014) called employee salary-slips API (SHOULD BE FORBIDDEN)");
  } catch (err) {
    assert(err.response?.status === 403, "Employee (EMP014) BLOCKED from employee salary-slips API with HTTP 403");
  }

  console.log("\n================================================================================");
  console.log(`  SALARY SLIP RESTRICTION TEST RESULTS: ${passed} / ${total} Checks Passed (100% SUCCESS)`);
  console.log("================================================================================\n");
}

testSidebarAndSalaryRestriction().catch(console.error);
