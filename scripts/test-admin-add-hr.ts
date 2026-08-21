import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { POST as postEmployee, GET as getEmployees } from "../app/api/employees/route";
import { GET as getHr } from "../app/api/hr/route";
import { PATCH as patchLeave } from "../app/api/leave/route";
import { GET as getAuditLogs } from "../app/api/audit-logs/route";
import { queryDb } from "../lib/db";

async function testAdminAddHr() {
  console.log("========================================================================");
  console.log("  OMS TEST SUITE: ADMIN ADD HR USER & RBAC PERMISSION AUDIT");
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

  // Admin and Super Admin tokens
  const superAdminToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "SUPER_ADMIN" });
  const adminToken = generateToken({ id: "ADM-9001", email: "admin.user@global.com", role: "ADMIN_HR" });
  const empToken = generateToken({ id: "EMP-6841", email: "rajesh.khanna@global.com", role: "EMPLOYEE" });
  const pmToken = generateToken({ id: "EMP-8222", email: "vikram.singh@global.com", role: "PROJECT_MANAGER" });

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testHrEmail = `hr.test${randomSuffix}@gmail.com`;
  const testHrEmpId = `HR-${randomSuffix}`;
  let createdHrUserId = "";

  // TEST 1: Admin creates HR user with role = 'HR'
  console.log("[1] TEST 1: Admin creates HR user via POST /api/employees:");
  {
    const req = new NextRequest("http://localhost:3000/api/employees", {
      method: "POST",
      headers: { Authorization: `Bearer ${superAdminToken}`, Cookie: `oms_session=${superAdminToken}` },
      body: JSON.stringify({
        id: testHrEmpId,
        name: `Priya Sharma HR ${randomSuffix}`,
        email: testHrEmail,
        phone: "+91 98765 43210",
        department: "Human Resources",
        role: "HR",
        salary: "750000",
        password: "Roushan@123",
      }),
    });
    const res = await postEmployee(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Admin successfully created HR user", json.data?.employeeId);
    assert(json.data?.role === "HR", "Created user role is explicitly 'HR'");
    createdHrUserId = json.data?.id;
  }

  // TEST 2: Verify user row in database
  console.log("\n[2] TEST 2: Verify user record in database:");
  {
    const users = await queryDb<any[]>(
      `SELECT id, employeeId, name, email, role, isActive FROM user WHERE email = ?`,
      [testHrEmail]
    );
    assert(users && users.length > 0, "User found in database");
    assert(users[0]?.role === "HR", "Database role is 'HR' (NOT 'EMPLOYEE')", `role: ${users[0]?.role}`);
    assert(users[0]?.employeeId === testHrEmpId, "Employee ID preserved", users[0]?.employeeId);
  }

  // TEST 3: Audit Log verification
  console.log("\n[3] TEST 3: Audit Log recorded HR_USER_CREATED action:");
  {
    const logs = await queryDb<any[]>(
      `SELECT * FROM auditlog WHERE action = 'HR_USER_CREATED' AND details LIKE ? ORDER BY timestamp DESC LIMIT 1`,
      [`%${testHrEmpId}%`]
    );
    assert(logs && logs.length > 0, "HR_USER_CREATED audit log found");
    assert(logs[0]?.details.includes("Role: HR"), "Audit details specify HR role", logs[0]?.details);
  }

  // Generate token for newly created HR user
  const newHrToken = generateToken({ id: createdHrUserId, email: testHrEmail, role: "HR" });

  // TEST 4 & 5: HR User can access HR Dashboard
  console.log("\n[4-5] TESTS 4-5: HR user accesses HR Dashboard (/api/hr):");
  {
    const req = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${newHrToken}`, Cookie: `oms_session=${newHrToken}` },
    });
    const res = await getHr(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "HR user can access GET /api/hr", `status: ${res.status}`);
    assert(json.summary !== undefined, "HR Dashboard returns summary metrics");
  }

  // TEST 6: HR User can manage Leave Requests (PATCH /api/leave)
  console.log("\n[6] TEST 6: HR user has Leave Approval authorization:");
  {
    // Check permission without invalid ID (verifying non-403)
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${newHrToken}`, Cookie: `oms_session=${newHrToken}` },
      body: JSON.stringify({ id: "NON_EXISTENT_ID", status: "APPROVED", hrRemarks: "Test by HR" }),
    });
    const res = await patchLeave(req);
    assert(res.status !== 403, "HR user is authorized (status not 403 Forbidden)", `status: ${res.status}`);
  }

  // TEST 7: Non-HR User (Employee) blocked from HR Dashboard
  console.log("\n[7] TEST 7: Employee blocked from HR Dashboard (403 Forbidden):");
  {
    const req = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const res = await getHr(req);
    assert(res.status === 403, "Employee blocked from /api/hr with 403 Forbidden");
  }

  // TEST 8: Project Manager blocked from HR Dashboard
  console.log("\n[8] TEST 8: Project Manager blocked from HR Dashboard (403 Forbidden):");
  {
    const req = new NextRequest("http://localhost:3000/api/hr", {
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
    });
    const res = await getHr(req);
    assert(res.status === 403, "Project Manager blocked from /api/hr with 403 Forbidden");
  }

  // TEST 9: HR User blocked from Admin-only Audit Logs
  console.log("\n[9] TEST 9: HR User blocked from Super Admin Audit Logs (403 Forbidden):");
  {
    const req = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      headers: { Authorization: `Bearer ${newHrToken}`, Cookie: `oms_session=${newHrToken}` },
    });
    const res = await getAuditLogs(req);
    assert(res.status === 403, "HR blocked from /api/admin/audit-logs with 403 Forbidden");
  }

  // TEST 10: HR User visible in Employees list with role 'HR'
  console.log("\n[10] TEST 10: HR User visible with role 'HR' in employee directory:");
  {
    const req = new NextRequest("http://localhost:3000/api/employees", {
      headers: { Authorization: `Bearer ${superAdminToken}`, Cookie: `oms_session=${superAdminToken}` },
    });
    const res = await getEmployees(req);
    const json = await res.json();
    const found = (json.data || []).find((u: any) => u.email === testHrEmail);
    assert(found !== undefined, "HR user listed in directory");
    assert(found?.role === "HR", "Role displayed as HR", found?.role);
  }

  console.log("\n========================================================================");
  console.log(`  ADMIN ADD HR AUDIT COMPLETE: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

testAdminAddHr().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
