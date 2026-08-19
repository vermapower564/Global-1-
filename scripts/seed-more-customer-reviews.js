const mariadb = require("mariadb");

async function seedMoreReviews() {
  const pool = mariadb.createPool({ host: "127.0.0.1", port: 3306, user: "root", password: "", database: "oms" });
  try {
    const conn = await pool.getConnection();

    const additionalReviews = [
      {
        id: "REV-005",
        employeeId: "EMP-6841",
        employeeName: "rajesh khanna",
        customerName: "Robert Hayes",
        customerEmail: "rhayes@quantumcloud.co",
        customerCompany: "Quantum Cloud Inc",
        customerRole: "VP of Engineering",
        rating: 5,
        communicationRating: 5,
        codeQualityRating: 5,
        timelinessRating: 5,
        reviewTitle: "Top-Tier Backend Optimization & Fast Bug Fixes",
        feedbackText: "Rajesh worked on our high-throughput payment transaction pipelines. Latency decreased by 40% within two weeks. Exceptional dedication and technical depth.",
        highlights: "40% Performance Boost • Clean Architecture • Reliable",
        serviceCategory: "Backend & Microservices",
        status: "PUBLISHED",
        verifiedByClient: 1,
        clientAvatar: "RH",
        responseComment: "Thank you Robert! It was a great challenge optimizing the database indexing and connection pool.",
      },
      {
        id: "REV-006",
        employeeId: "EMP-7278",
        employeeName: "Rajesh Verma",
        customerName: "Thomas Wright",
        customerEmail: "twright@nexusenterprises.com",
        customerCompany: "Nexus Global Enterprises",
        customerRole: "Managing Director",
        rating: 5,
        communicationRating: 5,
        codeQualityRating: 5,
        timelinessRating: 5,
        reviewTitle: "Outstanding Strategic Leadership & Governance",
        feedbackText: "Rajesh ensured our enterprise software deployment aligned perfectly with international ISO compliance standards. Transparent milestone tracking and proactive risk management.",
        highlights: "Strategic Leadership • ISO Compliance • Executive Clarity",
        serviceCategory: "Executive Governance",
        status: "FEATURED",
        verifiedByClient: 1,
        clientAvatar: "TW",
        responseComment: "Thank you Thomas! Glad we reached our milestone ahead of the Q3 audit schedule.",
      },
      {
        id: "REV-007",
        employeeId: "EMP-7592",
        employeeName: "Amit Patel",
        customerName: "Jennifer Walsh",
        customerEmail: "jwalsh@vertexcapital.org",
        customerCompany: "Vertex Capital Group",
        customerRole: "Chief Financial Officer",
        rating: 5,
        communicationRating: 5,
        codeQualityRating: 5,
        timelinessRating: 5,
        reviewTitle: "Flawless Financial Reconciliation & Automated Invoicing",
        feedbackText: "Amit implemented automated GST calculation, payroll validation, and multi-currency invoicing with 100% accuracy. Zero discrepancy during quarter-end.",
        highlights: "100% Accuracy • Automated Tax Rules • On-Time",
        serviceCategory: "Finance & Accounting",
        status: "PUBLISHED",
        verifiedByClient: 1,
        clientAvatar: "JW",
        responseComment: "Thanks Jennifer! The audit-ready ledger system was an exciting module to build.",
      },
      {
        id: "REV-008",
        employeeId: "EMP-6913",
        employeeName: "Vikram Malhotra",
        customerName: "Alexander Moore",
        customerEmail: "amoore@stratosgrowth.com",
        customerCompany: "Stratos Growth Partners",
        customerRole: "Head of Business Development",
        rating: 5,
        communicationRating: 5,
        codeQualityRating: 5,
        timelinessRating: 4,
        reviewTitle: "Highly Consultative & Client-Focused Sales Approach",
        feedbackText: "Vikram understood our enterprise CRM requirements and customized a tiered contract that maximized ROI. Great responsiveness throughout contract negotiations.",
        highlights: "Consultative Sales • High ROI • Responsive",
        serviceCategory: "Sales & Client Success",
        status: "PUBLISHED",
        verifiedByClient: 1,
        clientAvatar: "AM",
        responseComment: "Thank you Alexander! Looking forward to supporting Stratos Growth expansion.",
      },
      {
        id: "REV-009",
        employeeId: "EMP-2139",
        employeeName: "Sneha Reddy",
        customerName: "Chloe Dupont",
        customerEmail: "cdupont@luminafashion.fr",
        customerCompany: "Lumina Global Brands",
        customerRole: "Chief Marketing Officer",
        rating: 5,
        communicationRating: 5,
        codeQualityRating: 5,
        timelinessRating: 5,
        reviewTitle: "Incredible Growth in Organic Traffic & ROAS",
        feedbackText: "Sneha overhauled our digital ad campaigns and SEO content strategy. Within 60 days, our ROAS jumped from 2.1x to 4.8x with record conversion rates.",
        highlights: "4.8x ROAS • Organic Traffic +140% • Data-Driven",
        serviceCategory: "Digital Marketing & SEO",
        status: "FEATURED",
        verifiedByClient: 1,
        clientAvatar: "CD",
        responseComment: "Thank you Chloe! Delighted to see Lumina's international campaigns performing so strongly.",
      },
      {
        id: "REV-010",
        employeeId: "EMP-2887",
        employeeName: "Rahul Sharma",
        customerName: "Markus Lindner",
        customerEmail: "mlindner@cinemedia.de",
        customerCompany: "CineMedia Studio Europe",
        customerRole: "Creative Director",
        rating: 5,
        communicationRating: 5,
        codeQualityRating: 5,
        timelinessRating: 5,
        reviewTitle: "Top Quality Color Grading & Fast Video Turnaround",
        feedbackText: "Rahul edited our brand promo video package with stunning visual rhythm and sound design. 4K deliverables were ready 2 days early!",
        highlights: "4K Cinema Quality • Ahead of Deadline • Creative Genius",
        serviceCategory: "Video Production",
        status: "PUBLISHED",
        verifiedByClient: 1,
        clientAvatar: "ML",
        responseComment: "Thank you Markus! Excited to collaborate on the upcoming cinematic launch series.",
      },
    ];

    for (const r of additionalReviews) {
      await conn.query(
        `INSERT IGNORE INTO customerreview (
          id, employeeId, employeeName, customerName, customerEmail, customerCompany,
          customerRole, rating, communicationRating, codeQualityRating, timelinessRating,
          reviewTitle, feedbackText, highlights, serviceCategory, status,
          verifiedByClient, clientAvatar, responseComment, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          r.id,
          r.employeeId,
          r.employeeName,
          r.customerName,
          r.customerEmail,
          r.customerCompany,
          r.customerRole,
          r.rating,
          r.communicationRating,
          r.codeQualityRating,
          r.timelinessRating,
          r.reviewTitle,
          r.feedbackText,
          r.highlights,
          r.serviceCategory,
          r.status,
          r.verifiedByClient,
          r.clientAvatar,
          r.responseComment,
        ]
      );
      console.log(`✓ Added review for ${r.employeeName} (${r.employeeId}) from ${r.customerName}`);
    }

    conn.release();
    await pool.end();
    console.log("🎉 Additional customer reviews seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedMoreReviews();
