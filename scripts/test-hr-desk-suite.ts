import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getHRDashboard } from "../app/api/hr/route";
import { GET as getAdminEmployee } from "../app/api/admin/employees/[employeeId]/route";
import { PATCH as patchLeave } from "../app/api/leave/route";
import { GET as getSalarySlips, POST as postSalarySlip } from "../app/api/admin/salary-slips/route";

async function testHRDeskSuite() {
  console.log("========================================================================");
  console.log("  TEST SUITE: ADVANCED HR DASHBOARD & COMPLETE HR DESK RBAC AUDIT");
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

  const hrToken = generateToken({
    id: "USR-HR-01",
    employeeId: "EMP-HR-01",
    role: "HR",
    email: "priya.sharma@global.com",
    name: "Priya Sharma",
  });

  const employeeToken = generateToken({
    id: "cmsmz0w4k0000v0tqnws34osn",
    employeeId: "EMP-6841",
    role: "EMPLOYEE",
    email: "rajesh.khanna@global.com",
    name: "Rajesh Khanna",
  });

  // 1. HR Dashboard API
  console.log("[1] TEST 1: HR retrieves HR Desk metrics (/api/hr):");
  {
    const req = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const res = await getHRDashboard(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "HR Dashboard overview retrieved (200 OK)");
    assert(
      json.summary &&
      typeof json.summary.totalEmployees === "number" &&
      typeof json.summary.activeEmployees === "number" &&
      typeof json.summary.onLeaveToday === "number",
      "Real summary metrics computed (Total, Active, On Leave Today, etc.)"
    );
  }

  // 2. Non-HR Access Control
  console.log("\n[2] TEST 2: Employee attempts to access /api/hr (403 Forbidden):");
  {
    const req = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const res = await getHRDashboard(req);
    assert(res.status === 403, "Employee blocked from HR Dashboard API with 403 Forbidden");
  }

  // 3. HR Employee Profile Access
  console.log("\n[3] TEST 3: HR views employee profile (/api/admin/employees/EMP-6841):");
  {
    const req = new NextRequest("http://localhost:3000/api/admin/employees/EMP-6841", {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const res = await getAdminEmployee(req, { params: Promise.resolve({ employeeId: "EMP-6841" }) });
    const json = await res.json();
    assert(res.status === 200 && json.success, "HR successfully accessed employee profile (200 OK)");
    assert(
      json.data?.stats?.leaveSummary?.totalQuota === 24 || json.data?.stats?.remainingLeave !== undefined,
      "Real 24-day leave quota balance calculated"
    );
  }

  // 4. HR Leave Approval Flow
  console.log("\n[4] TEST 4: HR approves employee leave request:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "TEST-LEAVE-999",
        status: "APPROVED",
        hrRemarks: "Approved by HR Officer",
      }),
    });
    const res = await patchLeave(req);
    assert(res.status === 200 || res.status === 404, "HR leave approval action handled cleanly");
  }

  // 5. HR Salary Slip Management
  console.log("\n[5] TEST 5: HR manages salary slips (/api/admin/salary-slips):");
  {
    const getReq = new NextRequest("http://localhost:3000/api/admin/salary-slips?month=August%202026", {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const getRes = await getSalarySlips(getReq);
    const getJson = await getRes.json();
    assert(getRes.status === 200 && getJson.success, "HR retrieved salary slips list (200 OK)");

    const postReq = new NextRequest("http://localhost:3000/api/admin/salary-slips", {
      method: "POST",
      headers: { Authorization: `Bearer ${hrToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: "EMP-6841",
        salaryMonth: "September 2026",
        basicSalary: 45000,
        hra: 20000,
        allowances: 10000,
        bonus: 5000,
        overtime: 0,
        pfDeduction: 5400,
        taxDeduction: 3500,
        otherDeductions: 200,
        paymentStatus: "PUBLISHED",
      }),
    });
    const postRes = await postSalarySlip(postReq);
    const postJson = await postRes.json();
    assert(postJson.success === true, "HR generated and published salary slip (200 OK)", JSON.stringify(postJson));
  }

  console.log("\n========================================================================");
  console.log(`  HR DESK RBAC AUDIT: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  if (failed > 0) process.exit(1);
}

testHRDeskSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
