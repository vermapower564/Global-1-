"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type TierType = "SUPER_ADMIN" | "PROJECT_MANAGER" | "TEAM_LEADER" | "EMPLOYEE";

export default function SuperAdminOrganisationPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierType>("PROJECT_MANAGER");

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

  const superAdmin = employees.filter((e) => e.role === "SUPER_ADMIN");
  const pms = employees.filter((e) => e.role === "PROJECT_MANAGER");
  const tls = employees.filter((e) => e.role === "TEAM_LEADER");
  const emps = employees.filter(
    (e) => e.role !== "SUPER_ADMIN" && e.role !== "PROJECT_MANAGER" && e.role !== "TEAM_LEADER"
  );

  const getTierMembers = (tier: TierType) => {
    switch (tier) {
      case "SUPER_ADMIN":
        return superAdmin;
      case "PROJECT_MANAGER":
        return pms;
      case "TEAM_LEADER":
        return tls;
      case "EMPLOYEE":
        return emps;
    }
  };

  const getTierMeta = (tier: TierType) => {
    switch (tier) {
      case "SUPER_ADMIN":
        return {
          title: "Super Administrator",
          badge: "Tier 1 • Root Governance",
          desc: "Organization governance, user management, and executive oversight. Sole root organization account.",
          icon: "👑",
        };
      case "PROJECT_MANAGER":
        return {
          title: "Project Managers",
          badge: "Tier 2 • Operational Owner",
          desc: "Owns deliverables, defines technical requirements, assigns Team Leaders, evaluates multi-factor performance, and executes promotions.",
          icon: "🚀",
        };
      case "TEAM_LEADER":
        return {
          title: "Team Leaders",
          badge: "Tier 3 • Technical Lead",
          desc: "Leads sprint teams, selects employees based on matching skills & workload capacity, delegates sectioned tasks, and reviews daily work updates.",
          icon: "👥",
        };
      case "EMPLOYEE":
        return {
          title: "Employees & Workforce",
          badge: "Tier 4 • Execution Workforce",
          desc: "Executes project deliverables, submits daily updates with git commits/proofs, and collaborates strictly within assigned projects.",
          icon: "💻",
        };
    }
  };

  const activeMeta = getTierMeta(selectedTier);
  const activeMembers = getTierMembers(selectedTier);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏢</span> Organisation Architecture & Hierarchy
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Strict 4-Tier Governance. Click on any role to explore active members, responsibilities, and portfolios.
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

      {/* 4-Tier Organization Interactive Selection Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Select Operational Tier to View Details
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            Click any card to switch view ⬇️
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tier 1: SUPER ADMIN */}
          <button
            type="button"
            onClick={() => setSelectedTier("SUPER_ADMIN")}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedTier === "SUPER_ADMIN"
                ? "bg-slate-950 text-white border-amber-400 ring-4 ring-amber-400/40 shadow-xl scale-[1.02]"
                : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedTier === "SUPER_ADMIN"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                Tier 1 • Root
              </span>
              <span className="text-base">👑</span>
            </div>
            <div>
              <h3 className="text-sm font-black">SUPER ADMIN</h3>
              <p
                className={`text-2xl font-mono font-black mt-1 ${
                  selectedTier === "SUPER_ADMIN" ? "text-amber-400" : "text-slate-900"
                }`}
              >
                {superAdmin.length || 1}
              </p>
            </div>
            <p
              className={`text-[10px] font-medium leading-relaxed ${
                selectedTier === "SUPER_ADMIN" ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Root organization governance & user security.
            </p>
          </button>

          {/* Tier 2: PROJECT MANAGERS */}
          <button
            type="button"
            onClick={() => setSelectedTier("PROJECT_MANAGER")}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedTier === "PROJECT_MANAGER"
                ? "bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/40 shadow-xl scale-[1.02]"
                : "bg-blue-50/60 text-slate-800 border-blue-200 hover:border-blue-300 hover:bg-blue-100/60"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedTier === "PROJECT_MANAGER"
                    ? "bg-white text-blue-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                Tier 2 • Owner
              </span>
              <span className="text-base">🚀</span>
            </div>
            <div>
              <h3 className="text-sm font-black">PROJECT MANAGERS</h3>
              <p
                className={`text-2xl font-mono font-black mt-1 ${
                  selectedTier === "PROJECT_MANAGER" ? "text-white" : "text-blue-700"
                }`}
              >
                {pms.length || 1}
              </p>
            </div>
            <p
              className={`text-[10px] font-medium leading-relaxed ${
                selectedTier === "PROJECT_MANAGER" ? "text-blue-100" : "text-slate-500"
              }`}
            >
              Project creation, TL assignment & promotions.
            </p>
          </button>

          {/* Tier 3: TEAM LEADERS */}
          <button
            type="button"
            onClick={() => setSelectedTier("TEAM_LEADER")}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedTier === "TEAM_LEADER"
                ? "bg-indigo-600 text-white border-indigo-400 ring-4 ring-indigo-500/40 shadow-xl scale-[1.02]"
                : "bg-indigo-50/60 text-slate-800 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-100/60"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedTier === "TEAM_LEADER"
                    ? "bg-white text-indigo-800"
                    : "bg-indigo-100 text-indigo-800"
                }`}
              >
                Tier 3 • Lead
              </span>
              <span className="text-base">👥</span>
            </div>
            <div>
              <h3 className="text-sm font-black">TEAM LEADERS</h3>
              <p
                className={`text-2xl font-mono font-black mt-1 ${
                  selectedTier === "TEAM_LEADER" ? "text-white" : "text-indigo-700"
                }`}
              >
                {tls.length || 2}
              </p>
            </div>
            <p
              className={`text-[10px] font-medium leading-relaxed ${
                selectedTier === "TEAM_LEADER" ? "text-indigo-100" : "text-slate-500"
              }`}
            >
              Skill-based assignment, tasks & daily reviews.
            </p>
          </button>

          {/* Tier 4: EMPLOYEES */}
          <button
            type="button"
            onClick={() => setSelectedTier("EMPLOYEE")}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedTier === "EMPLOYEE"
                ? "bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/40 shadow-xl scale-[1.02]"
                : "bg-emerald-50/60 text-slate-800 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100/60"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedTier === "EMPLOYEE"
                    ? "bg-white text-emerald-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                Tier 4 • Workforce
              </span>
              <span className="text-base">💻</span>
            </div>
            <div>
              <h3 className="text-sm font-black">EMPLOYEES</h3>
              <p
                className={`text-2xl font-mono font-black mt-1 ${
                  selectedTier === "EMPLOYEE" ? "text-white" : "text-emerald-700"
                }`}
              >
                {emps.length || 10}
              </p>
            </div>
            <p
              className={`text-[10px] font-medium leading-relaxed ${
                selectedTier === "EMPLOYEE" ? "text-emerald-100" : "text-slate-500"
              }`}
            >
              Deliverable execution & daily work logs.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Tier Details & Member Directory */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
        {/* Tier Details Header Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shadow-xs">
              {activeMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {activeMeta.badge}
                </span>
                <span className="text-xs font-black px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {activeMembers.length} Active {activeMembers.length === 1 ? "Member" : "Members"}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">{activeMeta.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
                {activeMeta.desc}
              </p>
            </div>
          </div>

          {selectedTier === "PROJECT_MANAGER" && (
            <Link
              href="/admin/project-managers"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition shrink-0"
            >
              PM Command Directory →
            </Link>
          )}

          {selectedTier === "TEAM_LEADER" && (
            <Link
              href="/project-manager/team-leaders"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition shrink-0"
            >
              Manage Team Leaders →
            </Link>
          )}
        </div>

        {/* Member Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <div className="h-36 bg-slate-100 rounded-2xl"></div>
            <div className="h-36 bg-slate-100 rounded-2xl"></div>
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-3">
            <p className="text-xs font-bold">No accounts currently assigned to this tier.</p>
            <Link
              href="/employees/add"
              className="inline-block px-4 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-xs"
            >
              + Add {activeMeta.title}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMembers.map((member) => {
              const assignedProjects = projects.filter(
                (p) =>
                  p.projectManagerId === member.id ||
                  p.teamLeaderId === member.id ||
                  (p.teamMembers || []).some((m: any) => m.id === member.id)
              );

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-11 w-11 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                          {member.name ? member.name.substring(0, 2).toUpperCase() : "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {member.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {member.employeeId}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[9px] font-black border border-slate-200 shrink-0">
                      {member.role.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Skills / Details */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold">Dept:</span>
                      <span className="font-semibold text-slate-800">
                        {member.department?.name || member.departmentName || "Engineering"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold">Projects:</span>
                      <span className="font-semibold text-blue-700">
                        {assignedProjects.length} Active {assignedProjects.length === 1 ? "Project" : "Projects"}
                      </span>
                    </div>

                    {member.skills && (
                      <div className="text-[10px] text-slate-500 truncate" title={member.skills}>
                        <span className="font-bold">Skills:</span> {member.skills}
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      Joined: {new Date(member.joiningDate || member.createdAt).getFullYear()}
                    </span>
                    <Link
                      href={`/admin/employees/${member.employeeId}`}
                      className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Full Profile →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
