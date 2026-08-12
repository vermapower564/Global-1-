import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    system: "OMS Enterprise Platform API",
    version: "2.4.0",
    database: "MySQL (Prisma ORM)",
    timestamp: new Date().toISOString(),
  });
}
