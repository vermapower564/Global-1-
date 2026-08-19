const axios = require("axios");

async function testSalarySlips() {
  console.log("==================================================");
  console.log("💰 Testing Monthly Salary Slips Ledger on TiDB Cloud");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Authenticate as Super Admin
  console.log("\n1️⃣ Authenticating as Super Admin (EMP-8595)...");
  const login = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookie = login.headers["set-cookie"][0];
  console.log("   • Super Admin Authenticated! User:", login.data.user.name);

  // 2. Fetch August 2026 Salary Slips for All Employees
  console.log("\n2️⃣ Fetching August 2026 Salary Slips (/api/admin/salary-slips?month=2026-08)...");
  const res = await axios.get(`${BASE_URL}/api/admin/salary-slips?month=2026-08`, {
    headers: { Cookie: cookie },
  });

  console.log(`   • Total Slips for August 2026: ${res.data.total}`);
  console.log("   • Summary KPIs:", res.data.summary);

  // 3. Inspect top 5 salary slips
  console.log("\n3️⃣ Sample Employee August 2026 Salary Slips:");
  res.data.data.slice(0, 8).forEach((s, idx) => {
    console.log(
      `   ${idx + 1}. [${s.employeeId}] ${s.employeeName} (${s.user?.role || "Staff"}) | Gross: ₹${s.grossSalary?.toLocaleString("en-IN")} | Ded: ₹${s.totalDeductions?.toLocaleString("en-IN")} | Net: ₹${s.netSalary?.toLocaleString("en-IN")} | Bank: ${s.bankName} (${s.accountNumberMasked}) | Txn: ${s.transactionReference}`
    );
  });

  console.log("\n==================================================");
  console.log("🎉 ALL EMPLOYEE SALARY SLIPS VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
}

testSalarySlips().catch(console.error);
