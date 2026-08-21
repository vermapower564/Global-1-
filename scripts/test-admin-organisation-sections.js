const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testOrganisation() {
  console.log("==================================================================");
  console.log("  TESTING ADMIN ORGANISATION SECTIONS & WORK DETAILS");
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

  // 3. Verify Project Managers section data
  console.log("\n[1] Project Managers Section:");
  assert(Array.isArray(projectManagers) && projectManagers.length > 0, `Found ${projectManagers.length} Project Manager(s)`);
  const pm = projectManagers[0];
  assert(pm.name && pm.employeeId, `PM Name: ${pm.name}, ID: ${pm.employeeId}`);
  assert(typeof pm.totalProjects === "number", `Total Projects: ${pm.totalProjects}`);
  assert(typeof pm.activeProjectsCount === "number", `Active Projects: ${pm.activeProjectsCount}`);
  assert(typeof pm.projectCompletionRate === "number", `Completion Rate: ${pm.projectCompletionRate}%`);
  assert(typeof pm.teamLeadersManagedCount === "number", `Team Leaders Managed: ${pm.teamLeadersManagedCount}`);
  assert(typeof pm.workload === "number", `Current Workload: ${pm.workload}%`);
  assert(pm.status === "ACTIVE" || pm.status === "INACTIVE", `Status: ${pm.status}`);
  assert(Array.isArray(pm.projects), `Managed Projects List: ${pm.projects.length} project(s)`);

  // 4. Verify Team Leaders section data
  console.log("\n[2] Team Leaders Section:");
  assert(Array.isArray(teamLeaders) && teamLeaders.length > 0, `Found ${teamLeaders.length} Team Leader(s)`);
  const tl = teamLeaders[0];
  assert(tl.name && tl.employeeId, `TL Name: ${tl.name}, ID: ${tl.employeeId}`);
  assert(typeof tl.projectsCount === "number", `Projects Handled: ${tl.projectsCount}`);
  assert(typeof tl.teamSize === "number", `Team Size: ${tl.teamSize} members`);
  assert(typeof tl.projectProgress === "number", `Project Progress: ${tl.projectProgress}%`);
  assert(typeof tl.taskCompletionPct === "number", `Task Completion: ${tl.taskCompletionPct}%`);
  assert(typeof tl.performanceScore === "number", `Performance Score: ${tl.performanceScore}%`);
  assert(typeof tl.workload === "number", `Workload: ${tl.workload}%`);
  assert(Array.isArray(tl.projects), `Handled Projects List: ${tl.projects.length} project(s)`);
  if (tl.projects.length > 0) {
    const proj = tl.projects[0];
    assert(Array.isArray(proj.members), `Project '${proj.projectTitle}' members list: ${proj.members.length} member(s)`);
    assert(Array.isArray(proj.tasks), `Project '${proj.projectTitle}' tasks list: ${proj.tasks.length} task(s)`);
  }

  // 5. Verify Employees section data
  console.log("\n[3] Employees Section:");
  assert(Array.isArray(employees) && employees.length > 0, `Found ${employees.length} Employee(s)`);
  const emp = employees[0];
  assert(emp.name && emp.employeeId, `Employee Name: ${emp.name}, ID: ${emp.employeeId}`);
  assert(typeof emp.tasksAssignedCount === "number", `Assigned Tasks: ${emp.tasksAssignedCount}`);
  assert(typeof emp.completionPct === "number", `Completion %: ${emp.completionPct}%`);
  assert(typeof emp.performanceScore === "number", `Performance Score: ${emp.performanceScore}%`);
  assert(Array.isArray(emp.currentWork), `Current Active Tasks: ${emp.currentWork.length} task(s)`);
  assert(Array.isArray(emp.workHistory), `Work History Tasks: ${emp.workHistory.length} task(s)`);

  // 6. Security Check: Ensure sensitive data is NOT returned
  console.log("\n[4] Security & Confidentiality Check:");
  assert(pm.password === undefined, "PM Password field omitted");
  assert(pm.salary === undefined, "PM Salary field omitted");
  assert(pm.bankDetail === undefined, "PM Bank detail field omitted");
  assert(tl.password === undefined, "TL Password field omitted");
  assert(tl.salary === undefined, "TL Salary field omitted");
  assert(emp.password === undefined, "Employee Password field omitted");
  assert(emp.salary === undefined, "Employee Salary field omitted");

  // 7. Organisation Page GET test
  console.log("\n[5] Organisation Page Load Check:");
  const pageRes = await axios.get(`${BASE_URL}/admin/organisation`, {
    headers: { Cookie: cookie },
  });
  assert(pageRes.status === 200, "Organisation Page (/admin/organisation) loaded with status 200");

  console.log("\n==================================================================");
  console.log(`  RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

testOrganisation().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
