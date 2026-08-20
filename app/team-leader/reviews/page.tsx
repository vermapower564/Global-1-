"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeaderReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team-leader/summary");
      const json = await res.json();
      if (json.success && json.reviewTasks) {
        setReviews(json.reviewTasks);
      }
    } catch (err) {
      console.warn("Failed loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openReviewModal = (task: any) => {
    setSelectedTask(task);
    setFeedbackNotes(task.reviewNotes || "");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleDecision = async (decision: "approve" | "request_changes") => {
    if (!selectedTask) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const finalStatus = decision === "approve" ? "COMPLETED" : "IN_PROGRESS";
      const finalProgress = decision === "approve" ? 100 : 70;

      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: finalStatus,
          progress: finalProgress,
          reviewNotes: feedbackNotes.trim() || (decision === "approve" ? "Deliverable verified & approved." : "Changes requested by Team Leader."),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setSuccessMsg(decision === "approve" ? "🏆 Task successfully approved and marked COMPLETED!" : "🔄 Changes requested. Task returned to In Progress.");
        setTimeout(() => {
          setSelectedTask(null);
          loadReviews();
        }, 700);
      } else {
        setErrorMsg(resData.error || "Failed to update task decision.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider border border-purple-200">
              Quality Assurance & Delivery Review
            </span>
            <span className="text-xs font-bold text-slate-500">• {reviews.length} Pending Review(s)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Team Work Review & Deliverable Sign-Off
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Inspect work submitted by team members. Add technical feedback remarks, approve completed deliverables, or request revisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/team-leader/progress"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl border border-slate-200 transition shrink-0"
          >
            ← Back to Team Progress
          </Link>
        </div>
      </div>

      {/* Review Queue Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <div className="h-8 w-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 mt-3">Loading review queue...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <span className="text-3xl">🎉</span>
          <h3 className="text-base font-black text-slate-900">All Reviews Clear!</h3>
          <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
            There are currently no employee deliverables pending review. When team members submit completed tasks, they will appear here for your sign-off.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-purple-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between ring-1 ring-purple-100"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase border border-purple-200 animate-pulse">
                        🔍 UNDER REVIEW
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Section: {t.section}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Project: <strong className="text-slate-800">{t.projectTitle}</strong>
                    </p>
                  </div>

                  <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    {t.progress}%
                  </span>
                </div>

                {t.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    {t.description}
                  </p>
                )}

                <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {t.assignedToUser?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/admin/employees/${encodeURIComponent(t.assignedToUser?.employeeId || t.assignedToUser?.id || "EMP001")}`}
                        title={`View ${t.assignedToUser?.name} Profile`}
                        className="font-extrabold text-slate-900 hover:text-purple-700 hover:underline block"
                      >
                        {t.assignedToUser?.name}
                      </Link>
                      <div className="text-[10px] text-slate-500 font-mono">{t.assignedToUser?.employeeId} • {t.assignedToUser?.role}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => openReviewModal(t)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-md cursor-pointer text-center"
                >
                  🔍 Review & Approve / Request Changes →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW DECISION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Section: {selectedTask.section}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedTask.title}</h3>
                <p className="text-xs text-slate-500">
                  Submitted by: <strong>{selectedTask.assignedToUser?.name}</strong> ({selectedTask.assignedToUser?.employeeId})
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {successMsg}
              </div>
            )}

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Task Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-normal">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Deliverable Scope</span>
                <p className="text-xs text-slate-800">{selectedTask.description || "Task completed by employee."}</p>
              </div>

              {/* Team Leader Feedback Remark */}
              <div>
                <label className="block mb-1 font-black text-slate-900">
                  👑 Team Leader Remark / Technical Feedback
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="e.g. Looks good. All API endpoints and test cases verified. Approved!"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Decision Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision("request_changes")}
                  className="py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-black text-xs transition cursor-pointer text-center"
                >
                  🔄 Request Changes
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision("approve")}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md cursor-pointer text-center"
                >
                  🏆 Approve & Complete
                </button>
              </div>

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
      )}
    </div>
  );
}
