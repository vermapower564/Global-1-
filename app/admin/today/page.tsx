"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IconClipboardList,
  IconUsers,
  IconCheck,
  IconAlertTriangle,
  IconSearch,
  IconCalendar,
  IconTrendingUp,
} from "@/components/Icons";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

function AdminTodayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState<any>({
    totalEmployees: 0,
    presentToday: 0,
    currentlyWorking: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    totalInProgress: 0,
    totalTasks: 0,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const fetchTodayData = async (filterStatus = statusFilter) => {
    try {
      setLoading(true);
      const qp = new URLSearchParams();
      if (filterStatus && filterStatus !== "ALL") {
        qp.set("status", filterStatus);
      }
      if (searchQuery.trim()) {
        qp.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/admin/today?${qp.toString()}`);
      const json = await res.json();

      if (json.success) {
        setSummary(json.summary || {});
        setTasks(json.tasks || []);
      }
    } catch (err) {
      console.warn("Failed to fetch today's employee work:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const s = searchParams.get("status") || "ALL";
    setStatusFilter(s);
    fetchTodayData(s);
  }, [searchParams]);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    const qp = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      qp.delete("status");
    } else {
      qp.set("status", status);
    }
    router.push(`/admin/today?${qp.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTodayData(statusFilter);
  };

  const handleQuickStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          progress: newStatus === "COMPLETED" ? 100 : newStatus === "IN_PROGRESS" ? 50 : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Task status updated to ${newStatus}`);
        fetchTodayData(statusFilter);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const inProgressCount = summary.inProgress || 0;
  const completedCount = summary.completed || 0;
  const blockedCount = summary.blocked || 0;
  const presentCount = summary.presentToday || 0;
  const workingCount = summary.currentlyWorking || 0;
  const totalEmployees = summary.totalEmployees || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-bold text-xs p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 👑 Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Live Operations & Execution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Today's Employee Work & Real-Time Tasks
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track active employee tasks, real-time progression, blockers, and deliverables updated today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchTodayData(statusFilter)}
            className="bg-gray-100 hover:bg-gray-200 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>🔄 Refresh Live</span>
          </button>
          <Link
            href="/admin/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>Admin Dashboard →</span>
          </Link>
        </div>
      </div>

      {/* 📊 SUMMARY CARDS - EXACT SPECIFICATION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Employees */}
        <div className="p-4.5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
            Total Employees
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-black">{totalEmployees}</span>
            <span className="text-[11px] font-bold text-gray-400">Team</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">Registered workforce</p>
        </div>

        {/* 2. Present Today */}
        <div className="p-4.5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
            Present Today
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{presentCount}</span>
            <span className="text-[11px] font-bold text-blue-600">Punched In</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">Active attendance</p>
        </div>

        {/* 3. Currently Working */}
        <div className="p-4.5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
            Currently Working
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{workingCount}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">On shift right now</p>
        </div>

        {/* 4. IN PROGRESS (Prominent & Clickable Filter) */}
        <button
          type="button"
          onClick={() => handleFilterChange("IN_PROGRESS")}
          className={`p-4.5 rounded-2xl border text-left transition shadow-2xs cursor-pointer group ${
            statusFilter === "IN_PROGRESS"
              ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20"
              : "border-blue-200 bg-blue-50/30 hover:border-blue-500 hover:bg-blue-50/50"
          }`}
        >
          <span className="text-[10px] font-black uppercase text-blue-700 block tracking-wider">
            [ IN PROGRESS {inProgressCount} ]
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-700">{inProgressCount}</span>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
              Filter →
            </span>
          </div>
          <p className="text-[10px] text-blue-600 mt-1 font-medium group-hover:underline">
            Click to view in progress
          </p>
        </button>

        {/* 5. Completed */}
        <button
          type="button"
          onClick={() => handleFilterChange("COMPLETED")}
          className={`p-4.5 rounded-2xl border text-left transition shadow-2xs cursor-pointer group ${
            statusFilter === "COMPLETED"
              ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20"
              : "border-gray-200 bg-white hover:border-emerald-500"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
            Completed
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{completedCount}</span>
            <span className="text-[10px] font-bold text-emerald-600">Done</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium group-hover:text-emerald-600">
            Delivered today
          </p>
        </button>

        {/* 6. Blocked */}
        <button
          type="button"
          onClick={() => handleFilterChange("BLOCKED")}
          className={`p-4.5 rounded-2xl border text-left transition shadow-2xs cursor-pointer group ${
            statusFilter === "BLOCKED"
              ? "border-rose-600 bg-rose-50/70 ring-2 ring-rose-600/20"
              : "border-gray-200 bg-white hover:border-rose-500"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-rose-600 block tracking-wider">
            Blocked
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{blockedCount}</span>
            {blockedCount > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                Action
              </span>
            )}
          </div>
          <p className="text-[10px] text-rose-500 mt-1 font-medium group-hover:underline">
            Requires resolution
          </p>
        </button>
      </div>

      {/* 🔍 Search & Interactive Tab Navigation */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs with Dynamic Live Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFilterChange("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "ALL"
                  ? "bg-black text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>ALL WORK</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange("IN_PROGRESS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              }`}
            >
              <span>IN PROGRESS</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  statusFilter === "IN_PROGRESS" ? "bg-white text-blue-700" : "bg-blue-600 text-white"
                }`}
              >
                {inProgressCount}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange("COMPLETED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "COMPLETED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <span>COMPLETED</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  statusFilter === "COMPLETED" ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"
                }`}
              >
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange("BLOCKED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "BLOCKED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              <span>BLOCKED</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  statusFilter === "BLOCKED" ? "bg-white text-rose-700" : "bg-rose-600 text-white"
                }`}
              >
                {blockedCount}
              </span>
            </button>
          </div>

          {/* Live Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xs w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search today's tasks or employees..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold text-black rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 transition"
            />
          </form>
        </div>

        {/* Current Active Filter Indicator */}
        {statusFilter === "IN_PROGRESS" && (
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs">
            <span className="font-bold text-blue-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              Showing only today's <strong>IN PROGRESS ({inProgressCount})</strong> employee work items
            </span>
            <button
              onClick={() => handleFilterChange("ALL")}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Clear Filter (Show All)
            </button>
          </div>
        )}
      </div>

      {/* 📋 LIVE TODAY'S WORK ITEMS TABLE & LIST */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-black text-black text-base tracking-tight flex items-center gap-2">
              <span>📋</span> Employee Real-Time Deliverables
            </h2>
            <p className="text-xs text-gray-500">
              Live progression and milestone statuses for today ({new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
            </p>
          </div>
          <span className="text-xs font-extrabold text-gray-500">
            {tasks.length} {tasks.length === 1 ? "record" : "records"} found
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="h-9 w-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-gray-600">Loading today's live employee work...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-4xl">📝</div>
            <h3 className="text-sm font-black text-black">No {statusFilter !== "ALL" ? statusFilter : ""} tasks found for today</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {statusFilter === "IN_PROGRESS"
                ? "There are currently 0 work items marked as IN PROGRESS for today."
                : "No employee tasks match the selected criteria for today."}
            </p>
            {statusFilter !== "ALL" && (
              <button
                onClick={() => handleFilterChange("ALL")}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View all tasks
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-6">Work Item / Task</th>
                  <th className="py-3.5 px-4">Assigned Member</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status & Progress</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {tasks.map((task) => {
                  const isInProgress = task.status === "IN_PROGRESS";
                  const isCompleted = task.status === "COMPLETED";
                  const isBlocked = task.status === "BLOCKED";

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-blue-50/40 transition ${
                        isInProgress ? "bg-blue-50/15" : isBlocked ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Title & Description */}
                      <td className="py-4 px-6 max-w-xs">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="font-black text-black hover:text-blue-600 text-left block truncate max-w-xs cursor-pointer text-sm"
                        >
                          {task.title}
                        </button>
                        {task.description && (
                          <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                        {task.blockerReason && (
                          <p className="text-rose-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                            <span>⚠️ Blocker:</span> {task.blockerReason}
                          </p>
                        )}
                      </td>

                      {/* Assigned User (Clickable link to full Employee Profile) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Link
                          href={`/admin/employees/${encodeURIComponent(task.assignedToUser?.employeeId || task.assignedToUser?.id || "EMP001")}`}
                          className="flex items-center gap-2 group cursor-pointer hover:bg-blue-50/80 p-1.5 rounded-xl transition border border-transparent hover:border-blue-200 inline-flex"
                          title={`View ${task.assignedToUser?.name || "Employee"} 360° Profile`}
                        >
                          <div className="h-8 w-8 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {task.assignedToUser?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="font-black text-black group-hover:text-blue-600 transition block text-xs underline-offset-2 group-hover:underline">
                              {task.assignedToUser?.name || "Unassigned"}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition">
                              {task.assignedToUser?.employeeId || "EMP001"}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Project */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                          {task.project?.projectTitle || "OMS Core"}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            task.priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : task.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {task.priority || "MEDIUM"}
                        </span>
                      </td>

                      {/* Status & Progress Bar */}
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isInProgress
                                  ? "bg-blue-100 text-blue-800 font-black border border-blue-300 animate-pulse"
                                  : isCompleted
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : isBlocked
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {task.status || "ASSIGNED"}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-gray-600">
                              {task.progress || 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted
                                  ? "bg-emerald-600"
                                  : isInProgress
                                  ? "bg-blue-600"
                                  : isBlocked
                                  ? "bg-rose-500"
                                  : "bg-gray-400"
                              }`}
                              style={{ width: `${task.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isInProgress && !isCompleted && (
                            <button
                              onClick={() => handleQuickStatusUpdate(task.id, "IN_PROGRESS")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer border border-blue-200"
                              title="Mark as In Progress"
                            >
                              ▶ Start
                            </button>
                          )}
                          {!isCompleted && (
                            <button
                              onClick={() => handleQuickStatusUpdate(task.id, "COMPLETED")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer border border-emerald-200"
                              title="Mark Completed"
                            >
                              ✓ Done
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer border border-gray-300 shadow-2xs"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          taskId={selectedTask.id}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchTodayData(statusFilter);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

export default function AdminTodayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
          <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xl space-y-3 max-w-sm w-full text-center">
            <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-gray-700">Loading Today's Live Work Portal...</p>
          </div>
        </div>
      }
    >
      <AdminTodayContent />
    </Suspense>
  );
}
