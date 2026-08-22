import fs from "fs";
import path from "path";

// Load .env variables
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

import { queryDb } from "../lib/db";

async function testAdminOrganisationHRSection() {
  console.log("==================================================================");
  console.log("  OMS ADMIN ORGANISATION: 4-ROLE ARCHITECTURE & HR SECTION AUDIT");
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

  try {
    // 1. Fetch all users from DB
    const users: any[] = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.departmentId,
              u.joiningDate, u.isActive, u.isResigned, u.avatarUrl,
              d.name as departmentName
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       ORDER BY u.name ASC`
    );

    console.log(`[1] Total Users in Organization DB: ${users.length}`);

    // Categorization logic matching API
    const projectManagers = users.filter((u) => u.role === "PROJECT_MANAGER");
    const teamLeaders = users.filter((u) => u.role === "TEAM_LEADER");
    const humanResources = users.filter((u) => u.role === "HR" || u.role === "ADMIN_HR");
    const employees = users.filter(
      (u) =>
        u.role !== "SUPER_ADMIN" &&
        u.role !== "PROJECT_MANAGER" &&
        u.role !== "TEAM_LEADER" &&
        u.role !== "HR" &&
        u.role !== "ADMIN_HR"
    );

    console.log(`    - Project Managers: ${projectManagers.length}`);
    console.log(`    - Team Leaders:     ${teamLeaders.length}`);
    console.log(`    - Employees:        ${employees.length}`);
    console.log(`    - Human Resources:  ${humanResources.length}\n`);

    // 2. Audit Category Integrity & Zero-Overlap Check
    console.log("[2] Category Overlap & Uniqueness Verification:");
    const pmIds = new Set(projectManagers.map((u) => u.id));
    const tlIds = new Set(teamLeaders.map((u) => u.id));
    const hrIds = new Set(humanResources.map((u) => u.id));
    const empIds = new Set(employees.map((u) => u.id));

    // Overlap checks
    const pmTlOverlap = [...pmIds].filter((id) => tlIds.has(id));
    const pmHrOverlap = [...pmIds].filter((id) => hrIds.has(id));
    const tlHrOverlap = [...tlIds].filter((id) => hrIds.has(id));
    const empHrOverlap = [...empIds].filter((id) => hrIds.has(id));
    const empPmOverlap = [...empIds].filter((id) => pmIds.has(id));
    const empTlOverlap = [...empIds].filter((id) => tlIds.has(id));

    assert(pmTlOverlap.length === 0, "No overlap between PM and TL");
    assert(pmHrOverlap.length === 0, "No overlap between PM and HR");
    assert(tlHrOverlap.length === 0, "No overlap between TL and HR");
    assert(empHrOverlap.length === 0, "No overlap between Employee and HR");
    assert(empPmOverlap.length === 0, "No overlap between Employee and PM");
    assert(empTlOverlap.length === 0, "No overlap between Employee and TL");

    // 3. Audit HR Users Data Completeness
    console.log("\n[3] Human Resources (HR) Data Completeness:");
    assert(humanResources.length > 0, "At least 1 HR user exists in the organization");

    humanResources.forEach((hr) => {
      console.log(`    Auditing HR: ${hr.name} (${hr.employeeId || hr.id})`);
      assert(Boolean(hr.id), `HR user ${hr.name} has valid ID`);
      assert(Boolean(hr.employeeId), `HR user ${hr.name} has Employee ID`);
      assert(Boolean(hr.email), `HR user ${hr.name} has Email`);
      assert(hr.role === "HR" || hr.role === "ADMIN_HR", `HR user ${hr.name} has HR role`);
      assert(hr.isActive === 1 || hr.isActive === true || hr.isActive === 0, `HR user ${hr.name} has valid status`);
    });

    // 4. Verify Frontend Page Code Requirements
    console.log("\n[4] Organization Page Code Structure Verification:");
    const fs = require("fs");
    const path = require("path");
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), "app", "admin", "organisation", "page.tsx"),
      "utf-8"
    );

    assert(pageContent.includes('"HUMAN_RESOURCES"'), 'Page supports "HUMAN_RESOURCES" TabType');
    assert(pageContent.includes("HR (Human Resources)"), "Page renders HR (Human Resources) main tab button");
    assert(pageContent.includes("Human Resources (HR) View"), "Page renders Human Resources dedicated table view");
    assert(pageContent.includes("handleSelectPerson(hr)"), "HR name and ID are clickable and trigger profile view");
    assert(pageContent.includes('selectedPerson.role === "HR"'), "Page renders dedicated HR operations & responsibilities dossier");
    assert(pageContent.includes("Employee onboarding and offboarding"), "Page represents HR responsibilities correctly");

    console.log("\n==================================================================");
    console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("==================================================================\n");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

testAdminOrganisationHRSection();
