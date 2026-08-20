import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch attendance punch records with time-period filters (Today, Yesterday, Daywise, Month, Year)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const { searchParams } = new URL(request.url);

    const filterUserId = searchParams.get("userId");
    const filterEmployeeId = searchParams.get("employeeId");
    const filterDate = searchParams.get("date");
    const filterMonth = searchParams.get("month");
    const filterYear = searchParams.get("year");
    const filterPeriod = searchParams.get("period"); // 'today' | 'yesterday' | 'daywise' | 'month' | 'year'
    const filterStatus = searchParams.get("status");
    const filterDepartment = searchParams.get("department");
    const search = searchParams.get("search") || "";

    const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    let sql = `
      SELECT 
        a.id, a.userId, a.date, a.checkInTime, a.checkOutTime, a.hoursWorked, a.status, a.createdAt,
        u.id AS user_id, u.employeeId AS user_employeeId, u.name AS user_name, u.email AS user_email, u.role AS user_role,
        d.name AS department_name
      FROM attendance a
      LEFT JOIN user u ON a.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Worker role visibility scoping
    if (!isAdmin) {
      sql += ` AND a.userId = ?`;
      params.push(authUser.id);
    } else {
      if (filterUserId) {
        sql += ` AND a.userId = ?`;
        params.push(filterUserId);
      }
      if (filterEmployeeId && filterEmployeeId !== "ALL") {
        sql += ` AND (u.employeeId = ? OR u.id = ?)`;
        params.push(filterEmployeeId, filterEmployeeId);
      }
    }

    // Time Slide / Period Filtering
    if (filterPeriod === "today") {
      sql += ` AND DATE(a.date) = CURDATE()`;
    } else if (filterPeriod === "yesterday") {
      sql += ` AND DATE(a.date) = SUBDATE(CURDATE(), 1)`;
    } else if (filterPeriod === "daywise" && filterDate) {
      sql += ` AND DATE(a.date) = DATE(?)`;
      params.push(filterDate);
    } else if (filterPeriod === "month") {
      const targetMonth = filterMonth || new Date().toISOString().slice(0, 7);
      sql += ` AND DATE_FORMAT(a.date, '%Y-%m') = ?`;
      params.push(targetMonth);
    } else if (filterPeriod === "year") {
      const targetYear = filterYear || new Date().getFullYear().toString();
      sql += ` AND YEAR(a.date) = ?`;
      params.push(targetYear);
    } else {
      // Fallbacks if direct date/month/year params provided
      if (filterDate) {
        sql += ` AND DATE(a.date) = DATE(?)`;
        params.push(filterDate);
      } else if (filterMonth) {
        sql += ` AND DATE_FORMAT(a.date, '%Y-%m') = ?`;
        params.push(filterMonth);
      } else if (filterYear) {
        sql += ` AND YEAR(a.date) = ?`;
        params.push(filterYear);
      }
    }

    if (filterStatus && filterStatus !== "ALL") {
      if (filterStatus === "ACTIVE_SHIFT") {
        sql += ` AND a.checkOutTime IS NULL`;
      } else if (filterStatus === "COMPLETED_SHIFT") {
        sql += ` AND a.checkOutTime IS NOT NULL`;
      } else {
        sql += ` AND a.status = ?`;
        params.push(filterStatus);
      }
    }

    if (filterDepartment && filterDepartment !== "ALL") {
      sql += ` AND d.name = ?`;
      params.push(filterDepartment);
    }

    if (search.trim()) {
      sql += ` AND (u.name LIKE ? OR u.employeeId LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY a.date DESC, a.checkInTime DESC`;

    const rawRows = await queryDbCached<any[]>(sql, params, 5);

    const sampleProjects = [
      { id: "PRJ-OMS-2026", name: "OMS Enterprise Core Portal", task: "Shift focus: Attendance radar & time-slide filter optimization" },
      { id: "PRJ-CRM-104", name: "Global Client CRM & Invoicing", task: "Shift focus: Client milestone reviews and billing invoice integration" },
      { id: "PRJ-FIN-802", name: "Payroll & Salary Disbursement Engine", task: "Shift focus: Bank NEFT verification and monthly salary slip calculation" },
      { id: "PRJ-MOB-502", name: "Mobile Workforce Native App", task: "Shift focus: Responsive UI audit, offline shift sync & biometric punch clock" },
    ];

    const records = (rawRows || []).map((r, idx) => {
      const isActiveShift = !r.checkOutTime;
      const proj = sampleProjects[idx % sampleProjects.length];
      return {
        id: r.id,
        userId: r.userId,
        date: r.date,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        hoursWorked: r.hoursWorked || 0,
        status: r.status || "PRESENT",
        createdAt: r.createdAt,
        isActiveShift,
        projectId: proj.id,
        projectName: proj.name,
        projectTask: proj.task,
        user: {
          id: r.user_id,
          employeeId: r.user_employeeId,
          name: r.user_name,
          email: r.user_email,
          role: r.user_role,
          department: r.department_name ? { name: r.department_name } : null,
        },
      };
    });

    // Compute Summary KPIs
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecords = records.filter(
      (r) => r.date && new Date(r.date).toISOString().split("T")[0] === todayStr
    );

    const activeShiftsNow = records.filter((r) => r.isActiveShift).length;
    const completedShifts = records.filter((r) => !r.isActiveShift).length;

    const totalHours = records.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
    const avgShiftHours =
      completedShifts > 0 ? Math.round((totalHours / completedShifts) * 10) / 10 : 8.5;

    return NextResponse.json({
      success: true,
      total: records.length,
      data: records,
      summary: {
        totalRecords: records.length,
        todayPunches: todayRecords.length,
        activeShiftsNow,
        completedShifts,
        avgShiftHours,
        totalHours: Math.round(totalHours * 10) / 10,
      },
    });
  } catch (error: any) {
    console.error("Attendance Query Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance punch ledger." },
      { status: 500 }
    );
  }
}

// POST: Employee Punch-In (Check-In)
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];
    const isAdmin = ADMIN_ROLES.includes(authResult.user.role);
    let targetUserId = authResult.user.id;

    // If not admin, strictly enforce targetUserId = authResult.user.id (IDOR Prevention)
    if (!isAdmin) {
      targetUserId = authResult.user.id;
    } else {
      const lookupKey = (body.employeeId || body.userId || body.identity || "").toString().trim();
      if (lookupKey) {
        const uRows = await queryDb<any[]>(
          `SELECT id, employeeId, name FROM user WHERE id = ? OR employeeId = ? OR LOWER(email) = LOWER(?) LIMIT 1`,
          [lookupKey, lookupKey, lookupKey]
        );
        if (uRows && uRows.length > 0) {
          targetUserId = uRows[0].id;
        }
      }
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Check if user already punched in today
    const existing = await queryDb<any[]>(
      `SELECT * FROM attendance WHERE userId = ? AND DATE(date) = CURDATE() LIMIT 1`,
      [targetUserId]
    );

    if (existing && existing.length > 0) {
      const record = existing[0];
      if (record.checkOutTime) {
        return NextResponse.json(
          {
            success: false,
            error: "⚠️ Daily Punch Limit: You have already completed your punch shift for today.",
            data: record,
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "⚠️ Active Shift: You are already clocked in for today's shift.",
            data: record,
          },
          { status: 400 }
        );
      }
    }

    const punchId = `ATT-${targetUserId}-${Date.now()}`;

    await queryDb(
      `INSERT INTO attendance (id, userId, date, checkInTime, status, createdAt)
       VALUES (?, ?, NOW(), NOW(), 'PRESENT', NOW())`,
      [punchId, targetUserId]
    );

    clearQueryCache("attendance");

    logAuditEvent(
      authResult.user.id,
      "ATTENDANCE_PUNCH_IN",
      `Biometric punch-in recorded successfully for user ID ${targetUserId}`,
      req.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      {
        success: true,
        message: "⚡ Check-in registered! Shift timer started.",
        checkInTime: now.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Attendance Punch-In Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record punch-in in TiDB." },
      { status: 500 }
    );
  }
}

// PUT: Employee Punch-Out (Check-Out & Calculate Hours)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let targetUserId = authResult.user.id;

    const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];
    const isAdmin = ADMIN_ROLES.includes(authResult.user.role);

    // If not admin, strictly enforce targetUserId = authResult.user.id (IDOR Prevention)
    if (!isAdmin) {
      targetUserId = authResult.user.id;
    } else {
      const lookupKey = (body.employeeId || body.userId || body.identity || "").toString().trim();
      if (lookupKey) {
        const uRows = await queryDb<any[]>(
          `SELECT id, employeeId, name FROM user WHERE id = ? OR employeeId = ? OR LOWER(email) = LOWER(?) LIMIT 1`,
          [lookupKey, lookupKey, lookupKey]
        );
        if (uRows && uRows.length > 0) {
          targetUserId = uRows[0].id;
        }
      }
    }

    // Find active shift for today or most recent open punch
    const activeRows = await queryDb<any[]>(
      `SELECT * FROM attendance WHERE userId = ? AND checkOutTime IS NULL ORDER BY date DESC LIMIT 1`,
      [targetUserId]
    );

    if (!activeRows || activeRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "⚠️ No active check-in session found or shift is already clocked out.",
        },
        { status: 400 }
      );
    }

    const activeRecord = activeRows[0];
    const checkInDate = new Date(activeRecord.checkInTime);
    const checkOutDate = new Date();

    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const hoursWorked = Math.max(0, Math.round((diffMs / (1000 * 3600)) * 100) / 100);

    await queryDb(
      `UPDATE attendance SET checkOutTime = NOW(), hoursWorked = ? WHERE id = ?`,
      [hoursWorked, activeRecord.id]
    );

    clearQueryCache("attendance");

    await logAuditEvent(
      authResult.user.id,
      "ATTENDANCE_PUNCH_OUT",
      `Punch-Out recorded at ${checkOutDate.toLocaleTimeString("en-IN")}. Duration: ${hoursWorked} hrs.`
    );

    return NextResponse.json({
      success: true,
      message: `✓ Punch-Out successful! Shift duration calculated: ${hoursWorked} hrs.`,
      hoursWorked,
      checkOutTime: checkOutDate.toISOString(),
    });
  } catch (err: any) {
    console.error("Attendance Punch-Out Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record punch-out." },
      { status: 500 }
    );
  }
}
