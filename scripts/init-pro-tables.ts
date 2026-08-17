import mariadb from "mariadb";

async function initProTables() {
  console.log("🛠️ Initializing Pro OMS database tables (`taskcomment`, `notification`) in MySQL 'oms'...");
  try {
    const pool = mariadb.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "oms",
    });

    const conn = await pool.getConnection();

    // 1. Create taskcomment table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS taskcomment (
        id VARCHAR(191) PRIMARY KEY,
        taskId VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NOT NULL,
        commentText TEXT NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX TaskComment_taskId_fkey (taskId),
        INDEX TaskComment_userId_fkey (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✓ Table `taskcomment` created or verified in MySQL!");

    // 2. Create notification table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notification (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(191) NOT NULL DEFAULT 'INFO',
        isRead TINYINT(1) NOT NULL DEFAULT 0,
        linkUrl VARCHAR(191) NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX Notification_userId_fkey (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✓ Table `notification` created or verified in MySQL!");

    conn.release();
    await pool.end();
  } catch (err: any) {
    console.error("❌ Pro Tables Init Error:", err.message);
  }
  process.exit(0);
}

initProTables();
