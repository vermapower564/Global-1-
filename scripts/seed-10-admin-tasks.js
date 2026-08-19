const mysql = require("mysql2/promise");

async function seedAdminTasks() {
  console.log("==================================================");
  console.log("🌱 Seeding Realistic Enterprise Tasks Assigned by Admin");
  console.log("==================================================");

  const conn = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "4BrXAABTf5SQeKq.root",
    password: "oF5rWQth8eQANTqp",
    database: "oms",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  const adminId = "cmsn0m9yy0004v0tq0jhv31al"; // Roushan Verma (Super Admin)

  const tasks = [
    {
      id: "TSK-001-TIDB-POOL",
      title: "Architect & Implement TiDB Connection Pooling with Persistent Keep-Alive",
      description: "Optimize all database queries to use high-concurrency connection pooling, eliminate SSL renegotiation overhead, and implement auto-invalidating query caching for sub-50ms API responses.",
      projectId: "cmswz5wz10000i0tqoc25aink",
      assignedToUserId: "USR-003", // Aditya Raj (Lead Developer)
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      progress: 85,
      estimatedHours: 18,
      actualHours: 15,
      daysDue: 2,
    },
    {
      id: "TSK-002-UIUX-DESIGN",
      title: "Design Futuristic Glassmorphic Dark-Mode Design System & Component Library",
      description: "Deliver complete Figma tokens, high-fidelity prototypes, and Tailwind theme variables for the executive dashboard and employee workspace.",
      projectId: "cmswz5x0w0004i0tqaa1a0m2p",
      assignedToUserId: "cmsyki9yy0002jctqm5neee0d", // Neha Gupta (UI/UX Designer)
      status: "IN_REVIEW",
      priority: "HIGH",
      progress: 90,
      estimatedHours: 24,
      actualHours: 22,
      daysDue: 3,
    },
    {
      id: "TSK-003-AWS-DOCKER",
      title: "Containerize Microservices with Docker & Deploy to AWS ECS Cluster",
      description: "Write multi-stage Dockerfiles, configure AWS ECR image vulnerability scanning, and set up automated CloudWatch alarm triggers for container health.",
      projectId: "cmswz5wzh0001i0tqxsu55weu",
      assignedToUserId: "cmsmz0w4k0000v0tqnws34osn", // rajesh khanna (Developer)
      status: "IN_PROGRESS",
      priority: "HIGH",
      progress: 60,
      estimatedHours: 32,
      actualHours: 19,
      daysDue: 5,
    },
    {
      id: "TSK-004-VIDEO-PROD",
      title: "Produce & Color Grade 4K Product Launch Teaser & Customer Showcase Video",
      description: "Edit raw RED footage, compose 3D motion graphic lower thirds, apply cinematic LUTs, and master spatial audio in DaVinci Resolve.",
      projectId: "cmswz5x030002i0tqgz5h4eed",
      assignedToUserId: "cmsn0mbjd000ev0tqtjolb8bd", // Rahul Sharma (Video Editor)
      status: "IN_PROGRESS",
      priority: "HIGH",
      progress: 70,
      estimatedHours: 20,
      actualHours: 14,
      daysDue: 4,
    },
    {
      id: "TSK-005-HR-APPRAISAL",
      title: "Automate Q3 Performance Appraisal & 360-Degree Peer Feedback System",
      description: "Configure review cycles, automated reminder triggers for team leads, and synchronize bonus calculation matrices with Finance.",
      projectId: "cmswz5wz10000i0tqoc25aink",
      assignedToUserId: "cmsn0maah0006v0tqp5rc6nmm", // Priya Sharma (HR)
      status: "COMPLETED",
      priority: "MEDIUM",
      progress: 100,
      estimatedHours: 16,
      actualHours: 16,
      daysDue: -2,
    },
    {
      id: "TSK-006-FIN-PAYROLL",
      title: "Integrate Automated Tax Deduction (TDS) & Multi-Currency Payroll Generator",
      description: "Validate statutory tax formulas, bank IFSC verification, and automated generation of password-protected PDF salary slips.",
      projectId: "cmswz5x0f0003i0tq8hjijkat",
      assignedToUserId: "cmsn0mage0007v0tqkx716ge3", // Amit Patel (Finance)
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      progress: 75,
      estimatedHours: 28,
      actualHours: 21,
      daysDue: 1,
    },
    {
      id: "TSK-007-SEO-AUDIT",
      title: "Execute Technical SEO Audit & Core Web Vitals Optimization (LCP < 1.2s)",
      description: "Analyze schema markup, fix broken canonicals, compress hero assets to AVIF, and rank for target high-intent B2B keywords.",
      projectId: "cmswz5x030002i0tqgz5h4eed",
      assignedToUserId: "cmsn0mavm000bv0tqlnabe624", // Deepak Kumar (SEO Executive)
      status: "ASSIGNED",
      priority: "MEDIUM",
      progress: 15,
      estimatedHours: 12,
      actualHours: 2,
      daysDue: 6,
    },
    {
      id: "TSK-008-CONTENT-DOCS",
      title: "Draft Whitepaper on Autonomous Multi-Agent AI Workflow Automation",
      description: "Research industry benchmarks, interview engineering stakeholders, and write a 12-page technical whitepaper for enterprise clients.",
      projectId: "cmswz5x030002i0tqgz5h4eed",
      assignedToUserId: "cmsn0mb87000cv0tqy9phtd8s", // Aanya Sen (Content Writer)
      status: "IN_REVIEW",
      priority: "HIGH",
      progress: 95,
      estimatedHours: 20,
      actualHours: 19,
      daysDue: 1,
    },
    {
      id: "TSK-009-SALES-DEAL",
      title: "Close Enterprise RFP Contract & Security SLA with Vertex Global ($120k ARR)",
      description: "Negotiate cloud sovereignty clauses, finalize multi-year SLA terms, and hand over onboarding checklist to Customer Success.",
      projectId: "cmsyknzxv0002ywtqwvq3l6rz",
      assignedToUserId: "cmsn0mak70008v0tqgty2oy2d", // Vikram Malhotra (Sales Manager)
      status: "COMPLETED",
      priority: "CRITICAL",
      progress: 100,
      estimatedHours: 40,
      actualHours: 38,
      daysDue: -5,
    },
    {
      id: "TSK-010-STUDIO-SHOOT",
      title: "Direct Multi-Cam Studio Shoot for Executive Keynote and Client Testimonials",
      description: "Set up 3-point ARRI lighting, configure wireless Sennheiser lavalier microphones, and record 4K ProRes 422 HQ interviews.",
      projectId: "cmswz5x030002i0tqgz5h4eed",
      assignedToUserId: "cmsn0mbmi000fv0tqz5mska17", // Mohit Sen (Camera Team)
      status: "COMPLETED",
      priority: "MEDIUM",
      progress: 100,
      estimatedHours: 14,
      actualHours: 14,
      daysDue: -3,
    },
    {
      id: "TSK-011-NOTIF-SOCKETS",
      title: "Build Real-Time WebSocket Notification Center and Task Event Dispatcher",
      description: "Implement reactive push notifications when tasks are assigned, blockers are logged, or reviews are submitted.",
      projectId: "cmswz5wz10000i0tqoc25aink",
      assignedToUserId: "cmsykmanx000788tq49l6kana", // Rishabh Pant (Developer)
      status: "IN_PROGRESS",
      priority: "HIGH",
      progress: 45,
      estimatedHours: 18,
      actualHours: 8,
      daysDue: 4,
    },
    {
      id: "TSK-012-E2E-TESTS",
      title: "Write End-to-End Cypress Integration Tests for Employee Authentication Flow",
      description: "Cover edge cases including token expiration, incorrect credentials, role-based redirection, and session cookie persistence.",
      projectId: "cmsyknzx10001ywtqnjkzk0ab",
      assignedToUserId: "usr_1787134988644", // omkar (Developer)
      status: "ASSIGNED",
      priority: "LOW",
      progress: 20,
      estimatedHours: 10,
      actualHours: 2,
      daysDue: 7,
    },
  ];

  for (const t of tasks) {
    const now = new Date();
    const startDate = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
    const dueDate = new Date(now.getTime() + t.daysDue * 24 * 3600 * 1000);
    const completedAt = t.status === "COMPLETED" ? now : null;

    await conn.query(
      `INSERT INTO task (
        id, title, description, projectId, assignedToUserId, createdById,
        status, priority, progress, startDate, dueDate, completedAt,
        estimatedHours, actualHours, blockerReason, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        projectId = VALUES(projectId),
        assignedToUserId = VALUES(assignedToUserId),
        createdById = VALUES(createdById),
        status = VALUES(status),
        priority = VALUES(priority),
        progress = VALUES(progress),
        startDate = VALUES(startDate),
        dueDate = VALUES(dueDate),
        completedAt = VALUES(completedAt),
        estimatedHours = VALUES(estimatedHours),
        actualHours = VALUES(actualHours),
        updatedAt = NOW()`,
      [
        t.id,
        t.title,
        t.description,
        t.projectId,
        t.assignedToUserId,
        adminId,
        t.status,
        t.priority,
        t.progress,
        startDate,
        dueDate,
        completedAt,
        t.estimatedHours,
        t.actualHours,
      ]
    );

    // Insert task history
    const histId = "HIST-" + t.id;
    await conn.query(
      `INSERT INTO taskhistory (id, taskId, userId, action, oldValue, newValue, description, createdAt)
       VALUES (?, ?, ?, 'ASSIGNED', NULL, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE description = VALUES(description), createdAt = NOW()`,
      [
        histId,
        t.id,
        adminId,
        t.status,
        `Task assigned to employee by Super Admin Roushan Verma with priority ${t.priority}`,
      ]
    );

    console.log(`✅ Seeded Task: [${t.priority}] ${t.title} -> Assigned to User ID: ${t.assignedToUserId}`);
  }

  const [countRes] = await conn.query("SELECT COUNT(*) as count FROM task;");
  console.log(`\n🎉 Successfully Seeded! Total Tasks in TiDB Cloud: ${countRes[0].count}`);
  await conn.end();
}

seedAdminTasks().catch(console.error);
