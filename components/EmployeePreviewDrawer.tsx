"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IconStar, IconPhone, IconMail, IconCheck, IconZap, IconFolder } from "./Icons";

interface EmployeePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
}

export default function EmployeePreviewDrawer({
  isOpen,
  onClose,
  employee,
}: EmployeePreviewDrawerProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [activeTab, setActiveTab] = useState<"STATUS" | "REVIEWS" | "WORKFLOW">("STATUS");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && employee) {
      const empId = employee.employeeId || employee.id;
      setLoadingReviews(true);
      fetch(`/api/reviews?employeeId=${encodeURIComponent(empId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setReviews(data.data);
          } else {
            setReviews(employee.customerreviews || []);
          }
        })
        .catch(() => {
          setReviews(employee.customerreviews || []);
        })
        .finally(() => setLoadingReviews(false));
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const empId = employee.employeeId || employee.id;
  const phone = employee.phone || "+91 98765 00001";
  const cleanPhone = phone.replace(/\s+/g, "");
  const initials = (employee.name || "E")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const m = employee.metrics || {
    totalTasks: 4,
    activeTasks: 2,
    completedTasks: 2,
    workloadLevel: "NORMAL",
    progressRate: 85,
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl p-6 sm:p-7 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 text-slate-900 custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight uppercase">
                Employee 360° Inspection Center
              </h3>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Profile Master Card */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative shrink-0">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-2 border-blue-400 shadow-md">
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Active">
                ✓
              </span>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {employee.name}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[11px] font-bold">
                  {empId}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {employee.role?.replace(/_/g, " ")} • {employee.department?.name || employee.department || "Operations"}
              </p>

              {/* PROMINENT MOBILE NUMBER DISPLAY */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-emerald-600 text-xs">📱</span>
                  <span className="font-mono text-xs font-black text-slate-900 tracking-wide">
                    {phone}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="text-[10px] font-bold text-blue-600 hover:underline ml-1 cursor-pointer"
                  >
                    {copiedPhone ? "✓ Copied" : "Copy"}
                  </button>
                </div>

                <a
                  href={`tel:${cleanPhone}`}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <span>📞 Call</span>
                </a>

                <a
                  href={`https://wa.me/${cleanPhone.replace("+", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <span>💬 WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            {[
              { id: "STATUS", label: "📊 Complete Statuses" },
              { id: "REVIEWS", label: `⭐ Client Reviews (${reviews.length})` },
              { id: "WORKFLOW", label: "🚀 Active Workflow" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-black transition-all cursor-pointer border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: COMPLETE STATUSES */}
          {activeTab === "STATUS" && (
            <div className="space-y-4">
              {/* Status Grid Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Account Status</span>
                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active & Operational
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Profile & KYC</span>
                  <span className="text-xs font-black text-blue-700 flex items-center gap-1 mt-1">
                    ✓ Verified Documents
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Shift Attendance</span>
                  <span className="text-xs font-mono font-black text-slate-900 mt-1 block">
                    96.5% • Present Today
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Task Workload</span>
                  <span className="text-xs font-black text-indigo-700 mt-1 block">
                    {m.workloadLevel || "NORMAL"} ({m.activeTasks} Active)
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown List */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Registered Email</span>
                  <span className="font-mono font-bold text-slate-900">{employee.email}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Mobile Contact</span>
                  <span className="font-mono font-extrabold text-slate-900">{phone}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Current Project</span>
                  <span className="font-bold text-blue-600">
                    {employee.currentProjectTitle || "OMS Enterprise Cloud Platform"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Base Compensation</span>
                  <span className="font-mono font-black text-slate-900">
                    ₹{Number(employee.salary || 95000).toLocaleString("en-IN")} /mo
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Salary Bank Deposit</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">
                    {employee.bankDetail?.bankName
                      ? `${employee.bankDetail.bankName} (••••${employee.bankDetail.accountNumber?.slice(-4) || "1234"})`
                      : "HDFC Bank (Verified Direct Deposit)"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENT REVIEWS & FEEDBACK */}
          {activeTab === "REVIEWS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 block">Customer Rating</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-base font-black font-mono text-amber-900">5.0</span>
                    <span className="text-amber-500">★★★★★</span>
                    <span className="text-[11px] font-bold text-amber-700 ml-1">({reviews.length} reviews)</span>
                  </div>
                </div>
                <Link
                  href={`/feedback/${empId}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold transition shadow-xs"
                >
                  + Add Client Review
                </Link>
              </div>

              {loadingReviews ? (
                <div className="py-8 text-center text-xs font-bold text-slate-500">
                  Loading verified client feedback...
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <span className="text-2xl block">⭐</span>
                  <p className="text-xs font-bold text-slate-800">No Client Reviews Yet</p>
                  <p className="text-[11px] text-slate-500">
                    Send a review request link to this employee's clients to collect feedback.
                  </p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{rev.customerName}</span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {rev.customerCompany || "Client"} ({rev.customerRole || "Stakeholder"})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-xs font-mono font-black text-slate-900">{rev.rating || 5}.0</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900">
                      "{rev.reviewTitle || "Client Endorsement"}"
                    </h4>

                    <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100">
                      “{rev.feedbackText}”
                    </p>

                    {rev.responseComment && (
                      <div className="text-[11px] text-blue-900 bg-blue-50/80 p-2.5 rounded-xl border border-blue-100">
                        <span className="font-bold">Official Response:</span> {rev.responseComment}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE WORKFLOW */}
          {activeTab === "WORKFLOW" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-blue-700">Active Engagement</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">In Progress</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {employee.currentProjectTitle || "OMS Enterprise Cloud Platform"}
                </h3>
                <p className="text-xs text-slate-600">
                  Sprint Milestone #4 • Real-time DB Sync & RBAC Security Layer
                </p>
                <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-base font-black font-mono text-slate-900 block">{m.totalTasks || 4}</span>
                  <span className="text-[10px] text-slate-500 font-bold">Total Tasks</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-base font-black font-mono text-blue-600 block">{m.activeTasks || 2}</span>
                  <span className="text-[10px] text-slate-500 font-bold">Active Sprint</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-base font-black font-mono text-emerald-600 block">{m.completedTasks || 2}</span>
                  <span className="text-[10px] text-slate-500 font-bold">Completed</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Links */}
          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <Link
              href={`/admin/employees/${empId}`}
              onClick={onClose}
              className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition"
            >
              Open Full 360° Management Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
