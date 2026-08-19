"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";
import EmployeePreviewDrawer from "@/components/EmployeePreviewDrawer";
import { IconFolder, IconUsers, IconSearch, IconStar, IconZap, IconPhone } from "@/components/Icons";

interface DepartmentFolderInfo {
  name: string;
  code: string;
  icon: string;
  color: string;
  employees: any[];
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Folder View States: null (folder grid), "ALL_EMPLOYEES", or specific department name
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"FOLDERS" | "TABLE">("FOLDERS");

  // Inspection Drawer Target
  const [previewTarget, setPreviewTarget] = useState<any | null>(null);

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

  // Standardize department names and group into folders
  const departmentConfig: Record<string, { code: string; icon: string; color: string }> = {
    "Development & Engineering": { code: "ENG", icon: "💻", color: "blue" },
    "Executive Management": { code: "EXEC", icon: "🏢", color: "slate" },
    "Human Resources": { code: "HR", icon: "👥", color: "purple" },
    "Accounts & Finance": { code: "FIN", icon: "💰", color: "emerald" },
    "Sales & CRM": { code: "SALES", icon: "📈", color: "amber" },
    "Digital Marketing": { code: "MKTG", icon: "🚀", color: "pink" },
    "Camera & Media Production": { code: "MEDIA", icon: "🎬", color: "rose" },
    "Design & Social Media": { code: "DESIGN", icon: "🎨", color: "indigo" },
  };

  const getNormalizedDept = (deptName?: string | any): string => {
    const raw = typeof deptName === "object" ? deptName?.name : deptName;
    if (!raw) return "Development & Engineering";
    if (raw.includes("Engineering") || raw.includes("Development")) return "Development & Engineering";
    if (raw.includes("Executive") || raw.includes("Management")) return "Executive Management";
    if (raw.includes("HR") || raw.includes("Human")) return "Human Resources";
    if (raw.includes("Finance") || raw.includes("Accounts")) return "Accounts & Finance";
    if (raw.includes("Sales") || raw.includes("Growth")) return "Sales & CRM";
    if (raw.includes("Marketing") || raw.includes("SEO")) return "Digital Marketing";
    if (raw.includes("Camera") || raw.includes("Video") || raw.includes("Media")) return "Camera & Media Production";
    if (raw.includes("Design") || raw.includes("Social")) return "Design & Social Media";
    return raw;
  };

  // Group employees into folders
  const foldersMap: Record<string, DepartmentFolderInfo> = {};

  // Initialize known folders
  Object.keys(departmentConfig).forEach((dept) => {
    foldersMap[dept] = {
      name: dept,
      code: departmentConfig[dept].code,
      icon: departmentConfig[dept].icon,
      color: departmentConfig[dept].color,
      employees: [],
    };
  });

  employees.forEach((emp) => {
    const normDept = getNormalizedDept(emp.department);
    if (!foldersMap[normDept]) {
      foldersMap[normDept] = {
        name: normDept,
        code: normDept.slice(0, 3).toUpperCase(),
        icon: "📁",
        color: "blue",
        employees: [],
      };
    }
    foldersMap[normDept].employees.push(emp);
  });

  const departmentFolders = Object.values(foldersMap).filter((f) => f.employees.length > 0);

