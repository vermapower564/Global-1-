"use client";

import React, { useState, useEffect } from "react";

export default function AdminReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((empJson) => {
        if (empJson.success) setEmployees(empJson.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Executive Analytics</span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Workforce Operating Reports & Heatmap
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Comprehensive real-time metrics detailing workforce workload levels and task completion rates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 font-bold text-xs">Loading reports...</div>
      ) : (
        <div className="space-y-6">
          {/* Workload Heatmap */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-black text-base border-b border-gray-100 pb-3">
              Workforce Workload Distribution ({employees.length} Staff Members)
            </h3>

            <div className="space-y-3">
              {employees.map((emp) => {
                const m = emp.metrics || { activeTasks: 0, completedTasks: 0, progressRate: 100, workloadLevel: "NORMAL" };

                return (
                  <div
                    key={emp.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-blue-500 transition shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-black text-sm">{emp.name}</h4>
                        <p className="text-gray-500 font-mono text-[11px]">
                          {emp.role || "Developer"} • {emp.employeeId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Active Tasks</span>
                        <p className="font-black text-blue-600 text-sm font-mono">{m.activeTasks}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Completed</span>
                        <p className="font-black text-emerald-600 text-sm font-mono">{m.completedTasks}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Workload Level</span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            m.workloadLevel === "OVERLOADED"
                              ? "bg-rose-100 text-rose-800"
                              : m.workloadLevel === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
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
