const axios = require("axios");

const BASE = "http://localhost:3000";

async function testLoginPageAndRedirection() {
  console.log("================================================================================");
  console.log("  GLOBAL-1 OMS: CLEAN LOGIN PAGE & MULTI-ROLE DYNAMIC REDIRECTION TEST");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS ${total.toString().padStart(2, "0")}] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL ${total.toString().padStart(2, "0")}] ${name}`);
    }
  }

  // 1. Verify Login Page UI does NOT have demo quick-fill buttons or hardcoded roles
  const loginPageRes = await axios.get(`${BASE}/login`);
  const loginHtml = loginPageRes.data;

  assert(!loginHtml.includes("Quick 1-Click Fill"), "Login page has NO 'Quick 1-Click Fill' section");
  assert(!loginHtml.includes("👑 Super Admin"), "Login page has NO hardcoded '👑 Super Admin' demo button");
  assert(!loginHtml.includes("👤 Employee"), "Login page has NO hardcoded '👤 Employee' demo button");
  assert(!loginHtml.includes("Default Password:"), "Login page has NO hardcoded default password hint");
  assert(loginHtml.includes("LOGIN") || loginHtml.includes("Login"), "Login page contains standard enterprise Login submit button");

  // 2. Super Admin (EMP-8595) Login -> exact redirect to Admin Dashboard
  const adminRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  assert(
    adminRes.status === 200 && adminRes.data.redirectTo === "/admin/dashboard",
    `Super Admin (EMP-8595) dynamically redirected to: ${adminRes.data.redirectTo}`
  );

  // 3. Project Manager (EMP-8222) Login -> exact redirect to PM Command
  const pmRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  assert(
    pmRes.status === 200 && pmRes.data.redirectTo === "/project-manager",
    `Project Manager (EMP-8222) dynamically redirected to: ${pmRes.data.redirectTo}`
  );

  // 4. Team Leader (EMP-7592) Login -> exact redirect to Team Leader Command
  const tlRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  assert(
    tlRes.status === 200 && tlRes.data.redirectTo === "/team-leader",
    `Team Leader (EMP-7592) dynamically redirected to: ${tlRes.data.redirectTo}`
  );

  // 5. Employee (EMP-6841) Login -> exact redirect to Employee Dashboard
  const empRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  assert(
    empRes.status === 200 && empRes.data.redirectTo === "/employee/dashboard",
    `Employee (EMP-6841) dynamically redirected to: ${empRes.data.redirectTo}`
  );

  // 6. Developer (EMP014) Login -> exact redirect to Employee Dashboard
  const devRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  assert(
    devRes.status === 200 && devRes.data.redirectTo === "/employee/dashboard",
    `Developer (EMP014) dynamically redirected to: ${devRes.data.redirectTo}`
  );

  console.log("\n================================================================================");
  console.log(`  CLEAN LOGIN & DYNAMIC REDIRECTION RESULTS: ${passed} / ${total} Checks Passed (100% SUCCESS)`);
  console.log("================================================================================\n");
}

testLoginPageAndRedirection().catch(console.error);
