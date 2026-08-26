import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { generateSalarySlipPdf, SalarySlipPdfData } from "@/lib/salarySlipPdf";
import { sendSalarySlipEmail } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/email/smtp";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    const privilegedRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"];

    if (!authResult.user || !privilegedRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only HR, Finance, and Administrators can email salary slips." },
        { status: 403 }
      );
    }

    const { id: slipIdParam } = await params;
    if (!slipIdParam) {
      return NextResponse.json(
        { success: false, error: "Salary slip ID is required." },
        { status: 400 }
      );
    }

    const decodedId = decodeURIComponent(slipIdParam).trim();

    // 1. Fetch Salary Slip, Employee Details & Banking Info from database
    const sql = `
      SELECT 
        s.*,
        u.id AS user_id,
        u.name AS user_name,
        u.employeeId AS user_employeeId,
        u.email AS user_email,
        u.role AS user_role,
        u.phone AS user_phone,
        u.salary AS user_baseSalary,
        d.name AS department_name,
        b.accountHolderName AS bank_accountHolder,
        b.bankName AS bank_bankName,
        b.accountNumber AS bank_accountNumber,
        b.ifscCode AS bank_ifscCode,
        b.accountType AS bank_accountType
      FROM salaryslip s
      LEFT JOIN user u ON s.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      LEFT JOIN bankdetail b ON u.id = b.userId
      WHERE s.id = ? OR s.monthKey = ? OR s.employeeId = ?
      ORDER BY s.monthKey DESC
      LIMIT 1
    `;

    const rows = await queryDb<any[]>(sql, [decodedId, decodedId, decodedId]);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Salary slip not found in database." },
        { status: 404 }
      );
    }

    const s = rows[0];
    const recipientEmail = (s.user_email || "").trim();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: `Employee ${s.employeeName || s.user_name} (${s.employeeId || s.user_employeeId}) has no valid email address on record.`,
        },
        { status: 400 }
      );
    }

    const empName = s.employeeName || s.user_name || "Employee";
    const empId = s.employeeId || s.user_employeeId || "EMP";
    const salaryMonth = s.salaryMonth || "August 2026";
    const netSalary = Number(s.netSalary || 0);
    const grossSalary = Number(s.grossSalary || 0);
    const totalDeductions = Number(s.totalDeductions || 0);

    // 2. Generate Real Vector PDF Binary
    const pdfData: SalarySlipPdfData = {
      id: s.id,
      employeeId: empId,
      employeeName: empName,
      salaryMonth,
      monthKey: s.monthKey,
      department: s.department_name || "Engineering & Operations",
      designation: s.user_role || "Associate",
      employeeEmail: recipientEmail,
      basicSalary: Number(s.basicSalary || 0),
      hra: Number(s.hra || 0),
      allowances: Number(s.allowances || 0),
      bonus: Number(s.bonus || 0),
      overtime: Number(s.overtime || 0),
      grossSalary,
      pfDeduction: Number(s.pfDeduction || 0),
      taxDeduction: Number(s.taxDeduction || 0),
      otherDeductions: Number(s.otherDeductions || 0),
      totalDeductions,
      netSalary,
      paymentStatus: s.paymentStatus || "PAID",
      paymentMethod: s.paymentMethod || "Bank Transfer",
      bankName: s.bank_bankName || s.bankName || "HDFC Bank Ltd",
      accountHolderName: s.bank_accountHolder || s.accountHolderName || empName,
      accountNumberMasked: s.bank_accountNumber ? `•••• •••• ${s.bank_accountNumber.slice(-4)}` : (s.accountNumberMasked || "•••• •••• 8890"),
      ifscCode: s.bank_ifscCode || s.ifscCode || "HDFC0001234",
      transactionReference: s.transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
      paymentDate: s.paymentDate ? new Date(s.paymentDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
      generatedAt: s.generatedAt ? new Date(s.generatedAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
    };

    const pdfBuffer = generateSalarySlipPdf(pdfData);
    const pdfFilename = `Salary-Slip-${empId}-${salaryMonth.replace(/\s+/g, "-")}.pdf`;

    const appBaseUrl = getAppBaseUrl(request);
    const viewOnlineUrl = `${appBaseUrl}/salary-slips/${encodeURIComponent(s.id)}`;

    // 3. Dispatch Email via SMTP with PDF Attachment
    const emailResult = await sendSalarySlipEmail(
      recipientEmail,
      {
        name: empName,
        employeeId: empId,
        salaryMonth,
        netSalary,
        grossSalary,
        totalDeductions,
        pdfFilename,
        viewOnlineUrl,
      },
      pdfBuffer
    );

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Failed to dispatch salary slip email via SMTP.",
          recipient: recipientEmail,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `✓ Official salary slip for ${salaryMonth} sent successfully to ${recipientEmail} with PDF attachment.`,
      recipient: recipientEmail,
      messageId: emailResult.messageId,
      pdfFilename,
    });
  } catch (error: any) {
    console.error("POST /api/salary-slips/[id]/email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process salary slip email." },
      { status: 500 }
    );
  }
}