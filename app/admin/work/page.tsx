"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminWorkPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [managerRemarks, setManagerRemarks] = useState("");
  const [evaluatingAction, setEvaluatingAction] = useState<"APPROVED" | "REJECTED" | null>(null);

  const fetchWorkUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-work");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUpdates(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch work updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkUpdates();
  }, []);

  const handleOpenEvaluation = (id: string, action: "APPROVED" | "REJECTED") => {
    setEvaluatingId(id);
    setEvaluatingAction(action);
    setManagerRemarks(action === "APPROVED" ? "Deliverable meets all acceptance criteria. Approved." : "Please revise milestone deliverables and address blockers.");
  };

  const handleConfirmEvaluation = async () => {
    if (!evaluatingId || !evaluatingAction) return;

    try {
      const res = await fetch("/api/daily-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: evaluatingId,
          status: evaluatingAction,
          rating: evaluatingAction === "APPROVED" ? 5 : 2,
          managerRemarks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ EOD work submission marked as ${evaluatingAction}!`);
        setEvaluatingId(null);
        setEvaluatingAction(null);
        fetchWorkUpdates();
      }
    } catch (err) {
      console.warn("Error evaluating update:", err);
    } finally {
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const filteredUpdates = updates.filter((u) => {
    const matchesSearch =
      (u.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.projectName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.description || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "PENDING") return matchesSearch && (!u.status || u.status === "PENDING" || u.status === "SUBMITTED");
    return matchesSearch && u.status === statusFilter;
  });

  const pendingCount = updates.filter((u) => !u.status || u.status === "PENDING" || u.status === "SUBMITTED").length;
  const approvedCount = updates.filter((u) => u.status === "APPROVED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-bold text-xs p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Review & Governance
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {pendingCount} Pending Approvals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Daily Work & Project Deliverable Approvals
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review and sign off on daily worker EOD logs, completed task milestones, and sprint deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/tasks"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            Organization Task Center →
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-gray-500">Total EOD Submissions</span>
          <p className="text-2xl font-black text-black font-mono mt-1">{updates.length}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Recorded in database</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-amber-600">Pending Review</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingCount}</p>
          <span className="text-xs text-amber-600 block mt-0.5">Awaiting Manager sign-off</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Approved Deliverables</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{approvedCount}</p>
          <span className="text-xs text-emerald-600 block mt-0.5">Verified & accepted</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name or project..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-xs font-semibold text-black focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">Filter:</span>
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold text-xs bg-white rounded-3xl border border-gray-200">
            Loading EOD submissions from TiDB Cloud...
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 text-gray-400 italic text-xs">
            No work submissions found matching your filters.
          </div>
        ) : (
          filteredUpdates.map((u) => (
            <div
              key={u.id}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4 hover:border-blue-300 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    {(u.user?.name || "E")[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-black">
                      {u.user?.name || "Employee"} ({u.user?.employeeId || "EMP"})
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono">
                      Shift Date: {u.date ? new Date(u.date).toLocaleDateString("en-IN") : "Today"} • {u.hoursWorked || 8} hrs logged
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      u.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : u.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {u.status || "PENDING APPROVAL"}
                  </span>
                </div>
              </div>

              {/* Work Details */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-extrabold text-blue-600 uppercase text-[10px] tracking-wider">Project Deliverable:</span>
                  <p className="font-bold text-gray-900 mt-0.5">{u.projectName || "OMS Enterprise Core Portal"}</p>
                </div>

                <div>
                  <span className="font-extrabold text-gray-500 uppercase text-[10px] tracking-wider">Work Accomplished:</span>
                  <p className="text-gray-700 font-medium leading-relaxed mt-0.5">{u.description}</p>
                </div>

                {u.achievements && (
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 text-emerald-900">
                    <span className="font-black text-[10px] uppercase block">🏆 Key Milestone Achievements:</span>
                    <p className="mt-0.5">{u.achievements}</p>
                  </div>
                )}

                {u.blockers && (
                  <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-200 text-rose-900">
                    <span className="font-black text-[10px] uppercase block">⚠️ Reported Impediments:</span>
                    <p className="mt-0.5">{u.blockers}</p>
                  </div>
                )}

                {u.managerRemarks && (
                  <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200 text-blue-900">
                    <span className="font-black text-[10px] uppercase block">✍️ Manager Review Notes:</span>
                    <p className="mt-0.5">{u.managerRemarks}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEvaluation(u.id, "REJECTED")}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition border border-rose-200 cursor-pointer"
                >
                  ✕ Request Revision
                </button>

                <button
                  onClick={() => handleOpenEvaluation(u.id, "APPROVED")}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs cursor-pointer"
                >
                  ✓ Approve Deliverable
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Evaluation Remarks Modal */}
      {evaluatingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-black">
              {evaluatingAction === "APPROVED" ? "✓ Approve Daily Deliverable" : "✕ Request Deliverable Revision"}
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Manager Feedback / Remarks</label>
              <textarea
                rows={3}
                value={managerRemarks}
                onChange={(e) => setManagerRemarks(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 p-3 text-xs font-medium text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEvaluatingId(null);
                  setEvaluatingAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEvaluation}
                className={`px-5 py-2 rounded-xl text-white font-black text-xs transition cursor-pointer shadow-xs ${
                  evaluatingAction === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm {evaluatingAction === "APPROVED" ? "Approval" : "Revision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
