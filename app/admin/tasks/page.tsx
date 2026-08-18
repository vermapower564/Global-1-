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
  assignedToUser?: { id: string; name: string; employeeId: string };
  project?: { id: string; name: string };
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (priorityFilter !== "ALL") queryParams.set("priority", priorityFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

      const res = await fetch(`/api/tasks?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks);
        setSummary(json.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Control Desk</span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Organization Task Center
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor, assign, inspect, and update task progress across all corporate projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blockers"
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition flex items-center gap-1.5"
          >
            <span>⚠️</span>
            <span>Blocker Center ({summary?.blocked || 0})</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-gray-500">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-black">{summary?.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.inProgress || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{summary?.completed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{summary?.blocked || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-amber-600">In Review</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{summary?.inReview || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-black text-black">{summary?.pending || 0}</p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 flex gap-2">
          <input
            type="text"
            placeholder="Search tasks by title, project, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-black focus:border-blue-600 focus:outline-none font-medium"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Task Title</th>
                <th className="py-3.5 px-4">Assigned Owner</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 font-medium text-xs">
                    Loading task records...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 italic text-xs">
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition text-black">
                    <td className="py-3.5 px-4 font-bold text-black max-w-xs truncate">
                      {task.title}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-black">
                      {task.assignedToUser?.name || "Unassigned"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {task.project?.name || "OMS Core"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          task.priority === "CRITICAL" || task.priority === "HIGH"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-[10px]">{task.progress || 0}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : task.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-800"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        ● {task.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="bg-white hover:bg-gray-50 text-black font-bold text-[11px] px-3 py-1 rounded-lg border border-gray-300 transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          taskId={selectedTask.id}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={fetchTasks}
        />
      )}
    </div>
  );
}
