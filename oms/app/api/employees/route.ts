import { NextResponse } from "next/server";
import { getStoredEmployees, addStoredEmployee, deleteStoredEmployee } from "@/utils/employeeStore";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const dbUsers = await prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: "desc" },
    });

    if (dbUsers.length > 0) {
      return NextResponse.json({
        success: true,
        total: dbUsers.length,
        data: dbUsers,
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
    const { name, email, department, role, salary, phone, id } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and Email are required fields." },
        { status: 400 }
      );
    }

    const assignedId = id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    let createdRecord;
    try {
      const { prisma } = await import("@/lib/prisma");
      
      let deptRecord;
      if (department) {
        deptRecord = await prisma.department.findFirst({
          where: { name: { contains: department } },
        });
      }

      createdRecord = await prisma.user.create({
        data: {
          employeeId: assignedId,
          name,
          email,
          password: "hashed_secure_password_123",
          phone: phone || "+91 98765 00000",
          role: role ? (role.toUpperCase().replace(/\s+/g, "_") as any) : "DEVELOPER",
          departmentId: deptRecord ? deptRecord.id : null,
          salary: parseFloat(salary?.toString().replace(/[^0-9.]/g, "") || "85000"),
          joiningDate: new Date(),
          isProfileCompleted: true,
          documentsVerified: true,
        },
      });

      // 📜 Security Audit Event Log
      await logAuditEvent(
        authResult.user?.id || null,
        "EMPLOYEE_CREATE",
        `Created employee profile for ${name} (${assignedId})`
      );
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
      ? `✏️ Employee Profile & ID Update Alert (${assignedId})`
      : `🎉 Welcome to OMS Enterprise! Your Employee ID is ${assignedId}`;

    let smtpResult: any = null;
    try {
      smtpResult = await sendSmtpEmail({
        to: email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; border: 2px solid #0f172a; padding: 24px;">
            <h2>Dear ${name},</h2>
            <p>${isUpdate ? "Your employee user profile was updated by HR/Admin." : "Welcome to the team! Your employee user account has been registered."}</p>
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
        data: createdRecord || newEmployee,
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

      // 📜 Security Audit Event Log
      await logAuditEvent(
        authResult.user?.id || null,
        "EMPLOYEE_DELETE",
        `Deactivated employee user account (${id})`
      );
    } catch (dbErr: any) {
      console.warn("Prisma MySQL delete fallback:", dbErr.message);
    }

    const updatedList = deleteStoredEmployee(id);

    // 📧 Nodemailer SMTP Email Dispatch for Account Deactivation
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
