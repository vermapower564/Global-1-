const mysql = require("mysql2/promise");

async function testTiDBConnection() {
  console.log("==================================================");
  console.log("🚀 Testing TiDB Cloud Connection & Inspecting Schema");
  console.log("==================================================\n");

  const host = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com";
  const port = 4000;
  const user = "4BrXAABTf5SQeKq.root";
  const password = "nGi46nlizXdJsS0a";

  let connection;
  try {
    console.log(`1. Connecting to TiDB Server at ${host}:${port}...`);
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });

    console.log("   ✅ Connection Established Successfully to TiDB Cloud!\n");

    // 2. List Databases
    console.log("2. Inspecting Available Databases in TiDB Cluster:");
    const [databases] = await connection.query("SHOW DATABASES;");
    console.log("   Databases found:", databases.map((d) => Object.values(d)[0]));

    // Check if 'oms' database exists
    const dbNames = databases.map((d) => Object.values(d)[0]);
    const targetDb = dbNames.includes("oms") ? "oms" : (dbNames.includes("test") ? "test" : "sys");

    console.log(`\n3. Switching to Database '${targetDb}' to inspect tables & schema...`);
    await connection.query(`USE \`${targetDb}\`;`);

    // List tables in targetDb
    const [tables] = await connection.query("SHOW TABLES;");
    const tableNames = tables.map((t) => Object.values(t)[0]);
    console.log(`   Found ${tableNames.length} tables in '${targetDb}':`, tableNames);

    console.log("\n4. Inspecting Schema & Fetching Sample Data for each table:\n");

    const schemaSummary = {};

    for (const tbl of tableNames) {
      console.log(`--------------------------------------------------`);
      console.log(`📊 TABLE: ${tbl}`);
      console.log(`--------------------------------------------------`);

      // Describe table
      const [columns] = await connection.query(`DESCRIBE \`${tbl}\`;`);
      const colDetails = columns.map((c) => ({
        Field: c.Field,
        Type: c.Type,
        Null: c.Null,
        Key: c.Key,
        Default: c.Default,
        Extra: c.Extra,
      }));

      // Count rows
      const [countResult] = await connection.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\`;`);
      const count = countResult[0].cnt;

      // Fetch 2 sample rows
      const [sampleRows] = await connection.query(`SELECT * FROM \`${tbl}\` LIMIT 2;`);

      schemaSummary[tbl] = {
        columnCount: columns.length,
        columns: colDetails,
        rowCount: count,
        sample: sampleRows,
      };

      console.log(`   • Column Count: ${columns.length}`);
      console.log(`   • Row Count: ${count}`);
      console.log("   • Columns:", columns.map((c) => `${c.Field} (${c.Type})`).join(", "));
      if (sampleRows.length > 0) {
        console.log("   • Sample Data (Row 1):", JSON.stringify(sampleRows[0], null, 2));
      } else {
        console.log("   • Sample Data: (Table is empty)");
      }
      console.log("");
    }

    console.log("==================================================");
    console.log("🎉 TiDB Diagnostics & Schema Inspection Complete!");
    console.log("==================================================");

  } catch (err) {
    console.error("\n❌ TiDB Connection Error:", err.message);
    if (err.code) console.error("   Error Code:", err.code);
    if (err.sqlState) console.error("   SQL State:", err.sqlState);
  } finally {
    if (connection) await connection.end();
  }
}

testTiDBConnection();
