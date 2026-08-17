"use client";

import React, { useState, useEffect } from "react";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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

  const kanbanColumns = [
    { key: "PENDING", title: "Pending", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300" },
    { key: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200" },
    { key: "BLOCKED", title: "Blocked", color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200" },
    { key: "IN_REVIEW", title: "In Review", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200" },
    { key: "COMPLETED", title: "Completed", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Employee Task Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">My Task Workboard</h1>
          <p className="text-xs text-slate-500">View active tasks, drag or click to update completion status and log blockers.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading tasks...</div>
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
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        t.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {t.priority}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">{t.title}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Progress</span>
                          <span className="text-blue-600">{t.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                        </div>
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
