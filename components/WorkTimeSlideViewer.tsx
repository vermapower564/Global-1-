"use client";

import React, { useState, useEffect, useCallback } from "react";

type TimePeriod = "today" | "yesterday" | "daywise" | "month" | "year";

interface EmployeeOption {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department?: string;
}

interface WorkTimeSlideViewerProps {
  isAdmin?: boolean;
  defaultEmployeeId?: string;
}

export default function WorkTimeSlideViewer({ isAdmin = false, defaultEmployeeId = "ALL" }: WorkTimeSlideViewerProps) {
  const [period, setPeriod] = useState<TimePeriod>("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(defaultEmployeeId);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [workUpdates, setWorkUpdates] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"ALL" | "PUNCHES" | "WORK_LOGS">("ALL");

  // Fetch employee directory for Admin selector
  useEffect(() => {
    if (isAdmin) {
      fetch("/api/employees")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setEmployees(
              d.data.map((e: any) => ({
                id: e.id,
                employeeId: e.employeeId || e.id,
                name: e.name,
                role: e.role,
                department: e.department?.name,
              }))
            );
          }
        })
        .catch((e) => console.warn("Failed to load employee list:", e));
    }
  }, [isAdmin]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("period", period);

      if (period === "daywise") params.set("date", selectedDate);
      if (period === "month") params.set("month", selectedMonth);
      if (period === "year") params.set("year", selectedYear);

      if (isAdmin && selectedEmployeeId && selectedEmployeeId !== "ALL") {
        params.set("employeeId", selectedEmployeeId);
      }

      // Fetch Attendance & Daily Work Updates in parallel
      const [attRes, workRes] = await Promise.all([
        fetch(`/api/attendance?${params.toString()}`).then((r) => r.json()),
        fetch(`/api/daily-work?${params.toString()}`).then((r) => r.json()),
      ]);

      if (attRes.success) {
        setAttendanceRecords(attRes.data || []);
        setAttendanceSummary(attRes.summary || {});
      } else {
        setAttendanceRecords([]);
      }

      if (workRes.success) {
        setWorkUpdates(workRes.data || []);
      } else {
        setWorkUpdates([]);
      }
    } catch (err) {
      console.warn("Failed to load time-slide data:", err);
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, selectedMonth, selectedYear, selectedEmployeeId, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute combined KPIs
  const totalShiftHours = attendanceRecords.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const activeShiftsCount = attendanceRecords.filter((r) => r.isActiveShift || !r.checkOutTime).length;
  const totalWorkHours = workUpdates.reduce((acc, w) => acc + (parseFloat(w.hoursWorked) || 0), 0);

  const getPeriodLabel = () => {
    if (period === "today") return `Today (${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })})`;
    if (period === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return `Yesterday (${y.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })})`;
    }
    if (period === "daywise") return `Daywise (${selectedDate})`;
    if (period === "month") return `Month (${selectedMonth})`;
    if (period === "year") return `Year (${selectedYear})`;
    return "Time Period";
  };

  return (
    <div className="space-y-6 font-sans text-black bg-white">
      {/* 1. Master Slide Header & Period Filter Controls */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {isAdmin ? "Enterprise Workforce Radar" : "Personal Shift & Work History"}
              </span>
              <span className="text-xs font-bold text-gray-500 font-mono">
                {getPeriodLabel()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mt-1.5">
              Employee Punch Time & Work Details Explorer
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Toggle between Today, Yesterday, Daywise, Month, or Year to inspect punch clock intervals and project delivery details.
            </p>
          </div>

          {/* Admin Employee Selector */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500 pl-2">👤 Filter:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="bg-white border border-gray-300 text-black text-xs font-bold rounded-xl px-3 py-2 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🏢 All Employees (Workforce-wide)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId}) — {emp.role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Slide Period Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
            {(
              [
                { key: "today", label: "🌟 Today", desc: "Current Shift" },
                { key: "yesterday", label: "📅 Yesterday", desc: "Previous Day" },
                { key: "daywise", label: "📆 Daywise", desc: "Specific Date" },
                { key: "month", label: "🗓️ Month", desc: "Monthly View" },
                { key: "year", label: "📈 Year", desc: "Annual Archive" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  period === tab.key
                    ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-black hover:bg-gray-200/60"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contextual Date/Month/Year Pickers */}
          <div className="flex items-center gap-3">
            {period === "daywise" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Pick Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {period === "month" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Pick Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {period === "year" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Pick Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="2026">2026 (Current Year)</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            )}

            <button
              onClick={loadData}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-extrabold transition cursor-pointer border border-blue-200 flex items-center gap-1"
            >
              <span>🔄</span> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Total Shift Punches</span>
          <p className="text-2xl font-black text-black font-mono">{attendanceRecords.length}</p>
          <span className="text-[11px] text-gray-500 font-medium">Logged biometric shifts</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Total Shift Hours</span>
          <p className="text-2xl font-black text-blue-600 font-mono">
            {Math.round(totalShiftHours * 10) / 10} hrs
          </p>
          <span className="text-[11px] text-gray-500 font-medium">Recorded punch duration</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Currently Clocked In</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeShiftsCount > 0 ? "bg-emerald-500 animate-ping" : "bg-gray-300"
              }`}
            ></span>
            <p className="text-2xl font-black text-black font-mono">{activeShiftsCount}</p>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Active shifts now</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Work Logs Submitted</span>
          <p className="text-2xl font-black text-black font-mono">{workUpdates.length}</p>
          <span className="text-[11px] text-gray-500 font-medium">
            {Math.round(totalWorkHours * 10) / 10}h project delivery
          </span>
        </div>
      </div>

      {/* 4. Sub-Tab View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex gap-4 text-xs font-black">
          <button
            onClick={() => setActiveSubTab("ALL")}
            className={`pb-2 border-b-2 transition cursor-pointer ${
              activeSubTab === "ALL" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-black"
            }`}
          >
            📋 Combined Ledger ({attendanceRecords.length + workUpdates.length})
          </button>
          <button
            onClick={() => setActiveSubTab("PUNCHES")}
            className={`pb-2 border-b-2 transition cursor-pointer ${
              activeSubTab === "PUNCHES" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-black"
            }`}
          >
            ⏱️ Shift Punch Times ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveSubTab("WORK_LOGS")}
            className={`pb-2 border-b-2 transition cursor-pointer ${
              activeSubTab === "WORK_LOGS" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-black"
            }`}
          >
            💼 Project Work Details ({workUpdates.length})
          </button>
        </div>
      </div>

      {/* 5. Detailed Records Rendering */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-400 text-xs font-bold shadow-xs">
          Loading {getPeriodLabel()} records from TiDB Cloud...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Punch Times Table */}
          {(activeSubTab === "ALL" || activeSubTab === "PUNCHES") && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-black flex items-center gap-2">
                    <span>⏱️</span> Biometric Shift Punch Times ({getPeriodLabel()})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Exact check-in, check-out, duration, and shift status from TiDB database.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Assigned Project & ID</th>
                      <th className="py-3 px-4">Shift Date</th>
                      <th className="py-3 px-4">Punch-In Time</th>
                      <th className="py-3 px-4">Punch-Out Time</th>
                      <th className="py-3 px-4">Hours Logged</th>
                      <th className="py-3 px-4">Shift Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition text-black">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-black">{r.user?.name || "Employee"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {r.user?.employeeId || "EMP"} • {r.user?.role || "Staff"}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                              {r.projectId || "PRJ-OMS-2026"}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-gray-900 mt-0.5 truncate">
                            {r.projectName || "OMS Enterprise Core Portal"}
                          </p>
                          {r.projectTask && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">
                              {r.projectTask}
                            </p>
                          )}
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
                      </tr>
                    ))}

                    {attendanceRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                          No biometric punch records found for {getPeriodLabel()}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Details & Project Updates */}
          {(activeSubTab === "ALL" || activeSubTab === "WORK_LOGS") && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-black flex items-center gap-2">
                    <span>💼</span> Project Work Details & Task Delivery ({getPeriodLabel()})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Daily EOD accomplishments, hours worked, blockers, and next sprint plans.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workUpdates.map((w) => (
                  <div
                    key={w.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-black">{w.projectName || "General Operations"}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              w.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {w.priority}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          👤 {w.user?.name || "Employee"} ({w.user?.employeeId || "EMP"}) • Client: {w.clientName || "Enterprise"}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                        {w.hoursWorked} hrs
                      </span>
                    </div>

                    <p className="text-xs text-gray-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-gray-200">
                      {w.description}
                    </p>

                    {w.achievements && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="font-bold block">🏆 Key Achievements:</span>
                        {w.achievements}
                      </div>
                    )}

                    {w.blockers && (
                      <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        <span className="font-bold block">⚠️ Blockers Reported:</span>
                        {w.blockers}
                      </div>
                    )}

                    {w.tomorrowPlan && (
                      <div className="text-[11px] text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                        <span className="font-bold block">🎯 Next Plan:</span>
                        {w.tomorrowPlan}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-1">
                      <span>Submitted: {w.submittedAt ? new Date(w.submittedAt).toLocaleTimeString("en-IN") : "-"}</span>
                      <span className="font-bold uppercase text-black">Status: {w.status || "PENDING"}</span>
                    </div>
                  </div>
                ))}

                {workUpdates.length === 0 && (
                  <div className="col-span-2 py-10 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-gray-200">
                    No work details submitted for {getPeriodLabel()}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
