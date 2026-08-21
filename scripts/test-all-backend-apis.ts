import { generateToken } from "../lib/authService";

async function testBackendApis() {
  console.log("🔍 Testing all OMS Backend API Endpoints on http://127.0.0.1:3000...\n");

  const adminToken = generateToken({
    id: "EMP-8595",
    email: "roushan.verma@global.com",
    role: "SUPER_ADMIN",
  });

  const endpoints = [
    { name: "Health Check (Public)", url: "http://127.0.0.1:3000/api/health", method: "GET", auth: false, expectedStatus: [200] },
    { name: "Auth Session Check (Unauthenticated 401)", url: "http://127.0.0.1:3000/api/auth/me", method: "GET", auth: false, expectedStatus: [401] },
    { name: "Auth Session Check (Authenticated 200)", url: "http://127.0.0.1:3000/api/auth/me", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Employees Directory List (Authenticated 200)", url: "http://127.0.0.1:3000/api/employees", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Tasks Intelligence List (Authenticated 200)", url: "http://127.0.0.1:3000/api/tasks", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Departments List (Authenticated 200)", url: "http://127.0.0.1:3000/api/departments", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Attendance Ledger (Authenticated 200)", url: "http://127.0.0.1:3000/api/attendance", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Daily Work Updates (Authenticated 200)", url: "http://127.0.0.1:3000/api/daily-work", method: "GET", auth: true, expectedStatus: [200] },
    { name: "System Audit Logs (Authenticated 200)", url: "http://127.0.0.1:3000/api/audit-logs", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Projects Endpoint (Authenticated 200)", url: "http://127.0.0.1:3000/api/projects", method: "GET", auth: true, expectedStatus: [200] },
    { name: "Feature Requests Desk (Authenticated 200)", url: "http://127.0.0.1:3000/api/feature-requests", method: "GET", auth: true, expectedStatus: [200] },
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const headers: Record<string, string> = {};
      if (ep.auth) {
        headers["Authorization"] = `Bearer ${adminToken}`;
        headers["Cookie"] = `oms_session=${adminToken}`;
      }
      const res = await fetch(ep.url, { method: ep.method, headers });
      const isSuccess = ep.expectedStatus.includes(res.status);
      if (isSuccess) {
        console.log(`✅ [${res.status}] ${ep.name}`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${ep.name} - Expected: ${ep.expectedStatus.join(",")}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ [ERROR] ${ep.name}: ${err.message}`);
      failed++;
    }
  }

  // Test Non-Existent Account Rejection
  try {
    const unknownRes = await fetch("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: "unknown.user999@gmail.com", password: "wrongpassword" }),
    });
    const unknownJson = await unknownRes.json();
    if (unknownRes.status === 401 && (unknownJson.error === "Invalid email/employee ID or password" || unknownJson.error?.includes("Invalid"))) {
      console.log(`✅ [401] Invalid Credentials Test Passed`);
      passed++;
    } else {
      console.error(`❌ [${unknownRes.status}] Failed Credentials Test for unknown account: ${JSON.stringify(unknownJson)}`);
      failed++;
    }
  } catch (err: any) {
    console.error(`❌ Login Test Error: ${err.message}`);
    failed++;
  }

  console.log(`\n📊 Backend API Test Result: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

testBackendApis();
