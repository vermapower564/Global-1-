"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconBuilding, IconUsers, IconSearch, IconTerminal, IconUserCheck } from "@/components/Icons";

export default function HRDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees"),
      ]);
      const deptJson = await deptRes.json();
      const empJson = await empRes.json();

      if (deptJson.success && Array.isArray(deptJson.data)) {
        setDepartments(deptJson.data);
      }
      if (empJson.success && Array.isArray(empJson.data)) {
        setEmployees(empJson.data);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrichedDepartments = departments.map((dept) => {
    const deptEmployees = employees.filter((e) => {
      const eDept = typeof e.department === "string" ? e.department : e.department?.name || e.departmentName;
      return eDept?.toLowerCase() === dept.name?.toLowerCase() || e.departmentId === dept.id;
    });

    const activeCount = deptEmployees.filter((e) => e.isActive).length;

    return {
      ...dept,
      totalEmployees: deptEmployees.length,
      activeEmployees: activeCount,
      members: deptEmployees,
    };
  });

  const filteredDepts = enrichedDepartments.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.headName?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse p-4 font-sans">
        <div className="h-28 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-20">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              Human Resources Portal
            </span>
            <span className="text-xs font-bold text-slate-400">• Organisational Units</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏢</span> Departments & Headcount
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of company functional departments, workforce distribution, and department heads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search department..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
            />
            <span className="absolute right-3.5 top-3 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepts.map((dept) => (
          <div
            key={dept.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-lg flex items-center justify-center border border-indigo-100 shadow-2xs">
                  🏢
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{dept.name}</h3>
                  <span className="text-[11px] font-mono font-bold text-slate-400">{dept.code || "DEPT"}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                {dept.activeEmployees} Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Staff</span>
                <span className="font-mono text-base font-black text-slate-900">{dept.totalEmployees}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-indigo-500 block">Head of Dept</span>
                <span className="text-xs font-black text-indigo-900 truncate block">
                  {dept.headName || "Leadership"}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <Link
                href={`/hr/employees?dept=${encodeURIComponent(dept.name)}`}
                className="block w-full py-2 text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
              >
                View {dept.totalEmployees} Department Members →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
