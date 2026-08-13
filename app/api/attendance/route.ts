import { NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

// GET: Fetch attendance records (Scoped to authenticated user for Employees, Organization-wide for Admins)
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    const authUser = authResult.user;

    const { prisma } = await import("@/lib/prisma");

    const isAdminOrHR = authUser && ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(authUser.role);
    const whereClause = (authUser && !isAdminOrHR) ? { userId: authUser.id } : {};

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            role: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      total: records.length,
      data: records,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      total: 0,
      data: [],
      error: error.message || "Database query fallback",
    });
  }
}

// POST: Employee Check-In (Creates Attendance Record in MySQL)
export async function POST(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response && !authResult.user) {
      // Return authentication error if request is unauthenticated
      return authResult.response;
    }

    const body = await req.json().catch(() => ({}));
    const { prisma } = await import("@/lib/prisma");

    const targetUserId = authResult.user?.id || body.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Authenticated User ID is required for check-in." },
        { status: 400 }
      );
    }

    // Check if user already checked in today without checking out
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingTodayRecord = await prisma.attendance.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingTodayRecord && !existingTodayRecord.checkOutTime) {
      return NextResponse.json(
        {
          success: false,
          error: "⚠️ Check-In Failed: You are already checked in for today's active work session.",
          data: existingTodayRecord,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const createdRecord = await prisma.attendance.create({
      data: {
        userId: targetUserId,
        date: now,
        checkInTime: now,
        checkOutTime: null,
        hoursWorked: 0,
        status: "PRESENT",
      },
    });

    await logAuditEvent(targetUserId, "ATTENDANCE_CHECK_IN", `Check-in recorded at ${now.toLocaleTimeString("en-IN")}`);

    return NextResponse.json(
      {
        success: true,
        message: `✓ Check-In successful! Attendance recorded in MySQL database at ${now.toLocaleTimeString("en-IN")}.`,
        data: createdRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Attendance Check-In Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to record check-in in MySQL database." },
      { status: 500 }
    );
  }
}

// PUT: Employee Check-Out (Calculates Working Hours & Updates MySQL)
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response && !authResult.user) {
      return authResult.response;
    }

    const body = await req.json().catch(() => ({}));
    const { prisma } = await import("@/lib/prisma");

    const targetUserId = authResult.user?.id || body.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Authenticated User ID is required for check-out." },
        { status: 400 }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeRecord = await prisma.attendance.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfDay },
        checkOutTime: null,
      },
      orderBy: { date: "desc" },
    });

    if (!activeRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "⚠️ Check-Out Failed: No active check-in record found for today. Please check in first.",
        },
        { status: 400 }
      );
    }

    const checkOut = new Date();
    const diffMs = checkOut.getTime() - activeRecord.checkInTime.getTime();
    const hoursWorked = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);

    const updatedRecord = await prisma.attendance.update({
      where: { id: activeRecord.id },
      data: {
        checkOutTime: checkOut,
        hoursWorked,
      },
    });

    await logAuditEvent(
      targetUserId,
      "ATTENDANCE_CHECK_OUT",
      `Check-out recorded at ${checkOut.toLocaleTimeString("en-IN")}. Duration: ${hoursWorked} hrs.`
    );

    return NextResponse.json({
      success: true,
      message: `✓ Check-Out successful! Shift duration calculated: ${hoursWorked} hrs. Record updated in MySQL.`,
      data: updatedRecord,
    });
  } catch (err: any) {
    console.error("Attendance Check-Out Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to record check-out in MySQL database." },
      { status: 500 }
    );
  }
}
