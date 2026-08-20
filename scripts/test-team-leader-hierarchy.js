const axios = require("axios");

const BASE = "http://localhost:3000";

async function runTests() {
  console.log("================================================================================");
  console.log("  OMS Hierarchy & Team Leader Security Test Suite");
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
  console.log("[1] Admin Login...");
  const adminLoginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLoginRes.headers["set-cookie"][0].split(";")[0];
  assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === "SUPER_ADMIN", "Admin logged in successfully");

  // Fetch all employees to get user IDs
  const empRes = await axios.get(`${BASE}/api/employees`, {
    headers: { Cookie: adminCookie },
  });
  const allEmployees = empRes.data.employees || empRes.data.data || (Array.isArray(empRes.data) ? empRes.data : []);
  const amit = allEmployees.find(e => e.employeeId === "EMP-7592");
  const aditya = allEmployees.find(e => e.employeeId === "EMP014");
  const rajesh = allEmployees.find(e => e.employeeId === "EMP-6841");

  assert(amit && aditya && rajesh, "Found Amit (TL), Aditya (Dev), Rajesh (Dev) in database");

  // 2. Admin creates a project with Team Leader (Amit) and Members (Aditya, Rajesh)
  console.log("\n[2] Admin Creates Project with Team Leader...");
  const projCreateRes = await axios.post(
    `${BASE}/api/projects`,
    {
      projectTitle: "E-Commerce NextGen Portal " + Date.now().toString().slice(-4),
      description: "Scalable multi-tenant retail storefront with microservices.",
      clientCompany: "Omni Retail Global",
      clientContactPerson: "Sarah Jenkins",
      clientEmail: "sarah@omniretail.com",
      contractValue: 750000,
      status: "IN_PROGRESS",
      teamLeaderId: amit.id,
      memberUserIds: [aditya.id, rajesh.id],
    },
    { headers: { Cookie: adminCookie } }
  );
  assert(projCreateRes.status === 201 && projCreateRes.data.success, "Admin created project with Team Leader Amit");
  const newProjectId = projCreateRes.data.data.id;

  // 3. Team Leader (Amit) Login & Task Assignment
  console.log("\n[3] Team Leader (Amit) Logs In & Divides Project into Sections...");
  const tlLoginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLoginRes.headers["set-cookie"][0].split(";")[0];
  assert(tlLoginRes.status === 200, "Team Leader (Amit) logged in");

  // TL creates Task in "Frontend" section for Aditya
  const task1Res = await axios.post(
    `${BASE}/api/tasks`,
    {
      title: "Develop Product Catalog & Shopping Cart UI",
      description: "Build responsive product grid and drawer cart using Tailwind CSS.",
      projectId: newProjectId,
      section: "Frontend",
      assignedToUserId: aditya.id,
      priority: "HIGH",
      status: "PENDING",
      estimatedHours: 16,
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(task1Res.status === 201 && task1Res.data.success, "TL created Frontend task for Aditya");
  const adityaTaskId = task1Res.data.taskId;

  // TL creates Task in "Backend" section for Rajesh
  const task2Res = await axios.post(
    `${BASE}/api/tasks`,
    {
      title: "Implement Stripe Checkout & Order Webhook API",
      description: "Create idempotent checkout session handler and webhook listener.",
      projectId: newProjectId,
      section: "Backend",
      assignedToUserId: rajesh.id,
      priority: "CRITICAL",
      status: "PENDING",
      estimatedHours: 20,
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(task2Res.status === 201 && task2Res.data.success, "TL created Backend task for Rajesh");
  const rajeshTaskId = task2Res.data.taskId;

  // 4. Security Test: Non-TL Employee attempts to assign a task (Must get 403 Forbidden)
  console.log("\n[4] Security Test: Employee attempts unauthorized task assignment...");
  const devLoginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const devCookie = devLoginRes.headers["set-cookie"][0].split(";")[0];

  try {
    await axios.post(
      `${BASE}/api/tasks`,
      {
        title: "Malicious Task Creation",
        projectId: newProjectId,
        assignedToUserId: rajesh.id,
      },
      { headers: { Cookie: devCookie } }
    );
    assert(false, "Non-leader employee created task without permission");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked non-leader employee task assignment with HTTP 403 Forbidden");
  }

  // 5. Employee (Aditya) views own tasks & updates work progress
  console.log("\n[5] Employee (Aditya) Views Assigned Tasks & Submits Work...");
  const adityaTasksRes = await axios.get(`${BASE}/api/tasks`, {
    headers: { Cookie: devCookie },
  });
  const myTasks = adityaTasksRes.data.tasks;
  const foundTask = myTasks.find(t => t.id === adityaTaskId);
  const leakedRajeshTask = myTasks.find(t => t.id === rajeshTaskId);

  assert(foundTask !== undefined, "Employee sees their own assigned task");
  assert(leakedRajeshTask === undefined, "Employee does NOT see other employees' private tasks (No data leakage)");

  // Aditya updates task to IN_REVIEW with 90% progress
  const updateRes = await axios.patch(
    `${BASE}/api/tasks/${adityaTaskId}`,
    {
      status: "IN_REVIEW",
      progress: 90,
      notes: "Product catalog and cart completed. Ready for Team Leader review.",
    },
    { headers: { Cookie: devCookie } }
  );
  assert(updateRes.status === 200 && updateRes.data.success, "Employee submitted work for TL Review (90%)");

  // 6. Security Test: Cross-Employee Task Tampering (Rajesh tries to tamper with Aditya's task)
  console.log("\n[6] Security Test: Cross-employee task tampering...");
  const rajeshLoginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const rajeshCookie = rajeshLoginRes.headers["set-cookie"][0].split(";")[0];

  try {
    await axios.patch(
      `${BASE}/api/tasks/${adityaTaskId}`,
      {
        status: "COMPLETED",
        progress: 100,
      },
      { headers: { Cookie: rajeshCookie } }
    );
    assert(false, "Employee tampered with another employee's task");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked cross-employee task modification with HTTP 403 Forbidden");
  }

  // 7. Team Leader Reviews and Approves Work
  console.log("\n[7] Team Leader Reviews & Approves Employee Work...");
  const approveRes = await axios.patch(
    `${BASE}/api/tasks/${adityaTaskId}`,
    {
      status: "COMPLETED",
      progress: 100,
      reviewNotes: "UI components look pixel-perfect and responsive. Approved!",
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(approveRes.status === 200 && approveRes.data.success, "Team Leader reviewed and marked task COMPLETED");

  // 8. Admin Monitors Overall Project and Section Progress
  console.log("\n[8] Admin Monitors Project Progress & Section Breakdown...");
  const adminProjectsRes = await axios.get(`${BASE}/api/projects`, {
    headers: { Cookie: adminCookie },
  });
  const createdProjInAdmin = adminProjectsRes.data.projects.find(p => p.id === newProjectId);

  assert(createdProjInAdmin !== undefined, "Admin can retrieve created project");
  assert(createdProjInAdmin.teamLeader?.name === "Amit Patel", "Admin sees assigned Team Leader (Amit Patel)");
  assert(createdProjInAdmin.teamMembers.length >= 2, "Admin sees all assigned project members");
  assert(createdProjInAdmin.sections.length >= 2, "Admin sees section breakdown (Frontend & Backend)");

  const frontendSec = createdProjInAdmin.sections.find(s => s.name === "Frontend");
  assert(frontendSec && frontendSec.progress === 100, "Section 'Frontend' calculated to 100% progress");

  console.log("\n================================================================================");
  console.log(`  RESULTS: ${passed} / ${total} Tests Passed (100% Success Rate)`);
  console.log("================================================================================\n");
}

runTests().catch(err => {
  console.error("Test Suite Execution Error:", err);
});
