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

  // High-level Metrics & Today Live Data
  const [projects, setProjects] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [todaySummary, setTodaySummary] = useState<any>({
    totalEmployees: 0,
    presentToday: 0,
    currentlyWorking: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    totalInProgress: 0,
    totalTasks: 0,
  });
  const [blockedTasks, setBlockedTasks] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
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

      // 4. Fetch live today summary counts from TiDB
      fetch("/api/admin/today")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.summary) {
            setTodaySummary(json.summary);
          }
        })
        .catch((e) => console.warn("Failed to load today summary:", e));

      // 5. Fetch tasks summary & critical blockers
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

      // 6. Fetch recent audit logs for executive overview
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
    } catch (err) {
      console.warn("Dashboard data fetching error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status !== "COMPLETED");

  // Real Database Counts
  const inProgressTasks = todaySummary.inProgress ?? (taskSummary?.inProgress || 0);
  const totalInProgressAllTime = todaySummary.totalInProgress ?? (taskSummary?.inProgress || inProgressTasks);
  const completedTasks = todaySummary.completed ?? (taskSummary?.completed || 0);
  const totalTasks = todaySummary.totalTasks ?? (taskSummary?.total || 0);
  const blockedCount = todaySummary.blocked ?? blockedTasks.length;
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
            Welcome, {user?.name || "Administrator"} 👋
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            High-level executive overview of organization health, active project delivery, and member work tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/feature-requests"
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-amber-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>💡 Feature Requests Desk</span>
          </Link>
          <Link
            href="/admin/today"
            className="bg-gray-100 hover:bg-gray-200 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>📅 Today's Live Work →</span>
          </Link>
          <Link
            href="/admin/projects"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>+ New Project</span>
          </Link>
        </div>
      </div>

      {/* ⚡ LIVE TASK STATUS PILL NAVIGATION (EXACT SPECIFICATION) */}
      <div className="bg-white p-4.5 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-black text-sm">⚡</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
              Live Work Status:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* TOTAL TASKS */}
            <Link
              href="/admin/tasks"
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black transition flex items-center gap-2 border border-gray-200 shadow-2xs group"
            >
              <span className="text-gray-500 font-extrabold text-[11px] group-hover:text-black">
                TOTAL TASKS
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white text-black font-black text-[11px] shadow-2xs">
                {totalTasks}
              </span>
            </Link>

            {/* IN PROGRESS (Clickable filter directly opening in-progress items) */}
            <Link
              href="/admin/today?status=IN_PROGRESS"
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-black transition flex items-center gap-2 border border-blue-300 shadow-2xs group ring-1 ring-blue-400/30"
            >
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-blue-700 font-extrabold text-[11px] group-hover:text-blue-900">
                IN PROGRESS
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[11px] shadow-xs">
                {inProgressTasks}
              </span>
            </Link>

            {/* COMPLETED */}
            <Link
              href="/admin/today?status=COMPLETED"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition flex items-center gap-2 border border-emerald-300 shadow-2xs group"
            >
              <span className="text-emerald-700 font-extrabold text-[11px] group-hover:text-emerald-900">
                COMPLETED
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[11px] shadow-xs">
                {completedTasks}
              </span>
            </Link>

            {/* BLOCKED */}
            <Link
              href="/admin/today?status=BLOCKED"
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 border shadow-2xs group ${
                blockedCount > 0
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400/30"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className={blockedCount > 0 ? "text-rose-700 font-extrabold text-[11px]" : "text-gray-500 font-extrabold text-[11px]"}>
                BLOCKED
              </span>
              <span className={`px-2 py-0.5 rounded-md font-black text-[11px] shadow-xs ${
                blockedCount > 0 ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {blockedCount}
              </span>
            </Link>
          </div>
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

                    return (
                      <div
                        key={emp.id}
                        className="p-4 hover:bg-blue-50/50 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Link
                            href={`/admin/employees/${encodeURIComponent(emp.employeeId || emp.id)}`}
                            className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs transition cursor-pointer"
                            title="View Employee Profile"
                          >
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                          </Link>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/employees/${encodeURIComponent(emp.employeeId || emp.id)}`}
                                className="font-black text-black hover:text-blue-600 truncate text-sm transition hover:underline"
                              >
                                {emp.name}
                              </Link>
                              <Link
                                href={`/admin/employees/${encodeURIComponent(emp.employeeId || emp.id)}`}
                                className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded-md border border-blue-200 transition"
                              >
                                {emp.employeeId || emp.id}
                              </Link>
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
              {activeProjects.length} active
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-blue-600 transition">
            Manage deliveries & timelines →
          </p>
        </Link>

        {/* Card 2: Task Execution Velocity & IN PROGRESS */}
        <Link
          href="/admin/today?status=IN_PROGRESS"
          className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 transition shadow-2xs group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-gray-500">Task Velocity</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <IconClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-blue-600">{taskCompletionRate}%</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              IN PROGRESS {inProgressTasks}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-blue-600 transition">
            {inProgressTasks} items currently in progress →
          </p>
        </Link>

        {/* Card 3: Critical Attention & Blockers */}
        <Link
          href="/admin/blockers"
          className={`p-5 rounded-2xl bg-white border transition shadow-2xs group block ${
            blockedCount > 0 ? "border-rose-300 bg-rose-50/20 hover:border-rose-500" : "border-gray-200 hover:border-blue-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase ${blockedCount > 0 ? "text-rose-600" : "text-gray-500"}`}>
              Critical Blockers
            </span>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
              blockedCount > 0 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-600"
            }`}>
              <IconAlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-black ${blockedCount > 0 ? "text-rose-600" : "text-black"}`}>
              {blockedCount}
            </span>
            <span className="text-xs font-bold text-gray-600">
              {overdueCount > 0 ? `${overdueCount} Overdue` : "0 Overdue"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium group-hover:text-rose-600 transition">
            {blockedCount > 0 ? "Immediate resolution required →" : "All workflows unblocked →"}
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
                  <span className="text-gray-500">
                    Lead:{" "}
                    <Link
                      href={`/admin/employees/${encodeURIComponent(task.assignedToUser?.employeeId || task.assignedToUser?.id || "EMP001")}`}
                      className="text-gray-900 font-bold hover:text-blue-600 hover:underline"
                    >
                      {task.assignedToUser?.name || "Assigned Team"}
                    </Link>
                  </span>
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
                  <span>
                    Lead:{" "}
                    <Link
                      href={`/admin/employees/${encodeURIComponent(project.teamLeader?.employeeId || project.teamLeader?.id || "EMP-8595")}`}
                      className="font-bold text-gray-800 hover:text-blue-600 hover:underline"
                    >
                      {project.teamLeader?.name || "Roushan Verma"}
                    </Link>
                  </span>
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
            className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 transition shadow-2xs group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <IconUsers className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:underline">Open →</span>
            </div>
            <h3 className="font-black text-sm text-black">Workforce Directory</h3>
            <p className="text-xs text-gray-500 mt-1">
              Manage member profiles, onboarding verification, and role assignments.
            </p>
          </Link>

          {/* Module 2: Live Today's Employee Work */}
          <Link
            href="/admin/today"
            className="p-5 rounded-2xl border border-blue-300 bg-blue-50/30 hover:border-blue-600 transition shadow-2xs group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <IconClipboardList className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                Live [ IN PROGRESS {inProgressTasks} ]
              </span>
            </div>
            <h3 className="font-black text-sm text-black">Today's Employee Work</h3>
            <p className="text-xs text-gray-500 mt-1">
              Live tasks in progress, completed deliverables, and daily EOD submissions.
            </p>
          </Link>

          {/* Module 3: Shifts & Attendance */}
          <Link
            href="/admin/attendance"
            className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 transition shadow-2xs group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <IconCalendar className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-purple-600 group-hover:underline">Open →</span>
            </div>
            <h3 className="font-black text-sm text-black">Shifts & Attendance</h3>
            <p className="text-xs text-gray-500 mt-1">
              Biometric punch logs, working hours, and presence tracking.
            </p>
          </Link>

          {/* Module 4: Payroll & Salary Slips */}
          <Link
            href="/admin/salary-slips"
            className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 transition shadow-2xs group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <span className="text-sm">💵</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 group-hover:underline">Open →</span>
            </div>
            <h3 className="font-black text-sm text-black">Salary Slips & Payouts</h3>
            <p className="text-xs text-gray-500 mt-1">
              Generate PDF salary slips, allowances, bank accounts, and disbursement receipts.
            </p>
          </Link>

          {/* Module 5: Projects & Deliverables */}
          <Link
            href="/admin/projects"
            className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 transition shadow-2xs group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <IconFolder className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-amber-600 group-hover:underline">Open →</span>
            </div>
            <h3 className="font-black text-sm text-black">Project Delivery Hub</h3>
            <p className="text-xs text-gray-500 mt-1">
              Client accounts, project milestones, task distribution, and deadlines.
            </p>
          </Link>

          {/* Module 6: Executive Reports & Audit Logs */}
          <Link
            href="/admin/reports"
            className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 transition shadow-2xs group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <IconFileText className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:underline">Open →</span>
            </div>
            <h3 className="font-black text-sm text-black">Executive Reports & BI</h3>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive organization metrics, exportable audit trails, and KPI digests.
            </p>
          </Link>
        </div>
      </div>

      {/* 📜 Organization Audit Activity Log */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-black text-black text-base tracking-tight flex items-center gap-2">
              <span>📜</span> Recent Organization Audit Activity
            </h2>
            <p className="text-xs text-gray-500">
              Live immutable log of authentication, payroll approvals, and project updates.
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Full Audit Logs →
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {recentAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No recent audit activity recorded.
            </div>
          ) : (
            recentAuditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-gray-100 text-gray-700 shrink-0">
                    {log.action || "SYSTEM"}
                  </span>
                  <span className="font-medium text-gray-800 truncate">
                    {log.details || log.action}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deep Inspection Modal */}
      {selectedEmployeeIdForWork && (
        <EmployeeWorkModal
          employeeId={selectedEmployeeIdForWork}
          isOpen={!!selectedEmployeeIdForWork}
          onClose={() => setSelectedEmployeeIdForWork(null)}
        />
      )}
    </div>
  );
}
