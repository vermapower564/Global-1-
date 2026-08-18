import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function checkAditya() {
  const user = await prisma.user.findFirst({ where: { employeeId: "EMP014" } });
  console.log("Aditya in DB:", user?.name, user?.email, user?.role);
  if (user) {
    console.log("Check 'Password@123':", await bcrypt.compare("Password@123", user.password));
    console.log("Check 'password123':", await bcrypt.compare("password123", user.password));
  }
  await prisma.$disconnect();
}

checkAditya();
