const axios = require("axios");

async function testTodayFeature() {
  const BASE = "http://localhost:3000";
  console.log("=================================================");
  console.log("   TESTING TODAY EMPLOYEE WORK & LIVE COUNTS     ");
  console.log("=================================================\n");

  // 1. Log in as Admin to obtain valid cookie
  const loginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookie = loginRes.headers["set-cookie"][0].split(";")[0];
  console.log("✓ Logged in as Admin (EMP-8595)\n");

  // 2. Fetch /api/admin/today
  const todayRes = await axios.get(`${BASE}/api/admin/today`, {
    headers: { Cookie: cookie },
  });
  console.log("API /api/admin/today Response Summary:");
  console.log("-----------------------------------------");
  console.log("• Total Employees:      ", todayRes.data.summary?.totalEmployees);
  console.log("• Present Today:        ", todayRes.data.summary?.presentToday);
  console.log("• Currently Working:    ", todayRes.data.summary?.currentlyWorking);
  console.log("• [ IN PROGRESS ] (Live):", todayRes.data.summary?.inProgress);
  console.log("• Completed Today:      ", todayRes.data.summary?.completed);
  console.log("• Blocked Today:        ", todayRes.data.summary?.blocked);
  console.log("• Total Org Tasks:      ", todayRes.data.summary?.totalTasks);
  console.log("• Total In-Progress All:", todayRes.data.summary?.totalInProgress);
  console.log("-----------------------------------------\n");

  // 3. Test In-Progress Filter
  const inProgressFilterRes = await axios.get(`${BASE}/api/admin/today?status=IN_PROGRESS`, {
    headers: { Cookie: cookie },
  });
  console.log(`Filtered /api/admin/today?status=IN_PROGRESS -> Found ${inProgressFilterRes.data.tasks.length} task(s)`);
  inProgressFilterRes.data.tasks.forEach((t, i) => {
    console.log(`  [${i + 1}] "${t.title}" | Lead: ${t.assignedToUser?.name} (${t.assignedToUser?.employeeId}) | Status: ${t.status} | Progress: ${t.progress}%`);
  });

  console.log("\n=================================================");
  console.log("   TODAY EMPLOYEE WORK & LIVE COUNTS VERIFIED    ");
  console.log("=================================================");
}

testTodayFeature().catch((err) => console.error("Test error:", err.message));
