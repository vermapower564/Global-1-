"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconFileText, IconCalendar, IconUsers, IconClipboardList } from "@/components/Icons";

export default function HRReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/hr")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {
    totalEmployees: 12,
    activeEmployees: 12,
    inactiveEmployees: 0,
    newJoiners: 3,
    pendingLeavesCount: 2,
    pendingResignationsCount: 1,
    todayAttendance: { ratio: "12 / 12", percentage: 100 },
  };

  const deptBreakdown = data?.departmentBreakdown || [
    { department: "Engineering & Development", count: 6, percentage: 50 },
    { department: "Human Resources", count: 2, percentage: 17 },
    { department: "Project Management", count: 2, percentage: 17 },
    { department: "UI/UX & Design", count: 2, percentage: 16 },
  ];

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value", "Notes"],
      ["Total Headcount", summary.totalEmployees, "Active + Inactive"],
      ["Active Employees", summary.activeEmployees, "Full-Time Active"],
      ["New Joiners (60 Days)", summary.newJoiners, "Recent Onboardings"],
      ["Pending Leave Requests", summary.pendingLeavesCount, "Awaiting HR Decision"],
      ["Pending Resignations", summary.pendingResignationsCount, "Notice Period Clearance"],
      ["Today Attendance Ratio", summary.todayAttendance.ratio, `${summary.todayAttendance.percentage}% Present`],
      [],
      ["Department", "Employee Count", "Percentage"],
      ...deptBreakdown.map((d: any) => [d.department, d.count, `${d.percentage}%`]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e: any[]) => e.map((val: any) => `"${val ?? ""}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HR_Workforce_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Workforce Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>📊</span> HR Analytics & Workforce Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Department-wise allocation metrics, headcount distribution, attendance percentages, and CSV data export.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥</span> Export Report to CSV
          </button>
          <Link
            href="/hr"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            ← HR Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Headcount</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{summary.totalEmployees}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{summary.activeEmployees} active workforce</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Attendance Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {summary.todayAttendance.percentage}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{summary.todayAttendance.ratio} present</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Leave Applications</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{summary.pendingLeavesCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Pending HR decision</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Resignations</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">{summary.pendingResignationsCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Exit clearance</p>
        </div>
      </div>

      {/* Department Breakdown Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Department Headcount Distribution</h2>
            <p className="text-xs text-slate-400 font-medium">Workforce allocation across company divisions</p>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">Total Departments: {deptBreakdown.length}</span>
        </div>

        <div className="space-y-4">
          {deptBreakdown.map((dept: any) => (
            <div key={dept.department} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800">{typeof dept.department === "object" ? (dept.department as any)?.name : dept.department}</span>
                <span className="text-slate-500 font-mono">
                  {dept.count} Members ({dept.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(dept.percentage, 5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Monthly Workforce Summary Table</h2>
          <p className="text-xs text-slate-400 font-medium">Aggregated reporting data snapshot</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Metric Category</th>
                <th className="py-3 px-3">Current Count</th>
                <th className="py-3 px-3">Operational Status</th>
                <th className="py-3 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-900">Total Registered Employees</td>
                <td className="py-3 px-3 font-mono font-bold text-blue-700">{summary.totalEmployees}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Normal
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">Active and registered personnel</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-900">Active Workforce Ratio</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">{summary.activeEmployees} / {summary.totalEmployees}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Optimal
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">100% active operational deployment</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-900">Pending Leave Review Ratio</td>
                <td className="py-3 px-3 font-mono font-bold text-amber-700">{summary.pendingLeavesCount} Requests</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    Action Required
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">Awaiting HR decision desk approval</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-900">Resignation Exit Clearances</td>
                <td className="py-3 px-3 font-mono font-bold text-rose-700">{summary.pendingResignationsCount} Requests</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                    Under Review
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">15-day notice period tracking</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
