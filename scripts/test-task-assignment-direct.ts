import { queryDb } from "../lib/db";
import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getEmployees } from "../app/api/employees/route";
import { GET as getTasks, POST as postTask } from "../app/api/tasks/route";
import { GET as getTaskDetail, PATCH as patchTask } from "../app/api/tasks/[id]/route";

async function runDirectTaskTests() {
  console.log("==================================================================");
  console.log("  OMS DIRECT TEST SUITE: TASK ASSIGNMENT, ROLE FILTERING & LIFECYCLE");
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
  const empReq = new NextRequest("http://localhost:3000/api/employees?role=PROJECT_MANAGER,TEAM_LEADER", {
    headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
  });
  const empRes = await getEmployees(empReq);
  const empJson = await empRes.json();
  assert(empRes.status === 200, "Assignees endpoint responded 200 OK");
  assert(Array.isArray(empJson.data) && empJson.data.length > 0, "Assignees list returned data");

  const invalidRoles = (empJson.data || []).filter(
    (u: any) => !["PROJECT_MANAGER", "TEAM_LEADER"].includes(u.role)
  );
  assert(invalidRoles.length === 0, "Assignees list strictly contains ONLY PROJECT_MANAGER and TEAM_LEADER (no Developers, HR, Finance, etc.)");

  console.log("\n[2] Testing Backend Role Validation on Task Creation:");
  const invalidAssignReq = new NextRequest("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    body: JSON.stringify({
      title: "Test Invalid Assignee Task",
      assignedToUserId: devUser.id,
      priority: "HIGH",
    }),
  });
  const invalidAssignRes = await postTask(invalidAssignReq);
  const invalidAssignJson = await invalidAssignRes.json();
  assert(invalidAssignRes.status === 400, "Backend rejected task assignment for non-PM/TL role with 400 Bad Request");
  assert(invalidAssignJson.error?.includes("Invalid Assignee") || invalidAssignJson.error?.includes("Project Manager or Team Leader"), "Returned invalid assignee error message");

  console.log("\n[3] Testing Task Creation with Existing Project:");
  const existingProjTaskReq = new NextRequest("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    body: JSON.stringify({
      title: "Test Task with Existing Project",
      assignedToUserId: tlUser.id,
      projectId: existingProject.id,
      priority: "HIGH",
    }),
  });
  const existingProjTaskRes = await postTask(existingProjTaskReq);
  const existingProjTaskJson = await existingProjTaskRes.json();
  assert(existingProjTaskRes.status === 201, "Task created successfully with existing project");
  const taskIdExisting = existingProjTaskJson.taskId;

  const dbTask1 = (await queryDb<any[]>(`SELECT projectId, manualProjectName FROM task WHERE id = ?`, [taskIdExisting]))[0];
  assert(dbTask1.projectId === existingProject.id, "Database saved exact existing projectId");
  assert(dbTask1.manualProjectName === null, "Database set manualProjectName to null");

  console.log("\n[4] Testing Task Creation with Manual Project Name:");
  const manualProjTaskReq = new NextRequest("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    body: JSON.stringify({
      title: "Test Task with Manual Project",
      assignedToUserId: pmUser.id,
      projectId: "__MANUAL__",
      manualProjectName: "Internal Architecture Documentation",
      priority: "MEDIUM",
    }),
  });
  const manualProjTaskRes = await postTask(manualProjTaskReq);
  const manualProjTaskJson = await manualProjTaskRes.json();
  assert(manualProjTaskRes.status === 201, "Task created successfully with manual project name");
  const taskIdManual = manualProjTaskJson.taskId;

  const dbTask2 = (await queryDb<any[]>(`SELECT projectId, manualProjectName FROM task WHERE id = ?`, [taskIdManual]))[0];
  assert(dbTask2.projectId === null, "Database saved projectId as null for manual project");
  assert(dbTask2.manualProjectName === "Internal Architecture Documentation", "Database saved manualProjectName");

  console.log("\n[5] Testing Validation for Empty Manual Project Name:");
  const emptyManualReq = new NextRequest("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    body: JSON.stringify({
      title: "Test Task with Empty Manual Project",
      assignedToUserId: pmUser.id,
      projectId: "__MANUAL__",
      manualProjectName: "",
      priority: "MEDIUM",
    }),
  });
  const emptyManualRes = await postTask(emptyManualReq);
  const emptyManualJson = await emptyManualRes.json();
  assert(emptyManualRes.status === 400, "Rejected empty manual project name with 400 Bad Request");
  assert(emptyManualJson.error === "Please enter a project name.", "Returned 'Please enter a project name.' validation message");

  console.log("\n[6] Testing Task Details Display & Project Source:");
  const detailReq1 = new NextRequest(`http://localhost:3000/api/tasks/${taskIdExisting}`, {
    headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
  });
  const detailRes1 = await getTaskDetail(detailReq1, { params: Promise.resolve({ id: taskIdExisting }) });
  const detailJson1 = await detailRes1.json();
  assert(detailJson1.task?.projectSource === "Existing Project", "Existing project reports projectSource = 'Existing Project'");
  assert(detailJson1.task?.project?.projectTitle === existingProject.projectTitle, "Correct projectTitle returned");

  const detailReq2 = new NextRequest(`http://localhost:3000/api/tasks/${taskIdManual}`, {
    headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
  });
  const detailRes2 = await getTaskDetail(detailReq2, { params: Promise.resolve({ id: taskIdManual }) });
  const detailJson2 = await detailRes2.json();
  assert(detailJson2.task?.projectSource === "Manually Entered", "Manual project reports projectSource = 'Manually Entered'");
  assert(detailJson2.task?.project?.projectTitle === "Internal Architecture Documentation", "Correct manual projectTitle returned");
  assert(detailJson2.task?.isObserver === true, "Admin view returns isObserver = true (Read Only)");

  console.log("\n[7] Testing Admin Lockout from START TASK & Execution Updates:");
  // Admin tries to call action: "START_TASK"
  const adminStartReq = new NextRequest(`http://localhost:3000/api/tasks/${taskIdManual}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    body: JSON.stringify({ action: "START_TASK" }),
  });
  const adminStartRes = await patchTask(adminStartReq, { params: Promise.resolve({ id: taskIdManual }) });
  assert(adminStartRes.status === 403, "Admin attempt to call START_TASK rejected with 403 Forbidden");

  // Admin tries to change progress % directly
  const adminProgressReq = new NextRequest(`http://localhost:3000/api/tasks/${taskIdManual}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    body: JSON.stringify({ progress: 80 }),
  });
  const adminProgressRes = await patchTask(adminProgressReq, { params: Promise.resolve({ id: taskIdManual }) });
  assert(adminProgressRes.status === 403, "Admin attempt to modify execution progress rejected with 403 Forbidden");

  console.log("\n[8] Testing Assigned Team Leader START TASK & Execution:");
  // Team Leader starts their assigned task
  const tlStartReq = new NextRequest(`http://localhost:3000/api/tasks/${taskIdExisting}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
    body: JSON.stringify({ action: "START_TASK" }),
  });
  const tlStartRes = await patchTask(tlStartReq, { params: Promise.resolve({ id: taskIdExisting }) });
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

runDirectTaskTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
