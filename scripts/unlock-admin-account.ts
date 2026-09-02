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

async function unlockAdminAccount() {
  const target = process.argv[2];

  if (!target) {
    console.log("Unlocking all Admin accounts in database...");
    await queryDb(
      `UPDATE user SET failedLoginAttempts = 0, lockoutUntil = NULL WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'HR', 'ADMIN_HR', 'PROJECT_MANAGER')`
    );
    console.log("✓ All Admin & Manager accounts unlocked successfully.");
    return;
  }

  const clean = target.trim().toLowerCase();
  console.log(`Unlocking account for target: ${clean}...`);
  await queryDb(
    `UPDATE user SET failedLoginAttempts = 0, lockoutUntil = NULL WHERE LOWER(email) = ? OR LOWER(employeeId) = ? OR id = ?`,
    [clean, clean, clean]
  );
  console.log(`✓ Account "${clean}" unlocked successfully.`);
}

unlockAdminAccount().then(() => process.exit(0)).catch((err) => {
  console.error("Unlock script error:", err);
  process.exit(1);
});
