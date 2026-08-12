import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const commits = await prisma.devcommittracker.findMany({
      include: { user: { select: { name: true, employeeId: true, email: true } } },
      orderBy: { committedAt: "desc" },
    });
    return NextResponse.json({ success: true, count: commits.length, data: commits });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch dev commit tracker logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, commitHash, repository, branch, linesAdded, linesDeleted, commitMessage } = body;

    const devUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst({ where: { role: "DEVELOPER" } });

    if (!devUser) {
      return NextResponse.json(
        { success: false, error: "Valid developer user is required" },
        { status: 400 }
      );
    }

    const created = await prisma.devcommittracker.create({
      data: {
        userId: devUser.id,
        commitHash: commitHash || Math.random().toString(36).substring(2, 10),
        repository: repository || "vermapower564/Global-1-",
        branch: branch || "main",
        linesAdded: parseInt(linesAdded) || 45,
        linesDeleted: parseInt(linesDeleted) || 5,
        commitMessage: commitMessage || "feat: Code commit update",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log dev commit" },
      { status: 500 }
    );
  }
}
