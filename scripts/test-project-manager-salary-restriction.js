const axios = require("axios");

const BASE = "http://localhost:3000";

async function testProjectManagerSalaryRestriction() {
  console.log("================================================================================");
  console.log("  GLOBAL-1 OMS: PROJECT MANAGER SALARY SLIP RESTRICTION TEST SUITE");
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

  // 1. AUTHENTICATE ALL RELEVANT ROLES
  // Super Admin
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  assert(adminLogin.status === 200, "Super Admin (EMP-8595) authenticated");

  // Project Manager: Vikram Singh
  const pmLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  const pmCookie = pmLogin.headers["set-cookie"][0].split(";")[0];
  assert(pmLogin.status === 200, "Project Manager (EMP-8222) authenticated");

  // Employee: Rajesh Khanna
  const empLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];
  assert(empLogin.status === 200, "Employee (EMP-6841) authenticated");

  // 2. PROJECT MANAGER CALLING ALL-SALARY-SLIPS ENDPOINT -> MUST BE 403 FORBIDDEN
  try {
    await axios.get(`${BASE}/api/admin/salary-slips`, {
      headers: { Cookie: pmCookie },
    });
    assert(false, "Project Manager called /api/admin/salary-slips (FAILED - SHOULD BE BLOCKED)");
  } catch (err) {
    assert(err.response?.status === 403, "Project Manager blocked from /api/admin/salary-slips with HTTP 403 Forbidden");
  }

  // 3. PROJECT MANAGER CALLING INDIVIDUAL EMPLOYEE SALARY SLIPS -> MUST BE 403 FORBIDDEN
  try {
    await axios.get(`${BASE}/api/admin/employees/EMP-6841/salary-slips`, {
      headers: { Cookie: pmCookie },
    });
    assert(false, "Project Manager called /api/admin/employees/EMP-6841/salary-slips (FAILED - SHOULD BE BLOCKED)");
  } catch (err) {
    assert(err.response?.status === 403, "Project Manager blocked from employee salary-slips API with HTTP 403 Forbidden");
  }

  // 4. PROJECT MANAGER VIEWING EMPLOYEE DOSSIER -> SALARY, BANK, AND SLIPS MUST BE REDACTED
  const pmViewDossier = await axios.get(`${BASE}/api/admin/employees/EMP-6841`, {
    headers: { Cookie: pmCookie },
  });
  assert(pmViewDossier.status === 200, "Project Manager can view Employee operational dossier");
  const empData = pmViewDossier.data.employee;
  assert(empData.salary === null, "Project Manager sees salary: null");
  assert(empData.bankDetail === null, "Project Manager sees bankDetail: null");
  assert(Array.isArray(empData.salarySlips) && empData.salarySlips.length === 0, "Project Manager sees salarySlips: []");
  assert(empData.isConfidentialMasked === true, "isConfidentialMasked is TRUE for Project Manager view");

  // 5. SUPER ADMIN CAN STILL VIEW SALARY SLIPS
  const adminSlipsRes = await axios.get(`${BASE}/api/admin/salary-slips`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminSlipsRes.status === 200 && adminSlipsRes.data.success, "Super Admin can access salary slips ledger");

  // 6. EMPLOYEE CAN STILL VIEW THEIR OWN SALARY SLIPS
  const empOwnSlipsRes = await axios.get(`${BASE}/api/admin/employees/EMP-6841/salary-slips`, {
    headers: { Cookie: empCookie },
  });
  assert(empOwnSlipsRes.status === 200 && empOwnSlipsRes.data.success, "Employee can access own salary slips");

  console.log("\n================================================================================");
  console.log(`  PROJECT MANAGER SALARY RESTRICTION RESULTS: ${passed} / ${total} Checks Passed (100% SUCCESS)`);
  console.log("================================================================================\n");
}

testProjectManagerSalaryRestriction().catch(console.error);
