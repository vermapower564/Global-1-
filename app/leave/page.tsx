"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconCalendar,
  IconClipboardList,
  IconFileText,
  IconHistory,
  IconUsers,
} from "@/components/Icons";
import { getCurrentUserContext } from "@/utils/userContextStore";

interface LeaveRecord {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  hrRemarks?: string;
  reviewerName?: string;
  appliedAt: string;
  attachmentUrl?: string;
}

interface LeaveBalance {
  totalAnnualAllowance: number;
  availableLeave: number;
  usedLeave: number;
  pendingLeave: number;
  rejectedLeave: number;
}

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned / Privilege Leave",
  "Maternity / Paternity Leave",
  "Emergency Leave",
  "Unpaid / Loss of Pay",
];

export default function UserLeavePortalPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({
    totalAnnualAllowance: 24,
    availableLeave: 24,
    usedLeave: 0,
    pendingLeave: 0,
    rejectedLeave: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  
  // Feedback & Modals
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // Load User Context & Fetch Leave Records
  useEffect(() => {
    const user = getCurrentUserContext();
    setCurrentUser(user);
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leave");
      const json = await res.json();
      if (json.success) {
        setLeaves(json.data || []);
        if (json.leaveBalance) {
          setBalance(json.leaveBalance);
        }
      }
    } catch (err) {
      console.error("Failed to load leave records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Automatic Days Calculation
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    if (e < s) return 0;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const computedDays = calculateDays(startDate, endDate);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setToast({ message: "Please provide a clear reason for your leave request.", type: "error" });
      return;
    }
    if (computedDays <= 0) {
      setToast({ message: "End Date cannot be earlier than Start Date.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          totalDays: computedDays,
          reason: reason.trim(),
          attachmentUrl: attachmentUrl.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setToast({ message: "✓ Leave request submitted directly to HR for review!", type: "success" });
        setReason("");
        setAttachmentUrl("");
        fetchLeaveData();
      } else {
        setToast({ message: json.error || "Failed to submit leave request.", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message || "Network error. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this pending leave request?")) return;

    try {
      setCancellingId(id);
      const res = await fetch(`/api/leave?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setToast({ message: "✓ Leave request cancelled successfully.", type: "success" });
        fetchLeaveData();
      } else {
        setToast({ message: json.error || "Failed to cancel request.", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setCancellingId(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (activeTab === "ALL") return true;
    return (l.status || "").toUpperCase() === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            APPROVED
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            REJECTED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            PENDING HR REVIEW
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-black animate-in fade-in ${
            toast.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : "bg-rose-900 text-white border-rose-700"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-white/60 hover:text-white font-black ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Direct HR Workflow
            </span>
            <span className="text-xs font-bold text-slate-500">
              • {currentUser?.name || "Staff Member"} ({currentUser?.employeeId || "EMP"})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Leave Request & Balance
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Submit leave requests directly to Human Resources. View your remaining quota, track review status, and inspect HR remarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {["HR", "SUPER_ADMIN", "ADMIN_HR", "DIRECTOR"].includes(currentUser?.role || "") && (
            <Link
              href="/hr/leave"
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
            >
              👑 Open HR Leave Inbox →
            </Link>
          )}
        </div>
      </div>

      {/* 1. Leave Balance Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>Available Balance</span>
            <span className="text-blue-600">🏖️</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-blue-600">{balance.availableLeave} <span className="text-xs font-bold text-slate-400">/ {balance.totalAnnualAllowance} Days</span></div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Ready to be requested</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>Approved / Taken</span>
            <span className="text-emerald-600">✓</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-600">{balance.usedLeave} <span className="text-xs font-bold text-slate-400">Days</span></div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Deducted after HR approval</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>Pending HR Review</span>
            <span className="text-amber-600">⏳</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600">{balance.pendingLeave} <span className="text-xs font-bold text-slate-400">Days</span></div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Awaiting HR decision</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>Annual Quota</span>
            <span className="text-purple-600">📅</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{balance.totalAnnualAllowance} <span className="text-xs font-bold text-slate-400">Days/Yr</span></div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Standard company allowance</p>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Request Form + History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Submit Leave Request */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>✍️</span> Submit Leave Request
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Directly reaches HR inbox. No intermediate delays.
            </p>
          </div>

          <form onSubmit={handleSubmitLeave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Leave Type *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Computed Days Banner */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">Total Requested Duration:</span>
              <span className="text-xs font-black text-blue-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-blue-100">
                {computedDays > 0 ? `${computedDays} Day${computedDays > 1 ? "s" : ""}` : "Invalid Dates"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason for Leave *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the reason for your leave application clearly for HR evaluation..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Optional Attachment / Medical Slip URL
              </label>
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://drive.google.com/... or document link"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || computedDays <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting to HR...</span>
              ) : (
                <span>SUBMIT LEAVE REQUEST →</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Table: My Leave Requests History */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>📋</span> My Leave Requests History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Persistent database records with live HR status & remarks
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition ${
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400">
              <div className="h-7 w-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading leave records...
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              No leave requests found for the selected tab.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                    <th className="pb-3 pr-3">Request ID</th>
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Dates</th>
                    <th className="pb-3 px-3">Days</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-3 font-mono font-bold text-slate-900">
                        <button
                          onClick={() => setSelectedLeave(l)}
                          className="hover:underline text-blue-600 text-left"
                        >
                          {l.id}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-800">{l.leaveType}</td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(l.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} –{" "}
                        {new Date(l.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="py-3.5 px-3 font-black text-slate-900">{l.totalDays}d</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">{getStatusBadge(l.status)}</td>
                      <td className="py-3.5 pl-3 text-right">
                        {l.status === "PENDING" ? (
                          <button
                            onClick={() => handleCancelRequest(l.id)}
                            disabled={cancellingId === l.id}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold transition"
                          >
                            {cancellingId === l.id ? "Cancelling..." : "Cancel"}
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedLeave(l)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Leave Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedLeave.id}</span>
                <h3 className="text-lg font-black text-slate-900">{selectedLeave.leaveType}</h3>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-500">Current Status:</span>
                <div>{getStatusBadge(selectedLeave.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="block text-[10px] uppercase font-black text-slate-400">Date Range</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="block text-[10px] uppercase font-black text-slate-400">Total Duration</span>
                  <span className="font-black text-slate-800">{selectedLeave.totalDays} Day(s)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="block text-[10px] uppercase font-black text-slate-400">Reason Provided</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.hrRemarks && (
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl space-y-1">
                  <span className="block text-[10px] uppercase font-black text-amber-800">HR Decision Remarks</span>
                  <p className="text-amber-900 font-bold leading-relaxed">{selectedLeave.hrRemarks}</p>
                </div>
              )}

              {selectedLeave.attachmentUrl && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Attachment</span>
                  <a
                    href={selectedLeave.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-bold"
                  >
                    🔗 View Document / Medical Slip
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLeave(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-2.5 rounded-2xl transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
