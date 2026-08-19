import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authMiddleware";
import { maskAccountNumber } from "@/lib/bankHelper";

export const dynamic = "force-dynamic";

// GET: Logged in employee retrieves their own bank details
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: { bankDetail: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.bankDetail) {
      return NextResponse.json({
        success: true,
        hasBankDetails: false,
        bankDetails: null,
      });
    }

    const bd = user.bankDetail;

    return NextResponse.json({
      success: true,
      hasBankDetails: true,
      bankDetails: {
        accountHolderName: bd.accountHolderName,
        bankName: bd.bankName,
        accountNumberMasked: maskAccountNumber(bd.accountNumber),
        ifscCode: bd.ifscCode,
        branchName: bd.branchName || "Main Branch",
        accountType: bd.accountType || "Savings",
        updatedAt: bd.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Employee GET Bank Details Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve your bank details." },
      { status: 500 }
    );
  }
}
