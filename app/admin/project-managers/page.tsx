"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function SuperAdminProjectManagersPage() {
  const [projectManagers, setProjectManagers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/employees"), fetch("/api/projects")])
      .then(async ([eRes, pRes]) => {
        const eJson = await eRes.json();
        const pJson = await pRes.json();
        if (eJson.success && Array.isArray(eJson.data)) {
          const pms = eJson.data.filter((e: any) => e.role === "PROJECT_MANAGER");
          setProjectManagers(pms);
        }
        if (pJson.success && Array.isArray(pJson.projects || pJson.data)) {
          setProjects(pJson.projects || pJson.data || []);
        }
      })
      .catch((err) => console.warn("Failed loading PMs:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>👔</span> Project Managers Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Super Administrator overview of operational Project Managers and their assigned organizational portfolios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/employees/add"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
          >
            + Add Employee
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-3xl"></div>
          <div className="h-44 bg-slate-100 rounded-3xl"></div>
        </div>
      ) : projectManagers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-xs font-bold space-y-3">
          <p>No designated Project Managers found.</p>
          <Link
            href="/admin/employees"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
          >
            View Employees to Assign PM Role →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projectManagers.map((pm) => {
            const managedProjects = projects.filter(
              (p) => p.projectManagerId === pm.id || p.teamLeaderId === pm.id
            );

            return (
              <div
                key={pm.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {pm.avatarUrl ? (
                      <img src={pm.avatarUrl} alt={pm.name} className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-xs" />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                        {pm.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{pm.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{pm.employeeId} • {pm.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10px] font-black uppercase">
                    Project Manager
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Active Projects</p>
                    <p className="text-base font-black text-slate-900">{managedProjects.length || 1}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Tasks</p>
                    <p className="text-base font-black text-slate-900">{pm.metrics?.totalTasks || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Workload</p>
                    <p className="text-base font-black text-blue-700">{pm.metrics?.workloadLevel || "OPTIMAL"}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Dept: {pm.department?.name || "Operations"}
                  </span>
                  <Link
                    href={`/admin/employees/${pm.employeeId}`}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-xl transition"
                  >
                    View Executive Dossier →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
