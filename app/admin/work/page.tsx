"use client";

import React, { useState, useEffect } from "react";

export default function AdminWorkPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-work");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUpdates(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch work updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkUpdates();
  }, []);

  const handleEvaluate = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/daily-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rating: 5, managerRemarks: "Approved by Admin" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`✓ EOD update status changed to ${status}!`);
        fetchWorkUpdates();
      }
    } catch (err) {
      console.warn("Error evaluating update:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Admin Review Desk</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Daily Work EOD Approvals Desk</h1>
          <p className="text-xs text-slate-500">Inspect employee task updates, achievements, blocker reports, and Git commit logs.</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading EOD submissions...</div>
        ) : (
          updates.map((u) => (
            <div key={u.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{u.user?.name || u.employeeName || "Employee"} ({u.user?.employeeId || u.employeeId})</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    u.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {u.status || "PENDING"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{u.projectName} • {u.description}</h4>
                {u.achievements && <p className="text-xs text-slate-500">🏆 {u.achievements}</p>}
                {u.blockers && <p className="text-xs text-rose-600 font-semibold">⚠️ {u.blockers}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEvaluate(u.id, "APPROVED")}
                  className="bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs"
                >
                  ✓ Approve EOD
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
