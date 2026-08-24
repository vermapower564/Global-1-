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
import mariadb from "mariadb";

async function runDiagnostic() {
  console.log("==================================================================");
  console.log("  SAFE DATABASE & PRISMA DIAGNOSTIC");
  console.log("==================================================================\n");

  let dbConn = "FAIL";
  let prismaClient = "FAIL";
  let userTable = "FAIL";
  let userCount = 0;
  let loginQuery = "FAIL";

  // 1. Test Prisma Client
  try {
    const pCount = await prisma.user.count();
    prismaClient = "PASS";
    userTable = "PASS";
    userCount = pCount;

    // Test a sample login query via Prisma
    const sample = await prisma.user.findFirst({
      select: { id: true, employeeId: true, email: true, role: true, isActive: true },
    });
    if (sample) {
      loginQuery = "PASS";
    }
  } catch (err: any) {
    console.error("Prisma diagnostic error:", err?.message || err);
  }

  // 2. Test mariadb driver connection pool
  try {
    const rawUrl = process.env.DATABASE_URL;
    if (rawUrl) {
      const url = new URL(rawUrl);
      const isCloudHost = url.hostname.includes("tidbcloud.com") || url.port === "4000" || url.search.includes("ssl");

      const pool = mariadb.createPool({
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
        connectionLimit: 5,
        connectTimeout: 10000,
        ssl: isCloudHost
          ? {
              minVersion: "TLSv1.2",
              rejectUnauthorized: false,
            }
          : undefined,
      });

      const rows: any[] = await pool.query("SELECT COUNT(*) as cnt FROM user");
      if (rows && rows.length > 0) {
        dbConn = "PASS";
      }
      await pool.end();
    }
  } catch (err: any) {
    console.error("MariaDB pool diagnostic error:", err?.message || err);
  }

  console.log(`DATABASE CONNECTION: ${dbConn}`);
  console.log(`PRISMA CLIENT: ${prismaClient}`);
  console.log(`USER TABLE: ${userTable}`);
  console.log(`USER COUNT: ${userCount}`);
  console.log(`LOGIN QUERY: ${loginQuery}`);
  console.log("\n==================================================================");

  if (prismaClient === "PASS" && loginQuery === "PASS") {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runDiagnostic();
