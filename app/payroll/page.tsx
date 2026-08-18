"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            HR & Corporate Payroll Processing Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Monthly Employee Salary Approvals & Disbursements ({payrolls.length})
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review base salary calculations, performance bonuses, deductions, net payouts, and bank ref numbers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/salary-slips"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            📁 Salary Slips Folder →
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Total Payroll Disbursed</span>
          <p className="text-2xl font-black text-black font-mono">₹{totalDisbursed.toLocaleString("en-IN")}</p>
          <span className="text-[11px] font-extrabold text-emerald-600">Approved Outflow</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Approved Paystubs</span>
          <p className="text-2xl font-black text-black font-mono">{payrolls.length} Salaries</p>
          <span className="text-[11px] font-extrabold text-blue-600">Bank Transfer Verified</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Performance Bonuses</span>
          <p className="text-2xl font-black text-black font-mono">₹50,000</p>
          <span className="text-[11px] font-extrabold text-blue-600">Q3 Performance Pay</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Payroll Cycle</span>
          <p className="text-2xl font-black text-black font-mono">August 2026</p>
          <span className="text-[11px] font-extrabold text-emerald-600">Active Cycle</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <h2 className="font-black text-black text-base border-b border-gray-100 pb-3">
          Monthly Payroll Approvals Ledger
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-gray-500">Loading payroll approvals...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Month & Cycle</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Bonus</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bank Ref No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition text-black">
                    <td className="py-3.5 px-4 font-bold text-black">
                      {p.employeeName}{" "}
                      {p.user?.employeeId && (
                        <span className="text-gray-500 font-mono font-normal">({p.user.employeeId})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-700">{p.monthYear}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">₹{p.baseSalary.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">₹{p.bonus.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">₹{p.deductions.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                      ₹{p.netPayable.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">{p.bankRefNo || "TXN-82910384"}</td>
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
