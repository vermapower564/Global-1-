"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectManagerDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "tasks" | "sections" | "blockers">("all");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadSummary = async () => {
    try {
      setLoading(true);
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.user) {
            setUser(json.user);
          }
        })
        .catch(() => {});

      const res = await fetch("/api/project-manager/summary");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setErrorMsg(json.error || "Failed to load Project Manager dashboard.");
      }
    } catch (err) {
      console.warn("Failed loading PM summary:", err);
      setErrorMsg("Network error loading dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse p-4 font-sans">
        <div className="h-32 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    activeProjectsCount: 0,
    mainTasksCount: 0,
    pendingMainTasksCount: 0,
    workSectionsCount: 0,
    sectionsInProgress: 0,
    sectionsCompleted: 0,
    blockersCount: 0,
    teamLeadersCount: 0,
  };

  const adminMainTasks = data?.adminMainTasks || [];
  const workSections = data?.workSections || [];
  const pmProjects = data?.pmProjects || [];
  const projectBlockers = data?.projectBlockers || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              ⚡ Project Manager Command Hub
            </span>
            <span className="text-xs font-bold text-slate-500">• {summary.activeProjectsCount} Managed Projects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.name || "Project Manager"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Receive high-level main tasks from Admin, divide into structured project work sections, assign deliverables to Team Leaders, and monitor team delivery milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/project-manager/assign-work"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0 flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>+ Divide Task into Sections →</span>
          </Link>
          <Link
            href="/project-manager/tasks"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 transition shrink-0"
          >
            📌 Admin Tasks ({adminMainTasks.length})
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Segment Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🌐 Complete Overview
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "tasks" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>📌 Admin Main Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{adminMainTasks.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "sections" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>📋 Work Sections with Team Leaders</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{workSections.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("blockers")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "blockers" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>⚠️ Project Blockers</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{projectBlockers.length}</span>
        </button>
      </div>

      {/* METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Projects</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{summary.activeProjectsCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Under your management</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Tasks</span>
          <div className="text-2xl font-black text-indigo-600 font-mono">{summary.mainTasksCount}</div>
          <span className="text-[10px] text-indigo-700 font-medium">Assigned by Admin</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Work Sections</span>
          <div className="text-2xl font-black text-blue-600 font-mono">{summary.workSectionsCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Created for Team Leads</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
          <div className="text-2xl font-black text-amber-600 font-mono">{summary.sectionsInProgress}</div>
          <span className="text-[10px] text-amber-700 font-bold">Active in development</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">{summary.sectionsCompleted}</div>
          <span className="text-[10px] text-emerald-700 font-bold">Milestones finished</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blockers</span>
          <div className="text-2xl font-black text-rose-600 font-mono">{summary.blockersCount}</div>
          <span className="text-[10px] text-rose-700 font-bold">Needs resolution</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PART 1: TASKS ASSIGNED BY ADMIN                                           */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "tasks") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                  Tier 1 • Main Tasks from Admin
                </span>
                <span className="text-xs font-bold text-slate-500">• {adminMainTasks.length} Deliverables</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                📌 Tasks Assigned by Admin to Project Manager
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspect executive deliverables assigned to you, break them into technical project sections, and assign to Team Leaders.
              </p>
            </div>
            <Link
              href="/project-manager/assign-work"
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 shrink-0"
            >
              + Divide into Sections →
            </Link>
          </div>

          {adminMainTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
              No main tasks currently assigned by Admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminMainTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            task.priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {task.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">{task.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Project: <strong className="text-slate-800">{task.projectTitle}</strong>
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                      {task.id}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                    <span>Assigned By: <strong className="text-slate-700">{task.assignedBy}</strong></span>
                    <span className="font-mono text-slate-700 font-bold">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  {task.projectTeamLeader && (
                    <div className="text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-xl border border-indigo-100 font-medium">
                      👑 Project Team Leader: <strong>{task.projectTeamLeader.name}</strong> ({task.projectTeamLeader.employeeId})
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/project-manager/assign-work?mainTaskId=${task.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-2xs text-center"
                    >
                      ⚡ Divide into Work Sections →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 2: WORK SECTIONS ASSIGNED TO TEAM LEADERS                            */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "sections") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Tier 2 • Team Leader Work Assignments
                </span>
                <span className="text-xs font-bold text-slate-500">• {workSections.length} Sections</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                📋 Project Work Sections Delegated to Team Leaders
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Track execution progress of work sections broken down by Project Manager and assigned to Team Leaders.
              </p>
            </div>
          </div>

          {workSections.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
              No work sections currently delegated. Divide an Admin Main Task above to assign work sections to Team Leaders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Section Title</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Assigned Team Leader</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Progress</th>
                    <th className="p-3.5 text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {workSections.map((sec: any) => (
                    <tr key={sec.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{sec.title}</div>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                          [{sec.section}]
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700">{sec.projectTitle}</td>
                      <td className="p-3.5 text-slate-800 font-bold">
                        {sec.teamLeader?.name}{" "}
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          ({sec.teamLeader?.employeeId})
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {sec.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-blue-600">
                        {sec.progress}%
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        {sec.dueDate ? new Date(sec.dueDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: PROJECT BLOCKERS & ESCALATIONS                                    */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "blockers") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-xs space-y-4 ring-1 ring-rose-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                  Attention Required
                </span>
                <span className="text-xs font-bold text-rose-700">• {projectBlockers.length} Active Blockers</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                ⚠️ Project Blockers Flagged by Team
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Investigate and resolve critical roadblocks reported by team members to unblock development.
              </p>
            </div>
          </div>

          {projectBlockers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
              ✓ No active blockers flagged across your projects.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectBlockers.map((b: any) => (
                <div key={b.id} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-rose-900">{b.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{b.projectTitle}</span>
                  </div>
                  <p className="text-rose-800 bg-white p-2.5 rounded-xl border border-rose-200">
                    {b.blockerReason}
                  </p>
                  <div className="text-[10px] text-slate-500">
                    Reported by: <strong>{b.reportedBy}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
