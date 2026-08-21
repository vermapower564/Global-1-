"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeePerformancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);

  useEffect(() => {
    fetch("/api/project-manager/promotions")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.employees)) {
          setEmployees(res.employees);
        }
      })
      .catch((err) => console.warn("Failed loading performance:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterEligibleOnly && !emp.isEligibleForPromotion) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📊</span> Multi-Factor Performance Evaluation
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Weighted performance analytics: Task Completion (25%), Quality (20%), On-Time (20%), Contribution (15%), Consistency (10%), Leadership (10%).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/project-manager/promotions"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
          >
            🏆 Promotion Records
          </Link>
          <Link
            href="/project-manager"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← PM Dashboard
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by employee name, ID, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-black focus:outline-none focus:border-blue-600"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterEligibleOnly}
              onChange={(e) => setFilterEligibleOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Show Promotion-Eligible Only (Score ≥ 80%)
          </label>
        </div>
      </div>

      {/* Performance Score Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role / Dept</th>
                <th className="py-3 px-4 text-center">Completion (25%)</th>
                <th className="py-3 px-4 text-center">Quality (20%)</th>
                <th className="py-3 px-4 text-center">On-Time (20%)</th>
                <th className="py-3 px-4 text-center">Contribution (15%)</th>
                <th className="py-3 px-4 text-center">Consistency (10%)</th>
                <th className="py-3 px-4 text-center">Overall Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                    Evaluating workforce metrics...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                    No employees matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const m = emp.metrics;
                  const isHighPerformer = m.overallScore >= 85;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.name} className="h-8 w-8 rounded-xl object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                              {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              {emp.name}
                              {emp.isEligibleForPromotion && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-200">
                                  ⭐ Eligible
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{emp.role.replace(/_/g, " ")}</div>
                        <div className="text-[10px] text-slate-500">{emp.departmentName || "Engineering"}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {m.taskCompletionRate}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {m.qualityRate}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {m.onTimeRate}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {m.contributionRate}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {m.consistencyRate}%
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs inline-block ${
                            isHighPerformer
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : m.overallScore >= 75
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {m.overallScore}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {emp.isEligibleForPromotion ? (
                          <Link
                            href={`/project-manager/promotions?promoteId=${emp.employeeId}`}
                            className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition"
                          >
                            Promote to TL →
                          </Link>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">Maintained</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
