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
} from "./Icons";
import { getCurrentUserContext } from "@/utils/userContextStore";
import { ROUTES } from "@/lib/routes";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

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

  useEffect(() => {
    // 1. Initial User Context Load
    const u = getCurrentUserContext();
    setUser(u);
    const roleUpper = (u.role || "").toUpperCase();
    const adminCheck = ADMIN_ROLES.includes(roleUpper) || u.activeMode === "ADMIN_HR";
    setIsAdmin(adminCheck);

    // 2. Server-side Session Verification
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
  }, [pathname]);

  // Admin Multi-Dashboard Navigation Sections
  const adminSections = [
    {
      title: "ADMIN COMMAND",
      items: [
        { name: "Command Dashboard", href: ROUTES.ADMIN_DASHBOARD, icon: IconDashboard },
        { name: "Workforce Directory", href: ROUTES.ADMIN_EMPLOYEES, icon: IconUsers },
        { name: "Organization Tasks", href: ROUTES.ADMIN_TASKS, icon: IconClipboardList },
        { name: "Project Health", href: ROUTES.ADMIN_PROJECTS, icon: IconFolder },
        { name: "Blocker Resolution", href: ROUTES.ADMIN_BLOCKERS, icon: IconUserCheck },
      ],
    },
    {
      title: "OPERATIONS & RECORDS",
      items: [
        { name: "Salary Slips Folder", href: "/admin/salary-slips", icon: IconFolder },
        { name: "Attendance Ledger", href: ROUTES.ADMIN_ATTENDANCE, icon: IconCalendar },
        { name: "Daily Work Review", href: ROUTES.ADMIN_WORK, icon: IconFileEdit },
        { name: "Executive Reports", href: ROUTES.ADMIN_REPORTS, icon: IconFileText },
        { name: "Security Audit Logs", href: ROUTES.ADMIN_AUDIT_LOGS, icon: IconHistory },
      ],
    },
  ];

  // Employee Multi-Dashboard Navigation Sections
  const employeeSections = [
    {
      title: "WORKSPACE",
      items: [
        { name: "Dashboard", href: ROUTES.EMPLOYEE_DASHBOARD, icon: IconDashboard },
        { name: "My Tasks", href: ROUTES.EMPLOYEE_TASKS, icon: IconClipboardList },
        { name: "My Projects", href: ROUTES.EMPLOYEE_PROJECTS, icon: IconFolder },
      ],
    },
    {
      title: "TIME & WORK",
      items: [
        { name: "Punch Clock", href: ROUTES.EMPLOYEE_ATTENDANCE, icon: IconCalendar },
        { name: "Daily EOD", href: ROUTES.EMPLOYEE_WORK, icon: IconFileEdit },
      ],
    },
    {
      title: "TEAM & INSIGHTS",
      items: [
        { name: "Project Teammates", href: "/employee/team", icon: IconUsers },
        { name: "My Performance", href: "/employee/reports", icon: IconFileText },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { name: "Profile & Security", href: ROUTES.EMPLOYEE_PROFILE, icon: IconSettings },
      ],
    },
  ];

  const currentSections = isAdmin ? adminSections : employeeSections;

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
        <Link href={isAdmin ? ROUTES.ADMIN_HOME : ROUTES.EMPLOYEE_HOME} className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            O
          </div>
          <div>
            <h1 className="font-black text-white tracking-tight text-base leading-none">
              OMS Enterprise
            </h1>
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest mt-1 block">
              {isAdmin ? "Admin Control Center" : "Employee Workspace"}
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-xs font-bold"
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
                (item.href !== ROUTES.ADMIN_DASHBOARD &&
                  item.href !== ROUTES.EMPLOYEE_DASHBOARD &&
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