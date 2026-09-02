"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconClipboardList, IconSearch, IconFileText, IconUsers } from "@/components/Icons";

export default function HRLeaveManagementPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");
  
  // Review & Decision States
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [decisionType, setDecisionType] = useState<"APPROVE" | "REJECT" | "ESCALATE" | null>(null);
  const [hrRemarks, setHrRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leave");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLeaves(json.data);
      }
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const openDecisionModal = (leave: any, type: "APPROVE" | "REJECT" | "ESCALATE") => {
    setSelectedLeave(leave);
    setDecisionType(type);
    if (type === "APPROVE") setHrRemarks("Approved by Approving Authority.");
    else if (type === "ESCALATE") setHrRemarks("Escalated for executive HR/Director review.");
    else setHrRemarks("");
  };

  const handleViewAttachment = async (leave: any) => {
    try {
      const res = await fetch(`/api/leave/attachment/${encodeURIComponent(leave.id)}`);
      if (res.status === 403) {
        setToastMsg({ text: "Forbidden: You are not authorized to view this leave document.", type: "error" });
        return;
      }
      const json = await res.json();
      if (json.success && json.document?.attachmentUrl) {
        const url = json.document.attachmentUrl;
        if (url.startsWith("blob:") || url.startsWith("file:") || url.includes("fakepath")) {
          setToastMsg({ text: "Invalid temporary file path. Persistent Cloudinary document URL is required.", type: "error" });
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setToastMsg({ text: json.error || "Failed to access leave document.", type: "error" });
      }
    } catch (err: any) {
      setToastMsg({ text: err.message || "Failed to view document.", type: "error" });
    }
  };

  const handleConfirmDecision = async () => {
    if (!selectedLeave || !decisionType) return;
    if (decisionType === "REJECT" && !hrRemarks.trim()) {
      setToastMsg({ text: "Please provide an explicit rejection reason for the employee.", type: "error" });
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLeave.id,
          action: decisionType,
          hrRemarks: hrRemarks.trim(),
          escalationReason: decisionType === "ESCALATE" ? hrRemarks.trim() : undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setToastMsg({
          text: `✓ Leave request for ${selectedLeave.employeeName || selectedLeave.user?.name} has been ${
            decisionType === "APPROVE" ? "APPROVED" : decisionType === "REJECT" ? "REJECTED" : "ESCALATED"
          }!`,
          type: "success",
        });
        setSelectedLeave(null);
        setDecisionType(null);
        setHrRemarks("");
        fetchLeaves();
      } else {
        setToastMsg({ text: json.error || "Failed to update leave request.", type: "error" });
      }
    } catch (err: any) {
      setToastMsg({ text: "Error: " + err.message, type: "error" });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const pendingCount = leaves.filter((l) => (l.status || "").toUpperCase() === "PENDING").length;
  const approvedCount = leaves.filter((l) => (l.status || "").toUpperCase() === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => (l.status || "").toUpperCase() === "REJECTED").length;

  // Extract unique departments & types for filters
  const uniqueDepartments = Array.from(
    new Set(leaves.map((l) => l.departmentName || l.user?.department?.name || "General").filter(Boolean))
  );
  const uniqueLeaveTypes = Array.from(new Set(leaves.map((l) => l.leaveType).filter(Boolean)));

  const filteredLeaves = leaves.filter((l) => {
    const lStatus = (l.status || "").toUpperCase();
    if (statusTab !== "ALL" && lStatus !== statusTab) return false;
    if (deptFilter !== "ALL") {
      const dName = l.departmentName || l.user?.department?.name || "General";
      if (dName !== deptFilter) return false;
    }
    if (leaveTypeFilter !== "ALL" && l.leaveType !== leaveTypeFilter) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      const name = (l.employeeName || l.user?.name || "").toLowerCase();
      const empId = (l.employeeId || l.user?.employeeId || "").toLowerCase();
      const type = (l.leaveType || "").toLowerCase();
      const reqId = (l.id || "").toLowerCase();
      const reason = (l.reason || "").toLowerCase();
      if (!name.includes(query) && !empId.includes(query) && !type.includes(query) && !reqId.includes(query) && !reason.includes(query))
        return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-black animate-in fade-in ${
            toastMsg.type === "success"
              ? "bg-slate-900 text-white border-slate-700"
              : "bg-rose-900 text-white border-rose-700"
          }`}
        >
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/60 hover:text-white font-black ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Primary Approval Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>📋</span> HR Leave Requests Inbox
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
            Review incoming leave applications directly from staff. Approve or reject with official remarks, updating leave balances and notifying requesters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/leave"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition"
          >
            My Leave Request →
          </Link>
          <Link
            href="/hr"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition"
          >
            ← HR Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending Applications</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting HR action</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Approved Leaves</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{approvedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Deducted from balance</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Rejected Requests</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">{rejectedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Declined with feedback</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Applications</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">{leaves.length}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Database ledger</p>
        </div>
      </div>

      {/* Filter Tabs, Department & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setStatusTab("PENDING")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "PENDING" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ⏳ Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusTab("APPROVED")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "APPROVED" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ✓ Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusTab("REJECTED")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "REJECTED" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ✕ Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => setStatusTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Records ({leaves.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            {uniqueDepartments.length > 1 && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {uniqueDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Leave Type Filter */}
            {uniqueLeaveTypes.length > 1 && (
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Leave Types</option>
                {uniqueLeaveTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search employee, ID, request..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Leave Type</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    <div className="h-7 w-7 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading leave requests from TiDB Cloud...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No leave requests matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{l.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{l.employeeName || l.user?.name || "Employee"}</div>
                      <span className="font-mono text-[10px] font-bold text-blue-600">{l.employeeId || l.user?.employeeId || "EMP"}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{l.departmentName || l.user?.department?.name || "General"}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{l.leaveType}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <div>
                        {l.startDate ? new Date(l.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"} to{" "}
                        {l.endDate ? new Date(l.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold">({l.totalDays} Day{l.totalDays === 1 ? "" : "s"})</span>
                    </td>
                    <td className="py-3 px-3 max-w-xs text-slate-600 italic line-clamp-2">{l.reason}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          (l.status || "").toUpperCase() === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : (l.status || "").toUpperCase() === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {l.status === "PENDING" ? "PENDING HR" : l.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {(l.status || "").toUpperCase() === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDecisionModal(l, "APPROVE")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs transition"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => openDecisionModal(l, "ESCALATE")}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-xs transition"
                          >
                            ⬆️ Escalate
                          </button>
                          <button
                            onClick={() => openDecisionModal(l, "REJECT")}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-xs transition"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-bold">
                          {l.hrRemarks ? `Remarks: ${l.hrRemarks}` : "Decision Logged"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR / Approver Decision & Audit History Modal */}
      {selectedLeave && decisionType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-600">{selectedLeave.id}</span>
                <h3 className="font-black text-base text-slate-900">
                  {decisionType === "APPROVE"
                    ? "✅ Approve Leave Request"
                    : decisionType === "ESCALATE"
                    ? "⬆️ Escalate Leave Application"
                    : "❌ Reject Leave Request"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedLeave(null);
                  setDecisionType(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-black h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Employee</span>
                <span className="font-black text-slate-900">
                  {selectedLeave.employeeName || selectedLeave.user?.name} ({selectedLeave.employeeId || selectedLeave.user?.employeeId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Leave Type</span>
                <span className="font-bold text-slate-800">{selectedLeave.leaveType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Dates & Duration</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.totalDays} Days)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Employee Reason</span>
                <p className="italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  "{selectedLeave.reason}"
                </p>
              </div>

              {selectedLeave.attachmentUrl && (
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Attachment</span>
                  <button
                    type="button"
                    onClick={() => handleViewAttachment(selectedLeave)}
                    className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    🔗 View Attachment
                  </button>
                </div>
              )}
            </div>

            {/* Audit History Timeline */}
            {selectedLeave.approvalHistory && selectedLeave.approvalHistory.length > 0 && (
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2">
                <h4 className="font-black text-slate-800 text-[11px]">📜 Prior Approval History Timeline:</h4>
                <div className="space-y-2 pl-2 border-l-2 border-blue-500 text-[11px]">
                  {selectedLeave.approvalHistory.map((h: any, idx: number) => (
                    <div key={h.id || idx} className="text-slate-700 font-medium">
                      <span className="font-bold text-slate-900">{h.actorName}</span> ({h.actorRole}):{" "}
                      <span className="font-black text-blue-700">{h.action}</span> — {h.comments || "No comment"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs font-bold text-slate-700">
              <label className="block">
                {decisionType === "APPROVE"
                  ? "Official Approver Remarks (Optional)"
                  : decisionType === "ESCALATE"
                  ? "Reason for Escalation to HR / Director *"
                  : "Official Rejection Reason *"}
              </label>
              <textarea
                rows={3}
                required={decisionType !== "APPROVE"}
                placeholder={
                  decisionType === "APPROVE"
                    ? "Optional feedback for employee..."
                    : decisionType === "ESCALATE"
                    ? "Explain why this leave application is being escalated to HR/Executive level..."
                    : "Explain why this leave application is rejected (visible to employee)..."
                }
                value={hrRemarks}
                onChange={(e) => setHrRemarks(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeave(null);
                  setDecisionType(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition"
              >
                Cancel
              </button>
              {decisionType === "APPROVE" ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmDecision}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  {isProcessing ? "Processing..." : "✓ Confirm Approval"}
                </button>
              ) : decisionType === "ESCALATE" ? (
                <button
                  type="button"
                  disabled={isProcessing || !hrRemarks.trim()}
                  onClick={handleConfirmDecision}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  {isProcessing ? "Processing..." : "⬆️ Confirm Escalation"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing || !hrRemarks.trim()}
                  onClick={handleConfirmDecision}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  {isProcessing ? "Processing..." : "✕ Confirm Rejection"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
