"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredEmployees, addStoredEmployee, deleteStoredEmployee, getDeletedEmployeeIds, Employee } from "@/utils/employeeStore";
import { setCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"directory" | "hierarchy">("directory");
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

  // Delete User Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit / Update User Modal State
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmpId, setEditEmpId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch dynamic departments
  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          const deptNames = json.data.map((d: any) => d.name);
          const combined = Array.from(new Set([...deptNames, ...availableDepartments]));
          setAvailableDepartments(combined);
        }
      })
      .catch((err) => console.warn("Failed to fetch departments list:", err));
  }, []);

  // Fetch employees from XAMPP MySQL database API on load / refresh
  const loadEmployees = () => {
    const deletedIds = getDeletedEmployeeIds();
    const localEmps = getStoredEmployees().filter(
      (emp) => !deletedIds.includes(emp.id) && !deletedIds.includes(emp.email)
    );

    setEmployees(localEmps);

    fetch("/api/employees")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data.length > 0) {
          const mapped: Employee[] = resData.data
            .filter(
              (item: any) =>
                !deletedIds.includes(item.employeeId) &&
                !deletedIds.includes(item.id) &&
                !deletedIds.includes(item.email)
            )
            .map((item: any, idx: number) => ({
              id: item.employeeId || item.id || `EMP-${1000 + idx}`,
              name: item.name,
              email: item.email,
              department: item.department?.name || item.department || "Development & Engineering",
              role: item.role ? item.role.replace(/_/g, " ") : "Developer",
              salary: item.salary
                ? item.salary.toString().startsWith("₹")
                  ? item.salary
                  : `₹${Number(item.salary).toLocaleString()}`
                : "₹8,50,000",
              joiningDate: item.joiningDate ? new Date(item.joiningDate).toISOString().split("T")[0] : "2026-01-01",
              status: item.isActive === false ? "On Leave" : "Active",
              avatar: item.name
                ? item.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "RV",
              phone: item.phone || "+91 98765 00000",
              reportingManager: "Executive Board",
            }));

          const combined = [...mapped];
          localEmps.forEach((loc) => {
            if (
              !deletedIds.includes(loc.id) &&
              !deletedIds.includes(loc.email) &&
              !combined.some((c) => c.email.toLowerCase() === loc.email.toLowerCase() || c.id === loc.id)
            ) {
              combined.push(loc);
            }
          });

          setEmployees(combined);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ✏️ Open Edit Employee Profile Modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditTarget(emp);
    setEditName(emp.name);
    setEditEmpId(emp.id);
    setEditEmail(emp.email);
    setEditRole(emp.role);
    setEditDepartment(emp.department);
    setEditSalary(emp.salary || "₹85,000");
    setEditPhone(emp.phone || "+91 98765 00000");
  };

  // ✏️ Save Edited Employee Profile & ID
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
        }),
      });
    } catch (err) {
      console.warn("API update fallback");
    }

    addStoredEmployee({
      id: editEmpId,
      name: editName,
      email: editEmail,
      role: editRole,
      department: editDepartment,
      salary: editSalary,
      phone: editPhone,
    });

    loadEmployees();
    setIsSavingEdit(false);
    setEditTarget(null);

    setToastMsg(`✓ Employee User Profile & ID (${editEmpId}) updated successfully!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 🗑️ Handle Permanently Deleting Employee User Account
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const targetId = deleteTarget.id;
    const targetName = deleteTarget.name;

    try {
      await fetch(`/api/employees?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("API delete fallback");
    }

    const updated = deleteStoredEmployee(targetId);
    setEmployees(updated);
    setIsDeleting(false);
    setDeleteTarget(null);

    setToastMsg(`✓ Employee User "${targetName}" (ID: ${targetId}) deleted permanently!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === "All" || emp.department.includes(departmentFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Workforce Directory
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Enterprise Directory & Records ({employees.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage corporate staff profiles, roles, assigned employee IDs, and accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === "directory" ? "hierarchy" : "directory")}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
          >
            {viewMode === "directory" ? "🌳 View Organizational Tree" : "📋 View Directory Table"}
          </button>
          <Link href="/employees/add" className="bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-4 py-2.5 rounded-lg transition shrink-0">
            + Add Employee
          </Link>
        </div>
      </div>

      {/* Directory Table */}
      {viewMode === "directory" && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by name, role or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {["All", ...availableDepartments.slice(0, 6)].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    departmentFilter === dept
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Role & Department</th>
                  <th>Compensation (₹)</th>
                  <th>Contact Info</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-medium">
                      {loading ? "Loading employee records..." : "No employee records found matching your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => (
                    <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white text-xs font-bold transition-all">
                            {emp.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-slate-900 dark:group-hover:text-white">{emp.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 group-hover:text-red-600 transition-colors font-bold">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{emp.role}</p>
                        <p className="text-xs text-slate-500 font-medium">{emp.department}</p>
                      </td>
                      <td className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                        {emp.salary?.toString().startsWith("₹")
                          ? emp.salary
                          : `₹${Number(emp.salary?.toString().replace(/[^0-9.]/g, "") || 850000).toLocaleString()}`}
                      </td>
                      <td className="text-xs">
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{emp.email}</p>
                        <p className="text-slate-500 font-mono">{emp.phone || "+91 98765 00000"}</p>
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{emp.joiningDate}</td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/employees/id`}
                            onClick={() => {
                              setCurrentUserContext({
                                id: emp.id,
                                name: emp.name,
                                email: emp.email,
                                role: emp.role,
                                activeMode: "EMPLOYEE_USER",
                                assignedProjectTitle: "OMS Enterprise Applications",
                              });
                            }}
                            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            Profile
                          </Link>

                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1"
                            title={`Edit ${emp.name}`}
                          >
                            <span className="text-slate-400 hover:text-amber-600 transition-colors">✏️</span> Edit
                          </button>

                          <button
                            onClick={() => setDeleteTarget(emp)}
                            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center gap-1"
                            title={`Delete ${emp.name}`}
                          >
                            <span className="text-slate-400 hover:text-rose-600 transition-colors">🗑️</span> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit Employee Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Update Employee Profile</h3>
                <p className="text-xs text-slate-500">Edit details for {editTarget.name}</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={editEmpId}
                    onChange={(e) => setEditEmpId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">10-Digit Phone *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 🏢 Dynamic Department Dropdown Select */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Choose Department *</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium text-slate-900 dark:text-white"
                  >
                    {availableDepartments.map((deptName) => (
                      <option key={deptName} value={deptName}>
                        🏢 {deptName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Annual Salary (₹) *</label>
                <input
                  type="text"
                  required
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white font-bold text-xs px-5 py-2 rounded-lg transition"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}