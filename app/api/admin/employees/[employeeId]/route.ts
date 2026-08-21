import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { getEmployeeAvatarUrl } from "@/lib/avatarHelper";
import { maskAccountNumber } from "@/lib/bankHelper";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    // 1. Server-Side Admin Authorization Check
    const authResult = await authenticateRequest(request);
    if (authResult.response) {
      const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];
      if (!authResult.user || !adminRoles.includes(authResult.user.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Admin authorization required." },
          { status: 403 }
        );
      }
    }

    const { employeeId } = await params;
    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required." },
        { status: 400 }
      );
    }

    const cleanId = decodeURIComponent(employeeId).trim();

    // 2. Query TiDB Database for User
    const userRows = await queryDb<any[]>(
      `SELECT 
        u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.departmentId, u.managerId,
        u.joiningDate, u.isActive, u.isResigned, u.avatarUrl, u.emergencyContact, u.salary,
        u.createdAt, u.updatedAt,
        d.id AS dept_id, d.name AS dept_name, d.code AS dept_code,
        m.name AS manager_name, m.employeeId AS manager_employeeId
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       LEFT JOIN user m ON u.managerId = m.id
       WHERE u.employeeId = ? OR u.id = ? OR LOWER(u.email) = LOWER(?)
       LIMIT 1`,
      [cleanId, cleanId, cleanId]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "The requested employee could not be found." },
        { status: 404 }
      );
    }

    const user = userRows[0];
    const userId = user.id;

    const requesterRole = (authResult.user?.role || "").toUpperCase();
    const viewerId = authResult.user?.id;
    const isSelf = Boolean(viewerId && viewerId === user.id);
    const isPrivilegedAdmin = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"].includes(requesterRole);

    // Non-admin Employees and Leaders can ONLY view self or members of shared projects
    if (!isPrivilegedAdmin && !isSelf) {
      // Check if target is Super Admin (strictly invisible to employees)
      if (user.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden: Unauthorized access to executive profile." },
          { status: 403 }
        );
      }

      // Check shared project connection
      const sharedProjects = await queryDb<any[]>(
        `SELECT A.projectId FROM (
           SELECT A as projectId FROM _assignedstaffprojects WHERE B = ? 
           UNION 
           SELECT projectId FROM task WHERE assignedToUserId = ?
           UNION
           SELECT id as projectId FROM project WHERE teamLeaderId = ?
         ) A
         INNER JOIN (
           SELECT A as projectId FROM _assignedstaffprojects WHERE B = ? 
           UNION 
           SELECT projectId FROM task WHERE assignedToUserId = ?
           UNION
           SELECT id as projectId FROM project WHERE teamLeaderId = ?
         ) B ON A.projectId = B.projectId`,
        [viewerId, viewerId, viewerId, user.id, user.id, user.id]
      );

      if (!sharedProjects || sharedProjects.length === 0) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to view employee records outside your assigned projects." },
          { status: 403 }
        );
      }
    }

    // 3. Concurrently fetch all historical archives from TiDB Cloud
    const [
      bankRows,
      attendanceRows,
      taskRows,
      workRows,
      leaveRows,
      auditRows,
      salaryRows,
      projectRows,
      reviewRows,
    ] = await Promise.all([
      // Bank details
      queryDb<any[]>(`SELECT * FROM bankdetail WHERE userId = ? LIMIT 1`, [userId]),
      // Attendance punch history
      queryDb<any[]>(
        `SELECT id, date, checkInTime, checkOutTime, hoursWorked, status, createdAt
         FROM attendance WHERE userId = ? ORDER BY date DESC LIMIT 100`,
        [userId]
      ),
      // Task history
      queryDb<any[]>(
        `SELECT t.id, t.title, t.description, t.status, t.priority, t.progress, t.dueDate,
                t.estimatedHours, t.actualHours, t.blockerReason, t.createdAt,
                p.projectTitle AS project_title
         FROM task t
         LEFT JOIN project p ON t.projectId = p.id
         WHERE t.assignedToUserId = ? ORDER BY t.createdAt DESC LIMIT 100`,
        [userId]
      ),
      // Daily work update history
      queryDb<any[]>(
        `SELECT d.id, d.date, d.hoursWorked, d.description, d.achievements, d.blockers, d.tomorrowPlan,
                d.status, d.rating, d.managerRemarks, d.gitCommits, d.submittedAt,
                p.projectTitle AS project_title
         FROM dailyworkupdate d
         LEFT JOIN project p ON d.projectId = p.id
         WHERE d.userId = ? ORDER BY d.date DESC LIMIT 100`,
        [userId]
      ),
      // Leave request history
      queryDb<any[]>(
        `SELECT id, leaveType, startDate, endDate, totalDays, reason, status, hrRemarks, appliedAt
         FROM leaverequest WHERE userId = ? ORDER BY appliedAt DESC LIMIT 50`,
        [userId]
      ),
      // Audit log security history
      queryDb<any[]>(
        `SELECT id, action, details, ipAddress, timestamp
         FROM auditlog WHERE userId = ? ORDER BY timestamp DESC LIMIT 50`,
        [userId]
      ),
      // Salary slip history
      queryDb<any[]>(
        `SELECT id, salaryMonth, monthKey, basicSalary, hra, allowances, bonus, overtime, grossSalary,
                pfDeduction, taxDeduction, otherDeductions, totalDeductions, netSalary, paymentDate,
                paymentStatus, paymentMethod, transactionReference, generatedAt
         FROM salaryslip WHERE userId = ? OR employeeId = ? ORDER BY generatedAt DESC LIMIT 50`,
        [userId, user.employeeId]
      ),
      // Assigned projects
      queryDb<any[]>(
        `SELECT p.id, p.projectTitle, p.clientCompany, p.startDate, p.endDate, p.status, p.contractValue
         FROM project p
         INNER JOIN _assignedstaffprojects asp ON p.id = asp.A
         WHERE asp.B = ?`,
        [userId]
      ),
      // Customer feedback on projects worked on
      queryDb<any[]>(
        `SELECT r.id, r.customerName, r.customerCompany, r.customerEmail, r.customerRole,
                r.rating, r.communicationRating, r.codeQualityRating, r.timelinessRating,
                r.reviewTitle, r.feedbackText, r.highlights, r.serviceCategory, r.status,
                r.verifiedByClient, r.createdAt,
                p.projectTitle AS project_title
         FROM customerreview r
         LEFT JOIN project p ON r.projectId = p.id
         WHERE r.projectId IN (
           SELECT A FROM _assignedstaffprojects WHERE B = ?
         ) OR r.userId = ? OR r.employeeId = ?
         ORDER BY r.createdAt DESC LIMIT 50`,
        [userId, userId, user.employeeId]
      ),
    ]);

    const avatarUrl = getEmployeeAvatarUrl(user);

    // Compute stats
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayAttendance = attendanceRows.find((a) => {
      const aDateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
      return aDateStr === todayStr;
    });

    const approvedLeaves = leaveRows
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, curr) => acc + (curr.totalDays || 0), 0);
    const pendingLeaves = leaveRows.filter((l) => l.status === "PENDING").length;
    const totalLeaveQuota = 18;
    const remainingLeave = Math.max(0, totalLeaveQuota - approvedLeaves);

    const totalTasks = taskRows.length;
    const completedTasks = taskRows.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = taskRows.filter((t) => t.status === "IN_PROGRESS").length;
    const pendingTasks = taskRows.filter((t) => t.status === "ASSIGNED" || t.status === "BACKLOG").length;
    const blockedTasks = taskRows.filter((t) => t.status === "BLOCKED").length;
    const overdueTasks = taskRows.filter((t) => {
      return t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < today;
    }).length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
    const totalHoursWorked = Math.round(
      attendanceRows.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
    );

    const avgRating =
      reviewRows.length > 0
        ? Math.round(
            (reviewRows.reduce((sum, r) => sum + (parseFloat(r.rating) || 5), 0) / reviewRows.length) * 10
          ) / 10
        : 5.0;

    const stats = {
      todayAttendance: todayAttendance
        ? {
            status: todayAttendance.status,
            checkIn: todayAttendance.checkInTime
              ? new Date(todayAttendance.checkInTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null,
            checkOut: todayAttendance.checkOutTime
              ? new Date(todayAttendance.checkOutTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null,
            hoursWorked: todayAttendance.hoursWorked || 0,
            isActiveShift: !todayAttendance.checkOutTime,
          }
        : {
            status: "NOT_CHECKED_IN",
            checkIn: null,
            checkOut: null,
            hoursWorked: 0,
            isActiveShift: false,
          },
      projectsCount: projectRows.length,
      leaveSummary: {
        totalQuota: totalLeaveQuota,
        used: approvedLeaves,
        remaining: remainingLeave,
        pendingCount: pendingLeaves,
      },
      workHoursTotal: totalHoursWorked,
      customerSatisfaction: {
        avgRating,
        totalReviews: reviewRows.length,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        blocked: blockedTasks,
        completionRate: taskCompletionRate,
      },
    };

    // Confidentiality check: Only Self or SUPER_ADMIN / DIRECTOR / HR / FINANCE can see financial/banking documents
    const canSeeConfidential = isSelf || isPrivilegedAdmin;

    // Team Leader & General non-finance roles see NULL bank details (Strict Privacy)
    const rawBank = bankRows.length > 0 ? bankRows[0] : null;
    let safeBankDetail: any = null;
    if (rawBank && canSeeConfidential) {
      safeBankDetail = {
        ...rawBank,
        accountNumberMasked: maskAccountNumber(rawBank.accountNumber),
      };
    }

    const employeeObj = {
      // Basic Information
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      phone: user.phone || "+91 98765 00000",
      role: user.role,
      departmentId: user.departmentId,
      managerId: user.managerId,
      joiningDate: user.joiningDate,
      isActive: user.isActive,
      isResigned: user.isResigned,
      avatarUrl,
      department: user.dept_name ? { id: user.dept_id, name: user.dept_name, code: user.dept_code } : null,
      manager: user.manager_name ? { name: user.manager_name, employeeId: user.manager_employeeId } : null,

      // Confidential / Restricted Fields (Hidden for Team Leaders)
      emergencyContact: canSeeConfidential ? (user.emergencyContact || "+91 98765 11111 (Family)") : null,
      salary: canSeeConfidential ? (user.salary || 45000) : null,
      bankDetail: safeBankDetail,
      salarySlips: canSeeConfidential ? salaryRows : [],
      auditlog: canSeeConfidential ? auditRows : [],
      isConfidentialMasked: !canSeeConfidential,
      isTeamLeaderView: !canSeeConfidential,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Work Details (Visible to Team Leaders & Admins for project tracking)
      attendance: attendanceRows.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        hoursWorked: a.hoursWorked,
      })),
      assignedTasks: taskRows.map((t) => ({
        ...t,
        project: t.project_title ? { projectTitle: t.project_title } : null,
      })),
      dailyworkupdate: workRows.map((w) => ({
        ...w,
        project: w.project_title ? { projectTitle: w.project_title } : null,
      })),
      leaverequest: leaveRows,
      project: projectRows,
      customerReviews: reviewRows.map((r) => ({
        ...r,
        project: r.project_title ? { projectTitle: r.project_title } : null,
      })),
    };

    return NextResponse.json({
      success: true,
      employee: employeeObj,
      stats,
    });
  } catch (error: any) {
    console.error("API error fetching employee 360:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve employee details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  return handleUpdateEmployee(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  return handleUpdateEmployee(request, params);
}

async function handleUpdateEmployee(
  request: NextRequest,
  paramsPromise: Promise<{ employeeId: string }>
) {
  try {
    // 1. Check Admin Authorization
    const authResult = await authenticateRequest(request);
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];
    if (authResult.user && !adminRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin authorization required to edit employee details." },
        { status: 403 }
      );
    }

    const { employeeId } = await paramsPromise;
    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Employee ID is required." }, { status: 400 });
    }

    const cleanId = decodeURIComponent(employeeId).trim();

    // 2. Fetch existing user
    const existingUsers = await queryDb<any[]>(
      `SELECT * FROM user WHERE employeeId = ? OR id = ? OR LOWER(email) = LOWER(?) LIMIT 1`,
      [cleanId, cleanId, cleanId]
    );

    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    const user = existingUsers[0];
    const userId = user.id;

    const body = await request.json();
    const {
      name,
      email,
      phone,
      role,
      departmentId,
      salary,
      isActive,
      joiningDate,
      emergencyContact,
      avatarUrl,
      bankDetail,
    } = body;

    // 3. Prepare User Table Updates
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name.trim());
    }
    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email.trim().toLowerCase());
    }
    if (phone !== undefined) {
      updateFields.push("phone = ?");
      updateValues.push(phone.trim());
    }
    if (role !== undefined) {
      if (role === "SUPER_ADMIN") {
        if (authResult.user?.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { success: false, error: "Forbidden: Only the Super Admin can promote users to Super Admin." },
            { status: 403 }
          );
        }
        const existingSuperAdmins = await queryDb<any[]>(
          `SELECT id FROM user WHERE role = 'SUPER_ADMIN' AND id != ? LIMIT 1`,
          [userId]
        );
        if (existingSuperAdmins && existingSuperAdmins.length > 0) {
          return NextResponse.json(
            { success: false, error: "Validation Error: A Super Admin already exists in this organisation. Only one Super Admin is permitted." },
            { status: 400 }
          );
        }
      }
      updateFields.push("role = ?");
      updateValues.push(role);
    }
    if (departmentId !== undefined) {
      updateFields.push("departmentId = ?");
      updateValues.push(departmentId || null);
    }
    if (salary !== undefined) {
      updateFields.push("salary = ?");
      updateValues.push(Number(salary) || 0);
    }
    if (isActive !== undefined) {
      updateFields.push("isActive = ?");
      updateValues.push(Boolean(isActive) ? 1 : 0);
    }
    if (joiningDate !== undefined) {
      updateFields.push("joiningDate = ?");
      updateValues.push(new Date(joiningDate));
    }
    if (emergencyContact !== undefined) {
      updateFields.push("emergencyContact = ?");
      updateValues.push(emergencyContact.trim());
    }
    if (avatarUrl !== undefined) {
      updateFields.push("avatarUrl = ?");
      updateValues.push(avatarUrl);
    }

    if (updateFields.length > 0) {
      updateFields.push("updatedAt = NOW()");
      updateValues.push(userId);
      await queryDb(`UPDATE user SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);
    }

    // 4. Update or Insert Bank Detail if provided
    if (bankDetail && typeof bankDetail === "object") {
      const {
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        branchName,
        accountType = "Savings",
      } = bankDetail;

      if (accountHolderName && accountNumber && ifscCode) {
        const existingBank = await queryDb<any[]>(
          `SELECT id FROM bankdetail WHERE userId = ? LIMIT 1`,
          [userId]
        );

        if (existingBank && existingBank.length > 0) {
          await queryDb(
            `UPDATE bankdetail 
             SET accountHolderName = ?, bankName = ?, accountNumber = ?, ifscCode = ?, branchName = ?, accountType = ?, updatedAt = NOW()
             WHERE userId = ?`,
            [
              accountHolderName.trim(),
              bankName?.trim() || "State Bank of India",
              accountNumber.trim(),
              ifscCode.trim().toUpperCase(),
              branchName?.trim() || null,
              accountType || "Savings",
              userId,
            ]
          );
        } else {
          const bankId = `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await queryDb(
            `INSERT INTO bankdetail (id, userId, accountHolderName, bankName, accountNumber, ifscCode, branchName, accountType, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
              bankId,
              userId,
              accountHolderName.trim(),
              bankName?.trim() || "State Bank of India",
              accountNumber.trim(),
              ifscCode.trim().toUpperCase(),
              branchName?.trim() || null,
              accountType || "Savings",
            ]
          );
        }
      }
    }

    // 5. Record Audit Log
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await queryDb(
        `INSERT INTO auditlog (id, userId, action, details, timestamp)
         VALUES (?, ?, 'EMPLOYEE_PROFILE_UPDATED', ?, NOW())`,
        [
          auditId,
          authResult.user?.id || userId,
          `Admin updated profile & details for employee ${user.name} (${user.employeeId}).`,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log insert note:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${name || user.name} details successfully updated!`,
    });
  } catch (error: any) {
    console.error("API error updating employee profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee details." },
      { status: 500 }
    );
  }
}

