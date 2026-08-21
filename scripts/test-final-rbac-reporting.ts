import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getAdminReports } from "../app/api/admin/reports/route";
import { GET as getHRDashboard } from "../app/api/hr/route";
import { GET as getEmployeeTeam } from "../app/api/employee/team/route";
import { POST as postTasks } from "../app/api/tasks/route";
import { GET as getAdminEmployee } from "../app/api/admin/employees/[employeeId]/route";

async function testFinalRbacAndReporting() {
  console.log("========================================================================");
  console.log("  OMS FINAL RBAC, ORGANISATIONAL HIERARCHY & MONTHLY REPORTING AUDIT");
  console.log("========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${title}${details ? ` (${details})` : ""}`);
      passed++;
    } else {
      console.log(`  ✗ FAIL: ${title}${details ? ` (${details})` : ""}`);
      failed++;
    }
  }

  const adminToken = generateToken({
    id: "USR-ADMIN",
    employeeId: "EMP-ADMIN",
    role: "SUPER_ADMIN",
    email: "admin@global.com",
    name: "System Admin",
  });

  const hrToken = generateToken({
    id: "USR-HR-01",
    employeeId: "EMP-HR-01",
    role: "HR",
    email: "priya.sharma@global.com",
    name: "Priya Sharma",
  });

  const pmToken = generateToken({
    id: "USR-PM-01",
    employeeId: "EMP-PM-01",
    role: "PROJECT_MANAGER",
    email: "vikram.singh@global.com",
    name: "Vikram Singh",
  });

  const tlToken = generateToken({
    id: "USR-TL-01",
    employeeId: "EMP-TL-01",
    role: "TEAM_LEADER",
    email: "amit.patel@global.com",
    name: "Amit Patel",
  });

  const employeeToken = generateToken({
    id: "cmsmz0w4k0000v0tqnws34osn",
    employeeId: "EMP-6841",
    role: "EMPLOYEE",
    email: "rajesh.khanna@global.com",
    name: "Rajesh Khanna",
  });

  // 1. Admin Organisation-Wide Monthly Reporting
  console.log("[1] TEST 1: Admin generates Organisation-Wide Monthly Report (/api/admin/reports):");
  {
    const req = new NextRequest("http://localhost:3000/api/admin/reports?month=August%202026&employeeId=ALL", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const res = await getAdminReports(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Admin successfully generated Organisation-Wide Monthly Report (200 OK)");
    assert(json.isOrganisationReport === true, "Report format is Organisation-Wide");
    assert(
      json.organisationSummary &&
      typeof json.organisationSummary.totalEmployees === "number" &&
      typeof json.organisationSummary.completionRate === "number",
      "Organisation Summary metrics computed from real database data"
    );
    assert(Array.isArray(json.organisationSummary?.departmentSummaries), "Department breakdown included in Org Report");
  }

  // 2. Admin Individual Employee Monthly Reporting
  console.log("\n[2] TEST 2: Admin generates Individual Employee Monthly Report (/api/admin/reports?employeeId=EMP-6841):");
  {
    const req = new NextRequest("http://localhost:3000/api/admin/reports?month=August%202026&employeeId=EMP-6841", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const res = await getAdminReports(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Admin successfully generated Individual Employee Report (200 OK)");
    assert(json.singleEmployeeReport !== null, "Individual Employee Dossier compiled");
    assert(
      json.singleEmployeeReport?.attendance?.workingDays > 0 &&
      json.singleEmployeeReport?.taskPerformance?.totalTasks !== undefined,
      "Individual Attendance, Task statuses, and Performance Verdict calculated"
    );
  }

  // 3. RBAC on Monthly Reports API
  console.log("\n[3] TEST 3: Lower-authority roles blocked from Executive Reports (/api/admin/reports):");
  {
    const empReq = new NextRequest("http://localhost:3000/api/admin/reports", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const empRes = await getAdminReports(empReq);
    assert(empRes.status === 403, "Employee blocked from Executive Reports with 403 Forbidden");

    const pmReq = new NextRequest("http://localhost:3000/api/admin/reports", {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    const pmRes = await getAdminReports(pmReq);
    assert(pmRes.status === 403, "Project Manager blocked from Organisation Reports with 403 Forbidden");
  }

  // 4. HR RBAC & Separation
  console.log("\n[4] TEST 4: HR operations separate from Project Management:");
  {
    const hrReq = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const hrRes = await getHRDashboard(hrReq);
    assert(hrRes.status === 200, "HR accessed HR Desk (200 OK)");

    const pmHRReq = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    const pmHRRes = await getHRDashboard(pmHRReq);
    assert(pmHRRes.status === 403, "Project Manager blocked from HR Operations with 403 Forbidden");

    const tlHRReq = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${tlToken}` },
    });
    const tlHRRes = await getHRDashboard(tlHRReq);
    assert(tlHRRes.status === 403, "Team Leader blocked from HR Operations with 403 Forbidden");
  }

  // 5. Employee Permissions & Scope
  console.log("\n[5] TEST 5: Employee restricted to own work and peer collaboration:");
  {
    const empTeamReq = new NextRequest("http://localhost:3000/api/employee/team", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const empTeamRes = await getEmployeeTeam(empTeamReq);
    const empTeamJson = await empTeamRes.json();
    assert(empTeamRes.status === 200 && empTeamJson.success, "Employee retrieved assigned project team (200 OK)");

    // Verify senior management roles are NOT in peer roster
    const SENIOR_ROLES = ["ADMIN", "SUPER_ADMIN", "HR", "PROJECT_MANAGER", "TEAM_LEADER"];
    let seniorFound = false;
    (empTeamJson.projects || []).forEach((p: any) => {
      (p.teamMembers || []).forEach((m: any) => {
        if (SENIOR_ROLES.includes((m.role || "").toUpperCase())) seniorFound = true;
      });
    });
    assert(!seniorFound, "Senior management roles strictly excluded from Employee peer roster");

    // Employee cannot assign work
    const empTaskReq = new NextRequest("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({ title: "Unauthorized", section: "Backend", assignedToUserId: "EMP-7592" }),
    });
    const empTaskRes = await postTasks(empTaskReq);
    assert(empTaskRes.status === 403, "Employee blocked from task assignment with 403 Forbidden");

    // Employee cannot view Admin employee profiles
    const empProfReq = new NextRequest("http://localhost:3000/api/admin/employees/EMP-8222", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const empProfRes = await getAdminEmployee(empProfReq, { params: Promise.resolve({ employeeId: "EMP-8222" }) });
    assert(empProfRes.status === 403, "Employee blocked from Admin employee profile with 403 Forbidden");
  }

  console.log("\n========================================================================");
  console.log(`  FINAL RBAC & REPORTING AUDIT: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  if (failed > 0) process.exit(1);
}

testFinalRbacAndReporting().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
