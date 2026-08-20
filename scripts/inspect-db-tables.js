const { queryDb } = require("../lib/db");

async function checkTables() {
  try {
    const pCols = await queryDb("DESCRIBE project");
    console.log("=== PROJECT TABLE ===");
    console.log(pCols.map(c => `${c.Field} (${c.Type})`));

    const tCols = await queryDb("DESCRIBE task");
    console.log("\n=== TASK TABLE ===");
    console.log(tCols.map(c => `${c.Field} (${c.Type})`));

    const tables = await queryDb("SHOW TABLES");
    console.log("\n=== ALL TABLES ===");
    console.log(tables);
  } catch (e) {
    console.error("DB Error:", e);
  }
}

checkTables();
