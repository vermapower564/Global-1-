import { prisma } from "../lib/prisma";

async function testLoginPrisma() {
  console.log("Testing prisma.user.findFirst...");
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "roushan.verma@gmail.com" },
          { employeeId: "EMP-8595" },
        ],
      },
      include: { department: true },
    });
    console.log("Found user via Prisma:", user ? user.name : "null");
  } catch (err) {
    console.error("Prisma error:", err);
  }
  process.exit(0);
}

testLoginPrisma();
