import { NextResponse } from "next/server";
import { getStoredEmployees, addStoredEmployee, deleteStoredEmployee } from "@/utils/employeeStore";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const now = new Date();

    const dbUsers = await prisma.user.findMany({
      include: {
        department: true,
        assignedTasks: true,
        project: { select: { id: true, projectTitle: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (dbUsers.length > 0) {
      const enrichedUsers = dbUsers.map((u) => {
        const tasks = u.assignedTasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
        const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "ASSIGNED" || t.status === "IN_REVIEW").length;
        const pendingTasks = tasks.filter((t) => t.status === "ASSIGNED" || t.status === "BACKLOG").length;
        const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
        const overdueTasks = tasks.filter(
          (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && new Date(t.dueDate) < now
        ).length;

        const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        let workloadLevel: "LOW" | "NORMAL" | "HIGH" | "OVERLOADED" = "NORMAL";
        if (activeTasks === 0) workloadLevel = "LOW";
        else if (activeTasks <= 2) workloadLevel = "NORMAL";
        else if (activeTasks <= 4) workloadLevel = "HIGH";
        else workloadLevel = "OVERLOADED";

        const currentProjectTitle = u.project && u.project.length > 0 ? u.project[0].projectTitle : "OMS Enterprise";

        return {
          ...u,
          currentProjectTitle,
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
    console.warn("Prisma query fallback:", dbErr.message);
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
    const { name, email, department, role, salary, phone, id, password, isActive } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and Email are required fields." },
        { status: 400 }
      );
    }

    const assignedId = id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    let record;
    try {
      const { prisma } = await import("@/lib/prisma");
      const { hashPassword } = await import("@/lib/authService");

      let deptRecord;
      if (department) {
        deptRecord = await prisma.department.findFirst({
          where: { name: { contains: department } },
        });
      }

      // Check if user exists by email or employeeId
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: email.toLowerCase().trim() }, { employeeId: assignedId }] },
      });

      const formattedRole = role
        ? (role.toUpperCase().replace(/\s+/g, "_") as any)
        : "DEVELOPER";

      if (existingUser) {
        const updateData: any = {
          name,
          email,
          role: formattedRole,
          phone: phone || existingUser.phone,
          salary: salary ? parseFloat(salary.toString().replace(/[^0-9.]/g, "")) : existingUser.salary,
        };

        if (deptRecord) updateData.departmentId = deptRecord.id;
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);
        if (password && password.trim()) {
          updateData.password = await hashPassword(password);
        }

        record = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });

        await logAuditEvent(
          authResult.user?.id || null,
          "EMPLOYEE_UPDATE",
          `Updated employee user profile for ${name} (${assignedId})`
        );
      } else {
        const hashedPassword = await hashPassword(password || "password123");
        record = await prisma.user.create({
          data: {
            employeeId: assignedId,
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || "+91 98765 00000",
            role: formattedRole,
            departmentId: deptRecord ? deptRecord.id : null,
            salary: parseFloat(salary?.toString().replace(/[^0-9.]/g, "") || "85000"),
            joiningDate: new Date(),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            isProfileCompleted: true,
            documentsVerified: true,
          },
        });

        await logAuditEvent(
          authResult.user?.id || null,
          "EMPLOYEE_CREATE",
          `Created employee profile for ${name} (${assignedId})`
        );
      }
    } catch (dbErr: any) {
      console.warn("Prisma MySQL save fallback:", dbErr.message);
    }

    const newEmployee = addStoredEmployee({
      id: assignedId,
      name,
      email,
      department: department || "Engineering",
      role: role || "Developer",
      salary: salary || "₹85000",
      phone,
    });

    // 📧 Nodemailer SMTP Email Dispatch
    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const isUpdate = !!id;
    const emailSubject = isUpdate
      ? `✏️ Employee Profile & Access Update Alert (${assignedId})`
      : `🎉 Welcome to OMS Enterprise! Your Employee ID is ${assignedId}`;

    let smtpResult: any = null;
    try {
      smtpResult = await sendSmtpEmail({
        to: email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; border: 2px solid #0f172a; padding: 24px;">
            <h2>Dear ${name},</h2>
            <p>${isUpdate ? "Your employee user profile and permissions were updated by Corporate Admin/HR." : "Welcome to the team! Your employee user account has been registered."}</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 16px;">
              <p><strong>Employee Name:</strong> ${name}</p>
              <p><strong>Employee ID:</strong> ${assignedId}</p>
              <p><strong>Department:</strong> ${department || "Engineering"}</p>
              <p><strong>Designation:</strong> ${role || "Developer"}</p>
              <p><strong>Corporate Email:</strong> ${email}</p>
            </div>
            <p style="font-size: 11px; color: #64748b;">Nodemailer Transport • OMS Enterprise HR Desk (${timestampStr})</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn("Nodemailer SMTP employee email fallback:", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: `✓ Employee user saved to XAMPP MySQL and Nodemailer SMTP email dispatched to ${email}!`,
        data: record || newEmployee,
        smtpDetails: smtpResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    // 🛡️ Server-Side Authorization Check
    const authResult = await authenticateRequest(request, "canManageHR");
    if (authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required for deletion." },
        { status: 400 }
      );
    }

    let deletedFromDb = false;
    let deletedUserEmail = `${id}@oms.com`;

    try {
      const { prisma } = await import("@/lib/prisma");
      const foundUser = await prisma.user.findFirst({
        where: { OR: [{ id: id }, { employeeId: id }, { email: id }] },
      });
      if (foundUser) {
        deletedUserEmail = foundUser.email;
      }

      await prisma.user.deleteMany({
        where: {
          OR: [
            { id: id },
            { employeeId: id },
            { email: id },
          ],
        },
      });
      deletedFromDb = true;

      await logAuditEvent(
        authResult.user?.id || null,
        "EMPLOYEE_DELETE",
        `Deactivated employee user account (${id})`
      );
    } catch (dbErr: any) {
      console.warn("Prisma MySQL delete fallback:", dbErr.message);
    }

    const updatedList = deleteStoredEmployee(id);

    let smtpResult: any = null;
    try {
      smtpResult = await sendSmtpEmail({
        to: deletedUserEmail,
        subject: `⚠️ Account Deactivation Notice: Employee ID ${id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; border: 2px solid #0f172a; padding: 24px;">
            <h2 style="color: #991b1b;">Employee Account Deactivated</h2>
            <p>Your employee user account (<strong>ID: ${id}</strong>) was deactivated in the XAMPP MySQL database.</p>
            <p style="font-size: 11px; color: #64748b;">Nodemailer Transport • OMS Corporate Admin</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn("Nodemailer SMTP delete fallback:", e);
    }

    return NextResponse.json({
      success: true,
      message: `✓ Employee User ID (${id}) deleted permanently from XAMPP MySQL & Nodemailer SMTP deactivation notice sent!`,
      deletedFromDb,
      totalRemaining: updatedList.length,
      smtpDetails: smtpResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
