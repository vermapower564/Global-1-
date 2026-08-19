const axios = require("axios");

async function testAuditLogsAndAllEmployees() {
  console.log("1. Logging in as Super Admin...");
  const loginRes = await axios.post("http://localhost:3000/api/auth/login", {
    identity: "EMP-8595",
    password: "Roushan@123",
  });

  const cookie = loginRes.headers["set-cookie"] ? loginRes.headers["set-cookie"][0] : "";
  console.log("   Login success!");

  console.log("2. Testing /admin/audit-logs endpoint...");
  const resAudit = await axios.get("http://localhost:3000/admin/audit-logs", {
    headers: { Cookie: cookie, Authorization: `Bearer ${loginRes.data.token}` },
  });
  console.log(`   Result: HTTP ${resAudit.status} OK! Futuristic Audit Logs Page loaded.`);

  console.log("3. Testing /api/audit-logs API data & metrics...");
  const resApiAudit = await axios.get("http://localhost:3000/api/audit-logs", {
    headers: { Cookie: cookie, Authorization: `Bearer ${loginRes.data.token}` },
  });
  console.log(`   Result: Total Logs = ${resApiAudit.data.count}, System Integrity = ${resApiAudit.data.metrics?.systemIntegrityScore}%`);

  console.log("4. Testing /admin/employees page with All Employees Master Folder...");
  const resEmp = await axios.get("http://localhost:3000/admin/employees", {
    headers: { Cookie: cookie, Authorization: `Bearer ${loginRes.data.token}` },
  });
  console.log(`   Result: HTTP ${resEmp.status} OK! Workforce Directory loaded.`);

  process.exit(0);
}

testAuditLogsAndAllEmployees().catch(err => {
  console.error("Test Error:", err.message);
  process.exit(1);
});
