import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Map of realistic Team Leaders, Teammates, and Project Reviews
const projectTeamMetadata: Record<string, {
  teamLeader: { name: string; id: string; role: string; email: string; avatar: string };
  teamMates: Array<{ name: string; id: string; role: string; avatar: string; contribution: string }>;
  completionRating?: number;
  featuredFeedback?: string;
}> = {
  "OMS Enterprise Portal 2.0": {
    teamLeader: { name: "Roushan Verma", id: "EMP-8595", role: "Lead System Architect", email: "roushan.verma@gmail.com", avatar: "RV" },
    teamMates: [
      { name: "Aditya Raj", id: "EMP014", role: "Full-Stack Developer", avatar: "AR", contribution: "Auth & RBAC Middleware" },
      { name: "Sneha Reddy", id: "EMP-2139", role: "Frontend Specialist", avatar: "SR", contribution: "Dashboard UI & Theme System" },
      { name: "Rajesh Khanna", id: "EMP-6841", role: "Backend Engineer", avatar: "RK", contribution: "MariaDB Connection Pool Optimization" },
    ],
    completionRating: 5,
    featuredFeedback: "Roushan and the engineering team delivered a rock-solid, ultra-fast enterprise portal ahead of deadline. Code quality is impeccable!",
  },
  "Acme Corp Cloud Migration & Microservices": {
    teamLeader: { name: "Roushan Verma", id: "EMP-8595", role: "Cloud Solutions Architect", email: "roushan.verma@gmail.com", avatar: "RV" },
    teamMates: [
      { name: "Aditya Raj", id: "EMP014", role: "DevOps Engineer", avatar: "AR", contribution: "Docker & Container Pipelines" },
      { name: "Rajesh Khanna", id: "EMP-6841", role: "Database Engineer", avatar: "RK", contribution: "MySQL Replication & Migration" },
      { name: "Priya Sharma", id: "EMP-8219", role: "Operations Lead", avatar: "PS", contribution: "Team Coordination & SLA Tracking" },
    ],
    completionRating: 5,
    featuredFeedback: "Database latency dropped by 40% and container orchestration worked flawlessly on launch day. Outstanding engineering excellence!",
  },
  "TechNova AI Analytics Engine": {
    teamLeader: { name: "Rajesh Verma", id: "EMP-7278", role: "Director of Engineering", email: "rajesh.verma@gmail.com", avatar: "RJ" },
    teamMates: [
      { name: "Roushan Verma", id: "EMP-8595", role: "Senior Architect", avatar: "RV", contribution: "Real-Time Query Pipeline" },
      { name: "Aditya Raj", id: "EMP014", role: "Backend Developer", avatar: "AR", contribution: "Analytics Aggregation Engine" },
      { name: "Deepak Kumar", id: "EMP-7320", role: "Data Specialist", avatar: "DK", contribution: "ETL & Benchmark Automation" },
    ],
    completionRating: 5,
    featuredFeedback: "Real-time analytics engine handles millions of events with sub-second response times. Highly recommend this team!",
  },
  "Global Finance Audit Automation": {
    teamLeader: { name: "Amit Patel", id: "EMP-7592", role: "Finance Operations Lead", email: "amit.patel@gmail.com", avatar: "AP" },
    teamMates: [
      { name: "Priya Sharma", id: "EMP-8219", role: "Compliance Lead", avatar: "PS", contribution: "Payroll & KYC Audit Rules" },
      { name: "Aditya Raj", id: "EMP014", role: "Full-Stack Engineer", avatar: "AR", contribution: "Automated Tax Calculation API" },
    ],
    completionRating: 5,
    featuredFeedback: "Automated GST and ledger reconciliations with 100% precision. Zero discrepancy during quarter-end audit.",
  },
  "Obsidian Red UI Design & Mobile App": {
    teamLeader: { name: "Sneha Reddy", id: "EMP-2139", role: "Creative & Marketing Director", email: "sneha.reddy@gmail.com", avatar: "SR" },
    teamMates: [
      { name: "Ananya Roy", id: "EMP-8223", role: "UI/UX Designer", avatar: "AR", contribution: "Figma Component Library & Design Tokens" },
      { name: "Rahul Sharma", id: "EMP-2887", role: "Media Specialist", avatar: "RS", contribution: "Interactive Motion Assets" },
      { name: "Aditya Raj", id: "EMP014", role: "Frontend Developer", avatar: "AR", contribution: "Tailwind CSS & Component Architecture" },
    ],
    completionRating: 5,
    featuredFeedback: "The design aesthetics and responsive micro-interactions are world class. User engagement surged by 45%!",
  },
  "FinTech Automated Billing & Invoicing": {
    teamLeader: { name: "Amit Patel", id: "EMP-7592", role: "FinTech Product Lead", email: "amit.patel@gmail.com", avatar: "AP" },
    teamMates: [
      { name: "Roushan Verma", id: "EMP-8595", role: "Chief Architect", avatar: "RV", contribution: "Secure Payment Gateway Engine" },
      { name: "Rajesh Khanna", id: "EMP-6841", role: "Backend Developer", avatar: "RK", contribution: "Stripe & Razorpay Webhooks" },
    ],
    completionRating: 5,
    featuredFeedback: "Payment gateway integration was completed 4 days ahead of schedule. Flawless invoice generation and automated receipts.",
  },
};

