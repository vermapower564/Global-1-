"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconFileText,
  IconCalendar,
  IconUsers,
  IconClipboardList,
  IconFolder,
  IconBuilding,
  IconSearch,
  IconStar,
} from "@/components/Icons";

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dynamic Current Month (e.g., "August 2026", "September 2026")
  const getCurrentMonthString = () => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"MONTHLY_REPORTS" | "WORKLOAD_HEATMAP">("MONTHLY_REPORTS");

  // Fetch Report Data from API
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedEmployeeId) params.set("employeeId", selectedEmployeeId);
      if (selectedDeptId) params.set("departmentId", selectedDeptId);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Failed to load monthly reports data");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading monthly reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedEmployeeId, selectedDeptId]);

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (!data) return;

    const isOrg = data.isOrganisationReport;
    const month = data.selectedMonth || selectedMonth;

    if (isOrg) {
      // Organisation-Wide CSV Export
      const headers = [
        "Employee ID",
        "Employee Name",
        "Department",
        "Designation",
        "Month",
        "Attendance Rate (%)",
        "Present Days",
        "Absent Days",
        "Leave Days",
        "Hours Worked",
        "Total Tasks",
        "Completed Tasks",
        "In Progress Tasks",
        "Blocked Tasks",
        "Completion Rate (%)",
        "Daily Updates",
        "Avg Work Rating",
        "Performance Grade",
      ];

      const rows = (data.reports || []).map((r: any) => [
        r.employee.employeeId,
        r.employee.name,
        r.employee.departmentName,
        r.employee.role,
        r.month,
        r.attendance.attendanceRate,
        r.attendance.presentDays,
        r.attendance.absentDays,
        r.attendance.leaveDays,
        r.attendance.totalHoursWorked,
        r.taskPerformance.totalTasks,
        r.taskPerformance.completedTasks,
        r.taskPerformance.inProgressTasks,
        r.taskPerformance.blockedTasks,
        r.taskPerformance.completionPercentage,
        r.dailyWork.dailyUpdateCount,
        r.dailyWork.avgRating,
        r.summary.performanceGrade,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...rows]
          .map((e) => e.map((val: any) => `"${val ?? ""}"`).join(","))
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `OMS_Organisation_Report_${month.replace(/\s+/g, "_")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Individual Employee CSV Export
      const r = data.singleEmployeeReport || data.reports[0];
      if (!r) return;

      const lines = [
        ["MONTHLY EMPLOYEE PERFORMANCE REPORT", `Month: ${r.month}`],
        ["Generated At", new Date().toLocaleString("en-IN")],
        [],
        ["1. EMPLOYEE INFORMATION"],
        ["Name", r.employee.name],
        ["Employee ID", r.employee.employeeId],
        ["Role", r.employee.role],
        ["Department", r.employee.departmentName],
        ["Joining Date", r.employee.joiningDate],
        ["Reporting Manager", r.employee.managerName],
        [],
        ["2. ATTENDANCE SUMMARY"],
        ["Total Working Days", r.attendance.workingDays],
        ["Present Days", r.attendance.presentDays],
        ["Absent Days", r.attendance.absentDays],
        ["Leave Days", r.attendance.leaveDays],
        ["Late Check-ins", r.attendance.lateDays],
        ["Total Hours Worked", r.attendance.totalHoursWorked],
        ["Attendance Rate", `${r.attendance.attendanceRate}%`],
        [],
        ["3. TASK PERFORMANCE"],
        ["Total Assigned Tasks", r.taskPerformance.totalTasks],
        ["Completed Tasks", r.taskPerformance.completedTasks],
        ["In Progress Tasks", r.taskPerformance.inProgressTasks],
        ["In Review Tasks", r.taskPerformance.inReviewTasks],
        ["Blocked Tasks", r.taskPerformance.blockedTasks],
        ["Pending Tasks", r.taskPerformance.pendingTasks],
        ["Completion Percentage", `${r.taskPerformance.completionPercentage}%`],
        [],
        ["4. DAILY WORK & ENGAGEMENT"],
        ["Daily Updates Submitted", r.dailyWork.dailyUpdateCount],
        ["Average Work Rating", `${r.dailyWork.avgRating} / 5.0`],
        ["Performance Verdict", r.summary.performanceGrade],
        ["Executive Remarks", r.summary.verdictNote],
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        lines.map((e) => e.map((val: any) => `"${val ?? ""}"`).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Monthly_Report_${r.employee.employeeId}_${r.month.replace(/\s+/g, "_")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Print / PDF Generation
  const handlePrintPDF = () => {
    window.print();
  };

  const orgSummary = data?.organisationSummary || {};
  const reports = (data?.reports || []).filter((r: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employee.name.toLowerCase().includes(q) ||
      r.employee.employeeId.toLowerCase().includes(q) ||
      r.employee.departmentName.toLowerCase().includes(q) ||
      r.employee.role.toLowerCase().includes(q)
    );
  });

  const isSingleView = !data?.isOrganisationReport && data?.singleEmployeeReport;
  const singleReport = data?.singleEmployeeReport || reports[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans bg-white text-slate-900 print:p-0 print:m-0">
      {/* Header Banner (Hidden on Print) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
              Executive Analytics & Auditing
            </span>
            <span className="text-xs text-slate-400 font-bold">• Organisation Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Executive Monthly Reports & Performance Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and download verified monthly employee reports, workload heatmaps, or organisation-wide operational summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={loading || !data}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>📊</span> Export Excel / CSV
          </button>
          <button
            onClick={handlePrintPDF}
            disabled={loading || !data}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>🖨️</span> Download PDF / Print
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Hidden on Print) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab("MONTHLY_REPORTS")}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === "MONTHLY_REPORTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>📑</span> Monthly Reports Dossier
        </button>
        <button
          onClick={() => setActiveTab("WORKLOAD_HEATMAP")}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === "WORKLOAD_HEATMAP"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>🔥</span> Workforce Workload & Capacity Heatmap
        </button>
      </div>

      {activeTab === "WORKLOAD_HEATMAP" ? (
        /* ========================================================================= */
        /* WORKFORCE WORKLOAD & CAPACITY HEATMAP VIEW                                */
        /* ========================================================================= */
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Workforce Workload Distribution ({reports.length} Staff Members)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time capacity tracking, task load index, and deliverable throughput.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                Period: {data?.selectedMonth || selectedMonth}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {reports.map((r: any) => {
              const activeCount = r.taskPerformance.inProgressTasks + r.taskPerformance.pendingTasks;
              const completedCount = r.taskPerformance.completedTasks;
              let workloadLevel = "NORMAL";
              if (activeCount > 5) workloadLevel = "OVERLOADED";
              else if (activeCount >= 3) workloadLevel = "HIGH";

              return (
                <div
                  key={r.employee.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-indigo-500 transition shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                      {r.employee.name ? r.employee.name.charAt(0).toUpperCase() : "E"}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-900 text-sm">{r.employee.name}</h4>
                      <p className="text-slate-500 font-mono text-[11px]">
                        {r.employee.role} • {r.employee.employeeId} • {r.employee.departmentName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Active Tasks</span>
                      <p className="font-black text-indigo-600 text-sm font-mono">{activeCount}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span>
                      <p className="font-black text-emerald-600 text-sm font-mono">{completedCount}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Attendance Rate</span>
                      <p className="font-black text-emerald-700 text-sm font-mono">{r.attendance.attendanceRate}%</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Workload Level</span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          workloadLevel === "OVERLOADED"
                            ? "bg-rose-100 text-rose-800"
                            : workloadLevel === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {workloadLevel}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEmployeeId(r.employee.id);
                        setActiveTab("MONTHLY_REPORTS");
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Monthly Dossier →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MONTHLY PERFORMANCE REPORTS VIEW                                          */
        /* ========================================================================= */
        <>
          {/* Filter Control Bar (Hidden on Print) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Month Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {(data?.filters?.availableMonths || [
                    "August 2026",
                    "July 2026",
                    "June 2026",
                    "May 2026",
                  ]).map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Select Employee Scope
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">🌐 All Employees (Organisation-Wide)</option>
                  {(data?.filters?.availableEmployees || []).map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || "EMP"}) • {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Filter Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {(data?.filters?.availableDepartments || []).map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Search Staff
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, ID, role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs space-y-3">
              <div className="text-3xl animate-bounce">📊</div>
              <p>Compiling Monthly Executive Reports...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl text-xs font-bold space-y-2">
              <p className="text-sm">⚠️ {error}</p>
              <button
                onClick={fetchReportData}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Retry Loading
              </button>
            </div>
          ) : isSingleView && singleReport ? (
            /* ========================================================================= */
            /* INDIVIDUAL EMPLOYEE MONTHLY REPORT VIEW                                   */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Official Report Title Header */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-indigo-300 tracking-widest block mb-0.5">
                      MONTHLY EMPLOYEE PERFORMANCE REPORT
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {singleReport.employee.name}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      <span className="font-mono text-indigo-300 font-bold">{singleReport.employee.employeeId}</span> •{" "}
                      {singleReport.employee.role} • {singleReport.employee.departmentName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                      {singleReport.month}
                    </span>
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border ${
                        singleReport.summary.performanceGrade === "EXCELLENT"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                          : "bg-blue-500/20 text-blue-300 border-blue-400/30"
                      }`}
                    >
                      Grade: {singleReport.summary.performanceGrade}
                    </span>
                  </div>
                </div>

                {/* Quick Metadata Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Email</span>
                    <p className="font-mono text-white truncate mt-0.5">{singleReport.employee.email}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Joining Date</span>
                    <p className="font-mono text-white mt-0.5">{singleReport.employee.joiningDate}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Manager</span>
                    <p className="text-white mt-0.5 truncate">{singleReport.employee.managerName}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Projects</span>
                    <p className="text-white mt-0.5">{singleReport.assignedProjects.length} Active</p>
                  </div>
                </div>
              </div>

              {/* Section 1: Attendance & Shift Integrity */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span>📅</span> 1. Monthly Attendance Summary ({singleReport.month})
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Working Days</span>
                    <span className="text-xl font-mono font-black text-slate-900">{singleReport.attendance.workingDays}</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-black uppercase text-emerald-700 block">Present Days</span>
                    <span className="text-xl font-mono font-black text-emerald-900">{singleReport.attendance.presentDays}</span>
                  </div>
                  <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] font-black uppercase text-rose-700 block">Absent Days</span>
                    <span className="text-xl font-mono font-black text-rose-900">{singleReport.attendance.absentDays}</span>
                  </div>
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-[10px] font-black uppercase text-amber-700 block">Leave Days</span>
                    <span className="text-xl font-mono font-black text-amber-900">{singleReport.attendance.leaveDays}</span>
                  </div>
                  <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-[10px] font-black uppercase text-indigo-700 block">Total Hours</span>
                    <span className="text-xl font-mono font-black text-indigo-900">{singleReport.attendance.totalHoursWorked} hrs</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-black uppercase text-emerald-700 block">Attendance Rate</span>
                    <span className="text-xl font-mono font-black text-emerald-900">{singleReport.attendance.attendanceRate}%</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Task Execution & Deliverables */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span>📋</span> 2. Task Performance & Milestones
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Total Assigned</span>
                    <span className="text-xl font-mono font-black text-slate-900">{singleReport.taskPerformance.totalTasks}</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-black uppercase text-emerald-700 block">Completed</span>
                    <span className="text-xl font-mono font-black text-emerald-900">{singleReport.taskPerformance.completedTasks}</span>
                  </div>
                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
                    <span className="text-[10px] font-black uppercase text-blue-700 block">In Progress</span>
                    <span className="text-xl font-mono font-black text-blue-900">{singleReport.taskPerformance.inProgressTasks}</span>
                  </div>
                  <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
                    <span className="text-[10px] font-black uppercase text-purple-700 block">In Review</span>
                    <span className="text-xl font-mono font-black text-purple-900">{singleReport.taskPerformance.inReviewTasks}</span>
                  </div>
                  <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] font-black uppercase text-rose-700 block">Blocked</span>
                    <span className="text-xl font-mono font-black text-rose-900">{singleReport.taskPerformance.blockedTasks}</span>
                  </div>
                  <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-[10px] font-black uppercase text-indigo-700 block">Completion %</span>
                    <span className="text-xl font-mono font-black text-indigo-900">{singleReport.taskPerformance.completionPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Daily Work Updates & Project Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Daily Work Highlights */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span>📝</span> 3. Daily Work Updates
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Updates Submitted</span>
                      <span className="font-mono text-lg font-black text-slate-900">{singleReport.dailyWork.dailyUpdateCount} logs</span>
                    </div>
                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <span className="text-[10px] font-bold uppercase text-amber-600 block">Avg Quality Rating</span>
                      <span className="font-mono text-lg font-black text-amber-800">★ {singleReport.dailyWork.avgRating} / 5.0</span>
                    </div>
                  </div>

                  {singleReport.dailyWork.recentAchievements.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Recent Deliverables</span>
                      <ul className="space-y-1 text-xs text-slate-700 font-medium">
                        {singleReport.dailyWork.recentAchievements.map((ach: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span className="line-clamp-2">{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Assigned Project Progress */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span>📁</span> 4. Project Deliverables Context
                  </h3>

                  {singleReport.assignedProjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-6 text-center">No assigned project deliverables in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {singleReport.assignedProjects.map((p: any) => (
                        <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-900">{p.title}</span>
                            <span className="font-mono font-bold text-indigo-600">{p.progressRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${p.progressRate}%` }}></div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {p.completedTasks} of {p.totalTasks} deliverables completed
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Executive Verdict */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <span>🎯</span> 5. Executive Evaluation Summary
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {singleReport.summary.verdictNote}
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ORGANISATION-WIDE MONTHLY REPORT VIEW                                    */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Org KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Staff</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{orgSummary.totalEmployees || 0}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Evaluated in report</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active Workforce</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{orgSummary.activeEmployees || 0}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active status</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-indigo-500">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tasks Assigned</span>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{orgSummary.totalTasks || 0}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Deliverables tracked</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-blue-500">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Completed Tasks</span>
                  <p className="text-2xl font-black text-blue-600 mt-1">{orgSummary.completedTasks || 0}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Delivered on-time</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Completion Rate</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{orgSummary.completionRate || 0}%</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Turnaround rate</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-indigo-600">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Avg Attendance</span>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{orgSummary.averageAttendanceRate || 0}%</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Company-wide avg</p>
                </div>
              </div>

              {/* Department Breakdown Ledger */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span>🏢</span> Department-Wise Monthly Performance Breakdown ({data?.selectedMonth})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(orgSummary.departmentSummaries || []).map((d: any) => (
                    <div key={d.departmentName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{d.departmentName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{d.employeeCount} staff members</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          {d.completionRate}% Done
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${d.completionRate}%` }}></div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                        <span>{d.completedTasks} / {d.totalTasks} Tasks</span>
                        <span>{d.totalHours} hrs worked</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee-Wise Monthly Performance Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                      <span>👥</span> Employee Monthly Performance Ledger ({reports.length} Employees)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Verified metrics for {data?.selectedMonth}. Click employee to view individual report.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Employee</th>
                        <th className="p-3.5">Role & Dept</th>
                        <th className="p-3.5 text-center">Attendance %</th>
                        <th className="p-3.5 text-center">Total Tasks</th>
                        <th className="p-3.5 text-center">Completed</th>
                        <th className="p-3.5 text-center">In Progress</th>
                        <th className="p-3.5 text-center">Blocked</th>
                        <th className="p-3.5 text-center">Work Rating</th>
                        <th className="p-3.5 text-center">Grade</th>
                        <th className="p-3.5 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400 font-bold">
                            No employees found matching the current search / department filter.
                          </td>
                        </tr>
                      ) : (
                        reports.map((r: any) => (
                          <tr key={r.employee.id} className="hover:bg-slate-50/70 transition group">
                            {/* Employee */}
                            <td className="p-3.5">
                              <button
                                onClick={() => setSelectedEmployeeId(r.employee.id)}
                                className="text-left group-hover:text-indigo-600 transition cursor-pointer"
                              >
                                <span className="font-extrabold text-slate-900 block">{r.employee.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 font-normal">{r.employee.employeeId}</span>
                              </button>
                            </td>

                            {/* Role & Dept */}
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 block">{r.employee.role?.replace(/_/g, " ")}</span>
                              <span className="text-[10px] text-slate-500 font-normal">{r.employee.departmentName}</span>
                            </td>

                            {/* Attendance % */}
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-700">
                              {r.attendance.attendanceRate}%
                            </td>

                            {/* Total Tasks */}
                            <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                              {r.taskPerformance.totalTasks}
                            </td>

                            {/* Completed */}
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-600">
                              {r.taskPerformance.completedTasks}
                            </td>

                            {/* In Progress */}
                            <td className="p-3.5 text-center font-mono font-bold text-blue-600">
                              {r.taskPerformance.inProgressTasks}
                            </td>

                            {/* Blocked */}
                            <td className="p-3.5 text-center font-mono font-bold text-rose-600">
                              {r.taskPerformance.blockedTasks}
                            </td>

                            {/* Work Rating */}
                            <td className="p-3.5 text-center font-mono font-bold text-amber-700">
                              ★ {r.dailyWork.avgRating}
                            </td>

                            {/* Grade */}
                            <td className="p-3.5 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  r.summary.performanceGrade === "EXCELLENT"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : r.summary.performanceGrade === "GOOD"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {r.summary.performanceGrade}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="p-3.5 text-right print:hidden">
                              <button
                                onClick={() => setSelectedEmployeeId(r.employee.id)}
                                className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                View Report →
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
