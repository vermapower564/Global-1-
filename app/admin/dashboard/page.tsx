"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [workforceCount, setWorkforceCount] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [blockedTasks, setBlockedTasks] = useState<any[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // 1. Fetch server session user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});

    // 2. Fetch workforce directory
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setWorkforceCount(json.total || 0);
          setEmployees(json.data || []);
        }
      })
      .catch((e) => console.warn("Failed to load employees metric:", e));

    // 3. Fetch tasks intelligence & blockers
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTaskSummary(json.summary || null);
          const tasks = json.tasks || [];
          setOverdueTasks(tasks.filter((t: any) => t.isOverdue));
          setBlockedTasks(tasks.filter((t: any) => t.status === "BLOCKED"));
        }
      })
      .catch((e) => console.warn("Failed to load tasks metric:", e));

    // 4. Fetch projects metrics
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProjectsCount(json.total || json.projects?.length || 0);
        }
      })
      .catch((e) => console.warn("Failed to load projects metric:", e))
      .finally(() => setLoading(false));
  }, []);

  const overloadedEmployees = employees.filter((e) => e.metrics?.workloadLevel === "OVERLOADED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Admin Command Center • Enterprise Risk & Analytics
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Welcome Back, {user?.name || "Administrator"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time workforce headcount, task completion ratios, blocked items, project health, and system audit logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/employees" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
            Workforce Directory →
          </Link>
          <Link href="/admin/tasks" className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-800 transition">
            Organization Tasks →
          </Link>
        </div>
      </div>

      {/* ⚠️ INTELLIGENT ATTENTION REQUIRED ALERTS */}
      {(overdueTasks.length > 0 || blockedTasks.length > 0 || overloadedEmployees.length > 0) && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              ⚠️ Attention Required (Risk & Bottleneck Detector)
            </span>
            <span className="text-[11px] text-amber-700 font-bold">Action Needed Today</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {overdueTasks.length > 0 && (
              <Link href="/admin/tasks" className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-1 block hover:border-amber-500">
                <span className="font-black text-amber-800 dark:text-amber-300">{overdueTasks.length} Tasks Overdue</span>
                <p className="text-[11px] text-slate-500 line-clamp-1">{overdueTasks[0]?.title}</p>
              </Link>
            )}

            {blockedTasks.length > 0 && (
              <Link href="/admin/blockers" className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 space-y-1 block hover:border-rose-500">
                <span className="font-black text-rose-700 dark:text-rose-400">{blockedTasks.length} Tasks Blocked</span>
                <p className="text-[11px] text-slate-500 line-clamp-1">{blockedTasks[0]?.title}</p>
              </Link>
            )}

            {overloadedEmployees.length > 0 && (
              <Link href="/admin/reports" className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-1 block hover:border-amber-500">
                <span className="font-black text-slate-900 dark:text-white">{overloadedEmployees.length} Staff Overloaded</span>
                <p className="text-[11px] text-slate-500 line-clamp-1">{overloadedEmployees[0]?.name} (High Active Tasks)</p>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Workforce</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{workforceCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">In Progress Tasks</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{taskSummary?.inProgress || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Completed Tasks</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{taskSummary?.completed || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Blocked Items</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{blockedTasks.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Active Projects</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{projectsCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completion %</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{taskSummary?.completionRate || 0}%</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Workforce Summary Directory */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Workforce Task Distribution</h2>
              <Link href="/admin/employees" className="text-xs font-bold text-blue-600 hover:underline">
                View All Employees →
              </Link>
            </div>

            <div className="space-y-3">
              {employees.slice(0, 5).map((emp) => {
                const m = emp.metrics || { activeTasks: 0, completedTasks: 0, progressRate: 100, workloadLevel: "NORMAL" };

                return (
                  <div key={emp.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center">
                        {emp.name ? emp.name.charAt(0) : "E"}
                      </div>
                      <div>
                        <Link href={`/admin/employees/${emp.id}`} className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600">
                          {emp.name}
                        </Link>
                        <p className="text-[10px] text-slate-500">{emp.employeeId} • {emp.role || "Developer"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-blue-600">{m.activeTasks} Active</span>
                      <span className="font-bold text-emerald-600">{m.completedTasks} Done</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        m.workloadLevel === "OVERLOADED" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {m.workloadLevel}
                      </span>
                    </div>
                  </div>
                );
              })}

              {employees.length === 0 && !loading && (
                <p className="text-center text-slate-400 italic text-xs py-4">No employee records found in MySQL.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Admin Navigation Shortcuts */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b pb-3">Admin Navigation Desk</h2>

            <div className="space-y-2.5 text-xs font-bold">
              <Link href="/admin/employees" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                👥 Workforce Directory & 360° Profiles →
              </Link>
              <Link href="/admin/tasks" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                📝 Organization Task Kanban →
              </Link>
              <Link href="/admin/projects" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                📂 Project Health & Risk Score Engine →
              </Link>
              <Link href="/admin/blockers" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                🚨 Blocker Resolution Center →
              </Link>
              <Link href="/admin/attendance" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                📅 Workforce Attendance Ledger →
              </Link>
              <Link href="/admin/work" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                ⭐ Daily Work EOD Review Desk →
              </Link>
              <Link href="/admin/reports" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                📊 Executive Workload Heatmap →
              </Link>
              <Link href="/admin/audit-logs" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-900 dark:text-white transition">
                📜 Security Audit Logs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
