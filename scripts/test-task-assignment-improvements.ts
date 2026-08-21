import { queryDb } from "../lib/db";
import { generateToken } from "../lib/authService";

async function runTaskAssignmentTests() {
  console.log("==================================================================");
  console.log("  OMS TEST SUITE: TASK ASSIGNMENT, ROLE FILTERING & LIFECYCLE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Setup Auth Tokens
  const adminToken = generateToken({
    id: "EMP-8595",
    email: "roushan.verma@global.com",
    role: "SUPER_ADMIN",
  });

  const pmToken = generateToken({
    id: "EMP-8222",
    email: "vikram.singh@global.com",
    role: "PROJECT_MANAGER",
  });

  const tlToken = generateToken({
    id: "EMP-7592",
    email: "amit.patel@global.com",
    role: "TEAM_LEADER",
  });

  const devToken = generateToken({
    id: "EMP-6841",
    email: "rajesh.khanna@global.com",
    role: "DEVELOPER",
  });

  // Get real PM, TL, and Dev user records from TiDB
  const pmUser = (await queryDb<any[]>(`SELECT id, employeeId, role, name FROM user WHERE role = 'PROJECT_MANAGER' LIMIT 1`))[0];
  const tlUser = (await queryDb<any[]>(`SELECT id, employeeId, role, name FROM user WHERE role = 'TEAM_LEADER' LIMIT 1`))[0];
  const devUser = (await queryDb<any[]>(`SELECT id, employeeId, role, name FROM user WHERE role = 'DEVELOPER' LIMIT 1`))[0];
  const existingProject = (await queryDb<any[]>(`SELECT id, projectTitle FROM project LIMIT 1`))[0];

  console.log("[1] Testing Assignee Backend Role Filtering:");
  // Query /api/employees?role=PROJECT_MANAGER,TEAM_LEADER
  const empRes = await fetch("http://localhost:3000/api/employees?role=PROJECT_MANAGER,TEAM_LEADER", {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
  });
  const empJson = await empRes.json();
  assert(empRes.status === 200, "Assignees endpoint responded 200 OK");
  assert(Array.isArray(empJson.data) && empJson.data.length > 0, "Assignees list returned data");
  
  const invalidRoles = (empJson.data || []).filter(
    (u: any) => !["PROJECT_MANAGER", "TEAM_LEADER"].includes(u.role)
  );
  assert(invalidRoles.length === 0, "Dropdown/API contains ONLY PROJECT_MANAGER and TEAM_LEADER (no Developers, HR, Finance, etc.)");

  console.log("\n[2] Testing Backend Role Validation on Task Creation:");
  // Attempt to assign task to Developer (EMP-6841) from Admin
  const invalidAssignRes = await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: "Test Invalid Assignee Task",
      assignedToUserId: devUser.id,
      priority: "HIGH",
    }),
  });
  const invalidAssignJson = await invalidAssignRes.json();
  assert(invalidAssignRes.status === 400, "Backend rejected task creation for non-PM/TL role with 400 Bad Request");
  assert(invalidAssignJson.error?.includes("Invalid Assignee") || invalidAssignJson.error?.includes("Project Manager or Team Leader"), "Correct error message returned");

  console.log("\n[3] Testing Task Creation with Existing Project:");
  const existingProjTaskRes = await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: "Test Task with Existing Project",
      assignedToUserId: tlUser.id,
      projectId: existingProject.id,
      priority: "HIGH",
    }),
  });
  const existingProjTaskJson = await existingProjTaskRes.json();
  assert(existingProjTaskRes.status === 201, "Task created successfully with existing project");
  const taskIdExisting = existingProjTaskJson.taskId;

  const dbTask1 = (await queryDb<any[]>(`SELECT projectId, manualProjectName FROM task WHERE id = ?`, [taskIdExisting]))[0];
  assert(dbTask1.projectId === existingProject.id, "Database saved exact existing projectId");
  assert(dbTask1.manualProjectName === null, "Database set manualProjectName to null");

  console.log("\n[4] Testing Task Creation with Manual Project Name:");
  const manualProjTaskRes = await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: "Test Task with Manual Project",
      assignedToUserId: pmUser.id,
      projectId: "__MANUAL__",
      manualProjectName: "Internal Architecture Documentation",
      priority: "MEDIUM",
    }),
  });
  const manualProjTaskJson = await manualProjTaskRes.json();
  assert(manualProjTaskRes.status === 201, "Task created successfully with manual project name");
  const taskIdManual = manualProjTaskJson.taskId;

  const dbTask2 = (await queryDb<any[]>(`SELECT projectId, manualProjectName FROM task WHERE id = ?`, [taskIdManual]))[0];
  assert(dbTask2.projectId === null, "Database saved projectId as null for manual project");
  assert(dbTask2.manualProjectName === "Internal Architecture Documentation", "Database saved manualProjectName");

  console.log("\n[5] Testing Validation for Empty Manual Project Name:");
  const emptyManualRes = await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: "Test Task with Empty Manual Project",
      assignedToUserId: pmUser.id,
      projectId: "__MANUAL__",
      manualProjectName: "",
      priority: "MEDIUM",
    }),
  });
  const emptyManualJson = await emptyManualRes.json();
  assert(emptyManualRes.status === 400, "Rejected empty manual project name with 400 Bad Request");
  assert(emptyManualJson.error === "Please enter a project name.", "Returned 'Please enter a project name.' validation error");

  console.log("\n[6] Testing Task Details Display & Project Source:");
  const detailRes1 = await fetch(`http://localhost:3000/api/tasks/${taskIdExisting}`, {
    headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
  });
  const detailJson1 = await detailRes1.json();
  assert(detailJson1.task?.projectSource === "Existing Project", "Existing project reports projectSource = 'Existing Project'");
  assert(detailJson1.task?.project?.projectTitle === existingProject.projectTitle, "Correct projectTitle displayed");

  const detailRes2 = await fetch(`http://localhost:3000/api/tasks/${taskIdManual}`, {
    headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
  });
  const detailJson2 = await detailRes2.json();
  assert(detailJson2.task?.projectSource === "Manually Entered", "Manual project reports projectSource = 'Manually Entered'");
  assert(detailJson2.task?.project?.projectTitle === "Internal Architecture Documentation", "Correct manual projectTitle displayed");
  assert(detailJson2.task?.isObserver === true, "Admin view identified as isObserver = true (Read Only)");

  console.log("\n[7] Testing Admin Lockout from START TASK & Execution Updates:");
  // Admin tries to call action: "START_TASK"
  const adminStartRes = await fetch(`http://localhost:3000/api/tasks/${taskIdManual}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
    body: JSON.stringify({ action: "START_TASK" }),
  });
  assert(adminStartRes.status === 403, "Admin attempt to call START_TASK rejected with 403 Forbidden");

  // Admin tries to change progress % directly
  const adminProgressRes = await fetch(`http://localhost:3000/api/tasks/${taskIdManual}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `oms_session=${adminToken}`,
    },
    body: JSON.stringify({ progress: 80 }),
  });
  assert(adminProgressRes.status === 403, "Admin attempt to modify execution progress rejected with 403 Forbidden");

  console.log("\n[8] Testing Assigned Team Leader START TASK & Execution:");
  // Team Leader starts their assigned task
  const tlStartRes = await fetch(`http://localhost:3000/api/tasks/${taskIdExisting}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tlToken}`,
      Cookie: `oms_session=${tlToken}`,
    },
    body: JSON.stringify({ action: "START_TASK" }),
  });
  assert(tlStartRes.status === 200, "Assigned Team Leader can start task (200 OK)");

  const dbTaskAfterStart = (await queryDb<any[]>(`SELECT status, progress FROM task WHERE id = ?`, [taskIdExisting]))[0];
  assert(dbTaskAfterStart.status === "IN_PROGRESS", "Task status transitioned to IN_PROGRESS");

  // Cleanup test tasks
  await queryDb(`DELETE FROM task WHERE id IN (?, ?)`, [taskIdExisting, taskIdManual]);

  console.log("\n==================================================================");
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTaskAssignmentTests();
