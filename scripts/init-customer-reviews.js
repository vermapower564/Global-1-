const mariadb = require("mariadb");

async function initCustomerReviewsTable() {
  console.log("🛠️ Initializing Customer Reviews & Feedback Table in MariaDB/MySQL...");

  const pool = mariadb.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "oms",
  });

  try {
    const conn = await pool.getConnection();

    // 1. Create customerreview table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customerreview (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        employeeId VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NULL,
        employeeName VARCHAR(191) NOT NULL,
        projectId VARCHAR(191) NULL,
        projectName VARCHAR(191) NULL,
        customerName VARCHAR(191) NOT NULL,
        customerEmail VARCHAR(191) NOT NULL,
        customerCompany VARCHAR(191) NULL,
        customerRole VARCHAR(191) NULL,
        rating INT NOT NULL DEFAULT 5,
        communicationRating INT NOT NULL DEFAULT 5,
        codeQualityRating INT NOT NULL DEFAULT 5,
        timelinessRating INT NOT NULL DEFAULT 5,
        reviewTitle VARCHAR(255) NOT NULL,
        feedbackText TEXT NOT NULL,
        highlights VARCHAR(255) NULL,
        serviceCategory VARCHAR(191) NOT NULL DEFAULT 'Engineering',
        status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
        shareableToken VARCHAR(191) NULL,
        verifiedByClient TINYINT(1) NOT NULL DEFAULT 1,
        clientAvatar VARCHAR(255) NULL,
        responseComment TEXT NULL,
        respondedAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customerreview_employeeId (employeeId),
        INDEX idx_customerreview_userId (userId),
        INDEX idx_customerreview_rating (rating),
        INDEX idx_customerreview_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ `customerreview` table verified/created successfully!");

    // 2. Check if records exist
    const countRes = await conn.query("SELECT COUNT(*) as total FROM customerreview");
    const count = Number(countRes[0].total);

    if (count === 0) {
      console.log("🌱 Seeding initial pro-advance customer reviews and feedback data...");

      // Find actual users to tie to
      const users = await conn.query("SELECT id, employeeId, name, email FROM user LIMIT 10");
      const userMap = {};
      users.forEach(u => {
        userMap[u.employeeId] = u;
      });

      const initialReviews = [
        {
          id: "REV-001",
          employeeId: "EMP-8595",
          userId: userMap["EMP-8595"] ? userMap["EMP-8595"].id : null,
          employeeName: "Roushan Verma",
          projectId: "PRJ-001",
          projectName: "Enterprise OMS Cloud Migration",
          customerName: "David Sterling",
          customerEmail: "david.sterling@apexcloud.io",
          customerCompany: "Apex Cloud Solutions",
          customerRole: "Chief Technology Officer",
          rating: 5,
          communicationRating: 5,
          codeQualityRating: 5,
          timelinessRating: 5,
          reviewTitle: "Exceptional Leadership & Seamless Delivery",
          feedbackText: "Roushan led the database optimization and real-time synchronization project with unparalleled precision. Response time was instantaneous, and the security architecture exceeded our compliance standards. Highly recommended for critical systems!",
          highlights: "Exceptional Problem Solving • 100% On-Time Delivery • Proactive Communication",
          serviceCategory: "Cloud & Database Architecture",
          status: "FEATURED",
          shareableToken: "apex-cloud-migration-8595",
          verifiedByClient: 1,
          clientAvatar: "DS",
          responseComment: "Thank you David! It was an absolute pleasure architecting the high-availability pipeline for Apex Cloud.",
          respondedAt: new Date(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: "REV-002",
          employeeId: "EMP001",
          userId: userMap["EMP001"] ? userMap["EMP001"].id : null,
          employeeName: "Roushan Verma",
          projectId: "PRJ-002",
          projectName: "NextGen ERP Portal",
          customerName: "Sarah Jenkins",
          customerEmail: "sarah.j@globalfintech.com",
          customerCompany: "Global FinTech Ventures",
          customerRole: "VP of Product",
          rating: 5,
          communicationRating: 5,
          codeQualityRating: 5,
          timelinessRating: 5,
          reviewTitle: "Flawless Execution and Scalable Codebase",
          feedbackText: "Our financial reporting dashboard was delivered 4 days ahead of schedule. The UX is sleek, extremely fast, and our operations team is thrilled. Five stars all the way!",
          highlights: "Ahead of Schedule • High Code Quality • Intuitive UI",
          serviceCategory: "Full-Stack Development",
          status: "FEATURED",
          shareableToken: "global-fintech-rev-001",
          verifiedByClient: 1,
          clientAvatar: "SJ",
          responseComment: "Thanks Sarah! Looking forward to Phase 2 automated payroll integrations.",
          respondedAt: new Date(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: "REV-003",
          employeeId: "EMP014",
          userId: userMap["EMP014"] ? userMap["EMP014"].id : null,
          employeeName: "Aditya Raj",
          projectId: "PRJ-003",
          projectName: "Customer Support Automation API",
          customerName: "Michael Chang",
          customerEmail: "mchang@zenithretail.com",
          customerCompany: "Zenith Retail Corp",
          customerRole: "Director of Engineering",
          rating: 5,
          communicationRating: 5,
          codeQualityRating: 5,
          timelinessRating: 4,
          reviewTitle: "Very Dedicated and Thorough Developer",
          feedbackText: "Aditya implemented our customer ticketing webhooks with great attention to edge cases and unit tests. Clear documentation and easy integration into our stack.",
          highlights: "Thorough Unit Tests • Clean API Docs • Great Team Player",
          serviceCategory: "Backend & API Engineering",
          status: "PUBLISHED",
          shareableToken: "zenith-retail-014",
          verifiedByClient: 1,
          clientAvatar: "MC",
          responseComment: "Thank you Michael! Glad the webhook service is performing reliably under heavy peak load.",
          respondedAt: new Date(),
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
        {
          id: "REV-004",
          employeeId: "EMP-8219",
          userId: userMap["EMP-8219"] ? userMap["EMP-8219"].id : null,
          employeeName: "Priya Sharma",
          projectId: "PRJ-004",
          projectName: "Onboarding & HR Talent Pipeline",
          customerName: "Elena Rostova",
          customerEmail: "elena@vanguardtalent.eu",
          customerCompany: "Vanguard International",
          customerRole: "Chief People Officer",
          rating: 5,
          communicationRating: 5,
          codeQualityRating: 5,
          timelinessRating: 5,
          reviewTitle: "Outstanding Candidate Experience & Fast Turnaround",
          feedbackText: "Priya streamlined our entire talent requisition workflow. We onboarded 15 high-caliber engineers within a month without any friction.",
          highlights: "Exceptional HR Management • Transparent Reporting",
          serviceCategory: "Operations & HR Consulting",
          status: "PUBLISHED",
          shareableToken: "vanguard-talent-8219",
          verifiedByClient: 1,
          clientAvatar: "ER",
          responseComment: "Thank you Elena! Excited to continue partnering with Vanguard International.",
          respondedAt: new Date(),
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      ];

      for (const rev of initialReviews) {
        await conn.query(
          `INSERT INTO customerreview (
            id, employeeId, userId, employeeName, projectId, projectName, customerName,
            customerEmail, customerCompany, customerRole, rating, communicationRating,
            codeQualityRating, timelinessRating, reviewTitle, feedbackText, highlights,
            serviceCategory, status, shareableToken, verifiedByClient, clientAvatar,
            responseComment, respondedAt, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rev.id,
            rev.employeeId,
            rev.userId,
            rev.employeeName,
            rev.projectId,
            rev.projectName,
            rev.customerName,
            rev.customerEmail,
            rev.customerCompany,
            rev.customerRole,
            rev.rating,
            rev.communicationRating,
            rev.codeQualityRating,
            rev.timelinessRating,
            rev.reviewTitle,
            rev.feedbackText,
            rev.highlights,
            rev.serviceCategory,
            rev.status,
            rev.shareableToken,
            rev.verifiedByClient,
            rev.clientAvatar,
            rev.responseComment,
            rev.respondedAt,
            rev.createdAt,
          ]
        );
        console.log(` ✨ Seeded review for ${rev.employeeName} from ${rev.customerName} (${rev.customerCompany})`);
      }
    } else {
      console.log(`ℹ️ Customerreview table already contains ${count} records.`);
    }

    conn.release();
    await pool.end();
    console.log("🎉 Customer Reviews & Feedback initialization complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Customer Reviews DB Init Error:", err);
    process.exit(1);
  }
}

initCustomerReviewsTable();
