"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeaderMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/team-leader/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.teamMembers) {
          setMembers(json.teamMembers);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const match = m.name?.toLowerCase().includes(q) || m.employeeId?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q);
    if (filter === "ALL") return match;
    if (filter === "AVAILABLE") return match && m.workloadStatus === "AVAILABLE";
    if (filter === "BUSY") return match && (m.workloadStatus === "BUSY" || m.workloadStatus === "OVERLOADED");
    return match;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Team Workload & Capacity
            </span>
            <span className="text-xs font-bold text-slate-500">• {members.length} Total Project Members</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Team Members & Availability
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor real-time task allocations across your project team. Find available team members with low workloads to assign new deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/team-leader/assign-work"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            + Assign Work →
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team member by name, ID, or role..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: `All Members (${members.length})` },
            { id: "AVAILABLE", label: "🟢 Available Now" },
            { id: "BUSY", label: "🟡 Currently Working" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Members Ledger */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 mt-3">Loading team workload...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            No team members match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department & Role</th>
                  <th className="p-3.5 text-center">Active Tasks</th>
                  <th className="p-3.5">Current Deliverable / Task</th>
                  <th className="p-3.5 text-center">Capacity Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((m) => {
                  const isAvail = m.workloadStatus === "AVAILABLE";
                  const isOver = m.workloadStatus === "OVERLOADED";

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{m.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{m.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <div>{m.role}</div>
                        <div className="text-[10px] text-slate-400">{m.department}</div>
                      </td>

                      <td className="p-3.5 text-center font-mono font-black text-slate-900">
                        {m.activeTaskCount}
                      </td>

                      <td className="p-3.5 text-slate-700 max-w-xs truncate">
                        {m.currentWork}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isAvail
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isOver
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {m.workloadStatus}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          href={`/team-leader/assign-work?employeeId=${m.id}`}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-block shadow-2xs"
                        >
                          + Assign Work
                        </Link>
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
