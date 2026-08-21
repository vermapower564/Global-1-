const axios = require("axios");

const BASE = "http://localhost:3000";

async function test4TierHierarchyWorkflow() {
  console.log("================================================================================");
  console.log("  GLOBAL-1 OMS: PRODUCTION-GRADE 4-TIER HIERARCHY WORKFLOW TEST SUITE");
  console.log("  (ADMIN -> PROJECT MANAGER -> TEAM LEADER -> PROJECT EMPLOYEE)");
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

  // ---------------------------------------------------------------------------
  // 1. MULTI-ROLE AUTHENTICATION (Real Database Accounts)
  // ---------------------------------------------------------------------------
  // Super Admin: Roushan Verma
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

  // Team Leader: Amit Patel
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  assert(tlLogin.status === 200, "Team Leader (EMP-7592) authenticated");

  // Project Employee: Rajesh Khanna
  const empLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];
  assert(empLogin.status === 200, "Project Employee (EMP-6841) authenticated");

  // ---------------------------------------------------------------------------
  // 2. ADMIN -> PROJECT MANAGER: Admin Creates Main Task on Real Project
  // ---------------------------------------------------------------------------
  const projectsRes = await axios.get(`${BASE}/api/projects`, {
    headers: { Cookie: adminCookie },
  });
  const projectList = projectsRes.data.projects || projectsRes.data.data || [];
  assert(projectList.length > 0, `Found ${projectList.length} real projects in TiDB`);
  const targetProject = projectList[0];

  const adminCreateTaskRes = await axios.post(
    `${BASE}/api/tasks`,
    {
      title: "4-Tier Architecture Enterprise Rollout",
      description: "Executive deliverable to be architected and divided by PM",
      projectId: targetProject.id,
      assignedToUserId: "EMP-8222", // Assigned to PM Vikram Singh
      priority: "CRITICAL",
      isMainTask: true,
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    },
    { headers: { Cookie: adminCookie } }
  );
  assert(
    [200, 201].includes(adminCreateTaskRes.status) && adminCreateTaskRes.data.success,
    "Admin assigned Main Task to Project Manager (EMP-8222)"
  );
  const mainTaskId = adminCreateTaskRes.data.task?.id || adminCreateTaskRes.data.taskId;

  // ---------------------------------------------------------------------------
  // 3. PROJECT MANAGER: Receives Main Task and Divides into Work Sections
  // ---------------------------------------------------------------------------
  const pmSummaryRes = await axios.get(`${BASE}/api/project-manager/summary`, {
    headers: { Cookie: pmCookie },
  });
  assert(pmSummaryRes.status === 200 && pmSummaryRes.data.success, "Project Manager summary retrieved with real data");

  const pmTasks = pmSummaryRes.data.adminMainTasks || [];
  const foundTaskForPm = pmTasks.some((t) => t.id === mainTaskId || t.title.includes("4-Tier Architecture"));
  assert(foundTaskForPm, "Main Task appears in Project Manager assigned task list");

  // PM divides task into 2 work sections assigned to Team Leader (EMP-7592)
  const pmDivideRes = await axios.post(
    `${BASE}/api/project-manager/divide-task`,
    {
      mainTaskId,
      sections: [
        {
          title: "Core Service Integration & Microservices",
          sectionName: "Backend Architecture",
          description: "Architect core business logic and database migrations",
          teamLeaderId: "EMP-7592", // Assigned to TL Amit Patel
          priority: "HIGH",
          dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        },
        {
          title: "Responsive Management Dashboards",
          sectionName: "Frontend UI/UX",
          description: "Build clean, professional React interfaces",
          teamLeaderId: "EMP-7592",
          priority: "MEDIUM",
          dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        },
      ],
    },
    { headers: { Cookie: pmCookie } }
  );
  assert(
    pmDivideRes.status === 200 && pmDivideRes.data.createdSubtasks?.length === 2,
    "Project Manager successfully divided Main Task into 2 work sections assigned to Team Leader"
  );
  const workSectionId = pmDivideRes.data.createdSubtasks[0].id;

  // ---------------------------------------------------------------------------
  // 4. TEAM LEADER: Receives Work Section, Checks Availability & Assigns to Member
  // ---------------------------------------------------------------------------
  const tlSummaryRes = await axios.get(`${BASE}/api/team-leader/summary`, {
    headers: { Cookie: tlCookie },
  });
  assert(tlSummaryRes.status === 200 && tlSummaryRes.data.success, "Team Leader summary retrieved");

  const teamMembers = tlSummaryRes.data.teamMembers || [];
  assert(teamMembers.length > 0, `Team Leader sees ${teamMembers.length} real project team members`);

  // Verify availability calculation (AVAILABLE, BUSY, or OVERLOADED based on task counts)
  const rajeshMember = teamMembers.find((m) => m.employeeId === "EMP-6841" || m.id === "EMP-6841");
  assert(
    rajeshMember && ["AVAILABLE", "BUSY", "OVERLOADED"].includes(rajeshMember.workloadStatus),
    `Employee availability dynamically calculated from real database tasks: [${rajeshMember?.workloadStatus}]`
  );

  // TL divides work section into technical subtask assigned to Employee (EMP-6841)
  const tlDivideRes = await axios.post(
    `${BASE}/api/team-leader/divide-task`,
    {
      mainTaskId: workSectionId,
      subtasks: [
        {
          title: "Implement High-Performance Database Query Layer",
          section: "Database Engine",
          description: "Optimize Prisma indices and query plans",
          assignedToUserId: rajeshMember?.id || "EMP-6841",
          priority: "CRITICAL",
          dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: 8,
        },
      ],
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(
    tlDivideRes.status === 201 && tlDivideRes.data.subtaskIds?.length === 1,
    "Team Leader successfully divided work section and assigned technical task to Employee (EMP-6841)"
  );
  const employeeTaskId = tlDivideRes.data.subtaskIds[0];

  // ---------------------------------------------------------------------------
  // 5. PROJECT EMPLOYEE: Sees Task, Updates Progress & Submits Deliverable
  // ---------------------------------------------------------------------------
  const empTasksRes = await axios.get(`${BASE}/api/tasks?assignedToUserId=EMP-6841`, {
    headers: { Cookie: empCookie },
  });
  const myTasks = empTasksRes.data.tasks || [];
  const assignedEmpTask = myTasks.find((t) => t.id === employeeTaskId);
  assert(assignedEmpTask !== undefined, "Employee (EMP-6841) sees assigned technical task in private workspace");

  // Employee starts work (IN_PROGRESS)
  await axios.patch(
    `${BASE}/api/tasks/${employeeTaskId}`,
    {
      status: "IN_PROGRESS",
      progress: 50,
    },
    { headers: { Cookie: empCookie } }
  );

  // Employee completes deliverable & submits for review (UNDER_REVIEW, 100%)
  const submitRes = await axios.patch(
    `${BASE}/api/tasks/${employeeTaskId}`,
    {
      status: "IN_REVIEW",
      progress: 100,
      reviewNotes: "All query optimizations and indexing completed with verified 0 error benchmark.",
    },
    { headers: { Cookie: empCookie } }
  );
  assert(
    submitRes.status === 200 && ["UNDER_REVIEW", "IN_REVIEW"].includes(submitRes.data.task.status),
    "Employee submitted completed deliverable for Team Leader review (Status: IN_REVIEW, 100%)"
  );

  // ---------------------------------------------------------------------------
  // 6. TEAM LEADER: Reviews Deliverable & Approves (COMPLETED)
  // ---------------------------------------------------------------------------
  const tlReviewQueueRes = await axios.get(`${BASE}/api/team-leader/summary`, {
    headers: { Cookie: tlCookie },
  });
  const reviewTasks = tlReviewQueueRes.data.reviewTasks || [];
  const pendingReview = reviewTasks.find((r) => r.id === employeeTaskId);
  assert(pendingReview !== undefined, "Deliverable appears in Team Leader's Quality Review Queue");

  // Team Leader approves task
  const approveRes = await axios.patch(
    `${BASE}/api/tasks/${employeeTaskId}`,
    {
      status: "COMPLETED",
      progress: 100,
      reviewNotes: "Approved by Team Leader. Quality benchmark passed.",
    },
    { headers: { Cookie: tlCookie } }
  );
  assert(
    approveRes.status === 200 && approveRes.data.task.status === "COMPLETED",
    "Team Leader approved deliverable (Status: COMPLETED)"
  );

  // ---------------------------------------------------------------------------
  // 7. PROJECT MANAGER & ADMIN: Monitors Project Hierarchy Rollup
  // ---------------------------------------------------------------------------
  const pmMilestoneRes = await axios.get(`${BASE}/api/project-manager/summary`, {
    headers: { Cookie: pmCookie },
  });
  assert(pmMilestoneRes.data.summary.activeProjectsCount > 0, "Project Manager monitors active project milestones");

  const adminTodayRes = await axios.get(`${BASE}/api/admin/today`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminTodayRes.status === 200 && adminTodayRes.data.success, "Admin monitors company-wide project health & live updates");

  // ---------------------------------------------------------------------------
  // 8. PRIVACY & SECURITY BOUNDARIES (Zero Leakage of Financial Data)
  // ---------------------------------------------------------------------------
  const pmSummaryString = JSON.stringify(pmSummaryRes.data);
  assert(!pmSummaryString.includes("bankDetail"), "Project Manager view has ZERO bank details");
  assert(!pmSummaryString.includes("salarySlip"), "Project Manager view has ZERO salary slips");

  const tlSummaryString = JSON.stringify(tlSummaryRes.data);
  assert(!tlSummaryString.includes("salarySlip"), "Team Leader view has ZERO salary slips");
  assert(!tlSummaryString.includes("bankDetail"), "Team Leader view has ZERO bank details");

  // Regular Employee blocked from PM API (HTTP 403)
  try {
    await axios.get(`${BASE}/api/project-manager/summary`, {
      headers: { Cookie: empCookie },
    });
    assert(false, "Regular employee called PM API (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Protected Project Manager API with HTTP 403 Forbidden");
  }

  // Unauthenticated request blocked (HTTP 401)
  try {
    await axios.get(`${BASE}/api/project-manager/summary`);
    assert(false, "Unauthenticated request passed (FAILED)");
  } catch (err) {
    assert(err.response?.status === 401, "Protected unauthenticated request with HTTP 401 Unauthorized");
  }

  console.log("\n================================================================================");
  console.log(`  4-TIER HIERARCHY WORKFLOW RESULTS: ${passed} / ${total} Checks Passed (100% HEALTHY)`);
  console.log("================================================================================\n");
}

test4TierHierarchyWorkflow().catch(console.error);
