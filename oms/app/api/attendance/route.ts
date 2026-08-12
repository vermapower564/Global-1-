import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Fetch all attendance records from XAMPP MySQL database via Prisma
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const records = await prisma.attendance.findMany({
      include: {
        user: {
          select: {
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

// POST: Handles Website Form Click "Save" -> Prisma -> XAMPP MySQL (attendance table)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, employeeName, date, checkInTime, checkOutTime, status = "PRESENT" } = body;

    if (!employeeName && !userId) {
      return NextResponse.json(
        { success: false, error: "Employee Name or User ID is required to log attendance." },
        { status: 400 }
      );
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const checkIn = checkInTime ? new Date(`₹{date || new Date().toISOString().split("T")[0]}T₹{checkInTime}`) : new Date();
    const checkOut = checkOutTime ? new Date(`₹{date || new Date().toISOString().split("T")[0]}T₹{checkOutTime}`) : null;

    let hoursWorked = 8.5;
    if (checkIn && checkOut) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      hoursWorked = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
    }

    const { prisma } = await import("@/lib/prisma");

    // 1. Ensure user exists in MySQL 'user' table for Foreign Key
    let user = userId 
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          employeeId: `EMP-₹{Math.floor(1000 + Math.random() * 9000)}`,
          name: employeeName || "Aditya Raj",
          email: `₹{(employeeName || "user").toLowerCase().replace(/\s+/g, ".")}@oms.com`,
          password: "hashed_secure_password_123",
          role: "DEVELOPER",
          joiningDate: new Date(),
        },
      });
    }

    // 2. Insert record directly into XAMPP MySQL 'attendance' table
    const createdRecord = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: attendanceDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        hoursWorked,
        status: status.toUpperCase(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "✓ Attendance record saved directly to XAMPP MySQL (attendance table) via Prisma!",
        data: createdRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Attendance POST Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save attendance record to MySQL database" },
      { status: 500 }
    );
  }
}
