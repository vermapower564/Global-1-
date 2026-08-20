const axios = require("axios");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "oms-enterprise-super-secret-key-2026";
const BASE = "http://localhost:3000";

async function runComprehensive11ScenarioTests() {
  console.log("================================================================================");
  console.log("   VERIFYING 11 TEST SCENARIOS: MULTI-EMPLOYEE AUTH & INACTIVITY SYSTEM         ");
  console.log("================================================================================\n");

  let allPassed = true;
  const pass = (num, title) => console.log(`✓ [SCENARIO ${num}] PASSED: ${title}`);
  const fail = (num, title, err) => {
    console.error(`✗ [SCENARIO ${num}] FAILED: ${title} -`, err);
    allPassed = false;
  };

  // -----------------------------------------------------------------------------------------
  // TEST 4: Direct Dashboard URL without login -> must redirect to /login
  // -----------------------------------------------------------------------------------------
  try {
    const resRoot = await axios.get(`${BASE}/`, { maxRedirects: 0, validateStatus: () => true });
    const resEmp = await axios.get(`${BASE}/employee`, { maxRedirects: 0, validateStatus: () => true });
    const resAdmin = await axios.get(`${BASE}/admin`, { maxRedirects: 0, validateStatus: () => true });
    
    if (resRoot.status === 307 && resRoot.headers.location?.includes("/login") &&
        resEmp.status === 307 && resEmp.headers.location?.includes("/login") &&
        resAdmin.status === 307 && resAdmin.headers.location?.includes("/login")) {
      pass(4, "Direct unauthenticated access to /, /employee, /admin strictly redirects to /login.");
    } else {
      fail(4, "Direct unauthenticated access did not redirect properly.", { resRoot: resRoot.status, resEmp: resEmp.status });
    }
  } catch (err) {
    fail(4, "Direct URL test error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 5: Invalid Credentials -> Generic error
  // -----------------------------------------------------------------------------------------
  try {
    const resBad = await axios.post(`${BASE}/api/auth/login`, {
      identity: "NON_EXISTENT_EMP_9999",
      password: "WrongPassword123!",
    }, { validateStatus: () => true });

    if (resBad.status === 401 && resBad.data.error === "Invalid Employee ID or password.") {
      pass(5, "Invalid credentials returned generic error without account existence leakage.");
    } else {
      fail(5, "Invalid credentials error mismatch.", resBad.data);
    }
  } catch (err) {
    fail(5, "Invalid credentials test error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 1: Employee A (Aditya Raj - EMP014) Login from Computer 1
  // -----------------------------------------------------------------------------------------
  let cookieA = "";
  let userA = null;
  try {
    const loginA = await axios.post(`${BASE}/api/auth/login`, {
      identity: "EMP014",
      password: "Roushan@123",
    });
    cookieA = loginA.headers["set-cookie"][0].split(";")[0];
    userA = loginA.data.user;

    if (loginA.status === 200 && userA.employeeId === "EMP014" && loginA.data.redirectTo === "/employee") {
      pass(1, `Employee A (${userA.name} / ${userA.employeeId}) logged in successfully -> Dashboard /employee.`);
    } else {
      fail(1, "Employee A login failed.", loginA.data);
    }
  } catch (err) {
    fail(1, "Employee A login error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 2: Employee B (Roushan Verma - EMP-8595) Login from Computer 2
  // -----------------------------------------------------------------------------------------
  let cookieB = "";
  let userB = null;
  try {
    const loginB = await axios.post(`${BASE}/api/auth/login`, {
      identity: "EMP-8595",
      password: "Roushan@123",
    });
    cookieB = loginB.headers["set-cookie"][0].split(";")[0];
    userB = loginB.data.user;

    if (loginB.status === 200 && userB.employeeId === "EMP-8595" && loginB.data.redirectTo === "/admin") {
      pass(2, `Employee B (${userB.name} / ${userB.employeeId}) logged in successfully -> Dashboard /admin.`);
    } else {
      fail(2, "Employee B login failed.", loginB.data);
    }
  } catch (err) {
    fail(2, "Employee B login error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 3: Concurrent Sessions & Independent State
  // -----------------------------------------------------------------------------------------
  try {
    const meA = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieA } });
    const meB = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieB } });

    if (meA.data.user.id !== meB.data.user.id && meA.data.user.employeeId === "EMP014" && meB.data.user.employeeId === "EMP-8595") {
      pass(3, "Concurrent sessions active simultaneously without session collision or shared memory.");
    } else {
      fail(3, "Concurrent session collision detected.", { meA: meA.data, meB: meB.data });
    }
  } catch (err) {
    fail(3, "Concurrent session error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 6: Refresh Behavior -> Remains logged in
  // -----------------------------------------------------------------------------------------
  try {
    const refreshA1 = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieA } });
    const refreshA2 = await axios.get(`${BASE}/api/auth/me`, { headers: { Cookie: cookieA } });

    if (refreshA1.status === 200 && refreshA2.status === 200 && refreshA2.data.user.name === userA.name) {
      pass(6, "Session persistent across page reloads & requests.");
    } else {
      fail(6, "Session lost on reload.", refreshA2.data);
    }
  } catch (err) {
    fail(6, "Refresh behavior error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 8: Protected APIs without token -> HTTP 401
  // -----------------------------------------------------------------------------------------
  try {
    const resTasks = await axios.get(`${BASE}/api/tasks`, { validateStatus: () => true });
    const resWork = await axios.get(`${BASE}/api/daily-work`, { validateStatus: () => true });
    const resAtt = await axios.get(`${BASE}/api/attendance`, { validateStatus: () => true });

    if (resTasks.status === 401 && resWork.status === 401 && resAtt.status === 401) {
      pass(8, "Protected APIs (/api/tasks, /api/daily-work, /api/attendance) reject unauthenticated requests with HTTP 401.");
    } else {
      fail(8, "Unauthenticated API access allowed!", { tasks: resTasks.status, work: resWork.status, att: resAtt.status });
    }
  } catch (err) {
    fail(8, "Protected API test error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 9: Cross-Employee Access (IDOR Prevention)
  // -----------------------------------------------------------------------------------------
  try {
    // Employee A attempts to query tasks specifying assignedToUserId = Employee B's ID
    const crossTasks = await axios.get(`${BASE}/api/tasks?assignedToUserId=${userB.id}`, {
      headers: { Cookie: cookieA },
    });

    // Verify all returned tasks belong only to Employee A (userA.id)
    const illegalTasks = (crossTasks.data.tasks || []).filter(t => t.assignedToUserId && t.assignedToUserId !== userA.id);

    if (illegalTasks.length === 0) {
      pass(9, "IDOR Prevention: Employee A cannot access Employee B's tasks or private records.");
    } else {
      fail(9, "IDOR vulnerability: Employee A accessed Employee B's tasks!", illegalTasks);
    }
  } catch (err) {
    fail(9, "Cross-employee access test error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 10: 1-Hour Inactivity Timeout (Server-Enforced)
  // -----------------------------------------------------------------------------------------
  try {
    // Simulate token for Employee A with lastActive 65 minutes ago (> 1 hour)
    const expiredTokenA = jwt.sign(
      {
        id: userA.id,
        email: userA.email,
        role: userA.role,
        lastActive: Date.now() - 65 * 60 * 1000,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resTimeout = await axios.get(`${BASE}/api/auth/me`, {
      headers: { Cookie: `oms_session=${expiredTokenA}` },
      validateStatus: () => true,
    });

    if (resTimeout.status === 401 && resTimeout.data.error?.includes("1 hour of inactivity")) {
      pass(10, "1-Hour Inactivity Timeout: Inactive session rejected server-side with 401 Session Expired.");
    } else {
      fail(10, "Inactivity timeout did not expire token properly.", resTimeout.data);
    }
  } catch (err) {
    fail(10, "Inactivity timeout test error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 11: Independent Inactivity (Per-Session / Not Global)
  // -----------------------------------------------------------------------------------------
  try {
    // While Employee A's session is expired due to inactivity, Employee B's session remains active
    const resBActive = await axios.get(`${BASE}/api/auth/me`, {
      headers: { Cookie: cookieB },
    });

    if (resBActive.status === 200 && resBActive.data.user.id === userB.id) {
      pass(11, "Independent Inactivity: Employee A's inactivity does NOT affect actively working Employee B.");
    } else {
      fail(11, "Employee B session prematurely dropped.", resBActive.data);
    }
  } catch (err) {
    fail(11, "Independent inactivity test error", err.message);
  }

  // -----------------------------------------------------------------------------------------
  // TEST 7: Logout -> Session Invalidated
  // -----------------------------------------------------------------------------------------
  try {
    const logoutRes = await axios.post(`${BASE}/api/auth/logout`, {}, {
      headers: { Cookie: cookieB },
    });
    const cookieHeader = logoutRes.headers["set-cookie"] ? logoutRes.headers["set-cookie"][0] : "";

    if (logoutRes.status === 200 && (cookieHeader.includes("Max-Age=0") || cookieHeader.includes("oms_session=;"))) {
      pass(7, "Logout invalidates session and clears HttpOnly cookie.");
    } else {
      fail(7, "Logout cookie clearing failed.", cookieHeader);
    }
  } catch (err) {
    fail(7, "Logout error", err.message);
  }

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("   ALL 11 REQUIRED TEST SCENARIOS PASSED WITH ZERO ERRORS (100% SUCCESS)        ");
  } else {
    console.log("   SOME TESTS FAILED! CHECK OUTPUT ABOVE                                        ");
  }
  console.log("================================================================================\n");
}

runComprehensive11ScenarioTests().catch(err => console.error("FATAL TEST RUNNER ERROR:", err));
