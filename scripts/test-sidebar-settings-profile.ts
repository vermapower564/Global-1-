import fs from "fs";
import path from "path";

async function testSidebarNavigation() {
  console.log("==================================================================");
  console.log("  OMS SIDEBAR AUDIT: SETTINGS -> PROFILE STRUCTURE FOR ALL ROLES");
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

  const sidebarPath = path.join(process.cwd(), "components", "Sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Verify ADMIN sections
  console.log("[1] Checking ADMIN navigation structure:");
  assert(content.includes('title: isSuperAdmin ? "SUPER ADMIN" : "ADMINISTRATION"'), "Admin section title declared");
  assert(!content.includes('{ name: "Profile", href: "/employee/profile", icon: IconSettings }'), "No standalone Profile in main Admin items");
  assert(content.includes('name: "Audit Logs", href: "/admin/audit-logs"'), "Admin includes Audit Logs");
  assert(content.includes('subItems: [{ name: "Profile", href: "/employee/profile", icon: IconUser }]'), "Settings contains nested Profile subItem");

  // Verify HR sections
  console.log("\n[2] Checking HR navigation structure:");
  assert(content.includes('title: "HUMAN RESOURCES"'), "HR section title declared");
  assert(content.includes('name: "Onboarding", href: "/hr/onboarding"'), "HR includes Onboarding");
  assert(content.includes('name: "Resignation", href: "/hr/resignation"'), "HR includes Resignation");
  assert(content.includes('name: "Departments", href: "/hr/departments"'), "HR includes Departments");

  // Verify PROJECT MANAGER sections
  console.log("\n[3] Checking PROJECT MANAGER navigation structure:");
  assert(content.includes('title: "PROJECT MANAGER"'), "PM section title declared");
  assert(content.includes('name: "Workboard", href: "/team-leader/tasks"'), "PM includes Workboard");
  assert(content.includes('name: "Daily Updates", href: "/admin/work"'), "PM includes Daily Updates");

  // Verify TEAM LEADER sections
  console.log("\n[4] Checking TEAM LEADER navigation structure:");
  assert(content.includes('title: "TEAM LEADER"'), "TL section title declared");
  assert(content.includes('name: "My Projects", href: "/employee/projects"'), "TL includes My Projects");
  assert(content.includes('name: "Daily Updates", href: "/team-leader/reviews"'), "TL includes Daily Updates");

  // Verify EMPLOYEE sections
  console.log("\n[5] Checking EMPLOYEE navigation structure:");
  assert(content.includes('title: "EMPLOYEE"'), "Employee section title declared");
  assert(content.includes('name: "My Tasks", href: "/employee/tasks"'), "Employee includes My Tasks");
  assert(content.includes('name: "Daily Work", href: "/employee/work"'), "Employee includes Daily Work");

  // Verify Submenu rendering
  console.log("\n[6] Checking Submenu Rendering and Active Highlights:");
  assert(content.includes("subItems"), "SubItems mapped and rendered");
  assert(content.includes("└──"), "Indented subItem branch icon rendered");
  assert(content.includes('href="/employee/profile"'), "Profile link points to /employee/profile");

  // Verify Settings page has Profile quick access
  console.log("\n[7] Checking Settings Page Profile Integration:");
  const settingsPath = path.join(process.cwd(), "app", "settings", "page.tsx");
  const settingsContent = fs.readFileSync(settingsPath, "utf-8");
  assert(settingsContent.includes('href="/employee/profile"'), "Settings page has direct link to /employee/profile");
  assert(settingsContent.includes("My User Profile"), "Settings page has My User Profile banner");

  console.log("\n==================================================================");
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

testSidebarNavigation();
