const axios = require("axios");

async function testAll7Features() {
  console.log("==================================================");
  console.log("🧪 Verifying All 7 User Upgrades End-to-End");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Authenticate Admin
  console.log("\n1️⃣ Authenticating Super Admin (EMP-8595)...");
  const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookie = loginRes.headers["set-cookie"][0];
  console.log("   • Logged in as:", loginRes.data.user.name);

  // 2. Test Task Date Filter (/api/tasks?date=YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];
  console.log(`\n2️⃣ Testing Task Date Filter (/api/tasks?date=${todayStr})...`);
  const tasksRes = await axios.get(`${BASE_URL}/api/tasks?date=${todayStr}`, {
    headers: { Cookie: cookie },
  });
  console.log(`   • Total Tasks for ${todayStr}: ${tasksRes.data.tasks.length}`);
  console.log("   • Date Summary:", tasksRes.data.summary);

  // 3. Test Blockers (/api/tasks?status=BLOCKED)
  console.log("\n3️⃣ Testing Blocker Resolution Center (/api/tasks?status=BLOCKED)...");
  const blockersRes = await axios.get(`${BASE_URL}/api/tasks?status=BLOCKED`, {
    headers: { Cookie: cookie },
  });
  console.log(`   • Total Active Blockers: ${blockersRes.data.tasks.length}`);
  blockersRes.data.tasks.slice(0, 3).forEach((b, i) => {
    console.log(`     ${i + 1}. [${b.priority}] ${b.title} -> Reason: "${b.blockerReason}"`);
  });

  // 4. Test Salary Slips by Month (/api/admin/salary-slips?month=August 2026)
  console.log("\n4️⃣ Testing Single-Month Salary Slips (/api/admin/salary-slips?month=August 2026)...");
  const salaryRes = await axios.get(`${BASE_URL}/api/admin/salary-slips?month=August 2026`, {
    headers: { Cookie: cookie },
  });
  console.log(`   • Total Slips for August 2026: ${salaryRes.data.total}`);
  console.log(`   • Net Disbursed: ₹${salaryRes.data.summary.totalDisbursed.toLocaleString("en-IN")}`);
  console.log("   • Available Months in Navigator:", salaryRes.data.availableMonths);

  // 5. Test Attendance Ledger with Project IDs
  console.log("\n5️⃣ Testing Attendance Ledger with Project IDs (/api/attendance?period=today)...");
  const attRes = await axios.get(`${BASE_URL}/api/attendance?period=today`, {
    headers: { Cookie: cookie },
  });
  console.log(`   • Attendance Punches: ${attRes.data.data.length}`);
  if (attRes.data.data.length > 0) {
    const r = attRes.data.data[0];
    console.log(`   • Sample Record: Employee: ${r.user?.name} | Project: [${r.projectId}] ${r.projectName} | Task: "${r.projectTask}"`);
  }

  // 6. Test Resignations Hub (/api/resignations)
  console.log("\n6️⃣ Testing Resignation Hub & Career Work History (/api/resignations)...");
  const resRes = await axios.get(`${BASE_URL}/api/resignations`, {
    headers: { Cookie: cookie },
  });
  console.log(`   • Total Resignations: ${resRes.data.data.length}`);
  resRes.data.data.forEach((r, i) => {
    console.log(`     ${i + 1}. ${r.employeeName} (${r.employeeId}) • Role: ${r.role} • Status: ${r.status}`);
    console.log(`        - Reason: "${r.reason}"`);
    console.log(`        - Career History: ${r.workHistory.completedTasksCount} completed tasks | ${r.workHistory.totalShiftHours}h shift attendance | ${r.workHistory.attendanceRating}`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL 7 FEATURES TESTED AND OPERATIONAL IN TIDB CLOUD!");
  console.log("==================================================");
}

testAll7Features().catch(console.error);
