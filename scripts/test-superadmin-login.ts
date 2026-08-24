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

import { POST } from "../app/api/auth/login/route";
import { NextRequest } from "next/server";

async function testSuperAdminLogin() {
  console.log("==================================================================");
  console.log("  TESTING LOGIN FOR EMP-8595 (SUPER_ADMIN)");
  console.log("==================================================================\n");

  const req = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      identity: "EMP-8595",
      password: "Roushan@123",
    }),
  });

  try {
    const res = await POST(req);
    console.log("Response Status:", res.status);
    const json = await res.json();
    console.log("Response JSON:", JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error("Login test threw exception:", err);
  }
}

testSuperAdminLogin();
