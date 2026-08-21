import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim() || query.length < 2) {
      return NextResponse.json({ success: true, results: { employees: [], tasks: [], projects: [], departments: [] } });
    }

    const q = query.trim();

    // Query Employees
    const employees = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { employeeId: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        role: true,
      },
      take: 5,
    });

    // Query Tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { status: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        progress: true,
        assignedToUserId: true,
      },
      take: 5,
    });

    // Query Projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { projectTitle: { contains: q } },
          { clientCompany: { contains: q } },
        ],
      },
      select: {
        id: true,
        projectTitle: true,
        status: true,
        contractValue: true,
      },
      take: 5,
    });

    // Query Departments
    const departments = await prisma.department.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        headName: true,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      query: q,
      results: {
        employees,
        tasks,
        projects: projects.map((p: any) => ({
          id: p.id,
          name: p.projectTitle,
          status: p.status,
          budget: p.contractValue,
        })),
        departments,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
