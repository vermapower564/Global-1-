import mariadb from "mariadb";

async function initOtpTable() {
  console.log("🛠️ Creating `otptoken` table directly in MySQL database 'oms'...");
  try {
    const pool = mariadb.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "oms",
    });

    const conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS otptoken (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        email VARCHAR(191) NOT NULL,
        otpHash VARCHAR(191) NOT NULL,
        expiresAt DATETIME(3) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX OtpToken_email_idx (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ `otptoken` table verified & ready in MySQL database!");
    conn.release();
    await pool.end();
  } catch (err: any) {
    console.error("❌ Table Init Error:", err.message);
  }
  process.exit(0);
}

initOtpTable();
