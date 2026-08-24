import fs from "fs";
import path from "path";

// Load .env variables
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

import { queryDb } from "../lib/db";
import bcrypt from "bcryptjs";

async function inspectDbUsers() {
  console.log("==================================================================");
  console.log("  INSPECTING DATABASE USERS & AUTHENTICATION");
  console.log("==================================================================\n");

  try {
    const users: any[] = await queryDb(
      `SELECT id, name, email, employeeId, role, isActive, isResigned, password FROM user LIMIT 20`
    );

    console.log(`Found ${users.length} sample users in TiDB database:`);
    for (const u of users) {
      const isBcrypt = typeof u.password === "string" && (u.password.startsWith("$2a$") || u.password.startsWith("$2b$") || u.password.startsWith("$2y$"));
      console.log(`- [${u.role}] ${u.name} | ID: ${u.id} | EmpID: ${u.employeeId} | Email: ${u.email} | Active: ${u.isActive} | Resigned: ${u.isResigned} | PasswordHashType: ${isBcrypt ? "bcrypt" : "plain/other"} (len: ${u.password?.length})`);
    }

    // Let's test a sample login password against the bcrypt hash
    console.log("\nTesting common password candidates on sample users...");
    const candidates = ["Admin@123", "Admin@1234", "Admin@2026", "Password@123", "password", "Global@123", "OMS@2026", "123456", "12345678", "Admin123", "Admin1234", "admin", "Admin#123", "Global#2026"];
    
    for (const u of users.slice(0, 5)) {
      console.log(`\nChecking user ${u.name} (${u.email} / ${u.employeeId}):`);
      let found = false;
      for (const cand of candidates) {
        if (await bcrypt.compare(cand, u.password)) {
          console.log(`  ✓ Matched password candidate: "${cand}"`);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`  ✗ None of standard test passwords matched hash: ${u.password.substring(0, 20)}...`);
      }
    }
  } catch (err: any) {
    console.error("DB Query error:", err);
  }
}

inspectDbUsers();
