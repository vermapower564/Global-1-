import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.itasset.findMany({
      include: { user: { select: { name: true, employeeId: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, count: assets.length, data: assets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch IT assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetName, category, serialNumber, allocatedToUserId, status } = body;

    if (!assetName || !serialNumber) {
      return NextResponse.json(
        { success: false, error: "Asset name and serial number are required" },
        { status: 400 }
      );
    }

    const created = await prisma.itasset.create({
      data: {
        assetName,
        category: category || "Hardware Laptop",
        serialNumber,
        allocatedToUserId: allocatedToUserId || null,
        status: status || (allocatedToUserId ? "Assigned" : "Available"),
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register IT asset" },
      { status: 500 }
    );
  }
}
