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
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toastMsg, setToastMsg] = useState("");

  // Slip Modal Target
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipItem | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const fetchSalarySlips = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        month: monthFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/salary-slips?${query.toString()}`);
      const json = await res.json();

      if (json.success) {
        setSlips(json.slips || []);
        setMetrics(json.metrics || null);
        if (json.availableMonths) {
          setAvailableMonths(json.availableMonths);
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

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono">
        <span>OMS</span>
        <span>/</span>
        <span>Admin</span>
        <span>/</span>
        <span className="text-black font-extrabold">Salary Slips Folder</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            📁 Organization Payroll & Compensation Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            All Employee Salary Slips Master Folder ({slips.length})
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Central repository of monthly earnings, deductions, net salary disbursement, and printable PDF salary slips for all staff members.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/employees"
            className="bg-slate-100 hover:bg-slate-200 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            ← Employee Directory
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
            Total Monthly Outflow
          </span>
          <p className="text-2xl font-black text-black font-mono">
            ₹{(metrics?.totalOutflow || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold block">Disbursed Successfully</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
            Paid Slips
          </span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {metrics?.paidCount || 0} Slips
          </p>
          <span className="text-[10px] text-slate-500 font-bold block">Credited to Bank Accounts</span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
          <span className="text-blue-700 font-extrabold uppercase text-[10px] block">
            Scheduled Slips
          </span>
          <p className="text-2xl font-black text-blue-700 font-mono">
            {metrics?.scheduledCount || 0} Slips
          </p>
          <span className="text-[10px] text-blue-600 font-bold block">Awaiting Cycle Date</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
            Pending / In-Review
          </span>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {metrics?.pendingCount || 0} Slips
          </p>
          <span className="text-[10px] text-slate-500 font-bold block">Payroll Approval Queue</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 flex gap-2">
          <input
            type="text"
            placeholder="Search by name, employee ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-black focus:border-blue-600 focus:outline-none font-medium"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none"
          >
            <option value="All">All Salary Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Master Salary Slips Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-black font-extrabold uppercase text-[11px]">
                <th className="py-3.5 px-4 text-black">Employee</th>
                <th className="py-3.5 px-4 text-black">Employee ID</th>
                <th className="py-3.5 px-4 text-black">Department & Role</th>
                <th className="py-3.5 px-4 text-black">Salary Month</th>
                <th className="py-3.5 px-4 text-black">Gross Pay</th>
                <th className="py-3.5 px-4 text-black">Deductions</th>
                <th className="py-3.5 px-4 text-black">Net Salary</th>
                <th className="py-3.5 px-4 text-black">Disbursement Date</th>
                <th className="py-3.5 px-4 text-black">Status</th>
                <th className="py-3.5 px-4 text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500 font-medium text-xs">
                    Loading salary slip database records...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400 italic text-xs">
                    No salary slips found matching your filters.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => {
                  const empInitials = (slip.employeeName || "E")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50 transition text-black">
                      {/* Employee Avatar & Name (Blue box) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shrink-0">
                            {empInitials}
                          </div>
                          <div>
                            <Link
                              href={`/admin/employees/${slip.employeeId || slip.userId}`}
                              className="font-black text-black hover:text-blue-600 transition-colors text-xs block"
                            >
                              {slip.employeeName}
                            </Link>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {slip.user?.email || "employee@gmail.com"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/employees/${slip.employeeId || slip.userId}`}
                          className="font-mono text-xs font-bold text-slate-900 hover:text-blue-600 transition"
                        >
                          {slip.employeeId}
                        </Link>
                      </td>

                      {/* Dept & Role */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-black text-xs">
                          {slip.user?.role?.replace(/_/g, " ") || "Software Developer"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {slip.user?.department?.name || "Development & Engineering"}
                        </p>
                      </td>

                      {/* Salary Month */}
                      <td className="py-3.5 px-4 font-black text-black text-xs">
                        {slip.salaryMonth}
                      </td>

                      {/* Gross */}
                      <td className="py-3.5 px-4 font-mono font-bold text-black">
                        ₹{Number(slip.grossSalary || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Deductions */}
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                        ₹{Number(slip.totalDeductions || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Net Salary */}
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                        ₹{Number(slip.netSalary || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Payment Date */}
                      <td className="py-3.5 px-4 font-mono text-black text-xs">
                        {slip.paymentDate
                          ? new Date(slip.paymentDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            slip.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : slip.paymentStatus === "SCHEDULED"
                              ? "bg-blue-100 text-blue-800"
                              : slip.paymentStatus === "FAILED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          ● {slip.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
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
                          <Link
                            href={`/admin/employees/${slip.employeeId || slip.userId}`}
                            className="bg-slate-100 hover:bg-slate-200 text-black font-bold text-[11px] px-2 py-1 rounded-lg transition"
                            title="Open 360° Profile"
                          >
                            360°
                          </Link>
                          {slip.paymentStatus !== "PAID" ? (
                            <button
                              onClick={() => handleUpdateStatus(slip, "PAID")}
                              className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-[11px] px-2 py-1 rounded-lg transition cursor-pointer"
                              title="Mark as Paid"
                            >
                              ✓ Paid
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(slip, "PENDING")}
                              className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white font-bold text-[11px] px-2 py-1 rounded-lg transition cursor-pointer"
                              title="Mark as Pending"
                            >
                              Pending
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Modal */}
      <SalarySlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        slip={selectedSlip}
        employee={selectedSlip?.user}
      />
    </div>
  );
}
