"use client";

import React, { useRef } from "react";
import { maskAccountNumber } from "@/lib/bankHelper";

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: any;
  employee: any;
}

export default function SalarySlipModal({
  isOpen,
  onClose,
  slip,
  employee,
}: SalarySlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !slip) return null;

  const empName = slip.employeeName || employee?.name || "Employee";
  const empId = slip.employeeId || employee?.employeeId || "EMP001";
  const empDept = employee?.department?.name || employee?.department || "Development & Engineering";
  const empRole = employee?.role?.replace(/_/g, " ") || "Software Developer";

  const basic = Number(slip.basicSalary) || 0;
  const hra = Number(slip.hra) || 0;
  const allowances = Number(slip.allowances) || 0;
  const bonus = Number(slip.bonus) || 0;
  const overtime = Number(slip.overtime) || 0;
  const gross = Number(slip.grossSalary) || basic + hra + allowances + bonus + overtime;

  const pf = Number(slip.pfDeduction) || 0;
  const tax = Number(slip.taxDeduction) || 0;
  const other = Number(slip.otherDeductions) || 0;
  const totalDeductions = Number(slip.totalDeductions) || pf + tax + other;

  const net = Number(slip.netSalary) || gross - totalDeductions;

  // Bank & Payment Information
  const accountHolder =
    slip.accountHolderName || employee?.bankDetail?.accountHolderName || empName;
  const bankName =
    slip.bankName || employee?.bankDetail?.bankName || "State Bank of India";
  const rawAcc =
    slip.accountNumberMasked ||
    (employee?.bankDetail?.accountNumber
      ? maskAccountNumber(employee.bankDetail.accountNumber)
      : "••••••••1234");
  const maskedAcc = rawAcc.includes("••••") ? rawAcc : maskAccountNumber(rawAcc);
  const ifscCode = slip.ifscCode || employee?.bankDetail?.ifscCode || "SBIN0001001";
  const paymentMethod = slip.paymentMethod || "Bank Transfer";
  const txnId = slip.transactionReference || "TXN-82910482";

  const payDateStr = slip.paymentDate
    ? new Date(slip.paymentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "01 August 2026";

  const genDateStr = slip.generatedAt
    ? new Date(slip.generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : payDateStr;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans print:p-0 print:bg-white">
      <div className="bg-white text-black rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in duration-200 print:border-none print:shadow-none print:max-w-full">
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">
              Salary Slip • {slip.salaryMonth}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                slip.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : slip.paymentStatus === "SCHEDULED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              ● {slip.paymentStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️</span>
              <span>Download / Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Salary Slip Document Container */}
        <div ref={printRef} className="p-8 space-y-6 bg-white text-black">
          {/* Header Branding */}
          <div className="text-center border-b-2 border-black pb-5 space-y-1">
            <h1 className="text-2xl font-black tracking-wider text-black uppercase">
              OMS ENTERPRISE
            </h1>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              Operations Management & Payroll Intelligence System
            </p>
            <div className="inline-block px-4 py-1 rounded-full bg-black text-white font-black text-xs tracking-wider uppercase mt-1">
              MONTHLY SALARY SLIP — {slip.salaryMonth?.toUpperCase()}
            </div>
          </div>

          {/* Employee & Payment Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-5">
            <div className="space-y-1.5">
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Employee Name
                </strong>
                <span className="text-sm font-black text-black">{empName}</span>
              </div>
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Employee ID
                </strong>
                <span className="font-mono font-black text-blue-600 text-xs">{empId}</span>
              </div>
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Department
                </strong>
                <span className="font-bold text-black">{empDept}</span>
              </div>
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Designation / Role
                </strong>
                <span className="font-bold text-black">{empRole}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-right sm:text-left">
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Salary Month
                </strong>
                <span className="font-black text-black">{slip.salaryMonth}</span>
              </div>
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Payment Date
                </strong>
                <span className="font-mono font-bold text-black">{payDateStr}</span>
              </div>
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Payment Status
                </strong>
                <span className="font-bold text-emerald-600 uppercase">{slip.paymentStatus || "PAID"}</span>
              </div>
              <div>
                <strong className="text-gray-500 font-bold uppercase text-[10px] block">
                  Generated Reference
                </strong>
                <span className="font-mono font-bold text-gray-700">{genDateStr}</span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* EARNINGS */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="border-b border-gray-300 pb-2">
                <h3 className="font-black text-xs text-black uppercase tracking-wide">
                  EARNINGS
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Basic Salary</span>
                  <span className="font-mono font-bold text-black">₹{basic.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">HRA</span>
                  <span className="font-mono font-bold text-black">₹{hra.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Allowances</span>
                  <span className="font-mono font-bold text-black">₹{allowances.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Performance Bonus</span>
                  <span className="font-mono font-bold text-black">₹{bonus.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Overtime</span>
                  <span className="font-mono font-bold text-black">₹{overtime.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-gray-300 flex justify-between font-black text-black">
                <span>GROSS SALARY</span>
                <span className="font-mono text-sm">₹{gross.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="border-b border-gray-300 pb-2">
                <h3 className="font-black text-xs text-black uppercase tracking-wide">
                  DEDUCTIONS
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">PF (Provident Fund)</span>
                  <span className="font-mono font-bold text-black">₹{pf.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Income Tax (TDS)</span>
                  <span className="font-mono font-bold text-black">₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Other Deductions</span>
                  <span className="font-mono font-bold text-black">₹{other.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-gray-300 flex justify-between font-black text-black">
                <span>TOTAL DEDUCTIONS</span>
                <span className="font-mono text-sm text-rose-700">₹{totalDeductions.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* NET SALARY HIGHLIGHT BANNER */}
          <div className="p-5 rounded-2xl bg-black text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                TOTAL NET SALARY DISBURSED
              </span>
              <p className="text-xs text-gray-300">
                (Gross Salary − Total Deductions)
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
                ₹{net.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* DEDICATED PAYMENT INFORMATION & BANK DETAILS SECTION */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
              <h3 className="font-black text-xs text-black uppercase tracking-wide flex items-center gap-1.5">
                <span>🏦</span> PAYMENT INFORMATION & BANK DETAILS
              </h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                Direct Bank Transfer
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Account Holder</span>
                <span className="font-bold text-black">{accountHolder}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Bank Name</span>
                <span className="font-bold text-black">{bankName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Account Number</span>
                <span className="font-mono font-bold text-black">{maskedAcc}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">IFSC Code</span>
                <span className="font-mono font-bold text-black">{ifscCode}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-500 text-[10px] font-bold uppercase mr-2">Payment Method:</span>
                <span className="font-bold text-black">{paymentMethod}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] font-bold uppercase mr-2">Transaction ID:</span>
                <span className="font-mono font-bold text-blue-600">{txnId}</span>
              </div>
            </div>
          </div>

          {/* Footer Remarks & Signatures */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-gray-500">
            <div>
              <p><strong>Generated Date:</strong> {genDateStr}</p>
              <p><strong>System Reference:</strong> This is a computer-generated salary slip authorized by OMS Payroll.</p>
            </div>

            <div className="text-center">
              <div className="h-10 border-b border-gray-400 w-40 mb-1"></div>
              <p className="font-extrabold text-black">Authorized Signatory</p>
              <p className="text-[10px]">Accounts & HR Finance Dept</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
