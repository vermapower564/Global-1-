const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testOrganisation() {
  console.log("==================================================================");
  console.log("  TESTING ADVANCED ORGANISATION FUNCTIONALITY & WORKBOARDS");
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

  // 1. Authenticate as Super Admin
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  assert(adminLogin.data.success, "Super Admin authenticated");

  // 2. Fetch Organisation Data API
  const orgRes = await axios.get(`${BASE_URL}/api/admin/organisation`, {
    headers: { Cookie: cookie },
  });
  assert(orgRes.status === 200 && orgRes.data.success, "GET /api/admin/organisation returned 200 OK");

  const { projectManagers, teamLeaders, employees } = orgRes.data.data;

  // 3. Project Managers View Validation
  console.log("\n[1] Project Managers View & Basic Details:");
  assert(Array.isArray(projectManagers) && projectManagers.length > 0, `Found ${projectManagers.length} Project Manager(s)`);
  const pm = projectManagers[0];
  assert(pm.name && pm.employeeId && pm.role && pm.department && pm.joiningDate, "PM Basic Details complete");
  assert(typeof pm.totalProjects === "number", `Projects Managed: ${pm.totalProjects}`);
  assert(typeof pm.activeProjectsCount === "number", `Active Projects: ${pm.activeProjectsCount}`);
  assert(typeof pm.completedProjectsCount === "number", `Completed Projects: ${pm.completedProjectsCount}`);
  assert(typeof pm.delayedProjectsCount === "number", `Delayed Projects: ${pm.delayedProjectsCount}`);
  assert(Array.isArray(pm.projects), `Managed Projects List: ${pm.projects.length} project(s)`);

  // 4. Team Leaders View Validation
  console.log("\n[2] Team Leaders View & Work Overview:");
  assert(Array.isArray(teamLeaders) && teamLeaders.length > 0, `Found ${teamLeaders.length} Team Leader(s)`);
  const tl = teamLeaders[0];
  assert(tl.name && tl.employeeId && tl.role && tl.department && tl.joiningDate, "TL Basic Details complete");
  assert(typeof tl.projectsCount === "number", `Projects Handled: ${tl.projectsCount}`);
  assert(typeof tl.teamSize === "number", `Team Size: ${tl.teamSize} members`);
  assert(Array.isArray(tl.projects), `Projects & Team Work List: ${tl.projects.length} project(s)`);

  // 5. Employees View & Workboard Mathematical Reconciliation
  console.log("\n[3] Employees View & Workboard Reconciliation:");
  assert(Array.isArray(employees) && employees.length > 0, `Found ${employees.length} Employee(s)`);
  const emp = employees.find((e) => e.tasksAssignedCount > 0) || employees[0];
  assert(emp.name && emp.employeeId && emp.role && emp.department && emp.joiningDate, "Employee Basic Details complete");

  // Reconcile: Completed + In Progress + Pending + In Review + Blocked = Total Tasks
  const sumTasks =
    emp.completedTasksCount +
    emp.inProgressTasksCount +
    emp.pendingTasksCount +
    emp.inReviewTasksCount +
    emp.blockedTasksCount;
  assert(
    sumTasks === emp.tasksAssignedCount,
    `Mathematical Reconciliation: Completed(${emp.completedTasksCount}) + InProgress(${emp.inProgressTasksCount}) + Pending(${emp.pendingTasksCount}) + InReview(${emp.inReviewTasksCount}) + Blocked(${emp.blockedTasksCount}) = Total(${emp.tasksAssignedCount})`
  );

  // Check no duplicate task IDs in employee's task array
  if (emp.allTasks && emp.allTasks.length > 0) {
    const taskIds = emp.allTasks.map((t) => t.id);
    const uniqueTaskIds = new Set(taskIds);
    assert(
      taskIds.length === uniqueTaskIds.size,
      `No Duplicate Tasks: ${taskIds.length} tasks matching ${uniqueTaskIds.size} unique IDs`
    );
  }

  // 6. Today's Work & Recent Updates
  console.log("\n[4] Today's Work & Live Database Updates:");
  assert(emp.todayWork && typeof emp.todayWork.todayCompletedTasks === "number", "Today's Completed metric present");
  assert(emp.todayWork && typeof emp.todayWork.todayHours === "number", "Today's Hours metric present");
  assert(Array.isArray(emp.recentWorkUpdates), `Recent Work Updates: ${emp.recentWorkUpdates.length} update(s)`);

  // 7. Security & Confidentiality Check
  console.log("\n[5] Security & Authorisation Check:");
  assert(pm.password === undefined && pm.salary === undefined && pm.bankDetail === undefined, "PM Sensitive fields omitted");
  assert(tl.password === undefined && tl.salary === undefined && tl.bankDetail === undefined, "TL Sensitive fields omitted");
  assert(emp.password === undefined && emp.salary === undefined && emp.bankDetail === undefined, "Employee Sensitive fields omitted");

  // 8. Organisation Page Load Check
  console.log("\n[6] Organisation Page Load Check:");
  const pageRes = await axios.get(`${BASE_URL}/admin/organisation`, {
    headers: { Cookie: cookie },
  });
  assert(pageRes.status === 200, "Organisation Page (/admin/organisation) returned HTTP 200");

  console.log("\n==================================================================");
  console.log(`  RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

testOrganisation().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
