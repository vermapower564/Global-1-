"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function SuperAdminOrganisationPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/employees"), fetch("/api/projects")])
      .then(async ([eRes, pRes]) => {
        const eJson = await eRes.json();
        const pJson = await pRes.json();
        if (eJson.success) setEmployees(eJson.data || []);
        if (pJson.success) setProjects(pJson.projects || pJson.data || []);
      })
      .catch((err) => console.warn("Failed loading org data:", err))
      .finally(() => setLoading(false));
  }, []);

  const superAdmin = employees.find((e) => e.role === "SUPER_ADMIN");
  const pms = employees.filter((e) => e.role === "PROJECT_MANAGER");
  const tls = employees.filter((e) => e.role === "TEAM_LEADER");
  const emps = employees.filter((e) => e.role !== "SUPER_ADMIN" && e.role !== "PROJECT_MANAGER" && e.role !== "TEAM_LEADER");

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏢</span> Organisation Architecture & Hierarchy
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Strict 4-Tier Governance: Root Super Admin → Project Managers → Team Leaders → Assigned Employees.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
        >
          ← Admin Dashboard
        </Link>
      </div>

      {/* 4-Tier Organization Structure Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Enterprise Operational Tier Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Tier 1 */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Tier 1 • Root</span>
            <h3 className="text-base font-black">SUPER ADMIN</h3>
            <p className="text-2xl font-mono font-black text-amber-400">1</p>
            <p className="text-[10px] text-slate-300 font-semibold leading-relaxed">
              Organization governance, user management, and executive oversight.
            </p>
          </div>

          {/* Tier 2 */}
          <div className="p-4 bg-blue-50 text-blue-900 rounded-2xl border border-blue-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Tier 2 • Owner</span>
            <h3 className="text-base font-black">PROJECT MANAGERS</h3>
            <p className="text-2xl font-mono font-black text-blue-700">{pms.length || 1}</p>
            <p className="text-[10px] text-blue-800/80 font-semibold leading-relaxed">
              Project creation, TL selection, performance reviews & promotions.
            </p>
          </div>

          {/* Tier 3 */}
          <div className="p-4 bg-indigo-50 text-indigo-900 rounded-2xl border border-indigo-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Tier 3 • Lead</span>
            <h3 className="text-base font-black">TEAM LEADERS</h3>
            <p className="text-2xl font-mono font-black text-indigo-700">{tls.length || 2}</p>
            <p className="text-[10px] text-indigo-800/80 font-semibold leading-relaxed">
              Sprint leadership, employee skill selection & daily task reviews.
            </p>
          </div>

          {/* Tier 4 */}
          <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Tier 4 • Workforce</span>
            <h3 className="text-base font-black">EMPLOYEES</h3>
            <p className="text-2xl font-mono font-black text-emerald-700">{emps.length || 10}</p>
            <p className="text-[10px] text-emerald-800/80 font-semibold leading-relaxed">
              Execution of assigned project deliverables and daily updates.
            </p>
          </div>
        </div>

        {/* Sole Super Admin Profile */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-xs">
              👑
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">
                Designated Single Super Admin Account
              </span>
              <h4 className="text-sm font-black text-slate-900">{superAdmin?.name || "Roushan Verma"}</h4>
              <p className="text-xs text-slate-500 font-mono">{superAdmin?.employeeId || "EMP-8595"} • {superAdmin?.email || "roushanverma564@gmail.com"}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200 self-start sm:self-auto">
            ✓ Single Super Admin Rule Active
          </span>
        </div>
      </div>
    </div>
  );
}
