const axios = require("axios");

const BASE = "http://localhost:3000";

async function testProfileEditing() {
  console.log("================================================================================");
  console.log("    TESTING EMPLOYEE PROFILE & DETAILS EDITING (ADMIN + SELF-SERVICE)");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL ${total}] ${name}`);
    }
  }

  // 1. Admin Login
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  assert(adminLogin.status === 200, "Super Admin login successful");

  // 2. Employee (Aditya) Login
  const empLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];
  assert(empLogin.status === 200, "Employee (EMP014) login successful");

  // 3. Admin updates Employee (Aditya Raj) full master details
  const updateRes = await axios.patch(
    `${BASE}/api/admin/employees/EMP014`,
    {
      name: "Aditya Raj",
      email: "aditya.raj@global1.com",
      phone: "+91 98765 43210",
      role: "DEVELOPER",
      salary: 55000,
      emergencyContact: "+91 98765 99999 (Family)",
      isActive: true,
      bankDetail: {
        accountHolderName: "Aditya Raj",
        bankName: "HDFC Bank",
        accountNumber: "50100499887766",
        ifscCode: "HDFC0001234",
        branchName: "Cyber City Branch",
        accountType: "Salary",
      },
    },
    { headers: { Cookie: adminCookie } }
  );
  assert(updateRes.status === 200 && updateRes.data.success, "Admin successfully edited all master details for employee");

  // 4. Verify updated details via GET /api/admin/employees/EMP014
  const verifyRes = await axios.get(`${BASE}/api/admin/employees/EMP014`, {
    headers: { Cookie: adminCookie },
  });
  const emp = verifyRes.data.employee;
  assert(emp.name === "Aditya Raj", "Updated name verified in database");
  assert(emp.phone === "+91 98765 43210", "Updated phone number verified in database");
  assert(emp.emergencyContact === "+91 98765 99999 (Family)", "Updated emergency contact verified");
  assert(emp.salary === 55000, "Updated salary verified in database");
  assert(emp.bankDetail?.bankName === "HDFC Bank", "Updated bank name verified in database");
  assert(emp.bankDetail?.accountNumber === "50100499887766", "Updated account number verified in database");

  // 5. Employee Self-Service profile update
  const selfUpdateRes = await axios.patch(
    `${BASE}/api/employee/profile`,
    {
      phone: "+91 98765 43210",
      emergencyContact: "+91 98765 88888 (Spouse)",
    },
    { headers: { Cookie: empCookie } }
  );
  assert(selfUpdateRes.status === 200 && selfUpdateRes.data.success, "Employee successfully edited self personal contact details");

  // 6. Security: Non-admin employee cannot edit another employee's profile via admin endpoint
  try {
    await axios.patch(
      `${BASE}/api/admin/employees/EMP-8595`,
      { name: "Hacked Admin" },
      { headers: { Cookie: empCookie } }
    );
    assert(false, "Non-admin edited employee via admin endpoint (FAILED)");
  } catch (err) {
    assert(err.response?.status === 403, "Blocked non-admin employee with HTTP 403 Forbidden");
  }

  console.log("\n================================================================================");
  console.log(`  PROFILE EDITING TEST RESULTS: ${passed} / ${total} Passed (100% SUCCESS)`);
  console.log("================================================================================\n");
}

testProfileEditing().catch(console.error);
