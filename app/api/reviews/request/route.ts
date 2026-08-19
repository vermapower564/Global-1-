import { NextRequest, NextResponse } from "next/server";
import { sendSmtpEmail } from "@/lib/smtpTransporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientEmail,
      clientName,
      employeeName,
      employeeId,
      projectName,
      customNote,
      reviewUrl,
    } = body;

    if (!clientEmail || !clientEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid client email address." },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const finalReviewUrl = reviewUrl || `${protocol}://${host}/feedback/${employeeId || "EMP-8595"}`;

    const subject = `⭐ Feedback Request: ${employeeName || "Our Team"} & ${projectName || "Recent Project"}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 12px; font-weight: 900; font-size: 20px; letter-spacing: -0.5px;">
            OMS Enterprise
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 16px; margin-bottom: 4px;">
            How did we do?
          </h2>
          <p style="font-size: 14px; color: #64748b; margin-top: 0;">
            Your feedback helps us continuously elevate our service quality.
          </p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
          <p style="margin: 0 0 8px 0; font-size: 14px;">Dear <strong>${clientName || "Valued Client"}</strong>,</p>
          <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #334155;">
            Thank you for partnering with us on <strong>${projectName || "your recent project deliverables"}</strong> with <strong>${employeeName || "our specialist"}</strong> (${employeeId || "OMS"}).
          </p>
          ${
            customNote
              ? `<p style="margin: 0; font-size: 13px; font-style: italic; color: #475569; background: #ffffff; padding: 10px 14px; border-radius: 8px; border-left: 4px solid #2563eb;">"${customNote}"</p>`
              : ""
          }
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${finalReviewUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
            ⭐ Share Your Rating & Review
          </a>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">
            Takes less than 60 seconds • No sign up required
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
          <p style="margin: 0;">OMS Enterprise Systems • Client Success & Quality Assurance</p>
        </div>
      </div>
    `;

    // Attempt email dispatch
    sendSmtpEmail({
      to: clientEmail,
      subject,
      html,
    }).catch((e) => console.warn("Review request email notice warning:", e));

    return NextResponse.json({
      success: true,
      message: `✓ Feedback invitation link dispatched successfully to ${clientEmail}!`,
      reviewUrl: finalReviewUrl,
    });
  } catch (error: any) {
    console.error("POST /api/reviews/request error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch review invitation." },
      { status: 500 }
    );
  }
}
