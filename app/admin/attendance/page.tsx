"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconCheck } from "@/components/Icons";
import WorkTimeSlideViewer from "@/components/WorkTimeSlideViewer";

interface AttendancePunch {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked: number;
  status: string;
  isActiveShift: boolean;
  user?: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department?: { name: string } | null;
  };
}

export default function AdminAttendancePage() {
  const [viewMode, setViewMode] = useState<"SLIDE_VIEWER" | "MASTER_LEDGER">("SLIDE_VIEWER");
  const [records, setRecords] = useState<AttendancePunch[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters (Defaults to today's punches)
  const todayStr = new Date().toISOString().split("T")[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState(todayStr);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (departmentFilter !== "ALL") params.set("department", departmentFilter);
      if (dateFilter) params.set("date", dateFilter);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setSummary(json.summary || null);
      }
    } catch (err) {
      console.warn("Failed to fetch attendance punch ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter, departmentFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttendance();
  };

  const exportCSV = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Role",
      "Department",
      "Date",
      "Check-In Time",
      "Check-Out Time",
      "Shift Hours",
      "Shift Status",
    ];

    const rows = records.map((r) => [
      r.user?.employeeId || r.userId,
      `"${r.user?.name || "Employee"}"`,
      r.user?.role || "EMPLOYEE",
      `"${r.user?.department?.name || "Operations"}"`,
      r.date ? new Date(r.date).toLocaleDateString("en-IN") : "-",
      r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-IN") : "-",
      r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN") : "ACTIVE SHIFT",
      r.hoursWorked || 0,
      r.isActiveShift ? "ACTIVE_CLOCK_IN" : "COMPLETED",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Workforce_Attendance_Punches_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueDepartments = Array.from(
    new Set(records.map((r) => r.user?.department?.name).filter(Boolean))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-black bg-white">
      {/* Top Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Control Center • Biometric Workforce Intelligence
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono">
              TiDB Cloud Connected ⚡
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Master Employee Punch & Work Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time biometric shift clock ledger, punch-in/out timestamps, hours worked, and EOD work details across Today, Yesterday, Daywise, Month, and Year.
          </p>
        </div>

        {/* View Mode Toggle & Export Button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode("SLIDE_VIEWER")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "SLIDE_VIEWER"
                  ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>📊</span> Time-Slide Explorer
            </button>
            <button
              onClick={() => setViewMode("MASTER_LEDGER")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "MASTER_LEDGER"
                  ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>📑</span> Raw Ledger ({records.length})
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "SLIDE_VIEWER" ? (
        <WorkTimeSlideViewer isAdmin={true} />
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400">Total Shift Records</span>
              <p className="text-2xl font-black text-black font-mono">{summary?.totalRecords || records.length}</p>
              <span className="text-[11px] text-gray-500 font-medium">Recorded in TiDB Cloud</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400">Punches Logged Today</span>
              <p className="text-2xl font-black text-blue-600 font-mono">{summary?.todayPunches || 0}</p>
              <span className="text-[11px] text-gray-500 font-medium">Verified check-ins today</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400">Currently Clocked In</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <p className="text-2xl font-black text-black font-mono">{summary?.activeShiftsNow || 0}</p>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">Active shifts now</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400">Average Shift Hours</span>
              <p className="text-2xl font-black text-black font-mono">{summary?.avgShiftHours || "8.4"} hrs</p>
              <span className="text-[11px] text-gray-500 font-medium">Completed shifts average</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Employee Name, ID, or Email..."
                className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-xs font-semibold text-black focus:border-blue-600 focus:outline-none transition"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Shift Statuses</option>
                <option value="ACTIVE_SHIFT">🟢 Clocked In (Active)</option>
                <option value="COMPLETED_SHIFT">🔴 Clocked Out (Completed)</option>
                <option value="PRESENT">Present</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {uniqueDepartments.map((dept: any) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDateFilter(todayStr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    dateFilter === todayStr
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yest = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0];
                    setDateFilter(yest);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    dateFilter === new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0]
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    dateFilter === ""
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  All History
                </button>
              </div>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
              />

              {(searchQuery || statusFilter !== "ALL" || departmentFilter !== "ALL" || dateFilter !== todayStr) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setDepartmentFilter("ALL");
                    setDateFilter(todayStr);
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Reset to Today
                </button>
              )}
            </div>
          </div>

          {/* Master Punch Ledger Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-black text-sm">
                Master Workforce Attendance Punch Records ({records.length})
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                Click any employee to view 360° Profile Dossier
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-xs font-bold">
                Loading biometric punch records from TiDB Cloud...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Punch-In Time</th>
                      <th className="py-3 px-4">Punch-Out Time</th>
                      <th className="py-3 px-4">Shift Hours</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition text-black">
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/employees/${r.user?.employeeId || r.userId}`}
                            className="font-extrabold text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            <span>{r.user?.name || "Employee"}</span>
                          </Link>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {r.user?.employeeId || "EMP"} • {r.user?.role || "Staff"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {r.user?.department?.name || "Operations"}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-gray-700">
                          {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "-"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-IN") : "-"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">
                          {r.checkOutTime ? (
                            new Date(r.checkOutTime).toLocaleTimeString("en-IN")
                          ) : (
                            <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                              ⚡ Clocked In Now
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {r.hoursWorked > 0 ? `${r.hoursWorked} hrs` : r.checkOutTime ? "0 hrs" : "In Progress"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.isActiveShift
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {r.isActiveShift ? "ACTIVE SHIFT" : r.status || "PRESENT"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/employees/${r.user?.employeeId || r.userId}`}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 text-blue-600 font-extrabold text-[11px] transition border border-gray-200"
                          >
                            Dossier ↗
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {records.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 italic">
                          No matching punch records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
