"use client";

import React, { useState, useEffect } from "react";

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EmployeeTeamPage() {
  const [teammates, setTeammates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTeammates(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTeammates = teammates.filter((t) => {
    const matchesSearch =
      (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (departmentFilter === "ALL") return matchesSearch;
    const deptName = (t.department?.name || "").toUpperCase();
    return matchesSearch && deptName.includes(departmentFilter.toUpperCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Team Directory
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Project Teammates & Work Distribution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collaborate with engineers, department leads, and project contributors across active OMS initiatives.
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Department Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teammates by name, ID, or email..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "ENGINEERING", "HR", "FINANCE", "SALES"] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                departmentFilter === dept
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Teammates Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      ) : filteredTeammates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="text-3xl">👥</div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">No Teammates Found</h3>
          <p className="text-xs text-slate-500">No teammates match your search or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeammates.map((t) => {
            const initials = getInitials(t.name);

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-md">
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" title="Active & Available"></span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 dark:text-white text-base truncate">{t.name}</h3>
                    <p className="text-xs font-mono font-bold text-blue-600 truncate">{t.employeeId || t.id}</p>
                    <p className="text-[11px] text-slate-400 truncate">{t.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t.department?.name || "Operations"}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                    {t.role || "DEVELOPER"}
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={`mailto:${t.email}`}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 font-extrabold text-xs transition"
                  >
                    ✉️ Send Email Message
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
