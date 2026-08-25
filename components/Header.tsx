"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconSearch, IconBell } from "@/components/Icons";
import { getCurrentUserContext, toggleUserRoleMode, CurrentUser } from "@/utils/userContextStore";
import { getStoredThemeMode, toggleThemeMode, applyThemeToDocument, ThemeMode } from "@/utils/themeStore";
import ProfileModal, { ProfileUser } from "./ProfileModal";

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Header() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [userContext, setUserContext] = useState<CurrentUser | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const localUser = getCurrentUserContext();
    setUserContext(localUser);
    const storedTheme = getStoredThemeMode();
    setThemeMode(storedTheme);
    applyThemeToDocument(storedTheme);

    // Fetch authenticated user identity from MySQL server API
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          const authUser: CurrentUser = {
            id: json.user.id,
            employeeId: json.user.employeeId || json.user.id,
            name: json.user.name,
            email: json.user.email,
            role: json.user.role,
            department: typeof json.user.department === "object" ? (json.user.department?.name || "Operations") : (json.user.department || "Operations"),
            avatarUrl: json.user.avatarUrl || null,
            activeMode: ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(json.user.role) ? "ADMIN_HR" : "EMPLOYEE_USER",
            assignedProjectTitle: "OMS Enterprise System",
          };
          setUserContext(authUser);
        }
      })
      .catch(() => {});

    // Fetch live notifications
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setNotifications(json.notifications || []);
          setUnreadCount(json.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  // Outside click listener for Search & Profile Menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global search query trigger
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setSearchResults(json.results);
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleThemeToggle = () => {
    const nextTheme = toggleThemeMode();
    setThemeMode(nextTheme);
  };

  const handleRoleToggle = () => {
    const updated = toggleUserRoleMode();
    setUserContext(updated);
    window.location.reload();
  };

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

  const name = userContext?.name || "User";
  const employeeId = userContext?.employeeId || userContext?.id || "EMP";
  const role = userContext?.role || "EMPLOYEE";
  const initials = getInitials(name);
  const avatarUrl = userContext?.avatarUrl;

  const modalUser: ProfileUser | null = userContext ? {
    id: userContext.id,
    employeeId: userContext.employeeId || userContext.id,
    name: userContext.name,
    email: userContext.email,
    role: userContext.role,
    department: userContext.department || "Operations",
    avatarUrl: userContext.avatarUrl || null,
  } : null;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 shadow-xs transition-colors">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>OMS System</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="XAMPP MySQL Connected"></span>
          </h2>
        </div>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative w-72 sm:w-96">
          <div className="relative flex items-center">
            <IconSearch className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Global search employees, tasks, projects... (Ctrl + K)"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-12 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition shadow-inner"
            />
            <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
              Ctrl K
            </kbd>
          </div>

          {/* Global Search Dropdown */}
          {isOpen && searchResults && (
            <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xl space-y-3">
              {searchResults.employees?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-600">Employees</span>
                  {searchResults.employees.map((emp: any) => (
                    <Link
                      key={emp.id}
                      href={`/admin/employees/${emp.id}`}
                      onClick={() => setIsOpen(false)}
                      className="block p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      👤 {emp.name} ({emp.employeeId}) • {emp.role}
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.tasks?.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <span className="text-[10px] font-black uppercase text-blue-600">Tasks</span>
                  {searchResults.tasks.map((t: any) => (
                    <Link
                      key={t.id}
                      href="/admin/tasks"
                      onClick={() => setIsOpen(false)}
                      className="block p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      📝 {t.title} ({t.status})
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Day/Night Theme Button */}
          <button
            onClick={handleThemeToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-100"
          >
            {themeMode === "light" ? "🌙 Night" : "☀️ Day"}
          </button>

          {/* View Mode Toggle */}
          <button
            onClick={handleRoleToggle}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-xs ${
              userContext?.activeMode === "ADMIN_HR"
                ? "bg-slate-900 text-amber-400 border-slate-800"
                : "bg-blue-600 text-white border-blue-500"
            }`}
          >
            {userContext?.activeMode === "ADMIN_HR" ? "🛡️ Admin Mode" : "👤 Employee Mode"}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative rounded-full p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              <IconBell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Notifications</h4>
                  <span className="text-[10px] font-bold text-blue-600">{unreadCount} Unread</span>
                </div>
                <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white block">{n.title}</span>
                      <p className="text-[11px] text-slate-500">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-slate-400 italic py-4 text-xs">No notifications.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC AUTHENTICATED USER IDENTITY & PROFILE MENU */}
          <div ref={profileMenuRef} className="relative border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Click to view large profile photo & details"
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
            >
              {/* Avatar: Photo if available and not errored, else Dynamic Initials */}
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  onError={() => setImgError(true)}
                  className="h-9 w-9 rounded-full object-cover border border-blue-500 shadow-md group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-md group-hover:scale-105 transition-transform">
                  {initials}
                </div>
              )}

              <div className="hidden text-left md:block">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">{name}</p>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                  {employeeId} • {role}
                </p>
              </div>
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl space-y-3 animate-in fade-in">
                <div
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:opacity-80 transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{name}</p>
                    <p className="text-[10px] font-mono text-blue-600 font-bold">{employeeId}</p>
                    <p className="text-[10px] text-slate-400 truncate">{userContext?.email}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-bold">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition"
                  >
                    👤 View Profile Photo & Details
                  </button>
                  <Link
                    href="/employee/tasks"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition"
                  >
                    📝 My Active Tasks
                  </Link>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-600 dark:text-rose-400 font-extrabold text-xs hover:bg-rose-600 hover:text-white transition"
                  >
                    🚪 Sign Out Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Large Interactive Profile Photo Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={modalUser}
      />
    </>
  );
}
