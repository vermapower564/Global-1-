"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ResignationItem {
  id: string;
  resignationId: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  email: string;
  department: string;
  role: string;
  resignationDate: string;
  noticePeriodDays: number;
  lastWorkingDay: string;
  lastWorkingDayFormatted: string;
  reason: string;
  status: string;
  currentStage: string;
  stageDescription: string;
  hrRemarks?: string;
  managerRemarks?: string;
  trackingHistory?: Array<{
    action: string;
    performedBy: string;
    role: string;
    timestamp: string;
    notes?: string;
    recommendation?: string;
  }>;
  teamLeader?: { id: string; name: string; email: string; employeeId: string };
  projectManager?: { id: string; name: string; email: string; employeeId: string };
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export default function ResignationPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [resignations, setResignations] = useState<ResignationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"apply" | "status" | "team">("status");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const todayStr = new Date().toISOString().split("T")[0];
  const [resignationDate, setResignationDate] = useState(todayStr);
  const [noticePeriodDays, setNoticePeriodDays] = useState(15);
  const [reasonCategory, setReasonCategory] = useState("Career Advancement");
  const [customReason, setCustomReason] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Management Review Modal State
  const [reviewingResignation, setReviewingResignation] = useState<ResignationItem | null>(null);
  const [reviewAction, setReviewAction] = useState<string>("TL_FORWARD");
  const [reviewRecommendation, setReviewRecommendation] = useState<string>("RECOMMENDED_APPROVAL");
  const [reviewComments, setReviewComments] = useState<string>("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const calculateLWD = (startDate: string, days: number) => {
    const s = new Date(startDate || todayStr);
    const end = new Date(s.getTime() + days * 24 * 3600 * 1000);
    return {
      iso: end.toISOString().split("T")[0],
      formatted: end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };
  };

  const { iso: calculatedLwdIso, formatted: calculatedLwdFormatted } = calculateLWD(resignationDate, noticePeriodDays);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, resRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/resignations").then((r) => r.json()),
      ]);

      if (meRes.success && meRes.user) {
        setCurrentUser(meRes.user);
      }
      if (resRes.success) {
        setResignations(resRes.data || []);
        if ((resRes.data || []).length === 0) {
          setActiveTab("apply");
        } else {
          setActiveTab("status");
        }
      }
    } catch (err: any) {
      console.warn("Failed to load resignation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const roleUpper = (currentUser?.role || "").toUpperCase();
  const isTeamLeader = roleUpper === "TEAM_LEADER";
  const isPM = roleUpper === "PROJECT_MANAGER";
  const isHR = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"].includes(roleUpper);
  const isManager = isTeamLeader || isPM || isHR;

  // Active resignation for the logged-in employee
  const myResignation = resignations.find(
    (r) => r.userId === currentUser?.id || r.employeeId === currentUser?.employeeId
  );

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationChecked) {
      alert("Please confirm your intention to submit the formal resignation request.");
      return;
    }
    const finalReason = customReason.trim() ? `${reasonCategory}: ${customReason.trim()}` : reasonCategory;

    setIsSubmitting(true);
    setErrorMsg(null);
    setToastMsg(null);

    try {
      const res = await fetch("/api/resignations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resignationDate,
          noticePeriodDays,
          proposedLastWorkingDate: calculatedLwdIso,
          reason: finalReason,
          additionalComments,
          confirmationChecked,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit resignation.");
      }

      setToastMsg(`✓ ${data.message}`);
      loadData();
      setActiveTab("status");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit resignation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (resignationId: string) => {
    if (!confirm("Are you sure you want to withdraw your resignation request?")) return;
    try {
      const res = await fetch("/api/resignations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resignationId,
          action: "WITHDRAW",
          comments: "Resignation withdrawn by employee.",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to withdraw resignation.");
      }
      setToastMsg("✓ Resignation successfully withdrawn.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to withdraw resignation.");
    }
  };

  const handleProcessReview = async () => {
    if (!reviewingResignation) return;
    setIsReviewSubmitting(true);
    try {
      const res = await fetch("/api/resignations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewingResignation.id || reviewingResignation.resignationId,
          action: reviewAction,
          recommendation: reviewRecommendation,
          comments: reviewComments,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process resignation.");
      }
      setToastMsg(`✓ ${data.message}`);
      setReviewingResignation(null);
      setReviewComments("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to process review.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const getStageIndex = (stage: string) => {
    switch (stage) {
      case "SUBMITTED":
        return 1;
      case "UNDER_TEAM_LEADER_REVIEW":
        return 1;
      case "FORWARDED_TO_SENIOR":
      case "UNDER_SENIOR_REVIEW":
        return 2;
      case "FORWARDED_TO_HR":
      case "UNDER_HR_PROCESSING":
        return 3;
      case "APPROVED":
      case "COMPLETED":
        return 4;
      case "REJECTED":
      case "WITHDRAWN":
        return -1;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans text-slate-900">
      {/* Toast & Error Alerts */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-black">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 font-black">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
              Corporate Exit & Reporting Hierarchy Desk
            </span>
            <span className="text-xs font-bold text-slate-500">• 15-Day Notice Period Standard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employee Resignation & Handover Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Formal exit requests follow the reporting hierarchy: <strong>Employee ➔ Team Leader ➔ Project Manager ➔ Human Resources</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("status")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === "status" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📊 Resignation Tracker
          </button>
          {!myResignation && (
            <button
              onClick={() => setActiveTab("apply")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "apply" ? "bg-amber-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              ✍️ Submit Resignation
            </button>
          )}
          {isManager && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "team" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              👥 Team Exit Ledger ({resignations.length})
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: VISUAL STATUS TRACKER */}
      {activeTab === "status" && (
        <div className="space-y-6">
          {myResignation ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-mono font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    ID: {myResignation.resignationId}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-2">
                    Active Exit Application • {myResignation.employeeName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Department: <strong>{myResignation.department}</strong> • Role: <strong>{myResignation.role}</strong>
                  </p>
                </div>
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    myResignation.status === "APPROVED" || myResignation.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : myResignation.status === "REJECTED"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    {myResignation.status}
                  </span>
                  {["SUBMITTED", "UNDER_REVIEW"].includes(myResignation.status) && (
                    <button
                      onClick={() => handleWithdraw(myResignation.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                    >
                      Withdraw Resignation
                    </button>
                  )}
                </div>
              </div>

              {/* 5-Stage Visual Stepper Pipeline */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Organisational Approval Pipeline
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { step: 1, title: "1. Submitted", desc: "Logged to Team Leader" },
                    { step: 2, title: "2. Team Leader", desc: "Reviewed & Forwarded" },
                    { step: 3, title: "3. Senior Authority", desc: "Project Manager Review" },
                    { step: 4, title: "4. Human Resources", desc: "Exit Clearance & Relieved" },
                  ].map((stage) => {
                    const currentIdx = getStageIndex(myResignation.currentStage);
                    const isDone = currentIdx > stage.step || myResignation.status === "APPROVED" || myResignation.status === "COMPLETED";
                    const isCurrent = currentIdx === stage.step && myResignation.status !== "APPROVED" && myResignation.status !== "COMPLETED" && myResignation.status !== "REJECTED";

                    return (
                      <div
                        key={stage.step}
                        className={`p-4 rounded-2xl border transition ${
                          isDone
                            ? "bg-emerald-50/60 border-emerald-300 text-emerald-950"
                            : isCurrent
                            ? "bg-amber-50 border-amber-400 text-amber-950 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black">{stage.title}</span>
                          <span className="text-xs">
                            {isDone ? "✓" : isCurrent ? "●" : "○"}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium leading-tight opacity-90">{stage.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Resignation Date</span>
                  <p className="text-xs font-bold text-slate-900 font-mono">
                    {new Date(myResignation.resignationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Notice Period</span>
                  <p className="text-xs font-bold text-slate-900 font-mono">{myResignation.noticePeriodDays} Calendar Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800">Official Last Working Day</span>
                  <p className="text-xs font-black text-amber-900 font-mono">{myResignation.lastWorkingDayFormatted}</p>
                </div>
              </div>

              {/* Reason & Remarks Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-extrabold text-slate-700 block">Stated Reason for Exit:</span>
                <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-medium leading-relaxed">
                  {myResignation.reason}
                </p>
                {myResignation.hrRemarks && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="font-extrabold text-blue-700 block">HR / Management Official Remarks:</span>
                    <p className="mt-1 text-slate-700 font-medium">{myResignation.hrRemarks}</p>
                  </div>
                )}
              </div>

              {/* Audit Timeline */}
              {myResignation.trackingHistory && myResignation.trackingHistory.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Approval History & Audit Trail
                  </span>
                  <div className="space-y-2">
                    {myResignation.trackingHistory.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-black text-slate-900">{h.action.replace(/_/g, " ")}</span> by{" "}
                          <span className="font-bold text-blue-700">{h.performedBy}</span> ({h.role})
                          {h.notes && <p className="text-[11px] text-slate-600 mt-0.5">"{h.notes}"</p>}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(h.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="text-4xl">📄</div>
              <h3 className="font-black text-slate-900 text-base">No Active Resignation on Record</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You do not currently have any pending resignation requests in the system.
              </p>
              <button
                onClick={() => setActiveTab("apply")}
                className="mt-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-sm transition cursor-pointer"
              >
                Submit Formal Exit Request →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLICATION FORM */}
      {activeTab === "apply" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmitResignation}
            className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-black text-slate-900 text-base">1. Formal Resignation Application Form</h2>
              <p className="text-xs text-slate-500">Your resignation will be forwarded directly to your assigned Team Leader for evaluation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.name || "Employee"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.employeeId || currentUser?.id || "EMP"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  disabled
                  value={typeof currentUser?.department === "object" ? currentUser?.department?.name : currentUser?.department || "Engineering"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.role?.replace(/_/g, " ") || "Staff Member"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resignation Date *</label>
                <input
                  type="date"
                  required
                  value={resignationDate}
                  onChange={(e) => setResignationDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Period (Days)</label>
                <input
                  type="number"
                  min={15}
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Math.max(15, parseInt(e.target.value) || 15))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leaving *</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none mb-2"
              >
                <option value="Career Advancement & Better Opportunity">Career Advancement & Better Opportunity</option>
                <option value="Higher Studies & Education">Higher Studies & Education</option>
                <option value="Relocation & Family Relocation">Relocation & Family Relocation</option>
                <option value="Health / Personal Reasons">Health / Personal Reasons</option>
                <option value="Entrepreneurship / Starting Venture">Entrepreneurship / Starting Venture</option>
                <option value="Other">Other Reasons</option>
              </select>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Provide additional details regarding your decision..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Handover & Transition Notes</label>
              <textarea
                rows={2}
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="List ongoing project assets or handover transition notes for your Team Leader..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="conf"
                checked={confirmationChecked}
                onChange={(e) => setConfirmationChecked(e.target.checked)}
                className="mt-0.5 rounded cursor-pointer"
              />
              <label htmlFor="conf" className="cursor-pointer font-medium leading-relaxed">
                I hereby submit my formal resignation and acknowledge that I will complete the mandatory 15-day notice period ending on <strong>{calculatedLwdFormatted}</strong>.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !confirmationChecked}
              className={`w-full py-3 rounded-2xl text-xs font-extrabold transition shadow-sm cursor-pointer ${
                isSubmitting || !confirmationChecked
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-black text-white"
              }`}
            >
              {isSubmitting ? "Submitting Request..." : "📄 Submit Resignation to Team Leader"}
            </button>
          </form>

          {/* Right Info Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3">
              ⏱️ 15-Day Notice Period Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Submission Date</span>
                <p className="font-mono font-bold text-slate-900">{resignationDate}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Notice Period Window</span>
                <p className="font-mono font-bold text-slate-900">{noticePeriodDays} Calendar Days</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-amber-800">Calculated Last Working Day</span>
                <p className="font-mono font-black text-amber-950 text-sm">{calculatedLwdFormatted}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                <span className="font-bold block">📋 Reporting Workflow Note:</span>
                <p className="text-[11px] leading-relaxed">
                  Upon submission, your assigned Team Leader will review and forward your request to the Project Manager and Human Resources for formal exit clearance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGEMENT & TEAM RESIGNATIONS LEDGER */}
      {activeTab === "team" && isManager && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="font-black text-slate-900 text-base">👥 Team Exit & Resignation Review Ledger</h2>
              <p className="text-xs text-slate-500">Review pending team exit applications, add recommendations, and forward through the reporting chain.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department & Role</th>
                  <th className="p-3.5">LWD</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {resignations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-600">{r.resignationId}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{r.employeeName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{r.employeeId}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{r.department}</p>
                      <p className="text-[10px] text-slate-400">{r.role}</p>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{r.lastWorkingDayFormatted}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        r.status === "APPROVED" || r.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-600">{r.stageDescription}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setReviewingResignation(r);
                          if (isHR) setReviewAction("HR_APPROVE");
                          else if (isPM) setReviewAction("SENIOR_FORWARD");
                          else setReviewAction("TL_FORWARD");
                        }}
                        className="bg-slate-900 hover:bg-black text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                      >
                        Review & Forward →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW & FORWARD MODAL */}
      {reviewingResignation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Evaluate Exit Request</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {reviewingResignation.resignationId}</p>
              </div>
              <button onClick={() => setReviewingResignation(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p><strong className="text-slate-900">Employee:</strong> {reviewingResignation.employeeName} ({reviewingResignation.employeeId})</p>
              <p><strong className="text-slate-900">Department:</strong> {reviewingResignation.department} • {reviewingResignation.role}</p>
              <p><strong className="text-slate-900">Stated Reason:</strong> "{reviewingResignation.reason}"</p>
              <p><strong className="text-slate-900">Last Working Day:</strong> {reviewingResignation.lastWorkingDayFormatted}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Select Management Action *</label>
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {isTeamLeader && (
                  <option value="TL_FORWARD">Team Leader: Recommend & Forward to Senior Authority / PM</option>
                )}
                {isPM && (
                  <option value="SENIOR_FORWARD">Project Manager: Forward to Human Resources</option>
                )}
                {isHR && (
                  <>
                    <option value="HR_APPROVE">HR: Formally Approve Resignation</option>
                    <option value="HR_COMPLETE">HR: Complete Exit Clearance & Relieve Account</option>
                  </>
                )}
                <option value="REJECT">Reject Resignation Request</option>
              </select>

              {reviewAction === "TL_FORWARD" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recommendation</label>
                  <select
                    value={reviewRecommendation}
                    onChange={(e) => setReviewRecommendation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="RECOMMENDED_APPROVAL">Recommended for Approval (Smooth Handover)</option>
                    <option value="RECOMMENDED_REJECTION">Recommended for Rejection / Retention</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Comments / Handover Notes</label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Enter evaluation remarks for the next approver tier..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReviewingResignation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessReview}
                disabled={isReviewSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
              >
                {isReviewSubmitting ? "Processing..." : "Submit Review Action →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
