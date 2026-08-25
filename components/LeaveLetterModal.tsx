"use client";

import React from "react";
import { LeaveRequest } from "@/utils/leaveStore";

interface LeaveLetterProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function LeaveLetterModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}: LeaveLetterProps) {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
              ✉️
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400">APPLICATION #{request.id}</span>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Formal Leave Application Letter</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg px-2 rounded">
            ✕
          </button>
        </div>

        {/* Formal Document Body */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-4 font-sans leading-relaxed shadow-inner">
          <div className="flex justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
            <span><strong>Date Submitted:</strong> {request.submittedAt}</span>
            <span><strong>Department:</strong> {typeof request.department === "object" ? (request.department as any)?.name : (request.department || "Operations")}</span>
          </div>

          <p><strong>To:</strong> Human Resources Department & Management</p>
          <p><strong>From:</strong> {request.employeeName} ({request.employeeId || "EMP"})</p>
          <p><strong>Subject:</strong> Application for {request.leaveType} ({request.totalDays} {request.totalDays === 1 ? "Day" : "Days"})</p>

          <div className="space-y-2 text-slate-700 bg-white p-4 rounded-lg border border-slate-200/80">
            <p>Respected HR Manager,</p>
            <p>
              I am writing to formally request leave from <strong>{request.startDate}</strong> to <strong>{request.endDate}</strong> ({request.totalDays} {request.totalDays === 1 ? "day" : "days"}) for the following necessary reason:
            </p>
            <p className="p-3 bg-amber-50/60 border-l-4 border-l-amber-500 rounded text-slate-900 font-medium italic">
              "{request.reason}"
            </p>
            <p>
              I have ensured my active tasks are briefed to the team. In case of urgent emergencies, I can be reached at <strong>{request.contactPhone || "+91 98765 43210"}</strong>.
            </p>
            <p className="pt-2">Sincerely,<br /><strong>{request.employeeName}</strong></p>
          </div>
        </div>

        {/* HR Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Current Status:{" "}
            <span
              className={`badge ${
                request.status === "Approved"
                  ? "badge-success"
                  : request.status === "Pending"
                  ? "badge-warning"
                  : "badge-danger"
              }`}
            >
              {request.status}
            </span>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {request.status === "Pending" && (
              <>
                <button
                  onClick={() => onReject(request.id)}
                  className="flex-1 sm:flex-initial bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-lg transition"
                >
                  ✕ Reject Application
                </button>
                <button
                  onClick={() => onApprove(request.id)}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-md transition"
                >
                  ✓ Approve & Dispatch Email
                </button>
              </>
            )}
            <button onClick={onClose} className="btn-secondary text-xs px-4 py-2.5">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
