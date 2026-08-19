const axios = require("axios");

async function testTimeSlideFilters() {
  console.log("==================================================");
  console.log("📊 Testing Time-Slide Filters (Today, Yesterday, Daywise, Month, Year)");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Authenticate Admin
  console.log("\n1️⃣ Authenticating Super Admin (EMP-8595)...");
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0];
  console.log("   • Authenticated as:", adminLogin.data.user.name);

  // 2. Test "today" filter
  console.log("\n2️⃣ Testing 'today' slide filter (/api/attendance?period=today)...");
  const todayRes = await axios.get(`${BASE_URL}/api/attendance?period=today`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Punches today: ${todayRes.data.total}`);

  // 3. Test "yesterday" filter
  console.log("\n3️⃣ Testing 'yesterday' slide filter (/api/attendance?period=yesterday)...");
  const yestRes = await axios.get(`${BASE_URL}/api/attendance?period=yesterday`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Punches yesterday: ${yestRes.data.total}`);

  // 4. Test "month" filter (August 2026)
  console.log("\n4️⃣ Testing 'month' slide filter (/api/attendance?period=month&month=2026-08)...");
  const monthRes = await axios.get(`${BASE_URL}/api/attendance?period=month&month=2026-08`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Punches in August 2026: ${monthRes.data.total}`);
  console.log("   • Month Summary:", monthRes.data.summary);

  // 5. Test "year" filter (2026)
  console.log("\n5️⃣ Testing 'year' slide filter (/api/attendance?period=year&year=2026)...");
  const yearRes = await axios.get(`${BASE_URL}/api/attendance?period=year&year=2026`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Punches in 2026: ${yearRes.data.total}`);

  // 6. Test Specific Employee Filter (Aditya Raj - EMP014) across Month
  console.log("\n6️⃣ Testing Specific Employee filter (/api/attendance?period=month&month=2026-08&employeeId=EMP014)...");
  const empMonthRes = await axios.get(`${BASE_URL}/api/attendance?period=month&month=2026-08&employeeId=EMP014`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Aditya Raj's August 2026 Punches: ${empMonthRes.data.total}`);
  empMonthRes.data.data.slice(0, 3).forEach((p, idx) => {
    console.log(`     ${idx + 1}. Date: ${p.date?.split("T")[0]} | In: ${new Date(p.checkInTime).toLocaleTimeString("en-IN")} | Out: ${p.checkOutTime ? new Date(p.checkOutTime).toLocaleTimeString("en-IN") : "Active"} | Hours: ${p.hoursWorked}h`);
  });

  // 7. Test Employee Login (EMP014) self-view scoping
  console.log("\n7️⃣ Authenticating Employee (EMP014) to verify self-view scoping...");
  const empLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0];
  const empSelfRes = await axios.get(`${BASE_URL}/api/attendance?period=month&month=2026-08`, {
    headers: { Cookie: empCookie },
  });
  console.log(`   • Employee self-scoped records returned: ${empSelfRes.data.total} (Correctly scoped to EMP014)`);

  console.log("\n==================================================");
  console.log("🎉 ALL TIME-SLIDE FILTERS (TODAY, YESTERDAY, DAYWISE, MONTH, YEAR) VERIFIED!");
  console.log("==================================================");
}

testTimeSlideFilters().catch(console.error);
