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
  approvalHistory?: any[];
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

  // Form & Upload State
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: "File size exceeds 10 MB limit.", type: "error" });
      return;
    }

    try {
      setIsUploading(true);
      setToast(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "leave");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setAttachmentUrl(json.url);
        setUploadFileName(file.name);
        setToast({ message: `✓ Document "${file.name}" uploaded successfully to Cloudinary!`, type: "success" });
      } else {
        setToast({ message: json.error || "Failed to upload document.", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "Upload failed: " + err.message, type: "error" });
    } finally {
      setIsUploading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };
  
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

  const handleViewAttachment = async (leave: any) => {
    try {
      const res = await fetch(`/api/leave/attachment/${encodeURIComponent(leave.id)}`);
      if (res.status === 403) {
        setToast({ message: "Forbidden: You are not authorized to view this leave document.", type: "error" });
        return;
      }
      const json = await res.json();
      if (json.success && json.document?.attachmentUrl) {
        const url = json.document.attachmentUrl;
        if (url.startsWith("blob:") || url.startsWith("file:") || url.includes("fakepath")) {
          setToast({ message: "Invalid temporary file path. Persistent Cloudinary document URL is required.", type: "error" });
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setToast({ message: json.error || "Failed to access leave document.", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message || "Failed to view document.", type: "error" });
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
            PENDING REVIEW
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
              Enterprise Approval Workflow
            </span>
            <span className="text-xs font-bold text-slate-500">
              • {currentUser?.name || "Staff Member"} ({currentUser?.employeeId || "EMP"})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Leave Request & Balance
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Submit leave requests with optional Cloudinary document attachments. Track hierarchical approval stages from Team Leaders to HR Executives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {["HR", "SUPER_ADMIN", "ADMIN_HR", "DIRECTOR", "TEAM_LEADER", "PROJECT_MANAGER"].includes(currentUser?.role || "") && (
            <Link
              href="/hr/leave"
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
            >
              👑 Approver Leave Inbox →
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
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Deducted after final approval</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>Pending Review</span>
            <span className="text-amber-600">⏳</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600">{balance.pendingLeave} <span className="text-xs font-bold text-slate-400">Days</span></div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Awaiting decision</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>Rejected</span>
            <span className="text-rose-600">✕</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-rose-600">{balance.rejectedLeave} <span className="text-xs font-bold text-slate-400">Days</span></div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Applications rejected</p>
          </div>
        </div>
      </div>

      {/* 2. Main Portal: Apply Form (Left) & Request History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Submit New Leave Request */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>📝</span> Apply for Leave
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically routes to your Team Leader or HR for hierarchical review.
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
                placeholder="Describe the reason for your leave application clearly..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Cloudinary Document Uploader */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Supporting Document (Medical Slip / PDF / Image)
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl border border-slate-300 transition flex items-center gap-2 shrink-0">
                    <span>📁 {isUploading ? "Uploading..." : "Select File"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Cloudinary HTTPS URL or upload file..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                {uploadFileName && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <span>✓ File selected:</span> <span className="underline">{uploadFileName}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || computedDays <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting Application...</span>
              ) : (
                <span>SUBMIT LEAVE APPLICATION →</span>
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
                Persistent database records with live status & audit history
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
            <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
              Loading leave records from database...
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              No leave requests found under <span className="text-slate-600">{activeTab}</span> status filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-3 pr-3">Ref ID</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Dates</th>
                    <th className="py-3 px-3">Days</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-3 font-mono font-bold text-blue-600">
                        <button
                          onClick={() => setSelectedLeave(l)}
                          className="hover:underline font-black text-blue-600"
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
                      <td className="py-3.5 pl-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLeave(l)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                        >
                          View Details
                        </button>
                        {l.status === "PENDING" && (
                          <button
                            onClick={() => handleCancelRequest(l.id)}
                            disabled={cancellingId === l.id}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold transition"
                          >
                            {cancellingId === l.id ? "..." : "Cancel"}
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

      {/* 3. Leave Details & Audit History Timeline Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
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

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="block text-[10px] uppercase font-black text-slate-400">Reason Provided</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.attachmentUrl && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-black text-blue-900">Attached Document</span>
                    <span className="text-[11px] font-bold text-blue-700 truncate max-w-xs block">
                      {selectedLeave.attachmentUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewAttachment(selectedLeave)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                  >
                    🔗 View Document
                  </button>
                </div>
              )}

              {/* Approval History Timeline */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <span>📜</span> Approval & Workflow Audit History
                </h4>
                {selectedLeave.approvalHistory && selectedLeave.approvalHistory.length > 0 ? (
                  <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedLeave.approvalHistory.map((h: any, idx: number) => (
                      <div key={h.id || idx} className="relative flex flex-col gap-0.5 text-[11px]">
                        <div className="absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow-xs"></div>
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900">
                            {h.actorName} <span className="text-[10px] text-slate-400 font-normal">({h.actorRole})</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(h.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                            h.action === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                            h.action === "REJECTED" ? "bg-rose-100 text-rose-800" :
                            h.action === "ESCALATED" ? "bg-purple-100 text-purple-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {h.action}
                          </span>
                          {h.comments && <span className="text-slate-600 font-medium">{h.comments}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No historical transitions recorded yet.</p>
                )}
              </div>
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
