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
import bcrypt from "bcryptjs";

async function inspectUser() {
  console.log("==================================================================");
  console.log("  INSPECTING USER: EMP-8595");
  console.log("==================================================================\n");

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: "EMP-8595" },
          { employeeId: "emp-8595" },
          { employeeId: { contains: "8595" } },
          { email: { contains: "8595" } },
        ],
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isResigned: true,
        password: true,
      },
    });

    if (user) {
      console.log(`Found user: ${user.name} (${user.employeeId})`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`isActive: ${user.isActive}`);
      console.log(`isResigned: ${user.isResigned}`);
      
      const testMatch123 = await bcrypt.compare("Roushan@123", user.password);
      const testMatch1234 = await bcrypt.compare("Roushan@1234", user.password);
      console.log(`Password match with 'Roushan@123': ${testMatch123}`);
      console.log(`Password match with 'Roushan@1234': ${testMatch1234}`);
    } else {
      console.log("USER WITH EMPLOYEE ID 'EMP-8595' NOT FOUND IN DATABASE!");
      // Search similar employee IDs
      const allUsers = await prisma.user.findMany({
        select: { employeeId: true, name: true, email: true, role: true },
        take: 20,
      });
      console.log("\nSample existing employee IDs in database:");
      allUsers.forEach(u => console.log(`- ${u.employeeId} (${u.name}, ${u.role})`));
    }
  } catch (err: any) {
    console.error("Prisma error during user lookup:", err);
  }
}

inspectUser();
