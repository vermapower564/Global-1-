"use client";

import React, { useState, useEffect } from "react";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "ASSIGNED" | "COMPLETED">("ALL");

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

  const handleQuickStart = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_TASK", status: "IN_PROGRESS" }),
      });
      const json = await res.json();
      if (json.success) {
        fetchMyTasks();
      }
    } catch (err) {
      console.warn("Error starting task:", err);
    }
  };

  const handleQuickComplete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: 100, status: "COMPLETED" }),
      });
      const json = await res.json();
      if (json.success) {
        fetchMyTasks();
      }
    } catch (err) {
      console.warn("Error completing task:", err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;

    let matchesTab = true;
    if (activeTab === "IN_PROGRESS") matchesTab = t.status === "IN_PROGRESS";
    else if (activeTab === "ASSIGNED") matchesTab = t.status === "ASSIGNED" || t.status === "PENDING" || t.status === "BACKLOG";
    else if (activeTab === "COMPLETED") matchesTab = t.status === "COMPLETED";

    return matchesSearch && matchesPriority && matchesTab;
  });

  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const assignedCount = tasks.filter((t) => t.status === "ASSIGNED" || t.status === "PENDING").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const columns = [
    {
      key: "ASSIGNED",
      title: "📋 To Do",
      subtitle: "New tasks assigned to you",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      filterFn: (t: any) => t.status === "ASSIGNED" || t.status === "PENDING" || t.status === "BACKLOG",
    },
    {
      key: "IN_PROGRESS",
      title: "⚡ In Progress",
      subtitle: "Tasks currently being worked on",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      filterFn: (t: any) => t.status === "IN_PROGRESS",
    },
    {
      key: "IN_REVIEW",
      title: "🔍 In Review",
      subtitle: "Ready for manager review",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      filterFn: (t: any) => t.status === "IN_REVIEW" || t.status === "BLOCKED",
    },
    {
      key: "COMPLETED",
      title: "✅ Completed",
      subtitle: "Finished & verified tasks",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      filterFn: (t: any) => t.status === "COMPLETED",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-black bg-white">
      {/* 1. Clean, Friendly Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              My Work Desk
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono">
              {tasks.length} Assigned Tasks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Simple Task Manager
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            See your tasks clearly, start work with one click, and track progress smoothly.
          </p>
        </div>

        {/* View Mode & Quick Filter Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode("BOARD")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "BOARD"
                  ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>📊</span> Visual Board
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "LIST"
                  ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>📋</span> Simple List
            </button>
          </div>
        </div>
      </div>

      {/* 2. Simple Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`p-5 rounded-3xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === "ALL"
              ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-gray-500">All Tasks</span>
          <p className="text-2xl font-black text-black font-mono mt-1">{tasks.length}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Total assigned to you</span>
        </button>

        <button
          onClick={() => setActiveTab("IN_PROGRESS")}
          className={`p-5 rounded-3xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === "IN_PROGRESS"
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-amber-600">In Progress</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{inProgressCount}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Currently working</span>
        </button>

        <button
          onClick={() => setActiveTab("ASSIGNED")}
          className={`p-5 rounded-3xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === "ASSIGNED"
              ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-blue-600">To Do</span>
          <p className="text-2xl font-black text-blue-600 font-mono mt-1">{assignedCount}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Ready to start</span>
        </button>

        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`p-5 rounded-3xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === "COMPLETED"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{completedCount}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Successfully finished</span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-black focus:border-blue-600 focus:outline-none transition"
          />
          <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500">Priority:</span>
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((prio) => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                priorityFilter === prio
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tasks Rendering: Visual Board or Simple List */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 font-bold text-xs bg-white rounded-3xl border border-gray-200">
          Loading tasks from TiDB Cloud...
        </div>
      ) : viewMode === "BOARD" ? (
        /* VISUAL BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter(col.filterFn);

            return (
              <div
                key={col.key}
                className="bg-gray-50/70 p-4 rounded-3xl border border-gray-200 flex flex-col space-y-3"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-2xl border text-xs font-black flex justify-between items-center ${col.color}`}>
                  <div>
                    <span className="text-sm font-black">{col.title}</span>
                    <span className="text-[10px] text-gray-500 block font-normal">{col.subtitle}</span>
                  </div>
                  <span className="bg-white px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-500 cursor-pointer space-y-3 transition group"
                    >
                      {/* Priority & Due Date Badge */}
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            t.priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : t.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {t.priority}
                        </span>

                        <span className="text-[11px] font-mono text-gray-500 font-bold">
                          Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Soon"}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-black text-black leading-snug group-hover:text-blue-600 transition">
                        {t.title}
                      </h4>

                      {/* Description Snippet */}
                      {t.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal">
                          {t.description}
                        </p>
                      )}

                      {/* Clean Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-500">
                          <span>Progress</span>
                          <span className="text-blue-600 font-black font-mono">{t.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              t.progress === 100
                                ? "bg-emerald-500"
                                : t.progress > 50
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${t.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons right on Card */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-medium font-mono">
                          #{t.id.slice(-5)}
                        </span>

                        {t.status === "ASSIGNED" || t.status === "PENDING" || t.status === "BACKLOG" ? (
                          <button
                            onClick={(e) => handleQuickStart(e, t.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-black text-xs transition cursor-pointer border border-blue-200"
                          >
                            ▶️ Start
                          </button>
                        ) : t.status === "IN_PROGRESS" ? (
                          <button
                            onClick={(e) => handleQuickComplete(e, t.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-black text-xs transition cursor-pointer border border-emerald-200"
                          >
                            ✓ Complete
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <span>✓</span> Finished
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-2xl bg-white">
                      No tasks in this section
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SIMPLE CLEAN LIST VIEW */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                  <th className="py-4 px-5">Task Details</th>
                  <th className="py-4 px-5">Priority</th>
                  <th className="py-4 px-5">Due Date</th>
                  <th className="py-4 px-5">Progress</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-blue-50/40 transition cursor-pointer text-black"
                  >
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-sm text-black">{t.title}</div>
                      {t.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                      )}
                    </td>
                    <td className="py-4 px-5">
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
                    </td>
                    <td className="py-4 px-5 font-mono text-gray-600 font-bold">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="py-4 px-5">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                          <span>{t.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.progress === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                            style={{ width: `${t.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          t.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : t.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {t.status === "ASSIGNED" || t.status === "PENDING" ? (
                        <button
                          onClick={(e) => handleQuickStart(e, t.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
                        >
                          Start Task
                        </button>
                      ) : t.status === "IN_PROGRESS" ? (
                        <button
                          onClick={(e) => handleQuickComplete(e, t.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold">Details ↗</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Detail Modal / Drawer */}
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
