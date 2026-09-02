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
import { comparePassword, hashPassword } from "../lib/authService";

async function verifyAndFixAdminPasswords() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — ADMIN PASSWORD HASH VERIFICATION & SYNC ===");
  console.log("=========================================================================\n");

  const targetPassword = "Roushan@123";
  const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "HR", "ADMIN_HR", "PROJECT_MANAGER"];

  const placeholders = ADMIN_ROLES.map(() => "?").join(",");
  const adminUsers = await queryDb<any[]>(
    `SELECT id, employeeId, email, name, role, password, isActive FROM user WHERE role IN (${placeholders})`,
    ADMIN_ROLES
  );

  console.log(`Found ${adminUsers.length} Admin/Manager accounts in database.\n`);

  let verifiedCount = 0;
  let updatedCount = 0;

  for (const user of adminUsers) {
    const isAlreadyValid = await comparePassword(targetPassword, user.password || "");
    if (isAlreadyValid) {
      console.log(`[VALID] Admin ${user.email} (${user.employeeId || user.id}) — Hash already matches "Roushan@123"`);
      verifiedCount++;
    } else {
      console.log(`[UPDATING] Admin ${user.email} (${user.employeeId || user.id}) — Updating hash to valid bcrypt hash...`);
      const newHash = await hashPassword(targetPassword);
      await queryDb(`UPDATE user SET password = ? WHERE id = ?`, [newHash, user.id]);
      const reCheck = await comparePassword(targetPassword, newHash);
      if (reCheck) {
        console.log(`  ✓ Successfully updated password hash for ${user.email}`);
        updatedCount++;
      } else {
        console.error(`  ❌ Failed to verify new password hash for ${user.email}`);
      }
    }
  }

  console.log("\n=========================================================================");
  console.log(`Summary: ${verifiedCount} already valid, ${updatedCount} updated successfully.`);
  console.log("=========================================================================\n");
}

verifyAndFixAdminPasswords().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Admin password verification error:", err);
  process.exit(1);
});
