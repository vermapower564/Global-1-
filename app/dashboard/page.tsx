"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/utils/userContextStore";
import ProfileAlertBanner from "@/components/ProfileAlertBanner";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

export default function Dashboard() {
  const [userContext, setUserContext] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Command Center Metrics
  const [workforceCount, setWorkforceCount] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [blockedTasks, setBlockedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance Clock
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUserContext();
    setUserContext(user);
    const roleUpper = (user.role || "").toUpperCase();
    const adminCheck = ADMIN_ROLES.includes(roleUpper) || user.activeMode === "ADMIN_HR";
    setIsAdmin(adminCheck);

    // Fetch real metrics from MySQL
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setWorkforceCount(json.total);
          setEmployees(json.data);
        }
      })
      .catch(() => {});

    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTaskSummary(json.summary);
          const tasks = json.tasks || [];
          setOverdueTasks(tasks.filter((t: any) => t.isOverdue));
          setBlockedTasks(tasks.filter((t: any) => t.status === "BLOCKED"));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch attendance clock
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && json.data.length > 0) {
          const todayStr = new Date().toISOString().split("T")[0];
          const activeToday = json.data.find(
            (rec: any) => rec.date?.startsWith(todayStr) && !rec.checkOutTime
          );
          if (activeToday) {
            setClockedIn(true);
            setClockTime(new Date(activeToday.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleClockToggle = async () => {
    if (!clockedIn) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userContext?.id }),
        });
        const data = await res.json();
        if (data.success) {
          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setClockTime(now);
          setClockedIn(true);
        } else {
          alert(`⚠️ Check-In Notice: ${data.error}`);
        }
      } catch (err) {
        console.warn("Check In API error:", err);
      }
    } else {
      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userContext?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setClockedIn(false);
          alert(`✓ Check-Out Successful! Shift duration: ${data.data?.hoursWorked || 8} hrs logged in MySQL.`);
        } else {
          alert(`⚠️ Check-Out Notice: ${data.error}`);
        }
      } catch (err) {
        console.warn("Check Out API error:", err);
      }
    }
  };

  const overloadedEmployees = employees.filter((e) => e.metrics?.workloadLevel === "OVERLOADED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <ProfileAlertBanner />

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {isAdmin ? "Admin Command Center • Task Intelligence Engine" : "Employee Workspace"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Welcome Back, {userContext?.name || "User"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? "Real-time enterprise workforce analytics, task completion ratios, blocked items, and risk alerts."
              : "Track your active assigned tasks, update progress percentages, and log shift hours."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <Link href="/employees" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
                Workforce Intelligence →
              </Link>
              <Link href="/employees/add" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition">
                + Add Employee
              </Link>
            </>
          ) : (
            <Link href="/employee/workspace" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
              My Task Workboard →
            </Link>
          )}
        </div>
      </div>

      {/* ⚠️ SMART "ATTENTION REQUIRED" ALERTS */}
      {isAdmin && (overdueTasks.length > 0 || blockedTasks.length > 0 || overloadedEmployees.length > 0) && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              ⚠️ Attention Required (Intelligent Risk Detector)
            </span>
            <span className="text-[11px] text-amber-700 font-bold">Action Needed Today</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {overdueTasks.length > 0 && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-1">
                <span className="font-black text-amber-800 dark:text-amber-300">{overdueTasks.length} Tasks Overdue</span>
                <p className="text-[11px] text-slate-500 line-clamp-1">{overdueTasks[0]?.title}</p>
              </div>
            )}

            {blockedTasks.length > 0 && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 space-y-1">
                <span className="font-black text-rose-700 dark:text-rose-400">{blockedTasks.length} Tasks Blocked</span>
                <p className="text-[11px] text-slate-500 line-clamp-1">{blockedTasks[0]?.title}</p>
              </div>
            )}

            {overloadedEmployees.length > 0 && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-1">
                <span className="font-black text-slate-900 dark:text-white">{overloadedEmployees.length} Staff Overloaded</span>
                <p className="text-[11px] text-slate-500 line-clamp-1">{overloadedEmployees[0]?.name} (High Active Tasks)</p>
              </div>
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
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{taskSummary?.inProgress || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{taskSummary?.completed || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Blocked Tasks</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{taskSummary?.blocked || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Overdue Tasks</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{taskSummary?.overdue || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completion %</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{taskSummary?.completionRate || 0}%</p>
        </div>
      </div>

      {/* Main Command & Attendance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Workforce Summary Quick Directory */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Workforce Task Distribution</h2>
              <Link href="/employees" className="text-xs font-bold text-blue-600 hover:underline">
                View Full Workforce Intelligence →
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
                        <p className="text-[10px] text-slate-500">{emp.role || "Developer"}</p>
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
            </div>
          </div>

          {/* Attendance Check-In / Check-Out Widget */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-lg">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Attendance Punch Clock</span>
              <h3 className="text-xl font-black text-white">
                {clockedIn ? `Checked In at ${clockTime}` : "Not Checked In Today"}
              </h3>
              <p className="text-xs text-slate-300">
                {clockedIn ? "Your shift hours are actively being logged." : "Click below to punch in for today's work shift."}
              </p>
            </div>

            <button
              onClick={handleClockToggle}
              className={`px-6 py-3 rounded-xl font-extrabold text-xs transition shadow-lg shrink-0 border ${
                clockedIn
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-400"
              }`}
            >
              {clockedIn ? "🛑 Punch Out / End Shift" : "⏱️ Punch In / Start Shift"}
            </button>
          </div>
        </div>

        {/* Quick Links & Shortcuts Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b pb-3">Quick Navigation Desk</h2>

            <div className="space-y-2.5 text-xs">
              <Link href="/employees" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 font-bold text-slate-900 dark:text-white transition">
                👥 Workforce & Access Control Desk →
              </Link>
              <Link href="/attendance" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 font-bold text-slate-900 dark:text-white transition">
                📅 Attendance Ledger & Shift Clock →
              </Link>
              <Link href="/daily-work/approvals" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 font-bold text-slate-900 dark:text-white transition">
                ⭐ Daily Work EOD Review Desk →
              </Link>
              <Link href="/audit-logs" className="block p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 font-bold text-slate-900 dark:text-white transition">
                📜 System Security Audit Logs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}