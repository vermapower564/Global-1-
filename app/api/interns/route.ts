import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const interns = await prisma.internstudent.findMany({
      include: { internassignment: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, count: interns.length, data: interns });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch intern students" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, university, degree, department, mentorName, stipend, assignedProject, offeredFullTimeSalary } = body;

    if (!name || !university) {
      return NextResponse.json(
        { success: false, error: "Intern name and university are required" },
        { status: 400 }
      );
    }

    const created = await prisma.internstudent.create({
      data: {
        name,
        university,
        degree: degree || "B.Tech Computer Science",
        department: department || "Engineering",
        mentorName: mentorName || "Aditya Raj",
        stipend: parseFloat(stipend) || 20000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        assignedProject: assignedProject || "OMS Web Applications",
        offeredFullTimeSalary: parseFloat(offeredFullTimeSalary) || 750000,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enroll intern student" },
      { status: 500 }
    );
  }
}
