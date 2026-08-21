import { generateToken } from "../lib/authService";
import { queryDb } from "../lib/db";
import { NextRequest } from "next/server";

// Import all main API handlers directly to test execution and data responses
import { GET as getEmployees } from "../app/api/employees/route";
import { GET as getTasks } from "../app/api/tasks/route";
import { GET as getProjects } from "../app/api/projects/route";
import { GET as getAttendance } from "../app/api/attendance/route";
import { GET as getDepartments } from "../app/api/departments/route";
import { GET as getAuditLogs } from "../app/api/audit-logs/route";
import { GET as getBlockers } from "../app/api/blockers/route";
import { GET as getDailyWork } from "../app/api/daily-work/route";
import { GET as getHealth } from "../app/api/health/route";
import { GET as getAuthMe } from "../app/api/auth/me/route";
import { GET as getReviews } from "../app/api/reviews/route";
import { GET as getPayroll } from "../app/api/payroll/route";
import { GET as getSalarySlips } from "../app/api/admin/salary-slips/route";
import { GET as getOrg } from "../app/api/admin/organisation/route";
import { GET as getToday } from "../app/api/admin/today/route";
import { GET as getTLSummary } from "../app/api/team-leader/summary/route";
import { GET as getPMSummary } from "../app/api/project-manager/summary/route";
import { GET as getInterns } from "../app/api/interns/route";
import { GET as getClients } from "../app/api/clients/route";
import { GET as getITAssets } from "../app/api/it-assets/route";

async function runComprehensiveSystemTest() {
  console.log("========================================================================");
  console.log("  OMS COMPREHENSIVE SYSTEM & PAGE INTEGRITY AUDIT TEST SUITE");
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

  // Tokens for each distinct role
  const adminToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "SUPER_ADMIN" });
  const pmToken = generateToken({ id: "EMP-8222", email: "vikram.singh@global.com", role: "PROJECT_MANAGER" });
  const tlToken = generateToken({ id: "EMP-7592", email: "amit.patel@global.com", role: "TEAM_LEADER" });
  const devToken = generateToken({ id: "EMP-6841", email: "rajesh.khanna@global.com", role: "DEVELOPER" });
  const hrToken = generateToken({ id: "EMP-7001", email: "hr@global.com", role: "HR" });
  const financeToken = generateToken({ id: "EMP-7002", email: "finance@global.com", role: "FINANCE" });

  console.log("--- 1. PUBLIC & AUTHENTICATION ENDPOINTS ---");
  {
    const req = new NextRequest("http://localhost:3000/api/health");
    const res = await getHealth(req);
    assert(res.status === 200, "Health Check API (/api/health)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getAuthMe(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Super Admin Auth Me (/api/auth/me)", `Logged in as ${json.user?.name || json.user?.email}`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
    });
    const res = await getAuthMe(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Project Manager Auth Me (/api/auth/me)", `Role: ${json.user?.role}`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
    });
    const res = await getAuthMe(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Team Leader Auth Me (/api/auth/me)", `Role: ${json.user?.role}`);
  }

  console.log("\n--- 2. ADMIN & CORE OPERATIONS API ENDPOINTS ---");
  {
    const req = new NextRequest("http://localhost:3000/api/employees", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getEmployees(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Employees Directory API (/api/employees)", `${json.data?.length || 0} employees loaded`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/tasks", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getTasks(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Tasks Management API (/api/tasks)", `${json.tasks?.length || 0} tasks loaded`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/projects", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getProjects(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Projects Portfolio API (/api/projects)", `${json.projects?.length || 0} projects loaded`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/attendance", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getAttendance(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Attendance Real-Time Ledger (/api/attendance)", `Today's default punches loaded`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/departments", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getDepartments(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Departments Ledger API (/api/departments)", `${json.departments?.length || 0} departments`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/audit-logs", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getAuditLogs(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Audit Logs API (/api/audit-logs)", `${json.logs?.length || 0} audit trails`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/blockers", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getBlockers(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Blockers & Impairments API (/api/blockers)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/daily-work", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getDailyWork(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Daily Work Updates API (/api/daily-work)", `${json.data?.length || 0} logs`);
  }
  {
    const req = new NextRequest("http://localhost:3000/api/admin/salary-slips", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getSalarySlips(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Admin Salary Slips API (/api/admin/salary-slips)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/admin/organisation", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getOrg(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Organisation Hierarchy API (/api/admin/organisation)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/admin/today", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getToday(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Today Workforce Activity API (/api/admin/today)");
  }

  console.log("\n--- 3. ROLE-SPECIFIC WORKSPACES & SUMMARY APIS ---");
  {
    const req = new NextRequest("http://localhost:3000/api/team-leader/summary", {
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
    });
    const res = await getTLSummary(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Team Leader Summary API (/api/team-leader/summary)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/project-manager/summary", {
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
    });
    const res = await getPMSummary(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Project Manager Summary API (/api/project-manager/summary)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/reviews", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getReviews(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Customer & Internal Reviews API (/api/reviews)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/payroll", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getPayroll(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Payroll Records API (/api/payroll)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/interns", {
      headers: { Authorization: `Bearer ${hrToken}`, Cookie: `oms_session=${hrToken}` },
    });
    const res = await getInterns(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Interns Management API (/api/interns)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/clients", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getClients(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "Clients Management API (/api/clients)");
  }
  {
    const req = new NextRequest("http://localhost:3000/api/it-assets", {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
    });
    const res = await getITAssets(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "IT Assets Management API (/api/it-assets)");
  }

  console.log("\n--- 4. DATABASE INTEGRITY & CORE TABLES AUDIT ---");
  const tables = [
    "user",
    "project",
    "task",
    "attendance",
    "department",
    "auditlog",
    "salaryslip",
    "bankdetail",
    "taskhistory",
    "customerreview",
  ];

  for (const table of tables) {
    try {
      const countRes = await queryDb<any[]>(`SELECT COUNT(*) as count FROM ${table}`);
      const count = countRes[0]?.count || 0;
      assert(true, `Database Table: ${table}`, `${count} records`);
    } catch (e: any) {
      assert(false, `Database Table: ${table}`, e.message);
    }
  }

  console.log("\n========================================================================");
  console.log(`  SYSTEM AUDIT COMPLETE: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runComprehensiveSystemTest().catch((err) => {
  console.error("System audit failure:", err);
  process.exit(1);
});
