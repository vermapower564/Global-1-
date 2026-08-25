import fs from "fs";
import path from "path";

// Load .env
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

import { verifyJwtEdge } from "../lib/jwtEdge";

async function runLoginApiFlowTest() {
  console.log("==================================================================");
  console.log("  OMS LOGIN API FLOW VERIFICATION (POST /api/auth/login)");
  console.log("==================================================================\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Successful Login with EMP-8595
  console.log("[1] Testing valid login for EMP-8595 (Super Admin)...");
  const payload1 = {
    identity: "EMP-8595",
    password: "Roushan@123",
  };

  const res1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload1),
  });

  console.log(`Status Code: ${res1.status}`);
  const data1 = await res1.json();
  console.log("Response Body:", JSON.stringify(data1, null, 2));

  if (res1.status !== 200 || !data1.success) {
    console.error("FAIL: Expected 200 OK with success: true");
    process.exit(1);
  }

  if (data1.user?.password) {
    console.error("SECURITY FAIL: User password exposed in response!");
    process.exit(1);
  }

  // Check Set-Cookie header
  const setCookie1 = res1.headers.get("set-cookie") || "";
  console.log(`Set-Cookie received: ${setCookie1.includes("oms_session") ? "YES (oms_session present)" : "NO"}`);
  if (!setCookie1.includes("oms_session")) {
    console.error("FAIL: oms_session cookie was not set!");
    process.exit(1);
  }

  // Verify JWT session token cryptographic signature
  const decoded1 = await verifyJwtEdge(data1.token);
  console.log(`Decoded JWT Role: ${decoded1?.role}, User ID: ${decoded1?.id}`);
  if (decoded1?.role !== "SUPER_ADMIN") {
    console.error("FAIL: JWT payload role mismatch!");
    process.exit(1);
  }

  // Test 2: Invalid password test
  console.log("\n[2] Testing invalid password for EMP-8595...");
  const res2 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "EMP-8595",
      password: "WrongPassword999!",
    }),
  });

  console.log(`Status Code: ${res2.status}`);
  const data2 = await res2.json();
  console.log("Response Body:", JSON.stringify(data2, null, 2));

  if (res2.status !== 401 || data2.success !== false) {
    console.error("FAIL: Expected 401 Unauthorized for invalid password");
    process.exit(1);
  }

  // Test 3: Independent Employee login with EMP-8225 (Developer)
  console.log("\n[3] Testing independent login for EMP-8225 (Developer)...");
  const res3 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "EMP-8225",
      password: "Roushan@123",
    }),
  });

  console.log(`Status Code: ${res3.status}`);
  const data3 = await res3.json();
  console.log("Response Body:", JSON.stringify(data3, null, 2));

  if (res3.status !== 200 || !data3.success) {
    console.error("FAIL: Expected 200 OK for employee account");
    process.exit(1);
  }

  const decoded3 = await verifyJwtEdge(data3.token);
  console.log(`Decoded JWT Role: ${decoded3?.role}, User ID: ${decoded3?.id}`);
  if (decoded3?.role !== "DEVELOPER" || decoded3?.id === decoded1?.id) {
    console.error("FAIL: Employee session isolation failed!");
    process.exit(1);
  }

  console.log("\n==================================================================");
  console.log("  ALL LOGIN API REQUIREMENTS VERIFIED & PASSED 100%");
  console.log("==================================================================\n");

  // Run RBAC & Organisational Rule Enforcement Suite
  console.log("==================================================================");
  console.log("  TESTING ORGANISATIONAL RBAC ENFORCEMENT ACROSS ALL ROLES");
  console.log("==================================================================\n");

  const adminToken = data1.token;
  const empToken = data3.token;

  async function testApi(
    role: string,
    actionName: string,
    token: string,
    method: string,
    path: string,
    body?: any,
    expectedStatus: number = 200
  ) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Cookie: `oms_session=${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const passed = res.status === expectedStatus;
    const json = await res.json().catch(() => ({}));
    console.log(`[${passed ? "✓ PASS" : "✗ FAIL"}] ${role.padEnd(16)} | ${actionName.padEnd(50)} | Status: ${res.status} (Expected ${expectedStatus})`);
    if (!passed) {
      console.error(`  Error details:`, json);
      process.exit(1);
    }
  }

  console.log("--- 1. EMPLOYEE RESTRICTION TESTS (Must be rejected with 403 Forbidden) ---");
  await testApi("EMPLOYEE", "Create Project (POST /api/projects)", empToken, "POST", "/api/projects", {
    projectTitle: "Unauthorized Project",
    projectCode: "PRJ-UNAUTH",
  }, 403);

  await testApi("EMPLOYEE", "Divide Main Task (POST /api/project-manager/divide-task)", empToken, "POST", "/api/project-manager/divide-task", {
    mainTaskId: "TSK-001",
    sections: [{ title: "Subtask 1" }],
  }, 403);

  await testApi("EMPLOYEE", "Divide Task (POST /api/team-leader/divide-task)", empToken, "POST", "/api/team-leader/divide-task", {
    mainTaskId: "TSK-001",
    subtasks: [{ title: "Subtask 1" }],
  }, 403);

  await testApi("EMPLOYEE", "Create & Assign Task (POST /api/tasks)", empToken, "POST", "/api/tasks", {
    title: "Unauthorized Task Assignment",
    assignedToUserId: "some-user",
  }, 403);

  await testApi("EMPLOYEE", "Access Admin Organisation (GET /api/admin/organisation)", empToken, "GET", "/api/admin/organisation", undefined, 403);

  await testApi("EMPLOYEE", "Modify Employee Role (PATCH /api/admin/employees/EMP-8595)", empToken, "PATCH", "/api/admin/employees/EMP-8595", {
    role: "DEVELOPER",
  }, 403);

  await testApi("EMPLOYEE", "Create Client (POST /api/clients)", empToken, "POST", "/api/clients", {
    companyName: "Unauthorized Client Inc",
    email: "client@unauth.com",
  }, 403);

  await testApi("EMPLOYEE", "Create Department (POST /api/departments)", empToken, "POST", "/api/departments", {
    name: "Unauthorized Department",
  }, 403);

  console.log("\n--- 2. EMPLOYEE PERMITTED SELF-SERVICE TESTS (Must succeed with 200/201) ---");
  await testApi("EMPLOYEE", "View Assigned Tasks (GET /api/tasks)", empToken, "GET", "/api/tasks", undefined, 200);
  await testApi("EMPLOYEE", "View Assigned Projects (GET /api/projects)", empToken, "GET", "/api/projects", undefined, 200);
  await testApi("EMPLOYEE", "Submit Own Daily Work (POST /api/daily-work)", empToken, "POST", "/api/daily-work", {
    projectName: "OMS Cloud Platform",
    hoursWorked: 8,
    description: "Completed assigned frontend verification and bug fixes.",
  }, 201);
  await testApi("EMPLOYEE", "View Own Profile (GET /api/auth/me)", empToken, "GET", "/api/auth/me", undefined, 200);

  console.log("\n--- 3. SUPER ADMIN AUTHORITY TESTS (Must succeed with 200/201) ---");
  await testApi("SUPER_ADMIN", "Access Admin Organisation (GET /api/admin/organisation)", adminToken, "GET", "/api/admin/organisation", undefined, 200);
  await testApi("SUPER_ADMIN", "View All Projects (GET /api/projects)", adminToken, "GET", "/api/projects", undefined, 200);
  await testApi("SUPER_ADMIN", "View All Tasks (GET /api/tasks)", adminToken, "GET", "/api/tasks", undefined, 200);

  console.log("\n==================================================================");
  console.log("  ALL RBAC & ORGANISATIONAL ENFORCEMENT TESTS PASSED 100%");
  console.log("==================================================================");
  process.exit(0);
}

runLoginApiFlowTest();

