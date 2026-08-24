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

async function checkPasswords() {
  const users: any[] = await queryDb(
    `SELECT id, name, email, employeeId, role, isActive, isResigned, password FROM user`
  );

  console.log(`Total users in DB: ${users.length}`);
  let matchedCount = 0;
  for (const u of users) {
    const isMatch = await bcrypt.compare("Roushan@123", u.password);
    if (isMatch) {
      matchedCount++;
    } else {
      console.log(`User ${u.name} (${u.email} / ${u.employeeId}) does NOT match "Roushan@123"`);
    }
  }
  console.log(`Matched Roushan@123: ${matchedCount} / ${users.length} users`);
}

checkPasswords();
