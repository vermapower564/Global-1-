"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserEmployee, Employee } from "@/utils/employeeStore";
import { getCurrentUserContext, CurrentUser } from "@/utils/userContextStore";
import { IconAlertTriangle, IconFileEdit } from "./Icons";

export default function ProfileAlertBanner() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [userContext, setUserContext] = useState<CurrentUser | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUserEmployee());
    setUserContext(getCurrentUserContext());
  }, []);

  // If user profile is already 100% completed or dismissed, hide alert
  if (dismissed) return null;

  const isCompleted = currentUser?.isProfileCompleted ?? false;
  if (isCompleted) return null;

  const userName = currentUser?.name || userContext?.name || "Aditya Raj";
  const userEmpId = currentUser?.id || userContext?.id || "EMP014";

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white p-4 rounded-2xl shadow-xl border border-amber-400/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white font-extrabold text-xl shadow-inner border border-white/30 mt-0.5">
          <IconAlertTriangle className="h-6 w-6 text-amber-100 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm tracking-tight text-white">
              Action Required: Incomplete Employee Profile & Verification Documents!
            </h3>
            <span className="bg-amber-900/60 text-amber-200 border border-amber-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              60% Incomplete
            </span>
          </div>
          <p className="text-xs text-amber-100 leading-relaxed">
            User <span className="font-bold text-white underline">{userName}</span> ({userEmpId}) has pending verification conditions:
          </p>
          {/* Missing Condition Checklist Bullets */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-amber-50 pt-0.5">
            <span className="flex items-center gap-1">❌ Profile Photo Not Uploaded</span>
            <span className="flex items-center gap-1">❌ Government ID Document Pending</span>
            <span className="flex items-center gap-1">❌ Signed Employment Contract NDA Missing</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        <Link
          href="/employees/id"
          className="bg-white hover:bg-amber-50 text-amber-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 border border-white/40"
        >
          <IconFileEdit className="h-4 w-4 text-amber-700" /> Complete Profile & Upload Now
        </Link>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss Alert"
          className="text-white/80 hover:text-white text-xs px-2.5 py-2 rounded-lg hover:bg-white/10 transition font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
