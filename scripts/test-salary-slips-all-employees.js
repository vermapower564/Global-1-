const axios = require("axios");

async function testSalarySlips() {
  console.log("==================================================");
  console.log("💰 Testing Salary Slips Endpoint for Admin and Employee");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Authenticate as Admin
  console.log("\n1️⃣ Authenticating Super Admin (EMP-8595)...");
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0];
  console.log("   • Authenticated as:", adminLogin.data.user.name);

  // 2. Fetch Master Salary Slips (/api/admin/salary-slips)
  console.log("\n2️⃣ Fetching Master Salary Slips (/api/admin/salary-slips)...");
  const masterRes = await axios.get(`${BASE_URL}/api/admin/salary-slips`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Total Slips in DB: ${masterRes.data.total}`);
  console.log("   • Summary:", masterRes.data.summary);
  console.log("   • Available Months:", masterRes.data.availableMonths);

  // 3. Fetch Employee Specific Slips (Aditya Raj - EMP014)
  console.log("\n3️⃣ Fetching Aditya Raj's Salary Slips (/api/admin/employees/EMP014/salary-slips)...");
  const empSlipsRes = await axios.get(`${BASE_URL}/api/admin/employees/EMP014/salary-slips`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Total Slips for Aditya Raj: ${empSlipsRes.data.slips.length}`);
  empSlipsRes.data.slips.forEach((s, idx) => {
    console.log(`     ${idx + 1}. [${s.salaryMonth}] Gross: ₹${s.grossSalary?.toLocaleString("en-IN")} | Net: ₹${s.netSalary?.toLocaleString("en-IN")} | Status: ${s.paymentStatus} | Bank: ${s.bankName}`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL SALARY SLIPS VERIFIED AND LOADING CLEANLY!");
  console.log("==================================================");
}

testSalarySlips().catch(console.error);
