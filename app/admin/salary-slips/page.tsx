"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SalarySlipModal from "@/components/SalarySlipModal";

interface SalarySlipItem {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  salaryMonth: string;
  monthKey: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  overtime: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  paymentDate: string | null;
  paymentStatus: string;
  paymentMethod: string;
  transactionReference: string | null;
  notes: string | null;
  generatedAt: string;
  bankName?: string;
  accountNumberMasked?: string;
  user?: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    paymentScheduleDay: number;
    department?: { name: string };
  };
}

export default function AdminSalarySlipsFolderPage() {
  const [slips, setSlips] = useState<SalarySlipItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([
    "August 2026",
    "July 2026",
    "June 2026",
    "May 2026",
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Default to single month (August 2026) as requested
  const [monthFilter, setMonthFilter] = useState("August 2026");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toastMsg, setToastMsg] = useState("");

  // Slip Modal Target
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipItem | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const [accessDenied, setAccessDenied] = useState(false);

  const fetchSalarySlips = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        month: monthFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/salary-slips?${query.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const json = await res.json();

      if (json.success) {
        setSlips(json.slips || json.data || []);
        setMetrics(json.metrics || json.summary || null);
        if (json.availableMonths && json.availableMonths.length > 0) {
          const uniqueMonths = Array.from(new Set<string>(json.availableMonths));
          setAvailableMonths(uniqueMonths);
        }
      } else {
        if (res.status === 403 || json.error?.includes("Forbidden")) {
          setAccessDenied(true);
        }
      }
    } catch (e) {
      console.error("Failed to load salary slips:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalarySlips();
  }, [monthFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalarySlips();
  };

  // Previous & Next Month Navigation Helpers
  const handlePreviousMonth = () => {
    const currentIndex = availableMonths.indexOf(monthFilter);
    if (currentIndex !== -1 && currentIndex < availableMonths.length - 1) {
      setMonthFilter(availableMonths[currentIndex + 1]);
    } else if (monthFilter === "All" && availableMonths.length > 0) {
      setMonthFilter(availableMonths[0]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.indexOf(monthFilter);
    if (currentIndex > 0) {
      setMonthFilter(availableMonths[currentIndex - 1]);
    }
  };

  const handleUpdateStatus = async (slip: SalarySlipItem, newStatus: string) => {
    try {
      const res = await fetch(
        `/api/admin/employees/${encodeURIComponent(slip.employeeId || slip.userId)}/salary-slips`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slipId: slip.id, paymentStatus: newStatus }),
        }
      );

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Salary slip for ${slip.employeeName} (${slip.salaryMonth}) marked as ${newStatus}!`);
        fetchSalarySlips();
      }
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const currentIndex = availableMonths.indexOf(monthFilter);
  const canGoPrevious = currentIndex !== -1 && currentIndex < availableMonths.length - 1;
  const canGoNext = currentIndex > 0;

  if (accessDenied) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-3xl shadow-lg text-center space-y-4 font-sans">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 font-black text-2xl flex items-center justify-center mx-auto">
          🚫
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          403 — Forbidden Access
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Organization Salary Slips & Payroll Ledger is restricted strictly to authorized Executive, HR, and Finance personnel. Project Managers, Team Leaders, and general employees do not have authorization to view this section.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-bold text-xs p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              📁 Organization Payroll Folder
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              TiDB Cloud Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Monthly Employee Salary Slips
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review monthly salary disbursements for all employees. Use Previous/Next month controls to navigate payroll history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/employees"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-xl transition border border-gray-200"
          >
            Employee Directory →
          </Link>
        </div>
      </div>

      {/* 🗓️ MONTH SWITCHER CONTROL STRIP (One Month at a Time + Previous Month) */}
      <div className="bg-blue-50/70 border-2 border-blue-200 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Previous Month Button */}
          <button
            onClick={handlePreviousMonth}
            disabled={!canGoPrevious}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              canGoPrevious
                ? "bg-white text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
          >
            <span>←</span> Previous Month
          </button>

          {/* Current Month Active Badge */}
          <div className="bg-white px-5 py-2 rounded-2xl border-2 border-blue-600 shadow-xs text-center flex-1 md:flex-none">
            <span className="text-[10px] font-black uppercase text-blue-600 block">Active Payroll Month</span>
            <span className="text-base font-black text-black">{monthFilter}</span>
          </div>

          {/* Next Month Button */}
          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              canGoNext
                ? "bg-white text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
          >
            Next Month <span>→</span>
          </button>
        </div>

        {/* Quick Month Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-1">Select Month:</span>
          {Array.from(new Set(availableMonths)).map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                monthFilter === m
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => setMonthFilter("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              monthFilter === "All"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Archive
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Selected Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-gray-500">
            Total Slips ({monthFilter})
          </span>
          <p className="text-2xl font-black text-black font-mono mt-1">{slips.length}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Employees processed</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">
            Total Disbursed (Net)
          </span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
            ₹{(metrics?.totalDisbursed || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-xs text-emerald-600 block mt-0.5">Bank disbursements</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-blue-600">
            Gross Payroll
          </span>
          <p className="text-2xl font-black text-blue-600 font-mono mt-1">
            ₹{(metrics?.totalGross || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-xs text-blue-600 block mt-0.5">Basic + HRA + Allowances</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-rose-600">
            Total Deductions
          </span>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">
            ₹{(metrics?.totalDeductions || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-xs text-rose-600 block mt-0.5">PF (12%) + Tax + PT</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name, ID, or bank..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-xs font-semibold text-black focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">Status:</span>
          {["All", "PAID", "SCHEDULED", "PENDING"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-5">Salary Month</th>
                <th className="py-4 px-5">Gross Pay</th>
                <th className="py-4 px-5">Deductions</th>
                <th className="py-4 px-5">Net Take-Home</th>
                <th className="py-4 px-5">Bank Account</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 font-bold text-xs">
                    Loading salary slips for {monthFilter}...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 italic text-xs">
                    No salary slips found for {monthFilter}.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-blue-50/40 transition text-black">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                          {(slip.employeeName || "E")[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-black">{slip.employeeName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{slip.employeeId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                        {slip.salaryMonth}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono font-bold text-gray-800">
                      ₹{slip.grossSalary?.toLocaleString("en-IN")}
                    </td>

                    <td className="py-4 px-5 font-mono font-bold text-rose-600">
                      -₹{slip.totalDeductions?.toLocaleString("en-IN")}
                    </td>

                    <td className="py-4 px-5 font-mono font-black text-emerald-600 text-sm">
                      ₹{slip.netSalary?.toLocaleString("en-IN")}
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-bold text-xs text-gray-700">{slip.bankName || "State Bank of India"}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{slip.accountNumberMasked || "••••••••6543"}</p>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          slip.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {slip.paymentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/salary-slips/${encodeURIComponent(slip.id)}`}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1"
                          title="Open Full Salary Slip Page"
                        >
                          <span>Full View</span>
                          <span>📄</span>
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedSlip(slip);
                            setShowSlipModal(true);
                          }}
                          title="Quick Print Preview"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
                        >
                          🖨️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Print Modal */}
      {showSlipModal && selectedSlip && (
        <SalarySlipModal
          isOpen={showSlipModal}
          slip={selectedSlip}
          employee={selectedSlip.user || { name: selectedSlip.employeeName, employeeId: selectedSlip.employeeId }}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
}
