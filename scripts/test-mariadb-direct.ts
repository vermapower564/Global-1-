import mariadb from "mariadb";

async function testDirectMariaDb() {
  console.log("🔍 Testing direct mariadb driver connection to 127.0.0.1:3306...");

  try {
    const pool = mariadb.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "oms",
      connectionLimit: 5,
      connectTimeout: 5000,
    });

    console.log("⏳ Getting connection from mariadb pool...");
    const conn = await pool.getConnection();
    console.log("✅ Successfully acquired connection from mariadb pool!");

    const rows = await conn.query("SELECT COUNT(*) AS total FROM user");
    console.log("📊 SELECT COUNT(*) result from user table:", rows);

    conn.release();
    await pool.end();
    console.log("🎉 Direct mariadb connection test passed!");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Direct mariadb connection error:", err);
    process.exit(1);
  }
}

testDirectMariaDb();
