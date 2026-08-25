import { NextResponse } from "next/server";
import { getStoredEmployees, addStoredEmployee, deleteStoredEmployee } from "@/utils/employeeStore";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";
import { queryDb, queryDbCached } from "@/lib/db";
import { getEmployeeAvatarUrl } from "@/lib/avatarHelper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }
    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const isFullAdmin = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR"].includes(roleUpper);

    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role") || url.searchParams.get("roles");
    const isTaskAssignees = url.searchParams.get("taskAssignees") === "true";

    let targetRoles: string[] = [];
    if (isTaskAssignees) {
      targetRoles = ["PROJECT_MANAGER", "TEAM_LEADER"];
    } else if (roleParam) {
      targetRoles = roleParam
        .split(",")
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);
    }

    const now = new Date();

    // 1. Fetch Users, Departments, Bank Details & Reviews directly from TiDB Cloud
    let usersQuery = `SELECT u.*, d.name AS departmentName, d.code AS departmentCode,
              b.accountHolderName, b.bankName, b.accountNumber, b.ifscCode, b.branchName, b.accountType
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       LEFT JOIN bankdetail b ON u.id = b.userId`;
    const queryParams: any[] = [];

    if (targetRoles.length > 0) {
      usersQuery += ` WHERE u.role IN (${targetRoles.map(() => "?").join(",")})`;
      queryParams.push(...targetRoles);
    }

    usersQuery += ` ORDER BY u.employeeId ASC, u.name ASC`;

    const users: any[] = await queryDb(usersQuery, queryParams);

    // 2. Fetch Tasks and Reviews in parallel (cached)
    const allTasks: any[] = await queryDbCached("SELECT id, title, status, dueDate, assignedToUserId, projectId FROM task", [], 15);
    const allReviews: any[] = await queryDbCached("SELECT * FROM customerreview ORDER BY createdAt DESC", [], 15);

    if (users && users.length > 0) {
      // 3. Compute Project-Level Shared Teammates for non-admins
      let allowedUserIds = new Set<string>();

      if (isFullAdmin) {
        // Full Admin sees all
        allowedUserIds = new Set(users.map((u) => u.id));
      } else if (roleUpper === "PROJECT_MANAGER") {
        // PM sees employees in their projects + self
        allowedUserIds.add(authUser.id);
        const pmProjects: any[] = await queryDb<any[]>(
          `SELECT id FROM project WHERE teamLeaderId = ? OR id IN (SELECT projectId FROM task WHERE assignedToUserId = ?)`,
          [authUser.id, authUser.id]
        );
        const pIds = (pmProjects || []).map((p) => p.id).filter(Boolean);
        if (pIds.length > 0) {
          const placeholders = pIds.map(() => "?").join(",");
          const members: any[] = await queryDb<any[]>(
            `SELECT B as userId FROM _assignedstaffprojects WHERE A IN (${placeholders}) 
             UNION 
             SELECT assignedToUserId as userId FROM task WHERE projectId IN (${placeholders})`,
            [...pIds, ...pIds]
          );
          (members || []).forEach((m) => m.userId && allowedUserIds.add(m.userId));
        }
      } else if (roleUpper === "TEAM_LEADER") {
        // TL sees employees in their led projects + self
        allowedUserIds.add(authUser.id);
        const tlProjects: any[] = await queryDb<any[]>(
          `SELECT id FROM project WHERE teamLeaderId = ?`,
          [authUser.id]
        );
        const pIds = (tlProjects || []).map((p) => p.id).filter(Boolean);
        if (pIds.length > 0) {
          const placeholders = pIds.map(() => "?").join(",");
          const members: any[] = await queryDb<any[]>(
            `SELECT B as userId FROM _assignedstaffprojects WHERE A IN (${placeholders}) 
             UNION 
             SELECT assignedToUserId as userId FROM task WHERE projectId IN (${placeholders})`,
            [...pIds, ...pIds]
          );
          (members || []).forEach((m) => m.userId && allowedUserIds.add(m.userId));
        }
      } else {
        // General Employee sees ONLY teammates within SHARED projects + their designated Team Leader
        allowedUserIds.add(authUser.id);
        const myProjects: any[] = await queryDb<any[]>(
          `SELECT A as projectId FROM _assignedstaffprojects WHERE B = ? 
           UNION 
           SELECT projectId FROM task WHERE assignedToUserId = ?`,
          [authUser.id, authUser.id]
        );
        const pIds = (myProjects || []).map((p) => p.projectId).filter(Boolean);
        if (pIds.length > 0) {
          const placeholders = pIds.map(() => "?").join(",");
          const sharedTeammates: any[] = await queryDb<any[]>(
            `SELECT B as userId FROM _assignedstaffprojects WHERE A IN (${placeholders}) 
             UNION 
             SELECT teamLeaderId as userId FROM project WHERE id IN (${placeholders}) 
             UNION 
             SELECT assignedToUserId as userId FROM task WHERE projectId IN (${placeholders})`,
            [...pIds, ...pIds, ...pIds]
          );
          (sharedTeammates || []).forEach((t) => {
            if (t.userId) allowedUserIds.add(t.userId);
          });
        }
      }

      // Filter and enrich
      const filteredUsers = users.filter((u) => {
        if (!allowedUserIds.has(u.id)) return false;
        // Non-admins must NEVER see Super Admin in general workforce lists
        if (!isFullAdmin && u.role === "SUPER_ADMIN" && u.id !== authUser.id) return false;
        return true;
      });

      const enrichedUsers = filteredUsers.map((u) => {
        const tasks = allTasks.filter((t) => t.assignedToUserId === u.id);
        const reviews = allReviews.filter((r) => r.userId === u.id || r.employeeId === u.employeeId);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
        const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "ASSIGNED" || t.status === "IN_REVIEW").length;
        const pendingTasks = tasks.filter((t) => t.status === "ASSIGNED" || t.status === "BACKLOG").length;
        const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
        const overdueTasks = tasks.filter(
          (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < now
        ).length;

        const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        let workloadLevel: "LOW" | "NORMAL" | "HIGH" | "OVERLOADED" = "NORMAL";
        if (activeTasks === 0) workloadLevel = "LOW";
        else if (activeTasks <= 2) workloadLevel = "NORMAL";
        else if (activeTasks <= 4) workloadLevel = "HIGH";
        else workloadLevel = "OVERLOADED";

        const currentProjectTitle = "OMS Enterprise Portal";
        const avatarUrl = getEmployeeAvatarUrl(u);

        // Redact confidential bank/salary information for non-admins (or non-self)
        const canViewPrivateDetails = isFullAdmin || u.id === authUser.id;

        return {
          ...u,
          password: undefined,
          salary: canViewPrivateDetails ? u.salary : null,
          phone: canViewPrivateDetails || roleUpper === "TEAM_LEADER" ? u.phone : null,
          emergencyContact: canViewPrivateDetails ? u.emergencyContact : null,
          avatarUrl,
          currentProjectTitle,
          department: u.departmentName || "Engineering",
          departmentName: u.departmentName || "Engineering",
          departmentCode: u.departmentCode || "ENG",
          dept: u.departmentName ? { name: u.departmentName, code: u.departmentCode } : null,
          bankDetail: canViewPrivateDetails && u.bankName ? {
            accountHolderName: u.accountHolderName,
            accountNumberMasked: u.accountNumber && u.accountNumber.length > 4 
              ? `•••• •••• ${u.accountNumber.slice(-4)}` 
              : (u.accountNumber || "•••• •••• 8821"),
            branchName: u.branchName,
            accountType: u.accountType,
          } : null,
          customerreviews: reviews,
          metrics: {
            totalTasks,
            activeTasks,
            completedTasks,
            pendingTasks,
            blockedTasks,
            overdueTasks,
            progressRate,
            workloadLevel,
          },
        };
      });

      return NextResponse.json({
        success: true,
        total: enrichedUsers.length,
        data: enrichedUsers,
      });
    }
  } catch (dbErr: any) {
    console.warn("TiDB query error in employees route:", dbErr.message);
  }

  const employees = getStoredEmployees();
  return NextResponse.json({
    success: true,
    total: employees.length,
    data: employees,
  });
}

