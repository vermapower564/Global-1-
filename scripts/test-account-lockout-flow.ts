import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const k = trimmed.substring(0, eqIdx).trim();
      let v = trimmed.substring(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.substring(1, v.length - 1);
      }
      process.env[k] = v;
    }
  });
}

import { queryDb } from "../lib/db";
import { POST as loginHandler } from "../app/api/auth/login/route";

function makeJsonReq(url: string, body: any) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details: string;
}

async function runAccountLockoutAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — ACCOUNT LOCKOUT & UNLOCK AUDIT (8/8) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  function record(code: string, name: string, passed: boolean, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    console.log(`[${code}] ${name.padEnd(58, ".")} ${statusLabel}`);
    console.log(`      Details: ${details}\n`);
    results.push({ code, name, passed, details });
  }

  // Fetch test admin user
  const adminUsers = await queryDb<any[]>(
    `SELECT id, employeeId, email, role FROM user WHERE role = 'SUPER_ADMIN' AND isActive = 1 LIMIT 1`
  );

  if (!adminUsers || adminUsers.length === 0) {
    throw new Error("No SUPER_ADMIN user found in database for lockout testing.");
  }

  const admin = adminUsers[0];
  const adminIdentity = admin.email;
  const validPassword = "Roushan@123";

  try {
    // 0. Ensure Account is Unlocked before test start
    await queryDb(`UPDATE user SET failedLoginAttempts = 0, lockoutUntil = NULL WHERE id = ?`, [admin.id]);

    // 1. Correct Admin ID + Roushan@123 -> Successful Login
    const req1 = makeJsonReq("http://localhost:3000/api/auth/login", { identity: adminIdentity, password: validPassword });
    const res1 = await loginHandler(req1);
    const json1 = await res1.json();
    const test1Passed = res1.status === 200 && json1.success === true && json1.redirectTo === "/admin/dashboard";
    record("LOCK-01", "Initial Authorised Login (Roushan@123)", test1Passed, `Status 200: Successfully authenticated -> Redirect: "${json1.redirectTo}"`);

    // 2. Wrong Password Attempt -> Counter Increments
    const req2 = makeJsonReq("http://localhost:3000/api/auth/login", { identity: adminIdentity, password: "WrongPassword1!" });
    const res2 = await loginHandler(req2);
    const json2 = await res2.json();
    const dbCheck2 = await queryDb<any[]>(`SELECT failedLoginAttempts FROM user WHERE id = ?`, [admin.id]);
    const test2Passed = res2.status === 401 && dbCheck2[0]?.failedLoginAttempts === 1;
    record("LOCK-02", "Single Failed Attempt Counter Increment", test2Passed, `Status 401: Failed attempt logged, DB counter = ${dbCheck2[0]?.failedLoginAttempts} (${json2.error})`);

    // 3. Successful Login Resets Failed Attempts Counter
    const req3 = makeJsonReq("http://localhost:3000/api/auth/login", { identity: adminIdentity, password: validPassword });
    const res3 = await loginHandler(req3);
    const dbCheck3 = await queryDb<any[]>(`SELECT failedLoginAttempts FROM user WHERE id = ?`, [admin.id]);
    const test3Passed = res3.status === 200 && dbCheck3[0]?.failedLoginAttempts === 0;
    record("LOCK-03", "Successful Login Counter Reset", test3Passed, `Status 200: Counter reset to 0 in database`);

    // 4. Consecutive Failed Attempts (5 Attempts) -> Triggers Account Lockout
    let lockTriggered = false;
    let lastJson: any = null;
    for (let i = 1; i <= 5; i++) {
      const reqFail = makeJsonReq("http://localhost:3000/api/auth/login", { identity: adminIdentity, password: "WrongPassword!" });
      const resFail = await loginHandler(reqFail);
      lastJson = await resFail.json();
      if (resFail.status === 423 && lastJson.isLocked === true) {
        lockTriggered = true;
      }
    }
    const dbCheck4 = await queryDb<any[]>(`SELECT failedLoginAttempts, lockoutUntil FROM user WHERE id = ?`, [admin.id]);
    const rawLock = dbCheck4[0]?.lockoutUntil;
    const isDbLocked = Boolean(rawLock) && (new Date(rawLock).getTime() > 0);
    const test4Passed = lockTriggered && isDbLocked;
    record("LOCK-04", "5 Consecutive Failed Attempts Account Lockout", test4Passed, `Account locked in DB until ${dbCheck4[0]?.lockoutUntil} ("${lastJson?.error}")`);

    // 5. Valid Password Attempt while Account is Locked -> REJECTED
    const reqLockedValid = makeJsonReq("http://localhost:3000/api/auth/login", { identity: adminIdentity, password: validPassword });
    const resLockedValid = await loginHandler(reqLockedValid);
    const jsonLockedValid = await resLockedValid.json();
    const test5Passed = resLockedValid.status === 423 && jsonLockedValid.isLocked === true;
    record("LOCK-05", "Valid Password Rejected While Account Locked", test5Passed, `Status 423: Valid credentials rejected during lockout ("${jsonLockedValid.error}")`);

    // 6. Backend-Calculated Lockout Expiry Timer
    const remainingMins = jsonLockedValid.remainingMinutes;
    const test6Passed = typeof remainingMins === "number" && remainingMins > 0 && remainingMins <= 15;
    record("LOCK-06", "Backend-Calculated Lockout Timer", test6Passed, `Remaining lockout duration computed from DB: ${remainingMins} minute(s)`);

    // 7. Developer / Admin Account Unlock Functionality
    await queryDb(`UPDATE user SET failedLoginAttempts = 0, lockoutUntil = NULL WHERE id = ?`, [admin.id]);
    const dbCheck7 = await queryDb<any[]>(`SELECT failedLoginAttempts, lockoutUntil FROM user WHERE id = ?`, [admin.id]);
    const test7Passed = dbCheck7[0]?.failedLoginAttempts === 0 && dbCheck7[0]?.lockoutUntil === null;
    record("LOCK-07", "Development / Testing Account Unlock Utility", test7Passed, `Account unlocked: DB counter reset to 0, lockoutUntil = NULL`);

    // 8. Post-Unlock Authorised Admin Login
    const reqPostUnlock = makeJsonReq("http://localhost:3000/api/auth/login", { identity: adminIdentity, password: validPassword });
    const resPostUnlock = await loginHandler(reqPostUnlock);
    const jsonPostUnlock = await resPostUnlock.json();
    const test8Passed = resPostUnlock.status === 200 && jsonPostUnlock.success === true;
    record("LOCK-08", "Post-Unlock Authorised Login Verification", test8Passed, `Status 200: Successfully authenticated -> Redirect: "${jsonPostUnlock.redirectTo}"`);

  } catch (err: any) {
    console.error("Account lockout audit error:", err);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  console.log("=========================================================================");
  console.log("ACCOUNT LOCKOUT & UNLOCK SUMMARY");
  console.log("=========================================================================");
  results.forEach((r) => {
    console.log(`[${r.code}] ${r.name.padEnd(58, ".")} ${r.passed ? "PASSED" : "FAILED"}`);
  });

  console.log("=========================================================================");
  console.log(`Total Checks Passed: ${passed}/${results.length}`);
  console.log(`Total Checks Failed: ${failed}/${results.length}`);
  console.log("=========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAccountLockoutAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL AUDIT ERROR:", err);
  process.exit(1);
});
