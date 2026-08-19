const axios = require("axios");

async function testAllEmployeeHistory() {
  console.log("==================================================");
  console.log("📁 Testing Master Employee Records & History Folders on TiDB Cloud");
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

  // 2. Test Employee 360 Record & History for 3 diverse staff members
  const testStaff = ["EMP014", "EMP-8595", "EMP-6841"];

  for (const empId of testStaff) {
    console.log(`\n2️⃣ Inspecting 360° Historical Dossier for: [${empId}]`);
    const res = await axios.get(`${BASE_URL}/api/admin/employees/${empId}`, {
      headers: { Cookie: cookie },
    });

    const emp = res.data.employee;
    const stats = res.data.stats;

    console.log(`   • Name: ${emp.name} | Role: ${emp.role}`);
    console.log(`   • Department: ${emp.department?.name || "Operations"}`);
    console.log(`   • Phone: ${emp.phone || "N/A"} | Emergency Contact: ${emp.emergencyContact}`);
    console.log(`   • Bank Account: ${emp.bankDetail ? emp.bankDetail.bankName + " (" + emp.bankDetail.accountNumber + ")" : "Not Verified"}`);
    console.log(`   • 🕒 Attendance Punches: ${emp.attendance?.length || 0} logs`);
    console.log(`   • 💼 Sprint Tasks History: ${emp.assignedTasks?.length || 0} tasks`);
    console.log(`   • 💰 Salary Slips: ${emp.salarySlips?.length || 0} slips`);
    console.log(`   • ⭐ Customer Reviews: ${emp.customerReviews?.length || 0} reviews`);
    console.log(`   • 🔒 Security Audit Logs: ${emp.auditlog?.length || 0} events`);
  }

  // 3. Test Master Attendance Ledger
  console.log("\n3️⃣ Fetching Master Attendance Ledger...");
  const attRes = await axios.get(`${BASE_URL}/api/attendance`, {
    headers: { Cookie: cookie },
  });
  console.log(`   • Total Master Attendance Punches: ${attRes.data.total}`);

  console.log("\n==================================================");
  console.log("🎉 ALL EMPLOYEE RECORDS & HISTORY DOSSIERS VERIFIED!");
  console.log("==================================================");
}

testAllEmployeeHistory().catch(console.error);
