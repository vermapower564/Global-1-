export interface ResignationRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  resignationDate: string;
  noticePeriodDays: number; // Mandatory 15 Days
  lastWorkingDay: string;
  lastWorkingDayFormatted: string;
  reason: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "RELIEVED";
  emailDispatched: boolean;
  submittedAt: string;
  emailBodyHtml?: string;
  smtpDetails?: any;
}

export function calculateLastWorkingDay(submissionDateStr: string, noticeDays = 15): { lwdIso: string; lwdFormatted: string } {
  const dateObj = submissionDateStr ? new Date(submissionDateStr) : new Date();
  dateObj.setDate(dateObj.getDate() + noticeDays);
  
  const lwdIso = dateObj.toISOString().split("T")[0];
  const lwdFormatted = dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return { lwdIso, lwdFormatted };
}

export const initialResignations: ResignationRecord[] = [
  {
    id: "RSG-2026-101",
    employeeName: "Aditya Raj",
    employeeId: "EMP014",
    email: "aditya.raj@oms.com",
    department: "Development & Engineering",
    role: "Developer",
    resignationDate: "2026-08-11",
    noticePeriodDays: 15,
    lastWorkingDay: "2026-08-26",
    lastWorkingDayFormatted: "26 August 2026",
    reason: "Pursuing Higher Education & Master Degree",
    status: "APPROVED",
    emailDispatched: true,
    submittedAt: "2026-08-11 10:30 AM",
  },
  {
    id: "RSG-2026-102",
    employeeName: "Deepak Kumar",
    employeeId: "EMP008",
    email: "deepak@oms.com",
    department: "Digital Marketing",
    role: "SEO Executive",
    resignationDate: "2026-08-10",
    noticePeriodDays: 15,
    lastWorkingDay: "2026-08-25",
    lastWorkingDayFormatted: "25 August 2026",
    reason: "Personal Family Relocation to Bengaluru",
    status: "UNDER_REVIEW",
    emailDispatched: true,
    submittedAt: "2026-08-10 04:15 PM",
  },
];

export function getStoredResignations(): ResignationRecord[] {
  if (typeof window === "undefined") return initialResignations;
  const data = localStorage.getItem("oms_resignations");
  if (!data) {
    localStorage.setItem("oms_resignations", JSON.stringify(initialResignations));
    return initialResignations;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialResignations;
  }
}

export function generateResignationEmailContent(record: ResignationRecord): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background-color: #ffffff;">
      <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">OFFICIAL RESIGNATION & NOTICE PERIOD ACKNOWLEDGMENT</h1>
        <p style="margin-top: 6px; font-size: 12px; color: #f87171;">OMS Enterprise Global Pvt. Ltd. • Human Resources Exit Cell</p>
      </div>

      <div style="padding: 20px 0;">
        <h2 style="color: #0f172a; font-size: 16px; margin-bottom: 12px;">Dear ${record.employeeName},</h2>
        <p style="font-size: 13px; color: #334155; line-height: 1.6;">
          We acknowledge receipt of your formal resignation application submitted on <strong>${record.resignationDate}</strong> for the position of <strong>${record.role}</strong> in the <strong>${record.department}</strong> department.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #dc2626; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">📋 Resignation & Notice Period Summary</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Resignation Application ID:</strong> <span style="font-family: monospace; color: #dc2626; font-weight: bold;">${record.id}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Employee ID:</strong> <span style="font-family: monospace; color: #0f172a; font-weight: bold;">${record.employeeId}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Mandatory Notice Period:</strong> <span style="color: #b91c1c; font-weight: bold;">15 Calendar Days</span></p>
          <p style="margin: 4px 0; font-size: 13px; background-color: #fee2e2; padding: 8px; border-radius: 4px; display: inline-block;">
            <strong>🎯 OFFICIAL LAST WORKING DAY (LWD):</strong> <span style="font-size: 15px; color: #991b1b; font-weight: bold;">${record.lastWorkingDayFormatted}</span>
          </p>
        </div>

        <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #c2410c;">📌 15-DAY NOTICE PERIOD EXIT INSTRUCTIONS:</h3>
          <ul style="font-size: 12px; color: #7c2d12; margin: 0; padding-left: 20px; line-height: 1.7;">
            <li><strong>Project Handover:</strong> Ensure all ongoing client tasks, git code commits, and project documentation are handed over to your team lead before <strong>${record.lastWorkingDayFormatted}</strong>.</li>
            <li><strong>IT Asset Clearance:</strong> Return company laptop, ID badge, and access cards to IT Asset Desk on your Last Working Day.</li>
            <li><strong>Relieving Letter & Full & Final (F&F) Settlement:</strong> Your official Relieving Certificate and F&F salary payout will be processed within 7 working days following completion of your 15-day notice period.</li>
          </ul>
        </div>

        <p style="font-size: 12px; color: #475569; margin-top: 20px;">
          Reason Stated: <em>"${record.reason}"</em>
        </p>

        <div style="text-align: center; margin: 26px 0;">
          <a href="http://localhost:3000/resignation" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 4px; display: inline-block;">
            👉 View Resignation Status & Exit Clearance
          </a>
        </div>
      </div>
    </div>
  `;
}

export function addStoredResignation(data: {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  resignationDate: string;
  reason: string;
}): ResignationRecord {
  const current = getStoredResignations();
  const nextNum = current.length + 101;
  const id = `RSG-2026-${nextNum}`;

  const { lwdIso, lwdFormatted } = calculateLastWorkingDay(data.resignationDate, 15);
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const record: ResignationRecord = {
    ...data,
    id,
    noticePeriodDays: 15,
    lastWorkingDay: lwdIso,
    lastWorkingDayFormatted: lwdFormatted,
    status: "SUBMITTED",
    emailDispatched: true,
    submittedAt,
  };

  record.emailBodyHtml = generateResignationEmailContent(record);

  // Trigger Real SMTP Email Dispatch via API
  if (typeof window !== "undefined") {
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "RESIGNATION_NOTICE",
        to: data.email,
        name: data.employeeName,
        employeeId: data.employeeId,
        resignationId: id,
        lwdFormatted,
        reason: data.reason,
        customHtml: record.emailBodyHtml,
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          record.smtpDetails = resData.smtpDetails;
        }
      })
      .catch((e) => console.warn("SMTP resignation dispatch fallback:", e));
  }

  const updated = [record, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_resignations", JSON.stringify(updated));
  }
  return record;
}

export function updateResignationStatus(id: string, status: ResignationRecord["status"]): ResignationRecord[] {
  const current = getStoredResignations();
  const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_resignations", JSON.stringify(updated));
  }
  return updated;
}

export const updateStoredResignationStatus = updateResignationStatus;
