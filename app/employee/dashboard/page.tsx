"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeePersonalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUserContext();
    setUser(u);

    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTasks(json.tasks || []);
          setSummary(json.summary);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "ASSIGNED" || t.status === "BLOCKED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Employee Personal Workspace • Today's Priorities
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            What Do I Need To Work On Today?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <strong>{user?.name || "Employee"}</strong> ({user?.employeeId || "EMP"}). Update your progress, log shift hours, and report blockers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employee/tasks" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
            My Task Workboard →
          </Link>
          <Link href="/employee/work" className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border transition">
            + Submit EOD Report
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* Today's Active Tasks */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Today's Priority Tasks</h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading tasks...</div>
        ) : todayTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="text-2xl">🎉</div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">No Active Assigned Tasks</h3>
            <p className="text-xs text-slate-500">You are all caught up for today!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayTasks.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                    t.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {t.priority}
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-600">{t.status.replace("_", " ")}</span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t.title}</h3>
                {t.description && <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>}

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Completion</span>
                    <span className="text-blue-600 font-black">{t.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-mono">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                  <Link href="/employee/tasks" className="text-xs font-bold text-blue-600 hover:underline">
                    Update Progress →
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
