"use client";

import React from "react";

interface CustomerCareProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  agentName?: string;
}

export default function CustomerCareModal({
  isOpen,
  onClose,
  clientName = "Valued Customer",
  agentName = "Roushan Verma",
}: CustomerCareProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top Decorative Glow */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl shadow-md">
            🛡️
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-blue-200">
              Customer Reassurance Guarantee
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              Your Account is Covered 24/7!
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dedicated Support Notice for <strong className="text-slate-800">{clientName}</strong>
            </p>
          </div>
        </div>

        {/* Customer Care Reassurance Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <span>✨</span>
            <span>Seamless Service Guarantee</span>
          </div>

          <p className="leading-relaxed text-slate-600 text-[11.5px]">
            While your primary account lead (<strong className="text-slate-800">{agentName}</strong>) is away on scheduled leave, our <strong>Senior Operations Backup Taskforce</strong> has seamlessly assumed management of your projects and inquiries.
          </p>

          <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span>✓</span> Zero Project Delays
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <span>✓</span> Priority Ticket Monitoring
            </div>
            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
              <span>✓</span> Standby Senior Engineer
            </div>
            <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
              <span>✓</span> 24/7 Hotline Support
            </div>
          </div>
        </div>

        {/* Reassuring Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              alert("Connecting you to Standby Support Hotline: +1 (800) 555-OMS-CARE");
              onClose();
            }}
            className="w-full sm:w-auto btn-primary text-xs px-5 py-2.5 shadow-sm"
          >
            📞 Contact Standby Support
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto btn-secondary text-xs px-5 py-2.5"
          >
            Got it, Thank You!
          </button>
        </div>
      </div>
    </div>
  );
}
