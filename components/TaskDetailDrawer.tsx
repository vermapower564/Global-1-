"use client";

import React, { useState, useEffect } from "react";

interface TaskDetailDrawerProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export default function TaskDetailDrawer({ taskId, onClose, onTaskUpdated }: TaskDetailDrawerProps) {
  const [task, setTask] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [status, setStatus] = useState("IN_PROGRESS");
  const [progress, setProgress] = useState(0);
  const [blockerReason, setBlockerReason] = useState("");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"DETAILS" | "COMMENTS" | "HISTORY">("DETAILS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${taskId}`);
      const json = await res.json();
      if (json.success) {
        setTask(json.task);
        setHistory(json.history || []);
        setStatus(json.task.status);
        setProgress(json.task.progress);
        setBlockerReason(json.task.blockerReason || "");
      }

      // Fetch comments
      const commRes = await fetch(`/api/tasks/${taskId}/comments`);
      const commJson = await commRes.json();
      if (commJson.success) {
        setComments(commJson.comments || []);
      }
    } catch (err) {
      console.warn("Failed to fetch task detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "BLOCKED" && !blockerReason.trim()) {
      alert("Please enter a blocker reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          progress,
          blockerReason: status === "BLOCKED" ? blockerReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert("✓ Task updated in MySQL!");
        onTaskUpdated();
      } else {
        alert(json.error || "Failed to update task");
      }
    } catch (err) {
      alert("Network error updating task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentText: newComment }),
      });
      const json = await res.json();
      if (json.success) {
        setComments([...comments, json.comment]);
        setNewComment("");
      }
    } catch (err) {
      console.warn("Error adding comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border text-slate-500 font-bold text-xs">
          Loading Task Details...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
              Task Detail Drawer • #{task?.id.slice(-6)}
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug mt-0.5">{task?.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold">
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab("DETAILS")}
            className={`py-3 border-b-2 transition ${activeTab === "DETAILS" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
          >
            Properties & Update
          </button>
          <button
            onClick={() => setActiveTab("COMMENTS")}
            className={`py-3 border-b-2 transition ${activeTab === "COMMENTS" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`py-3 border-b-2 transition ${activeTab === "HISTORY" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
          >
            History Timeline ({history.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {activeTab === "DETAILS" && (
            <div className="space-y-5">
              {/* Info Badges */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assignee</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">{task?.assignedToUser?.name || "Unassigned"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Priority</span>
                  <p className="font-extrabold text-blue-600">{task?.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Due Date</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(task?.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Hours</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{task?.estimatedHours} hrs</p>
                </div>
              </div>

              {task?.description && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-white">Task Description</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{task.description}</p>
                </div>
              )}

              {/* Form Update */}
              <form onSubmit={handleUpdateTask} className="space-y-4 pt-3 border-t">
                <h4 className="font-extrabold text-slate-900 dark:text-white">Update Status & Progress</h4>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Progress</span>
                    <span className="text-blue-600 font-black">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {status === "BLOCKED" && (
                  <div>
                    <label className="block font-bold text-rose-600 mb-1">Blocker Reason *</label>
                    <textarea
                      rows={3}
                      required
                      value={blockerReason}
                      onChange={(e) => setBlockerReason(e.target.value)}
                      placeholder="Describe what is blocking this task..."
                      className="w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-rose-900 font-medium"
                    />
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl shadow-md transition">
                  {isSubmitting ? "Saving..." : "Save Progress & Status to MySQL"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "COMMENTS" && (
            <div className="space-y-4">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a discussion comment..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
                />
                <button type="submit" className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs">Post</button>
              </form>

              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-slate-900 dark:text-white">{c.user?.name} ({c.user?.role})</span>
                      <span className="text-slate-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{c.commentText}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-slate-400 italic py-6">No comments posted yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "HISTORY" && (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-blue-600">{h.action}</span>
                    <span className="text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{h.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
