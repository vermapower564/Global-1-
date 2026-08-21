const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testAdminAccountAndOtpBank() {
  console.log("==================================================================");
  console.log("  TESTING ADMIN ACCOUNT CONTROL & OTP-PROTECTED BANK DATA");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✓ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${label}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Super Admin
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      identity: "EMP-8595",
      password: "Roushan@123",
    });
    assert(loginRes.data.success, "Super Admin authenticated successfully");
    const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

    // 2. Fetch Organisation Data & Verify Masking
    console.log("\n[1] Verifying Default Bank Masking in Organisation View:");
    const orgRes = await axios.get(`${BASE_URL}/api/admin/organisation`, {
      headers: { Cookie: cookie },
    });
    assert(orgRes.status === 200 && orgRes.data.success, "GET /api/admin/organisation returned 200 OK");

    const { projectManagers, teamLeaders, employees } = orgRes.data.data;
    assert(projectManagers.length > 0, `Project Managers list populated (${projectManagers.length})`);
    assert(teamLeaders.length > 0, `Team Leaders list populated (${teamLeaders.length})`);
    assert(employees.length > 0, `Employees list populated (${employees.length})`);

    const targetEmp = employees[0];
    console.log(`  Selected Target: ${targetEmp.name} (${targetEmp.employeeId})`);
    console.log("  Bank Details object:", targetEmp.bankDetails);

    assert(
      !targetEmp.bankDetails?.accountNumber || targetEmp.bankDetails?.accountNumberMasked,
      "Bank Account Number is not sent in plaintext by default"
    );
    assert(
      targetEmp.bankDetails?.accountHolderNameMasked !== undefined,
      "Account Holder Name is masked by default"
    );
    assert(
      targetEmp.bankDetails?.ifscCodeMasked !== undefined,
      "IFSC Code is masked by default"
    );

    // 3. Dynamic Organisation Hierarchy Graph Check
    console.log("\n[2] Verifying Dynamic Hierarchy Graph:");
    assert(targetEmp.orgHierarchy !== undefined, "Employee has dynamic orgHierarchy");
    assert(targetEmp.orgHierarchy.level1 !== undefined, "Org hierarchy includes Level 1 superior");
    console.log("  Org Hierarchy Level 1:", targetEmp.orgHierarchy.level1?.title, `(${targetEmp.orgHierarchy.level1?.user?.name})`);

    // 4. Test Requesting OTP for VIEW_BANK_DETAILS
    console.log("\n[3] Requesting OTP for VIEW_BANK_DETAILS:");
    const reqOtpRes = await axios.post(
      `${BASE_URL}/api/admin/bank/request-otp`,
      {
        targetUserId: targetEmp.id,
        purpose: "VIEW_BANK_DETAILS",
      },
      { headers: { Cookie: cookie } }
    );
    assert(reqOtpRes.data.success, "POST /api/admin/bank/request-otp returned success");
    assert(reqOtpRes.data.emailMasked !== undefined, "Masked recipient email returned");
    console.log(`  Verification code sent to masked email: ${reqOtpRes.data.emailMasked}`);

    // 5. Test Submitting Invalid OTP
    console.log("\n[4] Testing Invalid OTP Submission:");
    try {
      await axios.post(
        `${BASE_URL}/api/admin/bank/verify-otp`,
        {
          targetUserId: targetEmp.id,
          purpose: "VIEW_BANK_DETAILS",
          otpCode: "000000",
        },
        { headers: { Cookie: cookie } }
      );
      assert(false, "Invalid OTP should have been rejected");
    } catch (err) {
      assert(err.response?.status === 400, "Invalid OTP correctly returned 400 error");
      console.log(`  Expected error message: ${err.response?.data?.error}`);
    }

    // 6. Test Direct Unauthenticated Bank Mutation Rejection
    console.log("\n[5] Testing Direct Bank Update Rejection without OTP:");
    try {
      await axios.put(
        `${BASE_URL}/api/admin/employees/${targetEmp.employeeId}`,
        {
          bankDetail: {
            bankName: "Hacked Bank",
            accountNumber: "999999999999",
            ifscCode: "HACK0001234",
            accountHolderName: "Attacker",
          },
        },
        { headers: { Cookie: cookie } }
      );
      assert(false, "Direct bank update should be rejected");
    } catch (err) {
      assert(err.response?.status === 400, "Direct bank update correctly rejected with 400");
      console.log(`  Security enforcement: ${err.response?.data?.error}`);
    }

    console.log(`\n==================================================================`);
    console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`==================================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test Suite Runtime Error:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

testAdminAccountAndOtpBank();
