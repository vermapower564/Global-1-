"use client";

import React, { useRef } from "react";

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
  const gross = Number(slip.grossSalary) || (basic + hra + allowances + bonus + overtime);

  const pf = Number(slip.pfDeduction) || 0;
  const tax = Number(slip.taxDeduction) || 0;
  const other = Number(slip.otherDeductions) || 0;
  const totalDeductions = Number(slip.totalDeductions) || (pf + tax + other);

  const net = Number(slip.netSalary) || (gross - totalDeductions);

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans print:p-0 print:bg-white">
      <div className="bg-white text-black rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in duration-200 print:border-none print:shadow-none print:max-w-full">
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">
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
              className="h-8 w-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Salary Slip Document Container */}
        <div ref={printRef} className="p-8 space-y-6 bg-white text-black">
          {/* Header Branding */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
            <h1 className="text-2xl font-black tracking-wider text-slate-950 uppercase">
              ZYVORO ENTERPRISE
            </h1>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Operations Management System (OMS)
            </p>
            <div className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white font-black text-xs tracking-wider uppercase mt-1">
              MONTHLY SALARY SLIP — {slip.salaryMonth?.toUpperCase()}
            </div>
          </div>

          {/* Employee & Payment Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-5">
            <div className="space-y-1.5">
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Employee Name
                </strong>
                <span className="text-sm font-black text-black">{empName}</span>
              </p>
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Employee ID
                </strong>
                <span className="font-mono font-black text-blue-600 text-xs">{empId}</span>
              </p>
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Department
                </strong>
                <span className="font-bold text-black">{empDept}</span>
              </p>
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Designation / Role
                </strong>
                <span className="font-bold text-black">{empRole}</span>
              </p>
            </div>

            <div className="space-y-1.5 text-right sm:text-left">
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Salary Month
                </strong>
                <span className="font-black text-black">{slip.salaryMonth}</span>
              </p>
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Payment Date
                </strong>
                <span className="font-mono font-bold text-black">{payDateStr}</span>
              </p>
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Payment Method
                </strong>
                <span className="font-bold text-black">{slip.paymentMethod || "Bank Transfer"}</span>
              </p>
              <p>
                <strong className="text-slate-500 font-bold uppercase text-[10px] block">
                  Transaction / Ref ID
                </strong>
                <span className="font-mono font-bold text-slate-800">{slip.transactionReference || "TXN-72819401"}</span>
              </p>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* EARNINGS */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="border-b border-slate-300 pb-2">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wide">
                  EARNINGS
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Basic Salary</span>
                  <span className="font-mono font-bold text-black">₹{basic.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">HRA</span>
                  <span className="font-mono font-bold text-black">₹{hra.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Allowances</span>
                  <span className="font-mono font-bold text-black">₹{allowances.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Performance Bonus</span>
                  <span className="font-mono font-bold text-black">₹{bonus.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Overtime</span>
                  <span className="font-mono font-bold text-black">₹{overtime.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-300 flex justify-between font-black text-slate-950">
                <span>GROSS SALARY</span>
                <span className="font-mono text-sm">₹{gross.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="border-b border-slate-300 pb-2">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wide">
                  DEDUCTIONS
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">PF (Provident Fund)</span>
                  <span className="font-mono font-bold text-black">₹{pf.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Professional Tax</span>
                  <span className="font-mono font-bold text-black">₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Other Deductions</span>
                  <span className="font-mono font-bold text-black">₹{other.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-300 flex justify-between font-black text-slate-950">
                <span>TOTAL DEDUCTIONS</span>
                <span className="font-mono text-sm text-rose-700">₹{totalDeductions.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* NET SALARY HIGHLIGHT BANNER */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                TOTAL NET SALARY DISBURSED
              </span>
              <p className="text-xs text-slate-300">
                (Gross Salary − Total Deductions)
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
                ₹{net.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Footer Remarks & Signatures */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-slate-500">
            <div>
              <p><strong>Generated Date:</strong> {genDateStr}</p>
              <p><strong>System Reference:</strong> This is a computer-generated salary slip authorized by OMS Payroll.</p>
            </div>

            <div className="text-center">
              <div className="h-10 border-b border-slate-400 w-40 mb-1"></div>
              <p className="font-extrabold text-slate-900">Authorized Signatory</p>
              <p className="text-[10px]">Accounts & HR Finance Dept</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
