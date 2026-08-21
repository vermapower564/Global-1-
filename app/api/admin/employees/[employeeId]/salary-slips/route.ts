import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> | { employeeId: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    const resolvedParams = await Promise.resolve(context?.params);
    const cleanId = decodeURIComponent(resolvedParams?.employeeId || "").trim();

    // 1. Find employee in TiDB Cloud
    const userRows = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.role, u.salary, u.paymentScheduleDay, d.name AS department_name
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE u.employeeId = ? OR u.id = ? OR LOWER(u.email) = LOWER(?)
       LIMIT 1`,
      [cleanId, cleanId, cleanId]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found." },
        { status: 404 }
      );
    }

    const user = userRows[0];

    // Authorization check: Owner or Privileged roles (HR/Finance/Super Admin) only
    const privilegedRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"];
    const isOwner =
      authResult.user &&
      (authResult.user.id === user.id ||
        authResult.user.id === user.employeeId ||
        authResult.user.email.toLowerCase() === user.email.toLowerCase());
    const isPrivileged = authResult.user && privilegedRoles.includes(authResult.user.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to access another employee's confidential salary slips." },
        { status: 403 }
      );
    }

    // 2. Fetch real existing salary slips from TiDB
    let sql = `SELECT * FROM salaryslip WHERE (userId = ? OR employeeId = ?)`;
    const params: any[] = [user.id, user.employeeId];

    // Non-privileged employee can only view PUBLISHED or PAID salary slips (DRAFT hidden)
    if (!isPrivileged) {
      sql += ` AND paymentStatus IN ('PUBLISHED', 'PAID')`;
    }

    sql += ` ORDER BY monthKey DESC, generatedAt DESC`;

    const slips = await queryDb<any[]>(sql, params);

    const totalDisbursed = (slips || []).reduce((sum, s) => sum + (s.netSalary || 0), 0);
    const totalGross = (slips || []).reduce((sum, s) => sum + (s.grossSalary || 0), 0);
    const totalDeductions = (slips || []).reduce((sum, s) => sum + (s.totalDeductions || 0), 0);
    const paidCount = (slips || []).filter((s) => s.paymentStatus === "PAID").length;
    const pendingCount = (slips || []).filter((s) => s.paymentStatus !== "PAID").length;

    const summary = {
      totalDisbursed,
      totalGross,
      totalDeductions,
      paidCount,
      pendingCount,
      totalSlips: (slips || []).length,
    };

    return NextResponse.json({
      success: true,
      total: (slips || []).length,
      data: slips || [],
      slips: slips || [],
      employee: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department_name,
        salary: user.salary,
        paymentScheduleDay: user.paymentScheduleDay,
      },
      summary,
      metrics: summary,
    });
  } catch (error: any) {
    console.error("Fetch employee salary slips error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load employee salary records." },
      { status: 500 }
    );
  }
}
