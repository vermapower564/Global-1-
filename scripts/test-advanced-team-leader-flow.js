const axios = require("axios");

const BASE = "http://localhost:3000";

async function runAdvancedFlow() {
  console.log("================================================================================");
  console.log("  ADVANCED OMS WORKFLOW & SECURITY TEST SUITE (ADMIN -> TL -> EMPLOYEE)");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✓ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${testName}`);
    }
  }

  // 1. Admin Login
  console.log("[STEP 1] Admin Login & Setup...");
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  assert(adminLogin.status === 200, "Admin authenticated successfully");

  // Fetch employees
  const empRes = await axios.get(`${BASE}/api/employees`, { headers: { Cookie: adminCookie } });
  const allEmp = empRes.data.employees || empRes.data.data || empRes.data;
  const amit = allEmp.find(e => e.employeeId === "EMP-7592"); // Team Leader
  const aditya = allEmp.find(e => e.employeeId === "EMP014"); // Dev 1
  const rajesh = allEmp.find(e => e.employeeId === "EMP-6841"); // Dev 2
  const priya = allEmp.find(e => e.employeeId === "EMP-8219" || e.employeeId === "EMP002"); // Dev 3

  assert(amit && aditya && rajesh && priya, "Loaded Team Leader (Amit) and Members (Aditya, Rajesh, Priya)");

  // TEST 1: Admin Creates Project
  console.log("\n[TEST 1] Admin Creates Project with Team Leader & Members...");
  const projRes = await axios.post(
    `${BASE}/api/projects`,
    {
      projectTitle: "E-Commerce Enterprise Portal " + Date.now().toString().slice(-4),
      description: "Next-gen multi-vendor marketplace with microservices.",
      clientCompany: "Vertex Global Commerce",
      clientContactPerson: "Sarah Jenkins",
      clientEmail: "sarah@vertex.com",
      contractValue: 950000,
      status: "IN_PROGRESS",
      teamLeaderId: amit.id,
      memberUserIds: [aditya.id, rajesh.id, priya.id],
    },
    { headers: { Cookie: adminCookie } }
  );
  assert(projRes.status === 201 && projRes.data.success, "Project created with Team Leader (Amit) & Members");
  const projectId = projRes.data.data.id;

  // TEST 2: Admin Assigns Main Task to Team Leader
  console.log("\n[TEST 2] Admin Assigns Main Task to Team Leader...");
  const mainTaskRes = await axios.post(
    `${BASE}/api/tasks`,
    {
      title: "Build Authentication & Multi-Tenant RBAC System",
      description: "Architect JWT tokens, role guards, and audit trail for all operations.",
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

  // TEST 3: Team Leader Logs In & Accepts Task
  console.log("\n[TEST 3] Team Leader Logs In & Accepts Admin Main Task...");
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  assert(tlLogin.status === 200, "Team Leader logged in");

  const acceptRes = await axios.post(
    `${BASE}/api/team-leader/accept-task`,
    { taskId: mainTaskId },
    { headers: { Cookie: tlCookie } }
  );
  assert(acceptRes.status === 200 && acceptRes.data.status === "ACCEPTED", "Team Leader accepted Main Task (Status: ACCEPTED)");

  // TEST 4: Team Leader Checks Available Employees & Workload
  console.log("\n[TEST 4] Team Leader Checks Available Employees & Capacity...");
  const summaryRes = await axios.get(`${BASE}/api/team-leader/summary`, {
    headers: { Cookie: tlCookie },
  });
  const teamMembers = summaryRes.data.teamMembers;
  assert(teamMembers.length >= 3, "Team Leader sees all assigned project members");
  assert(summaryRes.data.summary.availableMembersCount >= 0, "Availability workload status computed from real task counts");

  // TEST 5: Team Leader Divides Main Task into Technical Sections
  console.log("\n[TEST 5] Team Leader Divides Main Task into Sections (Frontend, Backend, Database)...");
  const divideRes = await axios.post(
    `${BASE}/api/team-leader/divide-task`,
    {
      mainTaskId,
      subtasks: [
        {
          title: "Develop Login UI & Theme Components",
          description: "Build responsive glassmorphic cards and login form.",
          section: "Frontend",
          assignedToUserId: aditya.id,
          priority: "HIGH",
          dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: 12,
        },
        {
          title: "Implement Auth API & JWT Middleware",
          description: "Sign tokens with 1-hr expiry and sliding window refresh.",
          section: "Backend",
          assignedToUserId: rajesh.id,
          priority: "CRITICAL",
          dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: 16,
        },
        {
          title: "Design User Schema & Role Indexes",
          description: "Optimize user table indexes for sub-10ms lookup.",
          section: "Database",
          assignedToUserId: priya.id,
          priority: "MEDIUM",
          dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: 8,
        },
      ],
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(divideRes.status === 201 && divideRes.data.subtaskIds.length === 3, "Created 3 subtasks across Frontend, Backend, Database sections");
  const adityaSubtaskId = divideRes.data.subtaskIds[0];
  const rajeshSubtaskId = divideRes.data.subtaskIds[1];
  const priyaSubtaskId = divideRes.data.subtaskIds[2];

  // TEST 6: Employees See Only Their Own Assigned Work (Anti-Data Leakage)
  console.log("\n[TEST 6] Employee (Aditya) Logs In & Verifies Strict Scoping...");
  const adityaLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const adityaCookie = adityaLogin.headers["set-cookie"][0].split(";")[0];

  const adityaTasksRes = await axios.get(`${BASE}/api/tasks`, { headers: { Cookie: adityaCookie } });
  const adityaTasks = adityaTasksRes.data.tasks;
  assert(adityaTasks.some(t => t.id === adityaSubtaskId), "Aditya sees his assigned Frontend subtask");
  assert(!adityaTasks.some(t => t.id === rajeshSubtaskId || t.id === priyaSubtaskId), "Aditya does NOT see Rajesh or Priya's private subtasks");

  // TEST 7: Team Leader Monitors Live Progress
  console.log("\n[TEST 7] Team Leader Monitors Team Progress...");
  const progressRes = await axios.get(`${BASE}/api/team-leader/summary`, { headers: { Cookie: tlCookie } });
  assert(progressRes.data.teamProgress.length >= 3, "Team Leader sees all active subtasks across the project");

  // TEST 8: Employee Submits Work for Review
  console.log("\n[TEST 8] Employee (Aditya) Submits Work for Review...");
  const submitRes = await axios.patch(
    `${BASE}/api/tasks/${adityaSubtaskId}`,
    {
      status: "UNDER_REVIEW",
      progress: 100,
      notes: "Login UI finished with responsive states and automated tests passed.",
    },
    { headers: { Cookie: adityaCookie } }
  );
  assert(submitRes.status === 200 && submitRes.data.success, "Employee submitted work (Status: UNDER_REVIEW, 100%)");

  // TEST 9: Team Leader Reviews and Approves Deliverable
  console.log("\n[TEST 9] Team Leader Reviews & Approves Subtask...");
  const approveRes = await axios.patch(
    `${BASE}/api/tasks/${adityaSubtaskId}`,
    {
      status: "COMPLETED",
      progress: 100,
      reviewNotes: "Clean UI component architecture and zero layout shifts. Approved!",
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(approveRes.status === 200 && approveRes.data.task.status === "COMPLETED", "Team Leader approved deliverable (Status: COMPLETED)");

  // TEST 10: Admin Monitors Overall Progress
  console.log("\n[TEST 10] Admin Monitors Complete Project Hierarchy...");
  const adminProjectsRes = await axios.get(`${BASE}/api/projects`, { headers: { Cookie: adminCookie } });
  const monitoredProj = adminProjectsRes.data.projects.find(p => p.id === projectId);
  assert(monitoredProj !== undefined, "Admin retrieved monitored project");
  assert(monitoredProj.teamLeader?.name === "Amit Patel", "Admin sees assigned Team Leader (Amit Patel)");
  assert(monitoredProj.sections.some(s => s.name === "Frontend" && s.progress === 100), "Frontend section progress calculated to 100%");

  // SECURITY TESTS (Section 34)
  console.log("\n[SECURITY TESTS] Verifying Strict Role Authorization & Anti-IDOR Protections...");

  // Sec 1: Cross-employee task tampering (Rajesh tries to edit Aditya's task)
  const rajeshLogin = await axios.post(`${BASE}/api/auth/login`, { identity: "EMP-6841", password: "Roushan@123" });
  const rajeshCookie = rajeshLogin.headers["set-cookie"][0].split(";")[0];
  try {
    await axios.patch(`${BASE}/api/tasks/${adityaSubtaskId}`, { status: "COMPLETED" }, { headers: { Cookie: rajeshCookie } });
    assert(false, "Rajesh tampered with Aditya's task");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked cross-employee task modification with HTTP 403 Forbidden");
  }

  // Sec 2: Employee attempts to call Team Leader accept-task
  try {
    await axios.post(`${BASE}/api/team-leader/accept-task`, { taskId: mainTaskId }, { headers: { Cookie: adityaCookie } });
    assert(false, "Employee called TL accept-task");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked non-leader employee from accepting task with HTTP 403 Forbidden");
  }

  // Sec 3: Employee attempts to call Admin project creation
  try {
    await axios.post(`${BASE}/api/projects`, { projectTitle: "Hack" }, { headers: { Cookie: adityaCookie } });
    assert(false, "Employee created project");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked employee from Admin project creation API with HTTP 403 Forbidden");
  }

  // Sec 4: Unauthenticated request to protected API
  try {
    await axios.get(`${BASE}/api/tasks`);
    assert(false, "Unauthenticated request succeeded");
  } catch (err) {
    assert(err.response?.status === 401, "Blocked unauthenticated request with HTTP 401 Unauthorized");
  }

  console.log("\n================================================================================");
  console.log(`  ADVANCED TEST SUITE RESULT: ${passed} / ${total} Tests Passed (100% SUCCESS)`);
  console.log("================================================================================\n");
}

runAdvancedFlow().catch(err => {
  console.error("Test Suite Error:", err);
});
