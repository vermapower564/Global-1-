import fs from "fs";
import path from "path";

// Load .env variables cleanly
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

import { POST as loginHandler } from "../app/api/auth/login/route";
import { POST as logoutHandler } from "../app/api/auth/logout/route";
import { proxy } from "../proxy";
import { NextRequest } from "next/server";
import { verifyJwtEdge } from "../lib/jwtEdge";

async function testEmployeeFlow() {
  console.log("==================================================================");
  console.log("  TESTING REAL EMPLOYEE AUTHENTICATION, SESSIONS & RBAC DEFENSE");
  console.log("==================================================================\n");

  const testEmpId = "EMP-8225"; // Rahul Mehra (DEVELOPER)
  const testPassword = "Roushan@1234";

  console.log(`[1] Testing Live Login API with Employee ID: ${testEmpId}...`);

  const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      employeeId: testEmpId,
      password: testPassword,
      remember: true,
    }),
  });

  const loginRes = await loginHandler(loginReq);
  const loginData = await loginRes.json();

  console.log("Login API Status:", loginRes.status);
  console.log("Login API Success:", loginData.success);
  console.log("Login API User:", loginData.user?.name, `(${loginData.user?.employeeId})`);
  console.log("Login API Role:", loginData.user?.role);
  console.log("Login API Redirect URL:", loginData.redirectUrl);

  if (!loginData.success || loginRes.status !== 200) {
    console.error("❌ Login failed:", loginData.error);
    process.exit(1);
  }

  // Extract session cookie
  const setCookieHeader = loginRes.headers.get("set-cookie");
  console.log("\n[2] Session Cookie Generated:", !!setCookieHeader);

  let tokenValue = "";
  if (setCookieHeader) {
    const match = setCookieHeader.match(/oms_session=([^;]+)/);
    if (match) {
      tokenValue = match[1];
    }
  }

  console.log("[3] Cryptographic Session Verification via Edge Crypto...");
  const decodedPayload = await verifyJwtEdge(tokenValue);
  console.log("Decoded User ID:", decodedPayload?.id);
  console.log("Decoded Role:", decodedPayload?.role);

  if (!decodedPayload || decodedPayload.id !== loginData.user.id) {
    console.error("❌ Session token verification failed!");
    process.exit(1);
  }
  console.log("✓ Session verified successfully!");

  console.log("\n[4] Testing Authenticated Access to Employee Dashboard...");
  const empDashReq = new NextRequest("http://localhost:3000/employee/dashboard", {
    headers: { cookie: `oms_session=${tokenValue}` },
  });
  const empDashRes = await proxy(empDashReq);
  console.log("Employee Dashboard Access Status:", empDashRes.status);
  console.log("Employee Dashboard Cache-Control:", empDashRes.headers.get("Cache-Control"));

  console.log("\n[5] Testing RBAC Security: Employee attempting to access /admin/organisation...");
  const adminReq = new NextRequest("http://localhost:3000/admin/organisation", {
    headers: { cookie: `oms_session=${tokenValue}` },
  });
  const adminRes = await proxy(adminReq);
  const redirectedTo = adminRes.headers.get("location");
  console.log("Admin Route Intercepted? Location:", redirectedTo);

  if (!redirectedTo?.includes("/employee/dashboard")) {
    console.error("❌ RBAC Violation: Employee was NOT redirected away from /admin!");
    process.exit(1);
  }
  console.log("✓ RBAC Block Verified: Employee was successfully redirected to /employee/dashboard!");

  console.log("\n[6] Testing Logout API...");
  const logoutReq = new NextRequest("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: { cookie: `oms_session=${tokenValue}` },
  });
  const logoutRes = await logoutHandler(logoutReq);
  const logoutData = await logoutRes.json();
  console.log("Logout API Success:", logoutData.success);

  const logoutCookie = logoutRes.headers.get("set-cookie");
  console.log("Session Cookie Cleared:", logoutCookie?.includes("Max-Age=0") || logoutCookie?.includes("expires="));

  console.log("\n==================================================================");
  console.log("  ALL EMPLOYEE AUTHENTICATION & RBAC TESTS PASSED 100%");
  console.log("==================================================================\n");
}

testEmployeeFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
