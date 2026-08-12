import { getPrismaClient } from "../lib/prisma";

const prisma = getPrismaClient();

async function seedLocalDatabase() {
  console.log("⚡ Saving User & Project Data into Local XAMPP MySQL Database (oms)...");

  try {
    // 1. Save Department Data
    const devDept = await prisma.department.upsert({
      where: { code: "DEV" },
      update: {},
      create: {
        name: "Development & Engineering",
        code: "DEV",
        headName: "Aarav Sharma",
        budget: 500000,
      },
    });

    const hrDept = await prisma.department.upsert({
      where: { code: "HR" },
      update: {},
      create: {
        name: "Human Resources",
        code: "HR",
        headName: "Priya Sharma",
        budget: 300000,
      },
    });

    console.log("✓ Departments saved to local MySQL (department table)");

    // 2. Save User Data
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@oms.com" },
      update: {},
      create: {
        employeeId: "EMP001",
        name: "Roushan Verma",
        email: "admin@oms.com",
        password: "hashed_secure_password_123",
        phone: "+91 98765 43210",
        role: "SUPER_ADMIN",
        departmentId: devDept.id,
        salary: 150000,
        joiningDate: new Date("2023-01-01"),
        isProfileCompleted: true,
        documentsVerified: true,
      },
    });

    const devUser = await prisma.user.upsert({
      where: { email: "sneha@oms.com" },
      update: {},
      create: {
        employeeId: "EMP002",
        name: "Sneha Reddy",
        email: "sneha@oms.com",
        password: "hashed_secure_password_123",
        phone: "+91 98765 99887",
        role: "DEVELOPER",
        departmentId: devDept.id,
        salary: 85000,
        joiningDate: new Date("2024-02-15"),
        isProfileCompleted: true,
        documentsVerified: true,
      },
    });

    console.log("✓ User records saved to local MySQL (user table)");

    // 3. Save Client Data
    const clientAcme = await prisma.client.upsert({
      where: { companyName: "Acme Logistics Corp" },
      update: {},
      create: {
        companyName: "Acme Logistics Corp",
        contactPerson: "Alice Smith (VP Ops)",
        email: "alice@acme.com",
        phone: "+91 98765 11122",
        industry: "Logistics & Supply Chain",
        totalBilled: 250000,
      },
    });

    console.log("✓ Client records saved to local MySQL (client table)");

    // 4. Save Project Data
    const project1 = await prisma.project.create({
      data: {
        projectTitle: "OMS Enterprise Portal 2.0",
        clientCompany: clientAcme.companyName,
        clientContactPerson: clientAcme.contactPerson,
        clientEmail: clientAcme.email,
        clientPhone: clientAcme.phone,
        startDate: new Date(),
        endDate: new Date("2026-12-31"),
        contractValue: 250000,
        status: "IN_PROGRESS",
      },
    });

    const project2 = await prisma.project.create({
      data: {
        projectTitle: "Acme Corp Cloud Migration & Microservices",
        clientCompany: clientAcme.companyName,
        clientContactPerson: clientAcme.contactPerson,
        clientEmail: clientAcme.email,
        clientPhone: clientAcme.phone,
        startDate: new Date(),
        endDate: new Date("2026-11-15"),
        contractValue: 450000,
        status: "IN_PROGRESS",
      },
    });

    console.log("✓ Project records saved to local MySQL (project table)");

    // 5. Save Attendance Log Data
    await prisma.attendance.create({
      data: {
        userId: adminUser.id,
        date: new Date(),
        checkInTime: new Date(),
        checkOutTime: new Date(Date.now() + 8.5 * 3600 * 1000),
        hoursWorked: 8.5,
        status: "PRESENT",
      },
    });

    console.log("✓ Attendance logs saved to local MySQL (attendance table)");

    // 6. Save Intern Student Data
    await prisma.internstudent.create({
      data: {
        name: "Aditya Raj",
        university: "Delhi Technological University (DTU)",
        degree: "B.Tech Computer Science",
        department: "Development & Engineering",
        mentorName: "Aarav Sharma",
        stipend: 25000,
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-08-01"),
        daysCompleted: 90,
        totalDays: 90,
        performanceScore: 4.9,
        completedTasks: 18,
        totalTasks: 18,
        status: "Eligible for Full-Time Job",
        assignedProject: "OMS Enterprise Microservices API",
        offeredFullTimeSalary: 850000,
      },
    });

    console.log("✓ Intern Student records saved to local MySQL (internstudent table)");
    console.log("🎉 ALL USER AND PROJECT DATA SUCCESSFULLY SAVED TO LOCAL XAMPP MYSQL DATABASE!");
  } catch (err: any) {
    console.error("❌ Error saving data to local database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedLocalDatabase();