export async function POST(request: Request) {
  try {
    // 🛡️ Server-Side Authorization Check
    const authResult = await authenticateRequest(request, "canManageHR");
    if (authResult.response) return authResult.response;

    const body = await request.json();
    const {
      name,
      email,
      department,
      role,
      salary,
      phone,
      id,
      password,
      isActive,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      accountType,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and Email are required fields." },
        { status: 400 }
      );
    }

    // 🔒 SINGLE SUPER ADMIN RULE: Never allow creation of a second Super Admin
    const requestedRole = (role || "DEVELOPER").toUpperCase();
    if (requestedRole === "SUPER_ADMIN") {
      const existingSuperAdmins = await queryDb<any[]>(
        `SELECT id FROM user WHERE role = 'SUPER_ADMIN' LIMIT 1`
      );
      if (existingSuperAdmins && existingSuperAdmins.length > 0) {
        return NextResponse.json(
          { success: false, error: "Validation Error: A Super Admin already exists in this organisation. Only one Super Admin is permitted." },
          { status: 400 }
        );
      }
    }

    // Strict Gmail Validation & Normalization
    const emailValidation = validateAndNormalizeGmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error || "Only Gmail addresses ending with @gmail.com are allowed." },
        { status: 400 }
      );
    }

    // Validate Bank Details if provided
    if (bankName || accountNumber || ifscCode) {
      const { validateBankDetails } = await import("@/lib/bankHelper");
      const bankValidation = validateBankDetails({
        accountHolderName: accountHolderName || name,
        bankName,
        accountNumber,
        ifscCode,
      });
      if (!bankValidation.isValid) {
        return NextResponse.json({ success: false, error: bankValidation.error }, { status: 400 });
      }
    }

    const { hashPassword } = await import("@/lib/authService");
    const rawPassword = password || "Roushan@123";
    const hashedPassword = await hashPassword(rawPassword);
    const normalizedEmail = emailValidation.normalizedEmail!;
    const employeeId = id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const newUserId = `usr_${Date.now()}`;

      let resolvedDeptId: string | null = null;
      if (department) {
        const deptRows = await queryDb<any[]>(
          `SELECT id FROM department WHERE id = ? OR name = ? OR code = ? LIMIT 1`,
          [department, department, department]
        );
        if (deptRows && deptRows.length > 0) {
          resolvedDeptId = deptRows[0].id;
        }
      }

      await queryDb(
        `INSERT INTO user (
          id, employeeId, name, email, password, phone, role, departmentId, salary, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newUserId,
          employeeId,
          name.trim(),
          normalizedEmail,
          hashedPassword,
          phone || "+91 98765 00000",
          requestedRole,
          resolvedDeptId,
          Number(salary) || 0,
          isActive !== false ? 1 : 0,
        ]
      );

      if (bankName && accountNumber && ifscCode) {
        const { maskAccountNumber } = await import("@/lib/bankHelper");
        const masked = maskAccountNumber(accountNumber);
        await queryDb(
          `INSERT INTO bankdetail (
            id, userId, accountHolderName, bankName, accountNumberMasked, accountNumberEncrypted, ifscCode, branchName, accountType, isVerified, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
          [
            `bnk_${Date.now()}`,
            newUserId,
            accountHolderName || name.trim(),
            bankName,
            masked,
            accountNumber,
            ifscCode.toUpperCase(),
            branchName || "Main Branch",
            accountType || "SAVINGS",
          ]
        );
      }

      const auditAction = requestedRole === "HR" ? "HR_USER_CREATED" : "EMPLOYEE_USER_CREATED";
      await logAuditEvent(
        authResult.user?.id || null,
        auditAction,
        `Admin created ${requestedRole} user ${name.trim()} (${employeeId}). Role: ${requestedRole}`,
        request.headers.get("x-forwarded-for") || "127.0.0.1"
      );

      // Dispatch Real Welcome & Account Activation Email via Nodemailer SMTP
      try {
        const activationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours Expiration

        await queryDb(
          `INSERT INTO otptoken (id, email, otpHash, expiresAt, attempts, createdAt) VALUES (?, ?, ?, ?, 0, NOW())`,
          [`otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, normalizedEmail, activationToken, expiresAt]
        ).catch(() => {});

        const { getAppBaseUrl, sendSmtpEmail } = await import("@/lib/smtpTransporter");
        const appBaseUrl = getAppBaseUrl(request);
        const activationLink = `${appBaseUrl}/auth/forgot-password?token=${encodeURIComponent(activationToken)}&email=${encodeURIComponent(normalizedEmail)}&identity=${encodeURIComponent(employeeId)}`;

        sendSmtpEmail({
          to: normalizedEmail,
          subject: `🎉 Welcome to OMS Enterprise! Activate Your Employee Account (${employeeId})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 28px; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
              <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px;">
                <h1 style="margin: 0; font-size: 22px; text-transform: uppercase;">WELCOME TO OMS ENTERPRISE</h1>
                <p style="margin-top: 4px; font-size: 12px; color: #93c5fd;">Corporate Employee Onboarding Service</p>
              </div>

              <div style="padding: 20px 0;">
                <h2 style="color: #0f172a; font-size: 18px;">Congratulations, ${name.trim()}! 🎉</h2>
                <p style="font-size: 13px; color: #334155; line-height: 1.6;">
                  Your corporate employee profile has been provisioned on OMS Enterprise. Please click the button below to activate your account and configure your secure password.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 6px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">🪪 Official Employee Details</h3>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Employee Name:</strong> ${name.trim()}</p>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Assigned Employee ID:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">${employeeId}</span></p>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Department:</strong> ${department || "Operations & Technology"}</p>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Designation / Role:</strong> ${requestedRole}</p>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Corporate Email:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${normalizedEmail}</span></p>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${activationLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    🚀 Activate Account & Set Password →
                  </a>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                  Or copy and paste this activation link into your browser:<br/>
                  <a href="${activationLink}" style="color: #2563eb; word-break: break-all;">${activationLink}</a>
                </p>
              </div>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                OMS Enterprise Human Resources Desk • DLF Cyber City, Gurugram
              </p>
            </div>
          `,
        }).catch((e) => console.warn("Welcome email dispatch warning:", e));
      } catch (emailErr) {
        console.warn("Activation email dispatch fallback:", emailErr);
      }

      return NextResponse.json({
        success: true,
        message: `${requestedRole === "HR" ? "HR" : "Employee"} user registered successfully on TiDB Cloud and welcome activation email dispatched.`,
        data: { id: newUserId, employeeId, name: name.trim(), email: normalizedEmail, role: requestedRole },
      });
    } catch (dbErr: any) {
      console.warn("DB insert error:", dbErr.message);
    }

    const newEmp = addStoredEmployee({
      id: employeeId,
      name,
      email: normalizedEmail,
      department: department || "Operations",
      role: role || "DEVELOPER",
      salary: String(salary || "0"),
      phone: phone || "+91 98765 00000",
    });

    return NextResponse.json({
      success: true,
      message: "Employee added successfully.",
      data: newEmp,
    });
  } catch (error: any) {
    console.error("Failed to create employee:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create employee." },
      { status: 500 }
    );
  }
}
