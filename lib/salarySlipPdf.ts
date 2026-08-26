/**
 * Ultra-Clean Zero-Dependency Pure Vector PDF 1.4 Generator
 * Complies 100% with ISO 32000-1 specification
 * Opens flawlessly in Adobe Acrobat, Windows Reader, Edge, Chrome, Safari & Preview
 */

export interface SalarySlipPdfData {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeEmail?: string | null;
  department: string;
  designation: string;
  salaryMonth: string;
  monthKey?: string;
  
  // Earnings
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  overtime: number;
  grossSalary: number;
  
  // Deductions
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Payment
  paymentStatus: string;
  paymentMethod: string;
  paymentDate?: string | Date | null;
  transactionReference?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumberMasked?: string | null;
  ifscCode?: string | null;
  
  generatedAt?: string | Date | null;
}

function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    let str = "";
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const remaining = Math.floor(num % 100);

  let res = "";
  if (crore > 0) res += inWords(crore) + "Crore ";
  if (lakh > 0) res += inWords(lakh) + "Lakh ";
  if (thousand > 0) res += inWords(thousand) + "Thousand ";
  if (hundred > 0) res += inWords(hundred) + "Hundred ";
  if (remaining > 0) {
    if (res !== "") res += "and ";
    res += inWords(remaining);
  }
  return "Rupees " + res.trim() + " Only";
}

function escapePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " "); // standard printable ASCII
}

function fmtMoney(amount: number): string {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100;
  const parts = rounded.toFixed(2).split(".");
  const intPart = parts[0];
  const decPart = parts[1];
  
  // Indian number grouping
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return "INR " + formattedInt + "." + decPart;
}

