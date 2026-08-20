import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { getStoredLeaveRequests, addStoredLeaveRequest, updateLeaveStatus } from "@/utils/leaveStore";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    try {
      const { prisma } = await import("@/lib/prisma");
      
      const whereCondition = isAdmin ? {} : { userId: authUser.id };
      
      const dbLeaves = await prisma.leaverequest.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, employeeId: true, department: { select: { name: true } } } },
        },
        orderBy: { appliedAt: "desc" },
      });

      if (dbLeaves.length > 0) {
        return NextResponse.json({ success: true, total: dbLeaves.length, data: dbLeaves });
      }
    } catch (dbErr: any) {
      console.warn("Prisma query fallback:", dbErr.message);
    }

    const requests = getStoredLeaveRequests();
    const filtered = isAdmin ? requests : requests.filter((r: any) => r.userId === authUser.id);

    return NextResponse.json({
      success: true,
      total: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch leave requests." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const body = await request.json().catch(() => ({}));
    const { leaveType, startDate, endDate, totalDays, reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Leave reason is required." },
        { status: 400 }
      );
    }

    let createdRecord;
    try {
      const { prisma } = await import("@/lib/prisma");

      createdRecord = await prisma.leaverequest.create({
        data: {
          userId: authUser.id, // Strictly use authenticated user ID
          leaveType: leaveType || "Casual Leave",
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now()),
          totalDays: parseInt(totalDays) || 1,
          reason: reason || "Personal Leave",
          status: "PENDING",
        },
      });
    } catch (dbErr: any) {
      console.warn("Prisma MySQL save fallback:", dbErr.message);
    }

    const newReq = addStoredLeaveRequest({
      employeeName: (authUser as any).name || authUser.email,
      department: "Operations",
      leaveType: leaveType || "Casual Leave",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date().toISOString().split("T")[0],
      totalDays: parseInt(totalDays) || 1,
      reason: reason || "Personal Leave",
      status: "PENDING",
    } as any);

    logAuditEvent(
      authUser.id,
      "LEAVE_APPLICATION_SUBMITTED",
      `Submitted leave request for ${totalDays || 1} day(s) (${leaveType || "Casual Leave"})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json(
      { success: true, message: "Leave request submitted successfully.", data: createdRecord || newReq },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to submit leave request." },
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

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin approval authorization required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, status, hrRemarks } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing leave ID or status." }, { status: 400 });
    }

    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.leaverequest.update({
        where: { id },
        data: { status, hrRemarks },
      });
    } catch (dbErr: any) {
      console.warn("Prisma leave status update fallback:", dbErr.message);
    }

    const updated = updateLeaveStatus(id, status as any);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update leave status." }, { status: 500 });
  }
}
