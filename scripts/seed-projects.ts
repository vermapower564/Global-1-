import { getPrismaClient } from "../lib/prisma";

const prisma = getPrismaClient();

async function saveProjectsToDatabase() {
  console.log("⚡ Inserting Project Records directly into local XAMPP MySQL database (oms)...");

  try {
    // 1. Ensure Client exists in XAMPP MySQL database
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

    const clientTechNova = await prisma.client.upsert({
      where: { companyName: "TechNova SaaS Inc" },
      update: {},
      create: {
        companyName: "TechNova SaaS Inc",
        contactPerson: "Bob Johnson (CTO)",
        email: "bob@technova.com",
        phone: "+91 98765 22233",
        industry: "Cloud & Software",
        totalBilled: 450000,
      },
    });

    console.log("✓ Client records verified in XAMPP MySQL (client table)");

    // 2. Insert 5 Complete Project Records into XAMPP MySQL database
    const project1 = await prisma.project.create({
      data: {
        projectTitle: "OMS Enterprise Portal 2.0",
        clientCompany: clientAcme.companyName,
        clientContactPerson: clientAcme.contactPerson,
        clientEmail: clientAcme.email,
        clientPhone: clientAcme.phone,
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-09-15"),
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
        startDate: new Date("2026-08-05"),
        endDate: new Date("2026-10-01"),
        contractValue: 450000,
        status: "IN_PROGRESS",
      },
    });

    const project3 = await prisma.project.create({
      data: {
        projectTitle: "TechNova AI Analytics Engine",
        clientCompany: clientTechNova.companyName,
        clientContactPerson: clientTechNova.contactPerson,
        clientEmail: clientTechNova.email,
        clientPhone: clientTechNova.phone,
        startDate: new Date("2026-08-10"),
        endDate: new Date("2026-11-30"),
        contractValue: 650000,
        status: "IN_PROGRESS",
      },
    });

    const project4 = await prisma.project.create({
      data: {
        projectTitle: "Global Finance Audit Automation",
        clientCompany: "Global Finance Ltd",
        clientContactPerson: "Amit Patel (Finance Lead)",
        clientEmail: "amit@globalfinance.com",
        clientPhone: "+91 98765 33344",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-08-20"),
        contractValue: 180000,
        status: "IN_PROGRESS",
      },
    });

    const project5 = await prisma.project.create({
      data: {
        projectTitle: "Obsidian Red UI Design & Mobile App",
        clientCompany: "Internal Enterprise Suite",
        clientContactPerson: "Ananya Roy (Design Lead)",
        clientEmail: "ananya@oms.com",
        clientPhone: "+91 98765 44455",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-12-31"),
        contractValue: 350000,
        status: "IN_PROGRESS",
      },
    });

    console.log("🎉 SUCCESS! 5 PROJECT RECORDS SAVED DIRECTLY TO XAMPP MYSQL DATABASE (project table)!");
    console.log("Saved Projects:", [
      project1.projectTitle,
      project2.projectTitle,
      project3.projectTitle,
      project4.projectTitle,
      project5.projectTitle,
    ]);
  } catch (err: any) {
    console.error("❌ Error saving projects to local database:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

saveProjectsToDatabase();
