import fs from "fs";
import path from "path";

// Load .env safely
const envPath = path.join(process.cwd(), ".env");
let envKeys: string[] = [];
let dbUrlParsed: any = null;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      envKeys.push(key);
      if (key === "DATABASE_URL") {
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        try {
          const u = new URL(val);
          dbUrlParsed = {
            protocol: u.protocol,
            hostname: u.hostname,
            port: u.port,
            pathname: u.pathname,
            searchParams: u.search,
            hasUsername: !!u.username,
            hasPassword: !!u.password,
          };
        } catch (e: any) {
          dbUrlParsed = { parseError: e.message };
        }
      }
    }
  }
}

console.log("==================================================================");
console.log("  SAFE DATABASE & ENVIRONMENT VARIABLE AUDIT");
console.log("==================================================================");
console.log("Discovered Environment Variable Keys in .env:", envKeys);
console.log("DATABASE_URL Host Information (Safe):", dbUrlParsed);
console.log("==================================================================");
