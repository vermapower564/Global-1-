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
  const rawId = params?.id as string;
  const id = rawId ? decodeURIComponent(rawId) : "";

  const [slip, setSlip] = useState<SalarySlipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/salary-slips/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error("Access Denied: You do not have permission to view this salary slip.");
          if (res.status === 404) throw new Error("Salary slip record not found.");
          throw new Error("Failed to load salary slip.");
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && (json.data || json.slip)) {
          setSlip(json.data || json.slip);
        } else {
          setError(json.error || "Failed to load salary slip.");
        }
      })
      .catch((err) => {
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

  const paymentDateFormatted = slip.payment.paymentDate
    ? new Date(slip.payment.paymentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "01 " + slip.salaryMonth;

  const generatedDateFormatted = slip.generatedAt
    ? new Date(slip.generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : paymentDateFormatted;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 font-sans">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs print:hidden">
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
              Salary Slip • {slip.salaryMonth} • {slip.employeeName} ({slip.employeeId})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/api/salary-slips/${encodeURIComponent(slip.id)}/pdf`}
            download={`Salary_Slip_${slip.employeeId}_${slip.monthKey}.pdf`}
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
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Document Header */}
        <div className="p-8 border-b-2 border-slate-900 bg-slate-950 text-white space-y-3">
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
                PAYSLIP: {slip.salaryMonth.toUpperCase()}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Doc Ref: {slip.id}
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap justify-between border-t border-slate-800">
            <span>Corporate HQ: DLF Cyber City, Tower B, Sector 25, Gurugram, HR 122002</span>
            <span>CIN: U72200HR2022PTC099881 • PAN: AAAC01928K</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Employee & Bank Info Dual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {/* Column 1: Employee Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <span>👤</span>
                <span>Employee Identification</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Employee Name:</span>
                  <span className="font-extrabold text-slate-900">{slip.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Employee ID:</span>
                  <span className="font-mono font-bold text-blue-600">{slip.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Department:</span>
                  <span className="font-bold text-slate-800">{slip.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Designation / Role:</span>
                  <span className="font-bold text-slate-800">{slip.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Official Email:</span>
                  <span className="font-mono text-slate-700">{slip.employeeEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Salary Period:</span>
                  <span className="font-extrabold text-slate-900">{slip.salaryMonth}</span>
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
                  <span className="font-extrabold text-slate-900">{slip.payment.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Account Holder:</span>
                  <span className="font-bold text-slate-800">{slip.payment.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Account Number:</span>
                  <span className="font-mono font-bold text-slate-800">{slip.payment.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-800">{slip.payment.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payment Method:</span>
                  <span className="font-bold text-slate-800">{slip.payment.method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Disbursement Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      slip.payment.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    ● {slip.payment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    ₹{slip.earnings.basicSalary.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">House Rent Allowance (HRA)</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{slip.earnings.hra.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Special / Work Allowances</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{slip.earnings.allowances.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Performance Bonus</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{slip.earnings.bonus.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Overtime / Project Incentive</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{slip.earnings.overtime.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-t border-slate-200">
                <span className="text-xs font-black uppercase text-slate-900">Total Gross Earnings</span>
                <span className="text-sm font-mono font-black text-blue-700">
                  ₹{slip.earnings.grossSalary.toLocaleString("en-IN")}
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
                    ₹{slip.deductions.pfDeduction.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Tax Deducted at Source (TDS / Income Tax)</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{slip.deductions.taxDeduction.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600 font-semibold">Professional Tax / Other Deductions</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{slip.deductions.otherDeductions.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-400 font-medium">Voluntary Provident Fund</span>
                  <span className="font-mono text-slate-400">₹0</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-400 font-medium">Unpaid Leaves / LOP</span>
                  <span className="font-mono text-slate-400">₹0</span>
                </div>
              </div>
              <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-t border-slate-200">
                <span className="text-xs font-black uppercase text-slate-900">Total Deductions</span>
                <span className="text-sm font-mono font-black text-rose-600">
                  -₹{slip.deductions.totalDeductions.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box with Amount in Words */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block">
                  NET DISBURSED TAKE-HOME SALARY
                </span>
                <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                  ₹{slip.netSalary.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-blue-300 uppercase block">Disbursement Date</span>
                <p className="text-xs font-extrabold text-white font-mono">{paymentDateFormatted}</p>
                <span className="text-[10px] text-blue-300 font-mono block mt-1">Txn: {slip.payment.transactionReference}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-800/80">
              <span className="text-xs font-bold text-blue-200">
                Amount in Words: <strong className="text-white italic">{numberToWords(slip.netSalary)}</strong>
              </span>
            </div>
          </div>

          {/* Verification & Sign-off Footer */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
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
