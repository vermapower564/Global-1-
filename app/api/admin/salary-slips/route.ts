import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

    if (!authResult.user || !adminRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin authorization required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const month = searchParams.get("month") || "All";
    const status = searchParams.get("status") || "All";

    // 1. Fetch all salary slips with user relations
    let slips = await prisma.salaryslip.findMany({
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            role: true,
            paymentScheduleDay: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ monthKey: "desc" }, { employeeName: "asc" }],
    });

    // 2. If no slips exist across the database, seed for active employees
    if (slips.length === 0) {
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, employeeId: true, name: true, salary: true, paymentScheduleDay: true },
      });

      for (const u of allUsers) {
        const baseMonthly = u.salary > 0 ? Math.round(u.salary / 12) : 35000;
        const basic = Math.round(baseMonthly * 0.6);
        const hra = Math.round(baseMonthly * 0.2);
        const allowances = Math.round(baseMonthly * 0.1);
        const bonus = 2000;
        const overtime = 3000;
        const gross = basic + hra + allowances + bonus + overtime;
        const pf = Math.round(basic * 0.12);
        const tax = 1000;
        const other = 500;
        const totalDed = pf + tax + other;
        const net = gross - totalDed;

        const scheduleDay = u.paymentScheduleDay || 1;
        const months = [
          { name: "August 2026", key: "2026-08", status: "PAID", dayOffset: 0 },
          { name: "July 2026", key: "2026-07", status: "PAID", dayOffset: -1 },
        ];

        for (const m of months) {
          const payDate = new Date(2026, 7 + m.dayOffset, scheduleDay);
          const txnId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

          await prisma.salaryslip.upsert({
            where: {
              userId_monthKey: {
                userId: u.id,
                monthKey: m.key,
              },
            },
            update: {},
            create: {
              userId: u.id,
              employeeId: u.employeeId,
              employeeName: u.name,
              salaryMonth: m.name,
              monthKey: m.key,
              basicSalary: basic,
              hra,
              allowances,
              bonus,
              overtime,
              grossSalary: gross,
              pfDeduction: pf,
              taxDeduction: tax,
              otherDeductions: other,
              totalDeductions: totalDed,
              netSalary: net,
              paymentDate: payDate,
              paymentStatus: m.status,
              paymentMethod: "Bank Transfer",
              transactionReference: txnId,
              notes: "Monthly compensation disbursed via direct bank transfer.",
            },
          });
        }
      }

      slips = await prisma.salaryslip.findMany({
        include: {
          user: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              email: true,
              role: true,
              paymentScheduleDay: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: [{ monthKey: "desc" }, { employeeName: "asc" }],
      });
    }

    // 3. Client-side Filter Logic
    let filtered = slips;

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.employeeName.toLowerCase().includes(search) ||
          s.employeeId.toLowerCase().includes(search) ||
          (s.user?.email && s.user.email.toLowerCase().includes(search)) ||
          (s.user?.department?.name && s.user.department.name.toLowerCase().includes(search))
      );
    }

    if (month !== "All") {
      filtered = filtered.filter((s) => s.salaryMonth === month || s.monthKey === month);
    }

    if (status !== "All") {
      filtered = filtered.filter((s) => s.paymentStatus.toUpperCase() === status.toUpperCase());
    }

    // 4. Compute High-Level Metrics
    const totalOutflow = slips.reduce((sum, s) => sum + (s.paymentStatus === "PAID" ? s.netSalary : 0), 0);
    const paidCount = slips.filter((s) => s.paymentStatus === "PAID").length;
    const scheduledCount = slips.filter((s) => s.paymentStatus === "SCHEDULED").length;
    const pendingCount = slips.filter((s) => s.paymentStatus === "PENDING").length;

    // Available Distinct Months for Filter Dropdown
    const availableMonths = Array.from(new Set(slips.map((s) => s.salaryMonth)));

    return NextResponse.json({
      success: true,
      slips: filtered,
      totalCount: slips.length,
      metrics: {
        totalOutflow,
        paidCount,
        scheduledCount,
        pendingCount,
      },
      availableMonths,
    });
  } catch (error: any) {
    console.error("Failed to fetch all salary slips:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load master salary slips." },
      { status: 500 }
    );
  }
}
