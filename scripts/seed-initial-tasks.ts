import { prisma } from "../lib/prisma";

async function seedTasks() {
  console.log("🌱 Seeding real task records and history into MySQL database 'oms'...");
  try {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.warn("⚠️ No users found to seed tasks for.");
      process.exit(0);
    }

    const roushan = users.find((u) => u.employeeId === "EMP-8595") || users[0];
    const aditya = users.find((u) => u.employeeId === "EMP014" || u.email.includes("aditya")) || users[1] || users[0];

    const initialTasks = [
      {
        title: "Build OMS Task Intelligence Architecture & Database Models",
        description: "Implement Prisma schema relations for tasks, task history, progress sliders, and workload analytics.",
        assignedToUserId: roushan.id,
        createdById: roushan.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
        progress: 75,
        estimatedHours: 12.0,
        actualHours: 9.0,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 days
      },
      {
        title: "Refactor Employee Workboard & Attendance Clock Integration",
        description: "Connect attendance punch-in times with active shift tasks and daily EOD work submission.",
        assignedToUserId: roushan.id,
        createdById: roushan.id,
        status: "COMPLETED",
        priority: "MEDIUM",
        progress: 100,
        completedAt: new Date(),
        estimatedHours: 8.0,
        actualHours: 7.5,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // -1 day
      },
      {
        title: "Audit Nodemailer SMTP Service for Rate Limited OTP Email Dispatch",
        description: "Verify email template formatting, timeout handles, and error logging.",
        assignedToUserId: roushan.id,
        createdById: roushan.id,
        status: "BLOCKED",
        priority: "HIGH",
        progress: 40,
        blockerReason: "Waiting for SMTP relay server IP whitelist clearance from Infrastructure Security team.",
        estimatedHours: 6.0,
        actualHours: 4.0,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue (-2 days)
      },
      {
        title: "Frontend UI Accessibility & Keyboard Navigation Audit",
        description: "Test ARIA attributes, focus management, and responsive layouts across mobile & desktop viewports.",
        assignedToUserId: aditya.id,
        createdById: roushan.id,
        status: "ASSIGNED",
        priority: "MEDIUM",
        progress: 25,
        estimatedHours: 10.0,
        actualHours: 2.5,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Database Performance Tuning & Indexing for Workforce Metrics",
        description: "Add compound database indexes on (assignedToUserId, status) to optimize workforce analytics query times.",
        assignedToUserId: aditya.id,
        createdById: roushan.id,
        status: "IN_REVIEW",
        priority: "HIGH",
        progress: 90,
        estimatedHours: 8.0,
        actualHours: 7.0,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const item of initialTasks) {
      const existing = await prisma.task.findFirst({
        where: { title: item.title, assignedToUserId: item.assignedToUserId },
      });

      if (!existing) {
        const createdTask = await prisma.task.create({
          data: item,
        });

        await prisma.taskhistory.create({
          data: {
            taskId: createdTask.id,
            userId: item.createdById,
            action: "TASK_CREATED",
            newValue: item.status,
            description: `Task created and assigned with initial progress ${item.progress}%`,
          },
        });
        console.log(`✓ Created task: "${createdTask.title}" (${createdTask.status})`);
      }
    }

    console.log("🎉 Task seeding completed successfully!");
  } catch (err: any) {
    console.error("❌ Task Seeding Error:", err.message);
  } finally {
    process.exit(0);
  }
}

seedTasks();
