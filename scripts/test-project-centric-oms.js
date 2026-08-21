const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("================================================================");
  console.log("  OMS PROJECT-CENTRIC & 4-TIER ARCHITECTURE VERIFICATION SUITE");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✓ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${label}`);
      failed++;
    }
  }

  // 1. Super Admin Login
  console.log("[1] Super Admin Root Governance & Single Account Enforcement:");
  const superAdminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const saCookie = superAdminLogin.headers["set-cookie"][0].split(";")[0];
  assert(superAdminLogin.data.success && superAdminLogin.data.user.role === "SUPER_ADMIN", "Super Admin EMP-8595 logged in");

  // Attempt duplicate Super Admin creation -> 400
  try {
    await axios.post(
      `${BASE_URL}/api/employees`,
      {
        name: "Second Super Admin",
        email: "super2@oms.internal",
        password: "Password@123",
        role: "SUPER_ADMIN",
        phone: "+91 99999 11111",
      },
      { headers: { Cookie: saCookie } }
    );
    assert(false, "Prevented creation of duplicate Super Admin");
  } catch (err) {
    assert(err.response?.status === 400, "Backend blocked duplicate Super Admin creation (HTTP 400)");
  }

  // 2. Project Manager Project Ownership & Creation
  console.log("\n[2] Project Manager Project Ownership & Full Metadata Specification:");
  const pmLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  const pmCookie = pmLogin.headers["set-cookie"][0].split(";")[0];
  assert(pmLogin.data.success && pmLogin.data.user.role === "PROJECT_MANAGER", "Project Manager EMP-8222 logged in");

  // PM creates project
  const testProjectCode = `AUTO-${Date.now().toString(36).toUpperCase()}`;
  const createProjRes = await axios.post(
    `${BASE_URL}/api/projects`,
    {
      projectTitle: "Enterprise Omni-Channel Cloud Platform",
      projectCode: testProjectCode,
      clientCompany: "Vertex Global Cloud",
      clientContactPerson: "Elena Rostov",
      clientEmail: "elena@vertexglobal.com",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split("T")[0],
      priority: "HIGH",
      projectType: "Enterprise Portal",
      requiredSkills: "React, Next.js, Node.js, MySQL, UI/UX",
      requiredRoles: "Developer, UI/UX Designer, QA Tester",
      techStack: "Next.js 16, MySQL, Tailwind CSS",
      expectedTeamSize: 4,
      teamLeaderId: "cmlk000010000000000000003", // EMP-7592
      status: "ACTIVE",
    },
    { headers: { Cookie: pmCookie } }
  );
  assert(createProjRes.data.success && createProjRes.data.project.id, `PM created project (Code: ${testProjectCode})`);

  // Fetch Projects & Verify Health Engine
  const projectsRes = await axios.get(`${BASE_URL}/api/projects`, { headers: { Cookie: pmCookie } });
  const createdProj = projectsRes.data.projects?.find((p) => p.projectCode === `PRJ-${testProjectCode}` || p.id === `PRJ-${testProjectCode}`);
  assert(createdProj !== undefined, "Project retrieved with full metadata in list");
  assert(["HEALTHY", "AT_RISK", "CRITICAL"].includes(createdProj?.projectHealth), `Project Health computed correctly (${createdProj?.projectHealth})`);

  // 3. Team Leader Smart Recommendations
  console.log("\n[3] Team Leader Smart Skill-Based Employee Recommendations:");
  const tlLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];
  assert(tlLogin.data.success, "Team Leader EMP-7592 authenticated");

  const recRes = await axios.get(`${BASE_URL}/api/team-leader/recommendations?skills=React,Next.js,Node.js,MySQL`, {
    headers: { Cookie: tlCookie },
  });
  assert(recRes.data.success && Array.isArray(recRes.data.recommendations), "Recommendations generated successfully");
  const topRec = recRes.data.recommendations[0];
  assert(topRec.matchScore >= 50, `Top recommended employee (${topRec.name}) match score: ${topRec.matchScore}%`);
  assert(typeof topRec.currentWorkload === "number", `Workload calculated: ${topRec.currentWorkload}%`);

  // 4. Employee Multi-Factor Performance & Promotion Engine
  console.log("\n[4] Employee Performance & Promotion with Immutable Audit History:");
  const evalRes = await axios.get(`${BASE_URL}/api/project-manager/promotions`, {
    headers: { Cookie: pmCookie },
  });
  assert(evalRes.data.success && Array.isArray(evalRes.data.employees), "Performance evaluations retrieved");
  const targetEmp = evalRes.data.employees.find((e) => e.employeeId === "EMP-6841" || e.role === "DEVELOPER");
  assert(targetEmp && targetEmp.metrics.overallScore > 0, `Multi-factor score for ${targetEmp?.name}: ${targetEmp?.metrics.overallScore}%`);

  // PM promotes employee to Team Leader
  const promoteRes = await axios.post(
    `${BASE_URL}/api/project-manager/promotions`,
    {
      employeeId: targetEmp.id,
      newRole: "TEAM_LEADER",
      performanceScore: targetEmp.metrics.overallScore,
      reason: "Demonstrated exemplary leadership and 95%+ on-time task delivery in sprint deliverables.",
      comments: "Authorized by PM Vikram Singh.",
    },
    { headers: { Cookie: pmCookie } }
  );
  assert(promoteRes.data.success, `Promoted ${targetEmp.name} to TEAM_LEADER`);

  // Verify promotion history contains record
  const verifyHistRes = await axios.get(`${BASE_URL}/api/project-manager/promotions`, {
    headers: { Cookie: pmCookie },
  });
  const historyRecord = verifyHistRes.data.promotionHistory?.find((h) => h.userId === targetEmp.id);
  assert(historyRecord !== undefined, `Promotion audit record persisted in DB for ${targetEmp.name}`);

  // 5. Anti-IDOR Security & Scoping
  console.log("\n[5] Role Isolation & Security Verification:");
  const empLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];

  // Employee attempting PM promotion API -> 403
  try {
    await axios.get(`${BASE_URL}/api/project-manager/promotions`, { headers: { Cookie: empCookie } });
    assert(false, "Employee prevented from accessing PM promotions API");
  } catch (err) {
    assert(err.response?.status === 403, "Employee blocked with 403 Forbidden from PM promotion API");
  }

  console.log("\n================================================================");
  console.log(`  FINAL VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err.message);
  process.exit(1);
});
