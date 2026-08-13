import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "mysql://root:@localhost:3306/oms";
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Setting verified Bcrypt password hash for Roushan Verma (EMP-8595)...");

  const newPassword = "admin123";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  let roushanUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "roushan.verma@oms.com" },
        { employeeId: "EMP-8595" },
      ],
    },
  });

  if (!roushanUser) {
    roushanUser = await prisma.user.create({
      data: {
        employeeId: "EMP-8595",
        name: "Roushan Verma",
        email: "roushan.verma@oms.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        phone: "+91 98765 00001",
        joiningDate: new Date(),
        isActive: true,
        isProfileCompleted: true,
        documentsVerified: true,
      },
    });
    console.log(`✅ Created Roushan Verma Account: ID=${roushanUser.id}, EMP=${roushanUser.employeeId}, Email=${roushanUser.email}`);
  } else {
    await prisma.user.update({
      where: { id: roushanUser.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log(`✅ Updated Roushan Verma Account Password: ID=${roushanUser.id}, EMP=${roushanUser.employeeId}, Email=${roushanUser.email}`);
  }

  // Verify bcrypt.compare works
  const isMatch = await bcrypt.compare(newPassword, hashedPassword);
  console.log(`🧪 Bcrypt Verification Test for password "${newPassword}": ${isMatch ? "SUCCESS (MATCHES!)" : "FAILED"}`);

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Error setting password:", e);
  process.exit(1);
});
