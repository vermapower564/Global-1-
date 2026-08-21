import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { verifyBankOtp, OtpPurpose } from "@/lib/bankOtpService";

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
    const { targetUserId, purpose, otpCode } = body;

    if (!targetUserId || !otpCode) {
      return NextResponse.json({ success: false, error: "Target User ID and OTP code are required." }, { status: 400 });
    }

    if (purpose !== "VIEW_BANK_DETAILS" && purpose !== "EDIT_BANK_DETAILS") {
      return NextResponse.json({ success: false, error: "Invalid OTP authorization purpose." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await verifyBankOtp({
      adminId: authResult.user.id,
      targetUserId,
      purpose: purpose as OtpPurpose,
      otpCode,
      ipAddress,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Verify Bank OTP Error:", err.message);
    return NextResponse.json({ success: false, error: err.message || "OTP verification failed" }, { status: 400 });
  }
}
