"use client";

import { useState } from "react";
import Link from "next/link";
import { exportToCSV, generatePrintablePDF } from "@/utils/exportEngine";

const reports = [
  { id: "REP-01", title: "Monthly Financial Balance Sheet", category: "Finance", date: "Aug 2026", format: "PDF / XLSX", status: "Generated" },
  { id: "REP-02", title: "Workforce Attendance & Absence Audit", category: "HR", date: "July 2026", format: "PDF", status: "Generated" },
  { id: "REP-03", title: "Enterprise Sales Pipeline & Deal Velocity", category: "Sales", date: "Q2 2026", format: "XLSX", status: "Generated" },
  { id: "REP-04", title: "Project Resource Allocation & Cost Analysis", category: "Operations", date: "Aug 2026", format: "PDF / CSV", status: "Generated" },
  { id: "REP-05", title: "Digital Marketing ROAS & CPL Performance", category: "Marketing", date: "Aug 2026", format: "PDF / CSV", status: "Generated" },
];

export default function ReportsPage() {
  const [reportsList] = useState(reports);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Phase 7: Master Executive Intelligence</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Management Master Dashboard & Report Generator</h1>
          <p className="text-xs text-slate-300 mt-1">
            Executive system health metrics, cross-departmental efficiency, revenue vs expense trends, and 1-click PDF/CSV reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/settings/audit-logs" className="btn-accent text-xs px-4 py-2.5 shadow-md">
            🛡️ System Audit Trail
          </Link>
          <button onClick={() => generatePrintablePDF("Executive_Master_Report")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md transition">
            🖨️ Export PDF Master Report
          </button>
        </div>
      </div>

      {/* Management Master Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">System Executive Health</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">98.6%</p>
          <span className="text-[11px] font-semibold text-emerald-600">Optimal Operational Index</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Cross-Dept Efficiency</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">96.2%</p>
          <span className="text-[11px] font-semibold text-blue-600">High Productivity Rating</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Net Revenue</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹425,000</p>
          <span className="text-[11px] font-semibold text-purple-600">Quarterly Cash Flow</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Operating Expenses</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹185,000</p>
          <span className="text-[11px] font-semibold text-rose-600">₹240,000 Net Margin</span>
        </div>
      </div>

      {/* Executive Revenue vs Expense Visual Breakdown */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Cross-Departmental Revenue vs Expense Efficiency Breakdown
        </h2>
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Software Engineering & IT Projects</span>
              <span className="text-blue-600">78.5% Margin (₹180k Rev / ₹38k Exp)</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: "78.5%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Sales & Enterprise Client Accounts</span>
              <span className="text-emerald-600">82.0% Margin (₹145k Rev / ₹26k Exp)</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
              <div className="bg-emerald-600 h-3 rounded-full" style={{ width: "82%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Digital Marketing & Media Production</span>
              <span className="text-purple-600">65.4% Margin (₹100k Rev / ₹34.6k Exp)</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
              <div className="bg-purple-600 h-3 rounded-full" style={{ width: "65.4%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated PDF & Excel / CSV Report Downloads */}
      <div className="pro-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-base">Automated Export Engine & Generated Reports</h2>
          <button onClick={() => exportToCSV("Management_Executive_Reports", reportsList)} className="btn-secondary text-xs">
            📄 Export Reports Master CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportsList.map((rep) => (
            <div key={rep.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span className="font-bold">{rep.id}</span>
                  <span className="badge badge-purple">{rep.category}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm mt-2">{rep.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Period: {rep.date}</p>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 font-bold">{rep.format}</span>
                <button
                  onClick={() => exportToCSV(rep.title.replace(/\s+/g, "_"), [rep])}
                  className="text-xs font-bold text-blue-600 hover:bg-blue-100 bg-blue-50 px-3 py-1.5 rounded transition"
                >
                  📥 Download Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}