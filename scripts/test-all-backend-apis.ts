async function testBackendApis() {
  console.log("🔍 Testing all OMS Backend API Endpoints on http://127.0.0.1:3000...\n");

  const endpoints = [
    { name: "Auth Session Check", url: "http://127.0.0.1:3000/api/auth/me", method: "GET", expectedStatus: [401, 200] },
    { name: "Employees Directory List", url: "http://127.0.0.1:3000/api/employees", method: "GET", expectedStatus: [200] },
    { name: "Tasks Intelligence List", url: "http://127.0.0.1:3000/api/tasks", method: "GET", expectedStatus: [401, 200] },
    { name: "Departments List", url: "http://127.0.0.1:3000/api/departments", method: "GET", expectedStatus: [200] },
    { name: "Attendance Ledger", url: "http://127.0.0.1:3000/api/attendance", method: "GET", expectedStatus: [200] },
    { name: "Daily Work Updates", url: "http://127.0.0.1:3000/api/daily-work", method: "GET", expectedStatus: [200] },
    { name: "System Audit Logs", url: "http://127.0.0.1:3000/api/audit-logs", method: "GET", expectedStatus: [200] },
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { method: ep.method });
      const isSuccess = ep.expectedStatus.includes(res.status);
      if (isSuccess) {
        console.log(`✅ [${res.status}] ${ep.name} (${ep.url})`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${ep.name} (${ep.url}) - Unexpected HTTP status`);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ [ERROR] ${ep.name} (${ep.url}): ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Backend API Test Result: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

testBackendApis();
