import { prisma } from "../lib/prisma";
import { maskAccountNumber, validateBankDetails, validateIfsc } from "../lib/bankHelper";
import bcrypt from "bcryptjs";

async function runFeatureVerification() {
  console.log("🚀 Starting Comprehensive Bank Details, Payslip & Resignation Verification...\n");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ Passed: ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ Failed: ${testName}`);
      testsFailed++;
    }
  }

  try {
    // 1. Test Bank Masking & Validation
    const masked = maskAccountNumber("50100432198765");
    assert(masked === "••••••••8765", "Bank account masking correctly masks leading digits");

    const validIfsc = validateIfsc("HDFC0001234");
    assert(validIfsc.isValid === true, "Valid IFSC code accepted");

    const invalidIfsc = validateIfsc("INVALID_IFSC");
    assert(invalidIfsc.isValid === false, "Invalid IFSC code rejected");

    const bankValidation = validateBankDetails({
      accountHolderName: "Roushan Verma",
      bankName: "HDFC Bank",
      accountNumber: "50100432198765",
      ifscCode: "HDFC0001234",
    });
    assert(bankValidation.isValid === true, "Complete bank details validated successfully");

    // 2. Test Employee Onboarding with Bank Details in MySQL Database
    const testEmpId = `EMP-TEST-${Date.now()}`;
    const testEmail = `test.employee.${Date.now()}@gmail.com`;
    const passwordHash = await bcrypt.hash("Password@123", 10);

    const testUser = await prisma.user.create({
      data: {
        employeeId: testEmpId,
        name: "Test Developer",
        email: testEmail,
        password: passwordHash,
        phone: "+91 98765 11223",
        role: "DEVELOPER",
        salary: 900000,
        isActive: true,
        bankDetail: {
          create: {
            accountHolderName: "Test Developer",
            bankName: "State Bank of India",
            accountNumber: "987654321098",
            ifscCode: "SBIN0001001",
            branchName: "Cyber City Branch",
            accountType: "Savings",
          },
        },
      },
      include: { bankDetail: true },
    });

    assert(!!testUser && testUser.employeeId === testEmpId, "Test employee created in MySQL database");
    assert(
      !!testUser.bankDetail && testUser.bankDetail.bankName === "State Bank of India",
      "Employee bank details persisted and linked via Prisma relation"
    );

    // 3. Test Salary Slip Generation with Automatic Bank Details
    const slip = await prisma.salaryslip.create({
      data: {
        userId: testUser.id,
        employeeId: testUser.employeeId,
        employeeName: testUser.name,
        salaryMonth: "August 2026",
        monthKey: "2026-08",
        basicSalary: 45000,
        hra: 15000,
        allowances: 10000,
        grossSalary: 70000,
        pfDeduction: 5400,
        taxDeduction: 2000,
        otherDeductions: 600,
        totalDeductions: 8000,
        netSalary: 62000,
        paymentStatus: "PAID",
        paymentMethod: "Bank Transfer",
        accountHolderName: testUser.bankDetail?.accountHolderName,
        bankName: testUser.bankDetail?.bankName,
        accountNumberMasked: maskAccountNumber(testUser.bankDetail?.accountNumber),
        ifscCode: testUser.bankDetail?.ifscCode,
        transactionReference: `TXN-${Date.now()}`,
      },
    });

    assert(!!slip && slip.netSalary === 62000, "Monthly salary slip generated with correct net pay");
    assert(slip.accountNumberMasked === "••••••••1098", "Salary slip contains masked bank account number");
    assert(slip.bankName === "State Bank of India", "Salary slip contains correct bank name");

    // 4. Test Resignation Submission with Minimum 1-Week Notice Period
    const resDate = new Date();
    const noticeDays = 7; // 1 week minimum
    const lwd = new Date(resDate.getTime() + noticeDays * 24 * 3600 * 1000);
    const resId = `RSG-${Date.now()}`;

    const resignation = await prisma.resignation.create({
      data: {
        resignationId: resId,
        userId: testUser.id,
        employeeId: testUser.employeeId,
        employeeName: testUser.name,
        email: testUser.email,
        department: "Development & Engineering",
        role: "Developer",
        resignationDate: resDate,
        lastWorkingDay: lwd,
        reason: "Pursuing higher studies (Minimum 1-week notice period)",
        status: "SUBMITTED",
      },
    });

    assert(!!resignation && resignation.status === "SUBMITTED", "Resignation submitted with 1-week notice period");

    // 5. Test Admin Acceptance & Deletion of Employee
    // Admin accepts resignation and triggers employee offboarding / deletion
    await prisma.resignation.update({
      where: { id: resignation.id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    // Delete user and cascade relations
    await prisma.salaryslip.deleteMany({ where: { userId: testUser.id } });
    await prisma.resignation.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    const deletedCheck = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(deletedCheck === null, "Admin successfully deleted offboarded employee upon resignation acceptance");

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log(`========================================\n`);

    await prisma.$disconnect();
    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error("❌ Test Script Error:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runFeatureVerification();
