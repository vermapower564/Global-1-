const mysql = require("mysql2/promise");

async function seedMonthlySalarySlips() {
  console.log("==================================================");
  console.log("💰 Generating August 2026 Salary Slips for All Employees on TiDB Cloud");
  console.log("==================================================");

  const conn = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "4BrXAABTf5SQeKq.root",
    password: "oF5rWQth8eQANTqp",
    database: "oms",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  // 1. Fetch all employees and their bank details
  const [users] = await conn.query(`
    SELECT u.id, u.employeeId, u.name, u.role, u.salary, d.name AS deptName,
           b.bankName, b.accountNumber, b.ifscCode, b.accountHolderName
    FROM user u
    LEFT JOIN department d ON u.departmentId = d.id
    LEFT JOIN bankdetail b ON u.id = b.userId;
  `);

  console.log(`Found ${users.length} employees to generate salary slips for.`);

  const monthName = "August 2026";
  const monthKey = "2026-08";
  const paymentDate = new Date("2026-08-05T10:00:00.000Z");

  const roleSalaryMap = {
    SUPER_ADMIN: 125000,
    DIRECTOR: 137500,
    FINANCE: 95000,
    HR: 62500,
    PROJECT_MANAGER: 90000,
    DEVELOPER: 75000,
    UI_UX_DESIGNER: 58000,
    VIDEO_EDITOR: 50000,
    SALES: 70000,
    CONTENT_WRITER: 45000,
    SEO_EXECUTIVE: 48000,
    CAMERA_TEAM: 42000,
    INTERN: 30000,
  };

  let generatedCount = 0;

  for (const u of users) {
    const empId = u.employeeId || `EMP-${u.id.slice(-4)}`;
    const empName = u.name || "Employee";

    // Determine Monthly Gross Salary
    let baseGross = 50000;
    if (u.salary && u.salary > 100000) {
      baseGross = Math.round(u.salary / 12);
    } else if (u.salary && u.salary >= 20000 && u.salary <= 200000) {
      baseGross = Number(u.salary);
    } else {
      baseGross = roleSalaryMap[u.role] || 55000;
    }

    // Salary Structure Breakdown
    const basic = Math.round(baseGross * 0.5);
    const hra = Math.round(baseGross * 0.25);
    const allowances = Math.round(baseGross * 0.15);
    const bonus = Math.round(baseGross * 0.1);
    const overtime = 0;
    const gross = basic + hra + allowances + bonus + overtime;

    const pf = Math.round(basic * 0.12);
    const tax = Math.round(gross * 0.05);
    const other = 200; // Professional Tax
    const totalDeductions = pf + tax + other;
    const netSalary = gross - totalDeductions;

    // Banking Details
    const bankName = u.bankName || "State Bank of India";
    const rawAcc = u.accountNumber || "98761000" + Math.floor(1000 + Math.random() * 9000);
    const accMasked = `••••••••${rawAcc.slice(-4)}`;
    const ifsc = u.ifscCode || "SBIN0001001";
    const holder = u.accountHolderName || empName;
    const txnRef = `TXN-${monthKey.replace("-", "")}-${empId.replace(/[^a-zA-Z0-9]/g, "")}-${Math.floor(100000 + Math.random() * 900000)}`;

    const slipId = `SLIP-${empId}-${monthKey}`;

    await conn.query(
      `INSERT INTO salaryslip (
        id, userId, employeeId, employeeName, salaryMonth, monthKey,
        basicSalary, hra, allowances, bonus, overtime, grossSalary,
        pfDeduction, taxDeduction, otherDeductions, totalDeductions, netSalary,
        paymentDate, paymentStatus, paymentMethod, transactionReference, notes,
        generatedAt, updatedAt, accountHolderName, accountNumberMasked, bankName, ifscCode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', 'Direct Bank Transfer (NEFT)', ?, ?, NOW(), NOW(), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        employeeName = VALUES(employeeName),
        basicSalary = VALUES(basicSalary),
        hra = VALUES(hra),
        allowances = VALUES(allowances),
        bonus = VALUES(bonus),
        grossSalary = VALUES(grossSalary),
        pfDeduction = VALUES(pfDeduction),
        taxDeduction = VALUES(taxDeduction),
        otherDeductions = VALUES(otherDeductions),
        totalDeductions = VALUES(totalDeductions),
        netSalary = VALUES(netSalary),
        paymentStatus = 'PAID',
        transactionReference = VALUES(transactionReference),
        accountHolderName = VALUES(accountHolderName),
        accountNumberMasked = VALUES(accountNumberMasked),
        bankName = VALUES(bankName),
        ifscCode = VALUES(ifscCode),
        updatedAt = NOW()`,
      [
        slipId,
        u.id,
        empId,
        empName,
        monthName,
        monthKey,
        basic,
        hra,
        allowances,
        bonus,
        overtime,
        gross,
        pf,
        tax,
        other,
        totalDeductions,
        netSalary,
        paymentDate,
        txnRef,
        `Regular monthly payroll for ${monthName}. Verified and approved by Corporate Finance.`,
        holder,
        accMasked,
        bankName,
        ifsc,
      ]
    );

    generatedCount++;
    console.log(`✅ [${generatedCount}/${users.length}] ${empName} (${empId}) -> Gross: ₹${gross.toLocaleString("en-IN")}, Deductions: ₹${totalDeductions.toLocaleString("en-IN")}, Net Payout: ₹${netSalary.toLocaleString("en-IN")} [${bankName}]`);
  }

  const [totalSlips] = await conn.query(`SELECT COUNT(*) as count FROM salaryslip WHERE monthKey = ?;`, [monthKey]);
  console.log(`\n🎉 Salary Slip Generation Complete! Total ${monthName} Slips in TiDB Cloud: ${totalSlips[0].count}`);

  await conn.end();
}

seedMonthlySalarySlips().catch(console.error);
