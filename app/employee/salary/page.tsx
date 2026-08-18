"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SalarySlipModal from "@/components/SalarySlipModal";

export default function EmployeeSalaryPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [salarySlips, setSalarySlips] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  useEffect(() => {
    // 1. Fetch authenticated session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (json) => {
        if (json.authenticated && json.user) {
          setCurrentUser(json.user);

          // 2. Fetch salary slips for current logged-in employee
          const resSlips = await fetch(
            `/api/admin/employees/${encodeURIComponent(json.user.employeeId || json.user.id)}/salary-slips`
          );
          const dataSlips = await resSlips.json();
          if (dataSlips.success) {
            setSalarySlips(dataSlips.slips || []);
            setSummary(dataSlips.summary || null);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-6xl mx-auto font-sans">
        <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans bg-white text-black p-4 sm:p-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-2">
        <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">
          Employee Self-Service • Compensation Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          My Monthly Salary & Payment Slips
        </h1>
        <p className="text-xs text-slate-600">
          View your salary disbursement history, earnings/deductions breakdown, and download verified salary slip PDFs.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
            Net Monthly Pay
          </span>
          <p className="text-2xl font-black text-black font-mono">
            ₹{(summary?.currentSalary || 35000).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500 font-bold block">Current Salary Tier</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
            Last Disbursed
          </span>
          <p className="text-xl font-black text-black font-mono">
            {summary?.lastPaymentDate
              ? new Date(summary.lastPaymentDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "01 Aug 2026"}
          </p>
          <span className="text-[10px] text-slate-500 font-bold block">Direct Bank Transfer</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
            Latest Status
          </span>
          <p className="text-xl font-black text-emerald-600 flex items-center gap-1">
            <span>●</span>
            <span>{summary?.lastPaymentStatus || "Paid"}</span>
          </p>
          <span className="text-[10px] text-slate-500 font-bold block">Account Credited</span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
          <span className="text-blue-700 font-extrabold uppercase text-[10px] block">
            Next Scheduled Pay
          </span>
          <p className="text-xl font-black text-blue-700 font-mono">
            {summary?.nextPaymentDate
              ? new Date(summary.nextPaymentDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "01 Sep 2026"}
          </p>
          <span className="text-[10px] text-blue-600 font-bold block">
            Payroll Cycle: {summary?.paymentScheduleDay || 1}st
          </span>
        </div>
      </div>

      {/* Salary History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
        <h2 className="font-black text-base text-black">Salary Disbursement History</h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-black font-extrabold uppercase text-[11px]">
                <th className="py-3 px-4">Salary Month</th>
                <th className="py-3 px-4">Gross Salary</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Slip Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salarySlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50 transition text-black">
                  <td className="py-3.5 px-4 font-black text-black">{slip.salaryMonth}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-black">
                    ₹{Number(slip.grossSalary || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                    ₹{Number(slip.totalDeductions || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                    ₹{Number(slip.netSalary || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-black">
                    {slip.paymentDate
                      ? new Date(slip.paymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        slip.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      ● {slip.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSlip(slip);
                          setShowSlipModal(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg transition cursor-pointer"
                      >
                        View Slip
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSlip(slip);
                          setShowSlipModal(true);
                        }}
                        className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Modal */}
      <SalarySlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        slip={selectedSlip}
        employee={currentUser}
      />
    </div>
  );
}
