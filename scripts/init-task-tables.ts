import mariadb from "mariadb";

async function initTaskTables() {
  console.log("🛠️ Initializing `task` and `taskhistory` tables in MySQL database 'oms'...");
  try {
    const pool = mariadb.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "oms",
    });

    const conn = await pool.getConnection();

    // 1. Create `task` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS task (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        description TEXT NULL,
        projectId VARCHAR(191) NULL,
        assignedToUserId VARCHAR(191) NOT NULL,
        createdById VARCHAR(191) NULL,
        status VARCHAR(191) NOT NULL DEFAULT 'ASSIGNED',
        priority VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
        progress INT NOT NULL DEFAULT 0,
        startDate DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        dueDate DATETIME(3) NOT NULL,
        completedAt DATETIME(3) NULL,
        estimatedHours DOUBLE NOT NULL DEFAULT 8,
        actualHours DOUBLE NOT NULL DEFAULT 0,
        blockerReason TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX Task_assignedToUserId_fkey (assignedToUserId),
        INDEX Task_createdById_fkey (createdById),
        INDEX Task_projectId_fkey (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create `taskhistory` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS taskhistory (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        taskId VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NULL,
        action VARCHAR(191) NOT NULL,
        oldValue TEXT NULL,
        newValue TEXT NULL,
        description TEXT NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX TaskHistory_taskId_fkey (taskId),
        INDEX TaskHistory_userId_fkey (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ `task` & `taskhistory` tables initialized successfully in MySQL!");
    conn.release();
    await pool.end();
  } catch (err: any) {
    console.error("❌ Table Initialization Error:", err.message);
  }
  process.exit(0);
}

initTaskTables();
