import { prisma } from "../lib/prisma";

async function testConnection() {
  console.log("🔍 Testing Prisma → MySQL Direct Connection...");

  try {
    await prisma.$connect();
    console.log("✅ DATABASE CONNECTION SUCCESS: Connected to MySQL!");

    const userCount = await prisma.user.count();
    console.log(`📊 TOTAL USERS IN DATABASE: ${userCount}`);

    const firstUser = await prisma.user.findFirst({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (firstUser) {
      console.log("✅ USER TABLE ACCESS SUCCESS!");
      console.log(`👤 Found Account: ID=${firstUser.id}, EMP=${firstUser.employeeId || "N/A"}, Email=${firstUser.email}, Role=${firstUser.role}`);
    } else {
      console.log("⚠️ USER TABLE IS EMPTY!");
    }

    await prisma.$disconnect();
    console.log("🎉 Connection test complete!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ DATABASE CONNECTION ERROR:", error);
    process.exit(1);
  }
}

testConnection();
