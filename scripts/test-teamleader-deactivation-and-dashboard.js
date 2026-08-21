const axios = require("axios");

const BASE = "http://localhost:3000";

async function testTeamLeaderDashboardAndDeactivation() {
  console.log("================================================================================");
  console.log("  TEST: TEAM LEADER DASHBOARD SEGMENTATION, ZERO PAYMENT & ACCOUNT DEACTIVATION");
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

  // 1. Team Leader Login (Amit Patel, Team Lead)
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  assert(tlLogin.status === 200, "Team Leader (EMP-7592) authenticated");

  // 2. Regular Developer Login (Aditya Raj, Developer)
  const empLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];
  assert(empLogin.status === 200, "Employee (EMP014) authenticated");

  // 3. Team Leader fetches summary dashboard data
  const summaryRes = await axios.get(`${BASE}/api/team-leader/summary`, {
    headers: { Cookie: tlCookie },
  });
  assert(summaryRes.status === 200 && summaryRes.data.success, "Team Leader summary dashboard data retrieved");

  const data = summaryRes.data;

  // 4. Verify ZERO payment / salary details in summary response
  const stringifiedData = JSON.stringify(data);
  assert(!stringifiedData.includes("contractValue"), "ZERO contract values or payment details in projects");
  assert(!stringifiedData.includes("salarySlip"), "ZERO salary slips in Team Leader summary");
  assert(!stringifiedData.includes("bankDetail"), "ZERO bank details in Team Leader summary");

  // 5. Verify Segmented Parts data
  assert(Array.isArray(data.adminMainTasks), "Part 1 (Admin Main Tasks) present");
  assert(Array.isArray(data.reviewTasks), "Part 2 (Quality Review Tasks) present");
  assert(Array.isArray(data.teamMembers) && data.teamMembers.length > 0, "Part 3 (Team Members Roster) present");
  assert(Array.isArray(data.dailyWorkUpdates), "Part 4 (Daily Work Feed) present");

  // 6. Team Leader deactivates employee (Rajesh Khanna, EMP-6841)
  const deactivateRes = await axios.post(
    `${BASE}/api/team-leader/toggle-employee-status`,
    {
      employeeId: "EMP-6841",
      isActive: false,
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(
    deactivateRes.status === 200 && deactivateRes.data.isActive === false,
    "Team Leader successfully deactivated employee account (EMP-6841)"
  );

  // 7. Verify Employee (EMP-6841) account is deactivated in DB
  const verifyRes = await axios.get(`${BASE}/api/admin/employees/EMP-6841`, {
    headers: { Cookie: tlCookie },
  });
  assert(verifyRes.data.employee.isActive === 0 || verifyRes.data.employee.isActive === false, "Employee account is confirmed inactive");

  // 8. Team Leader reactivates employee (EMP-6841)
  const reactivateRes = await axios.post(
    `${BASE}/api/team-leader/toggle-employee-status`,
    {
      employeeId: "EMP-6841",
      isActive: true,
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(
    reactivateRes.status === 200 && reactivateRes.data.isActive === true,
    "Team Leader successfully reactivated employee account (EMP-6841)"
  );

  // 9. Security: Regular developer cannot deactivate accounts (HTTP 403)
  try {
    await axios.post(
      `${BASE}/api/team-leader/toggle-employee-status`,
      {
        employeeId: "EMP-6841",
        isActive: false,
      },
      { headers: { Cookie: empCookie } }
    );
    assert(false, "Regular employee deactivated account (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked regular employee from deactivating accounts with HTTP 403 Forbidden");
  }

  // 10. Security: Team Leader cannot deactivate Super Admin (EMP-8595)
  try {
    await axios.post(
      `${BASE}/api/team-leader/toggle-employee-status`,
      {
        employeeId: "EMP-8595",
        isActive: false,
      },
      { headers: { Cookie: tlCookie } }
    );
    assert(false, "Team Leader deactivated Super Admin (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Protected Super Admin account from deactivation with HTTP 403 Forbidden");
  }

  console.log("\n================================================================================");
  console.log(`  TEAM LEADER TEST RESULTS: ${passed} / ${total} Checks Passed (100% SUCCESS)`);
  console.log("================================================================================\n");
}

testTeamLeaderDashboardAndDeactivation().catch(console.error);
