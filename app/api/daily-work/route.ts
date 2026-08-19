import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, queryDbCached, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

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
    const filterPeriod = searchParams.get("period"); // 'today' | 'yesterday' | 'daywise' | 'month' | 'year'
    const filterDate = searchParams.get("date");
    const filterMonth = searchParams.get("month");
    const filterYear = searchParams.get("year");
    const search = searchParams.get("search") || "";

    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    let sql = `
      SELECT 
        w.*,
        u.id AS user_id, u.employeeId AS user_employeeId, u.name AS user_name, u.email AS user_email, u.role AS user_role,
        d.name AS department_name
      FROM dailyworkupdate w
      LEFT JOIN user u ON w.userId = u.id
      LEFT JOIN department d ON u.departmentId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Worker role visibility scoping
    if (!isAdmin) {
      sql += ` AND w.userId = ?`;
      params.push(authUser.id);
    } else {
      if (filterUserId) {
        sql += ` AND w.userId = ?`;
        params.push(filterUserId);
      }
      if (filterEmployeeId && filterEmployeeId !== "ALL") {
        sql += ` AND (u.employeeId = ? OR u.id = ?)`;
        params.push(filterEmployeeId, filterEmployeeId);
      }
    }

    // Time Slide / Period Filtering
    if (filterPeriod === "today") {
      sql += ` AND DATE(w.date) = CURDATE()`;
    } else if (filterPeriod === "yesterday") {
      sql += ` AND DATE(w.date) = SUBDATE(CURDATE(), 1)`;
    } else if (filterPeriod === "daywise" && filterDate) {
      sql += ` AND DATE(w.date) = DATE(?)`;
      params.push(filterDate);
    } else if (filterPeriod === "month") {
      const targetMonth = filterMonth || new Date().toISOString().slice(0, 7);
      sql += ` AND DATE_FORMAT(w.date, '%Y-%m') = ?`;
      params.push(targetMonth);
    } else if (filterPeriod === "year") {
      const targetYear = filterYear || new Date().getFullYear().toString();
      sql += ` AND YEAR(w.date) = ?`;
      params.push(targetYear);
    } else {
      if (filterDate) {
        sql += ` AND DATE(w.date) = DATE(?)`;
        params.push(filterDate);
      } else if (filterMonth) {
        sql += ` AND DATE_FORMAT(w.date, '%Y-%m') = ?`;
        params.push(filterMonth);
      } else if (filterYear) {
        sql += ` AND YEAR(w.date) = ?`;
        params.push(filterYear);
      }
    }

    if (search.trim()) {
      sql += ` AND (u.name LIKE ? OR u.employeeId LIKE ? OR w.projectName LIKE ? OR w.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY w.date DESC, w.submittedAt DESC`;

    const rawRows = await queryDbCached<any[]>(sql, params, 5);

    const updates = (rawRows || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      date: r.date,
      projectName: r.projectName,
      clientName: r.clientName,
      startTime: r.startTime,
      endTime: r.endTime,
      hoursWorked: r.hoursWorked,
      priority: r.priority,
      description: r.description,
      achievements: r.achievements,
      blockers: r.blockers,
      tomorrowPlan: r.tomorrowPlan,
      gitCommits: r.gitCommits,
      driveLinks: r.driveLinks,
      screenshots: r.screenshots,
      status: r.status,
      rating: r.rating,
      managerRemarks: r.managerRemarks,
      submittedAt: r.submittedAt,
      user: {
        id: r.user_id,
        employeeId: r.user_employeeId,
        name: r.user_name,
        email: r.user_email,
        role: r.user_role,
        department: r.department_name ? { name: r.department_name } : null,
      },
    }));

    return NextResponse.json({
      success: true,
      total: updates.length,
      data: updates,
    });
  } catch (error: any) {
    console.error("Daily work fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch work updates." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      projectName,
      clientName,
      startTime,
      endTime,
      hoursWorked,
      priority,
      description,
      achievements,
      blockers,
      tomorrowPlan,
      gitCommits,
      driveLinks,
      screenshots,
    } = body;

    if (!description && !projectName) {
      return NextResponse.json(
        { success: false, error: "Project name and work description are required." },
        { status: 400 }
      );
    }

    const updateId = `DWU-${authResult.user.id}-${Date.now()}`;
    const parsedHours = parseFloat(hoursWorked) || 8.0;

    await queryDb(
      `INSERT INTO dailyworkupdate (
        id, userId, date, hoursWorked, description, achievements, blockers, tomorrowPlan,
        status, priority, projectName, clientName, startTime, endTime, gitCommits, driveLinks, screenshots, submittedAt
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        updateId,
        authResult.user.id,
        parsedHours,
        description || "Daily Task Work Log",
        achievements || null,
        blockers || null,
        tomorrowPlan || null,
        priority === "HIGH" ? "HIGH" : priority === "LOW" ? "LOW" : "MEDIUM",
        projectName || "OMS Operations",
        clientName || "Internal Enterprise",
        startTime || "09:00 AM",
        endTime || "06:00 PM",
        gitCommits || null,
        driveLinks || null,
        screenshots || null,
      ]
    );

    clearQueryCache("dailyworkupdate");

    await logAuditEvent(
      authResult.user.id,
      "WORK_UPDATE_SUBMITTED",
      `Submitted daily work report for project: ${projectName || "General"}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "✓ Daily Work EOD update saved to TiDB Cloud!",
        id: updateId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Submit work update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit work update." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = ADMIN_ROLES.includes(authResult.user.role);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Only managers can evaluate work updates." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, status, rating, managerRemarks } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Report ID and Status are required." }, { status: 400 });
    }

    await queryDb(
      `UPDATE dailyworkupdate SET status = ?, rating = ?, managerRemarks = ? WHERE id = ?`,
      [status.toUpperCase(), rating || 5, managerRemarks || "Approved by Manager", id]
    );

    clearQueryCache("dailyworkupdate");

    return NextResponse.json({
      success: true,
      message: `EOD report ${id} evaluated by Manager.`,
    });
  } catch (error: any) {
    console.error("Evaluate work update error:", error);
    return NextResponse.json({ success: false, error: "Failed to evaluate work update." }, { status: 500 });
  }
}
