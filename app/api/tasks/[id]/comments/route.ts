import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const comments = await prisma.taskcomment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, employeeId: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, total: comments.length, comments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commentText } = body;

    if (!commentText || !commentText.trim()) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty." }, { status: 400 });
    }

    const postingUser = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: { name: true },
    });

    const userName = postingUser?.name || authResult.user.email;

    // Add comment & record history event in transaction
    const [comment] = await prisma.$transaction([
      prisma.taskcomment.create({
        data: {
          taskId,
          userId: authResult.user.id,
          commentText: commentText.trim(),
        },
        include: {
          user: { select: { id: true, name: true, employeeId: true, role: true } },
        },
      }),
      prisma.taskhistory.create({
        data: {
          taskId,
          userId: authResult.user.id,
          action: "COMMENT_ADDED",
          description: `${userName} commented: "${commentText.trim().substring(0, 50)}..."`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
