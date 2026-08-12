import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/apiResponse";

const candidates = [
  { id: "CAN-101", name: "Aarav Sharma", role: "Senior Full Stack Dev", round: "Offer Sent", status: "Offer Accepted", date: "2026-08-01" },
  { id: "CAN-102", name: "Ananya Roy", role: "UI/UX Designer", round: "Technical Round", status: "In Evaluation", date: "2026-08-03" },
];

const companyAssets = [
  { id: "AST-801", name: "Apple MacBook Pro M3 Max 16\"", allocatedTo: "Roushan Verma (EMP-001)", category: "Laptop", serial: "C02G1234MD6R", status: "Assigned" },
  { id: "AST-802", name: "Dell XPS 15 4K Touch", allocatedTo: "Priya Sharma (EMP-002)", category: "Laptop", serial: "DLXPS987654", status: "Assigned" },
];

export async function GET() {
  return apiSuccess(
    {
      candidatesCount: candidates.length,
      assetsCount: companyAssets.length,
      candidates,
      companyAssets,
    },
    "HR ATS & IT Assets retrieved successfully."
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateName, role } = body;

    if (!candidateName || !role) {
      return apiError("Candidate Name and Role are required.", 400);
    }

    const newCandidate = {
      id: `CAN-${candidates.length + 101}`,
      name: candidateName,
      role,
      round: "Screening Round",
      status: "In Evaluation",
      date: new Date().toISOString().split("T")[0],
    };

    candidates.unshift(newCandidate);

    return apiSuccess(newCandidate, "Candidate added to ATS recruitment pipeline.", 201);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
