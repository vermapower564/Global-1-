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
  assignedToUser?: { id: string; name: string; employeeId: string; email?: string; role?: string };
  project?: { id: string; projectTitle: string };
}

interface EmployeeOption {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  email: string;
}

interface ProjectOption {
  id: string;
  projectTitle: string;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [viewMode, setViewMode] = useState<"BOARD" | "TABLE">("TABLE");

  // Create Task Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");
  const [createErrorMsg, setCreateErrorMsg] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("8");

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (priorityFilter !== "ALL") queryParams.set("priority", priorityFilter);
      if (dateFilter) queryParams.set("date", dateFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

      const res = await fetch(`/api/tasks?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks || []);
        setSummary(json.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/projects"),
      ]);
      const empJson = await empRes.json();
      const projJson = await projRes.json();

      if (empJson.success && empJson.data) {
        setEmployees(
          empJson.data.map((e: any) => ({
            id: e.id,
            name: e.name,
            employeeId: e.employeeId,
            role: e.role,
            email: e.email,
          }))
        );
      }
      if (projJson.success && projJson.data) {
        setProjects(
          projJson.data.map((p: any) => ({
            id: p.id,
            projectTitle: p.projectTitle || p.name || "General Project",
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to fetch form options:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, dateFilter]);

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrorMsg("");
    setCreateSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assignedToUserId,
          projectId: projectId || undefined,
          priority,
          dueDate: dueDate || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          estimatedHours: parseFloat(estimatedHours) || 8,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreateSuccessMsg("✓ Task assigned successfully!");
        setTitle("");
        setDescription("");
        setAssignedToUserId("");
        setProjectId("");
        setPriority("MEDIUM");
        setDueDate("");
        setEstimatedHours("8");
        fetchTasks();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCreateSuccessMsg("");
        }, 1200);
      } else {
        setCreateErrorMsg(json.error || "Failed to create task");
      }
    } catch (err) {
      setCreateErrorMsg("Network error creating task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const kanbanColumns = [
    {
      key: "ASSIGNED",
      title: "📋 To Do / Assigned",
      filterFn: (t: TaskItem) => t.status === "ASSIGNED" || t.status === "PENDING" || t.status === "BACKLOG",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      key: "IN_PROGRESS",
      title: "⚡ In Progress",
      filterFn: (t: TaskItem) => t.status === "IN_PROGRESS",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      key: "IN_REVIEW",
      title: "🔍 In Review / Blocked",
      filterFn: (t: TaskItem) => t.status === "IN_REVIEW" || t.status === "BLOCKED",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      key: "COMPLETED",
      title: "✅ Completed",
      filterFn: (t: TaskItem) => t.status === "COMPLETED",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Task Center
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ⚡ TiDB Synced
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Organization Task & Delivery Center
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Assign tasks, filter by specific calendar dates to check completed vs pending work, and monitor live progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>Assign New Task</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TABLE"
                  ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>📑</span> Table View
            </button>
            <button
              onClick={() => setViewMode("BOARD")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "BOARD"
                  ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>📊</span> Visual Board
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-gray-500">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-black font-mono">{summary?.total || tasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600 font-mono">{summary?.inProgress || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600 font-mono">{summary?.completed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-purple-600">In Review</p>
          <p className="mt-1 text-2xl font-black text-purple-600 font-mono">{summary?.inReview || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600 font-mono">{summary?.blocked || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-amber-600">To Do</p>
          <p className="mt-1 text-2xl font-black text-amber-600 font-mono">{summary?.pending || 0}</p>
        </div>
      </div>

      {/* 3. Comprehensive Filter & Date Explorer Controls */}
      <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 flex gap-2">
            <input
              type="text"
              placeholder="Search by title, owner, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-xs text-black focus:border-blue-600 focus:outline-none font-medium"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Status & Priority Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ASSIGNED">To Do (ASSIGNED)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>
        </div>

        {/* 📅 Dedicated Date Explorer Strip */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/70 p-3.5 rounded-2xl border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-gray-700 flex items-center gap-1">
              <span>📅 Filter by Date:</span>
            </span>

            <button
              onClick={() => setDateFilter("")}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                dateFilter === ""
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Dates
            </button>

            <button
              onClick={() => setDateFilter(todayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                dateFilter === todayStr
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              🌟 Today
            </button>

            <button
              onClick={() => setDateFilter(yesterdayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                dateFilter === yesterdayStr
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              📅 Yesterday
            </button>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-gray-500 font-bold">Pick Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-300 px-3 py-1 rounded-xl text-xs font-bold text-black focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Date Breakdown Insight Pill */}
          {dateFilter && (
            <div className="text-xs font-bold bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 text-gray-700 shadow-2xs flex items-center gap-3">
              <span>Selected Date: <strong className="text-blue-600 font-mono">{dateFilter}</strong></span>
              <span className="text-emerald-700">✓ {summary?.completed || 0} Completed</span>
              <span className="text-amber-700">⚡ {summary?.inProgress || 0} In Progress</span>
              <span className="text-blue-700">📋 {summary?.pending || 0} Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Tasks View: Table or Visual Board */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 font-bold text-xs bg-white rounded-3xl border border-gray-200">
          Loading task records from TiDB Cloud...
        </div>
      ) : viewMode === "BOARD" ? (
        /* VISUAL BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter(col.filterFn);

            return (
              <div
                key={col.key}
                className="bg-gray-50/70 p-4 rounded-3xl border border-gray-200 flex flex-col space-y-3"
              >
                <div className={`p-3 rounded-2xl border text-xs font-black flex justify-between items-center ${col.color}`}>
                  <span className="text-sm font-black">{col.title}</span>
                  <span className="bg-white px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-500 cursor-pointer space-y-3 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            t.priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : t.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {t.priority}
                        </span>

                        <span className="text-[11px] font-mono text-gray-500 font-bold">
                          Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Soon"}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-black leading-snug">
                        {t.title}
                      </h4>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[9px]">
                          {(t.assignedToUser?.name || "U")[0]}
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {t.assignedToUser?.name || "Unassigned"}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-500">
                          <span>Progress</span>
                          <span className="text-blue-600 font-black font-mono">{t.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.progress === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                            style={{ width: `${t.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-2xl bg-white">
                      No tasks in this column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SIMPLE TABLE VIEW */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                  <th className="py-4 px-5">Task Details</th>
                  <th className="py-4 px-5">Assigned Employee</th>
                  <th className="py-4 px-5">Project</th>
                  <th className="py-4 px-5">Priority</th>
                  <th className="py-4 px-5">Due Date</th>
                  <th className="py-4 px-5">Progress</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-blue-50/40 transition cursor-pointer text-black"
                  >
                    <td className="py-4 px-5 max-w-xs">
                      <div className="font-extrabold text-sm text-black">{task.title}</div>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[10px]">
                          {(task.assignedToUser?.name || "U")[0]}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-black">{task.assignedToUser?.name || "Unassigned"}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {task.assignedToUser?.employeeId || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-medium text-gray-700 max-w-[140px] truncate">
                      {task.project?.projectTitle || "OMS Enterprise"}
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          task.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : task.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono text-gray-600 font-bold">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>

                    <td className="py-4 px-5">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                          <span>{task.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${task.progress === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : task.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : task.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-blue-50 text-blue-600 font-black text-xs transition border border-gray-200"
                      >
                        Inspect ↗
                      </button>
                    </td>
                  </tr>
                ))}

                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                      No tasks found for the selected date and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-black">Assign New Task</h3>
                <p className="text-xs text-gray-500">Create a task and assign it to any employee.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                {createSuccessMsg}
              </div>
            )}
            {createErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
                {createErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build client review feedback form"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 font-medium text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Assign to Employee *</label>
                <select
                  required
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId}) — {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Task Description / Objectives</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key deliverables, steps, and acceptance criteria..."
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 font-medium text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                {isSubmitting ? "Assigning Task in TiDB..." : "Confirm & Assign Task"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Detail Drawer */}
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
