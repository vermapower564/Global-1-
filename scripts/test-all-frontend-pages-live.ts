import { generateToken } from "../lib/authService";

async function verifyAllPagesInBrowserContext() {
  console.log("========================================================================");
  console.log("  OMS ALL-PAGE HTTP STATUS AUDIT (http://localhost:3000)");
  console.log("========================================================================\n");

  const adminToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "SUPER_ADMIN" });
  const pmToken = generateToken({ id: "EMP-8222", email: "vikram.singh@global.com", role: "PROJECT_MANAGER" });
  const tlToken = generateToken({ id: "EMP-7592", email: "amit.patel@global.com", role: "TEAM_LEADER" });
  const devToken = generateToken({ id: "EMP-6841", email: "rajesh.khanna@global.com", role: "DEVELOPER" });
  const hrToken = generateToken({ id: "EMP-7001", email: "hr@global.com", role: "HR" });
  const financeToken = generateToken({ id: "EMP-7002", email: "finance@global.com", role: "FINANCE" });

  const pages = [
    // 1. Public & Auth Pages
    { path: "/login", name: "Login Portal" },
    { path: "/auth/login", name: "Auth Login View" },
    { path: "/auth/register", name: "Register Page" },
    { path: "/auth/forgot-password", name: "Forgot Password" },
    { path: "/auth/onboarding", name: "Onboarding Flow" },

    // 2. Admin Hub Pages
    { path: "/admin", name: "Admin Home" },
    { path: "/admin/dashboard", name: "Admin Dashboard" },
    { path: "/admin/attendance", name: "Admin Attendance Ledger (Today's Punches Default)" },
    { path: "/admin/tasks", name: "Admin Tasks & Assignment Board" },
    { path: "/admin/projects", name: "Admin Projects Portfolio" },
    { path: "/admin/employees", name: "Admin Employees Directory" },
    { path: "/admin/project-managers", name: "Admin Project Managers" },
    { path: "/admin/reports", name: "Admin Executive Reports" },
    { path: "/admin/salary-slips", name: "Admin Salary Slips" },
    { path: "/admin/reviews", name: "Admin Reviews" },
    { path: "/admin/audit-logs", name: "Admin Audit Logs" },
    { path: "/admin/blockers", name: "Admin Blockers Ledger" },
    { path: "/admin/feature-requests", name: "Admin Feature Requests" },
    { path: "/admin/organisation", name: "Admin Organisation Structure" },
    { path: "/admin/resignations", name: "Admin Resignations" },
    { path: "/admin/today", name: "Admin Today Workforce Activity" },
    { path: "/admin/work", name: "Admin Daily Work" },

    // 3. Project Manager Pages
    { path: "/project-manager", name: "PM Dashboard" },
    { path: "/project-manager/create-project", name: "PM Create Project (Auto-TL Allocation)" },
    { path: "/project-manager/tasks", name: "PM Tasks" },
    { path: "/project-manager/progress", name: "PM Progress" },
    { path: "/project-manager/team-leaders", name: "PM Team Leaders" },
    { path: "/project-manager/reports", name: "PM Reports" },
    { path: "/project-manager/performance", name: "PM Performance" },
    { path: "/project-manager/promotions", name: "PM Promotions" },

    // 4. Team Leader Pages
    { path: "/team-leader", name: "Team Leader Dashboard" },
    { path: "/team-leader/tasks", name: "Team Leader Tasks & Lifecycle Execution" },
    { path: "/team-leader/team", name: "Team Leader Team View" },
    { path: "/team-leader/progress", name: "Team Leader Progress" },
    { path: "/team-leader/reviews", name: "Team Leader Reviews" },
    { path: "/team-leader/assign-work", name: "Team Leader Work Assignment" },

    // 5. Employee Workspace Pages
    { path: "/employee", name: "Employee Home" },
    { path: "/employee/dashboard", name: "Employee Dashboard" },
    { path: "/employee/tasks", name: "Employee Tasks & Execution" },
    { path: "/employee/work", name: "Employee Work Submission" },
    { path: "/employee/projects", name: "Employee Projects" },
    { path: "/employee/salary", name: "Employee Salary Slips" },
    { path: "/employee/attendance", name: "Employee Attendance & Punch" },
    { path: "/employee/reviews", name: "Employee Reviews" },
    { path: "/employee/feedback", name: "Employee Feedback" },
    { path: "/employee/reports", name: "Employee Reports" },
    { path: "/employee/profile", name: "Employee Profile" },
    { path: "/employee/team", name: "Employee Team View" },

    // 6. HR & Finance Pages
    { path: "/hr", name: "HR Dashboard" },
    { path: "/hr/interns", name: "HR Interns Portal" },
    { path: "/hr/intern-certificate", name: "HR Certificate Generator" },
    { path: "/hr/intern-promotion", name: "HR Intern Promotion" },
    { path: "/hr/join-qr", name: "HR Join QR Code" },
    { path: "/finance", name: "Finance Dashboard" },
    { path: "/finance/payroll/approvals", name: "Finance Payroll Approvals" },
    { path: "/finance/payroll/billing", name: "Finance Billing & Invoices" },

    // 7. Departmental Hubs
    { path: "/development", name: "Development Hub" },
    { path: "/design", name: "Design Hub" },
    { path: "/marketing", name: "Marketing Hub" },
    { path: "/seo", name: "SEO Hub" },
    { path: "/video-production", name: "Video Production Hub" },
    { path: "/sales", name: "Sales Hub" },
    { path: "/it-assets", name: "IT Assets Ledger" },
    { path: "/clients", name: "Clients Hub" },
    { path: "/payroll", name: "Payroll Hub" },
    { path: "/attendance", name: "Attendance Hub" },
    { path: "/daily-work", name: "Daily Work Hub" },
  ];

  let passed = 0;
  let failed = 0;

  for (const page of pages) {
    try {
      const res = await fetch(`http://localhost:3000${page.path}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
      });

      if (res.status === 200 || res.status === 307 || res.status === 308) {
        console.log(`  ✓ OK [${res.status}]: ${page.name} (${page.path})`);
        passed++;
      } else {
        console.error(`  ✗ FAIL [${res.status}]: ${page.name} (${page.path})`);
        failed++;
      }
    } catch (e: any) {
      console.error(`  ✗ ERROR: ${page.name} (${page.path}) -> ${e.message}`);
      failed++;
    }
  }

  console.log("\n========================================================================");
  console.log(`  ALL-PAGE AUDIT SUMMARY: ${passed + failed} Pages | ${passed} OK | ${failed} FAILED`);
  console.log("========================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

verifyAllPagesInBrowserContext().catch((e) => {
  console.error("Page verification error:", e);
  process.exit(1);
});
