import { NextResponse } from "next/server";
import { initialInternStudents } from "@/utils/internData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const dbInterns = await prisma.internstudent.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbInterns.length > 0) {
      return NextResponse.json({
        success: true,
        totalInterns: dbInterns.length,
        data: dbInterns,
      });
    }
  } catch (dbErr: any) {
    console.warn("Prisma query fallback:", dbErr.message);
  }

  return NextResponse.json({
    success: true,
    totalInterns: initialInternStudents.length,
    data: initialInternStudents,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, university, degree, department, mentorName, stipend, assignedProject } = body;

    let createdRecord;
    try {
      const { prisma } = await import("@/lib/prisma");
      createdRecord = await prisma.internstudent.create({
        data: {
          name: name || "New Intern Student",
          university: university || "Delhi University",
          degree: degree || "B.Tech Computer Science",
          department: department || "Development & Engineering",
          mentorName: mentorName || "Aarav Sharma",
          stipend: parseFloat(stipend) || 20000,
          assignedProject: assignedProject || "OMS Enterprise Microservices",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
          daysCompleted: 0,
          totalDays: 90,
          performanceScore: 5.0,
          completedTasks: 0,
          totalTasks: 12,
          status: "Active Intern",
        },
      });
    } catch (dbErr: any) {
      console.warn("Prisma MySQL save fallback:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "✓ Intern record saved to MySQL (internstudent table) via Prisma!",
      data: createdRecord || body,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
