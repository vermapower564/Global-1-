const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=================================================");
  console.log("   TESTING COMPREHENSIVE OMS AUTHENTICATION FLOW  ");
  console.log("=================================================\n");

  // TEST 1: Open website URL (/) without credentials
  try {
    const res1 = await axios.get(`${BASE_URL}/`, { maxRedirects: 0, validateStatus: () => true });
    console.log(`[TEST 1] GET / (Unauthenticated) -> Status: ${res1.status}, Location: ${res1.headers.location}`);
    if (res1.headers.location?.includes("/login")) {
      console.log("  ✓ PASS: Redirected to /login\n");
    } else {
      console.log("  ✗ FAIL: Did not redirect to /login\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 1:", e.message);
  }

  // TEST 2: Enter wrong ID/password
  try {
    const res2 = await axios.post(`${BASE_URL}/api/auth/login`, {
      identity: "EMP-INVALID",
      password: "WrongPassword999",
    }, { validateStatus: () => true });
    console.log(`[TEST 2] POST /api/auth/login (Wrong Credentials) -> Status: ${res2.status}, Error: "${res2.data.error}"`);
    if (res2.status === 401 && res2.data.error === "Invalid ID or Password") {
      console.log("  ✓ PASS: Generic 'Invalid ID or Password' returned\n");
    } else {
      console.log("  ✗ FAIL: Unexpected response for invalid credentials\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 2:", e.message);
  }

  // TEST 3: Enter valid ADMIN credentials
  let adminCookie = "";
  try {
    const res3 = await axios.post(`${BASE_URL}/api/auth/login`, {
      identity: "EMP-8595",
      password: "Roushan@123",
    }, { validateStatus: () => true });
    adminCookie = res3.headers["set-cookie"] ? res3.headers["set-cookie"][0].split(";")[0] : "";
    console.log(`[TEST 3] POST /api/auth/login (Admin EMP-8595) -> Status: ${res3.status}, RedirectTo: ${res3.data.redirectTo}, Role: ${res3.data.user?.role}`);
    if (res3.status === 200 && res3.data.redirectTo === "/admin" && res3.data.isAdmin) {
      console.log("  ✓ PASS: Admin correctly routed to /admin with cookie\n");
    } else {
      console.log("  ✗ FAIL: Admin routing failed\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 3:", e.message);
  }

  // TEST 4: Enter valid EMPLOYEE credentials
  let employeeCookie = "";
  try {
    const res4 = await axios.post(`${BASE_URL}/api/auth/login`, {
      identity: "EMP014",
      password: "Roushan@123",
    }, { validateStatus: () => true });
    employeeCookie = res4.headers["set-cookie"] ? res4.headers["set-cookie"][0].split(";")[0] : "";
    console.log(`[TEST 4] POST /api/auth/login (Employee EMP014) -> Status: ${res4.status}, RedirectTo: ${res4.data.redirectTo}, Role: ${res4.data.user?.role}`);
    if (res4.status === 200 && res4.data.redirectTo === "/employee" && !res4.data.isAdmin) {
      console.log("  ✓ PASS: Employee correctly routed to /employee with cookie\n");
    } else {
      console.log("  ✗ FAIL: Employee routing failed\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 4:", e.message);
  }

  // TEST 5: Without logging in, manually open /admin
  try {
    const res5 = await axios.get(`${BASE_URL}/admin`, { maxRedirects: 0, validateStatus: () => true });
    console.log(`[TEST 5] GET /admin (Unauthenticated) -> Status: ${res5.status}, Location: ${res5.headers.location}`);
    if (res5.headers.location?.includes("/login")) {
      console.log("  ✓ PASS: Unauthenticated access to /admin blocked and redirected to /login\n");
    } else {
      console.log("  ✗ FAIL: Direct /admin access was not blocked\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 5:", e.message);
  }

  // TEST 6: Without logging in, manually open /employee
  try {
    const res6 = await axios.get(`${BASE_URL}/employee`, { maxRedirects: 0, validateStatus: () => true });
    console.log(`[TEST 6] GET /employee (Unauthenticated) -> Status: ${res6.status}, Location: ${res6.headers.location}`);
    if (res6.headers.location?.includes("/login")) {
      console.log("  ✓ PASS: Unauthenticated access to /employee blocked and redirected to /login\n");
    } else {
      console.log("  ✗ FAIL: Direct /employee access was not blocked\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 6:", e.message);
  }

  // TEST 7: Login as EMPLOYEE and manually open /admin
  try {
    const res7 = await axios.get(`${BASE_URL}/admin`, {
      headers: { Cookie: employeeCookie },
      maxRedirects: 0,
      validateStatus: () => true,
    });
    console.log(`[TEST 7] GET /admin with Employee Cookie -> Status: ${res7.status}, Location: ${res7.headers.location}`);
    if (res7.headers.location?.includes("/employee")) {
      console.log("  ✓ PASS: Employee denied access to /admin and redirected to /employee\n");
    } else {
      console.log("  ✗ FAIL: Employee was not redirected to /employee\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 7:", e.message);
  }

  // TEST 8: Logout and then try accessing protected dashboard
  try {
    const res8Logout = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: { Cookie: adminCookie },
      validateStatus: () => true,
    });
    const expiredCookie = res8Logout.headers["set-cookie"] ? res8Logout.headers["set-cookie"][0].split(";")[0] : "";
    console.log(`[TEST 8a] POST /api/auth/logout -> Status: ${res8Logout.status}, Set-Cookie: ${expiredCookie}`);

    const res8Access = await axios.get(`${BASE_URL}/admin`, {
      headers: { Cookie: expiredCookie },
      maxRedirects: 0,
      validateStatus: () => true,
    });
    console.log(`[TEST 8b] GET /admin (After Logout) -> Status: ${res8Access.status}, Location: ${res8Access.headers.location}`);
    if (res8Access.headers.location?.includes("/login")) {
      console.log("  ✓ PASS: After logout, accessing dashboard is denied and redirected to /login\n");
    } else {
      console.log("  ✗ FAIL: Protected access permitted after logout\n");
    }
  } catch (e) {
    console.log("  ✗ ERROR in Test 8:", e.message);
  }

  console.log("=================================================");
  console.log("           ALL AUTHENTICATION TESTS COMPLETE      ");
  console.log("=================================================");
}

runTests();
