import mariadb from "mariadb";

async function fixMysqlColumns() {
  console.log("🛠️ Checking & Adding missing MySQL columns in database 'oms'...");
  try {
    const pool = mariadb.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "oms",
    });

    const conn = await pool.getConnection();

    // 1. Add projectId to dailyworkupdate if missing
    try {
      await conn.query(`
        ALTER TABLE dailyworkupdate ADD COLUMN projectId VARCHAR(191) NULL;
      `);
      console.log("✓ Added missing `projectId` column to `dailyworkupdate` table!");
    } catch (e: any) {
      if (e.message.includes("Duplicate column name")) {
        console.log("✓ `dailyworkupdate.projectId` column already exists.");
      } else {
        console.warn("dailyworkupdate column check:", e.message);
      }
    }

    conn.release();
    await pool.end();
  } catch (err: any) {
    console.error("❌ Column Fix Error:", err.message);
  }
  process.exit(0);
}

fixMysqlColumns();
