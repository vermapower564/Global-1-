import { queryDb } from "../lib/db";

async function setup() {
  await queryDb(`
    CREATE TABLE IF NOT EXISTS featurerequest (
      id VARCHAR(191) PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      userName VARCHAR(191) NOT NULL,
      userEmail VARCHAR(191) NOT NULL,
      userRole VARCHAR(191) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      useCase TEXT NOT NULL,
      priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
      status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
      adminRemarks TEXT,
      reviewedById VARCHAR(191),
      reviewedByName VARCHAR(191),
      reviewedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ featurerequest table created / verified successfully in TiDB Cloud!");
  process.exit(0);
}

setup().catch((e) => {
  console.error("Setup error:", e);
  process.exit(1);
});
