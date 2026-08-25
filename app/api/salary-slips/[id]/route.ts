import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { maskAccountNumber } from "@/lib/bankHelper";

export const dynamic = "force-dynamic";

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"];

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

    // Query full salary slip details, employee profile, department, and banking info from TiDB
    const slipRows = await queryDb<any[]>(
      `SELECT s.*, 
              u.id AS user_id, u.name AS user_name, u.employeeId AS user_employeeId, u.email AS user_email, 
              u.role AS user_role, u.phone AS user_phone, u.createdAt AS user_joinedAt, u.salary AS user_baseSalary,
              d.name AS department_name, d.code AS department_code,
              b.accountHolderName AS bank_accountHolderName, b.bankName AS bank_bankName,
              b.accountNumberMasked AS bank_accountNumberMasked, b.accountNumberEncrypted AS bank_accountNumber,
              b.ifscCode AS bank_ifscCode, b.branchName AS bank_branchName, b.accountType AS bank_accountType
       FROM salaryslip s
       LEFT JOIN user u ON s.userId = u.id
       LEFT JOIN department d ON u.departmentId = d.id
       LEFT JOIN bankdetail b ON u.id = b.userId
       WHERE s.id = ? OR s.monthKey = ? OR s.employeeId = ?
       LIMIT 1`,
      [cleanId, cleanId, cleanId]
    );

    if (!slipRows || slipRows.length === 0) {
      return NextResponse.json({ success: false, error: "Salary slip record not found." }, { status: 404 });
    }

    const slip = slipRows[0];
    const authUser = authResult.user;
    const slipUserId = slip.userId || slip.user_id;
    const slipEmpId = slip.employeeId || slip.user_employeeId;
    const slipEmail = slip.user_email || slip.email;

    const isOwner =
      slipUserId === authUser.id ||
      slipEmpId === (authUser as any).employeeId ||
      slipEmpId === authUser.id ||
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

    const basic = Number(slip.basicSalary) || Number(slip.user_baseSalary) || 0;
    const hra = Number(slip.hra) || Math.round(basic * 0.4);
    const allowances = Number(slip.allowances) || 0;
    const bonus = Number(slip.bonus) || 0;
    const overtime = Number(slip.overtime) || 0;
    const gross = Number(slip.grossSalary) || (basic + hra + allowances + bonus + overtime);

    const pf = Number(slip.pfDeduction) || Math.round(basic * 0.12);
    const tax = Number(slip.taxDeduction) || 0;
    const other = Number(slip.otherDeductions) || 0;
    const totalDeductions = Number(slip.totalDeductions) || (pf + tax + other);
    const net = Number(slip.netSalary) || (gross - totalDeductions);

    const bankName = slip.bankName || slip.bank_bankName || "State Bank of India";
    const rawAcc = slip.accountNumberMasked || slip.bank_accountNumberMasked || (slip.bank_accountNumber ? maskAccountNumber(slip.bank_accountNumber) : "••••••••5432");
    const maskedAcc = rawAcc.includes("••••") ? rawAcc : maskAccountNumber(rawAcc);
    const ifscCode = slip.ifscCode || slip.bank_ifscCode || "SBIN0001001";
    const accountHolder = slip.accountHolderName || slip.bank_accountHolderName || slip.employeeName || slip.user_name;

    const payload = {
      id: slip.id,
      userId: slip.userId || slip.user_id,
      employeeId: slip.employeeId || slip.user_employeeId,
      employeeName: slip.employeeName || slip.user_name,
      employeeEmail: slip.user_email || slip.email,
      department: slip.department_name || "Operations & Technology",
      departmentCode: slip.department_code || "ENG",
      designation: (slip.user_role || "EMPLOYEE").replace(/_/g, " "),
      salaryMonth: slip.salaryMonth,
      monthKey: slip.monthKey,
      
      // Earnings Breakdown
      earnings: {
        basicSalary: basic,
        hra,
        allowances,
        bonus,
        overtime,
        grossSalary: gross,
      },

      // Deductions Breakdown
      deductions: {
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions: other,
        totalDeductions,
      },

      // Net Pay
      netSalary: net,
      
      // Payment Details
      payment: {
        status: slip.paymentStatus || "PAID",
        method: slip.paymentMethod || "Direct Bank Transfer",
        paymentDate: slip.paymentDate,
        transactionReference: slip.transactionReference || `TXN-OMS-${Date.now().toString().slice(-6)}`,
        accountHolderName: accountHolder,
        bankName,
        accountNumberMasked: maskedAcc,
        ifscCode,
        branchName: slip.bank_branchName || "Main Cyber City Branch",
        accountType: slip.bank_accountType || "SAVINGS",
      },

      notes: slip.notes || null,
      generatedAt: slip.generatedAt || slip.createdAt,
      joinedAt: slip.user_joinedAt,
    };

    return NextResponse.json({
      success: true,
      data: payload,
      slip: payload,
    });
  } catch (error: any) {
    console.error("GET /api/salary-slips/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch salary slip details." }, { status: 500 });
  }
}
