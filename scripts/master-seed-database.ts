import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function masterSeedDatabase() {
  console.log("🌱 Executing Master MySQL Database Sync & Seeding for 'oms'...\n");

  try {
    // 1. Seed/Verify Departments
    const defaultDepartments = [
      { name: "Development & Engineering", code: "ENG", headName: "Roushan Verma", budget: 2500000 },
      { name: "Human Resources", code: "HR", headName: "Priya Sharma", budget: 1200000 },
      { name: "Accounts & Finance", code: "FIN", headName: "Amit Kumar", budget: 1800000 },
      { name: "Growth & Sales", code: "SALES", headName: "Vikram Singh", budget: 2000000 },
      { name: "UI/UX & Graphic Design", code: "DESIGN", headName: "Neha Gupta", budget: 1000000 },
      { name: "Executive Management", code: "EXEC", headName: "Director Board", budget: 5000000 },
    ];

    for (const d of defaultDepartments) {
      const existing = await prisma.department.findFirst({ where: { name: d.name } });
      if (!existing) {
        await prisma.department.create({ data: d });
        console.log(`✓ Created Department: ${d.name} (${d.code})`);
      }
    }

    const engDept = await prisma.department.findFirst({ where: { name: "Development & Engineering" } });

    // 2. Seed/Verify Key Employee Accounts with Bcrypt Hashes
    const passwordHashRoushan = await bcrypt.hash("Roushan@123", 10);
    const passwordHashAditya = await bcrypt.hash("password123", 10);

    const initialUsers = [
      {
        employeeId: "EMP-8595",
        name: "Roushan Verma",
        email: "roushan.verma@oms.com",
        password: passwordHashRoushan,
        phone: "+91 98765 85950",
        role: "SUPER_ADMIN" as const,
        departmentId: engDept?.id,
        joiningDate: new Date("2024-01-15"),
        salary: 1500000,
        isActive: true,
        isProfileCompleted: true,
        documentsVerified: true,
      },
      {
        employeeId: "EMP014",
        name: "Aditya Raj",
        email: "aditya.raj@oms.com",
        password: passwordHashAditya,
        phone: "+91 98765 00014",
        role: "DEVELOPER" as const,
        departmentId: engDept?.id,
        joiningDate: new Date("2025-03-01"),
        salary: 850000,
        isActive: true,
        isProfileCompleted: true,
        documentsVerified: true,
      },
    ];

    for (const u of initialUsers) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ employeeId: u.employeeId }, { email: u.email }] },
      });

      if (!existing) {
        await prisma.user.create({ data: u });
        console.log(`✓ Created User: ${u.name} (${u.employeeId}) with Bcrypt password`);
      } else {
        await prisma.user.update({
          where: { id: existing.id },
          data: { password: u.password, isActive: true },
        });
        console.log(`✓ Verified & Updated User: ${u.name} (${u.employeeId}) in MySQL`);
      }
    }

    // 3. Seed Initial Tasks & Task History
    const roushan = await prisma.user.findFirst({ where: { employeeId: "EMP-8595" } });
    const aditya = await prisma.user.findFirst({ where: { employeeId: "EMP014" } });

    if (roushan && aditya) {
      const tasksToSeed = [
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
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
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
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
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
      ];

      for (const t of tasksToSeed) {
        const existingTask = await prisma.task.findFirst({
          where: { title: t.title, assignedToUserId: t.assignedToUserId },
        });

        if (!existingTask) {
          const createdTask = await prisma.task.create({ data: t });
          await prisma.taskhistory.create({
            data: {
              taskId: createdTask.id,
              userId: t.createdById,
              action: "TASK_CREATED",
              newValue: t.status,
              description: `Task created and assigned with progress ${t.progress}%`,
            },
          });
          console.log(`✓ Created Task: "${createdTask.title}" (${createdTask.status})`);
        }
      }
    }

    // 4. Verification Count
    const totalUsers = await prisma.user.count();
    const totalDepts = await prisma.department.count();
    const totalTasks = await prisma.task.count();
    const totalHistories = await prisma.taskhistory.count();

    console.log(`\n🎉 MASTER DATABASE SEEDING COMPLETED SUCCESSFULLY!`);
    console.log(`📊 Total Users in MySQL: ${totalUsers}`);
    console.log(`📊 Total Departments in MySQL: ${totalDepts}`);
    console.log(`📊 Total Tasks in MySQL: ${totalTasks}`);
    console.log(`📊 Total Task History Log Entries: ${totalHistories}`);

  } catch (err: any) {
    console.error("❌ Master Database Seeding Error:", err.message);
  } finally {
    process.exit(0);
  }
}

masterSeedDatabase();
