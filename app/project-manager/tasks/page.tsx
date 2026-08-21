"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectManagerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/project-manager/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.adminMainTasks) {
          setTasks(json.adminMainTasks);
        }
      })
      .catch((err) => console.warn("Failed to load PM tasks:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesQuery =
      t.title?.toLowerCase().includes(q) ||
      t.projectTitle?.toLowerCase().includes(q) ||
      t.id?.toLowerCase().includes(q);
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchesQuery && matchesPriority;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              Admin Delegations
            </span>
            <span className="text-xs font-bold text-slate-500">• {tasks.length} Assigned Main Tasks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tasks Assigned by Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            High-level project deliverables assigned directly to you by Company Administration. Break down these tasks into work sections for your Team Leaders.
          </p>
        </div>

        <Link
          href="/project-manager/assign-work"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
        >
          + Divide Task into Sections →
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task by title, project, or ID..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                priorityFilter === p
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            Loading Admin tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl">
            No main tasks found matching your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
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
                    👑 Designated Team Leader: <strong>{task.projectTeamLeader.name}</strong> ({task.projectTeamLeader.employeeId})
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
    </div>
  );
}
