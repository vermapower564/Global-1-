"use client";

import React, { useState, useEffect } from "react";
import { LeaveRequest } from "@/utils/leaveStore";

interface EmailDispatchProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  action: "Approved" | "Rejected" | null;
}

export default function EmailDispatchModal({
  isOpen,
  onClose,
  request,
  action,
}: EmailDispatchProps) {
  const [sending, setSending] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSending(true);
      const timer = setTimeout(() => setSending(false), 900);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !request || !action) return null;

  const isApproved = action === "Approved";
  const recipientEmail = `${request.employeeName.toLowerCase().replace(/\s+/g, ".")}@oms.com`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Animated Dispatch Banner */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl text-white shadow-md ${isApproved ? "bg-emerald-600" : "bg-rose-600"}`}>
            {sending ? "⚡" : "📧"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isApproved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {sending ? "Sending Email Notice..." : "Email Dispatched Successfully"}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
              Automated HR Notification Dispatched
            </h2>
          </div>
        </div>

        {/* Email Preview Container */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs font-sans">
          <div className="flex justify-between border-b border-slate-200 pb-2 text-slate-500 text-[11px]">
            <span><strong>To:</strong> {request.employeeName} &lt;{recipientEmail}&gt;</span>
            <span><strong>From:</strong> hr-portal@oms.com</span>
          </div>

          <div className="font-bold text-slate-900 text-xs">
            Subject: [OMS HR Notice] Leave Request #{request.id} - {action.toUpperCase()}
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 leading-relaxed text-[11.5px] space-y-2">
            <p>Dear <strong>{request.employeeName}</strong>,</p>
            <p>
              Your formal application for <strong>{request.leaveType}</strong> from <strong>{request.startDate}</strong> to <strong>{request.endDate}</strong> ({request.totalDays} {request.totalDays === 1 ? "day" : "days"}) has been reviewed by the Human Resources Department.
            </p>
            <p className={`font-bold p-2.5 rounded-md ${isApproved ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              {isApproved
                ? "✓ Status: APPROVED — Enjoy your time off! Your team has been notified of your leave schedule."
                : "✕ Status: REJECTED — Please contact HR or your direct supervisor for further details."}
            </p>
            <p className="text-[10px] text-slate-400">
              This is an automated system notification from the Operations Management System (OMS).
            </p>
          </div>
        </div>

        {/* Status Toast Notification */}
        {!sending && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span>✓ Email successfully sent to {recipientEmail}</span>
            <span className="text-emerald-600 font-mono text-[10px]">SMTP Status: 200 OK</span>
          </div>
        )}

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            disabled={sending}
            className="btn-accent text-xs px-6 py-2.5 shadow-sm"
          >
            Done & Return to HR Portal
          </button>
        </div>
      </div>
    </div>
  );
}