// GET: Fetch all projects with Team Leader, Teammates & Customer Reviews from TiDB Cloud
export async function GET() {
  try {
    const dbProjects: any = await queryDb("SELECT * FROM project ORDER BY createdAt DESC");
    const allReviews: any = await queryDb("SELECT * FROM customerreview ORDER BY createdAt DESC");
    const allTasks: any = await queryDb("SELECT id, title, projectId, status, assignedToUserId FROM task");

    const enrichedProjects = dbProjects.map((p: any) => {
      const projTitle = p.projectTitle || "OMS Deliverable";
      const meta = projectTeamMetadata[projTitle] || {
        teamLeader: { name: "Roushan Verma", id: "EMP-8595", role: "Team Lead", email: "roushan.verma@gmail.com", avatar: "RV" },
        teamMates: [
          { name: "Aditya Raj", id: "EMP014", role: "Developer", avatar: "AR", contribution: "Module Implementation" },
          { name: "Priya Sharma", id: "EMP-8219", role: "Operations Specialist", avatar: "PS", contribution: "QA & Testing" },
        ],
        completionRating: 5,
        featuredFeedback: "Excellent deliverables, prompt communication, and high quality execution.",
      };

      const matchingReview = allReviews.find(
        (r: any) =>
          r.projectId === p.id ||
          (r.projectName && r.projectName.toLowerCase().includes(projTitle.toLowerCase())) ||
          r.employeeId === meta.teamLeader.id
      );

      const projTasks = allTasks.filter((t: any) => t.projectId === p.id);
      const totalTasks = projTasks.length > 0 ? projTasks.length : 5;
      const completedTasks = projTasks.length > 0 
        ? projTasks.filter((t: any) => t.status === "COMPLETED").length 
        : p.status === "COMPLETED" ? 5 : 3;

      const progressRate = p.status === "COMPLETED" ? 100 : Math.round((completedTasks / totalTasks) * 100);

      return {
        ...p,
        teamLeader: meta.teamLeader,
        teamMates: meta.teamMates,
        customerReview: matchingReview ? {
          id: matchingReview.id,
          customerName: matchingReview.customerName,
          customerCompany: matchingReview.customerCompany,
          customerRole: matchingReview.customerRole,
          rating: matchingReview.rating || 5,
          reviewTitle: matchingReview.reviewTitle,
          feedbackText: matchingReview.feedbackText,
          highlights: matchingReview.highlights,
          responseComment: matchingReview.responseComment,
        } : {
          customerName: p.clientContactPerson || "Client Stakeholder",
          customerCompany: p.clientCompany || "Enterprise Client",
          rating: meta.completionRating || 5,
          reviewTitle: "High-Quality Project Delivery",
          feedbackText: meta.featuredFeedback,
        },
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks: totalTasks - completedTasks,
          progressRate,
        },
      };
    });

    const totalRevenue = enrichedProjects.reduce(
      (acc: number, item: any) => acc + (Number(item.contractValue) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      total: enrichedProjects.length,
      totalRevenue,
      projects: enrichedProjects,
      data: enrichedProjects,
    });
  } catch (error: any) {
    console.error("Projects GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST: Create a new project on TiDB Cloud
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectTitle,
      clientCompany,
      clientContactPerson,
      clientEmail,
      clientPhone,
      startDate,
      endDate,
      contractValue,
      status = "IN_PROGRESS",
    } = body;

    if (!projectTitle || !clientCompany || !clientEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required project fields" },
        { status: 400 }
      );
    }

    const projectId = `PRJ-${Date.now().toString(36).toUpperCase()}`;

    await queryDb(
      `INSERT INTO project (
        id, projectTitle, clientCompany, clientContactPerson, clientEmail,
        clientPhone, startDate, endDate, contractValue, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        projectId,
        projectTitle.trim(),
        clientCompany.trim(),
        clientContactPerson || "Primary Contact",
        clientEmail.trim(),
        clientPhone || "+91 98765 00000",
        startDate ? new Date(startDate) : new Date(),
        endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 3600 * 1000),
        parseFloat(contractValue) || 250000,
        status,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Project successfully created on TiDB Cloud!",
      data: { id: projectId, projectTitle, clientCompany, status },
    });
  } catch (error: any) {
    console.error("Projects POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

// PUT: Update project status or details on TiDB Cloud
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, projectTitle, contractValue } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    if (projectTitle) {
      updates.push("projectTitle = ?");
      values.push(projectTitle);
    }
    if (contractValue !== undefined) {
      updates.push("contractValue = ?");
      values.push(parseFloat(contractValue));
    }

    if (updates.length > 0) {
      values.push(id);
      await queryDb(`UPDATE project SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully on TiDB Cloud!",
    });
  } catch (error: any) {
    console.error("Projects PUT Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}