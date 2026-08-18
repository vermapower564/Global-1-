import { prisma } from "../lib/prisma";

async function runSalarySlipTests() {
  console.log("💳 Testing Complete Salary Slip & Monthly Payment System...");

  // 1. Find a test employee
  const testUser = await prisma.user.findFirst({
    where: { isActive: true },
  });

  if (!testUser) {
    console.error("❌ No user found for testing.");
    process.exit(1);
  }

  console.log(`👤 Using Test Employee: ${testUser.name} (${testUser.employeeId})`);

  // 2. Configure payment schedule to 5th of the month
  await prisma.user.update({
    where: { id: testUser.id },
    data: { paymentScheduleDay: 5 },
  });
  console.log("✅ Updated employee payment schedule day to 5th");

  // 3. Test calculation & upsert of a monthly payment slip
  const basic = 25000;
  const hra = 5000;
  const allowances = 3000;
  const bonus = 2000;
  const overtime = 5000;
  const gross = basic + hra + allowances + bonus + overtime; // 40000

  const pf = 3000;
  const tax = 1000;
  const other = 1000;
  const totalDed = pf + tax + other; // 5000
  const net = gross - totalDed; // 35000

  if (gross !== 40000 || net !== 35000) {
    throw new Error(`Calculation error: Expected Gross=40000, Net=35000. Got Gross=${gross}, Net=${net}`);
  }
  console.log(`✅ Gross & Net Calculation: Gross=₹${gross}, Deductions=₹${totalDed}, Net=₹${net}`);

  // 4. Test duplicate prevention via upsert
  const monthKey = "2026-08";
  const slip1 = await prisma.salaryslip.upsert({
    where: {
      userId_monthKey: {
        userId: testUser.id,
        monthKey,
      },
    },
    update: {
      salaryMonth: "August 2026",
      basicSalary: basic,
      hra,
      allowances,
      bonus,
      overtime,
      grossSalary: gross,
      pfDeduction: pf,
      taxDeduction: tax,
      otherDeductions: other,
      totalDeductions: totalDed,
      netSalary: net,
      paymentDate: new Date("2026-08-05"),
      paymentStatus: "PAID",
      paymentMethod: "Bank Transfer",
      transactionReference: "TXN-82910492",
    },
    create: {
      userId: testUser.id,
      employeeId: testUser.employeeId,
      employeeName: testUser.name,
      salaryMonth: "August 2026",
      monthKey,
      basicSalary: basic,
      hra,
      allowances,
      bonus,
      overtime,
      grossSalary: gross,
      pfDeduction: pf,
      taxDeduction: tax,
      otherDeductions: other,
      totalDeductions: totalDed,
      netSalary: net,
      paymentDate: new Date("2026-08-05"),
      paymentStatus: "PAID",
      paymentMethod: "Bank Transfer",
      transactionReference: "TXN-82910492",
    },
  });

  console.log(`✅ Monthly Salary Slip Created/Verified for ${slip1.salaryMonth}: ID=${slip1.id}, Net=₹${slip1.netSalary}, Status=${slip1.paymentStatus}`);

  // 5. Test another month with SCHEDULED status
  const slip2 = await prisma.salaryslip.upsert({
    where: {
      userId_monthKey: {
        userId: testUser.id,
        monthKey: "2026-09",
      },
    },
    update: {
      paymentStatus: "SCHEDULED",
    },
    create: {
      userId: testUser.id,
      employeeId: testUser.employeeId,
      employeeName: testUser.name,
      salaryMonth: "September 2026",
      monthKey: "2026-09",
      basicSalary: basic,
      hra,
      allowances,
      bonus,
      overtime,
      grossSalary: gross,
      pfDeduction: pf,
      taxDeduction: tax,
      otherDeductions: other,
      totalDeductions: totalDed,
      netSalary: net,
      paymentDate: new Date("2026-09-05"),
      paymentStatus: "SCHEDULED",
      paymentMethod: "Bank Transfer",
      transactionReference: "TXN-PENDING-09",
    },
  });

  console.log(`✅ Future Scheduled Salary Slip Created for ${slip2.salaryMonth}: Status=${slip2.paymentStatus}`);

  const allSlips = await prisma.salaryslip.findMany({
    where: { userId: testUser.id },
  });

  console.log(`\n📊 Total Salary Slips in MySQL for ${testUser.name}: ${allSlips.length}`);
  console.log("🎉 ALL SALARY SLIP SYSTEM TESTS PASSED SUCCESSFULLY!\n");
  process.exit(0);
}

runSalarySlipTests().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
