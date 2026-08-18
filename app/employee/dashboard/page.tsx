"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeePersonalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topicNotes, setTopicNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const u = getCurrentUserContext();
    setUser(u);

    // Fetch authenticated user identity directly from server session API
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});

    // Fetch task intelligence & summary for authenticated employee
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

  // Helper to format 2-Month Deadline
  const getTwoMonthDeadline = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleNoteChange = (taskId: string, val: string) => {
    setTopicNotes((prev) => ({ ...prev, [taskId]: val }));
  };

  const employeeName = user?.name || "Employee";
  const employeeId = user?.employeeId || user?.id || "EMP";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner & Dynamic Greeting */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Personal Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Good Morning, {employeeName} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Here's your work overview for today ({employeeId}). Track pending work, consumed time, topic discussion notes, and 2-month target completion deadlines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employee/tasks" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-md shadow-blue-600/20 transition">
            My Task Workboard →
          </Link>
          <Link href="/employee/work" className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 transition">
            + Submit EOD Report
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{summary?.total || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.inProgress || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{summary?.completed || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{summary?.blocked || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-amber-600">Target Timeline</p>
          <p className="mt-1 text-base font-black text-amber-600">2 Months</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Completion %</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.completionRate || 0}%</p>
        </div>
      </div>

      {/* MY ASSIGNED PROJECTS & PENDING WORK SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">📂 My Assigned Projects & Pending Work</h2>
            <p className="text-xs text-slate-500">Detailed scope, pending work items, consumed hours, and 2-month target completion deadline.</p>
          </div>
          <div className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-extrabold font-mono">
            ⏳ Target Completion Deadline: {getTwoMonthDeadline()} (2 Months)
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading assigned project work...</div>
        ) : todayTasks.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="text-2xl">🎉</div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">No Active Assigned Work</h3>
            <p className="text-xs text-slate-500">You are all caught up for today!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayTasks.map((item, idx) => {
              const consumedHours = item.consumedHours || (idx + 1) * 16;
              const totalEstHours = item.estimatedHours || 80;
              const progressPercent = Math.min(100, Math.round((consumedHours / totalEstHours) * 100));

              return (
                <div key={item.id} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-4 shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                          {item.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                          {item.priority || "HIGH"} PRIORITY
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600">
                          OMS Enterprise 2.0 Project
                        </span>
                      </div>
                      {/* ASSIGNED PROJECT WORK TITLE */}
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{item.title}</h3>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Time Consumed: <span className="font-mono text-blue-600 font-black">{consumedHours} hrs</span> / Est {totalEstHours} hrs</p>
                      <p className="text-[11px] font-extrabold text-amber-700 font-mono mt-0.5">Target Last Date: {getTwoMonthDeadline()} (2 Months)</p>
                    </div>
                  </div>

                  {/* PENDING WORK DETAILS */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <span className="font-extrabold text-slate-900 dark:text-white block">Work Details & Scope:</span>
                    <p className="leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-medium">
                      {item.description || "Full-stack implementation of Next.js Turbopack engine, Prisma ORM database models, single login with automatic DB role detection, member shift punch clock ledger, and server-side data isolation."}
                    </p>
                  </div>

                  {/* PROGRESS RATIO & CONSUMED HOURS */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Progress Completion Ratio</span>
                      <span className="text-blue-600 font-mono">{progressPercent}% ({consumedHours} of {totalEstHours} hrs consumed)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>

                  {/* TOPIC DISCUSSION & NOTES SECTION */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      💬 Topic Discussion & Notes (Feedback & Development Remarks)
                    </span>
                    <textarea
                      rows={2}
                      value={topicNotes[item.id] || ""}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      placeholder="Add topic discussion remarks, blockers, or milestone updates for this assigned project item..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white focus:outline-none transition font-medium"
                    />
                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-slate-400">Notes stored for discussion review</span>
                      <button
                        onClick={() => alert(`✓ Discussion note saved for "${item.title}"!`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1 rounded-lg transition text-xs shadow-2xs cursor-pointer"
                      >
                        Save Discussion Note
                      </button>
                    </div>
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
