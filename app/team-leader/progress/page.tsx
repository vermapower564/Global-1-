"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeaderProgressPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/team-leader/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.teamProgress) {
          setTasks(json.teamProgress);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sections = Array.from(new Set(tasks.map((t) => t.section || "General")));

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.title?.toLowerCase().includes(q) ||
      t.assignedToUser?.name?.toLowerCase().includes(q) ||
      t.assignedToUser?.employeeId?.toLowerCase().includes(q) ||
      t.section?.toLowerCase().includes(q);

    if (sectionFilter !== "ALL" && t.section !== sectionFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Live Team Tracking & Section Progress
            </span>
            <span className="text-xs font-bold text-slate-500">• {tasks.length} Total Subtasks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Team Work & Section Progress Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live monitoring of all employee task assignments, completion percentages, active blockers, and progress across technical sections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/team-leader/assign-work"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            + Assign New Work →
          </Link>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title, employee, or section..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">All Sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">🚀 In Progress</option>
            <option value="UNDER_REVIEW">🔍 Under Review</option>
            <option value="BLOCKED">⚠️ Blocked</option>
            <option value="COMPLETED">🏆 Completed</option>
            <option value="PENDING">⏳ Pending</option>
          </select>
        </div>
      </div>

      {/* Team Progress Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 mt-3">Loading live progress ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            No work items match your selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5">Task Title</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5">Blockers / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((t) => {
                  const isDone = t.status === "COMPLETED";
                  const isReview = t.status === "UNDER_REVIEW" || t.status === "IN_REVIEW";
                  const isBlocked = t.status === "BLOCKED";

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div>{t.assignedToUser?.name || "Unassigned"}</div>
                        <div className="text-[10px] font-mono text-slate-400">{t.assignedToUser?.employeeId}</div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                          {t.section || "General"}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-extrabold text-slate-900">{t.title}</div>
                        {t.parentTaskTitle && (
                          <div className="text-[10px] text-blue-600 font-bold mt-0.5">
                            Main: {t.parentTaskTitle}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">
                        {t.projectTitle}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isDone
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isReview
                              ? "bg-purple-100 text-purple-800 border border-purple-300"
                              : isBlocked
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${isDone ? "bg-emerald-500" : "bg-blue-600"}`}
                              style={{ width: `${t.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-600">{t.progress || 0}%</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                      </td>

                      <td className="p-3.5 max-w-xs text-[11px]">
                        {t.blockerReason ? (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block truncate">
                            ⚠️ {t.blockerReason}
                          </span>
                        ) : t.reviewNotes ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block truncate">
                            💬 {t.reviewNotes}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
