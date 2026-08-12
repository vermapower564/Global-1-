import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.designasset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, count: assets.length, data: assets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch design assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetTitle, platform, format, designerName, assetUrl, status } = body;

    if (!assetTitle || !designerName) {
      return NextResponse.json(
        { success: false, error: "Asset title and designer name are required" },
        { status: 400 }
      );
    }

    const created = await prisma.designasset.create({
      data: {
        assetTitle,
        platform: platform || "Figma & Adobe CC",
        format: format || "SVG / PNG",
        designerName,
        assetUrl: assetUrl || "https://figma.com/file/oms-design-system",
        status: status || "APPROVED",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create design asset" },
      { status: 500 }
    );
  }
}
