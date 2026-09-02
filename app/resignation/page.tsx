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
  letterUrl?: string | null;
  status: string;
  currentStage: string;
  stageDescription: string;
  approvedByUserId?: string | null;
  approvedByName?: string | null;
  approverRole?: string | null;
  approvedAt?: string | null;
  rejectedByUserId?: string | null;
  rejectedByName?: string | null;
  rejectedAt?: string | null;
  accountStatus?: string;
  hrRemarks?: string | null;
  managerRemarks?: string | null;
  submittedAt: string;
}

export default function ResignationPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [resignations, setResignations] = useState<ResignationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"apply" | "status" | "history">("status");
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
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [letterUrl, setLetterUrl] = useState<string | null>(null);
  const [isUploadingLetter, setIsUploadingLetter] = useState(false);

  // Management Review Modal State
  const [selectedResignation, setSelectedResignation] = useState<ResignationItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
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

  // Active resignation for logged-in employee
  const myResignation = resignations.find(
    (r) => r.userId === currentUser?.id || r.employeeId === currentUser?.employeeId
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLetterFile(file);
    setIsUploadingLetter(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "documents");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload document.");
      }

      setLetterUrl(json.url || json.secure_url || json.fileUrl);
      setToastMsg("✓ Resignation document uploaded successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload resignation letter.");
    } finally {
      setIsUploadingLetter(false);
    }
  };

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
          letterUrl,
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
      setErrorMsg(err.message || "Error submitting resignation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedResignation) return;
    setIsReviewSubmitting(true);
    setErrorMsg(null);
    setToastMsg(null);

    try {
      const res = await fetch(`/api/resignations/${selectedResignation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comments: reviewComments,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to ${status.toLowerCase()} resignation.`);
      }

      setToastMsg(`✓ Resignation request marked as ${status}!`);
      setSelectedResignation(null);
      setReviewComments("");
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">APPROVED</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">REJECTED</span>;
      case "WITHDRAWN":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">WITHDRAWN</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">PENDING</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Resignation & Exit Portal</h1>
            <p className="text-sm text-slate-600 mt-1">
              Submit resignation, track status, view approval details, and access official resignation history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Toasts & Messages */}
        {toastMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {toastMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-6">
          <button
            onClick={() => setActiveTab("status")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "status" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            My Resignation Status
          </button>
          {!myResignation && (
            <button
              onClick={() => setActiveTab("apply")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === "apply" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Submit Resignation
            </button>
          )}
          {isManager && (
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === "history" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Resignation History & Requests ({resignations.length})
            </button>
          )}
        </div>

        {/* TAB 1: APPLY RESIGNATION */}
        {activeTab === "apply" && !myResignation && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Formal Resignation Submission</h2>

            <form onSubmit={handleSubmitResignation} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Resignation Date</label>
                  <input
                    type="date"
                    value={resignationDate}
                    onChange={(e) => setResignationDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Notice Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-900 uppercase">Calculated Proposed Last Working Date</span>
                <span className="text-sm font-bold text-indigo-700">{calculatedLwdFormatted}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Primary Resignation Reason</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Career Advancement">Career Advancement / Better Opportunity</option>
                  <option value="Higher Education">Higher Education / Studies</option>
                  <option value="Personal / Family Reasons">Personal / Family Reasons</option>
                  <option value="Relocation">Relocation to Another City/Country</option>
                  <option value="Health Reasons">Health / Medical Reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Detailed Reason / Feedback</label>
                <textarea
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide additional details regarding your decision..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Attach Resignation Letter / Document (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {isUploadingLetter && <p className="text-xs text-indigo-600 mt-1">Uploading document to Cloudinary...</p>}
                {letterUrl && <p className="text-xs text-emerald-600 mt-1">✓ Document attached: <a href={letterUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">View Attachment</a></p>}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="confirmCheck"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="confirmCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  I confirm that I wish to submit my formal resignation request to OMS Enterprise management.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingLetter}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Resignation..." : "Submit Formal Resignation"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MY RESIGNATION STATUS */}
        {activeTab === "status" && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Resignation Status & Overview</h2>

            {myResignation ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-200 gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{myResignation.resignationId}</span>
                      {getStatusBadge(myResignation.status)}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{myResignation.stageDescription}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Submitted On</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(myResignation.submittedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Resignation Date</span>
                    <p className="font-semibold text-slate-900">{new Date(myResignation.resignationDate).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Proposed Last Working Date</span>
                    <p className="font-semibold text-slate-900">{myResignation.lastWorkingDayFormatted || new Date(myResignation.lastWorkingDay).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Reason for Resignation</span>
                  <p className="text-slate-800 leading-relaxed">{myResignation.reason}</p>
                </div>

                {myResignation.letterUrl && (
                  <div className="p-4 rounded-xl border border-slate-200 text-sm">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Attached Resignation Document</span>
                    <a href={myResignation.letterUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">
                      📄 View Resignation Letter / Attachment
                    </a>
                  </div>
                )}

                {myResignation.approvedByUserId && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm space-y-1">
                    <span className="text-xs font-semibold text-emerald-800 uppercase block">Approval Information</span>
                    <p className="text-emerald-900 font-semibold">Approved By: {myResignation.approvedByName || "Management"} ({myResignation.approverRole})</p>
                    <p className="text-emerald-700 text-xs">Approved On: {new Date(myResignation.approvedAt!).toLocaleString("en-IN")}</p>
                  </div>
                )}

                {myResignation.rejectedByUserId && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm space-y-1">
                    <span className="text-xs font-semibold text-rose-800 uppercase block">Rejection Information</span>
                    <p className="text-rose-900 font-semibold">Rejected By: {myResignation.rejectedByName || "Management"}</p>
                    <p className="text-rose-700 text-xs">Rejected On: {new Date(myResignation.rejectedAt!).toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <p className="text-slate-600 text-sm">You have not submitted a resignation request.</p>
                <button
                  onClick={() => setActiveTab("apply")}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition"
                >
                  Submit Resignation Request
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RESIGNATION HISTORY & MANAGEMENT REQUESTS */}
        {activeTab === "history" && isManager && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Resignation History & Review Queue</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Resignation Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Approved By</th>
                    <th className="p-3">Approval Date</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {resignations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-900">{r.employeeId}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{r.employeeName}</div>
                        <div className="text-slate-500 text-[11px]">{r.role}</div>
                      </td>
                      <td className="p-3">{r.department}</td>
                      <td className="p-3">{new Date(r.resignationDate).toLocaleDateString("en-IN")}</td>
                      <td className="p-3">{getStatusBadge(r.status)}</td>
                      <td className="p-3 font-medium">{r.approvedByName ? `${r.approvedByName} (${r.approverRole})` : "—"}</td>
                      <td className="p-3">{r.approvedAt ? new Date(r.approvedAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="p-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${r.accountStatus === "DEACTIVATED" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {r.accountStatus || "ACTIVE"}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedResignation(r)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESIGNATION DETAIL & REVIEW MODAL */}
        {selectedResignation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">Resignation Details — {selectedResignation.resignationId}</h3>
                <button onClick={() => setSelectedResignation(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Employee</span>
                  <span className="text-sm font-bold text-slate-900">{selectedResignation.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Employee ID</span>
                  <span className="text-sm font-bold text-slate-900">{selectedResignation.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Department</span>
                  <span className="text-slate-900 font-semibold">{selectedResignation.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Role</span>
                  <span className="text-slate-900 font-semibold">{selectedResignation.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Resignation Date</span>
                  <span className="text-slate-900 font-semibold">{new Date(selectedResignation.resignationDate).toLocaleDateString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Submitted On</span>
                  <span className="text-slate-900 font-semibold">{new Date(selectedResignation.submittedAt).toLocaleDateString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Status</span>
                  <span>{getStatusBadge(selectedResignation.status)}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Account Status</span>
                  <span className={`font-bold ${selectedResignation.accountStatus === "DEACTIVATED" ? "text-rose-600" : "text-emerald-600"}`}>
                    {selectedResignation.accountStatus || "ACTIVE"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 uppercase block font-semibold">Reason for Resignation</span>
                <p className="text-slate-800 text-sm leading-relaxed">{selectedResignation.reason}</p>
              </div>

              {selectedResignation.letterUrl && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
                  <span className="text-indigo-900 font-semibold block mb-1 uppercase">Resignation Letter Document</span>
                  <a href={selectedResignation.letterUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline font-bold text-sm">
                    📄 Download / View Attachment
                  </a>
                </div>
              )}

              {selectedResignation.approvedByUserId && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <span className="text-emerald-800 uppercase block font-semibold">Approved By</span>
                  <p className="text-emerald-900 font-bold text-sm">{selectedResignation.approvedByName} ({selectedResignation.approverRole})</p>
                  <p className="text-emerald-700">Approved On: {new Date(selectedResignation.approvedAt!).toLocaleString("en-IN")}</p>
                </div>
              )}

              {/* Management Review Form */}
              {isManager && selectedResignation.status === "SUBMITTED" && selectedResignation.userId !== currentUser?.id && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Review & Approve Resignation Request</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Remarks / Decision Notes</label>
                    <textarea
                      rows={2}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Enter approval/rejection remarks..."
                      className="w-full p-3 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReviewAction("APPROVED")}
                      disabled={isReviewSubmitting}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
                    >
                      Approve & Deactivate Account
                    </button>
                    <button
                      onClick={() => handleReviewAction("REJECTED")}
                      disabled={isReviewSubmitting}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
                    >
                      Reject Resignation
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 text-right">
                <button
                  onClick={() => setSelectedResignation(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
