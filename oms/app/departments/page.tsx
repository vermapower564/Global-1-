"use client";

import React, { useState, useEffect } from "react";
import {
  IconTerminal,
  IconUserCheck,
  IconRocket,
  IconTrendingUp,
  IconPalette,
  IconVideo,
  IconCoins,
  IconBuilding,
} from "@/components/Icons";

const iconMap: Record<string, any> = {
  "DEP-DEV": IconTerminal,
  "DEP-HR": IconUserCheck,
  "DEP-MKT": IconRocket,
  "DEP-SALES": IconTrendingUp,
  "DEP-DSGN": IconPalette,
  "DEP-CAM": IconVideo,
  "DEP-ACCT": IconCoins,
  "DEP-MGMT": IconBuilding,
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const [newDept, setNewDept] = useState({
    name: "",
    headName: "",
    budget: "1500000",
  });

  // Line 1: Fetch Department Data directly from XAMPP MySQL database via API
  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setDepartments(resData.data);
      }
    } catch (err) {
      console.error("Failed to load departments from database", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Line 2: Save Department Data directly into XAMPP MySQL database (department table)
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess("");

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDept.name,
          headName: newDept.headName,
          budget: newDept.budget,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSaveSuccess("✓ Department record saved directly to XAMPP MySQL Database (department table) via Prisma!");
        setShowAddModal(false);
        setNewDept({ name: "", headName: "", budget: "1500000" });
        fetchDepartments();
      } else {
        alert("Failed to save: " + resData.error);
      }
    } catch (err: any) {
      alert("Error connecting to database: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Phase 1: Department Folder & Database Sync
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Core Company Departments Folder ({departments.length})
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Department records are fetched live from XAMPP MySQL database (`oms` $\rightarrow$ `department` table).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
        >
          + Add New Department to Database
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg border border-emerald-400">
          {saveSuccess}
        </div>
      )}

      {/* Modal: Create Department & Save to MySQL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">Create New Department (Push to XAMPP MySQL)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="e.g. Quality Assurance & Testing"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Department Lead / Manager *</label>
                <input
                  type="text"
                  required
                  value={newDept.headName}
                  onChange={(e) => setNewDept({ ...newDept, headName: e.target.value })}
                  placeholder="e.g. Senior Manager Name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Annual Allocation Budget (₹ INR) *</label>
                <input
                  type="number"
                  required
                  value={newDept.budget}
                  onChange={(e) => setNewDept({ ...newDept, budget: e.target.value })}
                  placeholder="1500000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono font-bold focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition"
                >
                  {loading ? "Saving to MySQL..." : "✓ Save Department to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Department Cards Fetched from Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departments.map((dept) => {
          const IconComp = iconMap[dept.code] || IconBuilding;
          const staffCount = dept.user ? dept.user.length : 12;
          const formattedBudget = `₹${Number(dept.budget || 1500000).toLocaleString()}`;

          return (
            <div
              key={dept.id}
              className="pro-card p-6 flex flex-col justify-between hover:shadow-xl hover:border-red-300 transition border-l-4 border-l-red-600"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {dept.code}
                  </span>
                  <span className="badge badge-success text-[10px]">Optimal</span>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">{dept.name}</h3>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Department Lead: <span className="font-bold text-slate-900">{dept.headName || "Executive Head"}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Headcount</span>
                    <p className="text-xs font-extrabold text-slate-900 mt-0.5">{staffCount} Members</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Budget</span>
                    <p className="text-xs font-mono font-extrabold text-emerald-700 mt-0.5">{formattedBudget}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}