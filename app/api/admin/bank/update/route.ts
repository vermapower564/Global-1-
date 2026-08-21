import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { updateAuthorizedBankDetails } from "@/lib/bankOtpService";
import { validateIfsc } from "@/lib/bankHelper";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR", "PROJECT_MANAGER"];

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const roleUpper = (authResult.user.role || "").toUpperCase();
    if (!ADMIN_ROLES.includes(roleUpper)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, authToken, bankDetails } = body;

    if (!targetUserId || !authToken || !bankDetails) {
      return NextResponse.json({ success: false, error: "Missing required authorization parameters or bank details." }, { status: 400 });
    }

    if (!bankDetails.bankName || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return NextResponse.json({ success: false, error: "Bank Name, Account Holder, Account Number, and IFSC Code are mandatory." }, { status: 400 });
    }

    const ifscCheck = validateIfsc(bankDetails.ifscCode);
    if (!ifscCheck.isValid) {
      return NextResponse.json({ success: false, error: ifscCheck.error || "Invalid IFSC Code format." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await updateAuthorizedBankDetails({
      adminId: authResult.user.id,
      adminName: authResult.user.email || "Administrator",
      targetUserId,
      authToken,
      bankDetails: {
        bankName: bankDetails.bankName.trim(),
        accountHolderName: bankDetails.accountHolderName.trim(),
        accountNumber: bankDetails.accountNumber.trim(),
        ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
        branchName: bankDetails.branchName?.trim() || "Main Branch",
        accountType: bankDetails.accountType || "Savings",
      },
      ipAddress,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Update Bank Details Error:", err.message);
    return NextResponse.json({ success: false, error: err.message || "Failed to update bank details." }, { status: 400 });
  }
}
