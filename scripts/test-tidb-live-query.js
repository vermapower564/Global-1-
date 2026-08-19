const mysql = require("mysql2/promise");

async function testTiDBLiveQuery() {
  console.log("==================================================");
  console.log("🧪 Verifying Live Queries & Data Fetching on TiDB Cloud");
  console.log("==================================================\n");

  const conn = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "4BrXAABTf5SQeKq.root",
    password: "nGi46nlizXdJsS0a",
    database: "oms",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  try {
    // Test 1: Fetch Users
    const [users] = await conn.query("SELECT id, employeeId, name, email, role, phone FROM user LIMIT 5;");
    console.log(`✅ [1/5] User Records Fetched (${users.length} sample rows):`);
    console.table(users);

    // Test 2: Fetch Customer Reviews
    const [reviews] = await conn.query("SELECT id, employeeName, customerName, customerCompany, rating, reviewTitle FROM customerreview LIMIT 5;");
    console.log(`\n✅ [2/5] Customer Reviews Fetched (${reviews.length} sample rows):`);
    console.table(reviews);

    // Test 3: Fetch Projects
    const [projects] = await conn.query("SELECT id, projectTitle, clientCompany, contractValue, status FROM project LIMIT 5;");
    console.log(`\n✅ [3/5] Projects Fetched (${projects.length} sample rows):`);
    console.table(projects);

    // Test 4: Fetch Audit Logs
    const [logs] = await conn.query("SELECT id, action, details, ipAddress, timestamp FROM auditlog ORDER BY timestamp DESC LIMIT 5;");
    console.log(`\n✅ [4/5] Security Audit Logs Fetched (${logs.length} sample rows):`);
    console.table(logs);

    // Test 5: Fetch Departments
    const [depts] = await conn.query("SELECT id, name, code FROM department LIMIT 5;");
    console.log(`\n✅ [5/5] Departments Fetched (${depts.length} sample rows):`);
    console.table(depts);

    console.log("\n==================================================");
    console.log("🎉 ALL LIVE TIDB QUERIES EXECUTED WITH 100% SUCCESS!");
    console.log("==================================================");

  } catch (err) {
    console.error("Query Error:", err);
  } finally {
    await conn.end();
  }
}

testTiDBLiveQuery();
