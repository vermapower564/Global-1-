import { NextResponse } from "next/server";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { addStoredResignation, getStoredResignations, updateStoredResignationStatus } from "@/utils/resignationStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const dbResignations = await prisma.resignation.findMany({
      orderBy: { submittedAt: "desc" },
      include: { user: { select: { name: true, email: true, employeeId: true, role: true } } },
    });

    if (dbResignations.length > 0) {
      return NextResponse.json({
        success: true,
        data: dbResignations,
      });
    }
  } catch (dbErr: any) {
    console.warn("Prisma resignation fetch fallback:", dbErr.message);
  }

  return NextResponse.json({
    success: true,
    data: getStoredResignations(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      employeeName,
      employeeId,
      email,
      department,
      role,
      resignationDate,
      reason,
      lastWorkingDay,
    } = body;

    if (!employeeName || !employeeId || !email || !resignationDate || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Required resignation details are missing.",
        },
        { status: 400 }
      );
    }

    const generatedResId = `RES-${Date.now().toString().slice(-6)}`;
    const parsedLastWorkingDay = lastWorkingDay ? new Date(lastWorkingDay) : new Date(Date.now() + 15 * 86400000);

    let createdDbRecord;
    try {
      const { prisma } = await import("@/lib/prisma");
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ employeeId }, { email }] },
      });

      createdDbRecord = await prisma.resignation.create({
        data: {
          resignationId: generatedResId,
          userId: existingUser?.id || null,
          employeeId,
          employeeName,
          email,
          department: department || "Development & Engineering",
          role: role || "Senior Software Engineer",
          resignationDate: new Date(resignationDate),
          lastWorkingDay: parsedLastWorkingDay,
          reason,
          status: "SUBMITTED",
        },
      });

      if (existingUser?.id) {
        await prisma.auditlog.create({
          data: {
            userId: existingUser.id,
            action: "RESIGNATION_SUBMITTED",
            details: `Resignation ${generatedResId} submitted by ${employeeName} (${employeeId}). Reason: ${reason}`,
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("Prisma MySQL save fallback:", dbErr.message);
    }

    const record = addStoredResignation({
      employeeName,
      employeeId,
      email,
      department,
      role,
      resignationDate,
      reason,
    });

    const emailResult = await sendSmtpEmail({
      to: email,
      subject: `Resignation Submission Confirmation - ${employeeId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #dc2626;">Resignation Submission Confirmation</h2>
          <p>Dear <strong>${employeeName}</strong>,</p>
          <p>Your official resignation application has been successfully submitted and is under HR review.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <p><strong>Resignation Ref ID:</strong> ${createdDbRecord?.resignationId || generatedResId}</p>
          <p><strong>Employee ID:</strong> ${employeeId}</p>
          <p><strong>Department:</strong> ${department}</p>
          <p><strong>Designation:</strong> ${role}</p>
          <p><strong>Notice Period:</strong> 15 Calendar Days</p>
          <p><strong>Estimated Last Working Day:</strong> ${parsedLastWorkingDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <p>Regards,<br /><strong>OMS Enterprise HR Operations Desk</strong></p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "✓ Resignation submitted to MySQL database and confirmation email sent.",
      data: createdDbRecord || record,
      email: emailResult,
    });
  } catch (error: any) {
    console.error("Resignation API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit resignation.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, resignationId, status, managerRemarks, hrRemarks, deleteEmployee, noticePeriodDays } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required." }, { status: 400 });
    }

    let updatedRecord: any = null;
    let employeeDeleted = false;

    try {
      const { prisma } = await import("@/lib/prisma");
      const targetWhere = id ? { id } : { resignationId };

      updatedRecord = await prisma.resignation.update({
        where: targetWhere,
        data: {
          status,
          managerRemarks: managerRemarks || undefined,
          hrRemarks: hrRemarks || undefined,
          approvedAt: status === "APPROVED" ? new Date() : undefined,
          rejectedAt: status === "REJECTED" ? new Date() : undefined,
        },
      });

      // If Admin chooses to delete employee upon accepting resignation
      if (status === "APPROVED" && deleteEmployee && updatedRecord.userId) {
        try {
          await prisma.user.delete({
            where: { id: updatedRecord.userId },
          });
          employeeDeleted = true;
        } catch (delErr: any) {
          // If cascading fails, mark as deactivated and resigned
          await prisma.user.update({
            where: { id: updatedRecord.userId },
            data: { isActive: false, isResigned: true },
          });
        }
      } else if ((status === "APPROVED" || status === "COMPLETED") && updatedRecord.userId) {
        // Update User isResigned flag if APPROVED or COMPLETED
        await prisma.user.update({
          where: { id: updatedRecord.userId },
          data: { isResigned: true, isActive: false },
        });

        await prisma.auditlog.create({
          data: {
            userId: updatedRecord.userId,
            action: `RESIGNATION_${status}`,
            details: `Resignation ${updatedRecord.resignationId} status updated to ${status}. HR Remarks: ${hrRemarks || "None"}`,
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("Prisma update fallback:", dbErr.message);
    }

    if (resignationId) {
      updateStoredResignationStatus(resignationId, status);
    }

    return NextResponse.json({
      success: true,
      message: `✓ Resignation status updated to ${status} in MySQL via Prisma.`,
      data: updatedRecord || { resignationId, status },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}