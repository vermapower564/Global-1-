import fs from "fs";
import path from "path";

// Load .env
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

import { verifyJwtEdge } from "../lib/jwtEdge";

async function runLoginApiFlowTest() {
  console.log("==================================================================");
  console.log("  OMS LOGIN API FLOW VERIFICATION (POST /api/auth/login)");
  console.log("==================================================================\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Successful Login with EMP-8595
  console.log("[1] Testing valid login for EMP-8595 (Super Admin)...");
  const payload1 = {
    identity: "EMP-8595",
    password: "Roushan@123",
  };

  const res1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload1),
  });

  console.log(`Status Code: ${res1.status}`);
  const data1 = await res1.json();
  console.log("Response Body:", JSON.stringify(data1, null, 2));

  if (res1.status !== 200 || !data1.success) {
    console.error("FAIL: Expected 200 OK with success: true");
    process.exit(1);
  }

  if (data1.user?.password) {
    console.error("SECURITY FAIL: User password exposed in response!");
    process.exit(1);
  }

  // Check Set-Cookie header
  const setCookie1 = res1.headers.get("set-cookie") || "";
  console.log(`Set-Cookie received: ${setCookie1.includes("oms_session") ? "YES (oms_session present)" : "NO"}`);
  if (!setCookie1.includes("oms_session")) {
    console.error("FAIL: oms_session cookie was not set!");
    process.exit(1);
  }

  // Verify JWT session token cryptographic signature
  const decoded1 = await verifyJwtEdge(data1.token);
  console.log(`Decoded JWT Role: ${decoded1?.role}, User ID: ${decoded1?.id}`);
  if (decoded1?.role !== "SUPER_ADMIN") {
    console.error("FAIL: JWT payload role mismatch!");
    process.exit(1);
  }

  // Test 2: Invalid password test
  console.log("\n[2] Testing invalid password for EMP-8595...");
  const res2 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "EMP-8595",
      password: "WrongPassword999!",
    }),
  });

  console.log(`Status Code: ${res2.status}`);
  const data2 = await res2.json();
  console.log("Response Body:", JSON.stringify(data2, null, 2));

  if (res2.status !== 401 || data2.success !== false) {
    console.error("FAIL: Expected 401 Unauthorized for invalid password");
    process.exit(1);
  }

  // Test 3: Independent Employee login with EMP-8225 (Developer)
  console.log("\n[3] Testing independent login for EMP-8225 (Developer)...");
  const res3 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "EMP-8225",
      password: "Roushan@123",
    }),
  });

  console.log(`Status Code: ${res3.status}`);
  const data3 = await res3.json();
  console.log("Response Body:", JSON.stringify(data3, null, 2));

  if (res3.status !== 200 || !data3.success) {
    console.error("FAIL: Expected 200 OK for employee account");
    process.exit(1);
  }

  const decoded3 = await verifyJwtEdge(data3.token);
  console.log(`Decoded JWT Role: ${decoded3?.role}, User ID: ${decoded3?.id}`);
  if (decoded3?.role !== "DEVELOPER" || decoded3?.id === decoded1?.id) {
    console.error("FAIL: Employee session isolation failed!");
    process.exit(1);
  }

  console.log("\n==================================================================");
  console.log("  ALL LOGIN API REQUIREMENTS VERIFIED & PASSED 100%");
  console.log("==================================================================");
  process.exit(0);
}

runLoginApiFlowTest();
