"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredResignations,
  addStoredResignation,
  updateResignationStatus,
  calculateLastWorkingDay,
  ResignationRecord,
} from "@/utils/resignationStore";
import { getCurrentUserContext, CurrentUser } from "@/utils/userContextStore";

export default function ResignationPage() {
  const [userContext, setUserContext] = useState<CurrentUser | null>(null);
  const [resignations, setResignations] = useState<ResignationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"apply" | "ledger">("apply");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedEmailModal, setSelectedEmailModal] = useState<ResignationRecord | null>(null);

  // Form States
  const todayStr = new Date().toISOString().split("T")[0];
  const [employeeName, setEmployeeName] = useState("Aditya Raj");
  const [employeeId, setEmployeeId] = useState("EMP014");
  const [email, setEmail] = useState("aditya.raj@oms.com");
  const [department, setDepartment] = useState("Development & Engineering");
  const [role, setRole] = useState("Software Developer");
  const [resignationDate, setResignationDate] = useState(todayStr);
  const [reason, setReason] = useState("Pursuing Higher Education & Career Advancement");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed 15-Day Notice Period & Last Working Day
  const { lwdIso, lwdFormatted } = calculateLastWorkingDay(resignationDate, 15);

  useEffect(() => {
    const ctx = getCurrentUserContext();
    setUserContext(ctx);
    if (ctx) {
      setEmployeeName(ctx.name || "Aditya Raj");
      setEmployeeId(ctx.id || "EMP014");
      setEmail(ctx.email || "aditya.raj@oms.com");
    }
    setResignations(getStoredResignations());
  }, []);

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("Please provide a valid resignation reason.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/resignations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName,
          employeeId,
          email,
          department,
          role,
          resignationDate,
          reason,
          lastWorkingDay: lwdIso,
          lastWorkingDayFormatted: lwdFormatted,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit resignation.");
      }

      const record = result.data;
      setResignations(getStoredResignations());
      setIsSubmitting(false);
      setSelectedEmailModal(record);
      setToastMsg(`✓ Resignation submitted! 15-Day Notice Period email dispatched to ${email}.`);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || "Resignation submission error.");
    }
  };

  const handleStatusChange = (id: string, newStatus: ResignationRecord["status"]) => {
    const updated = updateResignationStatus(id, newStatus);
    setResignations(updated);
    setToastMsg(`✓ Resignation status updated to "${newStatus}"!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-amber-900 text-amber-100 font-bold text-xs p-4 rounded-2xl shadow-xl border border-amber-700 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-amber-300 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* 🤎 Unique Header Banner - Dark Brown & Light Mocha Mix Theme */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-amber-800/40 text-amber-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
            Corporate Exit & Notice Period Desk
          </span>
          <h1 className="text-2xl font-black text-amber-100 tracking-tight mt-1">
            Employee Resignation & 15-Day Notice Period Portal
          </h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Submit formal resignation, calculate mandatory 15-day notice period last working day (LWD), and receive automated email confirmation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("apply")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "apply" ? "bg-amber-600 text-white shadow-md border border-amber-400" : "bg-amber-950/60 text-amber-200 hover:bg-amber-900/60 border border-amber-800/40"
            }`}
          >
            ✍️ Submit Resignation
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "ledger" ? "bg-amber-600 text-white shadow-md border border-amber-400" : "bg-amber-950/60 text-amber-200 hover:bg-amber-900/60 border border-amber-800/40"
            }`}
          >
            📋 Exit Audit Ledger ({resignations.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Employee Resignation Application Form */}
      {activeTab === "apply" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Container (7 Cols) */}
          <form onSubmit={handleSubmitResignation} className="lg:col-span-7 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-amber-900/40 shadow-xs space-y-5">
            <h2 className="font-extrabold text-amber-950 dark:text-amber-100 text-base border-b border-stone-200 dark:border-amber-900/40 pb-3">
              1. Employee Resignation Details Form
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Assigned Employee ID *</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-mono font-extrabold text-amber-700 dark:text-amber-400 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Company Registered Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
                >
                  <option value="Development & Engineering">Development & Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Accounts & Finance">Accounts & Finance</option>
                  <option value="Sales & CRM">Sales & CRM</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Design & Social Media">Design & Social Media</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Job Designation / Role *</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Resignation Submission Date *</label>
                <input
                  type="date"
                  required
                  value={resignationDate}
                  onChange={(e) => setResignationDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-mono font-bold text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Reason for Resignation *</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State your reason for leaving (e.g. Higher studies, career growth, relocation)..."
                className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div className="pt-3 text-right">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2 border border-amber-700"
              >
                {isSubmitting ? "Processing..." : "📄 Submit Resignation & Receive 15-Day Notice Email"}
              </button>
            </div>
          </form>

          {/* 🤎 Right Card: Dark Brown & Mocha Notice Period Calculator (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-stone-900 to-amber-950 text-amber-50 p-6 rounded-2xl border border-amber-900/80 shadow-xl space-y-4">
            <h2 className="font-extrabold text-base border-b border-amber-800/50 pb-3 flex items-center gap-2 text-amber-200">
              <span>⏱️ Mandatory 15-Day Notice Period Calculator</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800/50 space-y-1">
                <span className="text-amber-300/80 text-[10px] uppercase font-bold">Submission Date:</span>
                <p className="font-mono text-sm font-extrabold text-white">{resignationDate}</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-900/40 border border-amber-700/80 space-y-1">
                <span className="text-amber-300 text-[10px] uppercase font-bold">Mandatory Notice Period:</span>
                <p className="font-mono text-lg font-extrabold text-amber-300">15 Calendar Days</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-600/80 space-y-1">
                <span className="text-amber-200 text-[10px] uppercase font-bold">Calculated Official Last Working Day (LWD):</span>
                <p className="font-mono text-lg font-extrabold text-amber-200">{lwdFormatted}</p>
                <p className="text-[10px] text-amber-300/70 font-mono">Date Code: {lwdIso}</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-amber-900/60 space-y-2 text-[11px] text-amber-200/80">
                <p className="font-bold text-amber-100">📧 Automated Exit Email Dispatch:</p>
                <p>
                  Submitting this form immediately dispatches an official Resignation Acceptance Letter to <span className="text-amber-300 font-mono font-bold">{email}</span> confirming your 15-day notice period window ({resignationDate} ➔ {lwdFormatted}).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Resignation Audit Ledger */}
      {activeTab === "ledger" && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-amber-900/40 shadow-xs space-y-4">
          <h2 className="font-extrabold text-amber-950 dark:text-amber-100 text-base border-b border-stone-200 dark:border-amber-900/40 pb-3">
            Company Employee Resignation & Exit Audit Ledger
          </h2>

          <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-amber-900/40 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-950/10 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Application ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Department & Role</th>
                  <th className="p-3">Submission Date</th>
                  <th className="p-3">Notice Period</th>
                  <th className="p-3">Last Working Day (LWD)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-amber-900/30 bg-white dark:bg-stone-900">
                {resignations.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-950/5 dark:hover:bg-amber-950/30 transition">
                    <td className="p-3">
                      <span className="font-mono text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-1 rounded">
                        {r.id}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-stone-900 dark:text-amber-100">
                      👤 {r.employeeName}
                      <p className="text-[10px] text-stone-500 font-mono font-normal">{r.employeeId}</p>
                    </td>
                    <td className="p-3 font-semibold text-stone-800 dark:text-amber-200">
                      {r.department}
                      <p className="text-[10px] text-stone-500 font-normal">{r.role}</p>
                    </td>
                    <td className="p-3 font-mono text-stone-700 dark:text-amber-300">{r.resignationDate}</td>
                    <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                      15 Days
                    </td>
                    <td className="p-3 font-mono font-extrabold text-amber-900 dark:text-amber-200">
                      {r.lastWorkingDayFormatted}
                    </td>
                    <td className="p-3 font-bold">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] ${
                          r.status === "APPROVED"
                            ? "bg-amber-900 text-amber-100 border border-amber-700"
                            : r.status === "RELIEVED"
                            ? "bg-stone-800 text-stone-200"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-800/40"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEmailModal(r)}
                          className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 hover:underline bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800"
                        >
                          📧 View Exit Email
                        </button>
                        {userContext?.activeMode === "ADMIN_HR" && (
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value as any)}
                            className="text-[10px] font-bold border border-amber-900/40 rounded px-1.5 py-1 bg-white dark:bg-stone-900 text-stone-900 dark:text-amber-100"
                          >
                            <option value="SUBMITTED">Submitted</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="APPROVED">Approved</option>
                            <option value="RELIEVED">Relieved</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📜 OFFICIAL RESIGNATION & 15-DAY NOTICE EMAIL MODAL */}
      {selectedEmailModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-amber-900/30 max-h-[90vh] overflow-y-auto print:shadow-none print:border-none animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-4 print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-extrabold text-lg text-amber-950">Resignation & 15-Day Notice Period Exit Email</h3>
                  <p className="text-xs text-amber-800 font-bold">✓ Dispatched to {selectedEmailModal.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmailModal(null)} className="text-stone-400 hover:text-stone-700 font-bold">
                ✕
              </button>
            </div>

            {/* Email Subject Badge */}
            <div className="bg-amber-950/10 p-3 rounded-xl border border-amber-900/20 text-xs font-mono font-bold text-amber-950">
              Subject: Official Resignation & 15-Day Notice Period Confirmation ({selectedEmailModal.id})
            </div>

            {/* HTML Email Body Preview */}
            <div
              className="border border-stone-200 rounded-xl p-4 bg-white text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedEmailModal.emailBodyHtml || "" }}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-amber-900/20 print:hidden">
              <button onClick={() => window.print()} className="bg-amber-950 text-amber-50 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md border border-amber-800">
                🖨️ Print Exit Certificate Notice
              </button>
              <button onClick={() => setSelectedEmailModal(null)} className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
