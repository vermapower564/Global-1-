"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const DEFAULT_SECTIONS = [
  "Frontend",
  "Backend",
  "Database",
  "UI/UX Design",
  "Testing & QA",
  "Deployment & CI/CD",
  "Documentation",
  "Research",
];

export default function EmployeeProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Team Leader: Assign Task Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskSection, setTaskSection] = useState("Frontend");
  const [taskCustomSection, setTaskCustomSection] = useState("");
  const [taskAssignedToId, setTaskAssignedToId] = useState("");
  const [taskPriority, setTaskPriority] = useState("HIGH");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState("8");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // Review / Update Task Modal
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState("IN_PROGRESS");
  const [updateProgress, setUpdateProgress] = useState(50);
  const [updateBlocker, setUpdateBlocker] = useState("");
  const [updateReviewNotes, setUpdateReviewNotes] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/projects"),
      ]);

      const uJson = await uRes.json();
      const pJson = await pRes.json();

      if (uJson.success && uJson.user) {
        setCurrentUser(uJson.user);
      }

      if (pJson.success && Array.isArray(pJson.projects || pJson.data)) {
        const list = pJson.projects || pJson.data || [];
        const found = list.find((p: any) => p.id === projectId || p.projectTitle?.toLowerCase().includes(projectId?.toLowerCase()));
        const targetProj = found || list[0] || null;
        setProject(targetProj);

        if (targetProj) {
          // Fetch tasks for this project
          const tRes = await fetch(`/api/tasks?projectId=${targetProj.id}`);
          const tJson = await tRes.json();
          if (tJson.success && Array.isArray(tJson.tasks)) {
            setTasks(tJson.tasks);
          }
        }
      }
    } catch (err) {
      console.warn("Failed loading project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const isTeamLeader = project?.isUserTeamLeader || project?.teamLeaderId === currentUser?.id || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "DIRECTOR";

  const openAssignModal = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskSection("Frontend");
    setTaskCustomSection("");
    setTaskAssignedToId(project?.teamMembers?.[0]?.id || "");
    setTaskPriority("HIGH");
    setTaskDueDate(new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0]);
    setTaskEstimatedHours("8");
    setAssignError("");
    setAssignSuccess("");
    setIsAssignModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setAssignError("Task title is required.");
      return;
    }
    if (!taskAssignedToId) {
      setAssignError("Please select a team member to assign this task.");
      return;
    }

    setAssignSubmitting(true);
    setAssignError("");
    setAssignSuccess("");

    try {
      const finalSection = taskSection === "CUSTOM" ? (taskCustomSection.trim() || "General") : taskSection;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          projectId: project.id,
          section: finalSection,
          assignedToUserId: taskAssignedToId,
          priority: taskPriority,
          status: "PENDING",
          dueDate: taskDueDate,
          estimatedHours: parseFloat(taskEstimatedHours) || 8,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssignSuccess("✓ Task successfully created and assigned!");
        setTimeout(() => {
          setIsAssignModalOpen(false);
          loadData();
        }, 600);
      } else {
        setAssignError(data.error || "Failed to create task.");
      }
    } catch (err: any) {
      setAssignError(err.message || "Network error.");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const openTaskModal = (task: any) => {
    setSelectedTask(task);
    setUpdateStatus(task.status || "IN_PROGRESS");
    setUpdateProgress(task.progress || 0);
    setUpdateBlocker(task.blockerReason || "");
    setUpdateReviewNotes(task.reviewNotes || "");
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleUpdateTask = async (actionType: "save" | "submit_review" | "approve" | "request_changes") => {
    if (!selectedTask) return;
    setUpdateSubmitting(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      let finalStatus = updateStatus;
      let finalProgress = updateProgress;

      if (actionType === "submit_review") {
        finalStatus = "IN_REVIEW";
        finalProgress = Math.max(finalProgress, 90);
      } else if (actionType === "approve") {
        finalStatus = "COMPLETED";
        finalProgress = 100;
      } else if (actionType === "request_changes") {
        finalStatus = "IN_PROGRESS";
        finalProgress = Math.min(finalProgress, 75);
      }

      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: finalStatus,
          progress: finalProgress,
          blockerReason: updateBlocker,
          reviewNotes: updateReviewNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUpdateSuccess(`✓ Task updated to ${finalStatus}!`);
        setTimeout(() => {
          setSelectedTask(null);
          loadData();
        }, 600);
      } else {
        setUpdateError(data.error || "Failed to update task.");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Network error.");
    } finally {
      setUpdateSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-32 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  const proj = project || {
    id: projectId,
    projectTitle: "OMS Enterprise Deliverable",
    clientCompany: "Enterprise Client",
    status: "IN_PROGRESS",
    teamLeader: { name: "Team Lead", employeeId: "EMP-001" },
    teamMembers: [],
    metrics: { overallProgress: 50, totalTasks: 0, completedTasks: 0 },
  };

  const isCompleted = proj.status === "COMPLETED" || (proj.metrics?.overallProgress || 0) >= 100;
  const leader = proj.teamLeader;
  const members = proj.teamMembers || [];
  const sections = proj.sections || [];

  // Filter tasks for employee view vs TL view
  const myTasks = tasks.filter((t) => t.assignedToUserId === currentUser?.id);
  const displayTasks = isTeamLeader ? tasks : myTasks;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            ← Back to Projects
          </button>
          <span className="text-xs text-slate-400 font-mono">/ Projects / {proj.projectTitle}</span>
        </div>

        {isTeamLeader && (
          <button
            onClick={openAssignModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span>+ Assign Task to Member</span>
          </button>
        )}
      </div>

      {/* Project Overview Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {isTeamLeader ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-2xs">
                  👑 TEAM LEADER CONTROL PANEL
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
                  👤 EMPLOYEE WORKSPACE
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  isCompleted ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {isCompleted ? "🏆 COMPLETED" : "🚀 IN PROGRESS"}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {proj.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {proj.projectTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-3xl">
              {proj.description || "Enterprise project deliverable with role-based tasks and section distribution."}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-mono font-black text-slate-900">
              ₹{(Number(proj.contractValue) || 250000).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Contract Value</span>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Client</span>
            <p className="font-extrabold text-slate-900">{proj.clientCompany}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Team Leader</span>
            <p className="font-extrabold text-blue-600">👑 {leader?.name || "Unassigned"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Team Members</span>
            <p className="font-extrabold text-slate-900">{members.length} Active Employees</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Overall Progress</span>
            <p className="font-extrabold text-emerald-600 font-mono">{proj.metrics?.overallProgress || 0}%</p>
          </div>
        </div>
      </div>

      {/* TEAM LEADER: TEAM MEMBERS & SECTIONS */}
      {isTeamLeader && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Members List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                👥 Project Members ({members.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Eligible for task assignment</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {members.map((m: any) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                      {m.avatar || m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.employeeId} • {m.role}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                    {m.department || "Engineering"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                📂 Work Sections & Progress
              </h3>
              <button
                onClick={openAssignModal}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                + Add Task Section
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {sections.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-slate-400">
                  No tasks assigned yet. Click "+ Assign Task" to create sections.
                </div>
              ) : (
                sections.map((sec: any) => (
                  <div key={sec.name} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800">{sec.name}</span>
                      <span className="font-mono font-bold text-blue-600">{sec.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                      <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${sec.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {sec.completedTasks} / {sec.totalTasks} tasks done
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TASKS WORKBOARD */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {isTeamLeader ? "📋 All Project Tasks (Team Leader View)" : "📋 My Assigned Tasks"}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isTeamLeader
                ? "Monitor task statuses, review employee submissions, and approve deliverables."
                : "Work on your assigned section, update your progress, and submit work for Team Leader review."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
            <span>Showing {displayTasks.length} task(s)</span>
          </div>
        </div>

        {displayTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs font-bold text-slate-400">No tasks currently assigned.</p>
            {isTeamLeader && (
              <button
                onClick={openAssignModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                + Assign First Task
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Task Title</th>
                  <th className="p-3.5">Section</th>
                  {isTeamLeader && <th className="p-3.5">Assigned Employee</th>}
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayTasks.map((t) => {
                  const isDone = t.status === "COMPLETED";
                  const isReview = t.status === "IN_REVIEW";
                  const isBlocked = t.status === "BLOCKED";

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 max-w-xs">
                        <div className="font-extrabold text-slate-900">{t.title}</div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{t.description}</div>
                        )}
                        {t.reviewNotes && (
                          <div className="mt-1 p-1.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-blue-800 font-medium">
                            💬 TL Note: {t.reviewNotes}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                          {t.section || "General"}
                        </span>
                      </td>

                      {isTeamLeader && (
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{t.assignedToUser?.name || "Unassigned"}</div>
                          <div className="text-[10px] font-mono text-slate-400">{t.assignedToUser?.employeeId}</div>
                        </td>
                      )}

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
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

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isDone
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isReview
                              ? "bg-purple-100 text-purple-800 border border-purple-300 animate-pulse"
                              : isBlocked
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${isDone ? "bg-emerald-500" : "bg-blue-600"}`}
                              style={{ width: `${t.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-600">{t.progress || 0}%</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openTaskModal(t)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                            isTeamLeader
                              ? isReview
                                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          }`}
                        >
                          {isTeamLeader ? (isReview ? "🔍 Review Work" : "Manage") : "Update Work"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TEAM LEADER: CREATE & ASSIGN TASK MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">👑 Create & Assign Task</h3>
                <p className="text-xs text-slate-500">
                  Project: <strong>{proj.projectTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {assignError}
              </div>
            )}
            {assignSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {assignSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement Login API / Build Product Page UI"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Task Description & Deliverables</label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Specify requirements, acceptance criteria, and deliverable links..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block mb-1">Work Section / Division *</label>
                  <select
                    value={taskSection}
                    onChange={(e) => setTaskSection(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    {DEFAULT_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Section...</option>
                  </select>
                </div>

                {taskSection === "CUSTOM" && (
                  <div>
                    <label className="block mb-1">Enter Custom Section Name</label>
                    <input
                      type="text"
                      value={taskCustomSection}
                      onChange={(e) => setTaskCustomSection(e.target.value)}
                      placeholder="e.g. Security Audit / Payment Gateway"
                      className="w-full rounded-xl border border-blue-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1">Assign to Project Member *</label>
                  <select
                    required
                    value={taskAssignedToId}
                    onChange={(e) => setTaskAssignedToId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.employeeId}) • {m.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🔵 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={taskEstimatedHours}
                    onChange={(e) => setTaskEstimatedHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1">Deadline / Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                >
                  {assignSubmitting ? "Assigning..." : "✓ Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK UPDATE / TEAM LEADER REVIEW MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                    Section: {selectedTask.section || "General"}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{selectedTask.id}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-xs text-slate-500 mt-1">{selectedTask.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {updateError}
              </div>
            )}
            {updateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {updateSuccess}
              </div>
            )}

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Progress Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Work Progress:</span>
                  <span className="font-mono text-blue-600 font-black">{updateProgress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={updateProgress}
                  onChange={(e) => setUpdateProgress(parseInt(e.target.value))}
                  className="w-full cursor-pointer accent-blue-600"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block mb-1">Task Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="IN_PROGRESS">🚀 In Progress</option>
                  <option value="IN_REVIEW">🔍 In Review (Submitted for TL Review)</option>
                  <option value="BLOCKED">⚠️ Blocked</option>
                  {isTeamLeader && <option value="COMPLETED">🏆 Completed (Approved)</option>}
                </select>
              </div>

              {/* If Blocked */}
              {updateStatus === "BLOCKED" && (
                <div>
                  <label className="block mb-1 text-rose-700">Blocker Reason *</label>
                  <textarea
                    rows={2}
                    value={updateBlocker}
                    onChange={(e) => setUpdateBlocker(e.target.value)}
                    placeholder="Describe what is blocking this task (e.g. waiting for API keys, DB schema...)"
                    className="w-full rounded-xl border border-rose-300 px-3.5 py-2 text-xs text-rose-900 focus:border-rose-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Team Leader Review Notes */}
              {isTeamLeader && (
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                  <label className="block font-black text-blue-900">👑 Team Leader Feedback & Review Notes</label>
                  <textarea
                    rows={2}
                    value={updateReviewNotes}
                    onChange={(e) => setUpdateReviewNotes(e.target.value)}
                    placeholder="Add review feedback, approve deliverable, or request revisions..."
                    className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {isTeamLeader ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updateSubmitting}
                      onClick={() => handleUpdateTask("approve")}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                    >
                      🏆 Approve & Mark Completed
                    </button>
                    <button
                      type="button"
                      disabled={updateSubmitting}
                      onClick={() => handleUpdateTask("request_changes")}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                    >
                      🔄 Request Changes
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updateSubmitting}
                      onClick={() => handleUpdateTask("save")}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md cursor-pointer"
                    >
                      Save Progress
                    </button>
                    <button
                      type="button"
                      disabled={updateSubmitting}
                      onClick={() => handleUpdateTask("submit_review")}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                    >
                      🚀 Submit for TL Review
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-full py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
