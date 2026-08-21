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

// PUT / POST: Logged in employee updates their own verified bank details
export async function PUT(request: NextRequest) {
  return handleUpdateOwnBankDetails(request);
}

export async function POST(request: NextRequest) {
  return handleUpdateOwnBankDetails(request);
}

async function handleUpdateOwnBankDetails(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName = "Main Branch",
      accountType = "Savings",
    } = body;

    const { validateBankDetails } = await import("@/lib/bankHelper");
    const validation = validateBankDetails({ accountHolderName, bankName, accountNumber, ifscCode });
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid banking details provided." },
        { status: 400 }
      );
    }

    const cleanAcc = accountNumber.trim().replace(/\s+/g, "");
    const cleanIfsc = ifscCode.trim().toUpperCase();
    const cleanHolder = accountHolderName.trim();
    const cleanBank = bankName.trim();
    const cleanBranch = branchName.trim();

    const existingBank = await prisma.bankdetail.findUnique({
      where: { userId },
    });

    let savedDetail;
    if (existingBank) {
      savedDetail = await prisma.bankdetail.update({
        where: { userId },
        data: {
          accountHolderName: cleanHolder,
          bankName: cleanBank,
          accountNumber: cleanAcc,
          ifscCode: cleanIfsc,
          branchName: cleanBranch,
          accountType,
          isActive: true,
        },
      });
    } else {
      savedDetail = await prisma.bankdetail.create({
        data: {
          userId,
          accountHolderName: cleanHolder,
          bankName: cleanBank,
          accountNumber: cleanAcc,
          ifscCode: cleanIfsc,
          branchName: cleanBranch,
          accountType,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your bank account details have been successfully saved!",
      bankDetails: {
        accountHolderName: savedDetail.accountHolderName,
        bankName: savedDetail.bankName,
        accountNumberMasked: maskAccountNumber(savedDetail.accountNumber),
        ifscCode: savedDetail.ifscCode,
        branchName: savedDetail.branchName,
        accountType: savedDetail.accountType,
        updatedAt: savedDetail.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Employee PUT Bank Details Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save bank account details." },
      { status: 500 }
    );
  }
}

