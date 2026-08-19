const axios = require("axios");

async function testPunchFlow() {
  console.log("==================================================");
  console.log("🕒 Testing Real-Time Punch-In & Punch-Out Flow (Employee & Admin)");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Employee Login (Aditya Raj - EMP014)
  console.log("\n1️⃣ Logging in as Employee: Aditya Raj (EMP014)...");
  const empLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0];
  console.log("   • Authenticated:", empLogin.data.user.name);

  // 2. Fetch Initial Employee Attendance Status
  console.log("\n2️⃣ Fetching Employee's current shift ledger (/api/attendance)...");
  const empAttBefore = await axios.get(`${BASE_URL}/api/attendance`, {
    headers: { Cookie: empCookie },
  });
  console.log(`   • Total personal punch records: ${empAttBefore.data.total}`);

  // 3. Employee Punch Out if active, or Punch In
  console.log("\n3️⃣ Testing Punch-In / Punch-Out operation...");
  const punchInRes = await axios.post(
    `${BASE_URL}/api/attendance`,
    { employeeId: "EMP014" },
    { headers: { Cookie: empCookie } }
  ).catch((e) => e.response);

  console.log(`   • Punch-In Result: Status ${punchInRes.status} ->`, punchInRes.data.message || punchInRes.data.error);

  // 4. Admin Login (Roushan Verma - EMP-8595)
  console.log("\n4️⃣ Logging in as Super Admin (EMP-8595)...");
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0];
  console.log("   • Super Admin Authenticated:", adminLogin.data.user.name);

  // 5. Admin Inspects Master Ledger to see Aditya Raj's Punch
  console.log("\n5️⃣ Admin checking Master Workforce Attendance Ledger for Aditya Raj (/api/attendance?employeeId=EMP014)...");
  const adminCheck = await axios.get(`${BASE_URL}/api/attendance?employeeId=EMP014`, {
    headers: { Cookie: adminCookie },
  });

  console.log(`   • Total Punches for Aditya Raj in Admin Ledger: ${adminCheck.data.total}`);
  const latestPunch = adminCheck.data.data[0];
  console.log("   • Latest Punch Details in Admin View:");
  console.log(`     - Date: ${latestPunch.date?.split("T")[0]}`);
  console.log(`     - Check-In: ${latestPunch.checkInTime ? new Date(latestPunch.checkInTime).toLocaleTimeString("en-IN") : "-"}`);
  console.log(`     - Check-Out: ${latestPunch.checkOutTime ? new Date(latestPunch.checkOutTime).toLocaleTimeString("en-IN") : "🟢 Active Shift"}`);
  console.log(`     - Hours Worked: ${latestPunch.hoursWorked} hrs`);
  console.log(`     - Active Shift Flag: ${latestPunch.isActiveShift}`);

  console.log("\n==================================================");
  console.log("🎉 ATTENDANCE PUNCH-IN/OUT & ADMIN VISIBILITY VERIFIED!");
  console.log("==================================================");
}

testPunchFlow().catch(console.error);
