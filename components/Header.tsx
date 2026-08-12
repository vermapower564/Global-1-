"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconSearch, IconBell, IconFolder } from "@/components/Icons";
import { getCurrentUserContext, toggleUserRoleMode, CurrentUser } from "@/utils/userContextStore";
import { getStoredThemeMode, toggleThemeMode, applyThemeToDocument, ThemeMode } from "@/utils/themeStore";
import { getStoredCompanyProfile, CompanyProfile } from "@/utils/companyStore";

export interface SearchFolderItem {
  title: string;
  category: string;
  path: string;
  description: string;
  colorClass: string;
  badgeBg: string;
}

const folderSearchDatabase: SearchFolderItem[] = [
  {
    title: "Executive Dashboard",
    category: "Main Module",
    path: "/dashboard",
    description: "Overall KPIs, system metrics & active workforce breakdown",
    colorClass: "text-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    title: "Master History Vault",
    category: "Operations",
    path: "/history",
    description: "Complete activity ledger with zero 2-month limits",
    colorClass: "text-red-500",
    badgeBg: "bg-red-100 text-red-800 border-red-300",
  },
  {
    title: "Admin Salary Bill Desk",
    category: "Finance",
    path: "/finance/payroll/billing",
    description: "Generate monthly salary bills & printable payment vouchers",
    colorClass: "text-amber-500",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    title: "Employees Master Directory",
    category: "Workforce",
    path: "/employees",
    description: "View all staff profiles, department assignments & roles",
    colorClass: "text-blue-500",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    title: "Attendance Ledger Desk",
    category: "Workforce",
    path: "/attendance",
    description: "Daily check-in logs & time tracking saved to MySQL attendance table",
    colorClass: "text-amber-500",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    title: "Intern Students Folder",
    category: "HR & Talent",
    path: "/hr/interns",
    description: "University intern directory, stipend tracking & mentor logs",
    colorClass: "text-violet-600",
    badgeBg: "bg-violet-100 text-violet-800 border-violet-300",
  },
  {
    title: "Clients Directory",
    category: "CRM & Sales",
    path: "/clients",
    description: "Manage client corporate accounts, contacts & total billing",
    colorClass: "text-teal-500",
    badgeBg: "bg-teal-100 text-teal-800 border-teal-300",
  },
  {
    title: "Corporate Location Settings",
    category: "Administration",
    path: "/settings",
    description: "Configure company identity, CIN tax ID & office locations",
    colorClass: "text-slate-700",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
  },
];

export default function Header() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [userContext, setUserContext] = useState<CurrentUser | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setUserContext(getCurrentUserContext());
    const storedTheme = getStoredThemeMode();
    setThemeMode(storedTheme);
    applyThemeToDocument(storedTheme);
    setCompanyProfile(getStoredCompanyProfile());
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = toggleThemeMode();
    setThemeMode(nextTheme);
  };

  // Register Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = folderSearchDatabase.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const handleSelectResult = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  const handleRoleToggle = () => {
    const updated = toggleUserRoleMode();
    setUserContext(updated);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 shadow-xs transition-colors">
      {/* Left Title, Company Name & Active Location */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>OMS System</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="XAMPP MySQL Connected"></span>
        </h2>
        <Link
          href="/settings"
          className="hidden md:inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 hover:border-red-500 transition"
        >
          📍 {companyProfile?.headquartersCity || "Gurugram"} HQ • {companyProfile?.headquartersAddress?.slice(0, 22) || "DLF Cyber City"}...
        </Link>
      </div>

      {/* Center Search Bar Component */}
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
            placeholder="Search folders, pages or modules... (Ctrl + K)"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-12 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition shadow-inner"
          />
          <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
            Ctrl K
          </kbd>
        </div>

        {/* Live Search Results Dropdown Modal */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl animate-in fade-in">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>{query ? `Search Results (${results.length})` : "Folder Pages & Modules Quick Jump"}</span>
              <span className="text-[10px] font-mono text-slate-400">ESC to close</span>
            </div>

            {results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No matching folders or pages found for &quot;<span className="font-bold text-slate-800 dark:text-white">{query}</span>&quot;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleSelectResult(item.path)}
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition flex items-start gap-3 group"
                  >
                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition ${item.colorClass}`}>
                      <IconFolder className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-red-600 transition truncate">
                          {item.title}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badgeBg}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">{item.path}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Header Right Actions: Role Switcher & Day/Night Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Day Mode (☀️ Light) / Night Mode (🌙 Dark) Toggle Button */}
        <button
          onClick={handleThemeToggle}
          title={themeMode === "light" ? "Switch to Night Mode (Dark Theme)" : "Switch to Day Mode (Light Theme)"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-2xs"
        >
          {themeMode === "light" ? "🌙 Night Mode" : "☀️ Day Mode"}
        </button>

        {/* Toggle Mode Button */}
        <button
          onClick={handleRoleToggle}
          title="Click to Switch View Mode: Office Purpose (Admin/HR) vs Employee User (My Work Only)"
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition shadow-xs ${
            userContext?.activeMode === "ADMIN_HR"
              ? "bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800"
              : "bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
          }`}
        >
          {userContext?.activeMode === "ADMIN_HR"
            ? "🛡️ Office Purpose View (Admin/HR)"
            : "👤 Employee User View (My Work Only)"}
        </button>

        <button
          title="System Notifications"
          className="relative rounded-full p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900"></span>
          <IconBell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>

        {/* Profile Card */}
        <Link href="/employees/id" className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-xs font-extrabold text-white shadow-md group-hover:scale-105 transition">
            {userContext?.activeMode === "ADMIN_HR" ? "RV" : "AR"}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none group-hover:text-red-600 transition">
              {userContext?.activeMode === "ADMIN_HR" ? "Roushan Verma" : "Aditya Raj"}
            </p>
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-0.5 uppercase tracking-wider">
              {userContext?.activeMode === "ADMIN_HR" ? "Administrator / HR" : "Developer (User)"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
