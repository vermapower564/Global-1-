import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function persistAllDatabaseData() {
  console.log("💾 Persisting and Synchronizing All OMS Enterprise Data into MySQL Database...\n");

  try {
    // 1. Synchronize Departments
    const departments = [
      { name: "Development & Engineering", code: "ENG", headName: "Roushan Verma", budget: 2500000 },
      { name: "Human Resources", code: "HR", headName: "Priya Sharma", budget: 1200000 },
      { name: "Accounts & Finance", code: "FIN", headName: "Amit Kumar", budget: 1800000 },
      { name: "Growth & Sales", code: "SALES", headName: "Vikram Singh", budget: 2000000 },
      { name: "UI/UX & Graphic Design", code: "DESIGN", headName: "Neha Gupta", budget: 1000000 },
      { name: "Executive Management", code: "EXEC", headName: "Director Board", budget: 5000000 },
      { name: "Camera & Video Production", code: "MEDIA", headName: "Kunal Verma", budget: 1500000 },
      { name: "Digital Marketing", code: "MKT", headName: "Ananya Roy", budget: 1400000 },
    ];

    const deptMap: { [name: string]: string } = {};

    for (const d of departments) {
      let dept = await prisma.department.findFirst({ where: { name: d.name } });
      if (!dept) {
        dept = await prisma.department.create({ data: d });
        console.log(`✓ [Department Created] ${d.name} (${d.code})`);
      } else {
        console.log(`✓ [Department Verified] ${d.name}`);
      }
      deptMap[d.name] = dept.id;
    }

    // 2. Hash Default Password
    const defaultPasswordHash = await bcrypt.hash("Password@123", 10);
    const adminPasswordHash = await bcrypt.hash("Roushan@123", 10);

    // 3. Complete Workforce Staff Roster matching user_role enum
    const workforce = [
      {
        employeeId: "EMP-8595",
        name: "Roushan Verma",
        email: "roushan.verma@gmail.com",
        password: adminPasswordHash,
        phone: "+91 98765 85950",
        role: "SUPER_ADMIN" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 1500000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP014",
        name: "Aditya Raj",
        email: "aditya.raj@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 00014",
        role: "DEVELOPER" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 850000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8218",
        name: "Salman Khan",
        email: "salman.khan@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08218",
        role: "SALES_MANAGER" as const,
        departmentId: deptMap["Growth & Sales"],
        salary: 950000,
        paymentScheduleDay: 5,
      },
      {
        employeeId: "EMP-8219",
        name: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08219",
        role: "HR" as const,
        departmentId: deptMap["Human Resources"],
        salary: 750000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8220",
        name: "Amit Kumar",
        email: "amit.kumar@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08220",
        role: "FINANCE" as const,
        departmentId: deptMap["Accounts & Finance"],
        salary: 900000,
        paymentScheduleDay: 10,
      },
      {
        employeeId: "EMP-8221",
        name: "Neha Gupta",
        email: "neha.gupta@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08221",
        role: "UI_UX_DESIGNER" as const,
        departmentId: deptMap["UI/UX & Graphic Design"],
        salary: 800000,
        paymentScheduleDay: 7,
      },
      {
        employeeId: "EMP-8222",
        name: "Vikram Singh",
        email: "vikram.singh@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08222",
        role: "PROJECT_MANAGER" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 1200000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8223",
        name: "Ananya Roy",
        email: "ananya.roy@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08223",
        role: "DIGITAL_MARKETING_MANAGER" as const,
        departmentId: deptMap["Digital Marketing"],
        salary: 650000,
        paymentScheduleDay: 5,
      },
      {
        employeeId: "EMP-8224",
        name: "Kunal Verma",
        email: "kunal.verma@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08224",
        role: "VIDEO_EDITOR" as const,
        departmentId: deptMap["Camera & Video Production"],
        salary: 700000,
        paymentScheduleDay: 7,
      },
      {
        employeeId: "EMP-8225",
        name: "Rahul Mehra",
        email: "rahul.mehra@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08225",
        role: "DEVELOPER" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 820000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8226",
        name: "Sneha Patel",
        email: "sneha.patel@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08226",
        role: "DEVELOPER" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 680000,
        paymentScheduleDay: 5,
      },
      {
        employeeId: "EMP-8227",
        name: "Rohit Bansal",
        email: "rohit.bansal@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08227",
        role: "SALES_EXECUTIVE" as const,
        departmentId: deptMap["Growth & Sales"],
        salary: 550000,
        paymentScheduleDay: 10,
      },
      {
        employeeId: "EMP-8228",
        name: "Pooja Hegde",
        email: "pooja.hegde@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08228",
        role: "HR" as const,
        departmentId: deptMap["Human Resources"],
        salary: 500000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8229",
        name: "Suresh Raina",
        email: "suresh.raina@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08229",
        role: "DIRECTOR" as const,
        departmentId: deptMap["Executive Management"],
        salary: 1100000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8230",
        name: "Deepak Chahar",
        email: "deepak.chahar@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08230",
        role: "DEVELOPER" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 950000,
        paymentScheduleDay: 5,
      },
      {
        employeeId: "EMP-8231",
        name: "Rishabh Pant",
        email: "rishabh.pant@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08231",
        role: "DEVELOPER" as const,
        departmentId: deptMap["Development & Engineering"],
        salary: 880000,
        paymentScheduleDay: 1,
      },
      {
        employeeId: "EMP-8232",
        name: "Hardik Pandya",
        email: "hardik.pandya@gmail.com",
        password: defaultPasswordHash,
        phone: "+91 98765 08232",
        role: "FINANCE" as const,
        departmentId: deptMap["Accounts & Finance"],
        salary: 620000,
        paymentScheduleDay: 10,
      },
    ];

    console.log(`\n👥 Saving ${workforce.length} Workforce Employee Records...`);

    const createdUsers: any[] = [];

    for (const w of workforce) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ employeeId: w.employeeId }, { email: w.email }],
        },
      });

      let userRecord;
      if (!existing) {
        userRecord = await prisma.user.create({
          data: {
            employeeId: w.employeeId,
            name: w.name,
            email: w.email,
            password: w.password,
            phone: w.phone,
            role: w.role,
            departmentId: w.departmentId,
            salary: w.salary,
            paymentScheduleDay: w.paymentScheduleDay,
            isActive: true,
            isProfileCompleted: true,
            documentsVerified: true,
            joiningDate: new Date("2025-01-01"),
          },
        });
        console.log(`  ✓ Created Employee: ${w.name} (${w.employeeId})`);
      } else {
        userRecord = await prisma.user.update({
          where: { id: existing.id },
          data: {
            employeeId: w.employeeId,
            name: w.name,
            email: w.email,
            role: w.role,
            departmentId: w.departmentId,
            salary: w.salary,
            paymentScheduleDay: w.paymentScheduleDay,
            isActive: true,
          },
        });
        console.log(`  ✓ Updated Employee: ${w.name} (${w.employeeId})`);
      }
      createdUsers.push(userRecord);
    }

    // 4. Seed Monthly Salary Slips for All Employees
    console.log("\n💳 Saving Monthly Payment Slips for All Workforce Members...");
    const months = [
      { monthName: "August 2026", monthKey: "2026-08", status: "PAID", paymentDate: new Date("2026-08-01") },
      { monthName: "July 2026", monthKey: "2026-07", status: "PAID", paymentDate: new Date("2026-07-01") },
      { monthName: "September 2026", monthKey: "2026-09", status: "SCHEDULED", paymentDate: new Date("2026-09-01") },
    ];

    for (const u of createdUsers) {
      const monthlyRate = Math.round((u.salary || 600000) / 12);
      const basicSalary = Math.round(monthlyRate * 0.5);
      const hra = Math.round(monthlyRate * 0.3);
      const allowances = Math.round(monthlyRate * 0.15);
      const bonus = Math.round(monthlyRate * 0.05);
      const overtime = 0;
      const grossSalary = basicSalary + hra + allowances + bonus + overtime;

      const pfDeduction = Math.round(basicSalary * 0.12);
      const taxDeduction = Math.round(grossSalary * 0.05);
      const otherDeductions = 0;
      const totalDeductions = pfDeduction + taxDeduction + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      for (const m of months) {
        await prisma.salaryslip.upsert({
          where: {
            userId_monthKey: {
              userId: u.id,
              monthKey: m.monthKey,
            },
          },
          update: {
            basicSalary,
            hra,
            allowances,
            bonus,
            overtime,
            grossSalary,
            pfDeduction,
            taxDeduction,
            otherDeductions,
            totalDeductions,
            netSalary,
            paymentStatus: m.status,
            paymentDate: m.status === "PAID" ? m.paymentDate : null,
          },
          create: {
            userId: u.id,
            employeeId: u.employeeId || u.id,
            employeeName: u.name,
            salaryMonth: m.monthName,
            monthKey: m.monthKey,
            basicSalary,
            hra,
            allowances,
            bonus,
            overtime,
            grossSalary,
            pfDeduction,
            taxDeduction,
            otherDeductions,
            totalDeductions,
            netSalary,
            paymentDate: m.status === "PAID" ? m.paymentDate : null,
            paymentStatus: m.status,
            paymentMethod: "DIRECT_BANK_TRANSFER",
            transactionReference: m.status === "PAID" ? `TXN-ZYV-${u.employeeId || "EMP"}-${m.monthKey}` : null,
          },
        });
      }
    }
    console.log(`  ✓ Generated 3-month salary slips for ${createdUsers.length} staff members.`);

    // 5. Seed Attendance Punch Clock Records
    console.log("\n⏰ Saving Shift Attendance Punch Clock Records...");
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    for (const u of createdUsers) {
      const existingAtt = await prisma.attendance.findFirst({
        where: { userId: u.id },
      });

      if (!existingAtt) {
        await prisma.attendance.create({
          data: {
            userId: u.id,
            date: today,
            checkInTime: today,
            checkOutTime: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
            hoursWorked: 8.5,
            status: "PRESENT",
          },
        });
      }
    }
    console.log(`  ✓ Attendance records synchronized for all ${createdUsers.length} employees.`);

    // 6. Seed Projects & Tasks
    console.log("\n📂 Saving Corporate Projects & Work Tasks...");
    const defaultProjects = [
      {
        projectTitle: "OMS Enterprise Portal 2.0 Engine",
        clientCompany: "ZYVORO TECH",
        clientContactPerson: "Roushan Verma",
        clientEmail: "roushan.verma@gmail.com",
        clientPhone: "+91 98765 85950",
        contractValue: 3500000,
        status: "IN_PROGRESS",
      },
      {
        projectTitle: "Acme Cloud Migration & Dockerization",
        clientCompany: "ACME CORP",
        clientContactPerson: "John Doe",
        clientEmail: "john.doe@acme.com",
        clientPhone: "+1 555 123 4567",
        contractValue: 2800000,
        status: "IN_PROGRESS",
      },
      {
        projectTitle: "FinTech Automated Billing & Invoicing",
        clientCompany: "FINVEST LTD",
        clientContactPerson: "Alice Smith",
        clientEmail: "alice.smith@finvest.com",
        clientPhone: "+44 20 7946 0912",
        contractValue: 4200000,
        status: "IN_PROGRESS",
      },
    ];

    for (const p of defaultProjects) {
      let proj = await prisma.project.findFirst({ where: { projectTitle: p.projectTitle } });
      if (!proj) {
        proj = await prisma.project.create({
          data: {
            projectTitle: p.projectTitle,
            clientCompany: p.clientCompany,
            clientContactPerson: p.clientContactPerson,
            clientEmail: p.clientEmail,
            clientPhone: p.clientPhone,
            contractValue: p.contractValue,
            status: p.status,
            startDate: new Date("2026-06-01"),
            endDate: new Date("2026-10-31"),
          },
        });
        console.log(`  ✓ Created Project: ${p.projectTitle}`);
      }
    }

    // 7. Seed Tasks
    const adminUser = createdUsers.find((u) => u.employeeId === "EMP-8595") || createdUsers[0];
    const devUser = createdUsers.find((u) => u.employeeId === "EMP014") || createdUsers[1];

    if (adminUser) {
      await prisma.task.upsert({
        where: { id: "TSK-PERSIST-101" },
        update: {
          title: "OMS Enterprise Portal 2.0 Engine & Role-Based Access Control",
          description: "Full-stack implementation of Next.js 16 app router architecture, Prisma MySQL ORM models, and employee portal.",
          status: "IN_PROGRESS",
          priority: "CRITICAL",
          estimatedHours: 80.0,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress: 45,
        },
        create: {
          id: "TSK-PERSIST-101",
          title: "OMS Enterprise Portal 2.0 Engine & Role-Based Access Control",
          description: "Full-stack implementation of Next.js 16 app router architecture, Prisma MySQL ORM models, and employee portal.",
          assignedToUserId: adminUser.id,
          createdById: adminUser.id,
          status: "IN_PROGRESS",
          priority: "CRITICAL",
          estimatedHours: 80.0,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress: 45,
        },
      });

      if (devUser) {
        await prisma.task.upsert({
          where: { id: "TSK-PERSIST-102" },
          update: {
            title: "Frontend UI Components & Responsive Navigation Controls",
            description: "Development of reusable React 19 UI widgets and responsive table views.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            estimatedHours: 60.0,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            progress: 60,
          },
          create: {
            id: "TSK-PERSIST-102",
            title: "Frontend UI Components & Responsive Navigation Controls",
            description: "Development of reusable React 19 UI widgets and responsive table views.",
            assignedToUserId: devUser.id,
            createdById: adminUser.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            estimatedHours: 60.0,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            progress: 60,
          },
        });
      }
    }

    // 8. Seed Audit Logs
    console.log("\n📜 Saving System Audit Logs...");
    await prisma.auditlog.create({
      data: {
        action: "DATABASE_SYNC_ALL",
        details: `Successfully synchronized and persisted ${createdUsers.length} employee accounts, departments, salary slips, attendance records, and project tasks into MySQL database.`,
        ipAddress: "127.0.0.1",
      },
    });

    console.log("\n=======================================================");
    console.log("🎉 ALL DATA HAS BEEN SUCCESSFULLY SAVED INTO DATABASE!");
    console.log("=======================================================\n");
  } catch (error) {
    console.error("❌ Error persisting database data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

persistAllDatabaseData();
