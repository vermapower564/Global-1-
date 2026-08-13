"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredWorkUpdates } from "@/utils/workUpdateStore";
import { getStoredLeaveRequests } from "@/utils/leaveStore";
import ProfileAlertBanner from "@/components/ProfileAlertBanner";

export default function Dashboard() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<any>(null);

  // Staff Tasks State
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review Phase 1 Foundation & Employee Directory", completed: true },
    { id: 2, text: "Approve pending Q3 leave applications & payroll", completed: true },
    { id: 3, text: "Inspect EOD work updates & rate 1-5 stars", completed: false },
    { id: 4, text: "Publish weekly digital marketing & ROAS report", completed: false },
    { id: 5, text: "Upload verified ID documents to master profile", completed: false },
  ]);

  const [newTaskText, setNewTaskText] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const eodPending = getStoredWorkUpdates().filter((u) => u.status === "PENDING").length;
    const leavePending = getStoredLeaveRequests().filter((l) => l.status === "Pending").length;
    setPendingCount(eodPending + leavePending);

    // Get current user context
    if (typeof window !== "undefined") {
      const { getCurrentUserContext } = require("@/utils/userContextStore");
      setUserContext(getCurrentUserContext());
    }

    // Fetch active attendance record from MySQL server API
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
      .catch((err) => console.warn("Attendance fetch error:", err));
  }, []);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText.trim(), completed: false },
    ]);
    setNewTaskText("");
  };

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

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingTaskCount = tasks.length - completedCount;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Profile Incomplete Warning Alert Banner */}
      <ProfileAlertBanner />

      {/* 💜 Unique Header Banner - Royal Indigo & Midnight Purple Theme */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-indigo-800/40 text-indigo-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
            Executive Command & Analytics Engine
          </span>
          <h1 className="text-2xl font-black text-indigo-100 tracking-tight mt-1">
            Welcome Back, {userContext?.name || "Employee"}
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1">
            Track your personal work completion percentage, active pending tasks, attendance hours, and approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/daily-work/approvals" className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md border border-purple-400 transition">
            ★ Pending Approvals ({pendingCount})
          </Link>
          <Link href="/daily-work" className="bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-indigo-800/40 transition">
            📝 EOD Work Log
          </Link>
        </div>
      </div>

      {/* Staff Work % Progress & Task Completion Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-purple-600 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">Personal Work Done %</span>
            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">{completionPercentage}% Completed</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{completionPercentage}%</p>
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">Completed Work Tasks</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{completedCount} Tasks</p>
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">Successfully Signed Off</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-amber-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">Tasks Still Pending</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{pendingTaskCount} Tasks</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Action Required Today</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-indigo-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">System Approvals</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</p>
          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">EOD Updates + Leave Requests</span>
        </div>
      </div>

      {/* Main Grid: Work Progress Checklist & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Interactive Work Tracker & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Staff Work Checklist with Live % Completion */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-indigo-900/40 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-indigo-900/30 pb-3 gap-2">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">My Daily Work & Task Tracker</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Check off items as you complete them to automatically update your work % ratio.</p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-950/10 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-900/30">
                <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                  {completedCount} of {tasks.length} ({completionPercentage}%)
                </span>
              </div>
            </div>

            {/* Quick Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="+ Add new work task for today..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-indigo-900/60 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none font-semibold"
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition">
                Add Task
              </button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    task.completed
                      ? "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 line-through"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-indigo-900/40 hover:border-purple-500 text-slate-900 dark:text-white font-semibold shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs">{task.text}</span>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg ${task.completed ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300" : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"}`}>
                    {task.completed ? "Completed ✓" : "Pending ⏳"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Check-In / Check-Out Widget */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-950 to-purple-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-900/60 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Attendance Punch Clock</span>
              <h3 className="text-xl font-black text-white">
                {clockedIn ? `Checked In at ${clockTime}` : "Not Checked In Today"}
              </h3>
              <p className="text-xs text-indigo-200/80">
                {clockedIn ? "Your shift hours are actively being logged." : "Click below to punch in for today's work shift."}
              </p>
            </div>

            <button
              onClick={handleClockToggle}
              className={`px-6 py-3 rounded-xl font-extrabold text-xs transition shadow-lg shrink-0 border ${
                clockedIn
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-400"
                  : "bg-purple-600 hover:bg-purple-700 text-white border-purple-400"
              }`}
            >
              {clockedIn ? "🛑 Punch Out / End Shift" : "⏱️ Punch In / Start Shift"}
            </button>
          </div>
        </div>

        {/* Pending Approvals & Live Notifications Panel */}
        <div className="space-y-6">
          {/* Pending Approvals Desk Widget */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-indigo-900/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-indigo-900/30 pb-3">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Pending Approvals Desk</h2>
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-extrabold text-xs px-2.5 py-1 rounded-lg">{pendingCount} Pending</span>
            </div>

            <div className="space-y-3 text-xs">
              <Link
                href="/daily-work/approvals"
                className="block p-3 rounded-xl border border-slate-200 dark:border-indigo-900/40 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-950/20 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">EOD Work Updates</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Review Desk →</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Inspect submissions, ratings, and Git commits</p>
              </Link>

              <Link
                href="/hr"
                className="block p-3 rounded-xl border border-slate-200 dark:border-indigo-900/40 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-950/20 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">HR Leave Applications</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">HR Desk →</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Review formal leave letters and email dispatches</p>
              </Link>
            </div>
          </div>

          {/* Live Notifications Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-indigo-900/40 shadow-xs space-y-4">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-indigo-900/30 pb-3">
              Live System Notifications
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-950/10 dark:bg-indigo-950/40 border border-indigo-900/30 rounded-xl text-indigo-900 dark:text-indigo-200 font-semibold">
                🔔 <span className="font-bold">System Notice:</span> Staff Work Completion Tracker active.
              </div>
              <div className="p-3 bg-purple-950/10 dark:bg-purple-950/40 border border-purple-900/30 rounded-xl text-purple-900 dark:text-purple-200 font-semibold">
                ✓ <span className="font-bold">HR Notice:</span> 4 Leave applications dispatched via automated email.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}