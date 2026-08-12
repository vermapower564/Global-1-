import { prisma } from "../lib/prisma";

async function main() {
  try {
    console.log("🔍 Querying XAMPP MySQL 'user' table...");
    const users = await prisma.user.findMany({
      take: 10,
    });
    console.log(`Found ${users.length} users in database:`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ID: ${u.id} | EmployeeId: ${u.employeeId} | Name: "${u.name}" | Email: ${u.email}`);
    });
  } catch (err: any) {
    console.error("❌ Database Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
