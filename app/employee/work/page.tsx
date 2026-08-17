"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeWorkPage() {
  const [user, setUser] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUserContext());
    fetch("/api/daily-work")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setUpdates(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Daily Work Log Desk</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">My Daily EOD Work Updates</h1>
          <p className="text-xs text-slate-500">History of your submitted end-of-day task updates, achievements, and Git commits.</p>
        </div>

        <Link href="/daily-work" className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md">
          + Submit New EOD Report
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading EOD reports...</div>
      ) : (
        <div className="space-y-4">
          {updates.map((u) => (
            <div key={u.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400">{u.date || new Date(u.submittedAt).toLocaleDateString()}</span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  u.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {u.status || "PENDING"}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{u.projectName} • {u.description}</h3>
              {u.achievements && <p className="text-xs text-slate-500">🏆 <strong>Achievements:</strong> {u.achievements}</p>}
              {u.blockers && <p className="text-xs text-rose-600 font-semibold">⚠️ <strong>Blocker:</strong> {u.blockers}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
