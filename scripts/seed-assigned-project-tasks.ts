import { prisma } from "../lib/prisma";

async function seedAssignedWorkTasks() {
  console.log("⚡ Seeding rich assigned project work tasks into XAMPP MySQL database...");

  try {
    const adminUser = await prisma.user.findFirst({
      where: { OR: [{ email: "roushan.verma@oms.com" }, { employeeId: "EMP-8595" }] },
    });

    const devUser = await prisma.user.findFirst({
      where: { OR: [{ email: "aditya.dev@globalwebify.com" }, { employeeId: "EMP014" }] },
    });

    const targetUser = adminUser || devUser;

    if (!targetUser) {
      console.warn("⚠️ Target user account not found for assigning project tasks.");
      return;
    }

    // 1. Task A: OMS Enterprise Portal 2.0 Engine
    const task1 = await prisma.task.upsert({
      where: { id: "TSK-PROJ-101" },
      update: {
        title: "OMS Enterprise Portal 2.0 Engine & Role-Based Access Control",
        description: "Full-stack implementation of Next.js 16 app router architecture, Prisma MySQL ORM models, single login with automatic DB role detection, member shift punch clock ledger, and server-side data isolation.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        estimatedHours: 80.0,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2-Month Deadline
      },
      create: {
        id: "TSK-PROJ-101",
        title: "OMS Enterprise Portal 2.0 Engine & Role-Based Access Control",
        description: "Full-stack implementation of Next.js 16 app router architecture, Prisma MySQL ORM models, single login with automatic DB role detection, member shift punch clock ledger, and server-side data isolation.",
        assignedToUserId: targetUser.id,
        createdById: targetUser.id,
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        estimatedHours: 80.0,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        progress: 35,
      },
    });

    // 2. Task B: Acme Cloud Migration & Microservices Integration
    const task2 = await prisma.task.upsert({
      where: { id: "TSK-PROJ-102" },
      update: {
        title: "Acme Cloud Migration & Microservices Integration",
        description: "Migration of legacy REST endpoints to Dockerized microservices on GCP with automated CI/CD pipeline, load balancing, and SQL optimization.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        estimatedHours: 120.0,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: "TSK-PROJ-102",
        title: "Acme Cloud Migration & Microservices Integration",
        description: "Migration of legacy REST endpoints to Dockerized microservices on GCP with automated CI/CD pipeline, load balancing, and SQL optimization.",
        assignedToUserId: targetUser.id,
        createdById: targetUser.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
        estimatedHours: 120.0,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        progress: 25,
      },
    });

    // If devUser exists, also assign task to devUser
    if (devUser && devUser.id !== targetUser.id) {
      await prisma.task.upsert({
        where: { id: "TSK-PROJ-103" },
        update: {
          title: "Frontend UI Components & Responsive Navigation Controls",
          description: "Development of reusable React 19 UI widgets, universal Back & Forward navigation buttons, and responsive modal dialogues.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          estimatedHours: 60.0,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        create: {
          id: "TSK-PROJ-103",
          title: "Frontend UI Components & Responsive Navigation Controls",
          description: "Development of reusable React 19 UI widgets, universal Back & Forward navigation buttons, and responsive modal dialogues.",
          assignedToUserId: devUser.id,
          createdById: targetUser.id,
          status: "IN_PROGRESS",
          priority: "HIGH",
          estimatedHours: 60.0,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress: 50,
        },
      });
    }

    console.log("🎉 SUCCESS: Assigned Project Work Tasks seeded into MySQL database!");
    console.log("Seeded Tasks:", [task1.title, task2.title]);
  } catch (err: any) {
    console.error("❌ Error seeding assigned work tasks:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAssignedWorkTasks();
