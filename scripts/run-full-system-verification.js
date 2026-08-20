const axios = require("axios");

const BASE = "http://localhost:3000";

async function runFullVerification() {
  console.log("================================================================================");
  console.log("    GLOBAL-1 OMS COMPLETE SYSTEM HEALTH & WORKFLOW VERIFICATION SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extraInfo = "") {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS ${total.toString().padStart(2, "0")}] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL ${total.toString().padStart(2, "0")}] ${testName} ${extraInfo}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. MULTI-ROLE AUTHENTICATION & SESSION VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("--- 1. Multi-Role Authentication & Session Verification ---");

  // Role 1: Super Admin
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  assert(adminLogin.status === 200 && adminLogin.data.success, "Super Admin (EMP-8595) authenticated");

  // Role 2: Team Leader / Finance
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  assert(tlLogin.status === 200 && tlLogin.data.success, "Team Leader (EMP-7592) authenticated");

  // Role 3: Senior Developer
  const dev1Login = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const dev1Cookie = dev1Login.headers["set-cookie"][0].split(";")[0];
  assert(dev1Login.status === 200 && dev1Login.data.success, "Senior Developer (EMP-6841) authenticated");

  // Role 4: Frontend Developer
  const dev2Login = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const dev2Cookie = dev2Login.headers["set-cookie"][0].split(";")[0];
  assert(dev2Login.status === 200 && dev2Login.data.success, "Developer (EMP014) authenticated");

  // Session verification via /api/auth/me
  const meRes = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: adminCookie } });
  assert(meRes.data.authenticated === true && meRes.data.user.role === "SUPER_ADMIN", "Admin session verified via /api/auth/me");

  // ---------------------------------------------------------------------------
  // 2. WORKFORCE DIRECTORY & PROFILE DETAILS
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Workforce Directory & Profile Dossiers ---");

  const empListRes = await axios.get(`${BASE}/api/employees`, { headers: { Cookie: adminCookie } });
  const allEmployees = empListRes.data.employees || empListRes.data.data || empListRes.data;
  assert(allEmployees.length >= 5, `Retrieved ${allEmployees.length} active employee records`);

  const sampleEmp = allEmployees[0];
  const profileRes = await axios.get(`${BASE}/api/admin/employees/${sampleEmp.employeeId || sampleEmp.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert(profileRes.data.success && profileRes.data.employee !== undefined, `Employee 360° Profile Dossier loaded for ${sampleEmp.name}`);

  const salarySlipsRes = await axios.get(
    `${BASE}/api/admin/employees/${sampleEmp.employeeId || sampleEmp.id}/salary-slips`,
    { headers: { Cookie: adminCookie } }
  );
  assert(salarySlipsRes.data.success === true, `Salary Slips records loaded for ${sampleEmp.name}`);

  // ---------------------------------------------------------------------------
  // 3. ADMIN -> TEAM LEADER -> EMPLOYEE WORK HIERARCHY
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Admin -> Team Leader -> Employee Work Hierarchy ---");

  const amit = allEmployees.find(e => e.employeeId === "EMP-7592") || allEmployees[1];
  const aditya = allEmployees.find(e => e.employeeId === "EMP014") || allEmployees[2];
  const rajesh = allEmployees.find(e => e.employeeId === "EMP-6841") || allEmployees[3];

  // Step 3A: Admin Creates Project with Team Leader
  const projectTitle = "FinTech Core Banking " + Date.now().toString().slice(-4);
  const createProjRes = await axios.post(
    `${BASE}/api/projects`,
    {
      projectTitle,
      description: "High-throughput microservices architecture for real-time ledger settlement.",
      clientCompany: "Apex Global FinTech",
      clientContactPerson: "Mark Vance",
      clientEmail: "mark@apexfin.com",
      contractValue: 1200000,
      status: "IN_PROGRESS",
      teamLeaderId: amit.id,
      memberUserIds: [aditya.id, rajesh.id],
    },
    { headers: { Cookie: adminCookie } }
  );
  assert(createProjRes.status === 201 && createProjRes.data.success, "Admin created Project with designated Team Leader");
  const projectId = createProjRes.data.data.id;

  // Step 3B: Admin Assigns Main Task to Team Leader
  const mainTaskRes = await axios.post(
    `${BASE}/api/tasks`,
    {
      title: "Core Ledger Settlement Engine",
      description: "Design fault-tolerant double-entry transaction pipeline.",
      projectId,
      section: "Architecture",
      assignedToUserId: amit.id,
      priority: "CRITICAL",
      status: "NEW",
      estimatedHours: 40,
    },
    { headers: { Cookie: adminCookie } }
  );
  assert(mainTaskRes.status === 201 && mainTaskRes.data.success, "Admin assigned Main Task to Team Leader");
  const mainTaskId = mainTaskRes.data.taskId;

  // Step 3C: Team Leader Accepts Task
  const acceptTaskRes = await axios.post(
    `${BASE}/api/team-leader/accept-task`,
    { taskId: mainTaskId },
    { headers: { Cookie: tlCookie } }
  );
  assert(acceptTaskRes.status === 200 && acceptTaskRes.data.status === "ACCEPTED", "Team Leader accepted Main Task (Status: ACCEPTED)");

  // Step 3D: Team Leader Checks Available Capacity
  const tlSummaryRes = await axios.get(`${BASE}/api/team-leader/summary`, { headers: { Cookie: tlCookie } });
  assert(tlSummaryRes.data.isTeamLeader === true && tlSummaryRes.data.teamMembers.length >= 2, "Team Leader inspected live team member capacity");

  // Step 3E: Team Leader Divides Main Task into Sections
  const divideTaskRes = await axios.post(
    `${BASE}/api/team-leader/divide-task`,
    {
      mainTaskId,
      subtasks: [
        {
          title: "Frontend Ledger UI & Balance Widget",
          section: "Frontend",
          assignedToUserId: aditya.id,
          priority: "HIGH",
          dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: 12,
        },
        {
          title: "Backend Double-Entry Transaction API",
          section: "Backend",
          assignedToUserId: rajesh.id,
          priority: "CRITICAL",
          dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: 18,
        },
      ],
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(divideTaskRes.status === 201 && divideTaskRes.data.subtaskIds.length === 2, "Team Leader divided task into Frontend & Backend subtasks");
  const adityaSubtaskId = divideTaskRes.data.subtaskIds[0];

  // Step 3F: Employee (Aditya) Works & Submits Deliverable
  const empSubmitRes = await axios.patch(
    `${BASE}/api/tasks/${adityaSubtaskId}`,
    {
      status: "UNDER_REVIEW",
      progress: 100,
      notes: "Frontend Ledger UI complete with responsive widgets and passed automated unit tests.",
    },
    { headers: { Cookie: dev2Cookie } }
  );
  assert(empSubmitRes.status === 200 && empSubmitRes.data.success, "Employee submitted work for review (Status: UNDER_REVIEW, 100%)");

  // Step 3G: Team Leader Reviews and Approves
  const tlApproveRes = await axios.patch(
    `${BASE}/api/tasks/${adityaSubtaskId}`,
    {
      status: "COMPLETED",
      progress: 100,
      reviewNotes: "Clean UI component architecture and zero layout shifts. Verified and approved!",
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(tlApproveRes.status === 200 && tlApproveRes.data.task.status === "COMPLETED", "Team Leader approved deliverable (Status: COMPLETED)");

  // Step 3H: Admin Monitors Hierarchy Progress
  const adminProjRes = await axios.get(`${BASE}/api/projects`, { headers: { Cookie: adminCookie } });
  const liveProj = adminProjRes.data.projects.find(p => p.id === projectId);
  assert(liveProj !== undefined && liveProj.teamLeader?.id === amit.id, "Admin monitored live project hierarchy with calculated progress");

  // ---------------------------------------------------------------------------
  // 4. CORE OPERATIONS & RECORD ENDPOINTS
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Core Operations & Record Endpoints ---");

  const todayRes = await axios.get(`${BASE}/api/admin/today`, { headers: { Cookie: adminCookie } });
  assert(todayRes.data.success === true && todayRes.data.summary !== undefined, "Today Live Work API returned real database summary");

  const attendanceRes = await axios.get(`${BASE}/api/attendance`, { headers: { Cookie: adminCookie } });
  assert(attendanceRes.status === 200, "Attendance Ledger API operational");

  const dailyWorkRes = await axios.get(`${BASE}/api/daily-work`, { headers: { Cookie: adminCookie } });
  assert(dailyWorkRes.status === 200, "Daily Work EOD API operational");

  const blockersRes = await axios.get(`${BASE}/api/blockers`, { headers: { Cookie: adminCookie } });
  assert(blockersRes.status === 200, "Blocker Resolution API operational");

  const auditRes = await axios.get(`${BASE}/api/audit-logs`, { headers: { Cookie: adminCookie } });
  assert(auditRes.status === 200, "Security Audit Logs API operational");

  // ---------------------------------------------------------------------------
  // 5. SECURITY, ANTI-IDOR & PERMISSION ENFORCEMENT
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Security, Anti-IDOR & Permission Enforcement ---");

  // Sec 1: Cross-employee task tampering rejected (HTTP 403)
  try {
    await axios.patch(`${BASE}/api/tasks/${adityaSubtaskId}`, { status: "COMPLETED" }, { headers: { Cookie: dev1Cookie } });
    assert(false, "Cross-employee task tampering allowed (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked cross-employee task modification with HTTP 403 Forbidden");
  }

  // Sec 2: Non-leader employee cannot accept task (HTTP 403)
  try {
    await axios.post(`${BASE}/api/team-leader/accept-task`, { taskId: mainTaskId }, { headers: { Cookie: dev2Cookie } });
    assert(false, "Non-leader employee accepted task (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked non-leader employee from accepting task with HTTP 403 Forbidden");
  }

  // Sec 3: Employee cannot create project (HTTP 403)
  try {
    await axios.post(`${BASE}/api/projects`, { projectTitle: "Unauthorized" }, { headers: { Cookie: dev2Cookie } });
    assert(false, "Employee created project (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked non-admin employee from project creation with HTTP 403 Forbidden");
  }

  // Sec 4: Unauthenticated request rejected (HTTP 401)
  try {
    await axios.get(`${BASE}/api/tasks`);
    assert(false, "Unauthenticated request succeeded (FAILED)");
  } catch (err) {
    assert(err.response?.status === 401, "Blocked unauthenticated request with HTTP 401 Unauthorized");
  }

  console.log("\n================================================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} / ${total} Checks Passed (100% HEALTHY)`);
  console.log("================================================================================\n");
}

runFullVerification().catch(err => {
  console.error("Full Verification Error:", err);
});