  // Filtered employees inside the active folder
  const currentFolderEmployees = (() => {
    let sourceList: any[] = [];
    if (activeFolder === "ALL_EMPLOYEES") {
      sourceList = employees;
    } else if (activeFolder && foldersMap[activeFolder]) {
      sourceList = foldersMap[activeFolder].employees;
    }

    const q = search.toLowerCase();
    return sourceList.filter((emp) => {
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.role?.toLowerCase().includes(q) ||
        getNormalizedDept(emp.department).toLowerCase().includes(q)
      );
    });
  })();

  const allFilteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employeeId?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-bold text-xs p-4 rounded-2xl shadow-lg border border-slate-800 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Workforce Intelligence
            </span>
            <span className="text-xs font-bold text-slate-500">
              • {employees.length} Active Staff Members
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Organization Workforce Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Browse staff organized into Department Folders or open the <strong>Master All Employees Folder</strong>. Click on any employee ID to inspect their mobile number, complete statuses, and verified customer reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setViewMode("FOLDERS");
                setActiveFolder(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "FOLDERS" && !activeFolder
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📁</span>
              <span>Folders View</span>
            </button>
            <button
              onClick={() => {
                setViewMode("TABLE");
                setActiveFolder(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TABLE"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📄</span>
              <span>All Staff List</span>
            </button>
          </div>

          <Link
            href="/employees/add"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0"
          >
            + New Employee
          </Link>
        </div>
      </div>

      {/* LEVEL 1: DEPARTMENT FOLDERS VIEW (DEFAULT SCREEN) */}
      {viewMode === "FOLDERS" && !activeFolder && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>📁</span>
              <span>Workforce Folders ({departmentFolders.length + 1} Folders Available)</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Click folder to expand employees</span>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 mt-3">Organizing employee folders...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* 🌟 1. SPECIAL MASTER FOLDER: ALL EMPLOYEES (USER REQUIREMENT) */}
              <div
                onClick={() => setActiveFolder("ALL_EMPLOYEES")}
                className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-blue-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                      🗂️
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 font-mono text-[11px] font-black">
                      {employees.length} Total Staff
                    </span>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block">
                    Master Workforce Directory
                  </span>
                  <h3 className="font-black text-white text-lg group-hover:text-blue-300 transition">
                    All Employees Folder
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                    Access all {employees.length} organization employees across every department in one unified workspace.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    Full Staff Ledger & Statuses
                  </span>
                  <span className="text-xs font-black text-blue-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Open Master Folder</span>
                    <span>→</span>
                  </span>
                </div>
              </div>

              {/* 2. SPECIFIC DEPARTMENT FOLDERS */}
              {departmentFolders.map((folder) => {
                const totalInFolder = folder.employees.length;
                return (
                  <div
                    key={folder.name}
                    onClick={() => setActiveFolder(folder.name)}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Folder Top Bar */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                          {folder.icon}
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-black group-hover:bg-blue-600 group-hover:text-white transition">
                          {totalInFolder} Staff
                        </span>
                      </div>

                      {/* Folder Title */}
                      <h3 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Code: <span className="font-mono font-bold text-slate-700">{folder.code}</span> • Active Team
                      </p>
                    </div>

                    {/* Team Preview Avatars */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex -space-x-2 overflow-hidden">
                        {folder.employees.slice(0, 4).map((emp, i) => (
                          <div
                            key={emp.id || i}
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs"
                            title={emp.name}
                          >
                            {emp.name?.slice(0, 1).toUpperCase()}
                          </div>
                        ))}
                        {folder.employees.length > 4 && (
                          <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                            +{folder.employees.length - 4}
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Open Folder</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: INSIDE A FOLDER (CLICKED ON A SPECIFIC OR MASTER FOLDER) */}
      {viewMode === "FOLDERS" && activeFolder && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Breadcrumb Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveFolder(null)}
                className="text-blue-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>📁 All Folders</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-black text-slate-900 flex items-center gap-1.5">
                <span>{activeFolder === "ALL_EMPLOYEES" ? "🗂️" : foldersMap[activeFolder]?.icon}</span>
                <span>{activeFolder === "ALL_EMPLOYEES" ? "All Organization Employees" : activeFolder}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-mono font-bold">
                  {currentFolderEmployees.length} Staff Records
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter in this folder..."
                className="rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <button
                onClick={() => setActiveFolder(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                ← Back to Folders
              </button>
            </div>
          </div>

          {/* Employees Inside This Folder */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-extrabold uppercase text-[11px]">
                    <th className="py-4 px-5">Employee Name & Role</th>
                    <th className="py-4 px-4">Employee ID</th>
                    <th className="py-4 px-4">Department</th>
                    <th className="py-4 px-4">Active Workflow / Project</th>
                    <th className="py-4 px-4">Mobile Contact</th>
                    <th className="py-4 px-4">Workload Status</th>
                    <th className="py-4 px-5 text-right">360° Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentFolderEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500 text-xs font-medium">
                        No employees found matching filter in this folder.
                      </td>
                    </tr>
                  ) : (
                    currentFolderEmployees.map((emp) => {
                      const empIdStr = emp.employeeId || emp.id;
                      const phone = emp.phone || "+91 98765 00001";
                      const m = emp.metrics || {
                        totalTasks: 4,
                        activeTasks: 2,
                        workloadLevel: "NORMAL",
                      };

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-blue-50/50 transition cursor-pointer"
                          onClick={() => setPreviewTarget(emp)}
                        >
                          {/* 1. Employee Name */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xs shadow-sm shrink-0">
                                {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                              </div>
                              <div>
                                <span className="text-xs font-black text-slate-900 hover:text-blue-600 transition block">
                                  {emp.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {emp.role?.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Employee ID (Clickable Target) */}
                          <td className="py-4 px-4">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTarget(emp);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-mono text-xs font-black transition cursor-pointer inline-flex items-center gap-1"
                              title="Click to inspect all statuses & reviews"
                            >
                              <span>{empIdStr}</span>
                              <span className="text-[10px]">🔍</span>
                            </span>
                          </td>

                          {/* 3. Department */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-700">
                              {getNormalizedDept(emp.department)}
                            </span>
                          </td>

                          {/* 4. Workflow / Project */}
                          <td className="py-4 px-4">
                            <div>
                              <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">
                                {emp.currentProjectTitle || "OMS Cloud Platform"}
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold">
                                {m.activeTasks || 2} Tasks In Progress
                              </span>
                            </div>
                          </td>

                          {/* 5. Mobile Number */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-emerald-600">📱</span>
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {phone}
                              </span>
                            </div>
                          </td>

                          {/* 6. Workload Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                m.workloadLevel === "HIGH" || m.workloadLevel === "OVERLOADED"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              ● {m.workloadLevel || "NORMAL"}
                            </span>
                          </td>

                          {/* 7. Action */}
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTarget(emp);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
                            >
                              Check Status & Reviews →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 2-ALT: FLAT TABLE VIEW */}
      {viewMode === "TABLE" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all staff by name, ID, Gmail or department..."
              className="w-full sm:w-96 rounded-xl border border-slate-300 px-4 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <span className="text-xs font-mono font-bold text-slate-500">
              {allFilteredEmployees.length} Staff
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-extrabold uppercase text-[11px]">
                    <th className="py-4 px-5">Employee Name</th>
                    <th className="py-4 px-4">Employee ID</th>
                    <th className="py-4 px-4">Department</th>
                    <th className="py-4 px-4">Active Workflow</th>
                    <th className="py-4 px-4">Mobile No.</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allFilteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => setPreviewTarget(emp)}
                    >
                      <td className="py-3.5 px-5 font-black text-slate-900">{emp.name}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{emp.employeeId || emp.id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{getNormalizedDept(emp.department)}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{emp.currentProjectTitle || "OMS Platform"}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{emp.phone || "+91 98765 00001"}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTarget(emp);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition cursor-pointer border border-blue-200"
                        >
                          Inspect 360° →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 3: DEEP 360° INSPECTION DRAWER (STATUSES, MOBILE, CUSTOMER REVIEWS) */}
      <EmployeePreviewDrawer
        isOpen={!!previewTarget}
        employee={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}