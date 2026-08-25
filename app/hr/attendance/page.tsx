"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { IconCalendar, IconSearch, IconFileText } from "@/components/Icons";

export default function HRAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "yesterday" | "daywise" | "month" | "all">("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "daywise" && selectedDate) params.set("date", selectedDate);
      if (period === "month" && selectedMonth) params.set("month", selectedMonth);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (deptFilter !== "ALL") params.set("department", deptFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setSummary(json.summary);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [period, selectedDate, selectedMonth, statusFilter, deptFilter]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.user?.department?.name) set.add(r.user.department.name);
    });
    return Array.from(set);
  }, [records]);

  const presentCount = summary?.todayPunches || records.filter((r) => r.status === "PRESENT").length;
  const activeShiftsNow = summary?.activeShiftsNow || records.filter((r) => r.isActiveShift).length;
  const completedShifts = summary?.completedShifts || records.filter((r) => !r.isActiveShift).length;
  const avgHours = summary?.avgShiftHours || 8.5;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Attendance & Shifts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>📅</span> Workforce Attendance Radar & History
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time biometric punch tracking, active shifts, historical shift ledger, and monthly duration calculations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/hr"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            ← HR Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Present Punches</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{presentCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Recorded check-ins</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active Shifts Now</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">{activeShiftsNow}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Currently clocked in</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-purple-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Completed Shifts</span>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">{completedShifts}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Clocked out</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Average Shift Duration</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2">{avgHours} hrs</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Per completed shift</p>
        </div>
      </div>

      {/* Filter Tabs & Period Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                period === "today" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("yesterday")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                period === "yesterday" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setPeriod("daywise")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                period === "daywise" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Custom Day
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                period === "month" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Monthly Summary
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                period === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Records
            </button>
          </div>

          {/* Date / Month input if active */}
          {period === "daywise" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 font-mono"
            />
          )}

          {period === "month" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 font-mono"
            />
          )}
        </div>

        {/* Search & Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employee name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Shift Statuses</option>
            <option value="ACTIVE_SHIFT">Active Shifts (Clocked In)</option>
            <option value="COMPLETED_SHIFT">Completed Shifts (Clocked Out)</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late Arrival</option>
            <option value="HALF_DAY">Half Day</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Check-In</th>
                <th className="py-3 px-3">Check-Out</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Shift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <Link
                        href={`/hr/employees/${rec.user?.id || rec.user?.employeeId}`}
                        className="hover:text-blue-600 transition"
                      >
                        {rec.user?.name || "Employee"}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-mono">{rec.user?.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{rec.user?.employeeId || "EMP"}</td>
                    <td className="py-3 px-3 text-slate-600">{typeof rec.user?.department === "object" ? rec.user?.department?.name : (rec.user?.department || "Operations")}</td>
                    <td className="py-3 px-3 font-mono text-slate-800">
                      {rec.date ? new Date(rec.date).toISOString().split("T")[0] : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString("en-IN") : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {rec.checkOutTime ? (
                        new Date(rec.checkOutTime).toLocaleTimeString("en-IN")
                      ) : (
                        <span className="text-blue-600 font-bold animate-pulse">● Active Shift</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">{rec.hoursWorked || 0} hrs</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          rec.isActiveShift
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {rec.isActiveShift ? "Active Shift" : rec.status || "PRESENT"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
