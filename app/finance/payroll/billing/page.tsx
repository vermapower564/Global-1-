"use client";

import React, { useState } from "react";
import Link from "next/link";
import { exportToCSV } from "@/utils/exportEngine";

export interface MonthlyEmployeeSalaryBill {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  bankAccount: string;
  baseSalary: number;
  daysPresent: number;
  daysAbsent: number;
  bonus: number;
  hraAllowance: number;
  deductions: number;
  netPayable: number;
  billNumber: string;
  status: "PAID" | "GENERATED" | "PENDING";
  paymentDate?: string;
  paymentMode: string;
}

const initialCompanyMembers: MonthlyEmployeeSalaryBill[] = [
  {
    employeeId: "EMP001",
    employeeName: "Roushan Verma",
    department: "Engineering & Tech",
    designation: "Tech Lead & Solutions Architect",
    bankAccount: "HDFC Bank **** 4819",
    baseSalary: 120000,
    daysPresent: 22,
    daysAbsent: 0,
    bonus: 10000,
    hraAllowance: 5000,
    deductions: 5000,
    netPayable: 130000,
    billNumber: "BILL-2026-AUG-001",
    status: "PAID",
    paymentDate: "2026-08-01",
    paymentMode: "Direct Bank HDFC NEFT/IMPS",
  },
  {
    employeeId: "EMP002",
    employeeName: "Priya Sharma",
    department: "Human Resources",
    designation: "HR Manager & Talent Lead",
    bankAccount: "ICICI Bank **** 9912",
    baseSalary: 90000,
    daysPresent: 21,
    daysAbsent: 1,
    bonus: 5000,
    hraAllowance: 4000,
    deductions: 3000,
    netPayable: 96000,
    billNumber: "BILL-2026-AUG-002",
    status: "PAID",
    paymentDate: "2026-08-01",
    paymentMode: "Direct Bank ICICI NEFT",
  },
  {
    employeeId: "EMP003",
    employeeName: "Aarav Sharma",
    department: "Engineering & Tech",
    designation: "Senior Fullstack Engineer",
    bankAccount: "Axis Bank **** 2011",
    baseSalary: 110000,
    daysPresent: 22,
    daysAbsent: 0,
    bonus: 8000,
    hraAllowance: 5000,
    deductions: 4500,
    netPayable: 118500,
    billNumber: "BILL-2026-AUG-003",
    status: "GENERATED",
    paymentDate: "2026-08-02",
    paymentMode: "Axis Bank Corporate Transfer",
  },
  {
    employeeId: "EMP004",
    employeeName: "Sneha Reddy",
    department: "Marketing & Growth",
    designation: "Digital Growth Lead",
    bankAccount: "SBI Bank **** 7734",
    baseSalary: 85000,
    daysPresent: 20,
    daysAbsent: 2,
    bonus: 6000,
    hraAllowance: 3500,
    deductions: 3500,
    netPayable: 91000,
    billNumber: "BILL-2026-AUG-004",
    status: "PENDING",
    paymentMode: "SBI Corporate Direct Credit",
  },
  {
    employeeId: "EMP005",
    employeeName: "Aditya Raj",
    department: "Engineering & Tech",
    designation: "Full Stack Developer",
    bankAccount: "Kotak Bank **** 5109",
    baseSalary: 95000,
    daysPresent: 22,
    daysAbsent: 0,
    bonus: 7000,
    hraAllowance: 4000,
    deductions: 4000,
    netPayable: 102000,
    billNumber: "BILL-2026-AUG-005",
    status: "GENERATED",
    paymentDate: "2026-08-02",
    paymentMode: "Kotak Mahindra Corporate Salary Account",
  },
];

