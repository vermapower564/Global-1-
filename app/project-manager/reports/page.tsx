"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.projects || res.data)) {
          setProjects(res.projects || res.data || []);
        }
      })
      .catch((err) => console.warn("Failed loading reports:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalProjects = projects.length;
  const healthyCount = projects.filter((p) => p.projectHealth === "HEALTHY").length;
  const atRiskCount = projects.filter((p) => p.projectHealth === "AT_RISK").length;
  const criticalCount = projects.filter((p) => p.projectHealth === "CRITICAL").length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📈</span> Executive Project Health & Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            High-level delivery tracking, completion metrics, and risk monitoring across all managed deliverables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/project-manager/create-project"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
          >
            + Create Project
          </Link>
          <Link
            href="/project-manager"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← PM Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Deliverables</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalProjects}</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Enterprise projects active</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-xs bg-emerald-50/20">
          <p className="text-xs font-bold text-emerald-600 uppercase">Healthy Deliverables</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{healthyCount}</h3>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">On schedule & on track</p>
        </div>

        <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-xs bg-amber-50/20">
          <p className="text-xs font-bold text-amber-600 uppercase">At Risk</p>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{atRiskCount}</h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Deadline or blocked tasks</p>
        </div>

        <div className="bg-white border border-rose-200 rounded-3xl p-5 shadow-xs bg-rose-50/20">
          <p className="text-xs font-bold text-rose-600 uppercase">Critical Attention</p>
          <h3 className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</h3>
          <p className="text-[10px] text-rose-600 font-semibold mt-1">Escalated blockers</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Team Leader</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4 text-center">Tasks</th>
                <th className="py-3 px-4 text-center">Blockers</th>
                <th className="py-3 px-4 text-center">Health Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                    Aggregating project reports...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                    No active projects.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const m = proj.metrics || {};
                  const healthColor =
                    proj.projectHealth === "CRITICAL"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : proj.projectHealth === "AT_RISK"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200";

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{proj.projectTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{proj.projectCode || proj.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{proj.clientCompany}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{proj.teamLeader?.name || "Unassigned"}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {m.overallProgress || 0}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {m.completedTasks || 0} / {m.totalTasks || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-bold ${m.blockedTasks > 0 ? "text-rose-600 font-black" : "text-slate-500"}`}>
                          {m.blockedTasks || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${healthColor}`}>
                          {proj.projectHealth || "HEALTHY"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/employee/projects/${proj.id}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-xl transition"
                        >
                          View Workboard →
                        </Link>
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
