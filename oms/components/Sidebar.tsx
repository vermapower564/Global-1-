"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconUsers,
  IconCalendar,
  IconFileEdit,
  IconClipboardList,
  IconStar,
  IconTrendingUp,
  IconFolder,
  IconHistory,
  IconTerminal,
  IconBuilding,
  IconRocket,
  IconPalette,
  IconVideo,
  IconCreditCard,
  IconCoins,
  IconUserCheck,
  IconFileText,
  IconZap,
  IconSettings,
} from "./Icons";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Categorized Navigation Menu
  const navCategories = [
    {
      title: "Core",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: IconDashboard, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
        { name: "Master History", href: "/history", icon: IconHistory, color: "text-red-400 bg-red-500/10 border-red-500/30" },
      ],
    },
    {
      title: "Organization & Staff",
      items: [
        { name: "Employees", href: "/employees", icon: IconUsers, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
        { name: "Departments", href: "/departments", icon: IconBuilding, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
        { name: "Resignation & Exit", href: "/resignation", icon: IconFileEdit, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
      ],
    },
    {
      title: "HR & Attendance",
      items: [
        { name: "Attendance Desk", href: "/attendance", icon: IconCalendar, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
        { name: "Apply For Leave", href: "/leave/apply", icon: IconFileEdit, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
        { name: "HR Management", href: "/hr", icon: IconUserCheck, color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
        { name: "Monthly Payroll", href: "/payroll", icon: IconCoins, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        { name: "Intern Academy", href: "/interns", icon: IconFolder, color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
      ],
    },
    {
      title: "Operations & Work",
      items: [
        { name: "Daily Work EOD", href: "/daily-work", icon: IconClipboardList, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
        { name: "EOD Review Desk", href: "/daily-work/approvals", icon: IconStar, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
        { name: "Projects Roadmap", href: "/projects", icon: IconFolder, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
        { name: "Clients Directory", href: "/clients", icon: IconBuilding, color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
      ],
    },
    {
      title: "Growth & Production",
      items: [
        { name: "Sales & CRM", href: "/sales", icon: IconTrendingUp, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
        { name: "Marketing Campaigns", href: "/marketing", icon: IconRocket, color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30" },
        { name: "SEO Keyword Matrix", href: "/seo", icon: IconTrendingUp, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
        { name: "Dev Commit Tracker", href: "/development", icon: IconTerminal, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
        { name: "Graphic Design Assets", href: "/design", icon: IconPalette, color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
        { name: "Video Production", href: "/video-production", icon: IconVideo, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
      ],
    },
    {
      title: "IT & Treasury",
      items: [
        { name: "IT Hardware Assets", href: "/it-assets", icon: IconZap, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
        { name: "Finance Ledger", href: "/finance", icon: IconCreditCard, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
      ],
    },
    {
      title: "Governance",
      items: [
        { name: "Reports & Analytics", href: "/reports", icon: IconFileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
        { name: "Security Audit Logs", href: "/audit-logs", icon: IconHistory, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30" },
        { name: "Corporate Settings", href: "/settings", icon: IconSettings, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0 shadow-2xl fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300">
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-xl shadow-lg border border-purple-400/20">
            O
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-wider text-base leading-none bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              OMS Enterprise
            </h1>
            <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mt-1 block">
              ERP System v3.0
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navCategories.map((category) => (
          <div key={category.title} className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 block mb-1">
              {category.title}
            </span>
            {category.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-purple-400/40 font-bold"
                      : "text-slate-300 hover:bg-slate-900 border-transparent hover:border-slate-800"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border shadow-xs transition-all ${
                      isActive ? "bg-white/20 text-white border-white/30" : item.color
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <span className={isActive ? "text-white font-bold" : "text-slate-300 font-medium"}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Quick Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 text-center font-medium">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400 mr-1.5 animate-pulse"></span>
        OMS Enterprise • MySQL Prisma Backend
      </div>
    </aside>
  );
}