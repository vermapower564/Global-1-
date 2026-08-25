"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeaderDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "tasks" | "reviews" | "team" | "work">("all");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);
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
      setErrorMsg("");
      const res = await fetch("/api/team-leader/accept-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setFeedbackMsg("✓ Main task accepted! You can now divide it into deliverable sections.");
        loadSummary();
      } else {
        setErrorMsg(resData.error || "Failed to accept task.");
      }
    } catch (err) {
      setErrorMsg("Network error while accepting task.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleToggleMemberStatus = async (employeeId: string, currentActiveState: boolean) => {
    try {
      setTogglingMemberId(employeeId);
      setFeedbackMsg("");
      setErrorMsg("");
      const res = await fetch("/api/team-leader/toggle-employee-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          isActive: !currentActiveState,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setFeedbackMsg(`✓ ${resData.message}`);
        loadSummary();
      } else {
        setErrorMsg(resData.error || "Failed to update account status.");
      }
    } catch (err) {
      setErrorMsg("Network error while updating employee status.");
    } finally {
      setTogglingMemberId(null);
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
  const dailyWorkUpdates = data?.dailyWorkUpdates || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              👑 Team Leader Command Center
            </span>
            <span className="text-xs font-bold text-slate-500">• {summary.activeProjectsCount} Led Projects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.name || "Team Leader"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Divide Admin tasks into technical sections, assign work to available developers, review deliverables, manage team capacity, and deactivate inactive accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/team-leader/assign-work"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0 flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>+ Divide Task & Assign →</span>
          </Link>
          <Link
            href="/team-leader/reviews"
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0 flex items-center gap-1.5"
          >
            <span>🔍</span>
            <span>Review Deliverables ({summary.pendingReviewsCount})</span>
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

      {/* Segmented Part Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🌐 Complete Overview (All Parts)
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "tasks" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>📌 Part 1: Admin Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{adminMainTasks.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "reviews" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>🔍 Part 2: Deliverable Approvals</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{reviewTasks.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "team" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>👥 Part 3: Team Roster & Deactivation</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{teamMembers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("work")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "work" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>📝 Part 4: Daily Work Feed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{dailyWorkUpdates.length}</span>
        </button>
      </div>

      {/* METRICS OVERVIEW CARDS */}
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
          <span className="text-[10px] text-slate-500 font-medium">Assigned to team</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">{summary.availableMembersCount}</div>
          <span className="text-[10px] text-emerald-700 font-bold">Ready for work</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Sprints</span>
          <div className="text-2xl font-black text-amber-600 font-mono">{summary.workingMembersCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Active on tasks</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Reviews</span>
          <div className="text-2xl font-black text-purple-600 font-mono">{summary.pendingReviewsCount}</div>
          <span className="text-[10px] text-purple-700 font-bold">Awaiting approval</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PART 1: NEW MAIN TASKS ASSIGNED BY ADMIN                                  */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "tasks") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Part 1 • Project Work Breakdown
                </span>
                <span className="text-xs font-bold text-slate-500">• {adminMainTasks.length} Main Tasks</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                📌 Admin Assigned Main Tasks (Divide into Sections)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Accept deliverables assigned by Admin and split into specific section tasks (Frontend, Backend, Design, Testing) for your developers.
              </p>
            </div>
            <Link
              href="/team-leader/assign-work"
              className="text-xs font-extrabold text-blue-600 hover:text-blue-800 shrink-0"
            >
              + Open Work Divider Tool →
            </Link>
          </div>

          {adminMainTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
              No pending main tasks currently assigned by Admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminMainTasks.map((task: any) => {
                const isNew = task.status === "NEW" || task.status === "ASSIGNED";

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
                      <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
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
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-2xs cursor-pointer text-center"
                        >
                          {acceptingId === task.id ? "Accepting..." : "✓ Accept Main Task"}
                        </button>
                      ) : (
                        <Link
                          href={`/team-leader/assign-work?mainTaskId=${task.id}`}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-2xs text-center"
                        >
                          ⚡ Divide into Technical Sections →
                        </Link>
                      )}

                      <Link
                        href={`/employee/projects/${task.projectId}`}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center"
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
      )}

      {/* ========================================================================= */}
      {/* PART 2: DELIVERABLE APPROVALS & QUALITY REVIEW                            */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "reviews") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-xs space-y-4 ring-1 ring-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Part 2 • Quality Control
                </span>
                <span className="text-xs font-bold text-purple-700">• {reviewTasks.length} Pending Review(s)</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                🔍 Deliverables Awaiting Team Leader Approval
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review submitted code, PR links, and section outputs. Approve to complete or request necessary revisions.
              </p>
            </div>
            <Link
              href="/team-leader/reviews"
              className="text-xs font-black text-purple-700 hover:text-purple-900"
            >
              Open Full Review Center →
            </Link>
          </div>

          {reviewTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
              ✓ All clear! No deliverables currently pending your review.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewTasks.slice(0, 6).map((t: any) => (
                <div key={t.id} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase bg-white px-2 py-0.5 rounded border border-purple-200">
                        Section: {t.section}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 mt-1">{t.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Submitted by:{" "}
                        <Link
                          href={`/admin/employees/${encodeURIComponent(t.assignedToUser?.employeeId || t.assignedToUser?.id || "EMP")}`}
                          className="text-slate-800 hover:text-purple-700 font-bold hover:underline"
                        >
                          {t.assignedToUser?.name}
                        </Link>{" "}
                        ({t.assignedToUser?.employeeId})
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-600 bg-white px-2 py-0.5 rounded border border-purple-200">
                      {t.progress}%
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-purple-100 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Link
                      href="/team-leader/reviews"
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs text-center transition shadow-2xs"
                    >
                      Inspect Deliverable & Approve →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: TEAM MEMBERS ROSTER & ACCOUNT DEACTIVATION CONTROL                */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "team") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Part 3 • Workforce Capacity & Access Control
                </span>
                <span className="text-xs font-bold text-slate-500">• {teamMembers.length} Active Staff</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                👥 Team Member Capacity & Account Status
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspect workload capacity, shift check-in times, assign tasks, and deactivate or reactivate employee account status.
              </p>
            </div>
            <Link
              href="/team-leader/team"
              className="text-xs font-black text-blue-600 hover:text-blue-700"
            >
              View Full Team Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee (Basic Info)</th>
                  <th className="p-3">Role / Department</th>
                  <th className="p-3 text-center">Today's Shift</th>
                  <th className="p-3 text-center">Active Tasks</th>
                  <th className="p-3">Current Work</th>
                  <th className="p-3 text-center">Workload</th>
                  <th className="p-3 text-right">Account Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {teamMembers.map((m: any) => {
                  const isAvail = m.workloadStatus === "AVAILABLE";
                  const isOver = m.workloadStatus === "OVERLOADED";
                  const isToggling = togglingMemberId === m.id || togglingMemberId === m.employeeId;

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
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{m.email}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="font-bold text-slate-800">{m.role}</div>
                        <span className="text-[10px] text-slate-400">{typeof m.department === "object" ? m.department?.name : m.department}</span>
                      </td>
                      <td className="p-3 text-center font-mono">
                        {m.todayAttendance?.status === "PRESENT" || m.todayAttendance?.checkIn ? (
                          <div>
                            <span className="text-emerald-600 font-bold">
                              {m.todayAttendance.hoursWorked}h worked
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              In: {m.todayAttendance.checkIn}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Not Checked In</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        {m.activeTaskCount}
                      </td>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/team-leader/assign-work?employeeId=${m.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px] hover:bg-blue-100 transition inline-block shadow-2xs"
                          >
                            + Assign
                          </Link>
                          <button
                            onClick={() => handleToggleMemberStatus(m.id, true)}
                            disabled={isToggling}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[11px] transition cursor-pointer border border-rose-200 shadow-2xs disabled:opacity-50"
                            title="Deactivate employee access if absent or inactive"
                          >
                            {isToggling ? "..." : "Deactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 4: DAILY WORK UPDATES (EOD FEED)                                     */}
      {/* ========================================================================= */}
      {(activeTab === "all" || activeTab === "work") && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                  Part 4 • Daily EOD Work Stream
                </span>
                <span className="text-xs font-bold text-slate-500">• {dailyWorkUpdates.length} Recent Logs</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                📝 Team Member Daily Work & EOD Submissions
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspect real-time daily work logs, accomplishments, and blockers reported by your team.
              </p>
            </div>
            <Link
              href="/team-leader/progress"
              className="text-xs font-black text-amber-700 hover:text-amber-800"
            >
              View Full Progress Tracker →
            </Link>
          </div>

          {dailyWorkUpdates.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
              No daily work logs submitted today yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyWorkUpdates.map((dw: any) => (
                <div key={dw.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900">{dw.userName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {dw.employeeId} • <strong className="text-slate-700">{dw.projectTitle}</strong>
                      </p>
                    </div>
                    <span className="font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {dw.hoursWorked} hrs
                    </span>
                  </div>

                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    {dw.taskDescription}
                  </p>

                  {dw.blockers && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px]">
                      ⚠️ <strong>Blocker:</strong> {dw.blockers}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Date: {new Date(dw.date).toLocaleDateString()}</span>
                    <span className="font-bold text-emerald-600">✓ Logged in DB</span>
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
