"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { IconUsers, IconSearch, IconFileText, IconCalendar } from "@/components/Icons";

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "NEW_JOINERS">("ALL");

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    department: "Engineering & Development",
    role: "Software Developer",
    phone: "",
    employeeId: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data || json.employees)) {
        setEmployees(json.data || json.employees);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const deptName = typeof e.department === "string" ? e.department : e.department?.name || e.departmentName;
      if (deptName) {
        set.add(deptName);
      }
    });
    return Array.from(set);
  }, [employees]);

  const sixtyDaysAgo = useMemo(() => new Date(Date.now() - 60 * 24 * 3600 * 1000), []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Status Tab filter
      if (statusTab === "ACTIVE" && !emp.isActive) return false;
      if (statusTab === "INACTIVE" && emp.isActive) return false;
      if (statusTab === "NEW_JOINERS") {
        if (!emp.joiningDate || new Date(emp.joiningDate) < sixtyDaysAgo) return false;
      }

      // 2. Department filter
      if (deptFilter !== "ALL") {
        const empDept = (
          typeof emp.department === "string"
            ? emp.department
            : emp.department?.name || emp.departmentName || ""
        ).toUpperCase();
        if (empDept !== deptFilter.toUpperCase()) return false;
      }

      // 3. Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const name = (emp.name || "").toLowerCase();
        const email = (emp.email || "").toLowerCase();
        const empId = (emp.employeeId || "").toLowerCase();
        const role = (emp.role || "").toLowerCase();
        if (!name.includes(query) && !email.includes(query) && !empId.includes(query) && !role.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [employees, statusTab, deptFilter, search, sixtyDaysAgo]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Onboarding invitation sent to ${inviteForm.email}!`);
        setShowInviteModal(false);
        setInviteForm({
          name: "",
          email: "",
          department: "Engineering & Development",
          role: "Software Developer",
          phone: "",
          employeeId: "",
        });
        fetchEmployees();
      } else {
        alert(json.error || "Failed to dispatch invitation");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSending(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Employee Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>👥</span> Workforce & Employee Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Comprehensive directory of registered team members, active status, department mapping, and HR profile management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>✉️</span> + Invite New Employee
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setStatusTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Employees ({employees.length})
            </button>
            <button
              onClick={() => setStatusTab("ACTIVE")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "ACTIVE" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🟢 Active ({employees.filter((e) => e.isActive).length})
            </button>
            <button
              onClick={() => setStatusTab("INACTIVE")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "INACTIVE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ⚪ Inactive ({employees.filter((e) => !e.isActive).length})
            </button>
            <button
              onClick={() => setStatusTab("NEW_JOINERS")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                statusTab === "NEW_JOINERS" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🚀 New Joiners ({employees.filter((e) => e.joiningDate && new Date(e.joiningDate) >= sixtyDaysAgo).length})
            </button>
          </div>

          <div className="text-xs text-slate-400 font-bold">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by employee name, ID, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-64 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Joining Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    Loading workforce directory...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            {emp.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/hr/employees/${emp.id || emp.employeeId}`}
                            className="font-black text-slate-900 group-hover:text-blue-600 transition"
                          >
                            {emp.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{emp.employeeId}</td>
                    <td className="py-3 px-3 text-slate-700 font-bold">{emp.department || emp.departmentName || "Engineering"}</td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{emp.role?.replace(/_/g, " ")}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{emp.phone || "—"}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {emp.joiningDate ? new Date(emp.joiningDate).toISOString().split("T")[0] : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          emp.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/hr/employees/${emp.id || emp.employeeId}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs transition inline-block cursor-pointer"
                      >
                        HR Profile →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Joinee Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Send Onboarding Invitation</h3>
                <p className="text-xs text-slate-400 font-medium">Dispatches email token activation link to joinee.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 font-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Candidate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Department</label>
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Engineering & Development">Engineering & Development</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Sales & Growth">Sales & Growth</option>
                    <option value="Design & Creative">Design & Creative</option>
                    <option value="Marketing & SEO">Marketing & SEO</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Developer"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Employee ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={inviteForm.employeeId}
                    onChange={(e) => setInviteForm({ ...inviteForm, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 text-[11px] rounded-xl border border-blue-200 font-medium">
                🛡️ HR sends an activation link to the joinee. Joinees create their own password during registration.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? "Dispatching Email..." : "✉️ Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
