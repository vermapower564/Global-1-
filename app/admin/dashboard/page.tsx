"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconDashboard,
  IconFolder,
  IconUsers,
  IconCalendar,
  IconClipboardList,
  IconTrendingUp,
  IconCheck,
  IconAlertTriangle,
  IconSearch,
  IconFileText,
} from "@/components/Icons";
import EmployeeWorkModal from "@/components/EmployeeWorkModal";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Work Inspection State
  const [searchQuery, setSearchQuery] = useState("");
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedEmployeeIdForWork, setSelectedEmployeeIdForWork] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // High-level Metrics
  const [projects, setProjects] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [blockedTasks, setBlockedTasks] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch server session user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});

    // 2. Fetch workforce for instant search
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setAllEmployees(json.data);
        }
      })
      .catch(() => {});

    // 3. Fetch projects metrics
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProjects(json.projects || []);
        }
      })
      .catch((e) => console.warn("Failed to load projects:", e));

    // 4. Fetch tasks summary & critical blockers
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTaskSummary(json.summary || null);
          const tasks = json.tasks || [];
          setBlockedTasks(tasks.filter((t: any) => t.status === "BLOCKED"));
          setOverdueCount(tasks.filter((t: any) => t.isOverdue).length);
        }
      })
      .catch((e) => console.warn("Failed to load tasks summary:", e));

    // 5. Fetch recent audit logs for executive overview
    fetch("/api/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentAuditLogs(data.slice(0, 5));
        } else if (data.success && Array.isArray(data.logs)) {
          setRecentAuditLogs(data.logs.slice(0, 5));
        }
      })
      .catch((e) => console.warn("Failed to load audit logs:", e))
      .finally(() => setLoading(false));
  }, []);

  // Handle outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalProjects = projects.length || 5;
  const activeProjects = projects.filter((p) => p.status !== "COMPLETED");
  const inProgressTasks = taskSummary?.inProgress || 0;
  const completedTasks = taskSummary?.completed || 0;
  const totalTasks = (taskSummary?.total || 0) || (inProgressTasks + completedTasks);
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Filtered employees for instant live search
  const filteredEmployees = searchQuery.trim()
    ? allEmployees.filter((emp) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          (emp.name || "").toLowerCase().includes(q) ||
          (emp.employeeId || "").toLowerCase().includes(q) ||
          (emp.email || "").toLowerCase().includes(q) ||
          (typeof emp.department === "object" ? emp.department?.name : emp.department || "")
            .toLowerCase()
            .includes(q) ||
          (emp.role || "").toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* 👑 Executive Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Admin Executive Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Welcome back, {user?.name || "Administrator"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            High-level executive overview of organization health, active project delivery, and member work tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/projects"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>+ New Project</span>
          </Link>
          <Link
            href="/admin/reports"
            className="bg-white hover:bg-gray-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>Executive Reports →</span>
          </Link>
        </div>
      </div>

      {/* 🔍 INSTANT EMPLOYEE WORK SEARCH & INSPECTION SPOTLIGHT */}
      <div
        ref={searchContainerRef}
        className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white p-6 rounded-3xl border border-blue-200 shadow-xs relative"
      >
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-base">🔍</span>
            <h2 className="text-sm font-black text-black tracking-tight uppercase">
              Inspect Employee Work & Performance
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800">
              Instant Dossier
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Search any team member by name, ID, or department to instantly inspect all tasks delivered, active projects, daily EOD updates, and shifts.
          </p>

          <div className="relative pt-2">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-gray-400 pointer-events-none">
                <IconSearch className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="Type employee name (e.g. Roushan, Aditya, Sneha, Rajesh, EMP014)..."
                className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-white border border-blue-300 text-xs font-bold text-black placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-black bg-gray-100 rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-40 overflow-hidden divide-y divide-gray-100 max-h-80 overflow-y-auto animate-fadeIn">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 italic">
                    No employees matching "{searchQuery}"
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const deptName = typeof emp.department === "object" ? emp.department?.name : emp.department || "Engineering";
                    const m = emp.metrics || {};

                    return (
                      <div
                        key={emp.id}
                        className="p-4 hover:bg-blue-50/50 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-black truncate text-sm">{emp.name}</span>
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                {emp.employeeId || emp.id}
                              </span>
                            </div>
                            <p className="text-gray-500 text-[11px] truncate">
                              {emp.role || "Developer"} • {deptName} • {emp.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedEmployeeIdForWork(emp.employeeId || emp.id);
                              setIsSearchDropdownOpen(false);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Inspect Work</span>
                            <span>→</span>
                          </button>
                          <Link
                            href={`/admin/employees/${encodeURIComponent(emp.employeeId || emp.id)}`}
                            className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-gray-200 transition"
                          >
                            Profile
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📊 Core Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <Link
          href="/admin/projects"
          className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 transition shadow-2xs group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-gray-500">Active Projects</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <IconFolder className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-black">{totalProjects}</span>
            <span className="text-xs font-bold text-emerald-600">
              {activeProjects.length} in progress
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-blue-600 transition">
            Manage deliveries & timelines →
          </p>
        </Link>

        {/* Card 2: Task Execution Velocity */}
        <Link
          href="/admin/tasks"
          className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 transition shadow-2xs group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-gray-500">Task Velocity</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IconClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600">{taskCompletionRate}%</span>
            <span className="text-xs font-bold text-gray-600">
              {completedTasks} completed
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-emerald-600 transition">
            {inProgressTasks} active in pipeline →
          </p>
        </Link>

        {/* Card 3: Critical Attention & Blockers */}
        <Link
          href="/admin/blockers"
          className={`p-5 rounded-2xl bg-white border transition shadow-2xs group block ${
            blockedTasks.length > 0 ? "border-rose-300 bg-rose-50/20 hover:border-rose-500" : "border-gray-200 hover:border-blue-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase ${blockedTasks.length > 0 ? "text-rose-600" : "text-gray-500"}`}>
              Critical Blockers
            </span>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
              blockedTasks.length > 0 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-600"
            }`}>
              <IconAlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-black ${blockedTasks.length > 0 ? "text-rose-600" : "text-black"}`}>
              {blockedTasks.length}
            </span>
            <span className="text-xs font-bold text-gray-600">
              {overdueCount > 0 ? `${overdueCount} Overdue` : "0 Overdue"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-rose-600 transition">
            {blockedTasks.length > 0 ? "Immediate resolution required →" : "All workflows unblocked →"}
          </p>
        </Link>

        {/* Card 4: Monthly Payroll & Salary Slips */}
        <Link
          href="/admin/salary-slips"
          className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 transition shadow-2xs group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-gray-500">Payroll Cycle</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="text-sm">💳</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-black">Active</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-blue-600 transition">
            Access salary slips & payroll folder →
          </p>
        </Link>
      </div>

      {/* ⚠️ CRITICAL ADMIN ACTION CENTER (If any blocker exists) */}
      {blockedTasks.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-rose-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div>
              <h2 className="font-black text-rose-700 text-base tracking-tight flex items-center gap-2">
                <span>⚠️</span> Immediate Admin Attention Required ({blockedTasks.length} Blocked)
              </h2>
              <p className="text-xs text-gray-500">
                Work items flagged as blocked by team leads requiring administrative approval or intervention.
              </p>
            </div>
            <Link
              href="/admin/blockers"
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-xs"
            >
              Resolve All Blockers →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blockedTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-rose-50/30 border border-rose-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-black truncate">{task.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 uppercase">
                    Blocked
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] line-clamp-2">
                  {task.description || "Task has encountered dependency or resource blocker."}
                </p>
                <div className="pt-2 border-t border-rose-100 flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Lead: {task.assignedToUser?.name || "Assigned Team"}</span>
                  <Link
                    href={`/admin/tasks?taskId=${task.id}`}
                    className="font-bold text-rose-600 hover:underline"
                  >
                    View Task →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚀 Active Projects & Delivery Milestones */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-black text-black text-base tracking-tight flex items-center gap-2">
              <span>🚀</span> Strategic Projects & Delivery Progress
            </h2>
            <p className="text-xs text-gray-500">
              High-level milestone execution and delivery status across active enterprise initiatives.
            </p>
          </div>
          <Link
            href="/admin/projects"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View All Projects →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.slice(0, 4).map((project, idx) => {
            const progress = project.progressRate || (idx === 0 ? 88 : idx === 1 ? 72 : 55);
            return (
              <div
                key={project.id || idx}
                className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      {project.clientName || "Enterprise Project"}
                    </span>
                    <h3 className="text-sm font-black text-black mt-0.5">{project.name}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                    {project.status || "IN_PROGRESS"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500 text-[11px]">Milestone Completion</span>
                    <span className="text-blue-600 font-mono">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500">
                  <span>Lead: <strong className="text-gray-700">{project.teamLeader?.name || "Roushan Verma"}</strong></span>
                  <Link
                    href={`/admin/projects`}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🧭 Organization Operations Hub */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="font-black text-black text-base tracking-tight flex items-center gap-2">
            <span>🧭</span> Enterprise Operations Hub
          </h2>
          <p className="text-xs text-gray-500">
            Dedicated administrative departments and deep management portals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Workforce Directory */}
          <Link
            href="/admin/employees"
            className="p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white transition shadow-2xs group flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 text-xl group-hover:scale-105 transition">
              👥
            </div>
            <div>
              <h3 className="text-sm font-black text-black group-hover:text-blue-600 transition">
                Workforce Directory
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Manage employee profiles, departments, active statuses, and designations.
              </p>
            </div>
          </Link>

          {/* Module 2: Attendance & Shift Ledger */}
          <Link
            href="/admin/attendance"
            className="p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white transition shadow-2xs group flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-xl group-hover:scale-105 transition">
              ⏰
            </div>
            <div>
              <h3 className="text-sm font-black text-black group-hover:text-emerald-600 transition">
                Attendance & Shift Ledger
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Shift punch records, daily hours worked, and attendance master audit.
              </p>
            </div>
          </Link>

          {/* Module 3: Salary Slips & Payroll */}
          <Link
            href="/admin/salary-slips"
            className="p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white transition shadow-2xs group flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 text-xl group-hover:scale-105 transition">
              📁
            </div>
            <div>
              <h3 className="text-sm font-black text-black group-hover:text-indigo-600 transition">
                Salary Slips Folder
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Generate monthly salary slips, deductions, and downloadable PDFs.
              </p>
            </div>
          </Link>

          {/* Module 4: Project Management */}
          <Link
            href="/admin/projects"
            className="p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white transition shadow-2xs group flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 text-xl group-hover:scale-105 transition">
              📂
            </div>
            <div>
              <h3 className="text-sm font-black text-black group-hover:text-amber-600 transition">
                Project Tracking
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Client deliverables, team lead assignments, and milestone tracking.
              </p>
            </div>
          </Link>

          {/* Module 5: Executive Reports & Analytics */}
          <Link
            href="/admin/reports"
            className="p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white transition shadow-2xs group flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 text-xl group-hover:scale-105 transition">
              📊
            </div>
            <div>
              <h3 className="text-sm font-black text-black group-hover:text-purple-600 transition">
                Analytics & Reports
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Organization metrics, productivity charts, and department performance.
              </p>
            </div>
          </Link>

          {/* Module 6: Security & Audit Trail */}
          <Link
            href="/admin/audit-logs"
            className="p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white transition shadow-2xs group flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 text-xl group-hover:scale-105 transition">
              🛡️
            </div>
            <div>
              <h3 className="text-sm font-black text-black group-hover:text-rose-600 transition">
                Audit Logs & Security
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                System-wide access logs, sensitive actions, and compliance monitoring.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 🛡️ Recent Executive System Activity */}
      {recentAuditLogs.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-black text-black text-base tracking-tight flex items-center gap-2">
                <span>🛡️</span> Recent Organization Audit Activity
              </h2>
              <p className="text-xs text-gray-500">Live stream of critical system operations and administrative events.</p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View Full Audit Trail →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {recentAuditLogs.map((log: any, idx: number) => (
              <div key={log.id || idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${
                    log.severity === "CRITICAL" ? "bg-rose-500" : log.severity === "HIGH" ? "bg-amber-500" : "bg-blue-500"
                  }`}></span>
                  <div>
                    <span className="font-extrabold text-black">{log.action}</span>
                    <p className="text-gray-500 text-[11px]">{log.details || log.user?.name || "System event recorded"}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-600 shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📂 EMPLOYEE WORK INSPECTION DOSSIER MODAL */}
      <EmployeeWorkModal
        isOpen={!!selectedEmployeeIdForWork}
        employeeId={selectedEmployeeIdForWork}
        onClose={() => setSelectedEmployeeIdForWork(null)}
      />
    </div>
  );
}
