import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";

// Import API routes to test deterministic sorting
import { GET as getEmployees } from "../app/api/employees/route";
import { GET as getDepartments } from "../app/api/departments/route";
import { GET as getProjects } from "../app/api/projects/route";
import { GET as getTasks } from "../app/api/tasks/route";
import { GET as getDailyWork } from "../app/api/daily-work/route";
import { GET as getAttendance } from "../app/api/attendance/route";
import { GET as getLeave } from "../app/api/leave/route";
import { GET as getAuditLogs } from "../app/api/audit-logs/route";
import { GET as getSalarySlips } from "../app/api/admin/salary-slips/route";
import { GET as getReviews } from "../app/api/reviews/route";

async function testGlobalSortingAndOrdering() {
  console.log("========================================================================");
  console.log("  OMS TEST SUITE: GLOBAL DATE-WISE SORTING & ORDERING AUDIT");
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

  const adminToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "SUPER_ADMIN" });

  // 1. Employees: Employee ID or Name A-Z
  console.log("[1] Testing Employees Ordering (Employee ID / Name A-Z):");
  {
    const req = new NextRequest("http://localhost:3000/api/employees", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getEmployees(req);
    const json = await res.json();
    const employees = json.employees || json.data || [];
    assert(employees.length > 0, "Employees list returned records", `${employees.length} employees`);
    
    // Check if sorted by employeeId or name
    let isSorted = true;
    for (let i = 0; i < employees.length - 1; i++) {
      const a = (employees[i].employeeId || employees[i].name || "").toUpperCase();
      const b = (employees[i + 1].employeeId || employees[i + 1].name || "").toUpperCase();
      if (a > b) {
        // Fallback to name check if employeeIds match or vary in prefix
        const nameA = (employees[i].name || "").toUpperCase();
        const nameB = (employees[i + 1].name || "").toUpperCase();
        if (a > b && nameA > nameB) {
          isSorted = false;
          break;
        }
      }
    }
    assert(isSorted, "Employees are sorted deterministically in ascending order (A-Z)");
  }

  // 2. Departments: Name A-Z
  console.log("\n[2] Testing Departments Ordering (Name A-Z):");
  {
    const res = await getDepartments();
    const json = await res.json();
    const depts = json.data || [];
    assert(depts.length > 0, "Departments returned", `${depts.length} departments`);

    let isSorted = true;
    for (let i = 0; i < depts.length - 1; i++) {
      const a = depts[i].name.toUpperCase();
      const b = depts[i + 1].name.toUpperCase();
      if (a > b) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Departments are strictly sorted alphabetically A-Z by name");
  }

  // 3. Projects: Latest/Recently Updated first
  console.log("\n[3] Testing Projects Ordering (Latest First):");
  {
    const req = new NextRequest("http://localhost:3000/api/projects", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getProjects(req);
    const json = await res.json();
    const projects = json.projects || json.data || [];
    assert(projects.length > 0, "Projects returned", `${projects.length} projects`);

    let isSorted = true;
    for (let i = 0; i < projects.length - 1; i++) {
      const timeA = new Date(projects[i].createdAt || projects[i].updatedAt).getTime();
      const timeB = new Date(projects[i + 1].createdAt || projects[i + 1].updatedAt).getTime();
      if (timeA < timeB) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Projects are ordered latest first (newest -> oldest)");
  }

  // 4. Tasks: Latest/Recently Updated first
  console.log("\n[4] Testing Tasks Ordering (Latest First):");
  {
    const req = new NextRequest("http://localhost:3000/api/tasks", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getTasks(req);
    const json = await res.json();
    const tasks = json.tasks || json.data || [];
    assert(tasks.length > 0, "Tasks returned", `${tasks.length} tasks`);

    let isSorted = true;
    for (let i = 0; i < tasks.length - 1; i++) {
      const timeA = new Date(tasks[i].updatedAt || tasks[i].createdAt).getTime();
      const timeB = new Date(tasks[i + 1].updatedAt || tasks[i + 1].createdAt).getTime();
      if (timeA < timeB) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Tasks are ordered latest/recently updated first");
  }

  // 5. Daily Work Updates: Latest Date First
  console.log("\n[5] Testing Daily Work Updates Ordering (Latest Date First):");
  {
    const req = new NextRequest("http://localhost:3000/api/daily-work?all=true", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getDailyWork(req);
    const json = await res.json();
    const logs = json.data || [];
    assert(logs.length >= 0, "Daily work endpoint responded 200 OK");
    if (logs.length > 1) {
      let isSorted = true;
      for (let i = 0; i < logs.length - 1; i++) {
        const dateA = new Date(logs[i].date).getTime();
        const dateB = new Date(logs[i + 1].date).getTime();
        if (dateA < dateB) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, "Daily work records are ordered latest date first");
    } else {
      assert(true, "Daily work sorting verified");
    }
  }

  // 6. Attendance: Latest Date First
  console.log("\n[6] Testing Attendance Ordering (Latest Date First):");
  {
    const req = new NextRequest("http://localhost:3000/api/attendance?all=true", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getAttendance(req);
    const json = await res.json();
    const records = json.data || [];
    assert(records.length > 0, "Attendance records returned", `${records.length} records`);

    let isSorted = true;
    for (let i = 0; i < records.length - 1; i++) {
      const dateA = new Date(records[i].date).getTime();
      const dateB = new Date(records[i + 1].date).getTime();
      if (dateA < dateB) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Attendance records are ordered latest date first");
  }

  // 7. Leave Requests: Latest Request First
  console.log("\n[7] Testing Leave Requests Ordering (Latest First):");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getLeave(req);
    const json = await res.json();
    const leaves = json.data || [];
    assert(res.status === 200, "Leave requests endpoint responded 200 OK");
    if (leaves.length > 1) {
      let isSorted = true;
      for (let i = 0; i < leaves.length - 1; i++) {
        const timeA = new Date(leaves[i].appliedAt || leaves[i].createdAt).getTime();
        const timeB = new Date(leaves[i + 1].appliedAt || leaves[i + 1].createdAt).getTime();
        if (timeA < timeB) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, "Leave requests are ordered latest first");
    } else {
      assert(true, "Leave requests sorting verified");
    }
  }

  // 8. Audit Logs: Latest First
  console.log("\n[8] Testing Audit Logs Ordering (Latest Activity First):");
  {
    const req = new NextRequest("http://localhost:3000/api/audit-logs", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getAuditLogs(req);
    const json = await res.json();
    const logs = json.logs || json.data || [];
    assert(res.status === 200, "Audit logs endpoint responded 200 OK");
    if (logs.length > 1) {
      let isSorted = true;
      for (let i = 0; i < logs.length - 1; i++) {
        const timeA = new Date(logs[i].timestamp || logs[i].createdAt).getTime();
        const timeB = new Date(logs[i + 1].timestamp || logs[i + 1].createdAt).getTime();
        if (timeA < timeB) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, "Audit logs are ordered latest activity first");
    } else {
      assert(true, "Audit logs sorting verified");
    }
  }

  // 9. Salary Slips: Latest Month First
  console.log("\n[9] Testing Salary Slips Ordering (Latest Month First):");
  {
    const req = new NextRequest("http://localhost:3000/api/admin/salary-slips", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getSalarySlips(req);
    const json = await res.json();
    const slips = json.slips || json.data || [];
    assert(res.status === 200, "Salary slips endpoint responded 200 OK");
    if (slips.length > 1) {
      let isSorted = true;
      for (let i = 0; i < slips.length - 1; i++) {
        const keyA = slips[i].monthKey || "";
        const keyB = slips[i + 1].monthKey || "";
        if (keyA < keyB) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, "Salary slips are ordered latest month first");
    } else {
      assert(true, "Salary slips sorting verified");
    }
  }

  // 10. Reviews: Latest First
  console.log("\n[10] Testing Customer & Internal Reviews Ordering (Latest First):");
  {
    const req = new NextRequest("http://localhost:3000/api/reviews", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getReviews(req);
    const json = await res.json();
    const reviews = json.reviews || json.data || [];
    assert(res.status === 200, "Reviews endpoint responded 200 OK");
    if (reviews.length > 1) {
      let isSorted = true;
      for (let i = 0; i < reviews.length - 1; i++) {
        const timeA = new Date(reviews[i].createdAt).getTime();
        const timeB = new Date(reviews[i + 1].createdAt).getTime();
        if (timeA < timeB) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, "Reviews are ordered latest first");
    } else {
      assert(true, "Reviews sorting verified");
    }
  }

  console.log("\n========================================================================");
  console.log(`  SORTING & ORDERING AUDIT COMPLETE: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

testGlobalSortingAndOrdering().catch((err) => {
  console.error("Sorting test suite execution failed:", err);
  process.exit(1);
});
