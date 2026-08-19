import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payrolls = await prisma.payrollapproval.findMany({
      include: {
        user: {
          select: {
            name: true,
            employeeId: true,
            email: true,
            role: true,
            bankDetail: true,
          },
        },
      },
      orderBy: { approvedAt: "desc" },
    });
    return NextResponse.json({ success: true, count: payrolls.length, data: payrolls });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payroll approvals" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, employeeName, monthYear, baseSalary, bonus, deductions, bankRefNo } = body;

    const userObj = userId
      ? await prisma.user.findUnique({ where: { id: userId }, include: { bankDetail: true } })
      : await prisma.user.findFirst({ include: { bankDetail: true } });

    if (!userObj) {
      return NextResponse.json(
        { success: false, error: "Valid employee user is required for payroll approval" },
        { status: 400 }
      );
    }

    if (
      !userObj.bankDetail ||
      !userObj.bankDetail.accountNumber ||
      !userObj.bankDetail.ifscCode ||
      !userObj.bankDetail.bankName
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank details incomplete. Please update employee bank information before processing payment.",
        },
        { status: 400 }
      );
    }

    const base = parseFloat(baseSalary) || userObj.salary / 12 || 75000;
    const bon = parseFloat(bonus) || 0;
    const ded = parseFloat(deductions) || 0;
    const net = base + bon - ded;

    const created = await prisma.payrollapproval.create({
      data: {
        userId: userObj.id,
        employeeName: employeeName || userObj.name,
        monthYear: monthYear || "August 2026",
        baseSalary: base,
        bonus: bon,
        deductions: ded,
        netPayable: net,
        status: "APPROVED",
        bankRefNo: bankRefNo || `HDFC-PAY-${Date.now()}`,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve payroll" },
      { status: 500 }
    );
  }
}
