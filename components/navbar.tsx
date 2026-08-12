"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationPopover from "./NotificationPopover";

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const pathname = usePathname();

  const getPageTitle = (path: string | null) => {
    if (!path || path === "/") return "Overview";
    const segment = path.split("/")[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* 3-Line Hamburger Button & Breadcrumb / Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            title="Toggle OMS Enterprise Menu"
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 transition shadow-xs"
          >
            <span className="text-lg font-bold">☰</span>
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
            OMS /
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {getPageTitle(pathname)}
          </h2>

          {/* Live System Health Badge */}
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
              placeholder="Search records, staff, invoices..."
              className="w-64 rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-9 pr-4 text-xs focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-xs"
            />
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          <NotificationPopover />

          <div className="h-5 w-px bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xs border border-slate-700">
              RV
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                Roushan Verma
              </p>
              <p className="text-[10px] font-medium text-slate-400 leading-tight">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}