import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "mysql://root:@localhost:3306/oms";
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function safeDepartmentSeed(name: string, code: string, budget: number, headName: string) {
  let existing = await prisma.department.findFirst({
    where: {
      OR: [{ name }, { code }],
    },
  });
  if (!existing) {
    existing = await prisma.department.create({
      data: {
        id: `DEP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        name,
        code,
        budget,
        headName,
      },
    });
  }
  return existing;
}

async function main() {
  console.log("🌱 Starting Safe OMS Production Database Seeding...");

  // 1. Seed Departments Safely
  const deptEng = await safeDepartmentSeed("Development & Engineering", "DEP-ENG", 2500000, "Roushan Verma");
  const deptHR = await safeDepartmentSeed("Human Resources", "DEP-HR", 800000, "Priya Sharma");
  const deptFin = await safeDepartmentSeed("Accounts & Finance", "DEP-FIN", 1200000, "Amitabh Sen");
  const deptSales = await safeDepartmentSeed("Growth & Sales", "DEP-SALES", 1500000, "Vikram Malhotra");

  console.log("✓ Departments verified & seeded.");

  // 2. Seed Admin & Staff Users
  const defaultPasswordHash = await bcrypt.hash("Admin@123456", 10);

  const adminEmail = "admin@globalwebify.com";
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        id: "USR-001",
        employeeId: "EMP001",
        name: "Roushan Verma",
        email: adminEmail,
        password: defaultPasswordHash,
        phone: "+91 98765 43210",
        role: "SUPER_ADMIN",
        departmentId: deptEng.id,
        salary: 1500000,
        isActive: true,
        documentsVerified: true,
        isProfileCompleted: true,
      },
    });
  }

  const hrEmail = "priya.hr@globalwebify.com";
  let hrUser = await prisma.user.findUnique({ where: { email: hrEmail } });
  if (!hrUser) {
    hrUser = await prisma.user.create({
      data: {
        id: "USR-002",
        employeeId: "EMP002",
        name: "Priya Sharma",
        email: hrEmail,
        password: defaultPasswordHash,
        phone: "+91 98765 43211",
        role: "HR",
        departmentId: deptHR.id,
        salary: 850000,
        isActive: true,
        documentsVerified: true,
        isProfileCompleted: true,
      },
    });
  }

  const devEmail = "aditya.dev@globalwebify.com";
  let devUser = await prisma.user.findUnique({ where: { email: devEmail } });
  if (!devUser) {
    devUser = await prisma.user.create({
      data: {
        id: "USR-003",
        employeeId: "EMP014",
        name: "Aditya Raj",
        email: devEmail,
        password: defaultPasswordHash,
        phone: "+91 98765 43212",
        role: "DEVELOPER",
        departmentId: deptEng.id,
        managerId: adminUser.id,
        salary: 950000,
        isActive: true,
        documentsVerified: true,
        isProfileCompleted: true,
      },
    });
  }

  console.log("✓ Core Admin & Staff Users verified & seeded.");

  // 3. Seed Clients
  let clientAcme = await prisma.client.findUnique({ where: { email: "contact@acmelogistics.com" } });
  if (!clientAcme) {
    clientAcme = await prisma.client.create({
      data: {
        id: "CLI-101",
        companyName: "Acme Logistics Corp",
        contactPerson: "Alice Smith (VP Ops)",
        email: "contact@acmelogistics.com",
        phone: "+91 98111 22233",
        industry: "Supply Chain & Logistics",
        totalBilled: 2450000,
      },
    });
  }

  console.log("✓ Clients verified & seeded.");

  // 4. Seed SEO Keywords
  const seoKeyword = "operations management software india";
  const existingSeo = await prisma.seokeyword.findUnique({ where: { keyword: seoKeyword } });
  if (!existingSeo) {
    await prisma.seokeyword.create({
      data: {
        id: "SEO-001",
        keyword: seoKeyword,
        searchVolume: "14,500/mo",
        currentRank: 3,
        previousRank: 8,
        targetUrl: "https://globalwebify.com/oms",
        status: "Improving",
      },
    });
  }

  // 5. Seed Dev Commit Tracker
  const commitHash = "6c1c7b7a";
  const existingCommit = await prisma.devcommittracker.findUnique({ where: { commitHash } });
  if (!existingCommit && devUser) {
    await prisma.devcommittracker.create({
      data: {
        id: "DEV-101",
        userId: devUser.id,
        commitHash,
        repository: "vermapower564/Global-1-",
        branch: "main",
        linesAdded: 340,
        linesDeleted: 22,
        commitMessage: "feat: Add full-stack Prisma ORM database models and Nodemailer SMTP transporter",
      },
    });
  }

  // 6. Seed IT Asset
  const serialNo = "MAC-M3-99812";
  const existingAsset = await prisma.itasset.findUnique({ where: { serialNumber: serialNo } });
  if (!existingAsset && devUser) {
    await prisma.itasset.create({
      data: {
        id: "AST-201",
        assetName: "MacBook Pro 16 M3 Max",
        category: "Laptop",
        serialNumber: serialNo,
        allocatedToUserId: devUser.id,
        status: "Assigned",
      },
    });
  }

  // 7. Seed Intern Student
  const existingIntern = await prisma.internstudent.findUnique({ where: { id: "INT-501" } });
  if (!existingIntern) {
    const intern1 = await prisma.internstudent.create({
      data: {
        id: "INT-501",
        name: "Siddharth Kumar",
        university: "IIT Kharagpur",
        degree: "B.Tech Computer Science",
        department: "Engineering",
        mentorName: "Aditya Raj",
        stipend: 25000,
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
        daysCompleted: 72,
        totalDays: 90,
        performanceScore: 4.8,
        completedTasks: 10,
        totalTasks: 12,
        status: "Active Intern",
        assignedProject: "OMS React 19 Frontend Components",
        githubRepo: "https://github.com/intern/oms-components",
        offeredFullTimeSalary: 850000,
      },
    });

    await prisma.internassignment.create({
      data: {
        id: "ASN-101",
        internStudentId: intern1.id,
        taskTitle: "Build Reusable DataTable UI with Filter & Export",
        dueDate: new Date("2026-08-20"),
        githubRepo: "https://github.com/intern/datatable-component",
        status: "Submitted",
        grade: "A+",
        mentorFeedback: "Excellent code quality, follow-up unit tests added cleanly.",
      },
    });
  }

  // 8. Seed Audit Log
  if (adminUser) {
    await prisma.auditlog.create({
      data: {
        id: `AUD-${Date.now()}`,
        userId: adminUser.id,
        action: "DATABASE_SEED",
        details: "Production database seed completed safely.",
        ipAddress: "127.0.0.1",
      },
    });
  }

  console.log("🎉 Complete OMS Production Database Seed Successful!");
}

main()
  .catch((e) => {
    console.error("❌ Database Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
