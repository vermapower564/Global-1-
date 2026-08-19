const mysql = require("mysql2/promise");
require("dotenv").config();

async function seedRealisticBlockers() {
  console.log("==================================================");
  console.log("🚧 Seeding Realistic Enterprise Blockers in TiDB Cloud");
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

  const [users] = await connection.query(`SELECT id, employeeId, name FROM user LIMIT 10`);

  const blockers = [
    {
      id: "TSK-BLK-AWS-01",
      title: "AWS S3 Production Storage & CloudFront CDN Integration",
      description: "Setup automated media uploads to AWS S3 multi-region bucket with CloudFront edge caching.",
      priority: "CRITICAL",
      progress: 45,
      blockerReason: "Awaiting AWS IAM production credentials and S3 bucket write permissions from the Cloud DevOps lead. Upload pipeline tests are currently blocked.",
      user: users[0] || { id: "USR-001" },
    },
    {
      id: "TSK-BLK-PAY-02",
      title: "Payment Gateway Merchant KYC & Webhook Signing Verification",
      description: "Integrate automated salary disbursement and client billing webhooks with HMAC-SHA256 signature verification.",
      priority: "HIGH",
      progress: 60,
      blockerReason: "Corporate banking merchant KYC compliance documentation is under review with Razorpay/HDFC. Live sandbox test webhooks are on hold.",
      user: users[1] || { id: "USR-002" },
    },
    {
      id: "TSK-BLK-FGM-03",
      title: "Mobile Responsive Glassmorphic Dashboard Design System",
      description: "Build adaptive mobile navigation layout and responsive component cards for employee mobile view.",
      priority: "HIGH",
      progress: 30,
      blockerReason: "UI/UX Figma team has not finalized mobile responsive typography tokens (360px & 768px viewports). Awaiting design signoff from Lead Designer.",
      user: users[2] || { id: "USR-003" },
    },
    {
      id: "TSK-BLK-SMS-04",
      title: "Two-Factor Authentication SMS OTP Gateway Testing",
      description: "Implement biometric and SMS OTP dual-factor verification for remote shift punches.",
      priority: "MEDIUM",
      progress: 70,
      blockerReason: "SMS gateway provider (Twilio/Fast2SMS) hitting test rate limits (HTTP 429). Requires vendor DLT approval and quota upgrade.",
      user: users[3] || { id: "USR-004" },
    },
  ];

  for (const b of blockers) {
    await connection.query(
      `INSERT INTO task (
        id, title, description, assignedToUserId, status, priority, progress, blockerReason, dueDate, estimatedHours, actualHours, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, 'BLOCKED', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY), 8, 4, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        status = 'BLOCKED',
        priority = VALUES(priority),
        progress = VALUES(progress),
        blockerReason = VALUES(blockerReason),
        updatedAt = NOW()`,
      [b.id, b.title, b.description, b.user.id, b.priority, b.progress, b.blockerReason]
    );
  }

  await connection.end();
  console.log(`\n✅ Successfully seeded ${blockers.length} realistic enterprise blockers in TiDB Cloud!`);
}

seedRealisticBlockers().catch(console.error);
