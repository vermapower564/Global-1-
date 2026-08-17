import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedToUserId = searchParams.get("assignedToUserId") || searchParams.get("userId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search") || "";
    const isOverdueParam = searchParams.get("overdue") === "true";
    const isBlockedParam = searchParams.get("blocked") === "true";

    const { prisma } = await import("@/lib/prisma");

    // Build Prisma query condition
    const where: any = {};

    // Role-based visibility scoping: EMPLOYEE role can ONLY see their own tasks
    const roleStr = (authResult.user.role || "").toString();
    if (roleStr === "EMPLOYEE" || roleStr === "DEVELOPER") {
      where.assignedToUserId = authResult.user.id;
    } else if (assignedToUserId) {
      where.assignedToUserId = assignedToUserId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (isBlockedParam) where.status = "BLOCKED";

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const rawTasks = await prisma.task.findMany({
      where,
      include: {
        assignedToUser: {
          select: { id: true, name: true, employeeId: true, email: true, departmentId: true },
        },
        createdBy: {
          select: { id: true, name: true, employeeId: true },
        },
        taskhistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    });

    const now = new Date();

    // Map tasks and calculate overdue & workload metrics
    const tasks = rawTasks.map((t) => {
      const isOverdue = t.status !== "COMPLETED" && t.status !== "CANCELLED" && new Date(t.dueDate) < now;
      const overdueDays = isOverdue
        ? Math.ceil((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 3600 * 24))
        : 0;

      return {
        ...t,
        isOverdue,
        overdueDays,
      };
    });

    // Apply overdue filter if specified
    const finalTasks = isOverdueParam ? tasks.filter((t) => t.isOverdue) : tasks;

    // Calculate aggregated metrics from real database records
    const total = finalTasks.length;
    const inProgress = finalTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = finalTasks.filter((t) => t.status === "COMPLETED").length;
    const pending = finalTasks.filter((t) => t.status === "ASSIGNED" || t.status === "BACKLOG").length;
    const inReview = finalTasks.filter((t) => t.status === "IN_REVIEW").length;
    const blocked = finalTasks.filter((t) => t.status === "BLOCKED").length;
    const overdue = finalTasks.filter((t) => t.isOverdue).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let workloadLevel: "LOW" | "NORMAL" | "HIGH" | "OVERLOADED" = "NORMAL";
    const activeTaskCount = inProgress + pending + blocked + inReview;
    if (activeTaskCount === 0) workloadLevel = "LOW";
    else if (activeTaskCount <= 2) workloadLevel = "NORMAL";
    else if (activeTaskCount <= 4) workloadLevel = "HIGH";
    else workloadLevel = "OVERLOADED";

    return NextResponse.json({
      success: true,
      tasks: finalTasks,
      summary: {
        total,
        inProgress,
        completed,
        pending,
        inReview,
        blocked,
        overdue,
        completionRate,
        workloadLevel,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, assignedToUserId, priority, dueDate, estimatedHours, projectId } = body;

    if (!title || !assignedToUserId || !dueDate) {
      return NextResponse.json(
        { success: false, error: "Task title, assigned employee ID, and due date are required." },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");

    // Create Task in MySQL
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        assignedToUserId,
        createdById: authResult.user.id,
        projectId: projectId || null,
        priority: priority || "MEDIUM",
        dueDate: new Date(dueDate),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 8.0,
        status: "ASSIGNED",
        progress: 0,
      },
      include: {
        assignedToUser: { select: { id: true, name: true, employeeId: true } },
      },
    });

    // Record initial TaskHistory entry
    await prisma.taskhistory.create({
      data: {
        taskId: newTask.id,
        userId: authResult.user.id,
        action: "TASK_CREATED",
        newValue: "ASSIGNED",
        description: `Task created by ${authResult.user.email} and assigned to ${newTask.assignedToUser.name} (${newTask.assignedToUser.employeeId})`,
      },
    });

    await logAuditEvent(
      authResult.user.id,
      "TASK_CREATED",
      `Task "${newTask.title}" created for ${newTask.assignedToUser.name}`
    );

    return NextResponse.json({
      success: true,
      message: "✓ Task created & assigned successfully in MySQL!",
      task: newTask,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task." },
      { status: 500 }
    );
  }
}
