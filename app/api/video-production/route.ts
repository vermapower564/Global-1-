import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.videoproductionitem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, count: videos.length, data: videos });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch video production items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectTitle, shootLocation, cameraLead, editorName, renderStage, versionUrl, status } = body;

    if (!projectTitle || !editorName) {
      return NextResponse.json(
        { success: false, error: "Project title and editor name are required" },
        { status: 400 }
      );
    }

    const created = await prisma.videoproductionitem.create({
      data: {
        projectTitle,
        shootLocation: shootLocation || "Studio HQ",
        cameraLead: cameraLead || "Camera Team Alpha",
        editorName,
        renderStage: renderStage || "4K Color Grade & Render",
        versionUrl: versionUrl || "https://vimeo.com/globalwebify/render-v1",
        status: status || "FINAL_APPROVED",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log video item" },
      { status: 500 }
    );
  }
}
