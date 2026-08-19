"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import { IconCheck } from "@/components/Icons";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

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
        if (empJson.data.length > 0 && !assignedToUserId) {
          setAssignedToUserId(empJson.data[0].id);
        }
      }

      if (projJson.success && projJson.projects) {
        setProjects(
          projJson.projects.map((p: any) => ({
            id: p.id,
            projectTitle: p.projectTitle || p.name || "Untitled Project",
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to load employee/project options:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchFormOptions();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateSuccessMsg("");
    setCreateErrorMsg("");

    try {
      if (!title.trim()) throw new Error("Please enter a task title.");
      if (!assignedToUserId) throw new Error("Please select an employee to assign this task.");
      if (!dueDate) throw new Error("Please select a due date.");

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          assignedToUserId,
          projectId: projectId || null,
          priority,
          dueDate,
          estimatedHours: parseFloat(estimatedHours) || 8,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create task in TiDB.");
      }

      setCreateSuccessMsg("✓ Task successfully assigned and saved to TiDB Cloud!");
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setEstimatedHours("8");
      // Refresh task list
      await fetchTasks();

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccessMsg("");
      }, 1200);
    } catch (err: any) {
      setCreateErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Command Desk
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ⚡ TiDB Cloud Synced
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Organization Task Center
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, assign, inspect, and track real-time task workflows across all departments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>Assign New Task</span>
          </button>
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
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-gray-500">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-black">{summary?.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{summary?.inProgress || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{summary?.completed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-purple-600">In Review</p>
          <p className="mt-1 text-2xl font-black text-purple-600">{summary?.inReview || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{summary?.blocked || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase text-amber-600">Assigned / Backlog</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{summary?.pending || 0}</p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 flex gap-2">
          <input
            type="text"
            placeholder="Search tasks by title, description, or owner..."
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
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
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
                <th className="py-3.5 px-4">Assigned Employee</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 font-medium text-xs">
                    Loading task records from TiDB Cloud...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 italic text-xs">
                    No tasks found matching your filter criteria. Click "+ Assign New Task" to create one.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/40 transition text-black">
                    <td className="py-3.5 px-4 font-bold text-black max-w-xs truncate">
                      <span title={task.title}>{task.title}</span>
                      {task.description && (
                        <p className="text-[10px] text-gray-500 font-normal truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-black">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[10px]">
                          {(task.assignedToUser?.name || "U")[0]}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{task.assignedToUser?.name || "Unassigned"}</p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {task.assignedToUser?.employeeId || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-700 max-w-[140px] truncate">
                      {task.project?.projectTitle || "OMS Enterprise"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          task.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : task.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : task.priority === "MEDIUM"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
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
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : task.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : task.status === "IN_REVIEW"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        ● {task.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-[11px] px-3 py-1 rounded-lg border border-blue-200 transition cursor-pointer"
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

      {/* CREATE & ASSIGN TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Admin Task Dispatcher
                </span>
                <h3 className="text-xl font-black text-black">Create & Assign New Task</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {createSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            {createErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                ⚠️ {createErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Architect & Deploy TiDB Auto-Indexing Pipeline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Assignee Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assign To Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={assignedToUserId}
                    onChange={(e) => setAssignedToUserId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-bold focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeId} - {emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Associated Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-medium focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">No Project (General Operations)</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.projectTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority, Due Date & Estimated Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-bold focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="CRITICAL">🔴 CRITICAL</option>
                    <option value="HIGH">🟠 HIGH</option>
                    <option value="MEDIUM">🔵 MEDIUM</option>
                    <option value="LOW">⚪ LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Task Objectives & Deliverables
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the expected technical outcome, milestones, and deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-black font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving to TiDB...</span>
                    </>
                  ) : (
                    <span>Assign Task Now</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
