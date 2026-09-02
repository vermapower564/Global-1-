import fs from "fs";
import path from "path";

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

async function addLockoutColumns() {
  console.log("Adding lockout columns to user table if not existing...");
  const columns = await queryDb<any[]>(`SHOW COLUMNS FROM user`);
  const fieldNames = columns.map((c) => c.Field);

  if (!fieldNames.includes("failedLoginAttempts")) {
    await queryDb(`ALTER TABLE user ADD COLUMN failedLoginAttempts INT DEFAULT 0`);
    console.log("✓ Added failedLoginAttempts column.");
  } else {
    console.log("✓ failedLoginAttempts column already exists.");
  }

  if (!fieldNames.includes("lockoutUntil")) {
    await queryDb(`ALTER TABLE user ADD COLUMN lockoutUntil DATETIME(3) NULL`);
    console.log("✓ Added lockoutUntil column.");
  } else {
    console.log("✓ lockoutUntil column already exists.");
  }

  // Reset any expired or lingering lockouts on admin accounts
  await queryDb(
    `UPDATE user SET failedLoginAttempts = 0, lockoutUntil = NULL WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'HR', 'ADMIN_HR', 'PROJECT_MANAGER')`
  );
  console.log("✓ Reset lockout status for all Admin accounts.");
}

addLockoutColumns().then(() => process.exit(0)).catch((err) => {
  console.error("Failed to add lockout columns:", err);
  process.exit(1);
});
