"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Team Directory
          </span>
          <h1 className="text-2xl font-black text-black tracking-tight mt-1">
            Project Teammates & Work Distribution
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Collaborate with engineers, department leads, and project contributors across active OMS initiatives.
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Department Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teammates by name, ID, or email..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-black focus:border-blue-600 focus:outline-none transition"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "ENGINEERING", "HR", "FINANCE", "SALES"] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                departmentFilter === dept
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
          <div className="h-44 bg-gray-100 rounded-3xl"></div>
          <div className="h-44 bg-gray-100 rounded-3xl"></div>
          <div className="h-44 bg-gray-100 rounded-3xl"></div>
        </div>
      ) : filteredTeammates.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
          <div className="text-3xl">👥</div>
          <h3 className="font-extrabold text-black text-base">No Teammates Found</h3>
          <p className="text-xs text-gray-500">No teammates match your search or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeammates.map((t) => {
            const initials = getInitials(t.name);

            return (
              <div
                key={t.id}
                className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-4 hover:border-blue-400 hover:shadow-xs transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-xs">
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" title="Active & Available"></span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/employees/${encodeURIComponent(t.employeeId || t.id)}`}
                      title={`View ${t.name} Profile`}
                      className="font-black text-black hover:text-blue-600 hover:underline text-base truncate block"
                    >
                      {t.name}
                    </Link>
                    <Link
                      href={`/admin/employees/${encodeURIComponent(t.employeeId || t.id)}`}
                      title={`View ${t.name} Profile`}
                      className="text-xs font-mono font-bold text-blue-600 hover:underline truncate block"
                    >
                      {t.employeeId || t.id}
                    </Link>
                    <p className="text-[11px] text-gray-500 truncate">{t.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">{t.department?.name || "Operations"}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {t.role || "DEVELOPER"}
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={`mailto:${t.email}`}
                    className="w-full text-center py-2.5 rounded-xl bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-800 font-extrabold text-xs transition border border-gray-200 shadow-2xs"
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
