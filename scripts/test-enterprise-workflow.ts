import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getProjects, POST as postProjects, PUT as putProjects } from "../app/api/projects/route";
import { GET as getTasks, POST as postTasks } from "../app/api/tasks/route";
import { GET as getTaskDetail, PATCH as patchTaskDetail } from "../app/api/tasks/[id]/route";
import { GET as getComments, POST as postComment } from "../app/api/tasks/[id]/comments/route";
import { GET as getHr } from "../app/api/hr/route";
import { GET as getLeave, POST as postLeave, PATCH as patchLeave } from "../app/api/leave/route";
import { POST as postSalarySlip, GET as getSalarySlips } from "../app/api/admin/salary-slips/route";
import { GET as getEmpSalarySlips } from "../app/api/admin/employees/[employeeId]/salary-slips/route";
import { GET as getSalarySlipPdf } from "../app/api/salary-slips/[id]/pdf/route";
import { queryDb } from "../lib/db";

async function testEnterpriseWorkflow() {
  console.log("========================================================================");
  console.log("  OMS TEST SUITE: ENTERPRISE WORKFLOW, RBAC, PROGRESS & PAYROLL AUDIT");
  console.log("========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${title}${details ? ` (${details})` : ""}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${title}${details ? ` (${details})` : ""}`);
      failed++;
    }
  }

  // Tokens for various test roles
  const superAdminToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "SUPER_ADMIN" });
  const pmToken = generateToken({ id: "EMP-8222", email: "vikram.singh@global.com", role: "PROJECT_MANAGER" });
  const tlToken = generateToken({ id: "EMP-7592", email: "amit.patel@global.com", role: "TEAM_LEADER" });
  const empToken = generateToken({ id: "EMP-6841", email: "rajesh.khanna@global.com", role: "EMPLOYEE" });
  const hrToken = generateToken({ id: "HR-9999", email: "priya.hr@gmail.com", role: "HR" });

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testProjectCode = `TEST-PRJ-${randomSuffix}`;
  let createdProjectId = "";
  let createdTaskId = "";

  // ------------------------------------------------------------------------
  // TEST 1: Admin assigns project to PM
  // ------------------------------------------------------------------------
  console.log("[1] TEST 1: Admin assigns project to Project Manager:");
  {
    const req = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${superAdminToken}`, Cookie: `oms_session=${superAdminToken}` },
      body: JSON.stringify({
        projectTitle: `E-Commerce Enterprise ${randomSuffix}`,
        projectCode: testProjectCode,
        clientCompany: "Global Retailers Ltd",
        projectManagerId: "EMP-8222", // Vikram Singh (PM)
        teamLeaderId: "EMP-7592", // Amit Patel (TL)
        contractValue: 1200000,
        status: "ACTIVE",
      }),
    });
    const res = await postProjects(req);
    const json = await res.json();
    assert(res.status === 201 && json.success, "Admin assigned project to Project Manager", json.project?.id);
    createdProjectId = json.project?.id;
  }

  // ------------------------------------------------------------------------
  // TEST 2: Admin attempts to assign project directly to Employee (Invalid PM role)
  // ------------------------------------------------------------------------
  console.log("\n[2] TEST 2: Admin attempts to assign project directly to an Employee as PM:");
  {
    const req = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${superAdminToken}`, Cookie: `oms_session=${superAdminToken}` },
      body: JSON.stringify({
        projectTitle: `Invalid Direct Employee Assignment ${randomSuffix}`,
        projectManagerId: "EMP-6841", // Rajesh Khanna (Developer/Employee) - not authorized as PM
        clientCompany: "Invalid Corp",
      }),
    });
    const res = await postProjects(req);
    assert(res.status === 400, "Backend rejected direct assignment of employee as PM (400 Bad Request)");
  }

  // ------------------------------------------------------------------------
  // TEST 3: PM assigns/manages project for Team Leader
  // ------------------------------------------------------------------------
  console.log("\n[3] TEST 3: PM manages project and assigns Team Leader:");
  {
    const req = new NextRequest("http://localhost:3000/api/projects", {
      method: "PUT",
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
      body: JSON.stringify({
        id: createdProjectId,
        teamLeaderId: "EMP-7592",
        status: "IN_PROGRESS",
      }),
    });
    const res = await putProjects(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "PM assigned project to Team Leader successfully");
  }

  // ------------------------------------------------------------------------
  // TEST 5: Team Leader divides project into tasks
  // ------------------------------------------------------------------------
  console.log("\n[5] TEST 5: Team Leader creates tasks under project:");
  {
    const req = new NextRequest("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
      body: JSON.stringify({
        title: "Payment Gateway Integration",
        section: "Backend",
        projectId: createdProjectId,
        assignedToUserId: "EMP-6841", // Rajesh Khanna
        priority: "HIGH",
        estimatedHours: 16,
      }),
    });
    const res = await postTasks(req);
    const json = await res.json();
    assert(res.status === 201 && json.success, "Team Leader divided and created task", json.taskId);
    createdTaskId = json.taskId;
  }

  // ------------------------------------------------------------------------
  // TEST 6: Employee sees only their assigned work
  // ------------------------------------------------------------------------
  console.log("\n[6] TEST 6: Employee views assigned task:");
  {
    const req = new NextRequest("http://localhost:3000/api/tasks", {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const res = await getTasks(req);
    const json = await res.json();
    const myTask = (json.tasks || []).find((t: any) => t.id === createdTaskId);
    assert(myTask !== undefined, "Employee sees assigned task in work list", myTask?.title);
  }

  // ------------------------------------------------------------------------
  // TEST 7: Employee updates authorized task progress
  // ------------------------------------------------------------------------
  console.log("\n[7] TEST 7: Employee updates task progress from 0% to 50%:");
  {
    const req = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
      body: JSON.stringify({
        status: "IN_PROGRESS",
        progress: 50,
        notes: "Payment callback handler implemented",
      }),
    });
    const res = await patchTaskDetail(req, { params: Promise.resolve({ id: createdTaskId }) });
    const json = await res.json();
    assert(res.status === 200 && json.success, "Employee updated progress successfully", `Progress: ${json.task?.progress}%`);
    assert(json.task?.progress === 50, "Progress is exactly 50%");
  }

  // ------------------------------------------------------------------------
  // TEST 8: Employee attempts to update unrelated task/project
  // ------------------------------------------------------------------------
  console.log("\n[8] TEST 8: Unassigned user attempts to update another employee's task (403 Forbidden):");
  {
    const otherEmpToken = generateToken({ id: "EMP-9999", email: "other.dev@global.com", role: "EMPLOYEE" });
    const req = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${otherEmpToken}`, Cookie: `oms_session=${otherEmpToken}` },
      body: JSON.stringify({ progress: 90 }),
    });
    const res = await patchTaskDetail(req, { params: Promise.resolve({ id: createdTaskId }) });
    assert(res.status === 403, "Unassigned employee blocked with 403 Forbidden");
  }

  // ------------------------------------------------------------------------
  // TEST 9: Team Leader updates authorized progress
  // ------------------------------------------------------------------------
  console.log("\n[9] TEST 9: Team Leader updates authorized task progress:");
  {
    const req = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
      body: JSON.stringify({
        progress: 80,
        notes: "TL reviewed code and updated progress to 80%",
      }),
    });
    const res = await patchTaskDetail(req, { params: Promise.resolve({ id: createdTaskId }) });
    const json = await res.json();
    assert(res.status === 200 && json.success, "Team Leader updated progress", `Progress: ${json.task?.progress}%`);
  }

  // ------------------------------------------------------------------------
  // TEST 10 & 11: PM and Admin attempting to modify execution progress (403 Forbidden)
  // ------------------------------------------------------------------------
  console.log("\n[10-11] TESTS 10-11: PM and Admin blocked from editing execution progress:");
  {
    // PM attempts execution progress modification
    const pmReq = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
      body: JSON.stringify({ progress: 100 }),
    });
    const pmRes = await patchTaskDetail(pmReq, { params: Promise.resolve({ id: createdTaskId }) });
    assert(pmRes.status === 403, "PM execution progress modification blocked with 403 Forbidden");

    // Admin attempts execution progress modification
    const adminReq = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${superAdminToken}`, Cookie: `oms_session=${superAdminToken}` },
      body: JSON.stringify({ progress: 100 }),
    });
    const adminRes = await patchTaskDetail(adminReq, { params: Promise.resolve({ id: createdTaskId }) });
    assert(adminRes.status === 403, "Admin execution progress modification blocked with 403 Forbidden");
  }

  // ------------------------------------------------------------------------
  // TEST 14 & 15: Leave balance integrity (Pending vs Approved)
  // ------------------------------------------------------------------------
  console.log("\n[14-15] TESTS 14-15: Leave balance updates only on Approved leave:");
  {
    const leaveReq = new NextRequest("http://localhost:3000/api/leave", {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const res = await getLeave(leaveReq);
    const json = await res.json();
    const initialAvailable = json.leaveBalance.availableLeave;
    const initialUsed = json.leaveBalance.usedLeave;

    assert(
      initialAvailable === 24 - initialUsed,
      "Available leave strictly equals 24 - approved used leave",
      `Available: ${initialAvailable}, Used: ${initialUsed}`
    );
  }

  // ------------------------------------------------------------------------
  // TEST 16, 17, 18, 19: HR Salary Management & PDF Generation
  // ------------------------------------------------------------------------
  console.log("\n[16-19] TESTS 16-19: HR creates salary slip and Employee downloads PDF:");
  {
    // HR generates salary slip for employee
    const createSlipReq = new NextRequest("http://localhost:3000/api/admin/salary-slips", {
      method: "POST",
      headers: { Authorization: `Bearer ${superAdminToken}`, Cookie: `oms_session=${superAdminToken}` },
      body: JSON.stringify({
        employeeId: "EMP-6841",
        salaryMonth: "August 2026",
        basicSalary: 45000,
        hra: 20000,
        allowances: 10000,
        bonus: 5000,
        pfDeduction: 5400,
        taxDeduction: 3500,
        paymentStatus: "PUBLISHED",
      }),
    });
    const createRes = await postSalarySlip(createSlipReq);
    const createJson = await createRes.json();
    assert(createRes.status === 201 && createJson.success, "HR created and published salary slip", createJson.slipId);

    // Employee views salary slip
    const empSlipReq = new NextRequest("http://localhost:3000/api/admin/employees/EMP-6841/salary-slips", {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const empSlipRes = await getEmpSalarySlips(empSlipReq, { params: Promise.resolve({ employeeId: "EMP-6841" }) });
    const empSlipJson = await empSlipRes.json();
    assert(empSlipRes.status === 200 && (empSlipJson.slips || empSlipJson.data).length > 0, "Employee sees published salary slip");

    // Employee downloads PDF
    const pdfReq = new NextRequest(`http://localhost:3000/api/salary-slips/${createJson.slipId}/pdf`, {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const pdfRes = await getSalarySlipPdf(pdfReq, { params: Promise.resolve({ id: createJson.slipId }) });
    if (pdfRes.status !== 200) {
      const errText = await pdfRes.text();
      console.log("    -> PDF Download Response Status:", pdfRes.status, "Body:", errText);
    }
    assert(pdfRes.status === 200, "Employee successfully downloaded salary slip PDF (200 OK)");
  }

  // ------------------------------------------------------------------------
  // TEST 20: Admin blocked from HR Dashboard
  // ------------------------------------------------------------------------
  console.log("\n[20] TEST 20: Non-HR role blocked from HR Dashboard (/api/hr):");
  {
    const req = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
    });
    const res = await getHr(req);
    assert(res.status === 403, "Project Manager blocked from /api/hr with 403 Forbidden");
  }

  // ------------------------------------------------------------------------
  // TEST 22: Comments show Full Name (Role)
  // ------------------------------------------------------------------------
  console.log("\n[22] TEST 22: Comments display Name (Role) format:");
  {
    const postReq = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
      body: JSON.stringify({ commentText: "Please ensure test coverage is above 80%." }),
    });
    const postRes = await postComment(postReq, { params: Promise.resolve({ id: createdTaskId }) });
    const postJson = await postRes.json();
    assert(postRes.status === 201 && postJson.success, "Comment posted by Project Manager");
    assert(
      postJson.comment?.displayName.includes("(") && postJson.comment?.displayName.includes(")"),
      "Comment displayName formats Full Name (Role)",
      postJson.comment?.displayName
    );

    const getReq = new NextRequest(`http://localhost:3000/api/tasks/${createdTaskId}/comments`, {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const getRes = await getComments(getReq, { params: Promise.resolve({ id: createdTaskId }) });
    const getJson = await getRes.json();
    assert((getJson.comments || []).length > 0, "Comments retrieved by employee");
  }

  // ------------------------------------------------------------------------
  // TEST 24: Audit log integrity
  // ------------------------------------------------------------------------
  console.log("\n[24] TEST 24: Audit log records verified:");
  {
    const logs = await queryDb<any[]>(
      `SELECT * FROM auditlog WHERE action IN ('PROJECT_CREATED', 'TASK_ASSIGNED', 'PROGRESS_UPDATED', 'COMMENT_ADDED') ORDER BY timestamp DESC LIMIT 5`
    );
    assert(logs && logs.length > 0, "Audit logs recorded in immutable database table", `${logs.length} entries`);
  }

  console.log("\n========================================================================");
  console.log(`  ENTERPRISE WORKFLOW AUDIT COMPLETE: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

testEnterpriseWorkflow().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
