import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const keywords = await prisma.seokeyword.findMany({
      orderBy: { currentRank: "asc" },
    });
    return NextResponse.json({ success: true, count: keywords.length, data: keywords });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch SEO keywords" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyword, searchVolume, currentRank, previousRank, targetUrl, status } = body;

    if (!keyword || !targetUrl) {
      return NextResponse.json(
        { success: false, error: "Keyword and Target URL are required" },
        { status: 400 }
      );
    }

    const created = await prisma.seokeyword.create({
      data: {
        keyword,
        searchVolume: searchVolume || "5,000/mo",
        currentRank: parseInt(currentRank) || 10,
        previousRank: parseInt(previousRank) || 15,
        targetUrl,
        status: status || "Improving",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create SEO keyword" },
      { status: 500 }
    );
  }
}
