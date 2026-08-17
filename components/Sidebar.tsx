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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    const user = getCurrentUserContext();
    const roleUpper = (user.role || "").toUpperCase();
    const adminCheck = ADMIN_ROLES.includes(roleUpper) || user.activeMode === "ADMIN_HR";
    setIsAdmin(adminCheck);
  }, [pathname]);

  // Admin Navigation Menu items
  const adminNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
    { name: "Employees", href: "/employees", icon: IconUsers },
    { name: "Departments", href: "/departments", icon: IconBuilding },
    { name: "Attendance", href: "/attendance", icon: IconCalendar },
    { name: "Projects", href: "/projects", icon: IconFolder },
    { name: "Leave Requests", href: "/hr", icon: IconUserCheck },
    { name: "Work Updates", href: "/daily-work/approvals", icon: IconClipboardList },
    { name: "Reports", href: "/reports", icon: IconFileText },
    { name: "Audit Logs", href: "/audit-logs", icon: IconHistory },
    { name: "Settings", href: "/settings", icon: IconSettings },
  ];

  // Employee Navigation Menu items
  const employeeNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
    { name: "My Attendance", href: "/attendance", icon: IconCalendar },
    { name: "My Projects", href: "/projects", icon: IconFolder },
    { name: "Daily Work Update", href: "/daily-work", icon: IconClipboardList },
    { name: "Leave Requests", href: "/leave/apply", icon: IconFileEdit },
    { name: "Profile", href: "/employees/id", icon: IconUsers },
    { name: "Settings", href: "/settings", icon: IconSettings },
  ];

  const currentNavItems = isAdmin ? adminNavItems : employeeNavItems;

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("oms_current_user_context_v1");
    }
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0 shadow-sm fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300">
      {/* Enterprise Brand Logo Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-md">
            O
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm leading-none">
              OMS Enterprise
            </h1>
            <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest mt-1 block">
              {isAdmin ? "Admin Console" : "Employee Workspace"}
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Enterprise Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 block mb-2">
          {isAdmin ? "Admin Navigation" : "Employee Workspace"}
        </div>

        {currentNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && item.href !== "/dashboard" && pathname?.startsWith(item.href));
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
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-2xs"
                  : "text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <IconComponent className="h-4 w-4" />
              </div>
              <span className={isActive ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-900 dark:text-slate-200 font-semibold"}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition shadow-2xs"
        >
          <span>Sign Out Session</span>
        </button>

        <div className="text-[10px] text-slate-400 text-center font-medium">
          Enterprise ERP • MySQL Backend
        </div>
      </div>
    </aside>
  );
}