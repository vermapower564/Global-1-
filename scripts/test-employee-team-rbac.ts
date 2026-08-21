import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getEmployeeTeam } from "../app/api/employee/team/route";
import { GET as getAdminEmployee } from "../app/api/admin/employees/[employeeId]/route";
import { POST as postTasks } from "../app/api/tasks/route";
import { PATCH as patchTask } from "../app/api/tasks/[id]/route";

async function testEmployeeTeamRbac() {
  console.log("========================================================================");
  console.log("  TEST SUITE: EMPLOYEE TEAM PAGE — STRICT VIEW SCOPE & RBAC AUDIT");
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

  const employeeToken = generateToken({
    id: "cmsmz0w4k0000v0tqnws34osn",
    employeeId: "EMP-6841",
    role: "EMPLOYEE",
    email: "rajesh.khanna@global.com",
    name: "Rajesh Khanna",
  });

  // 1. Employee fetches team view
  console.log("[1] TEST 1: Employee accesses /api/employee/team:");
  {
    const req = new NextRequest("http://localhost:3000/api/employee/team", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const res = await getEmployeeTeam(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Employee team overview retrieved (200 OK)");

    // Verify team members have NO senior management roles
    const SENIOR_ROLES = ["ADMIN", "SUPER_ADMIN", "HR", "PROJECT_MANAGER", "TEAM_LEADER", "ADMIN_HR", "DIRECTOR", "FINANCE"];
    let seniorExposed = false;

    (json.projects || []).forEach((p: any) => {
      (p.teamMembers || []).forEach((m: any) => {
        if (SENIOR_ROLES.includes((m.role || "").toUpperCase())) {
          seniorExposed = true;
          console.error("Exposed senior role in team members:", m.role, m.name);
        }
      });
    });

    assert(!seniorExposed, "Senior management roles strictly excluded from Employee team roster");
    assert(json.projects?.length > 0, "Authorized projects returned with real metrics and sections");
  }

  // 2. Employee attempts to access senior management profile (/api/admin/employees/[id])
  console.log("\n[2] TEST 2: Employee attempts to view Admin Employee profile (/api/admin/employees/EMP-8222):");
  {
    const req = new NextRequest("http://localhost:3000/api/admin/employees/EMP-8222", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const res = await getAdminEmployee(req, { params: Promise.resolve({ employeeId: "EMP-8222" }) });
    assert(res.status === 403, "Senior/Admin employee management profile blocked with 403 Forbidden");
  }

  // 3. Employee attempts to assign work (+ Assign Work / POST /api/tasks)
  console.log("\n[3] TEST 3: Employee attempts to assign a task via POST /api/tasks:");
  {
    const req = new NextRequest("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({
        title: "Unauthorized Employee Assignment",
        section: "Backend",
        assignedToUserId: "EMP-7592",
      }),
    });
    const res = await postTasks(req);
    assert(res.status === 403, "Task assignment by Employee blocked with 403 Forbidden");
  }

  // 4. Employee attempts to reassign task owner via PATCH /api/tasks/[id]
  console.log("\n[4] TEST 4: Employee attempts to transfer/reassign task ownership:");
  {
    const req = new NextRequest("http://localhost:3000/api/tasks/TSK-TEST-101", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({
        assignedToUserId: "EMP-9999",
      }),
    });
    const res = await patchTask(req, { params: Promise.resolve({ id: "TSK-TEST-101" }) });
    assert(res.status === 403 || res.status === 404, "Task reassignment / transfer by Employee blocked (403 Forbidden)");
  }

  console.log("\n========================================================================");
  console.log(`  EMPLOYEE TEAM RBAC AUDIT: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  if (failed > 0) process.exit(1);
}

testEmployeeTeamRbac().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
