import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const privilegedRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"];

    if (!authResult.user || !privilegedRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Salary slip records require HR, Finance, or Executive authorization." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const month = searchParams.get("month") || "All";
    const status = searchParams.get("status") || "All";

    let sql = `
      SELECT 
        s.*,
        u.email AS user_email, u.role AS user_role,
        d.name AS department_name
      FROM salaryslip s
      LEFT JOIN user u ON s.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (month && month !== "All") {
      sql += ` AND (s.monthKey = ? OR s.salaryMonth LIKE ?)`;
      params.push(month, `%${month}%`);
    }

    if (status && status !== "All") {
      sql += ` AND s.paymentStatus = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (s.employeeName LIKE ? OR s.employeeId LIKE ? OR u.email LIKE ? OR d.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.monthKey DESC, s.employeeName ASC`;

    const rawSlips = await queryDbCached<any[]>(sql, params, 10);

    const slips = (rawSlips || []).map((s) => ({
      ...s,
      user: {
        id: s.userId,
        employeeId: s.employeeId,
        name: s.employeeName,
        email: s.user_email,
        role: s.user_role,
        department: s.department_name ? { name: s.department_name } : null,
      },
    }));

    // Extract available distinct months for filter dropdown
    const distinctMonthRows = await queryDbCached<any[]>(
      `SELECT DISTINCT salaryMonth, monthKey FROM salaryslip ORDER BY monthKey DESC`,
      [],
      30
    );
    const availableMonths = (distinctMonthRows || []).map((r) => r.salaryMonth || r.monthKey);

    // Compute Summary KPIs
    const totalDisbursed = slips.reduce((sum, s) => sum + (s.netSalary || 0), 0);
    const totalGross = slips.reduce((sum, s) => sum + (s.grossSalary || 0), 0);
    const totalDeductions = slips.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);
    const paidCount = slips.filter((s) => s.paymentStatus === "PAID").length;
    const pendingCount = slips.filter((s) => s.paymentStatus !== "PAID").length;

    const summaryPayload = {
      totalDisbursed,
      totalGross,
      totalDeductions,
      paidCount,
      pendingCount,
      totalSlips: slips.length,
    };

    return NextResponse.json({
      success: true,
      total: slips.length,
      data: slips,
      slips: slips,
      summary: summaryPayload,
      metrics: summaryPayload,
      availableMonths: availableMonths.length > 0 ? availableMonths : ["August 2026", "July 2026", "June 2026"],
    });
  } catch (error: any) {
    console.error("API error fetching salary slips:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve salary slips." },
      { status: 500 }
    );
  }
}

// POST: Generate / Record a Salary Slip
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

    if (!authResult.user || !adminRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin authorization required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      employeeId,
      salaryMonth,
      basicSalary,
      hra,
      allowances,
      bonus,
      overtime,
      pfDeduction,
      taxDeduction,
      otherDeductions,
      paymentMethod,
      notes,
    } = body;

    if (!employeeId || !salaryMonth) {
      return NextResponse.json(
        { success: false, error: "Employee ID and Salary Month are required." },
        { status: 400 }
      );
    }

    const uRows = await queryDb<any[]>(
      `SELECT id, employeeId, name FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
      [employeeId, employeeId]
    );

    if (!uRows || uRows.length === 0) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    const user = uRows[0];
    const bSalary = parseFloat(basicSalary) || 0;
    const h = parseFloat(hra) || 0;
    const allow = parseFloat(allowances) || 0;
    const bon = parseFloat(bonus) || 0;
    const ot = parseFloat(overtime) || 0;
    const gross = bSalary + h + allow + bon + ot;

    const pf = parseFloat(pfDeduction) || 0;
    const tax = parseFloat(taxDeduction) || 0;
    const other = parseFloat(otherDeductions) || 0;
    const totalDed = pf + tax + other;
    const net = Math.max(0, gross - totalDed);

    const monthKey = salaryMonth.replace(/\s+/g, "-").toLowerCase();
    const slipId = `SLIP-${user.employeeId}-${monthKey}-${Date.now()}`;
    const txnRef = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await queryDb(
      `INSERT INTO salaryslip (
        id, userId, employeeId, employeeName, salaryMonth, monthKey,
        basicSalary, hra, allowances, bonus, overtime, grossSalary,
        pfDeduction, taxDeduction, otherDeductions, totalDeductions, netSalary,
        paymentDate, paymentStatus, paymentMethod, transactionReference, notes,
        generatedAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        NOW(), 'PAID', ?, ?, ?,
        NOW(), NOW()
      )`,
      [
        slipId,
        user.id,
        user.employeeId,
        user.name,
        salaryMonth,
        monthKey,
        bSalary,
        h,
        allow,
        bon,
        ot,
        gross,
        pf,
        tax,
        other,
        totalDed,
        net,
        paymentMethod || "Direct Bank Transfer / NEFT",
        txnRef,
        notes || `Generated salary slip for ${salaryMonth}`,
      ]
    );

    clearQueryCache("salaryslip");

    return NextResponse.json(
      {
        success: true,
        message: `✓ Salary slip for ${salaryMonth} generated successfully!`,
        slipId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API error creating salary slip:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate salary slip." },
      { status: 500 }
    );
  }
}
