"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { setCurrentUserContext } from "@/utils/userContextStore";

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
  isOverdue?: boolean;
  overdueDays?: number;
}

interface TaskHistoryItem {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: string;
  user?: { name: string; employeeId: string };
}

export default function EmployeeDetailWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [newTaskEstHours, setNewTaskEstHours] = useState("8");

  // Update Task Form
  const [updateStatus, setUpdateStatus] = useState("IN_PROGRESS");
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updatePriority, setUpdatePriority] = useState("MEDIUM");
  const [updateBlockerReason, setUpdateBlockerReason] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Employee record
      const resEmps = await fetch(`/api/employees`);
      const jsonEmps = await resEmps.json();
      if (jsonEmps.success) {
        const found = jsonEmps.data.find(
          (u: any) => u.id === id || u.employeeId === id || u.email === id
        );
        if (found) {
          setEmployee(found);

          // 2. Fetch Tasks for Employee from MySQL
          const resTasks = await fetch(`/api/tasks?assignedToUserId=${found.id}`);
          const jsonTasks = await resTasks.json();
          if (jsonTasks.success) {
            setTasks(jsonTasks.tasks);
            setTaskSummary(jsonTasks.summary);

            // Collect history timelines
            const historyList: TaskHistoryItem[] = [];
            jsonTasks.tasks.forEach((t: any) => {
              if (t.taskhistory) {
                t.taskhistory.forEach((h: any) => {
                  historyList.push({ ...h, taskTitle: t.title });
                });
              }
            });
            historyList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setHistory(historyList);
          }
        } else {
          setErrorMsg("Employee not found in database.");
        }
      }
    } catch (err: any) {
      setErrorMsg("Failed to load employee intelligence data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !employee) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          assignedToUserId: employee.id,
          priority: newTaskPriority,
          dueDate: newTaskDueDate,
          estimatedHours: parseFloat(newTaskEstHours) || 8.0,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Task "${newTaskTitle}" assigned to ${employee.name}!`);
        setShowAddTaskModal(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        fetchData();
      } else {
        alert(json.error || "Failed to create task");
      }
    } catch (err: any) {
      alert("Network error");
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          progress: updateProgress,
          priority: updatePriority,
          blockerReason: updateStatus === "BLOCKED" ? updateBlockerReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Task updated permanently in MySQL!`);
        setShowUpdateModal(false);
        fetchData();
      } else {
        alert(json.error || "Failed to update task");
      }
    } catch (err: any) {
      alert("Network error");
    }
  };

  const handleTakeAccess = () => {
    if (!employee) return;
    setCurrentUserContext({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      activeMode: "EMPLOYEE_USER",
      assignedProjectTitle: "OMS Enterprise System",
    });
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold text-xs space-y-2">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div>Loading Employee Intelligence Workspace...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto my-12 space-y-4">
        <div className="text-2xl">⚠️</div>
        <h2 className="font-extrabold text-slate-900 text-lg">Employee Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || "No matching employee user found."}</p>
        <Link href="/employees" className="inline-block bg-blue-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl">
          ← Back to Workforce Directory
        </Link>
      </div>
    );
  }

  const columns = ["PENDING", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "COMPLETED"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Profile Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{employee.name}</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                {employee.employeeId}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                employee.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {employee.isActive ? "Active Account" : "Deactivated"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {employee.role || "Software Engineer"} • {employee.department?.name || "Development & Engineering"} • {employee.email}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            + Assign New Task
          </button>
          <button
            onClick={handleTakeAccess}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            🔑 Take Access
          </button>
          <Link
            href="/employees"
            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            ← Directory
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{taskSummary?.total || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">In Progress</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{taskSummary?.inProgress || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{taskSummary?.completed || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-black text-slate-700 dark:text-slate-300">{taskSummary?.pending || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Blocked</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{taskSummary?.blocked || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Overdue</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{taskSummary?.overdue || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completion %</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{taskSummary?.completionRate || 0}%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Workload</p>
          <span className={`mt-1 inline-block text-xs font-black px-2 py-0.5 rounded-md ${
            taskSummary?.workloadLevel === "OVERLOADED" ? "bg-rose-100 text-rose-700" :
            taskSummary?.workloadLevel === "HIGH" ? "bg-amber-100 text-amber-700" :
            "bg-blue-100 text-blue-700"
          }`}>
            {taskSummary?.workloadLevel || "NORMAL"}
          </span>
        </div>
      </div>

      {/* Task Workboard Columns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workboard & Active Task Ledger
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click any task card to edit status, progress, or blockers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map((colStatus) => {
            const colTasks = tasks.filter((t) => {
              if (colStatus === "PENDING") return t.status === "ASSIGNED" || t.status === "BACKLOG";
              return t.status === colStatus;
            });

            return (
              <div key={colStatus} className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[320px]">
                <div className="flex justify-between items-center px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {colStatus.replace("_", " ")}
                  </span>
                  <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        setUpdateStatus(t.status);
                        setUpdateProgress(t.progress);
                        setUpdatePriority(t.priority);
                        setUpdateBlockerReason(t.blockerReason || "");
                        setShowUpdateModal(true);
                      }}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer transition shadow-2xs space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          t.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {t.priority}
                        </span>
                        {t.isOverdue && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Overdue ({t.overdueDays}d)
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">{t.title}</h4>
                      {t.description && <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>}

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Progress</span>
                          <span>{t.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${t.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {t.status === "BLOCKED" && t.blockerReason && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-700 font-semibold">
                          ⚠️ Blocker: {t.blockerReason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          Work History & Activity Timeline (MySQL Persisted)
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium">No recorded task history entries found.</p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 dark:text-white">{item.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Assign New Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm">Assign New Task to {employee.name}</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement Responsive Navbar Component"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Enter task scope and technical requirements..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-4 py-2 rounded-xl border text-slate-600 font-bold">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 text-white font-extrabold px-5 py-2 rounded-xl shadow-md">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Task Progress / Status / Blocker */}
      {showUpdateModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm">Update Task Status & Progress</h3>
                <p className="text-[11px] text-blue-600 font-semibold">{selectedTask.title}</p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold"
                  >
                    <option value="ASSIGNED">ASSIGNED (Pending)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={updatePriority}
                    onChange={(e) => setUpdatePriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Progress Slider</span>
                  <span className="text-blue-600">{updateProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={updateProgress}
                  onChange={(e) => setUpdateProgress(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {updateStatus === "BLOCKED" && (
                <div>
                  <label className="block font-bold text-rose-600 mb-1">Blocker Reason *</label>
                  <textarea
                    rows={2}
                    required
                    value={updateBlockerReason}
                    onChange={(e) => setUpdateBlockerReason(e.target.value)}
                    placeholder="Enter reason why this task is currently blocked..."
                    className="w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-rose-900 font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 rounded-xl border text-slate-600 font-bold">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 text-white font-extrabold px-5 py-2 rounded-xl shadow-md">
                  Save Changes to MySQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
