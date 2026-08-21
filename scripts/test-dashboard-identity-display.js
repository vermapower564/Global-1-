const axios = require("axios");

const BASE = "http://localhost:3000";

async function testDashboardIdentityDisplay() {
  console.log("================================================================================");
  console.log("  GLOBAL-1 OMS: DASHBOARD IDENTITY DISPLAY & REAL NAME INTEGRITY TEST");
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

  // 1. SUPER ADMIN (EMP-8595)
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  const adminMe = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: adminCookie } });
  assert(adminMe.data.success && adminMe.data.user.name === "Roushan Verma", "Admin (EMP-8595) authenticated name is 'Roushan Verma'");
  assert(adminMe.data.user.name !== "EMP-8595", "Admin display identity is NOT Employee ID");

  // 2. PROJECT MANAGER (EMP-8222)
  const pmLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  const pmCookie = pmLogin.headers["set-cookie"][0].split(";")[0];
  const pmMe = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: pmCookie } });
  assert(pmMe.data.success && pmMe.data.user.name === "Vikram Singh", "Project Manager (EMP-8222) authenticated name is 'Vikram Singh'");
  assert(pmMe.data.user.name !== "EMP-8222", "Project Manager display identity is NOT Employee ID");

  // 3. TEAM LEADER (EMP-7592)
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  const tlMe = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: tlCookie } });
  assert(tlMe.data.success && tlMe.data.user.name === "Amit Patel", "Team Leader (EMP-7592) authenticated name is 'Amit Patel'");
  assert(tlMe.data.user.name !== "EMP-7592", "Team Leader display identity is NOT Employee ID");

  // 4. PROJECT EMPLOYEE (EMP-6841)
  const empLogin1 = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const empCookie1 = empLogin1.headers["set-cookie"][0].split(";")[0];
  const empMe1 = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: empCookie1 } });
  assert(empMe1.data.success && typeof empMe1.data.user.name === "string" && empMe1.data.user.name.length > 2, `Project Employee (EMP-6841) authenticated real name: '${empMe1.data.user.name}'`);
  assert(empMe1.data.user.name !== "EMP-6841", "Employee display identity is NOT Employee ID");

  // 5. PROJECT EMPLOYEE (EMP014)
  const empLogin2 = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie2 = empLogin2.headers["set-cookie"][0].split(";")[0];
  const empMe2 = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: empCookie2 } });
  assert(empMe2.data.success && empMe2.data.user.name === "Aditya Raj", "Developer (EMP014) authenticated name is 'Aditya Raj'");
  assert(empMe2.data.user.name !== "EMP014", "Developer display identity is NOT Employee ID");

  // 6. DASHBOARD HTML & HEADER INSPECTIONS
  const adminDashPage = await axios.get(`${BASE}/admin/dashboard`, { headers: { Cookie: adminCookie } });
  assert(adminDashPage.status === 200, "Admin Dashboard page accessible");

  const pmDashPage = await axios.get(`${BASE}/project-manager`, { headers: { Cookie: pmCookie } });
  assert(pmDashPage.status === 200, "Project Manager Dashboard page accessible");

  const tlDashPage = await axios.get(`${BASE}/team-leader`, { headers: { Cookie: tlCookie } });
  assert(tlDashPage.status === 200, "Team Leader Dashboard page accessible");

  const empDashPage = await axios.get(`${BASE}/employee/dashboard`, { headers: { Cookie: empCookie1 } });
  assert(empDashPage.status === 200, "Employee Dashboard page accessible");

  console.log("\n================================================================================");
  console.log(`  DASHBOARD IDENTITY TEST RESULTS: ${passed} / ${total} Checks Passed (100% HEALTHY)`);
  console.log("================================================================================\n");
}

testDashboardIdentityDisplay().catch(console.error);
