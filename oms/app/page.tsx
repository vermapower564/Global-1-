"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4">
      {/* Executive Black Hero Banner with Crimson Red Accents */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 p-8 sm:p-10 shadow-2xl overflow-hidden">
        {/* Subtle Background Red Glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-red-600/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-rose-600/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-block px-3 py-1 bg-red-950/80 border border-red-500/30 text-red-400 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner">
              ⚡ OMS Enterprise Operations Platform
            </span>
            <span className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-full text-[11px] font-bold uppercase tracking-wider">
              System Online 99.9%
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Unified Enterprise Operations, Workforce & CRM Engine
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Operations Management System (OMS) connects employee directory management, monthly salary approvals, developer velocity tracking, sales pipelines, marketing ROAS, and video production into one obsidian-dark enterprise hub.
            </p>
          </div>

          {/* Quick Action Navigation Buttons with Crimson Red Theme */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-red-600/30 border border-red-400/20"
            >
              📊 Open Executive Dashboard
            </Link>
            <Link
              href="/finance/payroll/approvals"
              className="bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold px-6 py-3 rounded-xl text-xs transition border border-emerald-500/30 shadow-md"
            >
              💵 Monthly Salary Approvals
            </Link>
            <Link
              href="/daily-work/approvals"
              className="bg-slate-900 hover:bg-slate-800 text-purple-300 font-bold px-6 py-3 rounded-xl text-xs transition border border-slate-700"
            >
              ★ EOD Review Desk
            </Link>
            <Link
              href="/auth/login"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-6 py-3 rounded-xl text-xs transition border border-slate-700"
            >
              🔐 Secure Portal Login
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Summary Bar (Black Card System with Red & Rupee Symbol) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-1 border-l-4 border-l-red-600">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
          <p className="text-3xl font-extrabold text-white">128 Staff</p>
          <span className="text-xs font-semibold text-red-400">Across 8 Core Departments</span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Payroll Net</span>
          <p className="text-3xl font-extrabold text-emerald-400">₹3,425,000</p>
          <span className="text-xs font-semibold text-emerald-400/80">Approved & Disbursed</span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-1 border-l-4 border-l-purple-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Annual Contract Value</span>
          <p className="text-3xl font-extrabold text-purple-400">₹7,500,000</p>
          <span className="text-xs font-semibold text-purple-400/80">Active Client Retainers</span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-1 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Health</span>
          <p className="text-3xl font-extrabold text-rose-400">99.9%</p>
          <span className="text-xs font-semibold text-rose-400/80">Zero Critical Downtime</span>
        </div>
      </div>

      {/* Core Enterprise Modules (Rearranged Order with Red Theme) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Integrated Departmental Operations Modules
          </h2>
          <span className="text-xs font-semibold text-slate-400">6 Core Systems Connected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Workforce & Salary Approvals */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 flex flex-col justify-between hover:border-red-900 transition">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-950 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xl shadow-md">
                👥
              </div>
              <h3 className="font-extrabold text-white text-lg">1. Workforce & Salary Approvals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage employee directory, organizational hierarchy tree, attendance punch clocks, and monthly salary disbursement sign-offs.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-900">
              <Link href="/employees" className="text-xs font-bold text-red-400 hover:underline">
                Employees →
              </Link>
              <Link href="/finance/payroll/approvals" className="text-xs font-bold text-emerald-400 hover:underline">
                Salary Approvals →
              </Link>
            </div>
          </div>

          {/* Module 2: Projects & Developer Tracker */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 flex flex-col justify-between hover:border-red-900 transition">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-950 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xl shadow-md">
                💻
              </div>
              <h3 className="font-extrabold text-white text-lg">2. Projects & Dev Work Tracker</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                7-Phase Gantt timeline, Kanban sprint boards, Git commit logs, PR reviews, bug counts, and developer velocity metrics.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-900">
              <Link href="/projects" className="text-xs font-bold text-red-400 hover:underline">
                Gantt Timeline →
              </Link>
              <Link href="/projects/dev-tracker" className="text-xs font-bold text-rose-400 hover:underline">
                Dev Tracker →
              </Link>
            </div>
          </div>

          {/* Module 3: Sales CRM & Clients */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 flex flex-col justify-between hover:border-red-900 transition">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-md">
                🏢
              </div>
              <h3 className="font-extrabold text-white text-lg">3. Sales CRM & Client Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lead qualification, Quotation/Proposal generator, deal tracking (Won/Lost), active contracts, and client profiles.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-900">
              <Link href="/sales" className="text-xs font-bold text-emerald-400 hover:underline">
                Sales Pipeline →
              </Link>
              <Link href="/clients" className="text-xs font-bold text-red-400 hover:underline">
                Client Portal →
              </Link>
            </div>
          </div>

          {/* Module 4: Digital Marketing & SEO */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 flex flex-col justify-between hover:border-red-900 transition">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-950 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xl shadow-md">
                🚀
              </div>
              <h3 className="font-extrabold text-white text-lg">4. Digital Marketing & SEO</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ad spend tracking (Meta, Google, LinkedIn), CPL & ROAS analytics, keyword ranks, and backlink health audit logs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-900">
              <Link href="/marketing" className="text-xs font-bold text-purple-400 hover:underline">
                Marketing Analytics →
              </Link>
            </div>
          </div>

          {/* Module 5: Social Media & Graphic Design */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 flex flex-col justify-between hover:border-red-900 transition">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-950 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold text-xl shadow-md">
                🎨
              </div>
              <h3 className="font-extrabold text-white text-lg">5. Social & Graphic Design</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Figma/Photoshop creative asset management, revision counts, client feedback loops, and post scheduling calendars.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-900">
              <Link href="/design" className="text-xs font-bold text-pink-400 hover:underline">
                Graphic Design Desk →
              </Link>
            </div>
          </div>

          {/* Module 6: Camera Team & Video Hub */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 flex flex-col justify-between hover:border-red-900 transition">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-950 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xl shadow-md">
                🎥
              </div>
              <h3 className="font-extrabold text-white text-lg">6. Camera & Video Production Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Video shoot logs, gear checkout tracking (Sony FX6, RED 6K), raw drive links, DaVinci Resolve color grading, and video versions.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-900">
              <Link href="/media" className="text-xs font-bold text-amber-400 hover:underline">
                Camera & Video Hub →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}