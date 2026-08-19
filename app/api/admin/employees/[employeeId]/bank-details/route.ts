import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { maskAccountNumber, validateBankDetails } from "@/lib/bankHelper";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

// GET: Retrieve Bank Details for an employee (Admin/HR view)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await context.params;

    // 1. Authenticate Request
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = (authResult.user.role || "").toUpperCase();
    const isAdmin = ADMIN_ROLES.includes(requesterRole);

    // 2. Find Target User
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: employeeId }, { employeeId: employeeId }],
      },
      include: { bankDetail: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    // Check authorization: Admin can view any, Employee can only view their own
    if (!isAdmin && user.id !== authResult.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: Access denied." }, { status: 403 });
    }

    if (!user.bankDetail) {
      return NextResponse.json({
        success: true,
        hasBankDetails: false,
        bankDetails: null,
        message: "No bank details recorded for this employee.",
      });
    }

    const bd = user.bankDetail;
    const maskedAcc = maskAccountNumber(bd.accountNumber);

    return NextResponse.json({
      success: true,
      hasBankDetails: true,
      bankDetails: {
        id: bd.id,
        userId: bd.userId,
        accountHolderName: bd.accountHolderName,
        bankName: bd.bankName,
        accountNumberMasked: maskedAcc,
        accountNumber: isAdmin ? bd.accountNumber : maskedAcc, // Admin can see full for verification
        ifscCode: bd.ifscCode,
        branchName: bd.branchName || "Main Branch",
        accountType: bd.accountType || "Savings",
        isActive: bd.isActive,
        updatedAt: bd.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("GET Bank Details Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve bank details." },
      { status: 500 }
    );
  }
}

// PUT: Update or Create Bank Details for an employee (Admin/HR only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await context.params;

    // 1. Authenticate Admin/HR Request
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = (authResult.user.role || "").toUpperCase();
    const isAdmin = ADMIN_ROLES.includes(requesterRole);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Admin / HR can update employee banking records." },
        { status: 403 }
      );
    }

    // 2. Find Target User
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: employeeId }, { employeeId: employeeId }],
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    const body = await request.json();
    const { accountHolderName, bankName, accountNumber, ifscCode, branchName, accountType } = body;

    // 3. Validate Bank Information
    const validation = validateBankDetails({
      accountHolderName: accountHolderName || user.name,
      bankName,
      accountNumber,
      ifscCode,
    });

    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const cleanAcc = accountNumber.trim().replace(/\s+/g, "");
    const cleanIfsc = ifscCode.trim().toUpperCase();

    // 4. Upsert Bank Details Record in MySQL
    const updatedBankDetail = await prisma.bankdetail.upsert({
      where: { userId: user.id },
      update: {
        accountHolderName: accountHolderName?.trim() || user.name,
        bankName: bankName.trim(),
        accountNumber: cleanAcc,
        ifscCode: cleanIfsc,
        branchName: branchName?.trim() || "Main Branch",
        accountType: accountType || "Savings",
        isActive: true,
      },
      create: {
        userId: user.id,
        accountHolderName: accountHolderName?.trim() || user.name,
        bankName: bankName.trim(),
        accountNumber: cleanAcc,
        ifscCode: cleanIfsc,
        branchName: branchName?.trim() || "Main Branch",
        accountType: accountType || "Savings",
        isActive: true,
      },
    });

    // 5. Audit Log
    logAuditEvent(
      authResult.user.id,
      "UPDATE_EMPLOYEE_BANK_DETAILS",
      `Bank details updated for ${user.name} (${user.employeeId}): ${bankName} (${maskAccountNumber(cleanAcc)})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `✓ Bank details successfully updated for ${user.name}!`,
      bankDetails: {
        ...updatedBankDetail,
        accountNumberMasked: maskAccountNumber(updatedBankDetail.accountNumber),
      },
    });
  } catch (error: any) {
    console.error("PUT Bank Details Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update bank details." },
      { status: 500 }
    );
  }
}
