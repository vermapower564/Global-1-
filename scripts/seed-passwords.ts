import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting Database User Password Seeding & Bcrypt Hash Upgrade...");

  const defaultPassword = "password123";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  // 1. Ensure Super Admin Account Exists
  const adminEmail = "admin@oms.com";
  const adminEmpId = "EMP001";

  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { employeeId: adminEmpId }],
    },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        employeeId: adminEmpId,
        name: "Roushan Verma",
        email: adminEmail,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        phone: "+91 98765 00001",
        joiningDate: new Date(),
        isActive: true,
        isProfileCompleted: true,
        documentsVerified: true,
      },
    });
    console.log(`✅ Created Super Admin Account: ${adminUser.name} (${adminUser.email}) with Bcrypt Hash.`);
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log(`✅ Updated Super Admin Account Password: ${adminUser.name} (${adminUser.email}) with Bcrypt Hash.`);
  }

  // 2. Ensure Roushan Verma Employee Account (EMP-8595) Has Bcrypt Hash
  let roushanUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: "roushan.verma@oms.com" }, { employeeId: "EMP-8595" }],
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
        phone: "+91 98765 00002",
        joiningDate: new Date(),
        isActive: true,
        isProfileCompleted: true,
        documentsVerified: true,
      },
    });
    console.log(`✅ Created Employee Account: ${roushanUser.name} (${roushanUser.employeeId}) with Bcrypt Hash.`);
  } else {
    await prisma.user.update({
      where: { id: roushanUser.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log(`✅ Updated Employee Account Password: ${roushanUser.name} (${roushanUser.employeeId}) with Bcrypt Hash.`);
  }

  // 3. Ensure Aditya Raj Employee Account (EMP014) Has Bcrypt Hash
  let adityaUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: "aditya.raj@oms.com" }, { employeeId: "EMP014" }],
    },
  });

  if (!adityaUser) {
    adityaUser = await prisma.user.create({
      data: {
        employeeId: "EMP014",
        name: "Aditya Raj",
        email: "aditya.raj@oms.com",
        password: hashedPassword,
        role: "DEVELOPER",
        phone: "+91 98765 00014",
        joiningDate: new Date(),
        isActive: true,
        isProfileCompleted: true,
        documentsVerified: true,
      },
    });
    console.log(`✅ Created Employee Account: ${adityaUser.name} (${adityaUser.employeeId}) with Bcrypt Hash.`);
  } else {
    await prisma.user.update({
      where: { id: adityaUser.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log(`✅ Updated Employee Account Password: ${adityaUser.name} (${adityaUser.employeeId}) with Bcrypt Hash.`);
  }

  // 4. Upgrade any remaining users with non-bcrypt passwords to valid Bcrypt Hashes
  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    if (!u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hashedPassword },
      });
      console.log(`🔄 Upgraded password for user: ${u.name} (${u.email}) to Bcrypt hash.`);
    }
  }

  console.log("🎉 All MySQL user accounts successfully updated with Bcrypt password hashes!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
