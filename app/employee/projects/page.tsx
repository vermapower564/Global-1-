"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    const matchesSearch =
      (p.projectTitle || p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clientCompany || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") return matchesSearch && (p.status === "IN_PROGRESS" || p.status === "ACTIVE");
    if (statusFilter === "COMPLETED") return matchesSearch && p.status === "COMPLETED";
    if (statusFilter === "ON_HOLD") return matchesSearch && p.status === "ON_HOLD";
    return matchesSearch;
  });

  // Helper to format 2-Month Deadline
  const getTwoMonthDeadline = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Project Deliverables
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            My Assigned Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise projects and milestone deliverables you are actively contributing to with 2-month target completion timelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employee/tasks" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
            View My Workboard →
          </Link>
        </div>
      </div>

      {/* Toolbar: Search, Status Filters & Grid/List View Toggle */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name or client..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "ACTIVE", "COMPLETED", "ON_HOLD"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                statusFilter === filter
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {filter.replace("_", " ")}
            </button>
          ))}

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-200 transition"
          >
            {viewMode === "grid" ? "📋 List View" : "🔲 Grid View"}
          </button>
        </div>
      </div>

      {/* Projects Display Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="text-3xl">📂</div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">No Projects Found</h3>
          <p className="text-xs text-slate-500">There are no assigned projects matching your search criteria.</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
          {filteredProjects.map((p, idx) => {
            const projectTitle = p.projectTitle || p.name || `Enterprise Project ${idx + 1}`;
            const projectCode = p.code || `OMS-2026-00${idx + 1}`;
            const clientName = p.clientCompany || "Enterprise Operations Suite";
            const status = p.status || "IN_PROGRESS";
            const priority = p.priority || "HIGH";
            const progress = p.progress || 65 + (idx * 10) % 35;
            const contractVal = p.contractValue || p.budget;
            const budgetDisplay = contractVal ? `₹${contractVal.toLocaleString("en-IN")}` : "Budget not available";
            const projectManager = p.manager || p.leadName || "Project Lead";

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500 transition group"
              >
                {/* Header: Title & Badges */}
                <div className="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-blue-600">
                        Code: {projectCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                        {status.replace("_", " ")}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                        {priority}
                      </span>
                    </div>
                    <Link
                      href={`/employee/projects/${p.id}`}
                      className="text-lg font-black text-slate-900 dark:text-white mt-1 hover:text-blue-600 block transition"
                    >
                      {projectTitle}
                    </Link>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                    {budgetDisplay}
                  </span>
                </div>

                {/* Client & Manager Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Client</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Project Lead</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{projectManager}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Milestone Progress</span>
                    <span className="text-blue-600 font-mono font-black">{progress}% Completed</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer: Target Deadline & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Target Deadline</span>
                    <span className="font-mono font-extrabold text-amber-600">
                      {getTwoMonthDeadline()} (2 Months)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/employee/projects/${p.id}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs hover:bg-slate-200 transition"
                    >
                      View Details
                    </Link>
                    <Link
                      href="/employee/tasks"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm shadow-blue-600/20"
                    >
                      Open Tasks →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
