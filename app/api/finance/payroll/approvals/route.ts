import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await queryDb<any[]>(
      `SELECT p.*, u.name as userName, u.role as userRole, u.employeeId as userEmployeeId, d.name as departmentName
       FROM payrollapproval p
       LEFT JOIN user u ON p.userId = u.id
       LEFT JOIN department d ON u.departmentId = d.id
       ORDER BY p.approvedAt DESC`
    );

    const data = rows || [];
    const totalGross = data.reduce((sum: number, p: any) => sum + (Number(p.baseSalary) || 0) + (Number(p.bonus) || 0), 0);
    const totalNet = data.reduce((sum: number, p: any) => sum + (Number(p.netPayable) || 0), 0);

    return NextResponse.json({
      success: true,
      data,
      totalGross,
      totalNet,
    });
  } catch (err: any) {
    console.error("Payroll approvals GET Error:", err);
    return NextResponse.json({ success: false, error: err.message, data: [], totalGross: 0, totalNet: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action, userId, employeeName, baseSalary, bonus, deductions, netPayable, monthYear } = body;

    if (id) {
      await queryDb(
        `UPDATE payrollapproval SET status = ?, approvedAt = NOW() WHERE id = ?`,
        [action || "APPROVED", id]
      );
      return NextResponse.json({
        success: true,
        message: `✓ Monthly Salary status updated to ${action || "APPROVED"}.`,
        data: { id, status: action || "APPROVED" },
      });
    }

    if (userId) {
      const newId = `PAY-${Date.now().toString(36).toUpperCase()}`;
      await queryDb(
        `INSERT INTO payrollapproval (id, userId, employeeName, monthYear, baseSalary, bonus, deductions, netPayable, status, approvedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          newId,
          userId,
          employeeName || "Employee",
          monthYear || "August 2026",
          parseFloat(baseSalary) || 0,
          parseFloat(bonus) || 0,
          parseFloat(deductions) || 0,
          parseFloat(netPayable) || 0,
          action || "APPROVED",
        ]
      );

      return NextResponse.json({
        success: true,
        message: `✓ Payroll approval recorded successfully.`,
        data: { id: newId, status: action || "APPROVED" },
      });
    }

    return NextResponse.json({ success: false, error: "Missing ID or User ID for payroll approval" }, { status: 400 });
  } catch (err: any) {
    console.error("Payroll approvals POST Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
