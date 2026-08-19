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
    const now = new Date();

    // 1. Fetch Users, Departments, Bank Details & Reviews directly from TiDB Cloud (with 15s in-memory cache)
    const users: any[] = await queryDbCached(
      `SELECT u.*, d.name AS departmentName, d.code AS departmentCode,
              b.accountHolderName, b.bankName, b.accountNumber, b.ifscCode, b.branchName, b.accountType
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       LEFT JOIN bankdetail b ON u.id = b.userId
       ORDER BY u.createdAt DESC`,
      [],
      15
    );

    // 2. Fetch Tasks and Reviews in parallel (cached)
    const allTasks: any[] = await queryDbCached("SELECT id, title, status, dueDate, assignedToUserId, projectId FROM task", [], 15);
    const allReviews: any[] = await queryDbCached("SELECT * FROM customerreview ORDER BY createdAt DESC", [], 15);

    if (users && users.length > 0) {
      const enrichedUsers = users.map((u) => {
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

        return {
          ...u,
          avatarUrl,
          currentProjectTitle,
          department: u.departmentName ? { name: u.departmentName, code: u.departmentCode } : null,
          bankDetail: u.bankName ? {
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
      await queryDb(
        `INSERT INTO user (
          id, employeeId, name, email, password, phone, role, salary, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newUserId,
          employeeId,
          name.trim(),
          normalizedEmail,
          hashedPassword,
          phone || "+91 98765 00000",
          role || "DEVELOPER",
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

      await logAuditEvent(request, "CREATE_EMPLOYEE", {
        employeeId,
        email: normalizedEmail,
        name,
        role,
      });

      return NextResponse.json({
        success: true,
        message: "Employee registered successfully on TiDB Cloud.",
        data: { id: newUserId, employeeId, name, email: normalizedEmail, role },
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
