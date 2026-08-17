"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

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
  assignedToUser?: { id: string; name: string; employeeId: string };
  project?: { id: string; name: string };
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (priorityFilter !== "ALL") queryParams.set("priority", priorityFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

      const res = await fetch(`/api/tasks?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks);
        setSummary(json.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const kanbanColumns = [
    { key: "PENDING", title: "Pending", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300" },
    { key: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200" },
    { key: "BLOCKED", title: "Blocked", color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200" },
    { key: "IN_REVIEW", title: "In Review", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200" },
    { key: "COMPLETED", title: "Completed", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Control Desk</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Organization Task Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor, assign, inspect, and update task progress across all corporate projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/blockers" className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 transition">
            ⚠️ Blocker Resolution Center ({summary?.blocked || 0})
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{summary?.total || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.inProgress || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{summary?.completed || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{summary?.blocked || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-amber-600">Overdue</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{summary?.overdue || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Completion %</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.completionRate || 0}%</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or assignee..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold"
          />
          <button type="submit" className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl">Search</button>
        </form>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Interactive Kanban Columns */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading task board...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div key={col.key} className="bg-slate-50/70 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-3 min-w-[240px]">
                <div className={`p-2.5 rounded-xl border text-xs font-black uppercase flex justify-between items-center ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded-md text-[10px] font-black">{colTasks.length}</span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-500 cursor-pointer space-y-2.5 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          t.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ""}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">{t.title}</h4>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Progress</span>
                          <span className="text-blue-600">{t.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{t.assignedToUser?.name || "Unassigned"}</span>
                        <span className="font-extrabold text-blue-600 hover:underline">Details →</span>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No tasks in {col.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Drawer Modal */}
      {selectedTask && (
        <TaskDetailDrawer
          taskId={selectedTask.id}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchTasks();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
