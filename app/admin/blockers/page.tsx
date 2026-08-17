"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface BlockedTask {
  id: string;
  title: string;
  blockerReason?: string;
  priority: string;
  progress: number;
  updatedAt: string;
  assignedToUser?: { id: string; name: string; employeeId: string };
  project?: { id: string; name: string };
}

export default function AdminBlockersPage() {
  const [blockedTasks, setBlockedTasks] = useState<BlockedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const fetchBlockedTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?status=BLOCKED");
      const json = await res.json();
      if (json.success) {
        setBlockedTasks(json.tasks || []);
      }
    } catch (err) {
      console.warn("Failed to fetch blocked tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedTasks();
  }, []);

  const handleUnblockTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          blockerReason: null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg("✓ Task unblocked and status updated to IN_PROGRESS in MySQL!");
        fetchBlockedTasks();
      } else {
        alert(json.error || "Failed to unblock task");
      }
    } catch (err) {
      alert("Network error unblocking task");
    } finally {
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {toastMsg && (
        <div className="p-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Admin Risk Desk • Blocker Resolution Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Blocked Tasks & Dependency Bottlenecks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review blocker reasons submitted by workforce engineers, assign resolution owners, and resume work execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/tasks" className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md">
            Organization Task Center →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading blocked tasks...</div>
      ) : blockedTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="text-3xl">🎉</div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Zero Blocked Tasks</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All enterprise tasks are currently running smoothly without reported dependency bottlenecks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {blockedTasks.map((t) => {
              const daysBlocked = Math.max(1, Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-950 shadow-xs space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                        {daysBlocked} Day{daysBlocked > 1 ? "s" : ""} Blocked
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Priority: {t.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t.title}</h3>

                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-300 font-medium">
                      ⚠️ <strong className="font-bold">Blocker Reason:</strong> {t.blockerReason || "No detailed blocker reason provided."}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Assigned to: <strong className="text-slate-900 dark:text-white">{t.assignedToUser?.name}</strong> ({t.assignedToUser?.employeeId})</span>
                      <span>Project: <strong className="text-slate-900 dark:text-white">{t.project?.name || "Internal"}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleUnblockTask(t.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
                    >
                      ✓ Resolve Blocker & Resume Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
