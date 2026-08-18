import axios from "axios";

const BASE_URL = "http://127.0.0.1:3000";

async function testAuthenticationProtection() {
  console.log("🔐 Testing Full Authentication Protection System on", BASE_URL, "...\n");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASSED] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAILED] ${name} ${details ? "- " + details : ""}`);
      failed++;
    }
  }

  try {
    // TEST 1: Unauthenticated request to /api/auth/me should return 401
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/me`, { validateStatus: () => true });
      assert("Unauthenticated /api/auth/me rejected with 401", res.status === 401, `Status: ${res.status}`);
    } catch (e: any) {
      assert("Unauthenticated /api/auth/me rejected with 401", false, e.message);
    }

    // TEST 2: Wrong password login attempt (Test C)
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { identity: "roushan.verma@gmail.com", password: "WrongPassword999!" },
        { validateStatus: () => true }
      );
      assert(
        "Test C: Wrong password login rejected with 401 & safe error message",
        res.status === 401 && res.data.success === false && res.data.error === "Invalid email/employee ID or password",
        `Status: ${res.status}, Error: ${res.data.error}`
      );
    } catch (e: any) {
      assert("Test C: Wrong password login rejected with 401", false, e.message);
    }

    // TEST 3: Non-existent account login attempt (Test D)
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { identity: "EMP999999", password: "Password@123" },
        { validateStatus: () => true }
      );
      assert(
        "Test D: Unknown ID rejected with 401 & safe error message",
        res.status === 401 && res.data.success === false && res.data.error === "Invalid email/employee ID or password",
        `Status: ${res.status}`
      );
    } catch (e: any) {
      assert("Test D: Unknown ID rejected with 401", false, e.message);
    }

    // TEST 4: Missing password login attempt
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { identity: "roushan.verma@gmail.com", password: "" },
        { validateStatus: () => true }
      );
      assert(
        "Missing password login rejected with 400",
        res.status === 400 && res.data.success === false,
        `Status: ${res.status}`
      );
    } catch (e: any) {
      assert("Missing password login rejected with 400", false, e.message);
    }

    // TEST 5: Test A — Admin Login by Email (Roushan Verma - SUPER_ADMIN)
    let adminCookie = "";
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { identity: "roushan.verma@gmail.com", password: "Roushan@123" },
        { validateStatus: () => true }
      );

      const setCookie = res.headers["set-cookie"];
      if (setCookie && setCookie[0]) {
        adminCookie = setCookie[0].split(";")[0];
      }

      assert(
        "Test A: Valid Admin email login returns 200 + redirectTo: '/admin'",
        res.status === 200 && res.data.success === true && res.data.redirectTo === "/admin" && res.data.isAdmin === true,
        `Status: ${res.status}, redirectTo: ${res.data.redirectTo}`
      );
    } catch (e: any) {
      assert("Test A: Valid Admin email login", false, e.message);
    }

    // TEST 6: Test B — Employee Login by Employee ID (EMP014 - Aditya Raj)
    let empCookie = "";
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { identity: "EMP014", password: "password123" },
        { validateStatus: () => true }
      );

      const setCookie = res.headers["set-cookie"];
      if (setCookie && setCookie[0]) {
        empCookie = setCookie[0].split(";")[0];
      }

      assert(
        "Test B: Valid Employee ID login returns 200 + redirectTo: '/employee'",
        res.status === 200 && res.data.success === true && res.data.redirectTo === "/employee" && res.data.isAdmin === false,
        `Status: ${res.status}, redirectTo: ${res.data.redirectTo}`
      );
    } catch (e: any) {
      assert("Test B: Valid Employee ID login", false, e.message);
    }

    // TEST 7: Authenticated /api/auth/me with Admin Session Cookie
    if (adminCookie) {
      try {
        const res = await axios.get(`${BASE_URL}/api/auth/me`, {
          headers: { Cookie: adminCookie },
          validateStatus: () => true,
        });
        assert(
          "Admin session cookie verifies user with role SUPER_ADMIN",
          res.status === 200 && res.data.user?.role === "SUPER_ADMIN",
          `Status: ${res.status}`
        );
      } catch (e: any) {
        assert("Admin session cookie verifies user", false, e.message);
      }
    }

    // TEST 8: Authenticated /api/auth/me with Employee Session Cookie
    if (empCookie) {
      try {
        const res = await axios.get(`${BASE_URL}/api/auth/me`, {
          headers: { Cookie: empCookie },
          validateStatus: () => true,
        });
        assert(
          "Employee session cookie verifies user with role DEVELOPER",
          res.status === 200 && res.data.user?.role === "DEVELOPER",
          `Status: ${res.status}`
        );
      } catch (e: any) {
        assert("Employee session cookie verifies user", false, e.message);
      }
    }

    // TEST 9: Logout invalidates session cookie
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/logout`, {}, { validateStatus: () => true });
      const setCookie = res.headers["set-cookie"];
      const cookieExpired = setCookie && setCookie[0] && (setCookie[0].includes("Max-Age=0") || setCookie[0].includes("expires="));

      assert(
        "Logout endpoint invalidates oms_session cookie",
        res.status === 200 && res.data.success === true && !!cookieExpired,
        `Status: ${res.status}`
      );
    } catch (e: any) {
      assert("Logout endpoint invalidates oms_session cookie", false, e.message);
    }

    // TEST 10: Test E — Fresh browser / redirects to /login
    try {
      const res = await axios.get(`${BASE_URL}/`, {
        maxRedirects: 0,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const location = res.headers["location"] || "";
      assert(
        "Test E: Unauthenticated root / redirects to /login",
        res.status === 307 || res.status === 308 || res.status === 302 || location.includes("login"),
        `Status: ${res.status}, Location: ${location}`
      );
    } catch (e: any) {
      if (e.response && (e.response.status === 307 || e.response.status === 308 || e.response.status === 302)) {
        assert("Test E: Unauthenticated root / redirects to /login", true);
      } else {
        assert("Test E: Unauthenticated root / redirects to /login", false, e.message);
      }
    }

    // TEST 11: Test F — Direct Admin URL /admin redirects to /login
    try {
      const res = await axios.get(`${BASE_URL}/admin`, {
        maxRedirects: 0,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const location = res.headers["location"] || "";
      assert(
        "Test F: Unauthenticated direct /admin redirects to /login",
        res.status === 307 || res.status === 308 || res.status === 302 || location.includes("login"),
        `Status: ${res.status}, Location: ${location}`
      );
    } catch (e: any) {
      if (e.response && (e.response.status === 307 || e.response.status === 308 || e.response.status === 302)) {
        assert("Test F: Unauthenticated direct /admin redirects to /login", true);
      } else {
        assert("Test F: Unauthenticated direct /admin redirects to /login", false, e.message);
      }
    }

    // TEST 12: Direct Employee URL /employee redirects to /login
    try {
      const res = await axios.get(`${BASE_URL}/employee`, {
        maxRedirects: 0,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const location = res.headers["location"] || "";
      assert(
        "Unauthenticated direct /employee redirects to /login",
        res.status === 307 || res.status === 308 || res.status === 302 || location.includes("login"),
        `Status: ${res.status}, Location: ${location}`
      );
    } catch (e: any) {
      if (e.response && (e.response.status === 307 || e.response.status === 308 || e.response.status === 302)) {
        assert("Unauthenticated direct /employee redirects to /login", true);
      } else {
        assert("Unauthenticated direct /employee redirects to /login", false, e.message);
      }
    }

    console.log(`\n======================================================`);
    console.log(`📊 FINAL AUTHENTICATION TEST SUITE: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error("Test execution error:", err);
  }
}

testAuthenticationProtection();
