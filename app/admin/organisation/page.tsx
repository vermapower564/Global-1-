"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

type TabType = "PROJECT_MANAGERS" | "TEAM_LEADERS" | "EMPLOYEES";
type TaskStatusFilter = "ALL" | "COMPLETED" | "IN_PROGRESS" | "PENDING" | "IN_REVIEW" | "BLOCKED";

export default function AdminOrganisationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("PROJECT_MANAGERS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Task Details Modal
  const [activeTaskModal, setActiveTaskModal] = useState<any | null>(null);

  // Employee Workboard State
  const [empWorkboardProjectFilter, setEmpWorkboardProjectFilter] = useState("ALL");
  const [empWorkboardStatusTab, setEmpWorkboardStatusTab] = useState<TaskStatusFilter>("ALL");

  // Tab 1 Filters: Project Managers
  const [pmSearch, setPmSearch] = useState("");
  const [pmStatusFilter, setPmStatusFilter] = useState("ALL");
  const [pmDeptFilter, setPmDeptFilter] = useState("ALL");

  // Tab 2 Filters: Team Leaders
  const [tlSearch, setTlSearch] = useState("");
  const [tlStatusFilter, setTlStatusFilter] = useState("ALL");
  const [tlProjectFilter, setTlProjectFilter] = useState("ALL");

  // Tab 3 Filters: Employees
  const [empSearch, setEmpSearch] = useState("");
  const [empProjectFilter, setEmpProjectFilter] = useState("ALL");
  const [empTLFilter, setEmpTLFilter] = useState("ALL");
  const [empStatusFilter, setEmpStatusFilter] = useState("ALL");
  const [empPage, setEmpPage] = useState(1);
  const EMP_PER_PAGE = 8;

  const loadData = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/organisation")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load work data.");
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "No work data available.");
        }
      })
      .catch((err) => {
        console.warn("Organisation fetch error:", err);
        setError("Unable to load work data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Project Managers
  const filteredPMs = useMemo(() => {
    return data.projectManagers.filter((pm) => {
      const q = pmSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pm.name?.toLowerCase().includes(q) ||
        pm.employeeId?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (pmStatusFilter !== "ALL" && pm.status !== pmStatusFilter) return false;
      if (pmDeptFilter !== "ALL" && pm.department !== pmDeptFilter) return false;
      return true;
    });
  }, [data.projectManagers, pmSearch, pmStatusFilter, pmDeptFilter]);

  // Filtered Team Leaders
  const filteredTLs = useMemo(() => {
    return data.teamLeaders.filter((tl) => {
      const q = tlSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tl.name?.toLowerCase().includes(q) ||
        tl.employeeId?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (tlStatusFilter !== "ALL" && tl.status !== tlStatusFilter) return false;
      if (tlProjectFilter !== "ALL") {
        const inProj = (tl.projects || []).some((p: any) => p.id === tlProjectFilter);
        if (!inProj) return false;
      }
      return true;
    });
  }, [data.teamLeaders, tlSearch, tlStatusFilter, tlProjectFilter]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp) => {
      const q = empSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (empProjectFilter !== "ALL") {
        const inProj =
          emp.currentProject?.id === empProjectFilter ||
          (emp.assignedProjects || []).some((p: any) => p.id === empProjectFilter);
        if (!inProj) return false;
      }
      if (empTLFilter !== "ALL") {
        if (emp.teamLeader?.id !== empTLFilter && emp.teamLeader?.employeeId !== empTLFilter) {
          return false;
        }
      }
      if (empStatusFilter !== "ALL" && emp.status !== empStatusFilter) return false;
      return true;
    });
  }, [data.employees, empSearch, empProjectFilter, empTLFilter, empStatusFilter]);

  const totalEmpPages = Math.max(1, Math.ceil(filteredEmployees.length / EMP_PER_PAGE));
  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * EMP_PER_PAGE;
    return filteredEmployees.slice(start, start + EMP_PER_PAGE);
  }, [filteredEmployees, empPage]);

  // Unique Team Leaders for dropdown
  const uniqueTLs = useMemo(() => {
    const tls = new Map<string, string>();
    data.employees.forEach((e) => {
      if (e.teamLeader) {
        tls.set(e.teamLeader.id, e.teamLeader.name);
      }
    });
    return Array.from(tls.entries()).map(([id, name]) => ({ id, name }));
  }, [data.employees]);

  // Unique Departments for PMs
  const uniquePMDepts = useMemo(() => {
    const depts = new Set<string>();
    data.projectManagers.forEach((pm) => pm.department && depts.add(pm.department));
    return Array.from(depts);
  }, [data.projectManagers]);

  // -------------------------------------------------------------
  // Employee Workboard Calculations (Scoped to Selected Project)
  // -------------------------------------------------------------
  const employeeWorkboardData = useMemo(() => {
    if (!selectedEmp) return null;

    const allEmpTasks: any[] = selectedEmp.allTasks || [];
    const scopedTasks =
      empWorkboardProjectFilter === "ALL"
        ? allEmpTasks
        : allEmpTasks.filter((t: any) => t.projectId === empWorkboardProjectFilter);

    const totalTasks = scopedTasks.length;
    const completedTasks = scopedTasks.filter((t: any) => t.status === "COMPLETED");
    const inProgressTasks = scopedTasks.filter((t: any) => t.status === "IN_PROGRESS");
    const pendingTasks = scopedTasks.filter((t: any) => t.status === "PENDING" || t.status === "ASSIGNED");
    const inReviewTasks = scopedTasks.filter((t: any) => t.status === "IN_REVIEW");
    const blockedTasks = scopedTasks.filter((t: any) => t.status === "BLOCKED");

    // Task Completion % = (Completed / Total) * 100
    const taskCompletionRate = totalTasks > 0 ? ((completedTasks.length / totalTasks) * 100).toFixed(1) : "0";

    // Overall Work Progress % = Average of real progress
    const overallProgressVal =
      totalTasks > 0
        ? (scopedTasks.reduce((acc: number, t: any) => acc + (t.progress || 0), 0) / totalTasks).toFixed(1)
        : "0";

    // Filtered by active tab
    let visibleTasks = scopedTasks;
    if (empWorkboardStatusTab === "COMPLETED") visibleTasks = completedTasks;
    else if (empWorkboardStatusTab === "IN_PROGRESS") visibleTasks = inProgressTasks;
    else if (empWorkboardStatusTab === "PENDING") visibleTasks = pendingTasks;
    else if (empWorkboardStatusTab === "IN_REVIEW") visibleTasks = inReviewTasks;
    else if (empWorkboardStatusTab === "BLOCKED") visibleTasks = blockedTasks;

    return {
      totalTasks,
      completedCount: completedTasks.length,
      inProgressCount: inProgressTasks.length,
      pendingCount: pendingTasks.length,
      inReviewCount: inReviewTasks.length,
      blockedCount: blockedTasks.length,
      taskCompletionRate,
      overallProgressVal,
      visibleTasks,
    };
  }, [selectedEmp, empWorkboardProjectFilter, empWorkboardStatusTab]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏢</span> Organisation
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Professional role directories, basic authorised details, and live project workboards.
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

      {/* 1. ORGANISATION — THREE MAIN VIEWS TABS */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 max-w-lg shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab("PROJECT_MANAGERS");
            setSelectedPM(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "PROJECT_MANAGERS"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Project Managers
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("TEAM_LEADERS");
            setSelectedTL(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "TEAM_LEADERS"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Team Leaders
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("EMPLOYEES");
            setSelectedEmp(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "EMPLOYEES"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Employees
        </button>
      </div>

      {/* Loading & Error / Retry States */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-xs font-bold animate-pulse">
          Loading organisation work data...
        </div>
      ) : error ? (
        <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <p className="text-xs font-bold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            Retry
          </button>
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
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                      Project Manager Details
                    </span>
                  </div>

                  {/* 3. Basic Person Details Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedPM.avatarUrl ? (
                        <img
                          src={selectedPM.avatarUrl}
                          alt={selectedPM.name}
                          className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                          {selectedPM.name ? selectedPM.name.substring(0, 2).toUpperCase() : "PM"}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{selectedPM.name}</h2>
                        <p className="text-xs text-slate-500 font-mono">
                          ID: <span className="font-bold text-slate-800">{selectedPM.employeeId}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600 font-medium">
                          <div>
                            <span className="text-slate-400 font-bold">Role:</span> {selectedPM.role}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Department:</span> {selectedPM.department}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Joining Date:</span>{" "}
                            {new Date(selectedPM.joiningDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Status:</span>{" "}
                            <span className="font-bold text-emerald-700">{selectedPM.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Work Overview */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Work Overview
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Projects Managed</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{selectedPM.totalProjects}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30">
                        <p className="text-[10px] font-bold uppercase text-blue-700">Active Projects</p>
                        <p className="text-lg font-black text-blue-800 mt-1">{selectedPM.activeProjectsCount}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                        <p className="text-[10px] font-bold uppercase text-emerald-700">Completed Projects</p>
                        <p className="text-lg font-black text-emerald-800 mt-1">{selectedPM.completedProjectsCount}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/30">
                        <p className="text-[10px] font-bold uppercase text-rose-700">Delayed Projects</p>
                        <p className="text-lg font-black text-rose-800 mt-1">{selectedPM.delayedProjectsCount}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Overall Project Progress</p>
                        <p className="text-base font-black text-slate-900 mt-1">{selectedPM.projectCompletionRate}%</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Team Leaders Managed</p>
                        <p className="text-base font-black text-slate-900 mt-1">{selectedPM.teamLeadersManagedCount} TLs</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Current Workload</p>
                        <p className="text-base font-black text-slate-900 mt-1">
                          {selectedPM.workload !== null ? `${selectedPM.workload}% (${selectedPM.workloadStatus})` : "Workload: Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5. Projects Managed Table */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Managed Projects ({selectedPM.projects?.length || 0})
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Project Name</th>
                            <th className="py-3 px-4">Project Code</th>
                            <th className="py-3 px-4">Team Leader</th>
                            <th className="py-3 px-4 text-center">Progress</th>
                            <th className="py-3 px-4 text-center">Team Size</th>
                            <th className="py-3 px-4 text-center">Deadline</th>
                            <th className="py-3 px-4 text-center">Project Health</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {selectedPM.projects?.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400 font-bold">
                                No projects currently assigned to this Project Manager.
                              </td>
                            </tr>
                          ) : (
                            selectedPM.projects?.map((proj: any) => (
                              <tr key={proj.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">{proj.projectTitle}</td>
                                <td className="py-3 px-4 font-mono text-slate-500">{proj.projectCode || proj.id}</td>
                                <td className="py-3 px-4 font-semibold text-slate-800">{proj.teamLeaderName || "Unassigned"}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{proj.progress}%</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-700">{proj.memberCount || 0}</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600">
                                  {new Date(proj.endDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                                      proj.projectHealth === "CRITICAL"
                                        ? "bg-rose-100 text-rose-800 border-rose-200"
                                        : proj.projectHealth === "AT_RISK"
                                        ? "bg-amber-100 text-amber-800 border-amber-200"
                                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    }`}
                                  >
                                    {proj.projectHealth || "HEALTHY"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {proj.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- PROJECT MANAGERS LIST VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Project Managers ({filteredPMs.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Project Manager name or ID to view their work overview and managed projects.
                      </p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Search PM name or ID..."
                      value={pmSearch}
                      onChange={(e) => setPmSearch(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-blue-600 focus:outline-none"
                    />

                    <select
                      value={pmStatusFilter}
                      onChange={(e) => setPmStatusFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>

                    <select
                      value={pmDeptFilter}
                      onChange={(e) => setPmDeptFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Departments</option>
                      {uniquePMDepts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Profile & Name</th>
                          <th className="py-3.5 px-4">Project Manager ID</th>
                          <th className="py-3.5 px-4">Designation / Dept</th>
                          <th className="py-3.5 px-4 text-center">Projects</th>
                          <th className="py-3.5 px-4 text-center">Active Projects</th>
                          <th className="py-3.5 px-4 text-center">Project Progress</th>
                          <th className="py-3.5 px-4 text-center">Team Leaders</th>
                          <th className="py-3.5 px-4 text-center">Workload</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {filteredPMs.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                              No Project Managers found.
                            </td>
                          </tr>
                        ) : (
                          filteredPMs.map((pm) => (
                            <tr key={pm.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {pm.avatarUrl ? (
                                    <img src={pm.avatarUrl} alt={pm.name} className="h-8 w-8 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {pm.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPM(pm)}
                                    className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                                  >
                                    {pm.name}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPM(pm)}
                                  className="text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {pm.employeeId}
                                </button>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{pm.role}</div>
                                <div className="text-[10px] text-slate-500">{pm.department}</div>
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
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  {pm.workload !== null ? `${pm.workload}%` : "N/A"}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {pm.status}
                                </span>
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
                /* --- TEAM LEADER DETAILS VIEW --- */
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
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                      Team Leader Details
                    </span>
                  </div>

                  {/* 3. Basic Details */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedTL.avatarUrl ? (
                        <img
                          src={selectedTL.avatarUrl}
                          alt={selectedTL.name}
                          className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                          {selectedTL.name ? selectedTL.name.substring(0, 2).toUpperCase() : "TL"}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{selectedTL.name}</h2>
                        <p className="text-xs text-slate-500 font-mono">
                          Team Leader ID: <span className="font-bold text-slate-800">{selectedTL.employeeId}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600 font-medium">
                          <div>
                            <span className="text-slate-400 font-bold">Role:</span> {selectedTL.role}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Department:</span> {selectedTL.department}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Joining Date:</span>{" "}
                            {new Date(selectedTL.joiningDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Status:</span>{" "}
                            <span className="font-bold text-emerald-700">{selectedTL.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Work Overview */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Work Overview
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Projects Managed</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{selectedTL.projectsCount}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Team Members</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{selectedTL.teamSize}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Tasks Managed</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{selectedTL.metrics?.totalTasks || 0}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                        <p className="text-[10px] font-bold uppercase text-emerald-700">Completed Tasks</p>
                        <p className="text-lg font-black text-emerald-800 mt-1">{selectedTL.metrics?.completedTasks || 0}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30">
                        <p className="text-[10px] font-bold uppercase text-blue-700">In Progress</p>
                        <p className="text-lg font-black text-blue-800 mt-1">{selectedTL.metrics?.inProgressTasks || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                      <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50/30">
                        <p className="text-[10px] font-bold uppercase text-rose-700">Blocked</p>
                        <p className="text-base font-black text-rose-800 mt-1">{selectedTL.metrics?.blockedTasks || 0}</p>
                      </div>
                      <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/30">
                        <p className="text-[10px] font-bold uppercase text-amber-700">In Review</p>
                        <p className="text-base font-black text-amber-800 mt-1">{selectedTL.metrics?.inReviewTasks || 0}</p>
                      </div>
                      <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Team Performance</p>
                        <p className="text-base font-black text-slate-900 mt-1">
                          {selectedTL.performanceScore !== null ? `${selectedTL.performanceScore}%` : "Not enough data"}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Current Workload</p>
                        <p className="text-base font-black text-slate-900 mt-1">
                          {selectedTL.workload !== null ? `${selectedTL.workload}%` : "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 7. Project Workflow Diagram */}
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
                        Work Updates
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-cyan-400">
                        Review
                      </span>
                      <span>→</span>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg">
                        Completed ✓
                      </span>
                    </div>
                  </div>

                  {/* Projects & Team Members */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Projects & Team Work ({selectedTL.projects?.length || 0})
                    </h3>

                    {selectedTL.projects?.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium">No projects currently led by this Team Leader.</p>
                    ) : (
                      selectedTL.projects?.map((proj: any) => (
                        <div key={proj.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40 space-y-4">
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
                                Progress: {proj.progress}%
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

                          <div className="space-y-2">
                            <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                              Team Members on Deliverable ({proj.members?.length || 0}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {proj.members?.map((m: any) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    const foundEmp = data.employees.find((e) => e.id === m.id || e.employeeId === m.employeeId);
                                    if (foundEmp) {
                                      setActiveTab("EMPLOYEES");
                                      setSelectedEmp(foundEmp);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 transition cursor-pointer"
                                >
                                  {m.avatarUrl ? (
                                    <img src={m.avatarUrl} alt={m.name} className="h-5 w-5 rounded-full object-cover" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold">
                                      {m.name?.substring(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="hover:underline">{m.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({m.employeeId})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* --- TEAM LEADERS LIST VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Team Leaders ({filteredTLs.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Team Leader name or ID to open their work overview and project workflow.
                      </p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Search TL name or ID..."
                      value={tlSearch}
                      onChange={(e) => setTlSearch(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-blue-600 focus:outline-none"
                    />

                    <select
                      value={tlStatusFilter}
                      onChange={(e) => setTlStatusFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>

                    <select
                      value={tlProjectFilter}
                      onChange={(e) => setTlProjectFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Projects</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.projectTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Profile & Name</th>
                          <th className="py-3.5 px-4">Team Leader ID</th>
                          <th className="py-3.5 px-4">Designation / Dept</th>
                          <th className="py-3.5 px-4 text-center">Projects</th>
                          <th className="py-3.5 px-4 text-center">Team Size</th>
                          <th className="py-3.5 px-4 text-center">Tasks Managed</th>
                          <th className="py-3.5 px-4 text-center">Task Completion</th>
                          <th className="py-3.5 px-4 text-center">Project Progress</th>
                          <th className="py-3.5 px-4 text-center">Performance</th>
                          <th className="py-3.5 px-4 text-center">Workload</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {filteredTLs.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-8 text-center text-slate-400 font-bold">
                              No Team Leaders found.
                            </td>
                          </tr>
                        ) : (
                          filteredTLs.map((tl) => (
                            <tr key={tl.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {tl.avatarUrl ? (
                                    <img src={tl.avatarUrl} alt={tl.name} className="h-8 w-8 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {tl.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTL(tl)}
                                    className="font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer text-left"
                                  >
                                    {tl.name}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTL(tl)}
                                  className="text-slate-700 hover:text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {tl.employeeId}
                                </button>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{tl.role}</div>
                                <div className="text-[10px] text-slate-500">{tl.department}</div>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                                {tl.projectsCount}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {tl.teamSize}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {tl.metrics?.totalTasks || 0}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-700">
                                {tl.taskCompletionPct}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                                {tl.projectProgress}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                {tl.performanceScore !== null ? `${tl.performanceScore}%` : "N/A"}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                {tl.workload !== null ? `${tl.workload}%` : "N/A"}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {tl.status}
                                </span>
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
                /* --- EMPLOYEE BASIC DETAILS + WORKBOARD VIEW --- */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
                  {/* Back Action */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmp(null);
                        setEmpWorkboardProjectFilter("ALL");
                        setEmpWorkboardStatusTab("ALL");
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      ← Back to Employees
                    </button>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                      Employee Basic Details & Workboard
                    </span>
                  </div>

                  {/* 3. Basic Person Details Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedEmp.avatarUrl ? (
                        <img
                          src={selectedEmp.avatarUrl}
                          alt={selectedEmp.name}
                          className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shadow-xs">
                          {selectedEmp.name ? selectedEmp.name.substring(0, 2).toUpperCase() : "E"}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{selectedEmp.name}</h2>
                        <p className="text-xs text-slate-500 font-mono">
                          Employee ID: <span className="font-bold text-slate-800">{selectedEmp.employeeId}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600 font-medium">
                          <div>
                            <span className="text-slate-400 font-bold">Designation:</span> {selectedEmp.role}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Department:</span> {selectedEmp.department}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Joining Date:</span>{" "}
                            {new Date(selectedEmp.joiningDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Current Status:</span>{" "}
                            <span className="font-bold text-emerald-700">{selectedEmp.status}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 font-bold">Current Project:</span>{" "}
                            <span className="font-bold text-blue-700">
                              {selectedEmp.currentProject?.projectTitle || "Operational Tasks"}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 font-bold">Team Leader:</span>{" "}
                            <span className="font-bold text-slate-800">{selectedEmp.teamLeader?.name || "Unassigned"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 9 & 13. Work Summary & Performance Numbers */}
                  {employeeWorkboardData && (
                    <div className="space-y-4">
                      {/* Project Scope Filter Toolbar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Work Summary
                        </h3>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-500">Project Scope:</label>
                          <select
                            value={empWorkboardProjectFilter}
                            onChange={(e) => setEmpWorkboardProjectFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                          >
                            <option value="ALL">All Projects ({selectedEmp.allTasks?.length || 0} Total Tasks)</option>
                            {selectedEmp.assignedProjects?.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.projectTitle}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Work Summary Numbers */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Total Tasks</p>
                          <p className="text-base font-black text-slate-900 mt-1">{employeeWorkboardData.totalTasks}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                          <p className="text-[10px] font-bold uppercase text-emerald-700">Completed</p>
                          <p className="text-base font-black text-emerald-800 mt-1">{employeeWorkboardData.completedCount}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30">
                          <p className="text-[10px] font-bold uppercase text-blue-700">In Progress</p>
                          <p className="text-base font-black text-blue-800 mt-1">{employeeWorkboardData.inProgressCount}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Pending</p>
                          <p className="text-base font-black text-slate-700 mt-1">{employeeWorkboardData.pendingCount}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/30">
                          <p className="text-[10px] font-bold uppercase text-amber-700">In Review</p>
                          <p className="text-base font-black text-amber-800 mt-1">{employeeWorkboardData.inReviewCount}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/30">
                          <p className="text-[10px] font-bold uppercase text-rose-700">Blocked</p>
                          <p className="text-base font-black text-rose-800 mt-1">{employeeWorkboardData.blockedCount}</p>
                        </div>
                      </div>

                      {/* Mathematical Completion & Overall Progress */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-center text-xs">
                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Task Completion (Completed / Total)
                          </p>
                          <p className="text-base font-black text-slate-900 mt-1">
                            {employeeWorkboardData.taskCompletionRate}%
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Overall Work Progress (Sum of Progress / Tasks)
                          </p>
                          <p className="text-base font-black text-blue-700 mt-1">
                            {employeeWorkboardData.overallProgressVal}%
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Performance Assessment</p>
                          <p className="text-base font-black text-emerald-700 mt-1">
                            {selectedEmp.performanceScore !== null ? `${selectedEmp.performanceScore}%` : "Performance: Not enough data"}
                          </p>
                        </div>
                      </div>

                      {/* 19. TODAY'S WORK */}
                      <div className="p-4.5 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-3">
                        <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                          <span>📅</span> Today's Work Summary
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Today's Completed</p>
                            <p className="text-sm font-black text-emerald-700">{selectedEmp.todayWork?.todayCompletedTasks || 0}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Today's In Progress</p>
                            <p className="text-sm font-black text-blue-700">{selectedEmp.todayWork?.todayInProgressTasks || 0}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Today's Updates</p>
                            <p className="text-sm font-black text-slate-900">{selectedEmp.todayWork?.todayUpdatesCount || 0}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Today's Hours</p>
                            <p className="text-sm font-black text-slate-900">{selectedEmp.todayWork?.todayHours || 0} hrs</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Today's Blockers</p>
                            <p className={`text-sm font-black ${(selectedEmp.todayWork?.todayBlockers || 0) > 0 ? "text-rose-600" : "text-slate-900"}`}>
                              {selectedEmp.todayWork?.todayBlockers || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 10. EMPLOYEE WORKBOARD TABS & DISTINCT TASKS TABLE */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                            Employee Workboard
                          </h3>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Click any task row to view updates & attachments
                          </span>
                        </div>

                        {/* Status Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setEmpWorkboardStatusTab("ALL")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              empWorkboardStatusTab === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            All Tasks ({employeeWorkboardData.totalTasks})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpWorkboardStatusTab("COMPLETED")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              empWorkboardStatusTab === "COMPLETED" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Completed ({employeeWorkboardData.completedCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpWorkboardStatusTab("IN_PROGRESS")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              empWorkboardStatusTab === "IN_PROGRESS" ? "bg-white text-blue-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            In Progress ({employeeWorkboardData.inProgressCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpWorkboardStatusTab("PENDING")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              empWorkboardStatusTab === "PENDING" ? "bg-white text-slate-900 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Pending ({employeeWorkboardData.pendingCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpWorkboardStatusTab("IN_REVIEW")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              empWorkboardStatusTab === "IN_REVIEW" ? "bg-white text-amber-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            In Review ({employeeWorkboardData.inReviewCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpWorkboardStatusTab("BLOCKED")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              empWorkboardStatusTab === "BLOCKED" ? "bg-white text-rose-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Blocked ({employeeWorkboardData.blockedCount})
                          </button>
                        </div>

                        {/* Distinct Tasks Table (No Duplicates) */}
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                              <tr>
                                <th className="py-3 px-4">Task Name</th>
                                <th className="py-3 px-4">Project</th>
                                <th className="py-3 px-4">Section</th>
                                <th className="py-3 px-4 text-center">Priority</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Due Date</th>
                                <th className="py-3 px-4 text-center">Progress</th>
                                <th className="py-3 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                              {employeeWorkboardData.visibleTasks.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-6 text-center text-slate-400 font-bold">
                                    No tasks found in this section.
                                  </td>
                                </tr>
                              ) : (
                                employeeWorkboardData.visibleTasks.map((t: any) => (
                                  <tr
                                    key={t.id}
                                    onClick={() => setActiveTaskModal(t)}
                                    className="hover:bg-slate-50/80 transition cursor-pointer"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline">
                                        {t.title}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">ID: {t.id}</div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-700 font-semibold">{t.projectTitle || "Operational"}</td>
                                    <td className="py-3 px-4 text-slate-600">{t.section || "General"}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                          t.priority === "HIGH" || t.priority === "URGENT"
                                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                                            : "bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        {t.priority}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                          t.status === "COMPLETED"
                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                            : t.status === "IN_PROGRESS"
                                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                                            : t.status === "BLOCKED"
                                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                                            : "bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        {t.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                                      {t.dueDate
                                        ? new Date(t.dueDate).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                          })
                                        : "N/A"}
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                                      {t.progress !== undefined ? `${t.progress}%` : "Progress not reported"}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveTaskModal(t);
                                        }}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition"
                                      >
                                        View Details →
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 20. RECENT WORK UPDATES */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Recent Work Updates
                        </h3>
                        {selectedEmp.recentWorkUpdates?.length === 0 ? (
                          <p className="text-xs text-slate-400 font-medium py-2">No work update logs on record.</p>
                        ) : (
                          <div className="space-y-2.5">
                            {selectedEmp.recentWorkUpdates?.map((wu: any) => (
                              <div
                                key={wu.id}
                                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                                    {new Date(wu.date).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    • {wu.projectTitle || "Operational"}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                                    {wu.hoursWorked || 8} hrs logged
                                  </span>
                                </div>
                                <p className="text-xs text-slate-800 font-medium">{wu.description}</p>
                                {wu.achievements && (
                                  <p className="text-[11px] text-emerald-700 font-semibold">
                                    ✓ Key Achievement: {wu.achievements}
                                  </p>
                                )}
                                {wu.blockers && (
                                  <p className="text-[11px] text-rose-600 font-semibold">
                                    ⚠️ Blocker: {wu.blockers}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* --- EMPLOYEES LIST VIEW WITH SEARCH, FILTERS & PAGINATION --- */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Workforce Directory ({filteredEmployees.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Employee name or Employee ID to view their Basic Details and Workboard.
                      </p>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Search Employee Name or ID..."
                      value={empSearch}
                      onChange={(e) => {
                        setEmpSearch(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-blue-600 focus:outline-none"
                    />

                    <select
                      value={empProjectFilter}
                      onChange={(e) => {
                        setEmpProjectFilter(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Projects</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.projectTitle}
                        </option>
                      ))}
                    </select>

                    <select
                      value={empTLFilter}
                      onChange={(e) => {
                        setEmpTLFilter(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Team Leaders</option>
                      {uniqueTLs.map((tl) => (
                        <option key={tl.id} value={tl.id}>
                          {tl.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={empStatusFilter}
                      onChange={(e) => {
                        setEmpStatusFilter(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  {/* Employees Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Profile & Name</th>
                          <th className="py-3.5 px-4">Employee ID</th>
                          <th className="py-3.5 px-4">Designation / Dept</th>
                          <th className="py-3.5 px-4">Current Project</th>
                          <th className="py-3.5 px-4">Team Leader</th>
                          <th className="py-3.5 px-4 text-center">Assigned Tasks</th>
                          <th className="py-3.5 px-4 text-center">Completed Tasks</th>
                          <th className="py-3.5 px-4 text-center">Work Progress</th>
                          <th className="py-3.5 px-4 text-center">Performance</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {paginatedEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                              No employees found matching filter criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.name} className="h-8 w-8 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {emp.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEmp(emp)}
                                    className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                                  >
                                    {emp.name}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEmp(emp)}
                                  className="text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {emp.employeeId}
                                </button>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{emp.role}</div>
                                <div className="text-[10px] text-slate-500">{emp.department}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 line-clamp-1">
                                  {emp.currentProject?.projectTitle || "Operational"}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-semibold text-slate-700">
                                {emp.teamLeader?.name || "Unassigned"}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                                {emp.tasksAssignedCount}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                                {emp.completedTasksCount}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">
                                {emp.overallWorkProgress}%
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                {emp.performanceScore !== null ? `${emp.performanceScore}%` : "N/A"}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {emp.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
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

      {/* 14. TASK DETAILS MODAL WITH ALL ASSOCIATED WORK UPDATES */}
      {activeTaskModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveTaskModal(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Task ID: {activeTaskModal.id}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{activeTaskModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Project: {activeTaskModal.projectTitle || "Operational"} ({activeTaskModal.projectCode || "N/A"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Task Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                <span className="font-bold text-slate-900">{activeTaskModal.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Priority</span>
                <span className="font-bold text-slate-900">{activeTaskModal.priority}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Progress</span>
                <span className="font-bold text-blue-700">{activeTaskModal.progress || 0}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Employee</span>
                <span className="font-bold text-slate-900">{activeTaskModal.assignedUserName || selectedEmp?.name || "Assigned"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Team Leader</span>
                <span className="font-bold text-slate-900">{activeTaskModal.teamLeaderName || selectedEmp?.teamLeader?.name || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Date</span>
                <span className="font-mono text-slate-700">
                  {activeTaskModal.dueDate ? new Date(activeTaskModal.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                </span>
              </div>
            </div>

            {/* Task Description */}
            {activeTaskModal.description && (
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Scope & Description</h4>
                <p className="text-xs text-slate-700 leading-relaxed p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  {activeTaskModal.description}
                </p>
              </div>
            )}

            {/* Associated Work Updates for this Task */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Work Updates Associated with Task ({activeTaskModal.workUpdates?.length || 0})
              </h4>

              {activeTaskModal.workUpdates?.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">No daily work updates logged for this task yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeTaskModal.workUpdates?.map((wu: any) => (
                    <div key={wu.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>{new Date(wu.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">{wu.hoursWorked || 8} Hours</span>
                      </div>
                      <p className="text-slate-800 font-medium">{wu.description}</p>
                      {wu.achievements && (
                        <p className="text-[11px] text-emerald-700 font-semibold">✓ {wu.achievements}</p>
                      )}
                      {wu.blockers && (
                        <p className="text-[11px] text-rose-600 font-semibold">⚠️ Blocker: {wu.blockers}</p>
                      )}
                      {wu.gitCommits && (
                        <p className="text-[10px] font-mono text-blue-700">Git Commits: {wu.gitCommits}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Task Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
