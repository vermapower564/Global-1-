"use client";

import React, { useState, useEffect } from "react";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks || []);
      }
    } catch (err) {
      console.warn("Failed to fetch my tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (priorityFilter === "ALL") return matchesSearch;
    return matchesSearch && t.priority === priorityFilter;
  });

  const kanbanColumns = [
    { key: "BACKLOG", title: "Backlog", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300" },
    { key: "ASSIGNED", title: "To Do", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200" },
    { key: "IN_PROGRESS", title: "In Progress", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200" },
    { key: "IN_REVIEW", title: "In Review", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200" },
    { key: "COMPLETED", title: "Completed", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Task Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            My Tasks & Kanban Workboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View active assigned tasks, update progress, log completion status, and record development comments.
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Priority Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((prio) => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                priorityFilter === prio
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => {
              if (col.key === "BACKLOG") return t.status === "BACKLOG";
              if (col.key === "ASSIGNED") return t.status === "ASSIGNED" || t.status === "PENDING";
              if (col.key === "IN_PROGRESS") return t.status === "IN_PROGRESS";
              if (col.key === "IN_REVIEW") return t.status === "IN_REVIEW";
              if (col.key === "COMPLETED") return t.status === "COMPLETED";
              return false;
            });

            return (
              <div
                key={col.key}
                className="bg-slate-50/70 dark:bg-slate-950/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-3 min-w-[240px]"
              >
                <div className={`p-2.5 rounded-2xl border text-xs font-black uppercase flex justify-between items-center ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="bg-white/90 dark:bg-slate-900 px-2 py-0.5 rounded-lg text-[10px] font-black">{colTasks.length}</span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 cursor-pointer space-y-2.5 transition group"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          t.priority === "CRITICAL" || t.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {t.priority}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Soon"}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition">
                        {t.title}
                      </h4>

                      {t.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Progress</span>
                          <span className="text-blue-600 font-black">{t.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs italic border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No tasks in {col.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <TaskDetailDrawer
          taskId={selectedTask.id}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchMyTasks();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
