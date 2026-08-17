"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPortalPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950" />

      <div className="w-full max-w-xl rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-200 relative z-10 space-y-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-xl shadow-blue-600/30 border-2 border-white">
            O
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">OMS Enterprise Portal</h1>
          <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
            Select your authorized portal type to proceed with corporate authentication.
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Admin Control Portal */}
          <Link
            href="/auth/login?portal=admin"
            className="group p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-slate-900 transition-all duration-200 space-y-3 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🛡️</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 group-hover:bg-slate-800 text-slate-800 group-hover:text-amber-400">
                Admin Control
              </span>
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 group-hover:text-white transition">
                Admin Portal
              </h3>
              <p className="text-xs text-slate-500 group-hover:text-slate-300 transition mt-1">
                Executive Command Center, Workforce Directory, Task Kanban, and Security Audit Logs.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-blue-600 group-hover:text-blue-400 flex items-center gap-1">
              <span>Enter Admin Login</span>
              <span>→</span>
            </div>
          </Link>

          {/* Employee Workspace Portal */}
          <Link
            href="/auth/login?portal=employee"
            className="group p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-600 bg-slate-50 hover:bg-blue-600 transition-all duration-200 space-y-3 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 group-hover:bg-blue-700 text-blue-800 group-hover:text-white">
                Employee Workspace
              </span>
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 group-hover:text-white transition">
                Employee Portal
              </h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 transition mt-1">
                My Work Dashboard, Shift Punch Clock, EOD Work Submission, and Personal Profile.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-blue-600 group-hover:text-white flex items-center gap-1">
              <span>Enter Employee Login</span>
              <span>→</span>
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Protected by Enterprise Session Security</span>
          <span>MySQL Database Engine</span>
        </div>
      </div>
    </div>
  );
}
