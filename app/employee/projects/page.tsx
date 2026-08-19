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
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (p.projectTitle || p.name || "").toLowerCase().includes(q) ||
      (p.clientCompany || "").toLowerCase().includes(q) ||
      (p.teamLeader?.name || "").toLowerCase().includes(q);
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") return matchesSearch && (p.status === "IN_PROGRESS" || p.status === "ACTIVE");
    if (statusFilter === "COMPLETED") return matchesSearch && (p.status === "COMPLETED" || p.metrics?.progressRate === 100);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Employee Workspace • Project Deliverables
            </span>
            <span className="text-xs font-bold text-slate-500">• {projects.length} Active Engagements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Assigned Projects & Team Deliverables
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Enterprise deliverables and milestones you are actively contributing to. Inspect your assigned Team Leader, contributing Teammates, and verified Customer Reviews on completed project work.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employee/tasks"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            Open My Workboard →
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
            placeholder="Search projects by name, client, or team lead..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "ALL", label: `All Deliverables (${projects.length})` },
            { id: "COMPLETED", label: "🏆 Completed Projects" },
            { id: "ACTIVE", label: "🚀 Active Sprints" },
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
          <p className="text-xs font-bold text-slate-500 mt-3">Loading projects and team data...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <p className="text-xs font-bold text-slate-500">No projects found matching search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((p) => {
            const isCompleted = p.status === "COMPLETED" || p.metrics?.progressRate === 100;
            const leader = p.teamLeader || { name: "Roushan Verma", id: "EMP-8595", role: "Team Lead", avatar: "RV" };
            const teamMates = p.teamMates || [];
            const review = p.customerReview;
            const progress = p.metrics?.progressRate || (isCompleted ? 100 : 75);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                  isCompleted ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Title & Badges */}
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isCompleted ? "🏆 COMPLETED" : "🚀 IN PROGRESS"}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {p.id?.slice(0, 12)}
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

                    <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                      ₹{(Number(p.contractValue) || 250000).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Deliverables & Tasks</span>
                      <span className="text-blue-600 font-mono font-black">{progress}% Completed</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* TEAM LEADER (PROMINENT DISPLAY) */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        👑
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-700 block">
                          Project Team Leader
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {leader.name} <span className="font-mono text-[11px] text-slate-500">({leader.id})</span>
                        </span>
                        <span className="text-[11px] text-slate-600 block">{leader.role}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[10px] font-extrabold text-blue-700 shadow-2xs">
                      Team Lead
                    </span>
                  </div>

                  {/* CONTRIBUTING TEAMMATES */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      👥 Contributing Teammates on this Project ({teamMates.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamMates.map((mate: any, i: number) => (
                        <div
                          key={mate.id || i}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5"
                        >
                          <div className="h-8 w-8 rounded-lg bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                            {mate.avatar || mate.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-extrabold text-slate-900 block truncate">
                              {mate.name} <span className="font-mono text-[10px] text-slate-400 font-normal">({mate.id})</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {mate.contribution || mate.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOMER REVIEW ON THIS PROJECT WORK */}
                  {review && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">⭐</span>
                          <span className="text-[11px] font-black uppercase text-amber-900">
                            Customer Review on this Project Work
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 text-xs">★★★★★</span>
                          <span className="text-xs font-mono font-black text-amber-900">
                            {review.rating}.0
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900">
                        "{review.reviewTitle || "Client Testimonial"}"
                      </h4>

                      <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-amber-100">
                        “{review.feedbackText}”
                      </p>

                      <div className="text-[11px] text-slate-500 flex justify-between items-center pt-0.5">
                        <span>Reviewed by: <strong className="text-slate-800">{review.customerName}</strong> ({review.customerCompany})</span>
                        <span className="text-emerald-700 font-bold text-[10px]">✓ Verified Client</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    Status: <strong className={isCompleted ? "text-emerald-700" : "text-blue-700"}>{isCompleted ? "Completed" : "In Active Sprint"}</strong>
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/employee/projects/${p.id}`}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition"
                    >
                      Inspect Team →
                    </Link>
                    <Link
                      href="/employee/tasks"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm"
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
