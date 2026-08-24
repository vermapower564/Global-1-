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

import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/authService";

async function setAllMembersPassword() {
  console.log("==================================================================");
  console.log("  SETTING PASSWORD FOR ALL MEMBERS TO 'Roushan@123'");
  console.log("==================================================================\n");

  try {
    const targetPassword = "Roushan@123";
    const hashedPassword = await hashPassword(targetPassword);

    // Fetch all existing members
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`Found ${allUsers.length} account(s) in total to update.\n`);

    let updatedCount = 0;
    for (const u of allUsers) {
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hashedPassword },
      });
      console.log(`✓ [${u.role}] ${u.name} | ID: ${u.employeeId} | Email: ${u.email}`);
      updatedCount++;
    }

    console.log(`\nVerification check across roles with 'Roushan@123':`);
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: { employeeId: true, role: true, password: true },
    });

    for (const sample of sampleUsers) {
      const isMatch = await comparePassword(targetPassword, sample.password);
      console.log(`- ${sample.employeeId} (${sample.role}): ${isMatch ? "SUCCESS" : "FAILED"}`);
    }

    console.log("\n==================================================================");
    console.log(`  COMPLETED: All ${updatedCount} accounts successfully updated to 'Roushan@123'`);
    console.log("==================================================================");
  } catch (err: any) {
    console.error("Error setting passwords:", err);
  }
}

setAllMembersPassword();
