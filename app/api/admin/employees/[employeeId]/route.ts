import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { getEmployeeAvatarUrl } from "@/lib/avatarHelper";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    // 1. Server-Side Admin Authorization Check
    const authResult = await authenticateRequest(request);
    if (authResult.response) {
      // Check if session token allows admin dashboard access
      const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];
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

    // 2. Query MySQL User Record via Prisma
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: cleanId },
          { id: cleanId },
          { email: cleanId.toLowerCase() },
        ],
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        departmentId: true,
        managerId: true,
        joiningDate: true,
        isActive: true,
        isResigned: true,
        avatarUrl: true,
        emergencyContact: true,
        salary: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        manager: {
          select: { id: true, name: true, employeeId: true, email: true },
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 30,
        },
        dailyworkupdate: {
          orderBy: { date: "desc" },
          take: 30,
          include: {
            project: {
              select: { id: true, projectTitle: true },
            },
          },
        },
        leaverequest: {
          orderBy: { appliedAt: "desc" },
          take: 20,
        },
        project: {
          select: {
            id: true,
            projectTitle: true,
            clientCompany: true,
            startDate: true,
            endDate: true,
            status: true,
            contractValue: true,
          },
        },
        assignedTasks: {
          orderBy: { createdAt: "desc" },
          include: {
            project: { select: { id: true, projectTitle: true } },
          },
        },
        auditlog: {
          orderBy: { timestamp: "desc" },
          take: 15,
        },
        bankDetail: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: "The requested employee could not be found." },
        { status: 404 }
      );
    }

    // 3. Compute Attendance & Activity Summary Stats
    const avatarUrl = getEmployeeAvatarUrl(userRecord);

    // Today's attendance
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayAttendance = userRecord.attendance.find((a) => {
      const aDateStr = new Date(a.date).toISOString().split("T")[0];
      return aDateStr === todayStr;
    });

    // Leave Calculations
    const approvedLeaves = userRecord.leaverequest
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, curr) => acc + (curr.totalDays || 0), 0);
    const pendingLeaves = userRecord.leaverequest.filter((l) => l.status === "PENDING").length;
    const totalLeaveQuota = 18;
    const remainingLeave = Math.max(0, totalLeaveQuota - approvedLeaves);

    // Task Metrics
    const totalTasks = userRecord.assignedTasks.length;
    const completedTasks = userRecord.assignedTasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = userRecord.assignedTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const pendingTasks = userRecord.assignedTasks.filter((t) => t.status === "ASSIGNED" || t.status === "BACKLOG").length;
    const blockedTasks = userRecord.assignedTasks.filter((t) => t.status === "BLOCKED").length;
    const overdueTasks = userRecord.assignedTasks.filter((t) => {
      return t.status !== "COMPLETED" && t.status !== "CANCELLED" && new Date(t.dueDate) < today;
    }).length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Total Work Hours from Attendance
    const totalHoursWorked = Math.round(
      userRecord.attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
    );

    const stats = {
      todayAttendance: todayAttendance
        ? {
            status: todayAttendance.status,
            checkIn: new Date(todayAttendance.checkInTime).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            checkOut: todayAttendance.checkOutTime
              ? new Date(todayAttendance.checkOutTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null,
            hoursWorked: todayAttendance.hoursWorked,
          }
        : {
            status: "NOT_CHECKED_IN",
            checkIn: null,
            checkOut: null,
            hoursWorked: 0,
          },
      projectsCount: userRecord.project.length,
      leaveSummary: {
        totalQuota: totalLeaveQuota,
        used: approvedLeaves,
        remaining: remainingLeave,
        pendingCount: pendingLeaves,
      },
      workHoursTotal: totalHoursWorked,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        blocked: blockedTasks,
        overdue: overdueTasks,
        completionRate: taskCompletionRate,
      },
    };

    return NextResponse.json({
      success: true,
      employee: {
        ...userRecord,
        avatarUrl,
      },
      stats,
    });
  } catch (error: any) {
    console.error("API error fetching employee 360:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve employee details." },
      { status: 500 }
    );
  }
}
