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

import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/authService";

const EXCLUDED_MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "HR",
  "PROJECT_MANAGER",
  "TEAM_LEADER",
];

async function resetEmployeePasswords() {
  console.log("==================================================================");
  console.log("  OMS ONE-TIME EMPLOYEE PASSWORD RESET FOR HR TESTING");
  console.log("==================================================================\n");

  try {
    // 1. Generate secure bcrypt hash for the temporary password
    const temporaryPassword = "Roushan@123";
    const hashedPassword = await hashPassword(temporaryPassword);

    // 2. Query all existing employee accounts
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { employeeId: "asc" },
    });

    // 3. Filter for Employee-level accounts (excluding Admin, HR, PM, TL)
    const employeeUsers = allUsers.filter(
      (u) => !EXCLUDED_MANAGEMENT_ROLES.includes(u.role as string)
    );

    console.log(`Found ${employeeUsers.length} existing employee account(s) to update:\n`);

    let updatedCount = 0;

    for (const emp of employeeUsers) {
      await prisma.user.update({
        where: { id: emp.id },
        data: {
          password: hashedPassword,
          isActive: true,
        },
      });

      console.log(`✓ Updated [${emp.role}] ${emp.name} | Employee ID: ${emp.employeeId} | Email: ${emp.email}`);
      updatedCount++;
    }

    // 4. Verify password update using comparePassword()
    if (employeeUsers.length > 0) {
      const sampleEmp = await prisma.user.findUnique({
        where: { id: employeeUsers[0].id },
        select: { id: true, employeeId: true, password: true },
      });

      const isVerified = sampleEmp ? await comparePassword(temporaryPassword, sampleEmp.password) : false;
      console.log(`\nPassword verification check on sample account (${sampleEmp?.employeeId}): ${isVerified ? "SUCCESS" : "FAILED"}`);
    }

    console.log("\n==================================================================");
    console.log(`  RESET SUMMARY: ${updatedCount} Employee Account(s) Successfully Updated`);
    console.log("==================================================================\n");

    process.exit(0);
  } catch (error: any) {
    console.error("Password reset error:", error?.message || error);
    process.exit(1);
  }
}

resetEmployeePasswords();
