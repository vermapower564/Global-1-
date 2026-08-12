"use client";

import React, { useState, useEffect } from "react";

interface PayrollItem {
  id: string;
  employeeName: string;
  monthYear: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPayable: number;
  status: string;
  bankRefNo: string | null;
  approvedAt: string;
  user?: {
    employeeId: string;
    email: string;
    role: string;
  };
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPayrolls(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalDisbursed = payrolls.reduce((sum, p) => sum + p.netPayable, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 💰 Header Banner - Deep Blue & Royal Payroll Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-blue-900/40 text-blue-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
            HR & Corporate Payroll Processing Engine
          </span>
          <h1 className="text-2xl font-black text-blue-100 tracking-tight mt-1">
            Monthly Employee Salary Approvals & Disbursement ({payrolls.length})
          </h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Review base salary calculations, performance bonuses, statutory deductions, net payouts, and bank ref numbers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-blue-300/80">Total Payroll Disbursed</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalDisbursed.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Approved Outflow</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-blue-300/80">Approved Staff Paystubs</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{payrolls.length} Salaries</p>
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">Bank Transfer Verified</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-blue-300/80">Performance Bonuses</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹50,000</p>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400">Q3 Performance Pay</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 border-l-4 border-l-amber-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-blue-300/80">Payroll Cycle</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">Aug 2026</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">1st Working Day Disbursement</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-blue-900/30 pb-3">
          Monthly Payroll Approvals Ledger (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading payroll approvals from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Month & Cycle</th>
                  <th>Base Salary</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Bank Ref Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-950/10 transition">
                    <td>
                      <p className="font-extrabold text-slate-900 dark:text-white">{p.employeeName}</p>
                      <p className="font-mono text-[10px] text-slate-500">{p.user?.employeeId || "EMP"}</p>
                    </td>
                    <td className="font-bold text-slate-700 dark:text-slate-300 text-xs">{p.monthYear}</td>
                    <td className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">₹{p.baseSalary.toLocaleString()}</td>
                    <td className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">+₹{p.bonus.toLocaleString()}</td>
                    <td className="font-mono text-xs text-rose-600 font-bold">-₹{p.deductions.toLocaleString()}</td>
                    <td className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">₹{p.netPayable.toLocaleString()}</td>
                    <td className="font-mono text-xs text-slate-600 dark:text-slate-300">{p.bankRefNo || "N/A"}</td>
                    <td>
                      <span className="badge badge-success text-[10px]">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
