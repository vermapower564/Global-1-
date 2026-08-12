"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function WorkAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly");

  const deptMetrics = [
    { name: "Engineering & Dev", hours: 420, EodCount: 52, avgRating: 4.8, productivity: "96%", status: "Optimal" },
    { name: "Human Resources", hours: 160, EodCount: 20, avgRating: 4.6, productivity: "92%", status: "Optimal" },
    { name: "Growth & Marketing", hours: 240, EodCount: 30, avgRating: 4.7, productivity: "94%", status: "Optimal" },
    { name: "Enterprise Sales", hours: 310, EodCount: 38, avgRating: 4.5, productivity: "90%", status: "Optimal" },
    { name: "Camera & Media Production", hours: 210, EodCount: 26, avgRating: 4.9, productivity: "98%", status: "Optimal" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Phase 2: Work Analytics & Productivity</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Department Performance & Work Analytics</h1>
          <p className="text-xs text-slate-300 mt-1">
            Track daily, weekly, and monthly workforce productivity, billable hours, and 1-5 Star Manager Ratings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-bold">
            {(["daily", "weekly", "monthly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-md capitalize transition ${
                  timeframe === t ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Link href="/daily-work/approvals" className="btn-accent text-xs">
            ★ Manager Desk
          </Link>
        </div>
      </div>

      {/* Primary Analytics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Logged Hours</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">1,340 hrs</p>
          <span className="text-[11px] font-semibold text-blue-600">Across {timeframe} timeframe</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Average Manager Rating</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">4.7 / 5.0 ★</p>
          <span className="text-[11px] font-semibold text-emerald-600">High Team Efficiency</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-400">EOD Submissions</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">166 Reports</p>
          <span className="text-[11px] font-semibold text-amber-600">98% Submission Compliance</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Avg Dept Productivity</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">94.0%</p>
          <span className="text-[11px] font-semibold text-purple-600">Optimal Performance</span>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Departmental Productivity Breakdown</h2>
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Hours Logged</th>
                <th>EOD Submissions</th>
                <th>Average Manager Rating</th>
                <th>Productivity Index</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deptMetrics.map((d, idx) => (
                <tr key={idx}>
                  <td className="font-bold text-slate-900">{d.name}</td>
                  <td className="font-mono text-xs text-blue-600 font-bold">{d.hours} hrs</td>
                  <td className="font-mono text-xs text-slate-700">{d.EodCount} Updates</td>
                  <td className="font-bold text-amber-500">{d.avgRating} ★</td>
                  <td className="font-bold text-emerald-600">{d.productivity}</td>
                  <td>
                    <span className="badge badge-success">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
