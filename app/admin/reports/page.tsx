"use client";

import React, { useState, useEffect } from "react";

export default function AdminReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ])
      .then(([empJson, taskJson]) => {
        if (empJson.success) setEmployees(empJson.data || []);
        if (taskJson.success) setTaskSummary(taskJson.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Executive Analytics</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Workforce Operating Reports & Heatmap</h1>
          <p className="text-xs text-slate-500">Comprehensive real-time metrics detailing workforce workload levels and task completion rates.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading reports...</div>
      ) : (
        <div className="space-y-6">
          {/* Workload Heatmap */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Workforce Workload Distribution Heatmap</h3>

            <div className="space-y-3">
              {employees.map((emp) => {
                const m = emp.metrics || { activeTasks: 0, completedTasks: 0, progressRate: 100, workloadLevel: "NORMAL" };

                return (
                  <div key={emp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{emp.name}</h4>
                      <p className="text-slate-500">{emp.role || "Developer"} • {emp.employeeId}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Active Tasks</span>
                        <p className="font-black text-blue-600 text-sm">{m.activeTasks}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Completed</span>
                        <p className="font-black text-emerald-600 text-sm">{m.completedTasks}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Workload Level</span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          m.workloadLevel === "OVERLOADED" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {m.workloadLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
