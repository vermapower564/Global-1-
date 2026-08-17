"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/utils/userContextStore";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  blockerReason?: string;
  isOverdue?: boolean;
  overdueDays?: number;
}

export default function EmployeeSelfWorkspacePage() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState("IN_PROGRESS");
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [blockerReason, setBlockerReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks);
        setSummary(json.summary);
      }
    } catch (err: any) {
      console.warn("Failed to fetch my tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUserContext();
    setUser(currentUser);
    fetchMyTasks();
  }, []);

  const handleUpdateTaskProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (updateStatus === "BLOCKED" && !blockerReason.trim()) {
      alert("Please provide a reason why this task is blocked.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          progress: updateProgress,
          blockerReason: updateStatus === "BLOCKED" ? blockerReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Task progress & status saved to MySQL!`);
        setSelectedTask(null);
        fetchMyTasks();
      } else {
        alert(json.error || "Failed to update task");
      }
    } catch (err: any) {
      alert("Network error updating task");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold text-xs space-y-2">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div>Loading My Task Workspace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Employee Workspace • My Workboard
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            What Do I Need To Work On Today?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <strong>{user?.name || "Employee"}</strong> ({user?.employeeId || "EMP"}). Update your active task progress and log blockers in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/daily-work" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
            + Submit Daily EOD Update
          </Link>
        </div>
      </div>

      {/* Work KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">My Assigned Tasks</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{summary?.total || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.inProgress || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{summary?.completed || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{summary?.blocked || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Overdue</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{summary?.overdue || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completion %</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.completionRate || 0}%</p>
        </div>
      </div>

      {/* Task List / Workboard */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Active Assigned Tasks
        </h2>

        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="text-2xl">🎉</div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">No Active Assigned Tasks</h3>
            <p className="text-xs text-slate-500">You are all caught up! Check back later when new tasks are assigned to your workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                      task.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      task.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                      task.status === "BLOCKED" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{task.title}</h3>
                  {task.description && <p className="text-xs text-slate-500 line-clamp-3">{task.description}</p>}

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Progress</span>
                      <span className="text-blue-600">{task.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </div>

                  {task.status === "BLOCKED" && task.blockerReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                      ⚠️ Blocker: {task.blockerReason}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setUpdateStatus(task.status);
                      setUpdateProgress(task.progress);
                      setBlockerReason(task.blockerReason || "");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs"
                  >
                    Update Progress →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Self Update Progress & Blocker */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm">Update Task Progress</h3>
                <p className="text-xs text-blue-600 font-semibold">{selectedTask.title}</p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateTaskProgress} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 font-bold text-slate-900 dark:text-white"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Working)</option>
                  <option value="BLOCKED">BLOCKED (Stuck)</option>
                  <option value="IN_REVIEW">IN_REVIEW (Ready for Admin Review)</option>
                  <option value="COMPLETED">COMPLETED (Done)</option>
                </select>
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Current Completion Percentage</span>
                  <span className="text-blue-600 font-extrabold text-sm">{updateProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={updateProgress}
                  onChange={(e) => setUpdateProgress(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {updateStatus === "BLOCKED" && (
                <div>
                  <label className="block font-bold text-rose-600 mb-1">Blocker / Dependency Reason *</label>
                  <textarea
                    rows={3}
                    required
                    value={blockerReason}
                    onChange={(e) => setBlockerReason(e.target.value)}
                    placeholder="Describe what is blocking your progress (e.g. waiting for API credentials or assets)..."
                    className="w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-rose-900 font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-4 py-2 rounded-xl border text-slate-600 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-extrabold px-5 py-2 rounded-xl shadow-md">
                  {isSubmitting ? "Saving to MySQL..." : "Save Progress to MySQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
