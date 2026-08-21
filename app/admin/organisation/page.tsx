"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

type TabType = "PROJECT_MANAGERS" | "TEAM_LEADERS" | "EMPLOYEES";

export default function AdminOrganisationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("PROJECT_MANAGERS");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    projectManagers: any[];
    teamLeaders: any[];
    employees: any[];
    projects: any[];
  }>({
    projectManagers: [],
    teamLeaders: [],
    employees: [],
    projects: [],
  });

  // Selected Detail Views
  const [selectedPM, setSelectedPM] = useState<any | null>(null);
  const [selectedTL, setSelectedTL] = useState<any | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  // Employee Filters & Pagination
  const [empSearch, setEmpSearch] = useState("");
  const [empProjectFilter, setEmpProjectFilter] = useState("ALL");
  const [empTLFilter, setEmpTLFilter] = useState("ALL");
  const [empStatusFilter, setEmpStatusFilter] = useState("ALL");
  const [empPage, setEmpPage] = useState(1);
  const EMP_PER_PAGE = 8;

  useEffect(() => {
    fetch("/api/admin/organisation")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.warn("Failed loading organisation data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp) => {
      // Search
      const q = empSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Project filter
      if (empProjectFilter !== "ALL") {
        const inProj =
          emp.currentProject?.id === empProjectFilter ||
          (emp.assignedProjects || []).some((p: any) => p.id === empProjectFilter);
        if (!inProj) return false;
      }

      // Team Leader filter
      if (empTLFilter !== "ALL") {
        if (emp.teamLeader?.id !== empTLFilter && emp.teamLeader?.employeeId !== empTLFilter) {
          return false;
        }
      }

      // Status filter
      if (empStatusFilter !== "ALL") {
        if (emp.status !== empStatusFilter) return false;
      }

      return true;
    });
  }, [data.employees, empSearch, empProjectFilter, empTLFilter, empStatusFilter]);

  const totalEmpPages = Math.max(1, Math.ceil(filteredEmployees.length / EMP_PER_PAGE));
  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * EMP_PER_PAGE;
    return filteredEmployees.slice(start, start + EMP_PER_PAGE);
  }, [filteredEmployees, empPage]);

  // Unique Team Leaders for Filter
  const uniqueTLs = useMemo(() => {
    const tls = new Map<string, string>();
    data.employees.forEach((e) => {
      if (e.teamLeader) {
        tls.set(e.teamLeader.id, e.teamLeader.name);
      }
    });
    return Array.from(tls.entries()).map(([id, name]) => ({ id, name }));
  }, [data.employees]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏢</span> Organisation Structure
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Professional role directory and work-flow analytics across Project Managers, Team Leaders, and Employees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </div>

      {/* 1. SECTION TABS (Project Managers | Team Leaders | Employees) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 shadow-xs max-w-lg">
        <button
          type="button"
          onClick={() => {
            setActiveTab("PROJECT_MANAGERS");
            setSelectedPM(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "PROJECT_MANAGERS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Project Managers ({data.projectManagers.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("TEAM_LEADERS");
            setSelectedTL(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "TEAM_LEADERS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Team Leaders ({data.teamLeaders.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("EMPLOYEES");
            setSelectedEmp(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "EMPLOYEES"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Employees ({data.employees.length})
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs font-bold animate-pulse">
          Loading organisation records...
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: PROJECT MANAGERS                                                    */}
          {/* ========================================================================= */}
          {activeTab === "PROJECT_MANAGERS" && (
            <div>
              {selectedPM ? (
                /* --- PROJECT MANAGER DETAILS VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
                  {/* Back Action */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedPM(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      ← Back to Project Managers
                    </button>
                    <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                      Project Manager Work Details
                    </span>
                  </div>

                  {/* PM Summary Header */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedPM.avatarUrl ? (
                        <img
                          src={selectedPM.avatarUrl}
                          alt={selectedPM.name}
                          className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                          {selectedPM.name ? selectedPM.name.substring(0, 2).toUpperCase() : "PM"}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{selectedPM.name}</h2>
                        <p className="text-xs text-slate-500 font-mono">
                          ID: <span className="font-bold text-slate-800">{selectedPM.employeeId}</span> • {selectedPM.email}
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Department: {selectedPM.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Performance Score</p>
                        <p className="text-lg font-black text-blue-700">{selectedPM.performanceScore}%</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                        {selectedPM.status}
                      </span>
                    </div>
                  </div>

                  {/* PM Work Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Projects Managed</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{selectedPM.totalProjects}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30">
                      <p className="text-[10px] font-bold uppercase text-blue-700">Active Deliverables</p>
                      <p className="text-xl font-black text-blue-800 mt-1">{selectedPM.activeProjectsCount}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Completed Projects</p>
                      <p className="text-xl font-black text-emerald-800 mt-1">{selectedPM.completedProjectsCount}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Current Workload</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{selectedPM.workload}%</p>
                    </div>
                  </div>

                  {/* Team Leaders Working Under this PM */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Team Leaders Working Under Project Manager ({selectedPM.teamLeadersManaged?.length || 0})
                    </h3>
                    {selectedPM.teamLeadersManaged?.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium">No Team Leaders assigned yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedPM.teamLeadersManaged.map((tl: any) => (
                          <div
                            key={tl.id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center gap-3"
                          >
                            {tl.avatarUrl ? (
                              <img src={tl.avatarUrl} alt={tl.name} className="h-9 w-9 rounded-xl object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                {tl.name?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{tl.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{tl.employeeId}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Projects Managed Table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Projects Managed by {selectedPM.name}
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Project</th>
                            <th className="py-3 px-4">Client</th>
                            <th className="py-3 px-4">Team Leader</th>
                            <th className="py-3 px-4 text-center">Progress</th>
                            <th className="py-3 px-4 text-center">Health</th>
                            <th className="py-3 px-4 text-center">Deadline</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {selectedPM.projects?.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400 font-bold">
                                No projects assigned to this Project Manager.
                              </td>
                            </tr>
                          ) : (
                            selectedPM.projects?.map((proj: any) => {
                              const healthColor =
                                proj.projectHealth === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800 border-rose-200"
                                  : proj.projectHealth === "AT_RISK"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200";

                              return (
                                <tr key={proj.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    <div>{proj.projectTitle}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{proj.projectCode || proj.id}</div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">{proj.clientCompany}</td>
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    {proj.teamLeaderName || "Unassigned"}
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                                    {proj.progress}%
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${healthColor}`}>
                                      {proj.projectHealth || "HEALTHY"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                                    {new Date(proj.endDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {proj.status}
                                    </span>
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
              ) : (
                /* --- PROJECT MANAGERS LIST VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Project Managers Directory
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Project Manager name or ID to view their active projects and work portfolio.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                      Total: {data.projectManagers.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Project Manager</th>
                          <th className="py-3.5 px-4 text-center">Projects</th>
                          <th className="py-3.5 px-4 text-center">Active Projects</th>
                          <th className="py-3.5 px-4 text-center">Project Completion</th>
                          <th className="py-3.5 px-4 text-center">Team Leaders Managed</th>
                          <th className="py-3.5 px-4 text-center">Workload</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {data.projectManagers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                              No Project Managers registered.
                            </td>
                          </tr>
                        ) : (
                          data.projectManagers.map((pm) => (
                            <tr key={pm.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {pm.avatarUrl ? (
                                    <img src={pm.avatarUrl} alt={pm.name} className="h-9 w-9 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-9 w-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                      {pm.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPM(pm)}
                                      className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                                    >
                                      {pm.name}
                                    </button>
                                    <div className="text-[10px] text-slate-400 font-mono">{pm.employeeId}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                                {pm.totalProjects}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">
                                {pm.activeProjectsCount}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {pm.projectCompletionRate}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                                {pm.teamLeadersManagedCount} TLs
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    pm.workloadStatus === "HIGH_LOAD"
                                      ? "bg-rose-100 text-rose-800"
                                      : pm.workloadStatus === "OPTIMAL"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {pm.workload}% ({pm.workloadStatus})
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {pm.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPM(pm)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition cursor-pointer"
                                >
                                  View Work →
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TEAM LEADERS                                                        */}
          {/* ========================================================================= */}
          {activeTab === "TEAM_LEADERS" && (
            <div>
              {selectedTL ? (
                /* --- TEAM LEADER DETAILS & WORKFLOW VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
                  {/* Back Action */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedTL(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      ← Back to Team Leaders
                    </button>
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200">
                      Team Leader Workflow & Project Work
                    </span>
                  </div>

                  {/* TL Summary Header */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedTL.avatarUrl ? (
                        <img
                          src={selectedTL.avatarUrl}
                          alt={selectedTL.name}
                          className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                          {selectedTL.name ? selectedTL.name.substring(0, 2).toUpperCase() : "TL"}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{selectedTL.name}</h2>
                        <p className="text-xs text-slate-500 font-mono">
                          ID: <span className="font-bold text-slate-800">{selectedTL.employeeId}</span> • {selectedTL.email}
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Department: {selectedTL.department} • Team Size: {selectedTL.teamSize} Members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Performance Score</p>
                        <p className="text-lg font-black text-indigo-700">{selectedTL.performanceScore}%</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                        {selectedTL.status}
                      </span>
                    </div>
                  </div>

                  {/* TL Task Status KPI Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Tasks</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{selectedTL.metrics?.totalTasks || 0}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Completed</p>
                      <p className="text-lg font-black text-emerald-800 mt-1">{selectedTL.metrics?.completedTasks || 0}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30">
                      <p className="text-[10px] font-bold uppercase text-blue-700">In Progress</p>
                      <p className="text-lg font-black text-blue-800 mt-1">{selectedTL.metrics?.inProgressTasks || 0}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/30">
                      <p className="text-[10px] font-bold uppercase text-amber-700">In Review</p>
                      <p className="text-lg font-black text-amber-800 mt-1">{selectedTL.metrics?.inReviewTasks || 0}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/30">
                      <p className="text-[10px] font-bold uppercase text-rose-700">Blocked</p>
                      <p className="text-lg font-black text-rose-800 mt-1">{selectedTL.metrics?.blockedTasks || 0}</p>
                    </div>
                  </div>

                  {/* 6. PROJECT WORKFLOW DIAGRAM */}
                  <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      Project Workflow
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-200">
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-blue-400">
                        Project Manager
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-purple-400">
                        Project
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg shadow-xs">
                        Team Leader ({selectedTL.name})
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-emerald-400">
                        Employees
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-amber-400">
                        Tasks
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
                        Employee Work
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-cyan-400">
                        TL Review
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg">
                        Completed ✓
                      </span>
                    </div>
                  </div>

                  {/* Team Work for Each Handled Project */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Team Work by Project ({selectedTL.projects?.length || 0})
                    </h3>

                    {selectedTL.projects?.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium">No projects currently led by this Team Leader.</p>
                    ) : (
                      selectedTL.projects?.map((proj: any) => (
                        <div
                          key={proj.id}
                          className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40 space-y-4"
                        >
                          {/* Project Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {proj.projectCode || proj.id}
                              </span>
                              <h4 className="text-sm font-black text-slate-900">{proj.projectTitle}</h4>
                              <p className="text-xs text-slate-500 font-medium">Client: {proj.clientCompany}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-black text-slate-900">
                                Overall Progress: {proj.progress}%
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                                  proj.projectHealth === "CRITICAL"
                                    ? "bg-rose-100 text-rose-800 border-rose-200"
                                    : proj.projectHealth === "AT_RISK"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {proj.projectHealth || "HEALTHY"}
                              </span>
                            </div>
                          </div>

                          {/* Employees Working on this Project */}
                          <div className="space-y-2">
                            <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                              Employees Working on Deliverable ({proj.members?.length || 0}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {proj.members?.map((m: any) => (
                                <div
                                  key={m.id}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                                >
                                  {m.avatarUrl ? (
                                    <img src={m.avatarUrl} alt={m.name} className="h-5 w-5 rounded-full object-cover" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold">
                                      {m.name?.substring(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{m.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({m.employeeId})</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tasks Status Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Tasks</p>
                              <p className="text-sm font-black text-slate-900">{proj.tasks?.length || 0}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Task Progress</p>
                              <p className="text-sm font-black text-blue-700">{proj.progress}%</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Completed Work</p>
                              <p className="text-sm font-black text-emerald-700">{proj.completedWorkCount} Tasks</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Blocked Work</p>
                              <p className={`text-sm font-black ${proj.blockedWorkCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                                {proj.blockedWorkCount} Tasks
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* --- TEAM LEADERS LIST VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Team Leaders Directory
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Team Leader name or ID to view their full work-flow and project tasks.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                      Total: {data.teamLeaders.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Team Leader</th>
                          <th className="py-3.5 px-4 text-center">Projects Handled</th>
                          <th className="py-3.5 px-4 text-center">Team Size</th>
                          <th className="py-3.5 px-4 text-center">Project Progress</th>
                          <th className="py-3.5 px-4 text-center">Task Completion</th>
                          <th className="py-3.5 px-4 text-center">Performance</th>
                          <th className="py-3.5 px-4 text-center">Workload</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {data.teamLeaders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                              No Team Leaders registered.
                            </td>
                          </tr>
                        ) : (
                          data.teamLeaders.map((tl) => (
                            <tr key={tl.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {tl.avatarUrl ? (
                                    <img src={tl.avatarUrl} alt={tl.name} className="h-9 w-9 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                      {tl.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTL(tl)}
                                      className="font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer text-left"
                                    >
                                      {tl.name}
                                    </button>
                                    <div className="text-[10px] text-slate-400 font-mono">{tl.employeeId}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                                {tl.projectsCount}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {tl.teamSize} Members
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {tl.projectProgress}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-700">
                                {tl.taskCompletionPct}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700">
                                {tl.performanceScore}%
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    tl.workloadStatus === "HIGH_LOAD"
                                      ? "bg-rose-100 text-rose-800"
                                      : tl.workloadStatus === "OPTIMAL"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {tl.workload}%
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {tl.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTL(tl)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition cursor-pointer"
                                >
                                  Work Flow →
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EMPLOYEES                                                           */}
          {/* ========================================================================= */}
          {activeTab === "EMPLOYEES" && (
            <div>
              {selectedEmp ? (
                /* --- EMPLOYEE WORK DETAILS VIEW (WORK ONLY, NO PRIVATE/SENSITIVE INFO) --- */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
                  {/* Back Action */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedEmp(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      ← Back to Employees
                    </button>
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                      Employee Work Details & Task Log
                    </span>
                  </div>

                  {/* Employee Work Summary Header */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedEmp.avatarUrl ? (
                        <img
                          src={selectedEmp.avatarUrl}
                          alt={selectedEmp.name}
                          className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-xs">
                          {selectedEmp.name ? selectedEmp.name.substring(0, 2).toUpperCase() : "E"}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{selectedEmp.name}</h2>
                        <p className="text-xs text-slate-500 font-mono">
                          Employee ID: <span className="font-bold text-slate-800">{selectedEmp.employeeId}</span> • {selectedEmp.role}
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Current Project: <span className="font-bold text-blue-700">{selectedEmp.currentProject?.projectTitle || "General Operations"}</span> • Team Leader: <span className="font-bold text-slate-800">{selectedEmp.teamLeader?.name || "Unassigned"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Performance Score</p>
                        <p className="text-lg font-black text-emerald-700">{selectedEmp.performanceScore}%</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                        {selectedEmp.status}
                      </span>
                    </div>
                  </div>

                  {/* Work Summary Numbers */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                    <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Tasks Assigned</p>
                      <p className="text-base font-black text-slate-900 mt-1">{selectedEmp.tasksAssignedCount}</p>
                    </div>
                    <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Completed</p>
                      <p className="text-base font-black text-emerald-800 mt-1">{selectedEmp.completedTasksCount}</p>
                    </div>
                    <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/30">
                      <p className="text-[10px] font-bold uppercase text-blue-700">In Progress</p>
                      <p className="text-base font-black text-blue-800 mt-1">{selectedEmp.inProgressTasksCount}</p>
                    </div>
                    <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/30">
                      <p className="text-[10px] font-bold uppercase text-amber-700">In Review</p>
                      <p className="text-base font-black text-amber-800 mt-1">{selectedEmp.inReviewTasksCount}</p>
                    </div>
                    <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50/30">
                      <p className="text-[10px] font-bold uppercase text-rose-700">Blocked</p>
                      <p className="text-base font-black text-rose-800 mt-1">{selectedEmp.blockedTasksCount}</p>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Completion %</p>
                      <p className="text-base font-black text-slate-900 mt-1">{selectedEmp.completionPct}%</p>
                    </div>
                  </div>

                  {/* 8. CURRENT WORK */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <span>⚡</span> Current Work & Active Tasks ({selectedEmp.currentWork?.length || 0})
                    </h3>

                    {selectedEmp.currentWork?.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-3">No active tasks currently in progress.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Task</th>
                              <th className="py-3 px-4">Section</th>
                              <th className="py-3 px-4 text-center">Priority</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-center">Due Date</th>
                              <th className="py-3 px-4 text-center">Progress</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {selectedEmp.currentWork.map((t: any) => (
                              <tr key={t.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{t.title}</div>
                                  {t.description && <div className="text-[10px] text-slate-500 line-clamp-1">{t.description}</div>}
                                </td>
                                <td className="py-3 px-4 text-slate-600">{t.section || "General"}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    t.priority === "HIGH" || t.priority === "URGENT"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    {t.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600">
                                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "N/A"}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                                  {t.progress || 0}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Latest Work Update */}
                    {selectedEmp.latestUpdate && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Latest Work Update • {new Date(selectedEmp.latestUpdate.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                            {selectedEmp.latestUpdate.hoursWorked || 8} Hours Logged
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium">
                          {selectedEmp.latestUpdate.description}
                        </p>
                        {selectedEmp.latestUpdate.achievements && (
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            ✓ Key Achievement: {selectedEmp.latestUpdate.achievements}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 8. WORK HISTORY */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <span>📜</span> Work History & Completed Deliverables ({selectedEmp.workHistory?.length || 0})
                    </h3>

                    {selectedEmp.workHistory?.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-2">No past completed task records on file.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">Completed Task</th>
                              <th className="py-2.5 px-4">Section</th>
                              <th className="py-2.5 px-4 text-center">Completed Date</th>
                              <th className="py-2.5 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {selectedEmp.workHistory.slice(0, 8).map((ht: any) => (
                              <tr key={ht.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-4 font-bold text-slate-900">{ht.title}</td>
                                <td className="py-2.5 px-4 text-slate-600">{ht.section || "General"}</td>
                                <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                                  {ht.completedAt ? new Date(ht.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Completed"}
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    COMPLETED
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* --- EMPLOYEES LIST VIEW WITH SEARCH, FILTERS & PAGINATION --- */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  {/* Header & Filter Controls */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                          Workforce Directory
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Click on any Employee name or ID to view their work details, active tasks, and history.
                        </p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full self-start sm:self-auto">
                        Showing {filteredEmployees.length} of {data.employees.length} Employees
                      </span>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Search */}
                      <div>
                        <input
                          type="text"
                          placeholder="Search name or ID..."
                          value={empSearch}
                          onChange={(e) => {
                            setEmpSearch(e.target.value);
                            setEmpPage(1);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      {/* Project Filter */}
                      <div>
                        <select
                          value={empProjectFilter}
                          onChange={(e) => {
                            setEmpProjectFilter(e.target.value);
                            setEmpPage(1);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                        >
                          <option value="ALL">All Projects</option>
                          {data.projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.projectTitle}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Team Leader Filter */}
                      <div>
                        <select
                          value={empTLFilter}
                          onChange={(e) => {
                            setEmpTLFilter(e.target.value);
                            setEmpPage(1);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                        >
                          <option value="ALL">All Team Leaders</option>
                          {uniqueTLs.map((tl) => (
                            <option key={tl.id} value={tl.id}>
                              {tl.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <select
                          value={empStatusFilter}
                          onChange={(e) => {
                            setEmpStatusFilter(e.target.value);
                            setEmpPage(1);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Employees Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Employee</th>
                          <th className="py-3.5 px-4">Current Project</th>
                          <th className="py-3.5 px-4">Team Leader</th>
                          <th className="py-3.5 px-4 text-center">Assigned Tasks</th>
                          <th className="py-3.5 px-4 text-center">Completion %</th>
                          <th className="py-3.5 px-4 text-center">Performance</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {paginatedEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                              No employees found matching filter criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.name} className="h-9 w-9 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                      {emp.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEmp(emp)}
                                      className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                                    >
                                      {emp.name}
                                    </button>
                                    <div className="text-[10px] text-slate-400 font-mono">{emp.employeeId}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 line-clamp-1">
                                  {emp.currentProject?.projectTitle || "Operational"}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {emp.currentProject?.projectCode || ""}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-semibold text-slate-700">
                                {emp.teamLeader?.name || "Unassigned"}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                                {emp.tasksAssignedCount}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {emp.completionPct}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700">
                                {emp.performanceScore}%
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {emp.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEmp(emp)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition cursor-pointer"
                                >
                                  Work Details →
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalEmpPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-slate-500 font-medium">
                        Page {empPage} of {totalEmpPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={empPage <= 1}
                          onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          ← Previous
                        </button>
                        <button
                          type="button"
                          disabled={empPage >= totalEmpPages}
                          onClick={() => setEmpPage((p) => Math.min(totalEmpPages, p + 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
