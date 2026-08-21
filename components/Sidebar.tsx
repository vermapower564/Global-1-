"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconDashboard,
  IconUsers,
  IconCalendar,
  IconFileEdit,
  IconClipboardList,
  IconFolder,
  IconHistory,
  IconBuilding,
  IconFileText,
  IconSettings,
  IconUserCheck,
  IconStar,
  IconAward,
} from "./Icons";
import { getCurrentUserContext } from "@/utils/userContextStore";
import { ROUTES } from "@/lib/routes";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "ADMIN"];

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imgError, setImgError] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);

  useEffect(() => {
    // 1. Initial User Context Load
    const u = getCurrentUserContext();
    setUser(u);
    const roleUpper = (u.role || "").toUpperCase();
    const adminCheck = ADMIN_ROLES.includes(roleUpper) || u.activeMode === "ADMIN_HR";
    setIsAdmin(adminCheck);

    // 2. Server-side Session Verification & TL status check
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
          const serverRoleUpper = (json.user.role || "").toUpperCase();
          setIsAdmin(ADMIN_ROLES.includes(serverRoleUpper));
        }
      })
      .catch(() => {});

    // Check if user is a designated Team Leader
    fetch("/api/team-leader/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.isTeamLeader) {
          setIsTeamLeader(true);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const roleUpper = (user?.role || "").toUpperCase();
  const isSuperAdmin = roleUpper === "SUPER_ADMIN" || roleUpper === "DIRECTOR" || roleUpper === "ADMIN_HR";
  const isHR = roleUpper === "HR";
  const isPM = roleUpper === "PROJECT_MANAGER";
  const isTL = roleUpper === "TEAM_LEADER" || (isTeamLeader && !isPM && !isSuperAdmin && !isHR);

  // 1. SUPER ADMIN / ADMIN CANONICAL NAVIGATION
  const superAdminSections = [
    {
      title: isSuperAdmin ? "SUPER ADMIN" : "ADMINISTRATION",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: IconDashboard },
        { name: "Organisation", href: "/admin/organisation", icon: IconBuilding },
        { name: "Projects", href: "/admin/projects", icon: IconFolder },
        { name: "Tasks", href: "/admin/tasks", icon: IconClipboardList },
        { name: "Attendance", href: "/admin/attendance", icon: IconCalendar },
        { name: "Salary Slips", href: "/admin/salary-slips", icon: IconFileText },
        { name: "Leave Requests", href: "/hr/leave", icon: IconClipboardList },
        ...(isSuperAdmin ? [{ name: "Audit Logs", href: "/admin/audit-logs", icon: IconHistory }] : []),
        { name: "Settings", href: "/settings", icon: IconSettings },
        { name: "Profile", href: "/employee/profile", icon: IconSettings },
      ],
    },
  ];

  // 2. HR DEDICATED CANONICAL NAVIGATION
  const hrSections = [
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: "Dashboard", href: "/hr", icon: IconDashboard },
        { name: "Employees", href: "/hr/employees", icon: IconUsers },
        { name: "Attendance", href: "/hr/attendance", icon: IconCalendar },
        { name: "Leave Requests", href: "/hr/leave", icon: IconClipboardList },
        { name: "Salary Management", href: "/hr/payroll", icon: IconFileText },
        { name: "Onboarding", href: "/hr/onboarding", icon: IconUserCheck },
        { name: "Documents", href: "/hr/documents", icon: IconFolder },
        { name: "Resignation", href: "/hr/resignation", icon: IconFileText },
        { name: "Reports", href: "/hr/reports", icon: IconFileEdit },
      ],
    },
  ];

  // 3. PROJECT MANAGER CANONICAL NAVIGATION
  const projectManagerSections = [
    {
      title: "PROJECT MANAGER",
      items: [
        { name: "Dashboard", href: "/project-manager", icon: IconDashboard },
        { name: "Projects", href: "/admin/projects", icon: IconFolder },
        { name: "Team", href: "/project-manager/team-leaders", icon: IconUsers },
        { name: "Tasks", href: "/admin/tasks", icon: IconClipboardList },
        { name: "Workboard", href: "/team-leader/tasks", icon: IconClipboardList },
        { name: "Daily Updates", href: "/admin/work", icon: IconUserCheck },
        { name: "Leave Request", href: "/leave", icon: IconFileText },
        { name: "Reports", href: "/project-manager/reports", icon: IconFileText },
      ],
    },
  ];

  // 4. TEAM LEADER CANONICAL NAVIGATION
  const teamLeaderSections = [
    {
      title: "TEAM LEADER",
      items: [
        { name: "Dashboard", href: "/team-leader", icon: IconDashboard },
        { name: "My Projects", href: "/employee/projects", icon: IconFolder },
        { name: "Team", href: "/team-leader/team", icon: IconUsers },
        { name: "Tasks", href: "/team-leader/assign-work", icon: IconFileEdit },
        { name: "Workboard", href: "/team-leader/tasks", icon: IconClipboardList },
        { name: "Daily Updates", href: "/team-leader/reviews", icon: IconUserCheck },
        { name: "Leave Request", href: "/leave", icon: IconFileText },
      ],
    },
  ];

  // 5. EMPLOYEE CANONICAL NAVIGATION
  const employeeSections = [
    {
      title: "EMPLOYEE",
      items: [
        { name: "Dashboard", href: "/employee/dashboard", icon: IconDashboard },
        { name: "My Tasks", href: "/employee/tasks", icon: IconClipboardList },
        { name: "My Projects", href: "/employee/projects", icon: IconFolder },
        { name: "Attendance", href: "/employee/attendance", icon: IconCalendar },
        { name: "Salary Slips", href: "/employee/salary", icon: IconFileText },
        { name: "Leave Request", href: "/leave", icon: IconFileText },
        { name: "Daily Work", href: "/employee/work", icon: IconFileEdit },
        { name: "My Profile", href: "/employee/profile", icon: IconSettings },
      ],
    },
  ];

  let currentSections = employeeSections;
  if (isSuperAdmin) currentSections = superAdminSections;
  else if (isHR) currentSections = hrSections;
  else if (isPM) currentSections = projectManagerSections;
  else if (isTL) currentSections = teamLeaderSections;

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("oms_current_user_context_v1");
      sessionStorage.clear();
      window.location.href = "/auth/login";
    }
  };

  const displayName = user?.name || "Employee";
  const displayId = user?.employeeId || user?.id || "EMP";
  const displayRole = (user?.role || "EMPLOYEE").replace(/_/g, " ");
  const initials = getInitials(displayName);
  const avatarUrl = user?.avatarUrl;

  return (
    <aside className="w-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800 shrink-0 shadow-2xl fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 font-sans">
      {/* Enterprise Brand Logo Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950">
        <Link
          href={
            isSuperAdmin
              ? "/admin/dashboard"
              : isHR
              ? "/hr"
              : isPM
              ? "/project-manager"
              : isTL
              ? "/team-leader"
              : "/employee/dashboard"
          }
          className="flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            O
          </div>
          <div>
            <h1 className="font-black text-white tracking-tight text-base leading-none">
              OMS Enterprise
            </h1>
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest mt-1 block">
              {isSuperAdmin
                ? "Admin Control Center"
                : isHR
                ? "HR Operations Hub"
                : isPM
                ? "Project Manager Portal"
                : isTL
                ? "Team Leader Portal"
                : "Employee Workspace"}
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Enterprise Categorized Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {currentSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 block mb-2">
              {sec.title}
            </span>

            {sec.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  item.href !== "/employee/dashboard" &&
                  item.href !== "/project-manager" &&
                  item.href !== "/team-leader" &&
                  pathname?.startsWith(item.href));
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-inner font-extrabold"
                      : "text-slate-300 hover:bg-slate-900/80 hover:text-white border-transparent"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                      isActive ? "text-blue-400" : "text-slate-400"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Mini-Card & Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
        {/* User Mini-Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="relative shrink-0">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="h-9 w-9 rounded-full object-cover border border-slate-700 shadow-sm"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center border border-slate-700 shadow-sm">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online & Active"></span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-white truncate">{displayName}</p>
            <p className="text-[10px] font-mono text-blue-400 font-bold truncate">{displayId} • {displayRole}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-900/60 bg-rose-950/40 text-xs font-extrabold text-rose-400 hover:bg-rose-600 hover:text-white transition shadow-sm cursor-pointer"
        >
          <span>🚪 Sign Out Session</span>
        </button>

        <div className="text-[10px] text-slate-500 text-center font-medium">
          OMS Enterprise • Modern ERP 2.0
        </div>
      </div>
    </aside>
  );
}