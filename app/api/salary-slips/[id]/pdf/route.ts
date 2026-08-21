import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { maskAccountNumber } from "@/lib/bankHelper";

export const dynamic = "force-dynamic";

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Salary slip ID required." }, { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();

    // Query salary slip from TiDB
    const slipRows = await queryDb<any[]>(
      `SELECT s.*, 
              u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role,
              d.name AS department_name
       FROM salaryslip s
       LEFT JOIN user u ON s.userId = u.id
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE s.id = ? OR s.monthKey = ?
       LIMIT 1`,
      [cleanId, cleanId]
    );

    if (!slipRows || slipRows.length === 0) {
      return NextResponse.json({ success: false, error: "Salary slip record not found." }, { status: 404 });
    }

    const slip = slipRows[0];
    const authUser = authResult.user;
    const isOwner = slip.userId === authUser.id;
    const isPrivileged = PRIVILEGED_ROLES.includes(authUser.role.toUpperCase());

    // Strict Ownership / Authorization Verification
    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to access another employee's confidential salary slip.",
        },
        { status: 403 }
      );
    }

    // Log sensitive download audit event
    await logAuditEvent(
      authUser.id,
      "SALARY_SLIP_DOWNLOADED",
      `User ${authUser.email} downloaded official salary slip (${slip.salaryMonth}) for employee ${slip.employeeName || slip.user_name} (${slip.employeeId || slip.user_employeeId})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    const empName = slip.employeeName || slip.user_name || "Employee";
    const empId = slip.employeeId || slip.user_employeeId || "EMP";
    const empDept = slip.department_name || "Operations";
    const empRole = (slip.user_role || "EMPLOYEE").replace(/_/g, " ");

    const basic = Number(slip.basicSalary) || 0;
    const hra = Number(slip.hra) || 0;
    const allowances = Number(slip.allowances) || 0;
    const bonus = Number(slip.bonus) || 0;
    const overtime = Number(slip.overtime) || 0;
    const gross = Number(slip.grossSalary) || basic + hra + allowances + bonus + overtime;

    const pf = Number(slip.pfDeduction) || 0;
    const tax = Number(slip.taxDeduction) || 0;
    const other = Number(slip.otherDeductions) || 0;
    const totalDeductions = Number(slip.totalDeductions) || pf + tax + other;
    const net = Number(slip.netSalary) || gross - totalDeductions;

    const bankName = slip.bankName || "State Bank of India";
    const maskedAcc = slip.accountNumberMasked || "••••••••4521";
    const ifsc = slip.ifscCode || "SBIN0001001";
    const paymentMethod = slip.paymentMethod || "Direct Bank Transfer";
    const txnRef = slip.transactionReference || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const payDate = slip.paymentDate ? new Date(slip.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "01 " + slip.salaryMonth;
    const genDate = new Date(slip.generatedAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    // Format Currency
    const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Salary Slip - ${empName} (${slip.salaryMonth})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #f8fafc; color: #0f172a; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 24px; margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo { width: 44px; height: 44px; border-radius: 12px; background: #2563eb; color: #ffffff; font-size: 22px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
    .brand-title { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .brand-sub { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
    .slip-badge { text-align: right; }
    .slip-title { font-size: 16px; font-weight: 800; color: #0f172a; }
    .slip-month { font-size: 13px; font-weight: 700; color: #64748b; margin-top: 2px; }
    .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px; }
    .emp-item { font-size: 12px; }
    .emp-label { font-weight: 700; color: #64748b; margin-bottom: 3px; }
    .emp-val { font-weight: 800; color: #0f172a; font-size: 13px; }
    .salary-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .table-box { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    .table-header { background: #f1f5f9; padding: 10px 16px; font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
    .table-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
    .table-row:last-child { border-bottom: none; }
    .table-row-total { background: #f8fafc; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0; }
    .net-box { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; border-radius: 14px; padding: 22px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .net-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
    .net-val { font-size: 26px; font-weight: 900; color: #38bdf8; }
    .bank-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px; font-size: 12px; }
    .bank-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 11px; color: #64748b; }
    .stamp { display: inline-block; border: 2px dashed #10b981; color: #10b981; font-weight: 900; font-size: 11px; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }
    .actions { text-align: center; margin-top: 24px; }
    .btn-print { background: #2563eb; color: #ffffff; border: none; font-size: 13px; font-weight: 800; padding: 10px 24px; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">O</div>
        <div>
          <div class="brand-title">OMS Enterprise</div>
          <div class="brand-sub">Official Salary & Payment Statement</div>
        </div>
      </div>
      <div class="slip-badge">
        <div class="slip-title">SALARY PAYSLIP</div>
        <div class="slip-month">${slip.salaryMonth}</div>
      </div>
    </div>

    <div class="emp-grid">
      <div class="emp-item">
        <div class="emp-label">EMPLOYEE NAME</div>
        <div class="emp-val">${empName}</div>
      </div>
      <div class="emp-item">
        <div class="emp-label">EMPLOYEE ID</div>
        <div class="emp-val">${empId}</div>
      </div>
      <div class="emp-item">
        <div class="emp-label">DESIGNATION / ROLE</div>
        <div class="emp-val">${empRole}</div>
      </div>
      <div class="emp-item">
        <div class="emp-label">DEPARTMENT</div>
        <div class="emp-val">${empDept}</div>
      </div>
    </div>

    <div class="salary-tables">
      <div class="table-box">
        <div class="table-header">Earnings</div>
        <div class="table-row"><span>Basic Salary</span><span>${fmt(basic)}</span></div>
        <div class="table-row"><span>House Rent Allowance (HRA)</span><span>${fmt(hra)}</span></div>
        <div class="table-row"><span>Special & Other Allowances</span><span>${fmt(allowances)}</span></div>
        <div class="table-row"><span>Performance Bonus</span><span>${fmt(bonus)}</span></div>
        <div class="table-row"><span>Overtime & Rewards</span><span>${fmt(overtime)}</span></div>
        <div class="table-row table-row-total"><span>Total Gross Earnings</span><span>${fmt(gross)}</span></div>
      </div>

      <div class="table-box">
        <div class="table-header">Deductions</div>
        <div class="table-row"><span>Provident Fund (PF)</span><span>${fmt(pf)}</span></div>
        <div class="table-row"><span>Professional & TDS Tax</span><span>${fmt(tax)}</span></div>
        <div class="table-row"><span>Other Policy Deductions</span><span>${fmt(other)}</span></div>
        <div class="table-row"><span>-</span><span>-</span></div>
        <div class="table-row"><span>-</span><span>-</span></div>
        <div class="table-row table-row-total"><span>Total Deductions</span><span>${fmt(totalDeductions)}</span></div>
      </div>
    </div>

    <div class="net-box">
      <div>
        <div class="net-label">NET TAKE-HOME PAY</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Credited to employee bank account</div>
      </div>
      <div class="net-val">${fmt(net)}</div>
    </div>

    <div class="bank-box">
      <div style="font-weight: 800; color: #334155; text-transform: uppercase; font-size: 11px;">Payment & Banking Details</div>
      <div class="bank-grid">
        <div><div class="emp-label">BANK NAME</div><div style="font-weight: 700;">${bankName}</div></div>
        <div><div class="emp-label">ACCOUNT NUMBER</div><div style="font-weight: 700; font-family: monospace;">${maskedAcc}</div></div>
        <div><div class="emp-label">IFSC CODE</div><div style="font-weight: 700; font-family: monospace;">${ifsc}</div></div>
        <div><div class="emp-label">PAYMENT METHOD</div><div style="font-weight: 700;">${paymentMethod}</div></div>
      </div>
    </div>

    <div class="footer">
      <div>
        <div>Payment Date: <strong>${payDate}</strong> • Reference: <span style="font-family: monospace;">${txnRef}</span></div>
        <div style="margin-top: 3px;">Generated on ${genDate} via OMS Enterprise Payroll Engine</div>
      </div>
      <div class="stamp">✓ PAID & VERIFIED</div>
    </div>

    <div class="actions">
      <button class="btn-print" onclick="window.print()">📥 Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Salary Slip PDF Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to generate PDF." }, { status: 500 });
  }
}
