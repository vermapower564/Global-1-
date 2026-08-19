const mysql = require("mysql2/promise");

async function syncLocalToTiDB() {
  console.log("==================================================");
  console.log("⚡ Synchronizing Schema & Data: Local MariaDB -> TiDB Cloud");
  console.log("==================================================\n");

  const localConn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "oms",
  });

  const tidbConn = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "4BrXAABTf5SQeKq.root",
    password: "nGi46nlizXdJsS0a",
    database: "oms",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    multipleStatements: true,
  });

  try {
    // 1. Get all tables from local
    const [localTables] = await localConn.query("SHOW TABLES;");
    const tableNames = localTables.map((t) => Object.values(t)[0]);
    console.log(`1. Found ${tableNames.length} tables in local database:`, tableNames.join(", "));

    // Disable foreign key checks on TiDB
    await tidbConn.query("SET FOREIGN_KEY_CHECKS = 0;");

    console.log("\n2. Creating tables in TiDB Cloud...");
    for (const tbl of tableNames) {
      const [createTableResult] = await localConn.query(`SHOW CREATE TABLE \`${tbl}\`;`);
      const createSql = createTableResult[0]["Create Table"];

      // Drop and recreate in TiDB
      await tidbConn.query(`DROP TABLE IF EXISTS \`${tbl}\`;`);
      await tidbConn.query(createSql);
      console.log(`   ✓ Created table: ${tbl}`);
    }

    console.log("\n3. Migrating Data from Local MariaDB to TiDB Cloud...");
    for (const tbl of tableNames) {
      const [rows] = await localConn.query(`SELECT * FROM \`${tbl}\`;`);
      if (rows.length > 0) {
        // Insert rows in batches
        const keys = Object.keys(rows[0]);
        const placeholders = keys.map(() => "?").join(", ");
        const insertSql = `INSERT INTO \`${tbl}\` (\`${keys.join("`, `")}\`) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = keys.map((k) => row[k]);
          await tidbConn.query(insertSql, values);
        }
        console.log(`   ✓ Copied ${rows.length} rows into '${tbl}'`);
      } else {
        console.log(`   • Table '${tbl}' is empty (0 rows copied)`);
      }
    }

    await tidbConn.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log("\n==================================================");
    console.log("🎉 SUCCESS: TiDB Cloud Database is fully synchronized!");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Sync Error:", err);
  } finally {
    await localConn.end();
    await tidbConn.end();
  }
}

syncLocalToTiDB();
