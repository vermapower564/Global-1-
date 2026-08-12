import { NextResponse } from "next/server";
import { sendSmtpEmail } from "@/lib/smtpTransporter";
import { addStoredResignation } from "@/utils/resignationStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      employeeName,
      employeeId,
      email,
      department,
      role,
      resignationDate,
      reason,
      lastWorkingDay,
      lastWorkingDayFormatted,
    } = body;

    if (!employeeName || !employeeId || !email || !resignationDate || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Required resignation details are missing.",
        },
        { status: 400 }
      );
    }

    const record = addStoredResignation({
      employeeName,
      employeeId,
      email,
      department,
      role,
      resignationDate,
      reason,
    });

    const emailResult = await sendSmtpEmail({
      to: email,
      subject: `Resignation Confirmation - ${employeeId}`,
      html: `
        <div style="font-family: Arial; max-width: 650px; margin: auto; padding: 25px;">

          <h2>Resignation Submission Confirmation</h2>

          <p>Dear <strong>${employeeName}</strong>,</p>

          <p>
            Your resignation has been successfully submitted.
          </p>

          <hr />

          <p><strong>Employee ID:</strong> ${employeeId}</p>

          <p><strong>Department:</strong> ${department}</p>

          <p><strong>Designation:</strong> ${role}</p>

          <p><strong>Resignation Date:</strong> ${resignationDate}</p>

          <p><strong>Notice Period:</strong> 15 Calendar Days</p>

          <p>
            <strong>Last Working Day:</strong>
            ${lastWorkingDayFormatted || lastWorkingDay}
          </p>

          <p><strong>Reason:</strong> ${reason}</p>

          <hr />

          <p>
            Regards,<br />
            <strong>OMS Enterprise HR Team</strong>
          </p>

        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Resignation submitted and email sent.",
      data: record,
      email: emailResult,
      
    });

  } catch (error: any) {
    console.error("Resignation API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit resignation.",
      },
      { status: 500 }
    );
  }
}