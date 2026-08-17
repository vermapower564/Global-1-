import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

// GET: Fetch all blocked tasks from MySQL database
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const blockedTasks = await prisma.task.findMany({
      where: { status: "BLOCKED" },
      include: {
        assignedToUser: { select: { id: true, name: true, employeeId: true, email: true } },
        createdBy: { select: { id: true, name: true, employeeId: true } },
        taskhistory: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      totalBlocked: blockedTasks.length,
      blockedTasks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Unblock task & resume execution
export async function PATCH(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, resolutionNotes } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    const postingUser = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: { name: true },
    });

    const userName = postingUser?.name || authResult.user.email;

    const [updatedTask] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: {
          status: "IN_PROGRESS",
          blockerReason: null,
        },
      }),
      prisma.taskhistory.create({
        data: {
          taskId,
          userId: authResult.user.id,
          action: "BLOCKER_RESOLVED",
          oldValue: "BLOCKED",
          newValue: "IN_PROGRESS",
          description: `${userName} resolved blocker: "${resolutionNotes || "Blocker cleared, task resumed."}"`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "✓ Blocker resolved successfully and task status updated to IN_PROGRESS.",
      task: updatedTask,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
