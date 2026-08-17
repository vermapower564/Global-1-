"use client";

import React, { useState, useEffect } from "react";

export default function EmployeeTeamPage() {
  const [teammates, setTeammates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTeammates(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Employee Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Project Teammates & Work Distribution</h1>
          <p className="text-xs text-slate-500">Collaborate with engineers and department leads across corporate initiatives.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading teammates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teammates.slice(0, 9).map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center">
                  {t.name ? t.name.charAt(0) : "E"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.role || "Engineer"}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono pt-2 border-t">ID: {t.employeeId || "EMP"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
