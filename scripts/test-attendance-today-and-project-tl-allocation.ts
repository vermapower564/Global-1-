import { queryDb } from "../lib/db";
import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getAttendance } from "../app/api/attendance/route";
import { POST as postProject, GET as getProjects } from "../app/api/projects/route";

async function testAttendanceAndProjectAllocation() {
  console.log("==================================================================");
  console.log("  OMS TEST SUITE: ATTENDANCE DEFAULT TODAY & TL AUTO-ALLOCATION");
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

  const adminToken = generateToken({
    id: "EMP-8595",
    email: "roushan.verma@global.com",
    role: "SUPER_ADMIN",
  });

  const pmToken = generateToken({
    id: "EMP-8222",
    email: "vikram.singh@global.com",
    role: "PROJECT_MANAGER",
  });

  console.log("[1] Testing Attendance Default: Today's Punches");
  const attReq = new NextRequest("http://localhost:3000/api/attendance", {
    headers: { Authorization: `Bearer ${adminToken}`, Cookie: `oms_session=${adminToken}` },
  });
  const attRes = await getAttendance(attReq);
  const attJson = await attRes.json();
  assert(attRes.status === 200, "Attendance endpoint responded 200 OK");
  assert(attJson.success === true, "Attendance response success = true");
  console.log(`      Found ${attJson.data?.length || 0} punches for today.`);

  console.log("\n[2] Testing Team Leader Project Load Comparison:");
  const freeTLRows = await queryDb<any[]>(
    `SELECT u.id, u.employeeId, u.name, u.email,
            COUNT(p.id) AS activeProjectCount
     FROM user u
     LEFT JOIN project p ON u.id = p.teamLeaderId AND p.status IN ('ACTIVE', 'PLANNING', 'IN_PROGRESS', 'DRAFT')
     WHERE u.role = 'TEAM_LEADER' AND u.isActive = 1
     GROUP BY u.id, u.employeeId, u.name, u.email
     ORDER BY activeProjectCount ASC, u.createdAt ASC`
  );
  assert(freeTLRows.length > 0, "Found active Team Leaders in TiDB");
  const freestTL = freeTLRows[0];
  console.log(`      Freest Team Leader: ${freestTL.name} (${freestTL.employeeId}) with ${freestTL.activeProjectCount} active projects.`);

  console.log("\n[3] Testing Auto-Allocation when Project is Created by PM without specifying TL:");
  const testProjectCode = `TESTAUTOPRJ${Date.now().toString(36).toUpperCase()}`;
  const projReq = new NextRequest("http://localhost:3000/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
    body: JSON.stringify({
      projectTitle: "Automated Allocation Test Project",
      projectCode: testProjectCode,
      description: "Testing automated delivery to the freest Team Leader.",
      clientCompany: "OmniCorp Global",
      contractValue: 350000,
    }),
  });

  const projRes = await postProject(projReq);
  const projJson = await projRes.json();
  assert(projRes.status === 201 || projRes.status === 200, "Project created successfully by PM");

  const createdProject = (await queryDb<any[]>(
    `SELECT id, projectCode, teamLeaderId, projectManagerId FROM project WHERE projectCode = ? LIMIT 1`,
    [testProjectCode]
  ))[0];

  assert(Boolean(createdProject), "Project found in database");
  assert(
    createdProject.teamLeaderId === freestTL.id,
    `Project was automatically assigned to freest Team Leader (${freestTL.name} - ${freestTL.employeeId})`
  );

  // Clean up test project
  if (createdProject) {
    await queryDb(`DELETE FROM _assignedstaffprojects WHERE A = ?`, [createdProject.id]);
    await queryDb(`DELETE FROM project WHERE id = ?`, [createdProject.id]);
  }

  console.log("\n==================================================================");
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

testAttendanceAndProjectAllocation().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
