import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedToUser: { select: { id: true, name: true, employeeId: true, email: true } },
        createdBy: { select: { id: true, name: true, employeeId: true } },
        project: true,
        taskhistory: {
          include: { user: { select: { id: true, name: true, employeeId: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch task details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, progress, priority, blockerReason, actualHours, dueDate, assignedToUserId } = body;

    const { prisma } = await import("@/lib/prisma");

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const updateData: any = {};
    const historyEntries: any[] = [];

    // Status transition & validation
    if (status && status !== existingTask.status) {
      if (status === "BLOCKED" && (!blockerReason || !blockerReason.trim()) && !existingTask.blockerReason) {
        return NextResponse.json(
          { success: false, error: "Blocker reason is required when marking a task as BLOCKED." },
          { status: 400 }
        );
      }

      updateData.status = status;
      if (status === "COMPLETED") {
        updateData.progress = 100;
        updateData.completedAt = new Date();
      }

      historyEntries.push({
        taskId: id,
        userId: authResult.user.id,
        action: "STATUS_CHANGE",
        oldValue: existingTask.status,
        newValue: status,
        description: `Status updated from ${existingTask.status} to ${status}${status === "BLOCKED" ? ` (Blocker: ${blockerReason})` : ""}`,
      });
    }

    // Progress % update
    if (typeof progress === "number" && progress !== existingTask.progress) {
      const validProgress = Math.min(100, Math.max(0, progress));
      updateData.progress = validProgress;
      if (validProgress === 100 && !updateData.status) {
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
      }

      historyEntries.push({
        taskId: id,
        userId: authResult.user.id,
        action: "PROGRESS_UPDATE",
        oldValue: `${existingTask.progress}%`,
        newValue: `${validProgress}%`,
        description: `Progress updated to ${validProgress}%`,
      });
    }

    // Priority update
    if (priority && priority !== existingTask.priority) {
      updateData.priority = priority;
      historyEntries.push({
        taskId: id,
        userId: authResult.user.id,
        action: "PRIORITY_CHANGE",
        oldValue: existingTask.priority,
        newValue: priority,
        description: `Priority updated from ${existingTask.priority} to ${priority}`,
      });
    }

    // Blocker Reason
    if (blockerReason !== undefined) {
      updateData.blockerReason = blockerReason;
    }

    // Actual Hours
    if (typeof actualHours === "number") {
      updateData.actualHours = actualHours;
    }

    // Due Date
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
      historyEntries.push({
        taskId: id,
        userId: authResult.user.id,
        action: "DEADLINE_CHANGE",
        oldValue: existingTask.dueDate.toISOString().split("T")[0],
        newValue: new Date(dueDate).toISOString().split("T")[0],
        description: `Deadline changed to ${new Date(dueDate).toISOString().split("T")[0]}`,
      });
    }

    // Reassignment
    if (assignedToUserId && assignedToUserId !== existingTask.assignedToUserId) {
      updateData.assignedToUserId = assignedToUserId;
      historyEntries.push({
        taskId: id,
        userId: authResult.user.id,
        action: "REASSIGNED",
        oldValue: existingTask.assignedToUserId,
        newValue: assignedToUserId,
        description: `Task reassigned to new employee`,
      });
    }

    // Perform atomic transaction
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignedToUser: { select: { id: true, name: true, employeeId: true } },
        },
      });

      for (const entry of historyEntries) {
        await tx.taskhistory.create({ data: entry });
      }

      return task;
    });

    await logAuditEvent(
      authResult.user.id,
      "TASK_UPDATED",
      `Task "${updatedTask.title}" updated: status=${updatedTask.status}, progress=${updatedTask.progress}%`
    );

    return NextResponse.json({
      success: true,
      message: "✓ Task updated & history event recorded in MySQL!",
      task: updatedTask,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task." },
      { status: 500 }
    );
  }
}
