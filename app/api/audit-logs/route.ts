import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const logs = await prisma.auditlog.findMany({
      include: { user: { select: { name: true, employeeId: true, email: true, role: true } } },
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      count: 0,
      data: [],
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, action, details, ipAddress } = body;

    if (!action || !details) {
      return NextResponse.json(
        { success: false, error: "Action and details are required" },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const created = await prisma.auditlog.create({
      data: {
        userId: userId || null,
        action,
        details,
        ipAddress: ipAddress || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record audit log" },
      { status: 500 }
    );
  }
}
