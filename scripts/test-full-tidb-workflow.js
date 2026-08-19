const axios = require("axios");

async function testFullTiDBWorkflow() {
  console.log("==================================================");
  console.log("🚀 Testing Complete Next.js Application on TiDB Cloud");
  console.log("==================================================\n");

  const BASE = "http://localhost:3000";

  // 1. Test Login on TiDB
  console.log("1. Authenticating via POST /api/auth/login against TiDB Cloud...");
  const loginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const token = loginRes.data.token;
  const cookie = loginRes.headers["set-cookie"] ? loginRes.headers["set-cookie"][0] : "";
  console.log(`   ✅ Login Success: ${loginRes.data.user.name} (${loginRes.data.user.role}) - Token generated.\n`);

  const authHeaders = {
    headers: {
      Cookie: cookie,
      Authorization: `Bearer ${token}`,
    },
  };

  // 2. Test Fetching Projects from TiDB
  console.log("2. Fetching Projects via GET /api/projects on TiDB Cloud...");
  const projRes = await axios.get(`${BASE}/api/projects`, authHeaders);
  console.log(`   ✅ Projects: ${projRes.data.total} projects loaded. Sample: "${projRes.data.projects[0].projectTitle}" - Team Lead: ${projRes.data.projects[0].teamLeader.name}\n`);

  // 3. Test Fetching Customer Reviews from TiDB
  console.log("3. Fetching Reviews via GET /api/reviews on TiDB Cloud...");
  const revRes = await axios.get(`${BASE}/api/reviews`, authHeaders);
  console.log(`   ✅ Customer Reviews: ${revRes.data.count} reviews loaded. Avg CSAT: ${revRes.data.metrics.avgRating} ★\n`);

  // 4. Test Fetching Audit Logs from TiDB
  console.log("4. Fetching Audit Logs via GET /api/audit-logs on TiDB Cloud...");
  const auditRes = await axios.get(`${BASE}/api/audit-logs`, authHeaders);
  console.log(`   ✅ Audit Logs: ${auditRes.data.count} events loaded. System Integrity: ${auditRes.data.metrics.systemIntegrityScore}%\n`);

  // 5. Test Submitting a New Verified Review to TiDB
  console.log("5. Submitting a New Verified Client Review via POST /api/reviews to TiDB Cloud...");
  const submitRevRes = await axios.post(`${BASE}/api/reviews`, {
    employeeId: "EMP-8595",
    employeeName: "Roushan Verma",
    customerName: "Alexander Hayes (CTO)",
    customerEmail: "hayes@cloudscale.io",
    customerCompany: "CloudScale Global Systems",
    customerRole: "VP of Cloud Engineering",
    rating: 5,
    communicationRating: 5,
    codeQualityRating: 5,
    timelinessRating: 5,
    reviewTitle: "Flawless TiDB Cloud Migration & Zero Downtime",
    feedbackText: "Roushan orchestrated our database migration to TiDB Cloud with sub-millisecond query performance and 100% data integrity. Spectacular execution!",
    highlights: "TiDB Migration • Zero Downtime • Ultra Fast",
  });
  console.log(`   ✅ Review Submitted Successfully! ID: ${submitRevRes.data.reviewId}\n`);

  console.log("==================================================");
  console.log("🎉 100% COMPLETE: Application is Running Fully on TiDB Cloud!");
  console.log("==================================================");
}

testFullTiDBWorkflow().catch(err => {
  console.error("Workflow Error:", err.response ? err.response.data : err.message);
});
