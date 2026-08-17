"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationPopover from "./NotificationPopover";

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

interface AuthUser {
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string | null;
}

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch authenticated user identity from MySQL server API (/api/auth/me)
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser({
            id: json.user.id,
            employeeId: json.user.employeeId || json.user.id,
            name: json.user.name,
            email: json.user.email,
            role: json.user.role,
            department: json.user.department || "Operations",
            avatarUrl: json.user.avatarUrl || null,
          });
        }
      })
      .catch((err) => {
        console.warn("Auth session check error in Navbar:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Handle click outside profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("oms_current_user_context_v1");
    }
    setUser(null);
    router.push("/auth/login");
  };

  const getPageTitle = (path: string | null) => {
    if (!path || path === "/") return "Overview";
    const segment = path.split("/")[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
  };

  const isAdminRole = user?.role ? ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(user.role) : false;
  const displayName = user?.name || "Loading...";
  const displayIdOrRole = isAdminRole ? (user?.role === "SUPER_ADMIN" ? "Administrator" : user?.role || "Admin") : (user?.employeeId || user?.id || "EMP");
  const initials = user ? getInitials(user.name) : "..";
  const avatarUrl = user?.avatarUrl;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-colors">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Hamburger Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            title="Toggle OMS Enterprise Menu"
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 transition shadow-xs cursor-pointer"
          >
            <span className="text-lg font-bold">☰</span>
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
            OMS /
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {getPageTitle(pathname)}
          </h2>

          {/* Live System Health Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Health 99.9%
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search records, staff, tasks..."
              className="w-64 rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-9 pr-4 text-xs focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-xs"
            />
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          <NotificationPopover />

          <div className="h-5 w-px bg-slate-200"></div>

          {/* DYNAMIC AUTHENTICATED USER IDENTITY PROFILE */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              {/* Profile Avatar: Photo if available and valid, else Dynamic Initials */}
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  className="h-8 w-8 rounded-full object-cover border border-slate-300 shadow-xs"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shadow-xs border border-slate-700">
                  {initials}
                </div>
              )}

              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] font-medium text-slate-500 leading-tight font-mono">
                  {displayIdOrRole}
                </p>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isMenuOpen && user && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  {avatarUrl && !imgError ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      onError={() => setImgError(true)}
                      className="h-10 w-10 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-black text-xs shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] font-mono text-blue-600 font-bold">{user.employeeId || user.id}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-bold">
                  <Link
                    href={isAdminRole ? "/admin/employees" : "/employee/profile"}
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 rounded-xl hover:bg-slate-50 text-slate-900 transition"
                  >
                    👤 View Profile & Details
                  </Link>
                  <Link
                    href={isAdminRole ? "/admin/tasks" : "/employee/tasks"}
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 rounded-xl hover:bg-slate-50 text-slate-900 transition"
                  >
                    📝 My Workboard & Tasks
                  </Link>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-xs hover:bg-rose-600 hover:text-white transition cursor-pointer"
                  >
                    🚪 Sign Out Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}