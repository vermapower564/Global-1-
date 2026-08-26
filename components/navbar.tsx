"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import FeatureRequestModal from "./FeatureRequestModal";
import NotificationPopover from "./NotificationPopover";
import ProfileModal, { ProfileUser } from "./ProfileModal";
import GlobalSearchModal from "./GlobalSearchModal";
import { ROUTES } from "@/lib/routes";

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
            department: typeof json.user.department === "object" ? (json.user.department?.name || "Operations") : (json.user.department || "Operations"),
            phone: json.user.phone || null,
            joiningDate: json.user.joiningDate || null,
            avatarUrl: json.user.avatarUrl || null,
          });
        }
      })
      .catch((err) => {
        console.warn("Auth session check error in Navbar:", err);
      });
  }, [pathname]);

  // Keyboard shortcut Ctrl + K trigger for Global Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getPageTitle = (path: string | null) => {
    if (!path || path === "/") return "Overview";
    const segment = path.split("/")[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
  };

  const roleNameMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    PROJECT_MANAGER: "Project Manager",
    TEAM_LEADER: "Team Leader",
    DEVELOPER: "Developer",
    UI_UX_DESIGNER: "UI/UX Designer",
    QA_TESTER: "QA Tester",
    HR: "HR Executive",
    FINANCE: "Finance Officer",
    INTERN: "Intern",
    DIRECTOR: "Director",
  };

  const displayName = user?.name || "Employee";
  const displayRoleOrDesignation = user?.role
    ? roleNameMap[user.role.toUpperCase()] || user.role.replace(/_/g, " ")
    : "Employee";

  const initials = getInitials(displayName);
  const avatarUrl = user?.avatarUrl;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors font-sans print:hidden navbar app-header screen-only">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Left: Sidebar Toggle, Navigation Back/Forward & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              title="Toggle OMS Enterprise Menu"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white transition shadow-2xs cursor-pointer"
            >
              <span className="text-lg font-bold">☰</span>
            </button>

            {/* Back & Forward History Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => router.back()}
                title="Go Back to Previous Page"
                className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-blue-600 font-extrabold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>←</span>
                <span className="hidden md:inline">Back</span>
              </button>
              <button
                onClick={() => router.forward()}
                title="Go Forward to Next Page"
                className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-blue-600 font-extrabold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span className="hidden md:inline">Ahead</span>
                <span>→</span>
              </button>
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
              OMS /
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getPageTitle(pathname)}
            </h2>

            {/* Live System Health Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Health 99.9%
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* Global Search Button with Ctrl K hint */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden md:flex items-center justify-between w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-1.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-600 transition shadow-2xs cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>🔍</span>
                <span>Search records, tasks...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Request a Feature & Suggest Improvement Button */}
            <button
              onClick={() => setIsFeatureModalOpen(true)}
              title="Request a Feature or Suggest Improvement"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-extrabold text-xs transition shadow-2xs cursor-pointer"
            >
              <span>💡</span>
              <span className="hidden lg:inline">Suggest Feature</span>
            </button>

            <NotificationPopover />

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* DYNAMIC AUTHENTICATED USER IDENTITY PROFILE MENU */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                title="Click to view profile photo & details"
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                {/* Dynamic Avatar */}
                <div className="relative">
                  {avatarUrl && !imgError ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      onError={() => setImgError(true)}
                      className="h-8 w-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs shadow-2xs border border-blue-500 group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Online"></span>
                </div>

                {/* Dynamic Name & Role */}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 leading-tight font-mono">
                    {displayRoleOrDesignation}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <FeatureRequestModal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        userRole={user?.role || "EMPLOYEE"}
        userName={user?.name || "User"}
      />
    </>
  );
}