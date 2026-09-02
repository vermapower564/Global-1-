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

async function inspectUserColumns() {
  const columns = await queryDb<any[]>(`SHOW COLUMNS FROM user`);
  console.log("=== USER TABLE COLUMNS ===");
  columns.forEach((c) => console.log(` - ${c.Field} (${c.Type})`));
}

inspectUserColumns().then(() => process.exit(0)).catch((err) => {
  console.error("Error inspecting columns:", err);
  process.exit(1);
});
