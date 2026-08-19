const mysql = require("mysql2/promise");
require("dotenv").config();

async function seedCleanSimpleTasks() {
  console.log("==================================================");
  console.log("✨ Seeding Clean, Simple, Human-Readable Tasks in TiDB Cloud");
  console.log("==================================================");

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not found.");
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

  const [users] = await connection.query(`SELECT id, employeeId, name, role FROM user`);
  console.log(`Found ${users.length} employees.`);

  const cleanTasks = [
    {
      title: "Test employee shift punch clock and attendance radar",
      description: "Verify that daily punch in/out timestamps, hours worked, and live active shift badges update in real-time.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      progress: 65,
      estimatedHours: 6,
    },
    {
      title: "Verify August 2026 employee salary slips and payouts",
      description: "Check gross salary breakdown, PF deductions (12%), tax calculations, and NEFT transaction references.",
      priority: "HIGH",
      status: "COMPLETED",
      progress: 100,
      estimatedHours: 8,
    },
    {
      title: "Fix mobile responsiveness on employee dashboard",
      description: "Ensure KPI cards, time-slide filter buttons, and table views display cleanly on mobile and tablet devices.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      progress: 40,
      estimatedHours: 4,
    },
    {
      title: "Prepare weekly client project milestone summary",
      description: "Draft progress report for active engineering deliverables and review sprint velocity with stakeholders.",
      priority: "MEDIUM",
      status: "ASSIGNED",
      progress: 0,
      estimatedHours: 5,
    },
    {
      title: "Update employee attendance and leave policy guide",
      description: "Document company guidelines for remote check-in, shift durations, overtime approvals, and public holidays.",
      priority: "LOW",
      status: "ASSIGNED",
      progress: 0,
      estimatedHours: 3,
    },
    {
      title: "Implement customer feedback and rating review form",
      description: "Build interactive star rating modal for client project reviews and link directly to employee 360 dossiers.",
      priority: "HIGH",
      status: "IN_REVIEW",
      progress: 90,
      estimatedHours: 7,
    },
    {
      title: "Audit database connection pooling and query performance",
      description: "Monitor TiDB SSL keep-alive connections, verify sub-100ms response times, and prevent query bottlenecks.",
      priority: "CRITICAL",
      status: "COMPLETED",
      progress: 100,
      estimatedHours: 8,
    },
    {
      title: "Design new clean light-mode cards and navigation icons",
      description: "Deliver minimalist, high-contrast card components with soft borders and readable typography.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      progress: 75,
      estimatedHours: 5,
    },
  ];

  let inserted = 0;
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const taskTemplate = cleanTasks[i % cleanTasks.length];
    const taskId = `TSK-${user.employeeId || user.id.slice(0, 4)}-${i + 1}`;
    const dueDate = new Date(Date.now() + ((i % 5) + 2) * 24 * 3600 * 1000).toISOString().split("T")[0];

    await connection.query(
      `INSERT INTO task (
        id, title, description, assignedToUserId, status, priority, progress, dueDate, estimatedHours, actualHours, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        status = VALUES(status),
        priority = VALUES(priority),
        progress = VALUES(progress),
        dueDate = VALUES(dueDate),
        updatedAt = NOW()`,
      [
        taskId,
        taskTemplate.title,
        taskTemplate.description,
        user.id,
        taskTemplate.status,
        taskTemplate.priority,
        taskTemplate.progress,
        dueDate,
        taskTemplate.estimatedHours,
        Math.round((taskTemplate.progress / 100) * taskTemplate.estimatedHours * 10) / 10,
      ]
    );
    inserted++;
  }

  await connection.end();
  console.log(`\n✅ Seeded ${inserted} clean, simple, human-readable tasks across all employees!`);
}

seedCleanSimpleTasks().catch(console.error);
