"use client";

import React, { useState, useEffect } from "react";

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
}

export default function FeatureRequestModal({
  isOpen,
  onClose,
  userRole = "EMPLOYEE",
  userName = "User",
}: FeatureRequestModalProps) {
  const [activeTab, setActiveTab] = useState<"NEW" | "LIST">("NEW");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status updating state for Admin
  const [adminStatus, setAdminStatus] = useState("UNDER_REVIEW");
  const [adminRemarks, setAdminRemarks] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/feature-requests");
      const json = await res.json();
      if (json.success) {
        setRequestsList(json.data || []);
        setIsAdmin(!!json.isAdmin);
      }
    } catch (e) {
      console.warn("Failed loading requests:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          useCase,
          priority,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess("✓ Feature request submitted! Our product & engineering team will review it.");
        setTitle("");
        setDescription("");
        setUseCase("");
        setPriority("MEDIUM");
        fetchRequests();
        setTimeout(() => {
          setActiveTab("LIST");
        }, 1200);
      } else {
        setError(json.error || "Failed to submit request.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpdate = async (id: string) => {
    try {
      const res = await fetch("/api/feature-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: adminStatus,
          adminRemarks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUpdatingId(null);
        setAdminRemarks("");
        fetchRequests();
      } else {
        alert(json.error || "Failed to update status.");
      }
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  const statusColorMap: Record<string, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
    UNDER_REVIEW: "bg-purple-50 text-purple-700 border-purple-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
              💡
            </div>
            <div>
              <h3 className="font-black text-base text-white">Request a Feature & Suggest Improvement</h3>
              <p className="text-xs text-slate-400">
                Help shape the OMS platform roadmap with your operational feedback.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 text-xs font-black">
          <button
            onClick={() => setActiveTab("NEW")}
            className={`pb-3 border-b-2 transition cursor-pointer ${
              activeTab === "NEW"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            + Submit New Request
          </button>
          <button
            onClick={() => setActiveTab("LIST")}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "LIST"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📋 {isAdmin ? "All Feature Requests" : "My Submitted Requests"}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] font-mono text-slate-700">
              {requestsList.length}
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>✓</span> {success}
            </div>
          )}

          {/* TAB 1: NEW REQUEST FORM */}
          {activeTab === "NEW" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Feature Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Completed Task Filter, Team Performance Comparison..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Your Current Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userRole.replace(/_/g, " ")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-mono text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="LOW">Low (Nice to have)</option>
                    <option value="MEDIUM">Medium (Productivity booster)</option>
                    <option value="HIGH">High (Important operational need)</option>
                    <option value="CRITICAL">Critical (Blocks key daily workflow)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  What functionality do you need? *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the feature or improvement in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Why is this useful? (Use Case & Business Impact)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain how this saves time, reduces errors, or helps your team..."
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? "Submitting..." : "🚀 Submit Feature Request"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REQUESTS LIST */}
          {activeTab === "LIST" && (
            <div className="space-y-3">
              {requestsList.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="text-3xl">📭</div>
                  <h4 className="text-xs font-black text-slate-800">No Feature Requests Found</h4>
                  <p className="text-[11px] text-slate-500">
                    You haven't submitted any feature suggestions yet.
                  </p>
                </div>
              ) : (
                requestsList.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 transition hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">{req.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                              statusColorMap[req.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            ● {req.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Submitted by <strong>{req.userName}</strong> ({req.userRole?.replace(/_/g, " ")}) on{" "}
                          {new Date(req.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          req.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : req.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {req.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                      {req.description}
                    </p>

                    {req.useCase && (
                      <p className="text-[11px] text-slate-500 italic">
                        <strong>Use Case:</strong> {req.useCase}
                      </p>
                    )}

                    {req.adminRemarks && (
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                        <strong>Admin Feedback:</strong> {req.adminRemarks}
                      </div>
                    )}

                    {/* Admin Status Modification Interface */}
                    {isAdmin && (
                      <div className="pt-2 border-t border-slate-200">
                        {updatingId === req.id ? (
                          <div className="space-y-2 p-3 bg-white border border-blue-200 rounded-xl">
                            <div className="flex items-center gap-2">
                              <select
                                value={adminStatus}
                                onChange={(e) => setAdminStatus(e.target.value)}
                                className="rounded-lg border border-slate-300 p-1.5 text-xs font-bold bg-white text-black"
                              >
                                <option value="SUBMITTED">SUBMITTED</option>
                                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="REJECTED">REJECTED</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleAdminUpdate(req.id)}
                                className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
                              >
                                Save Status
                              </button>
                              <button
                                type="button"
                                onClick={() => setUpdatingId(null)}
                                className="px-2 py-1 text-slate-500 text-xs font-bold hover:text-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Admin remarks / ETA notes..."
                              value={adminRemarks}
                              onChange={(e) => setAdminRemarks(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-black font-medium"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setUpdatingId(req.id);
                              setAdminStatus(req.status || "UNDER_REVIEW");
                              setAdminRemarks(req.adminRemarks || "");
                            }}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            ⚙️ Update Review Status & Remarks
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
