"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeaderTasksPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team-leader/summary");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.warn("Failed loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAccept = async (taskId: string) => {
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
        setFeedbackMsg("✓ Task accepted! You can now divide this task into work sections.");
        loadTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAcceptingId(null);
    }
  };

  const adminMainTasks = data?.adminMainTasks || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Admin Directives & Main Deliverables
            </span>
            <span className="text-xs font-bold text-slate-500">• {adminMainTasks.length} Main Tasks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            New Tasks Assigned by Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Accept main tasks assigned by Admin, divide them into work sections (Frontend, Backend, DB, QA), and assign subtasks to project members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/team-leader/assign-work"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            + Assign Work to Team →
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* Main Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 mt-3">Loading tasks...</p>
          </div>
        ) : adminMainTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs font-bold text-slate-400">
            No main tasks currently assigned by Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminMainTasks.map((t: any) => {
              const isNew = t.status === "NEW" || t.status === "ASSIGNED";

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                    isNew ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              t.priority === "CRITICAL"
                                ? "bg-rose-100 text-rose-800"
                                : t.priority === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {t.status}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900">{t.title}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Project: <strong className="text-slate-800">{t.projectTitle}</strong>
                        </p>
                      </div>

                      <span className="text-xs font-mono font-bold text-slate-400">
                        {t.id}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        {t.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-500 font-medium">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Assigned By</span>
                        <strong className="text-slate-800">{t.assignedBy}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Target Deadline</span>
                        <strong className="text-slate-800 font-mono">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    {isNew ? (
                      <button
                        onClick={() => handleAccept(t.id)}
                        disabled={acceptingId === t.id}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md cursor-pointer text-center"
                      >
                        {acceptingId === t.id ? "Accepting..." : "✓ Accept Task"}
                      </button>
                    ) : (
                      <Link
                        href={`/team-leader/assign-work?mainTaskId=${t.id}`}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md text-center"
                      >
                        ⚡ Divide into Sections & Assign →
                      </Link>
                    )}

                    <Link
                      href={`/employee/projects/${t.projectId}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center"
                    >
                      Project Workspace
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
