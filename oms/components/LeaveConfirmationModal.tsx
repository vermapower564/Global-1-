"use client";

import React from "react";
import Link from "next/link";

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  leaveType: string;
  totalDays: number;
}

export default function LeaveConfirmationModal({
  isOpen,
  onClose,
  employeeName,
  leaveType,
  totalDays,
}: LeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Warm Animated Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl shadow-inner">
          🌴
        </div>

        <div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            Application Received
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Leave Request Submitted!
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Dear <strong className="text-slate-800">{employeeName}</strong>, your application for{" "}
            <span className="font-semibold text-purple-700">{leaveType}</span> ({totalDays} {totalDays === 1 ? "day" : "days"}) has been logged and sent for supervisor review.
          </p>
        </div>

        {/* Reassuring & Supportive Message */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-left text-xs space-y-1.5 text-slate-700">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>💚</span> Rest & Recharge Message:
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            "Take good care of yourself and enjoy your time off! Your team has everything covered in your absence. Stay healthy and come back energized!"
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/hr"
            className="w-full sm:w-auto btn-accent text-xs px-5 py-2.5 shadow-sm text-center"
          >
            View Leave Status in HR Portal
          </Link>
          <button
            onClick={onClose}
            className="w-full sm:w-auto btn-secondary text-xs px-5 py-2.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