export default function AdminMonthlySalaryBillingPage() {
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [bills, setBills] = useState<MonthlyEmployeeSalaryBill[]>(initialCompanyMembers);
  const [selectedBillModal, setSelectedBillModal] = useState<MonthlyEmployeeSalaryBill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Mark Salary Bill as Paid for Employee Member
  const handleMarkAsPaid = (employeeId: string) => {
    const updated = bills.map((b) =>
      b.employeeId === employeeId
        ? { ...b, status: "PAID" as const, paymentDate: new Date().toISOString().split("T")[0] }
        : b
    );
    setBills(updated);
    setToastMsg("✓ Monthly Salary Payment Bill marked as PAID and dispatched to bank!");
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Generate All Bills for Month
  const handleGenerateAllBills = () => {
    const updated = bills.map((b) => ({ ...b, status: b.status === "PENDING" ? ("GENERATED" as const) : b.status }));
    setBills(updated);
    setToastMsg(`✓ All ${selectedMonth} Monthly Salary Bills Generated for Company Members!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const totalPayrollOutflow = bills.reduce((acc, b) => acc + b.netPayable, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white font-extrabold text-xs p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Admin Payroll & Finance / Monthly Salary Bill Generator Desk
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Company Members Monthly Salary Payment Bill Desk ({selectedMonth})
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Compute monthly salary bills for all working company staff members, issue official payment slips in ₹ Rupees, and log payment history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateAllBills}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            ⚡ Generate All Monthly Bills
          </button>
          <Link href="/history" className="btn-secondary text-xs">
            🏛️ View Master Payment History
          </Link>
          <button
            onClick={() => exportToCSV(`Monthly_Salary_Bills_${selectedMonth.replace(" ", "_")}`, bills)}
            className="btn-secondary text-xs"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* Month Selector & KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Target Billing Month</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="May 2026">May 2026</option>
          </select>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Monthly Salary Bill</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">₹{totalPayrollOutflow.toLocaleString()}</p>
          <span className="text-[11px] font-semibold text-emerald-600">Company Payroll Outflow (₹)</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Company Members</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{bills.length} Staff Members</p>
          <span className="text-[11px] font-semibold text-blue-600">100% Active Staff</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Payment Status</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {bills.filter((b) => b.status === "PAID").length} Paid / {bills.length} Total
          </p>
          <span className="text-[11px] font-semibold text-amber-600">Bank Transfer Processing</span>
        </div>
      </div>

      {/* Salary Bills Master Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
          Company Members Monthly Salary Bill Ledger ({selectedMonth})
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Bill Slip ID</th>
                <th className="p-3">Company Staff Member</th>
                <th className="p-3">Base Salary</th>
                <th className="p-3">Days Present</th>
                <th className="p-3">Bonus & HRA</th>
                <th className="p-3">Net Payable Salary</th>
                <th className="p-3">Status</th>
                <th className="p-3">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {bills.map((b) => (
                <tr key={b.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3">
                    <span className="font-mono text-xs font-extrabold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-1 rounded">
                      {b.billNumber}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-extrabold text-slate-900 dark:text-white">👤 {b.employeeName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{b.employeeId} • {b.designation}</p>
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    ₹{b.baseSalary.toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">
                    {b.daysPresent} Days Present ({b.daysAbsent} Absent)
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    +₹{(b.bonus + b.hraAllowance).toLocaleString()} / -₹{b.deductions.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    ₹{b.netPayable.toLocaleString()}
                  </td>
                  <td className="p-3 font-bold">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] ${
                        b.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : b.status === "GENERATED"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBillModal(b)}
                        className="text-[11px] font-extrabold text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                      >
                        🧾 View Payment Slip
                      </button>
                      {b.status !== "PAID" && (
                        <button
                          onClick={() => handleMarkAsPaid(b.employeeId)}
                          className="text-[11px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded transition"
                        >
                          ✓ Pay Bill
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📜 OFFICIAL CORPORATE SALARY PAYMENT BILL SLIP MODAL */}
      {selectedBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-300 print:shadow-none print:border-none">
            {/* Header / Watermark */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-600 text-white font-extrabold text-xl rounded-xl flex items-center justify-center shadow-md">
                    O
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                      OMS Enterprise Global Pvt. Ltd.
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      DLF Cyber City, Tower B, Phase 2, Gurugram, India • CIN: L72200HR2026PTC099128
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-slate-900 text-white font-mono text-xs px-3 py-1 rounded-lg font-extrabold inline-block">
                  PAYMENT SLIP
                </span>
                <p className="text-xs font-mono font-extrabold text-red-600 mt-1.5">
                  {selectedBillModal.billNumber}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Date: {selectedBillModal.paymentDate || new Date().toISOString().split("T")[0]}
                </p>
              </div>
            </div>

            {/* Employee Profile Matrix */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Employee Information</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedBillModal.employeeName}</p>
                <p className="text-slate-600 font-medium">{selectedBillModal.designation}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">ID: {selectedBillModal.employeeId} | Dept: {typeof selectedBillModal.department === "object" ? (selectedBillModal.department as any)?.name : selectedBillModal.department}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Payment Transfer Details</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedMonth}</p>
                <p className="text-emerald-700 font-bold font-mono">{selectedBillModal.bankAccount}</p>
                <p className="text-slate-500 font-medium text-[11px] mt-1">Mode: {selectedBillModal.paymentMode}</p>
              </div>
            </div>

            {/* Itemized Earnings vs Deductions Table */}
            <div className="border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="p-3 border-r border-slate-700">Earnings Description</th>
                    <th className="p-3 border-r border-slate-700 text-right">Amount (₹)</th>
                    <th className="p-3 border-r border-slate-700">Deductions</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 border-r font-semibold">Basic Monthly Gross Salary</td>
                    <td className="p-3 border-r font-mono text-right font-bold">₹{selectedBillModal.baseSalary.toLocaleString()}</td>
                    <td className="p-3 border-r font-semibold text-rose-700">Provident Fund (PF) & Income Tax TDS</td>
                    <td className="p-3 font-mono text-right font-bold text-rose-700">₹{selectedBillModal.deductions.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-semibold text-emerald-700">Performance Incentive / Bonus</td>
                    <td className="p-3 border-r font-mono text-right font-bold text-emerald-700">+₹{selectedBillModal.bonus.toLocaleString()}</td>
                    <td className="p-3 border-r text-slate-400 italic">Medical Insurance & Deductions</td>
                    <td className="p-3 font-mono text-right text-slate-400">₹0</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-semibold text-blue-700">House Rent Allowance (HRA) & Travel</td>
                    <td className="p-3 border-r font-mono text-right font-bold text-blue-700">+₹{selectedBillModal.hraAllowance.toLocaleString()}</td>
                    <td className="p-3 border-r font-semibold">Total Deductions</td>
                    <td className="p-3 font-mono text-right font-bold text-rose-700">-₹{selectedBillModal.deductions.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-emerald-50 font-extrabold text-emerald-900 text-sm">
                    <td className="p-3 border-r" colSpan={3}>
                      TOTAL NET SALARY DISPATCHED TO BANK (₹)
                    </td>
                    <td className="p-3 text-right font-mono text-base text-emerald-700">
                      ₹{selectedBillModal.netPayable.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verification Signatures */}
            <div className="pt-6 border-t grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-400 italic">
                  [Verified Digital Stamp]
                </div>
                <p className="font-extrabold text-slate-900 mt-1">Authorized HR Lead</p>
                <p className="text-[10px] text-slate-500">Priya Sharma</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-400 italic">
                  [Approved Finance Stamp]
                </div>
                <p className="font-extrabold text-slate-900 mt-1">Chief Finance Officer</p>
                <p className="text-[10px] text-slate-500">Amit Patel</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-400 italic">
                  [Received]
                </div>
                <p className="font-extrabold text-slate-900 mt-1">Employee Acknowledgment</p>
                <p className="text-[10px] text-slate-500">{selectedBillModal.employeeName}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 print:hidden">
              <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5">
                🖨️ Print Payment Slip
              </button>
              <button onClick={() => setSelectedBillModal(null)} className="btn-secondary text-xs px-4 py-2.5 rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
