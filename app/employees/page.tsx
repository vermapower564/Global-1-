"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";
import EmployeePreviewDrawer from "@/components/EmployeePreviewDrawer";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [workloadFilter, setWorkloadFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Dynamic Selected Employee State for Interactive Selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [availableDepartments, setAvailableDepartments] = useState<string[]>([
    "Development & Engineering",
    "Human Resources",
    "Accounts & Finance",
    "Growth & Sales",
    "UI/UX & Graphic Design",
    "Camera & Video Production",
    "Digital Marketing",
    "Executive Management",
  ]);

  // Quick Preview Drawer Target
  const [previewTarget, setPreviewTarget] = useState<any | null>(null);

  // Reset Password Modal State
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [isResettingPass, setIsResettingPass] = useState(false);

  const loadEmployees = () => {
    setLoading(true);
    fetch("/api/employees")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data.length > 0) {
          setEmployees(resData.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleTakeEmployeeAccess = (emp: any) => {
    setCurrentUserContext({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      activeMode: "EMPLOYEE_USER",
      assignedProjectTitle: emp.currentProjectTitle || "OMS Enterprise System",
    });

    setToastMsg(`🔑 Switched to Employee Access View: ${emp.name} (${emp.employeeId || emp.id})`);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  const handlePerformPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !resetPassword) return;

    setIsResettingPass(true);

    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetTarget.employeeId || resetTarget.id,
          name: resetTarget.name,
          email: resetTarget.email,
          password: resetPassword,
        }),
      });
      setToastMsg(`✓ Password for ${resetTarget.name} reset & Bcrypt hashed in database!`);
    } catch (err) {
      setToastMsg("❌ Failed to reset employee password.");
    } finally {
      setIsResettingPass(false);
      setResetTarget(null);
      setResetPassword("");
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const filtered = employees.filter((emp) => {
    const empName = (emp.name || "").toLowerCase();
    const empId = (emp.employeeId || emp.id || "").toLowerCase();
    const empEmail = (emp.email || "").toLowerCase();
    const empRole = (emp.role || "").toLowerCase();
    const matchesSearch =
      empName.includes(search.toLowerCase()) ||
      empId.includes(search.toLowerCase()) ||
      empEmail.includes(search.toLowerCase()) ||
      empRole.includes(search.toLowerCase());

    const matchesDept = departmentFilter === "All" || (emp.department?.name || emp.department || "").includes(departmentFilter);
    const matchesWorkload = workloadFilter === "All" || emp.metrics?.workloadLevel === workloadFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "ACTIVE" && emp.isActive !== false) ||
      (statusFilter === "INACTIVE" && emp.isActive === false);

    return matchesSearch && matchesDept && matchesWorkload && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-bold text-xs p-4 rounded-xl shadow-md border border-slate-800 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Workforce + Task Intelligence Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Enterprise Employee Workforce Center ({employees.length})
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Click any Employee Name or ID to select and highlight their record.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employees/add"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition shrink-0"
          >
            + Register New Employee
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, ID, Gmail or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs text-black focus:border-blue-600 focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-black font-extrabold focus:outline-none"
          >
            <option value="All">All Workloads</option>
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="OVERLOADED">OVERLOADED</option>
          </select>

          {["All", ...availableDepartments.slice(0, 4)].map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                departmentFilter === dept
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-black font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4 text-black">Employee Name</th>
                <th className="py-3.5 px-4 text-black">Employee ID</th>
                <th className="py-3.5 px-4 text-black">Email</th>
                <th className="py-3.5 px-4 text-black">Department</th>
                <th className="py-3.5 px-4 text-black">Role / Designation</th>
                <th className="py-3.5 px-4 text-black">Current Project</th>
                <th className="py-3.5 px-4 text-black">Active Tasks</th>
                <th className="py-3.5 px-4 text-black">Completed</th>
                <th className="py-3.5 px-4 text-black">Workload</th>
                <th className="py-3.5 px-4 text-black">Status</th>
                <th className="py-3.5 px-4 text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500 text-xs font-medium">
                    {loading ? "Loading workforce records..." : "No employee records found matching your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const empIdStr = emp.employeeId || emp.id;
                  const isSelected = selectedEmployeeId === emp.id || selectedEmployeeId === emp.employeeId;

                  const m = emp.metrics || {
                    totalTasks: 0,
                    activeTasks: 0,
                    completedTasks: 0,
                    pendingTasks: 0,
                    blockedTasks: 0,
                    overdueTasks: 0,
                    progressRate: 100,
                    workloadLevel: "NORMAL",
                  };

                  return (
                    <tr
                      key={emp.id}
                      className={`transition ${
                        isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* DYNAMIC CLICKABLE EMPLOYEE NAME (DEFAULT BLACK -> HOVER BLUE -> CLICK BLUE) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shrink-0">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                          </div>
                          <span
                            onClick={() => setSelectedEmployeeId(isSelected ? null : emp.id)}
                            className={
                              isSelected
                                ? "text-blue-600 font-semibold cursor-pointer text-xs"
                                : "text-black hover:text-blue-600 cursor-pointer font-medium text-xs transition-colors"
                            }
                          >
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      {/* DYNAMIC CLICKABLE EMPLOYEE ID (DEFAULT BLACK -> HOVER BLUE -> CLICK BLUE) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => setSelectedEmployeeId(isSelected ? null : emp.id)}
                            className={
                              isSelected
                                ? "text-blue-600 font-semibold cursor-pointer font-mono text-xs"
                                : "text-black hover:text-blue-600 cursor-pointer font-mono text-xs transition-colors"
                            }
                          >
                            {empIdStr}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(empIdStr);
                              setToastMsg(`✓ Employee ID "${empIdStr}" copied to clipboard.`);
                              setTimeout(() => setToastMsg(null), 3000);
                            }}
                            className="text-[11px] text-gray-500 hover:text-black font-sans p-1 rounded hover:bg-gray-100 transition cursor-pointer"
                            title="Copy Employee ID"
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* EMAIL (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-mono text-xs">
                        {emp.email}
                      </td>

                      {/* DEPARTMENT (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-medium text-xs">
                        {emp.department?.name || emp.department || "Development"}
                      </td>

                      {/* ROLE / DESIGNATION (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-bold text-xs">
                        {emp.role}
                      </td>

                      {/* CURRENT PROJECT (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-medium text-xs">
                        {emp.currentProjectTitle || "OMS Enterprise"}
                      </td>

                      {/* ACTIVE TASKS (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-semibold text-xs">
                        {m.activeTasks} Active
                      </td>

                      {/* COMPLETED (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-semibold text-xs">
                        {m.completedTasks} Done
                      </td>

                      {/* WORKLOAD (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-bold text-xs">
                        {m.workloadLevel}
                      </td>

                      {/* STATUS (READABLE BLACK TEXT) */}
                      <td className="py-3.5 px-4 text-black font-bold text-xs">
                        {emp.isActive !== false ? "Active" : "Inactive"}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewTarget(emp)}
                            className="text-[11px] font-bold text-black bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition cursor-pointer"
                            title="Quick Side Preview Drawer"
                          >
                            👁️ Preview
                          </button>
                          <Link
                            href={`/admin/employees/${empIdStr}`}
                            className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-lg transition"
                          >
                            360° Profile
                          </Link>
                          <button
                            onClick={() => handleTakeEmployeeAccess(emp)}
                            className="text-[11px] font-bold text-black bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition cursor-pointer"
                            title="Take Access"
                          >
                            🔑 Access
                          </button>
                          <button
                            onClick={() => setResetTarget(emp)}
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white px-2 py-1 rounded-lg transition cursor-pointer"
                            title="Reset Password"
                          >
                            🔒 Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Preview Drawer */}
      <EmployeePreviewDrawer
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        employee={previewTarget}
      />

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-gray-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-black">Reset Employee Password</h3>
                <p className="text-xs text-gray-500">For {resetTarget.name} ({resetTarget.employeeId || resetTarget.id})</p>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-black font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handlePerformPasswordReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">New Employee Password *</label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new secure password..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none transition text-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPass}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition shadow-md"
                >
                  {isResettingPass ? "Saving Hash..." : "🔒 Save New Bcrypt Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}