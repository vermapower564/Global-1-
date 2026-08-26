"use client";

import React, { useRef, useEffect } from "react";
import { maskAccountNumber } from "@/lib/bankHelper";

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: any;
  employee: any;
}

// Convert numbers to Indian Rupees in words
function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

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
  const remaining = num % 100;

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

export default function SalarySlipModal({
  isOpen,
  onClose,
  slip,
  employee,
}: SalarySlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: ESC to Close slip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body scroll when preview modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !slip) return null;

  const empName =
    slip.employeeName ||
    slip.user_name ||
    employee?.name ||
    employee?.user_name ||
    "Employee";
  const empId =
    slip.employeeId ||
    slip.user_employeeId ||
    employee?.employeeId ||
    employee?.user_employeeId ||
    "EMP001";
  const empDept =
    slip.department ||
    slip.department_name ||
    employee?.department?.name ||
    employee?.department ||
    "Development & Engineering";
  const empRole = (
    slip.designation ||
    slip.user_role ||
    employee?.role ||
    "Software Developer"
  ).replace(/_/g, " ");
  const empEmail =
    slip.employeeEmail ||
    slip.user_email ||
    slip.email ||
    employee?.email ||
    "";

  // Financial breakdown calculations
  const basic =
    Number(slip.earnings?.basicSalary ?? slip.basicSalary) || 0;
  const hra = Number(slip.earnings?.hra ?? slip.hra) || 0;
  const allowances =
    Number(slip.earnings?.allowances ?? slip.allowances) || 0;
  const bonus = Number(slip.earnings?.bonus ?? slip.bonus) || 0;
  const overtime =
    Number(slip.earnings?.overtime ?? slip.overtime) || 0;
  const gross =
    Number(slip.earnings?.grossSalary ?? slip.grossSalary) ||
    basic + hra + allowances + bonus + overtime;

  const pf =
    Number(slip.deductions?.pfDeduction ?? slip.pfDeduction) || 0;
  const tax =
    Number(slip.deductions?.taxDeduction ?? slip.taxDeduction) || 0;
  const other =
    Number(slip.deductions?.otherDeductions ?? slip.otherDeductions) || 0;
  const totalDeductions =
    Number(slip.deductions?.totalDeductions ?? slip.totalDeductions) ||
    pf + tax + other;

  const net = Number(slip.netSalary) || Math.max(0, gross - totalDeductions);

  // Bank & Payment Information
  const accountHolder =
    slip.payment?.accountHolderName ||
    slip.accountHolderName ||
    employee?.bankDetail?.accountHolderName ||
    empName;
  const bankName =
    slip.payment?.bankName ||
    slip.bankName ||
    employee?.bankDetail?.bankName ||
    "State Bank of India";
  const rawAcc =
    slip.payment?.accountNumberMasked ||
    slip.accountNumberMasked ||
    (employee?.bankDetail?.accountNumber
      ? maskAccountNumber(employee.bankDetail.accountNumber)
      : "••••••••1234");
  const maskedAcc = rawAcc.includes("••••") ? rawAcc : maskAccountNumber(rawAcc);
  const ifscCode =
    slip.payment?.ifscCode ||
    slip.ifscCode ||
    employee?.bankDetail?.ifscCode ||
    "SBIN0001001";
  const paymentMethod =
    slip.payment?.method || slip.paymentMethod || "Direct Bank Transfer";
  const txnId =
    slip.payment?.transactionReference ||
    slip.transactionReference ||
    "TXN-" + (slip.id ? String(slip.id).slice(-8) : "82910482");
  const paymentStatus = slip.payment?.status || slip.paymentStatus || "PAID";
  const salaryMonth = slip.salaryMonth || "August 2026";
  const slipId = slip.id || slip.monthKey || "SLIP-REC";

  const payDateStr = slip.payment?.paymentDate || slip.paymentDate
    ? new Date(slip.payment?.paymentDate || slip.paymentDate).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )
    : "01 " + salaryMonth;

  const genDateStr = slip.generatedAt
    ? new Date(slip.generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : payDateStr;

  const handlePrint = () => {
    window.print();
  };

  const pdfDownloadUrl = `/api/salary-slips/${encodeURIComponent(
    slip.id || slip.monthKey || ""
  )}/pdf`;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-slate-950/80 backdrop-blur-xs font-sans print:p-0 print:m-0 print:bg-white print:static print:overflow-visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full w-full flex items-start justify-center p-3 sm:p-4 md:p-6 print:p-0 print:m-0 print:block">
        <div className="w-full max-w-[794px] my-2 sm:my-4 space-y-4 print:p-0 print:m-0 print:max-w-full">
          {/* Top Floating Control Bar (Hidden when Printing) */}
          <div className="w-full bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden screen-only">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                Payslip Preview • {salaryMonth}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  paymentStatus === "PAID"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : paymentStatus === "SCHEDULED"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                ● {paymentStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {empName} ({empId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={pdfDownloadUrl}
            download={`Salary-Slip-${empId}-${salaryMonth.replace(/\s+/g, "-")}.pdf`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Download Official PDF"
          >
            <span>📥</span>
            <span>Download PDF</span>
          </a>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            title="Close Salary Slip Preview (ESC)"
            className="bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white font-black text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-rose-600"
          >
            <span>✕</span>
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Full A4 Document Sheet */}
      <div
        ref={printRef}
        className="salary-slip-print w-full max-w-[794px] min-h-[1123px] bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 flex flex-col justify-between space-y-6 print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:w-full print:min-h-0 print:space-y-4"
      >
        <div className="space-y-6">
          {/* Company Brand Header */}
          <div className="salary-header salary-section border-b-2 border-blue-600 pb-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  O
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                    OMS ENTERPRISE
                  </h1>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    Operations Management & Payroll Intelligence System
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Official Salary & Payment Statement
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs uppercase tracking-wider">
                  SALARY PAYSLIP • {salaryMonth.toUpperCase()}
                </div>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Doc Ref: {slipId}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center text-[10px] text-slate-500">
              <span>
                Corporate HQ: DLF Cyber City, Tower B, Sector 25, Gurugram, HR 122002
              </span>
              <span>CIN: U72200HR2022PTC099881 • PAN: AAAC01928K</span>
            </div>
          </div>

          {/* Employee & Salary Metadata Grid */}
          <div className="salary-grid salary-section grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  EMPLOYEE NAME
                </span>
                <span className="text-sm font-black text-slate-900">{empName}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  EMPLOYEE ID
                </span>
                <span className="font-mono font-black text-blue-600 text-xs">
                  {empId}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  DESIGNATION / ROLE
                </span>
                <span className="font-bold text-slate-800">{empRole}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  DEPARTMENT
                </span>
                <span className="font-bold text-slate-800">{empDept}</span>
              </div>
            </div>

            <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  SALARY PERIOD / MONTH
                </span>
                <span className="font-black text-slate-900">{salaryMonth}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  DISBURSEMENT DATE
                </span>
                <span className="font-mono font-bold text-slate-800">{payDateStr}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  PAYMENT STATUS
                </span>
                <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 uppercase">
                  <span>●</span> {paymentStatus}
                </span>
              </div>
              {empEmail && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                    OFFICIAL WORK EMAIL
                  </span>
                  <span className="font-mono text-slate-700 text-[11px]">
                    {empEmail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Dual Tables */}
          <div className="salary-tables salary-section grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* EARNINGS */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-wider">
                  💰 Earnings
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  Amount (INR)
                </span>
              </div>

              <div className="p-3.5 space-y-2 bg-white divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600 font-medium">Basic Salary</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{basic.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-medium">
                    House Rent Allowance (HRA)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{hra.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-medium">
                    Special & Other Allowances
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{allowances.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-medium">
                    Performance Bonus
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{bonus.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-medium">
                    Overtime & Rewards
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{overtime.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="bg-slate-100 px-4 py-2.5 flex justify-between items-center border-t border-slate-200 font-black text-slate-900">
                <span className="uppercase text-xs">Total Gross Earnings</span>
                <span className="font-mono text-sm text-blue-700">
                  ₹{gross.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-wider">
                  📉 Deductions
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  Amount (INR)
                </span>
              </div>

              <div className="p-3.5 space-y-2 bg-white divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600 font-medium">
                    Provident Fund (PF 12%)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{pf.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-medium">
                    Professional & TDS Tax
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{tax.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-medium">
                    Other Policy Deductions
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{other.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-slate-400">
                  <span className="font-medium">Voluntary PF</span>
                  <span className="font-mono">₹0</span>
                </div>
                <div className="flex justify-between pt-2 text-slate-400">
                  <span className="font-medium">Unpaid Leaves / LOP</span>
                  <span className="font-mono">₹0</span>
                </div>
              </div>

              <div className="bg-slate-100 px-4 py-2.5 flex justify-between items-center border-t border-slate-200 font-black text-slate-900">
                <span className="uppercase text-xs">Total Deductions</span>
                <span className="font-mono text-sm text-rose-700">
                  -₹{totalDeductions.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* NET TAKE-HOME SALARY DISBURSED BANNER */}
          <div className="salary-net-banner salary-section p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 text-white shadow-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  TOTAL NET SALARY DISBURSED
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  (Gross Salary − Total Deductions) • Credited to Bank Account
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
                  ₹{net.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-blue-200 font-medium">
              <span>Amount in Words: </span>
              <strong className="text-white italic">{numberToWords(net)}</strong>
            </div>
          </div>

          {/* PAYMENT INFORMATION & BANKING DETAILS */}
          <div className="salary-bank-section salary-section p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>🏦</span> PAYMENT INFORMATION & BANK DETAILS
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {paymentMethod}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                  Account Holder
                </span>
                <span className="font-bold text-slate-900">{accountHolder}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                  Bank Name
                </span>
                <span className="font-bold text-slate-900">{bankName}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                  Account Number
                </span>
                <span className="font-mono font-bold text-slate-900">{maskedAcc}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                  IFSC Code
                </span>
                <span className="font-mono font-bold text-slate-900">{ifscCode}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-600 gap-2">
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase mr-1.5">
                  Payment Method:
                </span>
                <span className="font-bold text-slate-900">{paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase mr-1.5">
                  Transaction ID / Ref:
                </span>
                <span className="font-mono font-bold text-blue-600">{txnId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Remarks, Timestamp & Official Signatories */}
        <div className="salary-footer salary-section pt-4 border-t-2 border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="h-9 flex items-center justify-center font-serif text-slate-700 font-bold text-sm">
                Roushan Verma
              </div>
              <p className="font-black text-slate-900 uppercase text-[11px]">
                Director / HR Head
              </p>
              <p className="text-[10px] text-slate-500">Authorized Signatory</p>
            </div>

            <div className="space-y-1 flex flex-col items-center justify-center">
              <div className="inline-block border-2 border-dashed border-emerald-500 text-emerald-700 font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider bg-emerald-50/50">
                ✓ PAID & VERIFIED
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Generated: {genDateStr}
              </p>
            </div>

            <div className="space-y-1">
              <div className="h-9 flex items-center justify-center font-serif text-slate-700 font-bold text-sm">
                Corporate Finance
              </div>
              <p className="font-black text-slate-900 uppercase text-[11px]">
                Finance Controller
              </p>
              <p className="text-[10px] text-slate-500">OMS Payroll Treasury</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Note: This is an authentic computer-generated payroll statement authorized by OMS Enterprise Payroll Engine.
          </div>

          {/* Bottom Action Controls (Hidden when Printing) */}
          <div className="pt-3 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 shadow-2xs"
            >
              <span>✕</span>
              <span>Close Preview</span>
            </button>

            <a
              href={pdfDownloadUrl}
              download={`Salary-Slip-${empId}-${salaryMonth.replace(/\s+/g, "-")}.pdf`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <span>📥</span>
              <span>Download Official PDF</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🖨️</span>
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}



