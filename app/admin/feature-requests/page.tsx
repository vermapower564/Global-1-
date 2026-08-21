"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminFeatureRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("UNDER_REVIEW");
  const [editRemarks, setEditRemarks] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feature-requests");
      const json = await res.json();
      if (json.success) {
        setRequests(json.data || []);
      }
    } catch (e) {
      console.warn("Failed fetching feature requests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string) => {
    try {
      const res = await fetch("/api/feature-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: editStatus,
          adminRemarks: editRemarks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(`✓ Request status updated to ${editStatus}`);
        setEditingId(null);
        setEditRemarks("");
        fetchRequests();
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        alert(json.error || "Failed to update status.");
      }
    } catch (e) {
      alert("Error updating request status.");
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || r.priority === priorityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (r.title || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.userName || "").toLowerCase().includes(q) ||
      (r.userRole || "").toLowerCase().includes(q);

    return matchesStatus && matchesPriority && matchesQuery;
  });

  const totalSubmitted = requests.filter((r) => r.status === "SUBMITTED").length;
  const totalReviewing = requests.filter((r) => r.status === "UNDER_REVIEW").length;
  const totalApproved = requests.filter((r) => r.status === "APPROVED" || r.status === "IN_PROGRESS").length;
  const totalCompleted = requests.filter((r) => r.status === "COMPLETED").length;

  const statusColorMap: Record<string, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
    UNDER_REVIEW: "bg-purple-50 text-purple-700 border-purple-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Feature Requests & Platform Suggestions Desk
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review, evaluate, prioritize, and respond to operational improvement suggestions submitted by staff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
          >
            ← Admin Dashboard
          </Link>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <span className="text-[11px] font-bold text-slate-400 uppercase">New Submissions</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalSubmitted}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Awaiting Initial Review</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs border-l-4 border-l-purple-600">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Under Review</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalReviewing}</p>
          <span className="text-[10px] text-purple-600 font-semibold">Engineering Evaluation</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Approved / Active</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalApproved}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Scheduled in Roadmap</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Shipped / Completed</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCompleted}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Deployed to Production</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by title, description, employee, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium text-black focus:border-blue-600 focus:outline-none bg-white"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 p-2 text-xs font-bold text-black focus:border-blue-600 focus:outline-none bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-300 p-2 text-xs font-bold text-black focus:border-blue-600 focus:outline-none bg-white"
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

      {/* Requests Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-extrabold text-xs">
            Loading feature requests from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <div className="text-3xl">📭</div>
            <h3 className="text-base font-black text-slate-800">No Feature Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no feature suggestions matching your active search and filter criteria.
            </p>
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4 transition hover:border-blue-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{req.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        statusColorMap[req.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      ● {req.status?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Submitted by <strong>{req.userName}</strong> ({req.userEmail}) • Role:{" "}
                    <span className="font-bold text-slate-700">{req.userRole?.replace(/_/g, " ")}</span> •{" "}
                    {new Date(req.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-black ${
                      req.priority === "CRITICAL"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : req.priority === "HIGH"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    Priority: {req.priority}
                  </span>

                  <button
                    onClick={() => {
                      setEditingId(req.id);
                      setEditStatus(req.status || "UNDER_REVIEW");
                      setEditRemarks(req.adminRemarks || "");
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <span>⚙️</span> Review & Update
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                  {req.description}
                </div>

                {req.useCase && (
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-900">Why it's needed (Business Case):</strong> {req.useCase}
                  </p>
                )}

                {req.adminRemarks && editingId !== req.id && (
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
                    <strong className="text-purple-900">Admin Review Notes:</strong> {req.adminRemarks}
                    {req.reviewedByName && (
                      <span className="block text-[10px] text-purple-700 mt-1 font-mono">
                        Reviewed by {req.reviewedByName} on {new Date(req.reviewedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Editing Form */}
              {editingId === req.id && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-black text-blue-950">
                    Update Feature Request Status & Feedback
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold bg-white text-black focus:border-blue-600 focus:outline-none"
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Feedback Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Approved for sprint 42, planned for next release..."
                        value={editRemarks}
                        onChange={(e) => setEditRemarks(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs text-black font-medium bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id)}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition"
                    >
                      Save Status & Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
