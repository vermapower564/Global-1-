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
        alert("✓ Task updated successfully!");
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
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center font-sans">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 text-gray-700 font-bold text-xs shadow-xl">
          Loading Task Details...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end font-sans">
      <div className="bg-white text-black w-full max-w-xl h-full shadow-2xl border-l border-gray-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
              Task Detail Drawer • #{task?.id.slice(-6)}
            </span>
            <h2 className="text-lg font-black text-black leading-snug mt-0.5">{task?.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 px-6 gap-6 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab("DETAILS")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "DETAILS" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            Properties & Update
          </button>
          <button
            onClick={() => setActiveTab("COMMENTS")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "COMMENTS" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "HISTORY" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            History Timeline ({history.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {activeTab === "DETAILS" && (
            <div className="space-y-5">
              {/* Info Badges */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Assignee</span>
                  <p className="font-black text-black text-sm">{task?.assignedToUser?.name || "Unassigned"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Priority</span>
                  <p className="font-extrabold text-blue-600">{task?.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Due Date</span>
                  <p className="font-bold text-black font-mono">{task?.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Est. Hours</span>
                  <p className="font-bold text-black font-mono">{task?.estimatedHours} hrs</p>
                </div>
              </div>

              {task?.description && (
                <div className="space-y-1">
                  <h4 className="font-black text-black">Task Description</h4>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">{task.description}</p>
                </div>
              )}

              {/* Form Update */}
              <form onSubmit={handleUpdateTask} className="space-y-4 pt-3 border-t border-gray-100">
                <h4 className="font-black text-black text-sm">Update Status & Progress</h4>

                <div>
                  <label className="block font-bold mb-1 text-black">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 font-bold text-black focus:border-blue-600 focus:outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-black">
                    Progress: <span className="font-mono text-blue-600">{progress}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {status === "BLOCKED" && (
                  <div>
                    <label className="block font-bold mb-1 text-rose-600">Blocker Reason *</label>
                    <textarea
                      rows={2}
                      required
                      value={blockerReason}
                      onChange={(e) => setBlockerReason(e.target.value)}
                      placeholder="Why is this task blocked?"
                      className="w-full rounded-xl border border-rose-300 bg-white p-2.5 text-black font-medium focus:border-rose-600 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Save Task Status"}
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
                  placeholder="Add a comment or feedback..."
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-black focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Post
                </button>
              </form>

              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-black">{c.user?.name || "Admin Member"}</span>
                      <span className="text-gray-500 font-mono">{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-gray-800 font-medium">{c.commentText}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-gray-400 italic py-6">No discussion comments yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "HISTORY" && (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-0.5 text-xs">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-blue-600">{h.action}</span>
                    <span className="text-gray-500 font-mono">{new Date(h.createdAt).toLocaleTimeString("en-IN")}</span>
                  </div>
                  <p className="text-gray-800">{h.description}</p>
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-center text-gray-400 italic py-6">No change history recorded.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
