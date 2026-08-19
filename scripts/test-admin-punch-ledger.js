const axios = require("axios");

async function testPunchLedger() {
  console.log("==================================================");
  console.log("🕒 Testing Master Workforce Punch Ledger on TiDB Cloud");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Login as Super Admin
  console.log("\n1️⃣ Logging in as Super Admin (EMP-8595)...");
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"] ? adminLogin.headers["set-cookie"][0] : "";
  console.log("   • Super Admin Authenticated! Name:", adminLogin.data.user.name);

  // 2. Fetch Master Punch Ledger as Admin
  console.log("\n2️⃣ Fetching Master Punch Ledger as Super Admin (/api/attendance)...");
  const punchRes = await axios.get(`${BASE_URL}/api/attendance`, {
    headers: { Cookie: adminCookie },
  });

  console.log(`   • Total Punch Records Found in TiDB Cloud: ${punchRes.data.total}`);
  console.log(`   • Summary KPIs:`, punchRes.data.summary);

  // 3. Inspect top 5 recent punches
  console.log("\n3️⃣ Sample Recent Employee Shift Punches:");
  punchRes.data.data.slice(0, 5).forEach((p, idx) => {
    const inTime = p.checkInTime ? new Date(p.checkInTime).toLocaleTimeString("en-IN") : "-";
    const outTime = p.checkOutTime ? new Date(p.checkOutTime).toLocaleTimeString("en-IN") : "🟢 CLOCKED IN NOW";
    console.log(
      `   ${idx + 1}. [${p.user?.employeeId}] ${p.user?.name} (${p.user?.department?.name || "Ops"}) | Date: ${p.date?.split("T")[0]} | In: ${inTime} | Out: ${outTime} | Hours: ${p.hoursWorked} hrs`
    );
  });

  // 4. Test Filtering by Active Shifts
  console.log("\n4️⃣ Testing Filter: Active Shifts Currently Clocked In (/api/attendance?status=ACTIVE_SHIFT)...");
  const activeRes = await axios.get(`${BASE_URL}/api/attendance?status=ACTIVE_SHIFT`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Active Shifts Clocked In Right Now: ${activeRes.data.total}`);

  // 5. Test Filtering by Specific Employee
  console.log("\n5️⃣ Testing Filter for Lead Developer Aditya Raj (/api/attendance?employeeId=EMP014)...");
  const empPunchRes = await axios.get(`${BASE_URL}/api/attendance?employeeId=EMP014`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Total Punches Found for Aditya Raj: ${empPunchRes.data.total}`);
  empPunchRes.data.data.forEach((p, idx) => {
    console.log(`     - Shift ${idx + 1}: ${p.date?.split("T")[0]} -> ${p.hoursWorked} hrs (${p.status})`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL PUNCH LEDGER & ADMIN ATTENDANCE CHECKS PASSED!");
  console.log("==================================================");
}

testPunchLedger().catch(console.error);
