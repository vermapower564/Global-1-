import fs from "fs";
import path from "path";

function testAdminEmployeesRoute() {
  console.log("==================================================================");
  console.log("  TEST: ADMIN EMPLOYEES ROUTE AUDIT");
  console.log("==================================================================\n");

  const pagePath = path.join(process.cwd(), "app", "admin", "employees", "page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  console.log("[1] Checking app/admin/employees/page.tsx content:");
  if (content.includes("router.replace('/admin/organisation')") || content.includes('router.replace("/admin/organisation")') || content.includes("Redirecting to Organisation")) {
    console.error("  ✗ FAIL: app/admin/employees/page.tsx still contains redirect to organisation!");
    process.exit(1);
  } else {
    console.log("  ✓ PASS: No redirect to /admin/organisation found in /admin/employees.");
  }

  if (content.includes("EmployeesPage")) {
    console.log("  ✓ PASS: app/admin/employees/page.tsx renders the complete EmployeesPage component.");
  } else {
    console.error("  ✗ FAIL: EmployeesPage not rendered in /admin/employees.");
    process.exit(1);
  }

  console.log("\n==================================================================");
  console.log("  ALL CHECKS PASSED: /admin/employees correctly renders Employees Directory!");
  console.log("==================================================================\n");
}

testAdminEmployeesRoute();
