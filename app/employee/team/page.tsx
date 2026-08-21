"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface TeammateRow {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  projectName: string;
  currentWork: string;
  status: string;
  progress: number;
  activeTasksCount: number;
  isMe?: boolean;
}

interface MyWorkItem {
  id: string;
  title: string;
  section: string;
  status: string;
  priority: string;
  progress: number;
  dueDate?: string | null;
  estimatedHours?: number;
  actualHours?: number;
}

interface TeamWorkSection {
  name: string;
  total: number;
  completed: number;
  progress: number;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    assignedToName: string;
    assignedToRole: string;
    isMyTask: boolean;
  }>;
}

interface ProjectData {
  id: string;
  projectTitle: string;
  projectCode?: string;
  description?: string;
  clientCompany?: string;
  status: string;
  projectManager: string;
  teamLeader: string;
  progress: {
    overallProgress: number;
    completed: number;
    inProgress: number;
    inReview: number;
    blocked: number;
    pending: number;
    total: number;
  };
  myWork: MyWorkItem[];
  myTeammates: TeammateRow[];
  teamWorkSections: TeamWorkSection[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "IN_REVIEW":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "BLOCKED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function EmployeeTeamPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/team");
      const json = await res.json();
      if (json.success && Array.isArray(json.projects)) {
        setProjects(json.projects);
        if (json.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(json.projects[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed loading employee team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse p-4 font-sans">
        <div className="h-28 bg-slate-200 rounded-3xl"></div>
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-10 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4 font-sans text-slate-900">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-2xl flex items-center justify-center mx-auto">
          👥
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          No team activity available.
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          You are currently not assigned to any active project or work deliverable. Once a Team Leader assigns work to your profile, your project team and collaboration progress will appear here.
        </p>
        <div className="pt-2">
          <Link
            href="/employee/tasks"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            📋 View My Tasks Board →
          </Link>
        </div>
      </div>
    );
  }

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
            TEAM • PROJECT COLLABORATION (VIEW ONLY)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            My Project Team
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            View the actual teammates collaborating with you on your assigned project and track overall delivery progress.
          </p>
        </div>

        {/* Project Selector (if participating in multiple projects) */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectTitle} ({p.progress.overallProgress}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentProject && (
        <>
          {/* PROJECT & LEADERSHIP CARD */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-300 tracking-widest block mb-0.5">
                  PROJECT
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentProject.projectTitle}
                </h2>
                {currentProject.clientCompany && (
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    Client: {currentProject.clientCompany}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {currentProject.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  {currentProject.progress.overallProgress}% Completed
                </span>
              </div>
            </div>

            {/* Plain Leadership Context (Non-clickable plain text) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Project Manager
                </span>
                <p className="font-extrabold text-sm text-white mt-0.5">
                  👔 {currentProject.projectManager}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  Team Leader
                </span>
                <p className="font-extrabold text-sm text-white mt-0.5">
                  👑 {currentProject.teamLeader}
                </p>
              </div>
            </div>
          </div>

          {/* 1. MY WORK SECTION */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <span>🎯</span> MY WORK
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Your individual deliverables and execution progress in this project.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600">
                {currentProject.myWork.length} task(s) assigned to you
              </span>
            </div>

            {currentProject.myWork.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500">No individual tasks currently assigned to you in this project.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentProject.myWork.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-[10px] font-bold text-indigo-800 uppercase">
                          {task.section}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 mt-1">{task.title}</h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 text-[11px]">Execution Progress</span>
                        <span className="font-mono text-indigo-700">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {task.dueDate && (
                      <p className="text-[11px] text-slate-400 font-medium pt-1 border-t border-indigo-100">
                        Due: {task.dueDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. MY TEAMMATES (PEERS TABLE) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <span>👥</span> MY TEAMMATES
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Actual employee peers working with you on {currentProject.projectTitle}. Read-only view.
              </p>
            </div>

            {currentProject.myTeammates.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500">No other employee peers assigned to this project yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Teammate</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Project</th>
                      <th className="p-3.5">Current Work</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentProject.myTeammates.map((m) => (
                      <tr key={m.id} className={`hover:bg-slate-50/70 ${m.isMe ? "bg-indigo-50/30" : ""}`}>
                        <td className="p-3.5">
                          <span className="font-extrabold text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">{m.employeeId}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                            {m.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {m.projectName}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {m.currentWork}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(
                              m.status
                            )}`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. TEAM WORK / SECTIONS */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <span>📋</span> TEAM WORK
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Structured work sections and overall project deliverables.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentProject.teamWorkSections.map((sec) => (
                <div key={sec.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-900">{sec.name}</span>
                    <span className="font-mono font-bold text-indigo-600">{sec.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${sec.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {sec.completed} / {sec.total} deliverables finished
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. PROJECT PROGRESS */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <span>📊</span> PROJECT PROGRESS
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Calculated from real task completion records across {currentProject.projectTitle}.
                </p>
              </div>
              <span className="font-mono text-2xl font-black text-indigo-600">
                {currentProject.progress.overallProgress}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">Completed</span>
                <span className="font-mono text-xl font-black text-emerald-900">{currentProject.progress.completed}</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-black uppercase text-blue-700 block">In Progress</span>
                <span className="font-mono text-xl font-black text-blue-900">{currentProject.progress.inProgress}</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-black uppercase text-purple-700 block">In Review</span>
                <span className="font-mono text-xl font-black text-purple-900">{currentProject.progress.inReview}</span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-black uppercase text-rose-700 block">Blocked</span>
                <span className="font-mono text-xl font-black text-rose-900">{currentProject.progress.blocked}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-600 block">Pending</span>
                <span className="font-mono text-xl font-black text-slate-800">{currentProject.progress.pending}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
