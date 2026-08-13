import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/authService";

async function main() {
  console.log("🔍 Inspecting MySQL user table for EMP-8595 / roushan.verma@oms.com...");

  // 1. Find all matching records
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { employeeId: "EMP-8595" },
        { email: "roushan.verma@oms.com" },
        { employeeId: "EMP001" },
        { email: "admin@oms.com" },
      ],
    },
  });

  console.log(`📋 Found ${users.length} matching user records in MySQL database.`);

  for (const u of users) {
    console.log(`- ID: ${u.id} | EMP: ${u.employeeId} | Email: ${u.email} | Role: ${u.role} | Password stored: ${u.password.slice(0, 20)}...`);
  }

  // 2. Target password to set
  const newDevPassword = "Roushan@123";
  const hashedPassword = await hashPassword(newDevPassword);

  console.log(`\n🔒 Hashing new password "${newDevPassword}" using lib/authService.ts hashPassword()...`);
  console.log(`🔑 Generated Bcrypt Hash: ${hashedPassword}`);

  // 3. Update EMP-8595 / roushan.verma@oms.com record
  let emp8595 = await prisma.user.findFirst({
    where: {
      OR: [{ employeeId: "EMP-8595" }, { email: "roushan.verma@oms.com" }],
    },
  });

  if (!emp8595) {
    console.log("⚠️ EMP-8595 user record not found. Creating new user record...");
    emp8595 = await prisma.user.create({
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
  } else {
    emp8595 = await prisma.user.update({
      where: { id: emp8595.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
  }

  console.log(`\n✅ Database Update Complete for ${emp8595.name} (${emp8595.employeeId})!`);

  // 4. Test comparePassword() from lib/authService.ts
  const testMatch = await comparePassword(newDevPassword, emp8595.password);
  console.log(`🧪 Testing comparePassword("${newDevPassword}", storedHash)...`);
  console.log(`Result: ${testMatch ? "✅ SUCCESS (MATCHED!)" : "❌ FAILED"}`);

  // Also update any other users in MySQL with placeholder password
  const allUsersWithPlaceholder = await prisma.user.findMany({
    where: {
      password: { contains: "hashed_secure_password" },
    },
  });

  if (allUsersWithPlaceholder.length > 0) {
    console.log(`\n🔄 Updating ${allUsersWithPlaceholder.length} accounts containing placeholder password 'hashed_secure_password_123'...`);
    for (const placeholderUser of allUsersWithPlaceholder) {
      const userHash = await hashPassword("Roushan@123");
      await prisma.user.update({
        where: { id: placeholderUser.id },
        data: { password: userHash, isActive: true },
      });
      console.log(`   Updated ${placeholderUser.name} (${placeholderUser.employeeId}) with Bcrypt Hash.`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Script Error:", err);
  process.exit(1);
});
