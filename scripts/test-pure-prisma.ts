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

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function runStep1Diagnostic() {
  console.log("==================================================================");
  console.log("  STEP 1 — DIRECT PRISMA DATABASE CONNECTIVITY TEST");
  console.log("==================================================================\n");

  let dbConn = "FAIL";
  let prismaClient = "FAIL";
  let userTable = "FAIL";
  let userCount = 0;
  let loginLookup = "FAIL";
  let errorCategory = "NONE";

  try {
    // 1. Prisma Client & harmless queryRaw
    const rawResult: any = await prisma.$queryRaw`SELECT 1 as connected`;
    if (rawResult && rawResult.length > 0) {
      dbConn = "PASS";
      prismaClient = "PASS";
    }

    // 2. User table access & count
    userCount = await prisma.user.count();
    userTable = "PASS";

    // 3. Login user lookup with real Employee ID
    const testEmployeeId = "EMP-8225"; // Rahul Mehra
    const foundUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: testEmployeeId },
          { email: "rahul.mehra@gmail.com" },
        ],
      },
      include: {
        department: true,
      },
    });

    if (foundUser && foundUser.employeeId === testEmployeeId) {
      loginLookup = "PASS";
      // Test password hash comparison with Roushan@1234
      const isMatch = await bcrypt.compare("Roushan@1234", foundUser.password);
      console.log(`Password verification with temporary password 'Roushan@1234': ${isMatch ? "SUCCESS" : "FAILED"}`);
    }
  } catch (err: any) {
    console.error("Prisma error occurred:", err?.message || err);
    if (err?.message?.includes("connect") || err?.message?.includes("ETIMEDOUT") || err?.message?.includes("ECONNREFUSED")) {
      errorCategory = "connection";
    } else if (err?.message?.includes("PrismaClientInitializationError") || err?.message?.includes("Environment variable not found")) {
      errorCategory = "configuration";
    } else {
      errorCategory = "query";
    }
  }

  console.log(`DATABASE CONNECTION: ${dbConn}`);
  console.log(`PRISMA CLIENT: ${prismaClient}`);
  console.log(`USER TABLE: ${userTable}`);
  console.log(`USER COUNT: ${userCount}`);
  console.log(`LOGIN LOOKUP: ${loginLookup}`);
  console.log(`ACTUAL ERROR CATEGORY: ${errorCategory}`);
  console.log("\n==================================================================");

  if (dbConn === "PASS" && prismaClient === "PASS" && userTable === "PASS" && loginLookup === "PASS") {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep1Diagnostic();
