"use client";

import React, { useState, useEffect } from "react";

export default function EmployeeReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSummary(json.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Employee Performance Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">My Performance & Activity Summary</h1>
          <p className="text-xs text-slate-500">Real database metrics detailing your task completion rate and work achievements.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading performance data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
            <span className="text-xs font-extrabold uppercase text-slate-400">Total Assigned Tasks</span>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{summary?.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-xs text-center space-y-2">
            <span className="text-xs font-extrabold uppercase text-emerald-600">Completed Tasks</span>
            <p className="text-4xl font-black text-emerald-600">{summary?.completed || 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-xs text-center space-y-2">
            <span className="text-xs font-extrabold uppercase text-blue-600">Completion Rate</span>
            <p className="text-4xl font-black text-blue-600">{summary?.completionRate || 0}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
