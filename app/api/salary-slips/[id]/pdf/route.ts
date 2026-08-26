import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { maskAccountNumber } from "@/lib/bankHelper";
import { generateSalarySlipPdf } from "@/lib/salarySlipPdf";

export const dynamic = "force-dynamic";

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR", "ADMIN", "PROJECT_MANAGER"];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const resolvedParams = await Promise.resolve(context?.params);
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Salary slip ID required." }, { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();

    // Query salary slip from TiDB
    const slipRows = await queryDb<any[]>(
      `SELECT s.*, 
              u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, u.role AS user_role,
              d.name AS department_name,
              b.accountHolderName AS bank_accountHolderName, b.bankName AS bank_bankName,
              b.accountNumber AS bank_accountNumber,
              b.ifscCode AS bank_ifscCode
       FROM salaryslip s
       LEFT JOIN user u ON (s.userId = u.id OR s.employeeId = u.employeeId)
       LEFT JOIN department d ON u.departmentId = d.id
       LEFT JOIN bankdetail b ON (u.id = b.userId OR s.userId = b.userId)
       WHERE s.id = ? OR s.monthKey = ? OR s.employeeId = ? OR s.userId = ?
       ORDER BY s.monthKey DESC, s.generatedAt DESC
       LIMIT 1`,
      [cleanId, cleanId, cleanId, cleanId]
    );

    if (!slipRows || slipRows.length === 0) {
      return NextResponse.json({ success: false, error: "Salary slip record not found." }, { status: 404 });
    }

    const slip = slipRows[0];
    const authUser = authResult.user;
    const slipUserId = slip.userId || slip.userid;
    const slipEmpId = slip.employeeId || slip.employeeid || slip.user_employeeId;
    const slipEmail = slip.user_email || slip.email;

    const isOwner =
      slipUserId === authUser.id ||
      slipEmpId === authUser.id ||
      slipEmpId === (authUser as any).employeeId ||
      slipUserId === (authUser as any).employeeId ||
      (slipEmail && slipEmail.toLowerCase() === (authUser.email || "").toLowerCase());
    const isPrivileged = PRIVILEGED_ROLES.includes((authUser.role || "").toUpperCase());

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

    // Log sensitive download audit event safely
    try {
      await logAuditEvent(
        authUser.id,
        "SALARY_SLIP_DOWNLOADED",
        `User ${authUser.email} downloaded official salary slip (${slip.salaryMonth}) for employee ${slip.employeeName || slip.user_name} (${slipEmpId || slip.user_employeeId})`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );
    } catch (e) {}

    const empName = slip.employeeName || slip.user_name || "Employee";
    const empId = slip.employeeId || slip.user_employeeId || "EMP";
    const empDept = slip.department_name || "Operations & Technology";
    const empRole = (slip.user_role || "EMPLOYEE").replace(/_/g, " ");

    const basic = Number(slip.basicSalary) || 0;
    const hra = Number(slip.hra) || Math.round(basic * 0.4);
    const allowances = Number(slip.allowances) || 0;
    const bonus = Number(slip.bonus) || 0;
    const overtime = Number(slip.overtime) || 0;
    const gross = Number(slip.grossSalary) || basic + hra + allowances + bonus + overtime;

    const pf = Number(slip.pfDeduction) || Math.round(basic * 0.12);
    const tax = Number(slip.taxDeduction) || 0;
    const other = Number(slip.otherDeductions) || 0;
    const totalDeductions = Number(slip.totalDeductions) || pf + tax + other;
    const net = Number(slip.netSalary) || gross - totalDeductions;

    const bankName = slip.bankName || slip.bank_bankName || "State Bank of India";
    const rawAcc = slip.accountNumberMasked || (slip.bank_accountNumber ? maskAccountNumber(slip.bank_accountNumber) : "••••••••5432");
    const maskedAcc = rawAcc.includes("••••") ? rawAcc : maskAccountNumber(rawAcc);
    const ifsc = slip.ifscCode || slip.bank_ifscCode || "SBIN0001001";
    const accountHolder = slip.accountHolderName || slip.bank_accountHolderName || empName;
    const paymentMethod = slip.paymentMethod || "Direct Bank Transfer";
    const txnRef = slip.transactionReference || `TXN-OMS-${slip.id}`;
    const salaryMonth = slip.salaryMonth || "August 2026";

    // Generate genuine binary PDF buffer
    const pdfBuffer = generateSalarySlipPdf({
      id: slip.id,
      employeeName: empName,
      employeeId: empId,
      employeeEmail: slipEmail,
      department: empDept,
      designation: empRole,
      salaryMonth,
      monthKey: slip.monthKey,
      basicSalary: basic,
      hra,
      allowances,
      bonus,
      overtime,
      grossSalary: gross,
      pfDeduction: pf,
      taxDeduction: tax,
      otherDeductions: other,
      totalDeductions,
      netSalary: net,
      paymentStatus: slip.paymentStatus || "PAID",
      paymentMethod,
      paymentDate: slip.paymentDate,
      transactionReference: txnRef,
      bankName,
      accountHolderName: accountHolder,
      accountNumberMasked: maskedAcc,
      ifscCode: ifsc,
      generatedAt: slip.generatedAt,
    });

    const safeFilename = `Salary-Slip-${empId}-${salaryMonth.replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Salary Slip PDF Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to generate PDF." }, { status: 500 });
  }
}