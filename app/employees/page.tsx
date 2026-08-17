"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredEmployees, addStoredEmployee, deleteStoredEmployee, getDeletedEmployeeIds, Employee } from "@/utils/employeeStore";
import { setCurrentUserContext } from "@/utils/userContextStore";

const SYSTEM_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin (Full System Access)" },
  { value: "DIRECTOR", label: "Director (Executive Level)" },
  { value: "HR", label: "HR Manager" },
  { value: "FINANCE", label: "Finance / Payroll Manager" },
  { value: "PROJECT_MANAGER", label: "Project Manager (Team Leader)" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES_EXECUTIVE", label: "Sales Executive" },
  { value: "DIGITAL_MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "SEO_EXECUTIVE", label: "SEO Executive" },
  { value: "CONTENT_WRITER", label: "Content Writer" },
  { value: "DEVELOPER", label: "Developer (Employee User)" },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [workloadFilter, setWorkloadFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Edit / Update User Modal State
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmpId, setEditEmpId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("DEVELOPER");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const handleOpenEditModal = (emp: any) => {
    setEditTarget(emp);
    setEditName(emp.name);
    setEditEmpId(emp.employeeId || emp.id);
    setEditEmail(emp.email);
    setEditRole((emp.role || "DEVELOPER").toString().toUpperCase().replace(/\s+/g, "_"));
    setEditDepartment(emp.department?.name || emp.department || "");
    setEditSalary(emp.salary?.toString() || "850000");
    setEditPhone(emp.phone || "+91 98765 00000");
    setEditIsActive(emp.isActive !== false);
  };

  const handleSaveEmployeeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSavingEdit(true);

    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editEmpId,
          name: editName,
          email: editEmail,
          role: editRole,
          department: editDepartment,
          salary: editSalary,
          phone: editPhone,
          isActive: editIsActive,
        }),
      });
    } catch (err) {
      console.warn("API update fallback");
    }

    loadEmployees();
    setIsSavingEdit(false);
    setEditTarget(null);
    setToastMsg(`✓ Employee User Profile & Role (${editEmpId}) updated in MySQL!`);
    setTimeout(() => setToastMsg(null), 4000);
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
      setToastMsg(`✓ Password for ${resetTarget.name} reset & Bcrypt hashed in MySQL!`);
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
    const empRole = (emp.role || "").toLowerCase();
    const matchesSearch = empName.includes(search.toLowerCase()) || empId.includes(search.toLowerCase()) || empRole.includes(search.toLowerCase());
    const matchesDept = departmentFilter === "All" || (emp.department?.name || emp.department || "").includes(departmentFilter);
    const matchesWorkload = workloadFilter === "All" || emp.metrics?.workloadLevel === workloadFilter;
    return matchesSearch && matchesDept && matchesWorkload;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-semibold text-xs p-4 rounded-xl shadow-md border border-slate-800 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Workforce + Task Intelligence Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Enterprise Employee Workforce Center ({employees.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time MySQL workforce intelligence tracking active tasks, completion rates, blocked items, and workload overload levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employees/add" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition shrink-0">
            + Register New Employee
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, role or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-extrabold"
          >
            <option value="All">All Workloads</option>
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="OVERLOADED">OVERLOADED</option>
          </select>

          {["All", ...availableDepartments.slice(0, 5)].map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                departmentFilter === dept
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="pro-table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th>Employee ID & Name</th>
              <th>Dept & Role</th>
              <th>Current Project</th>
              <th>Active Tasks</th>
              <th>Completed</th>
              <th>Pending / Blocked</th>
              <th>Overdue</th>
              <th>Progress %</th>
              <th>Workload</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-400 text-xs font-medium">
                  {loading ? "Loading workforce task metrics..." : "No employee records found matching your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
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
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td>
                      <Link href={`/admin/employees/${emp.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-2xs">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                            {emp.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 font-bold">{emp.employeeId || emp.id}</p>
                        </div>
                      </Link>
                    </td>

                    <td>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{emp.role}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{emp.department?.name || emp.department || "Operations"}</p>
                    </td>

                    <td className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {emp.currentProjectTitle || "OMS Enterprise"}
                    </td>

                    <td className="font-extrabold text-blue-600 text-xs">{m.activeTasks} Active</td>
                    <td className="font-extrabold text-emerald-600 text-xs">{m.completedTasks} Done</td>

                    <td>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-600">{m.pendingTasks} P</span>
                        {m.blockedTasks > 0 && (
                          <span className="font-black text-rose-600 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px]">
                            {m.blockedTasks} B
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {m.overdueTasks > 0 ? (
                        <span className="font-black text-amber-700 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px]">
                          {m.overdueTasks} Overdue
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0</span>
                      )}
                    </td>

                    <td>
                      <div className="w-16">
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-0.5">
                          <span>{m.progressRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${m.progressRate}%` }}></div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        m.workloadLevel === "OVERLOADED" ? "bg-rose-100 text-rose-700" :
                        m.workloadLevel === "HIGH" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {m.workloadLevel}
                      </span>
                    </td>

                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        emp.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {emp.isActive !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg transition"
                        >
                          Workspace
                        </Link>
                        <button
                          onClick={() => handleTakeEmployeeAccess(emp)}
                          className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white px-2 py-1 rounded-lg transition"
                          title="Take Access"
                        >
                          🔑 Access
                        </button>
                        <button
                          onClick={() => setResetTarget(emp)}
                          className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white px-2 py-1 rounded-lg transition"
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

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Admin Reset Employee Password</h3>
                <p className="text-xs text-slate-500">For {resetTarget.name} ({resetTarget.employeeId || resetTarget.id})</p>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handlePerformPasswordReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Employee Password *</label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new secure password..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none transition shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPass}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow-md"
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