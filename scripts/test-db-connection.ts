import mariadb from "mariadb";

async function testConnection() {
  console.log("🔌 Testing direct IPv4 (127.0.0.1:3306) connection...");
  try {
    const pool = mariadb.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "oms",
      connectTimeout: 5000,
    });

    const conn = await pool.getConnection();
    console.log("✅ SUCCESS! Connected to MySQL database 'oms' at 127.0.0.1:3306!");

    const rows = await conn.query("SELECT id, employeeId, name, email, role, password FROM user LIMIT 10");
    console.log("📊 MySQL User Table Records:\n", JSON.stringify(rows, null, 2));

    conn.release();
    await pool.end();
  } catch (err: any) {
    console.error("❌ Direct MySQL Connection Error:", err.message);
  }
  process.exit(0);
}

testConnection();
