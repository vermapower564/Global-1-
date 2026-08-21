import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { maskAccountNumber, maskIfscCode, maskAccountHolderName } from "@/lib/bankOtpService";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "PROJECT_MANAGER"];

// GET: Retrieve MASKED Bank Details for an employee by default
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
    const users = await queryDb<any[]>(
      `SELECT id, employeeId, name, email FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
      [employeeId, employeeId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }
    const user = users[0];

    // Check authorization: Admin or Self only
    if (!isAdmin && user.id !== authResult.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: Access denied." }, { status: 403 });
    }

    const bankDetails = await queryDb<any[]>(
      `SELECT * FROM bankdetail WHERE userId = ? LIMIT 1`,
      [user.id]
    );

    if (!bankDetails || bankDetails.length === 0) {
      return NextResponse.json({
        success: true,
        hasBankDetails: false,
        bankDetails: null,
        message: "No bank details recorded for this account.",
      });
    }

    const bd = bankDetails[0];

    // Bank Details are STRICTLY MASKED by default on the backend
    return NextResponse.json({
      success: true,
      hasBankDetails: true,
      bankDetails: {
        id: bd.id,
        userId: bd.userId,
        accountHolderNameMasked: maskAccountHolderName(bd.accountHolderName),
        bankName: bd.bankName,
        accountNumberMasked: maskAccountNumber(bd.accountNumber),
        ifscCodeMasked: maskIfscCode(bd.ifscCode),
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
