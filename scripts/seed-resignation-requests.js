const mysql = require("mysql2/promise");
require("dotenv").config();

async function seedResignations() {
  console.log("==================================================");
  console.log("🚪 Seeding Realistic Resignation Requests in TiDB Cloud");
  console.log("==================================================");

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || "4000", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
  });

  const [users] = await connection.query(`SELECT id, employeeId, name, email, role FROM user WHERE role NOT IN ('SUPER_ADMIN', 'DIRECTOR') LIMIT 5`);

  if (!users || users.length === 0) {
    console.log("No users found to seed resignations.");
    await connection.end();
    return;
  }

  const reasons = [
    "Relocating to hometown for personal reasons and pursuing higher education / specialized MS program.",
    "Accepted an on-site international technical lead role. Requesting standard 30-day notice handover.",
    "Transitioning to cloud data engineering domain closer to family. Completed all core Q3 deliverables.",
  ];

  for (let i = 0; i < Math.min(3, users.length); i++) {
    const user = users[i];
    const resId = `RES-${user.employeeId || user.id.slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    const resDate = new Date(Date.now() - (i * 2 + 1) * 24 * 3600 * 1000).toISOString().split("T")[0];
    const lastDay = new Date(Date.now() + (25 - i * 5) * 24 * 3600 * 1000).toISOString().split("T")[0];

    await connection.query(
      `INSERT INTO resignation (
        id, resignationId, userId, employeeId, employeeName, email, department, role,
        resignationDate, lastWorkingDay, reason, status, submittedAt, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'Engineering & Development', ?,
        ?, ?, ?, 'SUBMITTED', NOW(), NOW(), NOW()
      ) ON DUPLICATE KEY UPDATE
        employeeName = VALUES(employeeName),
        reason = VALUES(reason),
        status = VALUES(status),
        updatedAt = NOW()`,
      [
        `R-${user.id.slice(0, 8)}-${i}`,
        resId,
        user.id,
        user.employeeId || `EMP-${user.id.slice(0, 4)}`,
        user.name,
        user.email,
        user.role,
        resDate,
        lastDay,
        reasons[i],
      ]
    );
  }

  await connection.end();
  console.log("✅ Successfully seeded 3 realistic resignation requests in TiDB Cloud!");
}

seedResignations().catch(console.error);
