"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SalarySlipData {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  departmentCode: string;
  designation: string;
  salaryMonth: string;
  monthKey: string;
  earnings: {
    basicSalary: number;
    hra: number;
    allowances: number;
    bonus: number;
    overtime: number;
    grossSalary: number;
  };
  deductions: {
    pfDeduction: number;
    taxDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  netSalary: number;
  payment: {
    status: string;
    method: string;
    paymentDate: string | null;
    transactionReference: string | null;
    accountHolderName: string;
    bankName: string;
    accountNumberMasked: string;
    ifscCode: string;
    branchName: string;
    accountType: string;
  };
  notes: string | null;
  generatedAt: string;
  joinedAt?: string;
}

// Convert numbers to Indian Rupees in words
function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
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

export default function FullSalarySlipPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const id = rawId ? decodeURIComponent(rawId).trim() : "";

  const [slip, setSlip] = useState<SalarySlipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/salary-slips/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Unauthorized: Please sign in to access confidential salary slips.");
          }
          if (res.status === 403) {
            throw new Error(json?.error || "Access Denied: You do not have permission to view this salary slip.");
          }
          if (res.status === 404) {
            throw new Error(json?.error || `Salary slip record "${id}" was not found.`);
          }
          throw new Error(json?.error || `Server error (${res.status}): Failed to load salary slip.`);
        }
        return json;
      })
      .then((json) => {
        if (json && json.success && (json.data || json.slip)) {
          setSlip(json.data || json.slip);
        } else {
          setError(json?.error || "Failed to load salary slip.");
        }
      })
      .catch((err) => {
        console.error("Salary slip fetch error:", err);
        setError(err.message || "Network error loading salary slip.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6 font-sans">
        <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="h-96 bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm animate-pulse">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-slate-100 rounded-xl"></div>
            <div className="h-32 bg-slate-100 rounded-xl"></div>
          </div>
          <div className="h-48 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-3xl shadow-lg text-center space-y-4 font-sans">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 font-black text-2xl flex items-center justify-center mx-auto">
          ⚠️
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Salary Slip Unavailable
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {error || "The requested salary slip could not be retrieved from the database."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            ← Go Back
          </button>
          <Link
            href="/admin/salary-slips"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition"
          >
            Salary Slips Directory
          </Link>
        </div>
      </div>
    );
  }

  const empName = slip.employeeName || (slip as any).user_name || "Employee";
  const empId = slip.employeeId || (slip as any).user_employeeId || "EMP001";
  const empDept = slip.department || (slip as any).department_name || "Development & Engineering";
  const empRole = (slip.designation || (slip as any).user_role || "Software Developer").replace(/_/g, " ");
  const empEmail = slip.employeeEmail || (slip as any).user_email || (slip as any).email || "";
  const salaryMonth = slip.salaryMonth || "August 2026";
  const slipId = slip.id || slip.monthKey || id;

  // Safe Earnings
  const basic = Number(slip.earnings?.basicSalary ?? (slip as any).basicSalary) || 0;
  const hra = Number(slip.earnings?.hra ?? (slip as any).hra) || 0;
  const allowances = Number(slip.earnings?.allowances ?? (slip as any).allowances) || 0;
  const bonus = Number(slip.earnings?.bonus ?? (slip as any).bonus) || 0;
  const overtime = Number(slip.earnings?.overtime ?? (slip as any).overtime) || 0;
  const gross =
    Number(slip.earnings?.grossSalary ?? (slip as any).grossSalary) ||
    basic + hra + allowances + bonus + overtime;

  // Safe Deductions
  const pf = Number(slip.deductions?.pfDeduction ?? (slip as any).pfDeduction) || 0;
  const tax = Number(slip.deductions?.taxDeduction ?? (slip as any).taxDeduction) || 0;
  const other = Number(slip.deductions?.otherDeductions ?? (slip as any).otherDeductions) || 0;
  const totalDeductions =
    Number(slip.deductions?.totalDeductions ?? (slip as any).totalDeductions) ||
    pf + tax + other;

  // Safe Net
  const net = Number(slip.netSalary) || Math.max(0, gross - totalDeductions);

  // Safe Payment & Banking
  const paymentStatus = slip.payment?.status || (slip as any).paymentStatus || "PAID";
  const paymentMethod = slip.payment?.method || (slip as any).paymentMethod || "Direct Bank Transfer";
  const bankName = slip.payment?.bankName || (slip as any).bankName || null;
  const accountHolder = slip.payment?.accountHolderName || (slip as any).accountHolderName || empName;
  const maskedAcc = slip.payment?.accountNumberMasked || (slip as any).accountNumberMasked || null;
  const ifscCode = slip.payment?.ifscCode || (slip as any).ifscCode || null;
  const txnRef = slip.payment?.transactionReference || (slip as any).transactionReference || `TXN-OMS-${slipId}`;

  const paymentDateFormatted = slip.payment?.paymentDate || (slip as any).paymentDate
    ? new Date(slip.payment?.paymentDate || (slip as any).paymentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "01 " + salaryMonth;

  const generatedDateFormatted = slip.generatedAt
    ? new Date(slip.generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : paymentDateFormatted;

  const pdfUrl = `/api/salary-slips/${encodeURIComponent(slipId)}/pdf`;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 font-sans print:p-0 print:m-0 print:max-w-full">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs print:hidden screen-only">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="border-l border-slate-200 pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Document View
            </span>
            <span className="text-xs font-black text-slate-900">
              Salary Slip • {salaryMonth} • {empName} ({empId})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={pdfUrl}
            download={`Salary_Slip_${empId}_${salaryMonth.replace(/\s+/g, "_")}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>📥</span>
            <span>Download Official PDF</span>
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>🖨️</span>
            <span>Print Salary Slip</span>
          </button>
        </div>
      </div>

      {/* Main Full-Page Salary Slip Document Card */}
      <div className="salary-slip-print bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:w-full">
        {/* Document Header */}
        <div className="salary-header salary-section p-8 border-b-2 border-slate-900 bg-slate-950 text-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                O
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                  OMS ENTERPRISE
                </h1>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
                  Operations Management & Payroll Intelligence System
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-black text-xs uppercase tracking-wider">
                PAYSLIP: {salaryMonth.toUpperCase()}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Doc Ref: {slipId}
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap justify-between border-t border-slate-800">
            <span>Corporate HQ: DLF Cyber City, Sector 25, Gurugram, HR 122002</span>
            <span>CIN: U72200HR2022PTC099881 • PAN: AAAC01928K</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Employee & Bank Info Dual Grid */}
          <div className="salary-grid salary-section grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {/* Column 1: Employee Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <span>👤</span>
                <span>Employee Identification</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Employee Name:</span>
                  <span className="font-extrabold text-slate-900">{empName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Employee ID:</span>
                  <span className="font-mono font-bold text-blue-600">{empId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Department:</span>
                  <span className="font-bold text-slate-800">{empDept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Designation / Role:</span>
                  <span className="font-bold text-slate-800">{empRole}</span>
                </div>
                {empEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Official Email:</span>
                    <span className="font-mono text-slate-700">{empEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Salary Period:</span>
                  <span className="font-extrabold text-slate-900">{salaryMonth}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Payment & Banking Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <span>🏦</span>
                <span>Bank & Disbursement Ledger</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Bank Name:</span>
                  <span className="font-extrabold text-slate-900">{bankName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Account Holder:</span>
                  <span className="font-bold text-slate-800">{accountHolder || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Account Number:</span>
                  <span className="font-mono font-bold text-slate-800">{maskedAcc || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-800">{ifscCode || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payment Method:</span>
                  <span className="font-bold text-slate-800">{paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Disbursement Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    ● {paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Tables */}
          <div className="salary-tables salary-section grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider">💰 Earnings (Additions)</span>
                <span className="text-xs font-bold text-slate-300">Amount (INR)</span>
              </div>
              <div className="p-4 divide-y divide-slate-100 text-xs space-y-2">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600 font-semibold">Basic Salary</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{basic.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">House Rent Allowance (HRA)</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{hra.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Special / Work Allowances</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{allowances.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Performance Bonus</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{bonus.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Overtime / Project Incentive</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{overtime.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-t border-slate-200">
                <span className="text-xs font-black uppercase text-slate-900">Total Gross Earnings</span>
                <span className="text-sm font-mono font-black text-blue-700">
                  ₹{gross.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Deductions Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider">📉 Deductions (Statutory)</span>
                <span className="text-xs font-bold text-slate-300">Amount (INR)</span>
              </div>
              <div className="p-4 divide-y divide-slate-100 text-xs space-y-2">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600 font-semibold">Provident Fund (Employee PF 12%)</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{pf.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Tax Deducted at Source (TDS / Income Tax)</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{tax.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Professional Tax / Other Deductions</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{other.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-slate-400">
                  <span className="font-medium">Voluntary Provident Fund</span>
                  <span className="font-mono">₹0</span>
                </div>
                <div className="flex justify-between pt-2 text-slate-400">
                  <span className="font-medium">Unpaid Leaves / LOP</span>
                  <span className="font-mono">₹0</span>
                </div>
              </div>
              <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-t border-slate-200">
                <span className="text-xs font-black uppercase text-slate-900">Total Deductions</span>
                <span className="text-sm font-mono font-black text-rose-600">
                  -₹{totalDeductions.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box with Amount in Words */}
          <div className="salary-net-banner salary-section p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block">
                  NET DISBURSED TAKE-HOME SALARY
                </span>
                <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                  ₹{net.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-blue-300 uppercase block">Disbursement Date</span>
                <p className="text-xs font-extrabold text-white font-mono">{paymentDateFormatted}</p>
                <span className="text-[10px] text-blue-300 font-mono block mt-1">Txn: {txnRef}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-800/80">
              <span className="text-xs font-bold text-blue-200">
                Amount in Words: <strong className="text-white italic">{numberToWords(net)}</strong>
              </span>
            </div>
          </div>

          {/* Verification & Sign-off Footer */}
          <div className="salary-footer salary-section pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-1">
              <div className="h-10 flex items-center justify-center font-serif text-slate-600 font-bold text-sm">
                Roushan Verma
              </div>
              <p className="font-black text-slate-900 uppercase">Director / HR Head</p>
              <p className="text-[10px] text-slate-500">Authorized Signatory</p>
            </div>

            <div className="space-y-1">
              <div className="h-10 flex items-center justify-center">
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full font-mono text-[10px] font-bold">
                  ✓ Digitally Verified & Issued
                </div>
              </div>
              <p className="font-black text-slate-900 uppercase">OMS Payroll Audit</p>
              <p className="text-[10px] text-slate-500 font-mono">Timestamp: {generatedDateFormatted}</p>
            </div>

            <div className="space-y-1">
              <div className="h-10 flex items-center justify-center font-serif text-slate-600 font-bold text-sm">
                Corporate Finance
              </div>
              <p className="font-black text-slate-900 uppercase">Finance Controller</p>
              <p className="text-[10px] text-slate-500">OMS Enterprise Treasury</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
            Note: This is a computer-generated official payroll slip from the OMS Enterprise system. For inquiries, reach out to hr@oms.com.
          </div>
        </div>
      </div>
    </div>
  );
}
