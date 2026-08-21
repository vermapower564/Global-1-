require("dotenv").config();
const mysql = require("mysql2/promise");

async function setupTables() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    uri: url,
    ssl: { rejectUnauthorized: true },
  });

  console.log("Connected to TiDB Cloud.");

  // 1. Create promotionrecord table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS promotionrecord (
      id VARCHAR(191) PRIMARY KEY,
      employeeId VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      employeeName VARCHAR(191) NOT NULL,
      previousRole VARCHAR(191) NOT NULL,
      newRole VARCHAR(191) NOT NULL,
      performanceScore DOUBLE NOT NULL,
      reason TEXT NOT NULL,
      promotedById VARCHAR(191) NOT NULL,
      promotedByName VARCHAR(191) NOT NULL,
      comments TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (userId),
      INDEX (employeeId)
    )
  `);
  console.log("✓ promotionrecord table verified");

  // 2. Safely add columns to project if missing
  const addProjectCol = async (colDef) => {
    try {
      await connection.execute(`ALTER TABLE project ADD COLUMN ${colDef}`);
    } catch (e) {
      // Column may already exist
    }
  };

  await addProjectCol("projectCode VARCHAR(100)");
  await addProjectCol("projectType VARCHAR(100) DEFAULT 'WEB_APPLICATION'");
  await addProjectCol("requiredSkills TEXT");
  await addProjectCol("requiredRoles TEXT");
  await addProjectCol("techStack TEXT");
  await addProjectCol("expectedTeamSize INT DEFAULT 5");
  await addProjectCol("priority VARCHAR(50) DEFAULT 'MEDIUM'");
  await addProjectCol("projectManagerId VARCHAR(191)");

  console.log("✓ project columns verified");

  // 3. Safely add columns to user if missing
  const addUserCol = async (colDef) => {
    try {
      await connection.execute(`ALTER TABLE user ADD COLUMN ${colDef}`);
    } catch (e) {}
  };

  await addUserCol("skills TEXT");
  await addUserCol("experienceYears DOUBLE DEFAULT 2.0");

  console.log("✓ user columns verified");

  // Populate sample skills for employees
  await connection.execute(`
    UPDATE user SET skills = 'React, Next.js, Node.js, MySQL, TypeScript, UI/UX', experienceYears = 3.5 WHERE employeeId = 'EMP-6841' AND (skills IS NULL OR skills = '')
  `);
  await connection.execute(`
    UPDATE user SET skills = 'React, Next.js, Tailwind CSS, JavaScript, Redux', experienceYears = 2.0 WHERE employeeId = 'EMP014' AND (skills IS NULL OR skills = '')
  `);
  await connection.execute(`
    UPDATE user SET skills = 'React, Node.js, System Architecture, Team Leadership, MySQL, AWS', experienceYears = 5.0 WHERE employeeId = 'EMP-7592' AND (skills IS NULL OR skills = '')
  `);
  await connection.execute(`
    UPDATE user SET skills = 'Project Management, Agile, Scrum, Product Roadmaps, Client Communication', experienceYears = 7.0 WHERE employeeId = 'EMP-8222' AND (skills IS NULL OR skills = '')
  `);

  console.log("✓ skills data populated for test users");
  await connection.end();
}

setupTables().then(() => {
  console.log("Schema migration complete!");
  process.exit(0);
}).catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
