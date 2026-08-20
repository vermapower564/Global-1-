"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProjects(json.projects || json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (p.projectTitle || p.name || "").toLowerCase().includes(q) ||
      (p.clientCompany || "").toLowerCase().includes(q) ||
      (p.teamLeader?.name || "").toLowerCase().includes(q);

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") return matchesSearch && (p.status === "IN_PROGRESS" || p.status === "ACTIVE");
    if (statusFilter === "COMPLETED") return matchesSearch && (p.status === "COMPLETED" || (p.metrics?.overallProgress || 0) >= 100);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Employee & Team Leader Workspace
            </span>
            <span className="text-xs font-bold text-slate-500">• {projects.length} Active Engagements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Assigned Projects & Deliverables
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Enterprise projects and deliverables where you are an assigned team member or designated <strong>Team Leader</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employee/tasks"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            Open My Tasks Board →
          </Link>
        </div>
      </div>

      {/* Toolbar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name, client, or team leader..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "ALL", label: `All Deliverables (${projects.length})` },
            { id: "ACTIVE", label: "🚀 Active Sprints" },
            { id: "COMPLETED", label: "🏆 Completed Projects" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Display Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 mt-3">Loading projects and assigned work...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <p className="text-xs font-bold text-slate-500">No projects found matching search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((p) => {
            const isCompleted = p.status === "COMPLETED" || (p.metrics?.overallProgress || 0) >= 100;
            const leader = p.teamLeader;
            const members = p.teamMembers || [];
            const progress = p.metrics?.overallProgress || 0;
            const isTL = p.isUserTeamLeader;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                  isTL
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : isCompleted
                    ? "border-emerald-300 ring-1 ring-emerald-100"
                    : "border-slate-200"
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Header & Badges */}
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isTL ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-2xs">
                            👑 YOU ARE TEAM LEADER
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
                            👥 PROJECT MEMBER
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isCompleted ? "🏆 COMPLETED" : "🚀 IN PROGRESS"}
                        </span>
                      </div>

                      <Link
                        href={`/employee/projects/${p.id}`}
                        className="text-lg font-black text-slate-900 hover:text-blue-600 block transition tracking-tight"
                      >
                        {p.projectTitle}
                      </Link>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Client: <strong className="text-slate-800">{p.clientCompany}</strong> • {p.clientContactPerson}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-blue-600 block">
                        {p.metrics?.totalTasks || 0} Tasks
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {p.metrics?.completedTasks || 0} Completed
                      </span>
                    </div>
                  </div>

                  {/* Team Leader & Team Details */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Team Leader:</span>
                      <span className="font-extrabold text-blue-700">
                        👑 {leader?.name || "Roushan Verma"} ({leader?.employeeId || "EMP"})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-bold">Team Members:</span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {members.slice(0, 3).map((m: any) => (
                          <span
                            key={m.id}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                          >
                            {m.name.split(" ")[0]}
                          </span>
                        ))}
                        {members.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            +{members.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-600">Overall Progress</span>
                      <span className="text-blue-600 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    href={`/employee/projects/${p.id}`}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs text-center transition shadow-2xs ${
                      isTL
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {isTL ? "👑 Open Team Leader Workspace →" : "View Assigned Tasks →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
