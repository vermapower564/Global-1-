const mysql = require("mysql2/promise");
require("dotenv").config();

async function seed3MonthsSalarySlips() {
  console.log("==================================================");
  console.log("💳 Seeding 3 Months Salary Slips (June, July, August 2026) for ALL 32 Employees in TiDB Cloud");
  console.log("==================================================");

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || "4000", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
  });

  console.log("Connected to TiDB Cloud.");

  // 1. Fetch all 32 employees
  const [users] = await connection.query(
    `SELECT u.id, u.employeeId, u.name, u.email, u.role, u.departmentId, d.name AS department_name
     FROM user u
     LEFT JOIN department d ON u.departmentId = d.id
     ORDER BY u.employeeId ASC`
  );

  console.log(`Found ${users.length} employees in TiDB Cloud.`);

  const months = [
    { key: "2026-06", label: "June 2026", paymentDay: "2026-06-30" },
    { key: "2026-07", label: "July 2026", paymentDay: "2026-07-31" },
    { key: "2026-08", label: "August 2026", paymentDay: "2026-08-31" },
  ];

  const banks = [
    { name: "State Bank of India", ifsc: "SBIN0001234" },
    { name: "HDFC Bank", ifsc: "HDFC0000456" },
    { name: "ICICI Bank", ifsc: "ICIC0000789" },
    { name: "Axis Bank", ifsc: "UTIB0001011" },
    { name: "Kotak Mahindra Bank", ifsc: "KKBK0001213" },
    { name: "Punjab National Bank", ifsc: "PUNB0001415" },
  ];

  let totalInserted = 0;

  for (const user of users) {
    const empId = user.employeeId || `EMP-${user.id.slice(0, 4)}`;
    const role = user.role || "DEVELOPER";

    // Dynamic CTC based on role
    let baseCTC = 750000;
    if (role === "SUPER_ADMIN" || role === "DIRECTOR") baseCTC = 1500000;
    else if (role === "FINANCE" || role === "PROJECT_MANAGER" || role === "SALES") baseCTC = 1100000;
    else if (role === "DEVELOPER" || role === "DESIGNER" || role === "VIDEO_EDITOR") baseCTC = 850000;
    else if (role === "HR" || role === "CONTENT_WRITER" || role === "SEO_EXECUTIVE") baseCTC = 650000;

    const monthlyGross = Math.round(baseCTC / 12);
    const basicSalary = Math.round(monthlyGross * 0.5);
    const hra = Math.round(monthlyGross * 0.3);
    const allowances = monthlyGross - basicSalary - hra;

    const pfDeduction = Math.round(basicSalary * 0.12);
    const taxDeduction = Math.round(monthlyGross * 0.05);
    const otherDeductions = 200; // Professional Tax
    const totalDeductions = pfDeduction + taxDeduction + otherDeductions;
    const netSalary = monthlyGross - totalDeductions;

    // Pick consistent bank for employee
    const hash = empId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bank = banks[hash % banks.length];
    const accMasked = `••••••••${String((hash * 73) % 10000).padStart(4, "0")}`;

    for (const m of months) {
      const slipId = `SLIP-${empId}-${m.key}`;
      const txnRef = `TXN-${m.key.replace("-", "")}-${empId.replace(/[^a-zA-Z0-9]/g, "")}-${String(hash * 37).slice(-6)}`;

      await connection.query(
        `INSERT INTO salaryslip (
          id, userId, employeeId, employeeName, salaryMonth, monthKey,
          basicSalary, hra, allowances, bonus, overtime, grossSalary,
          pfDeduction, taxDeduction, otherDeductions, totalDeductions, netSalary,
          paymentDate, paymentStatus, paymentMethod, transactionReference, notes,
          accountHolderName, accountNumberMasked, bankName, ifscCode,
          generatedAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, 'PAID', 'Direct Bank Transfer / NEFT', ?, ?,
          ?, ?, ?, ?,
          NOW(), NOW()
        ) ON DUPLICATE KEY UPDATE
          employeeName = VALUES(employeeName),
          grossSalary = VALUES(grossSalary),
          netSalary = VALUES(netSalary),
          paymentStatus = 'PAID',
          transactionReference = VALUES(transactionReference),
          updatedAt = NOW()`,
        [
          slipId,
          user.id,
          empId,
          user.name || "Employee",
          m.label,
          m.key,
          basicSalary,
          hra,
          allowances,
          0,
          0,
          monthlyGross,
          pfDeduction,
          taxDeduction,
          otherDeductions,
          totalDeductions,
          netSalary,
          m.paymentDay,
          txnRef,
          `Regular monthly salary disbursement for ${m.label}. Fully verified with standard PF (12%) and Tax deductions.`,
          user.name || "Employee",
          accMasked,
          bank.name,
          bank.ifsc,
        ]
      );
      totalInserted++;
    }
  }

  await connection.end();

  console.log(`\n✅ Successfully seeded ${totalInserted} monthly salary slips across all ${users.length} employees for June, July, and August 2026 in TiDB Cloud!`);
}

seed3MonthsSalarySlips().catch(console.error);
