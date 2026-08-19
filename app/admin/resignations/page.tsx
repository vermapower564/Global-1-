"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ResignationItem {
  id: string;
  resignationId: string;
  employeeId: string;
  employeeName: string;
  email: string;
  department: string;
  role: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason: string;
  status: string;
  adminRemarks?: string;
  submittedAt: string;
  user?: {
    id: string;
    joinedAt?: string;
    salary?: number;
  };
  workHistory: {
    completedTasksCount: number;
    inProgressTasksCount: number;
    totalShiftHours: number;
    recentTasks: Array<{ id: string; title: string; status: string; progress: number; priority: string }>;
    attendanceRating: string;
  };
}

export default function AdminResignationsPage() {
  const [resignations, setResignations] = useState<ResignationItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedResignation, setSelectedResignation] = useState<ResignationItem | null>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchResignations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/resignations?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setResignations(json.data);
        setSummary(json.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch resignations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResignations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResignations();
  };

  const handleOpenActionModal = (resItem: ResignationItem, action: "APPROVED" | "REJECTED") => {
    setSelectedResignation(resItem);
    setActionType(action);
    setAdminRemarks(
      action === "APPROVED"
        ? "Resignation approved. Exit interview scheduled and handover process initiated."
        : "Resignation retained after discussion on project retention and compensation adjustment."
    );
  };

  const handleConfirmAction = async () => {
    if (!selectedResignation || !actionType) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/resignations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedResignation.id,
          status: actionType,
          adminRemarks,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Resignation for ${selectedResignation.employeeName} marked as ${actionType}!`);
        setSelectedResignation(null);
        setActionType(null);
        fetchResignations();
      } else {
        alert(json.error || "Failed to update resignation.");
      }
    } catch (err) {
      alert("Network error updating resignation.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

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
            <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              📁 Employee Departure Desk
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {summary?.pending || 0} Pending Requests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Resignation Management & Employee Work History
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review departure reasons, analyze total work accomplished (completed tasks, shift hours), and manage official exit approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/employees"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-xl transition border border-gray-200"
          >
            Employee Directory →
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-gray-500">Total Resignations</span>
          <p className="text-2xl font-black text-black font-mono mt-1">{summary?.total || resignations.length}</p>
          <span className="text-xs text-gray-500 block mt-0.5">Recorded requests</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-amber-600">Pending Review</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{summary?.pending || 0}</p>
          <span className="text-xs text-amber-600 block mt-0.5">Awaiting HR decision</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Approved Departures</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{summary?.approved || 0}</p>
          <span className="text-xs text-emerald-600 block mt-0.5">Exit process active</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-rose-600">Retained / Rejected</span>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">{summary?.rejected || 0}</p>
          <span className="text-xs text-rose-600 block mt-0.5">Retained employees</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name, ID, reason..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-xs font-semibold text-black focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">Status:</span>
          {(["ALL", "SUBMITTED", "APPROVED", "REJECTED"] as const).map((st) => (
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

      {/* Resignation Cards with Full Career History & Reason */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold text-xs bg-white rounded-3xl border border-gray-200">
            Loading resignation records and employee career dossiers from TiDB Cloud...
          </div>
        ) : resignations.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 text-gray-400 italic text-xs">
            No resignation records found matching your filters.
          </div>
        ) : (
          resignations.map((r) => (
            <div
              key={r.id}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-md space-y-5 hover:border-blue-300 transition"
            >
              {/* Top Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-black text-sm border border-rose-200">
                    {(r.employeeName || "E")[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-black flex items-center gap-2">
                      <span>{r.employeeName}</span>
                      <span className="text-xs font-mono text-gray-500 font-bold">({r.employeeId})</span>
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {r.role} • <strong className="text-gray-900">{r.department}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      r.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : r.status === "REJECTED"
                        ? "bg-gray-100 text-gray-800 border border-gray-300"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {r.status === "SUBMITTED" ? "PENDING REVIEW" : r.status}
                  </span>

                  <span className="text-xs text-gray-500 font-mono">
                    Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN") : "Recent"}
                  </span>
                </div>
              </div>

              {/* 2-Column Grid: Left: Reason & Departure Specs | Right: Employee Career & Work Accomplished Dossier */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Reason for Resignation */}
                <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                    💬 Reason for Resignation & Departure Details
                  </span>

                  <p className="text-sm font-semibold text-gray-900 leading-relaxed bg-white p-4 rounded-xl border border-rose-200">
                    "{r.reason}"
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-white p-3 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-bold text-gray-500 block">Resignation Effective Date:</span>
                      <strong className="text-gray-900 font-mono">
                        {r.resignationDate ? new Date(r.resignationDate).toLocaleDateString("en-IN") : "—"}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-bold text-gray-500 block">Proposed Last Working Day:</span>
                      <strong className="text-rose-700 font-mono">
                        {r.lastWorkingDay ? new Date(r.lastWorkingDay).toLocaleDateString("en-IN") : "—"}
                      </strong>
                    </div>
                  </div>

                  {r.adminRemarks && (
                    <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-xs">
                      <span className="font-black text-[10px] uppercase text-blue-700 block">
                        ✍️ Official HR / Admin Decision Notes:
                      </span>
                      <p className="text-blue-900 mt-0.5 font-medium">{r.adminRemarks}</p>
                    </div>
                  )}
                </div>

                {/* Right: Employee Career Work History & Accomplishments */}
                <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-200/80 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                    🏆 Career Contribution & Work History Dossier
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Tasks Completed</span>
                      <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                        {r.workHistory.completedTasksCount}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Total Shift Hours</span>
                      <p className="text-xl font-black text-blue-600 font-mono mt-0.5">
                        {r.workHistory.totalShiftHours}h
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Attendance</span>
                      <p className="text-xs font-black text-gray-800 mt-1">
                        {r.workHistory.attendanceRating}
                      </p>
                    </div>
                  </div>

                  {/* Recent Tasks Delivered */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-600 block mb-1.5">
                      Key Deliverables & Tasks Handled:
                    </span>
                    <div className="space-y-1.5">
                      {r.workHistory.recentTasks && r.workHistory.recentTasks.length > 0 ? (
                        r.workHistory.recentTasks.map((t) => (
                          <div
                            key={t.id}
                            className="bg-white px-3 py-2 rounded-xl border border-blue-100 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="font-bold text-gray-900 truncate">{t.title}</span>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                              {t.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-2.5 rounded-xl text-center text-gray-400 italic text-xs border border-blue-100">
                          Active contributor across engineering sprint cycles.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleOpenActionModal(r, "REJECTED")}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs transition cursor-pointer border border-gray-200"
                >
                  ✕ Retain Employee / Reject
                </button>

                <button
                  onClick={() => handleOpenActionModal(r, "APPROVED")}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-xs cursor-pointer"
                >
                  ✓ Approve Resignation & Exit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval / Rejection Decision Modal */}
      {selectedResignation && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-black">
              {actionType === "APPROVED" ? "✓ Confirm Resignation Approval" : "✕ Reject / Retain Employee"}
            </h3>

            <p className="text-xs text-gray-600">
              Employee: <strong>{selectedResignation.employeeName}</strong> ({selectedResignation.employeeId}) •{" "}
              {selectedResignation.department}
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Official HR Decision Remarks & Handover Instructions
              </label>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 p-3 text-xs font-medium text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedResignation(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-white font-black text-xs transition cursor-pointer shadow-xs ${
                  actionType === "APPROVED" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Processing..." : `Confirm ${actionType === "APPROVED" ? "Approval" : "Decision"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
