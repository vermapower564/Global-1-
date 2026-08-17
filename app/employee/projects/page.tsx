"use client";

import React, { useState, useEffect } from "react";

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProjects(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Employee Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">My Assigned Projects</h1>
          <p className="text-xs text-slate-500">Corporate projects and milestone deliverables you are contributing to.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">{p.status}</span>
                <span className="text-xs font-mono text-slate-400 font-bold">Budget: ₹{p.budget ? p.budget.toLocaleString() : "N/A"}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{p.name}</h3>
              {p.description && <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