export function generateSalarySlipPdf(data: SalarySlipPdfData): Buffer {
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const streamOps: string[] = [];

  // Helper drawing functions
  const fillRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    streamOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    streamOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  };

  const strokeRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number, lw = 1) => {
    streamOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    streamOps.push(`${lw} w`);
    streamOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  };

  const line = (x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, lw = 1) => {
    streamOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    streamOps.push(`${lw} w`);
    streamOps.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    font: "F1" | "F2" | "F3",
    size: number,
    r = 0,
    g = 0,
    b = 0,
    align: "left" | "right" | "center" = "left"
  ) => {
    const escaped = escapePdfText(text);
    streamOps.push(`BT`);
    streamOps.push(`/${font} ${size} Tf`);
    streamOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    
    // Estimate width for alignment (0.55 char width factor for Helvetica)
    let finalX = x;
    const approxWidth = text.length * size * (font === "F3" ? 0.6 : 0.52);
    if (align === "right") {
      finalX = x - approxWidth;
    } else if (align === "center") {
      finalX = x - approxWidth / 2;
    }

    streamOps.push(`${finalX.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj`);
    streamOps.push(`ET`);
  };

  // 1. Full Page Background
  fillRect(0, 0, pageWidth, pageHeight, 0.98, 0.98, 0.99);

  // 2. Main Sheet Container (White A4 Card with border)
  const marginX = 28;
  const marginY = 28;
  const contentW = pageWidth - marginX * 2;
  const contentH = pageHeight - marginY * 2;
  fillRect(marginX, marginY, contentW, contentH, 1, 1, 1);
  strokeRect(marginX, marginY, contentW, contentH, 0.88, 0.91, 0.94, 1);

  // 3. Top Header Banner (Slate 950 #0f172a)
  const headerH = 75;
  const headerY = pageHeight - marginY - headerH;
  fillRect(marginX, headerY, contentW, headerH, 0.06, 0.09, 0.16);

  // Logo Badge (Blue Box with 'O')
  fillRect(marginX + 16, headerY + 18, 38, 38, 0.15, 0.39, 0.92);
  drawText("O", marginX + 35, headerY + 28, "F2", 22, 1, 1, 1, "center");

  // Company Titles
  drawText("OMS ENTERPRISE", marginX + 62, headerY + 44, "F2", 15, 1, 1, 1);
  drawText("OPERATIONS MANAGEMENT & PAYROLL INTELLIGENCE SYSTEM", marginX + 62, headerY + 30, "F2", 6.5, 0.38, 0.65, 0.98);
  drawText("Corporate HQ: DLF Cyber City, Sector 25, Gurugram, HR 122002  |  CIN: U72200HR2022PTC099881", marginX + 62, headerY + 16, "F1", 6, 0.65, 0.72, 0.82);

  // Right Header Badge (Salary Month)
  const monthStr = (data.salaryMonth || "August 2026").toUpperCase();
  fillRect(marginX + contentW - 160, headerY + 36, 144, 22, 0.12, 0.23, 0.45);
  strokeRect(marginX + contentW - 160, headerY + 36, 144, 22, 0.38, 0.65, 0.98, 0.8);
  drawText(`PAYSLIP: ${monthStr}`, marginX + contentW - 88, headerY + 43, "F2", 8.5, 0.75, 0.88, 1, "center");
  
  const docRef = data.id || "SLIP-REC";
  drawText(`Doc Ref: ${docRef}`, marginX + contentW - 16, headerY + 18, "F3", 7, 0.65, 0.72, 0.82, "right");

  // 4. Employee Identification & Banking Dual Grid
  let currY = headerY - 14;
  const gridH = 106;
  const gridY = currY - gridH;
  fillRect(marginX + 14, gridY, contentW - 28, gridH, 0.97, 0.98, 0.99);
  strokeRect(marginX + 14, gridY, contentW - 28, gridH, 0.88, 0.91, 0.94, 1);

  // Column Dividers
  const colW = (contentW - 28) / 2;
  line(marginX + 14 + colW, gridY + 8, marginX + 14 + colW, gridY + gridH - 8, 0.88, 0.91, 0.94, 1);

  // Col 1: Employee Details
  drawText("EMPLOYEE IDENTIFICATION", marginX + 24, gridY + gridH - 18, "F2", 8.5, 0.06, 0.09, 0.16);
  line(marginX + 24, gridY + gridH - 22, marginX + 14 + colW - 10, gridY + gridH - 22, 0.88, 0.91, 0.94, 1);

  const empDetails = [
    { label: "Employee Name:", val: data.employeeName || "Employee" },
    { label: "Employee ID:", val: data.employeeId || "EMP001", isCode: true },
    { label: "Department:", val: data.department || "Operations" },
    { label: "Designation / Role:", val: data.designation || "Software Developer" },
    { label: "Salary Period:", val: data.salaryMonth || "August 2026" },
  ];

  let empItemY = gridY + gridH - 35;
  for (const item of empDetails) {
    drawText(item.label, marginX + 24, empItemY, "F1", 7.5, 0.4, 0.45, 0.55);
    drawText(item.val, marginX + 14 + colW - 16, empItemY, item.isCode ? "F3" : "F2", 7.5, item.isCode ? 0.15 : 0.06, item.isCode ? 0.39 : 0.09, item.isCode ? 0.92 : 0.16, "right");
    empItemY -= 14;
  }

  // Col 2: Bank & Ledger Details
  drawText("BANK & DISBURSEMENT LEDGER", marginX + 24 + colW, gridY + gridH - 18, "F2", 8.5, 0.06, 0.09, 0.16);
  line(marginX + 24 + colW, gridY + gridH - 22, marginX + contentW - 24, gridY + gridH - 22, 0.88, 0.91, 0.94, 1);

  const bankDetails = [
    { label: "Bank Name:", val: data.bankName || "State Bank of India" },
    { label: "Account Holder:", val: data.accountHolderName || data.employeeName || "Employee" },
    { label: "Account Number:", val: data.accountNumberMasked || "••••••••5432", isCode: true },
    { label: "IFSC Code:", val: data.ifscCode || "SBIN0001001", isCode: true },
    { label: "Disbursement Status:", val: (data.paymentStatus || "PAID").toUpperCase(), isStatus: true },
  ];

  let bankItemY = gridY + gridH - 35;
  for (const item of bankDetails) {
    drawText(item.label, marginX + 24 + colW, bankItemY, "F1", 7.5, 0.4, 0.45, 0.55);
    if (item.isStatus) {
      drawText(`[ ${item.val} ]`, marginX + contentW - 24, bankItemY, "F2", 7.5, 0.05, 0.59, 0.38, "right");
    } else {
      drawText(item.val, marginX + contentW - 24, bankItemY, item.isCode ? "F3" : "F2", 7.5, 0.06, 0.09, 0.16, "right");
    }
    bankItemY -= 14;
  }

  // 5. Earnings & Deductions Breakdown Tables (Side by Side)
  currY = gridY - 14;
  const tableH = 175;
  const tableY = currY - tableH;
  const halfTableW = (contentW - 28 - 14) / 2;

  // Left: Earnings Table Box
  const earnX = marginX + 14;
  strokeRect(earnX, tableY, halfTableW, tableH, 0.88, 0.91, 0.94, 1);
  // Earnings Header
  fillRect(earnX, tableY + tableH - 24, halfTableW, 24, 0.06, 0.09, 0.16);
  drawText("EARNINGS (ADDITIONS)", earnX + 10, tableY + tableH - 16, "F2", 8, 1, 1, 1);
  drawText("AMOUNT (INR)", earnX + halfTableW - 10, tableY + tableH - 16, "F2", 7.5, 0.85, 0.9, 1, "right");

  const earningsRows = [
    { name: "Basic Salary", val: data.basicSalary },
    { name: "House Rent Allowance (HRA)", val: data.hra },
    { name: "Special / Work Allowances", val: data.allowances },
    { name: "Performance Bonus", val: data.bonus },
    { name: "Overtime / Project Incentive", val: data.overtime },
  ];

  let earnRowY = tableY + tableH - 44;
  for (const row of earningsRows) {
    drawText(row.name, earnX + 10, earnRowY, "F1", 7.5, 0.3, 0.35, 0.45);
    drawText(fmtMoney(row.val), earnX + halfTableW - 10, earnRowY, "F3", 7.5, 0.06, 0.09, 0.16, "right");
    line(earnX + 6, earnRowY - 5, earnX + halfTableW - 6, earnRowY - 5, 0.94, 0.95, 0.97, 0.8);
    earnRowY -= 21;
  }

  // Earnings Total Footer
  fillRect(earnX, tableY, halfTableW, 26, 0.95, 0.97, 1);
  line(earnX, tableY + 26, earnX + halfTableW, tableY + 26, 0.88, 0.91, 0.94, 1);
  drawText("TOTAL GROSS EARNINGS", earnX + 10, tableY + 9, "F2", 8, 0.06, 0.09, 0.16);
  drawText(fmtMoney(data.grossSalary), earnX + halfTableW - 10, tableY + 9, "F2", 8.5, 0.15, 0.39, 0.92, "right");

  // Right: Deductions Table Box
  const dedX = marginX + 14 + halfTableW + 14;
  strokeRect(dedX, tableY, halfTableW, tableH, 0.88, 0.91, 0.94, 1);
  // Deductions Header
  fillRect(dedX, tableY + tableH - 24, halfTableW, 24, 0.06, 0.09, 0.16);
  drawText("DEDUCTIONS (STATUTORY)", dedX + 10, tableY + tableH - 16, "F2", 8, 1, 1, 1);
  drawText("AMOUNT (INR)", dedX + halfTableW - 10, tableY + tableH - 16, "F2", 7.5, 0.85, 0.9, 1, "right");

  const deductionsRows = [
    { name: "Provident Fund (Employee PF 12%)", val: data.pfDeduction },
    { name: "Tax Deducted at Source (TDS)", val: data.taxDeduction },
    { name: "Professional Tax / Other", val: data.otherDeductions },
    { name: "Voluntary Provident Fund", val: 0 },
    { name: "Unpaid Leaves / LOP", val: 0 },
  ];

  let dedRowY = tableY + tableH - 44;
  for (const row of deductionsRows) {
    drawText(row.name, dedX + 10, dedRowY, "F1", 7.5, 0.3, 0.35, 0.45);
    drawText(fmtMoney(row.val), dedX + halfTableW - 10, dedRowY, "F3", 7.5, 0.88, 0.15, 0.25, "right");
    line(dedX + 6, dedRowY - 5, dedX + halfTableW - 6, dedRowY - 5, 0.94, 0.95, 0.97, 0.8);
    dedRowY -= 21;
  }

  // Deductions Total Footer
  fillRect(dedX, tableY, halfTableW, 26, 0.99, 0.95, 0.95);
  line(dedX, tableY + 26, dedX + halfTableW, tableY + 26, 0.88, 0.91, 0.94, 1);
  drawText("TOTAL DEDUCTIONS", dedX + 10, tableY + 9, "F2", 8, 0.06, 0.09, 0.16);
  drawText("-" + fmtMoney(data.totalDeductions), dedX + halfTableW - 10, tableY + 9, "F2", 8.5, 0.88, 0.15, 0.25, "right");

  // 6. Net Take-Home Salary Banner (Dark Blue Gradient Box)
  currY = tableY - 14;
  const netH = 68;
  const netY = currY - netH;
  fillRect(marginX + 14, netY, contentW - 28, netH, 0.08, 0.15, 0.35);
  strokeRect(marginX + 14, netY, contentW - 28, netH, 0.18, 0.3, 0.6, 1);

  // Left: Net Salary
  drawText("NET DISBURSED TAKE-HOME SALARY", marginX + 26, netY + 48, "F2", 7.5, 0.65, 0.82, 1);
  drawText(fmtMoney(data.netSalary), marginX + 26, netY + 26, "F2", 18, 1, 1, 1);

  // Right: Txn & Date
  const payDateFormatted = data.paymentDate
    ? new Date(data.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "01 " + data.salaryMonth;
  const txnRefStr = data.transactionReference || `TXN-OMS-${data.id}`;
  drawText("DISBURSEMENT DATE", marginX + contentW - 26, netY + 48, "F2", 7, 0.65, 0.82, 1, "right");
  drawText(payDateFormatted, marginX + contentW - 26, netY + 36, "F2", 8, 1, 1, 1, "right");
  drawText(`Ref: ${txnRefStr}`, marginX + contentW - 26, netY + 24, "F3", 7, 0.75, 0.85, 1, "right");

  // Amount in Words Bar
  line(marginX + 20, netY + 18, marginX + contentW - 20, netY + 18, 0.18, 0.3, 0.6, 1);
  drawText(`Amount in Words: ${numberToWords(data.netSalary)}`, marginX + 26, netY + 7, "F1", 7, 0.85, 0.92, 1);

  // 7. Verification & Sign-off Tri-Column Footer
  currY = netY - 14;
  const footerH = 68;
  const footerY = currY - footerH;
  strokeRect(marginX + 14, footerY, contentW - 28, footerH, 0.88, 0.91, 0.94, 1);

  const triW = (contentW - 28) / 3;

  // Signatory 1
  drawText("Roushan Verma", marginX + 14 + triW * 0.5, footerY + 44, "F2", 9, 0.1, 0.15, 0.25, "center");
  drawText("DIRECTOR / HR HEAD", marginX + 14 + triW * 0.5, footerY + 30, "F2", 7, 0.06, 0.09, 0.16, "center");
  drawText("Authorized Signatory", marginX + 14 + triW * 0.5, footerY + 18, "F1", 6.5, 0.45, 0.5, 0.6, "center");

  line(marginX + 14 + triW, footerY + 6, marginX + 14 + triW, footerY + footerH - 6, 0.88, 0.91, 0.94, 1);

  // Signatory 2: Audit Seal
  fillRect(marginX + 14 + triW + (triW - 130) / 2, footerY + 38, 130, 18, 0.92, 0.98, 0.94);
  strokeRect(marginX + 14 + triW + (triW - 130) / 2, footerY + 38, 130, 18, 0.1, 0.65, 0.4, 0.8);
  drawText("[?] DIGITALLY VERIFIED & ISSUED", marginX + 14 + triW * 1.5, footerY + 43, "F2", 6.5, 0.05, 0.55, 0.35, "center");
  drawText("OMS PAYROLL AUDIT ENGINE", marginX + 14 + triW * 1.5, footerY + 28, "F2", 7, 0.06, 0.09, 0.16, "center");
  const genDateStr = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : payDateFormatted;
  drawText(`Timestamp: ${genDateStr}`, marginX + 14 + triW * 1.5, footerY + 16, "F3", 6.5, 0.45, 0.5, 0.6, "center");

  line(marginX + 14 + triW * 2, footerY + 6, marginX + 14 + triW * 2, footerY + footerH - 6, 0.88, 0.91, 0.94, 1);

  // Signatory 3
  drawText("Corporate Finance", marginX + 14 + triW * 2.5, footerY + 44, "F2", 9, 0.1, 0.15, 0.25, "center");
  drawText("FINANCE CONTROLLER", marginX + 14 + triW * 2.5, footerY + 30, "F2", 7, 0.06, 0.09, 0.16, "center");
  drawText("OMS Enterprise Treasury", marginX + 14 + triW * 2.5, footerY + 18, "F1", 6.5, 0.45, 0.5, 0.6, "center");

  // 8. Bottom Disclaimer Note
  drawText(
    "Note: This is a computer-generated official payroll slip from the OMS Enterprise system. For inquiries, contact hr@oms.com.",
    pageWidth / 2,
    marginY + 10,
    "F1",
    6.5,
    0.5,
    0.55,
    0.65,
    "center"
  );

  // Build PDF Binary File Format (ISO 32000-1 Compliant)
  const streamContent = streamOps.join("\n");
  const streamLen = Buffer.byteLength(streamContent, "utf-8");

  const objects: string[] = [];
  // Obj 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  // Obj 2: Pages
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
  // Obj 3: Page
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj`
  );
  // Obj 4: Font F1 (Helvetica)
  objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`);
  // Obj 5: Font F2 (Helvetica-Bold)
  objects.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`);
  // Obj 6: Font F3 (Courier)
  objects.push(`6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj`);
  // Obj 7: Content Stream
  objects.push(`7 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj`);

  // Assemble PDF with exact byte offsets for xref
  const header = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  let currentOffset = Buffer.byteLength(header, "utf-8");
  const offsets: number[] = [0];

  const objBuffers: Buffer[] = [];
  for (const obj of objects) {
    offsets.push(currentOffset);
    const buf = Buffer.from(obj + "\n", "utf-8");
    objBuffers.push(buf);
    currentOffset += buf.length;
  }

  // Cross-reference table
  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    const offStr = String(offsets[i]).padStart(10, "0");
    xref += `${offStr} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.concat([
    Buffer.from(header, "utf-8"),
    ...objBuffers,
    Buffer.from(xref, "utf-8"),
    Buffer.from(trailer, "utf-8"),
  ]);
}
