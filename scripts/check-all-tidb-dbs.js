const mysql = require("mysql2/promise");

async function checkAllDatabases() {
  const connection = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "4BrXAABTf5SQeKq.root",
    password: "nGi46nlizXdJsS0a",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  const [databases] = await connection.query("SHOW DATABASES;");
  for (const dbObj of databases) {
    const dbName = Object.values(dbObj)[0];
    if (dbName === "INFORMATION_SCHEMA" || dbName === "PERFORMANCE_SCHEMA") continue;
    try {
      const [tables] = await connection.query(`SHOW TABLES FROM \`${dbName}\`;`);
      console.log(`Database [${dbName}] -> ${tables.length} tables:`, tables.map(t => Object.values(t)[0]));
    } catch (e) {
      console.log(`Database [${dbName}] error:`, e.message);
    }
  }

  await connection.end();
}

checkAllDatabases();
