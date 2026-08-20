"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeaderDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team-leader/summary");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.warn("Failed loading team leader dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleAcceptTask = async (taskId: string) => {
    try {
      setAcceptingId(taskId);
      setFeedbackMsg("");
      const res = await fetch("/api/team-leader/accept-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setFeedbackMsg(`✓ Task accepted successfully! You can now divide this task into work sections.`);
        loadSummary();
      }
    } catch (err) {
      console.error("Failed to accept task:", err);
    } finally {
      setAcceptingId(null);
    }
  };

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
    newTasksCount: 0,
    activeProjectsCount: 0,
    teamMembersCount: 0,
    availableMembersCount: 0,
    workingMembersCount: 0,
    pendingReviewsCount: 0,
  };

  const adminMainTasks = data?.adminMainTasks || [];
  const teamMembers = data?.teamMembers || [];
  const reviewTasks = data?.reviewTasks || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              👑 Team Leader Command Workspace
            </span>
            <span className="text-xs font-bold text-slate-500">• {summary.activeProjectsCount} Led Projects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Team Leader Operations Center
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Accept Admin-assigned main tasks, divide project deliverables into sections, assign work to available team members, and review submitted deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/team-leader/assign-work"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            + Assign Work to Team →
          </Link>
          <Link
            href="/team-leader/team"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 transition shrink-0"
          >
            👥 Team Members
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* 6 Real Database Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Tasks</span>
          <div className="text-2xl font-black text-blue-600 font-mono">{summary.newTasksCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Assigned by Admin</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Projects</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{summary.activeProjectsCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Under your leadership</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Team Members</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{summary.teamMembersCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">In your project team</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Members</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">{summary.availableMembersCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium font-bold">Ready for work</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Working Members</span>
          <div className="text-2xl font-black text-amber-600 font-mono">{summary.workingMembersCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Active in sprints</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Reviews</span>
          <div className="text-2xl font-black text-purple-600 font-mono">{summary.pendingReviewsCount}</div>
          <span className="text-[10px] text-purple-700 font-medium font-bold">Needs your review</span>
        </div>
      </div>

      {/* SECTION 1: NEW TASKS ASSIGNED BY ADMIN */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              📌 New Tasks Assigned by Admin
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review high-level deliverables assigned to you, accept them, and divide into technical sections for team members.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600">
            {adminMainTasks.length} Main Task(s)
          </span>
        </div>

        {adminMainTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            No pending main tasks assigned by Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminMainTasks.map((task: any) => {
              const isNew = task.status === "NEW" || task.status === "ASSIGNED";
              const isAccepted = task.status === "ACCEPTED" || task.status === "IN_PROGRESS";

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition shadow-2xs space-y-3 ${
                    isNew
                      ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-100"
                      : "bg-white border-slate-200"
                  }`}
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
                    <p className="text-xs text-slate-600 line-clamp-2 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 text-slate-500 font-medium">
                    <span>Assigned By: <strong className="text-slate-700">{task.assignedBy}</strong></span>
                    <span className="font-mono text-slate-700 font-bold">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    {isNew ? (
                      <button
                        onClick={() => handleAcceptTask(task.id)}
                        disabled={acceptingId === task.id}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-2xs cursor-pointer text-center"
                      >
                        {acceptingId === task.id ? "Accepting..." : "✓ Accept Task"}
                      </button>
                    ) : (
                      <Link
                        href={`/team-leader/assign-work?mainTaskId=${task.id}`}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-2xs text-center"
                      >
                        ⚡ Divide into Sections →
                      </Link>
                    )}

                    <Link
                      href={`/employee/projects/${task.projectId}`}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: PENDING WORK REVIEWS */}
      {reviewTasks.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-sm space-y-4 ring-1 ring-purple-100">
          <div className="flex justify-between items-center border-b border-purple-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Review Queue
                </span>
                <span className="text-xs font-bold text-purple-700">• {reviewTasks.length} Pending Review(s)</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                🔍 Employee Deliverables Awaiting Your Approval
              </h3>
            </div>
            <Link
              href="/team-leader/reviews"
              className="text-xs font-black text-purple-700 hover:text-purple-900"
            >
              Open Full Review Queue →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewTasks.slice(0, 4).map((t: any) => (
              <div key={t.id} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase bg-white px-2 py-0.5 rounded border border-purple-200">
                      Section: {t.section}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 mt-1">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Submitted by:{" "}
                      <Link
                        href={`/admin/employees/${encodeURIComponent(t.assignedToUser?.employeeId || t.assignedToUser?.id || "EMP001")}`}
                        className="text-slate-800 hover:text-purple-700 font-bold hover:underline"
                        title={`View ${t.assignedToUser?.name} Profile`}
                      >
                        {t.assignedToUser?.name}
                      </Link>{" "}
                      ({t.assignedToUser?.employeeId})
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">{t.progress}%</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/team-leader/reviews`}
                    className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs text-center transition"
                  >
                    Review & Decide →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: TEAM MEMBERS AVAILABILITY PREVIEW */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              👥 Team Members Availability & Workload
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Identify free developers and assign tasks based on live workload.
            </p>
          </div>
          <Link
            href="/team-leader/team"
            className="text-xs font-black text-blue-600 hover:text-blue-700"
          >
            View All Members ({teamMembers.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role / Department</th>
                <th className="p-3 text-center">Active Tasks</th>
                <th className="p-3">Current Work</th>
                <th className="p-3 text-center">Availability</th>
                <th className="p-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {teamMembers.slice(0, 6).map((m: any) => {
                const isAvail = m.workloadStatus === "AVAILABLE";
                const isOver = m.workloadStatus === "OVERLOADED";

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">
                      <Link
                        href={`/admin/employees/${encodeURIComponent(m.employeeId || m.id)}`}
                        title={`View ${m.name} Profile`}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {m.name}
                      </Link>{" "}
                      <span className="text-[10px] font-mono text-slate-400 font-normal">({m.employeeId})</span>
                    </td>
                    <td className="p-3 text-slate-600">{m.role}</td>
                    <td className="p-3 text-center font-mono font-bold">{m.activeTaskCount}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate">{m.currentWork}</td>
                    <td className="p-3 text-center">
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
                    <td className="p-3 text-right">
                      <Link
                        href={`/team-leader/assign-work?employeeId=${m.id}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition inline-block"
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
      </div>
    </div>
  );
}
