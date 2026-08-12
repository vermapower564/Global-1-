"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconFileText,
  IconTerminal,
  IconUserCheck,
  IconRocket,
  IconTrendingUp,
  IconPalette,
  IconVideo,
  IconCoins,
  IconBuilding,
  IconZap,
} from "@/components/Icons";

const departmentOptions = [
  { id: "Engineering", name: "Development & Engineering", icon: IconTerminal, color: "from-blue-600 to-cyan-500" },
  { id: "Human Resources", name: "Human Resources", icon: IconUserCheck, color: "from-purple-600 to-pink-500" },
  { id: "Growth & Marketing", name: "Growth & Marketing", icon: IconRocket, color: "from-amber-500 to-orange-600" },
  { id: "Enterprise Sales", name: "Enterprise Sales", icon: IconTrendingUp, color: "from-emerald-600 to-teal-500" },
  { id: "UI/UX & Graphic Design", name: "UI/UX & Design", icon: IconPalette, color: "from-rose-500 to-red-600" },
  { id: "Camera & Video Production", name: "Media & Production", icon: IconVideo, color: "from-violet-600 to-indigo-600" },
  { id: "Accounts & Payroll", name: "Accounts & Finance", icon: IconCoins, color: "from-amber-600 to-yellow-500" },
];

export default function JoinCompanyQRPage() {
  const [selectedDept, setSelectedDept] = useState(departmentOptions[0]);
  const [roleTitle, setRoleTitle] = useState("Senior Executive / Lead");
  const [copiedLink, setCopiedLink] = useState(false);

  const registrationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/register?company=OMS_Enterprise&dept=${encodeURIComponent(selectedDept.id)}`
    : `http://localhost:3000/auth/register?company=OMS_Enterprise&dept=${encodeURIComponent(selectedDept.id)}`;

  // Crimson Red High-Contrast QR Code API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(registrationUrl)}&color=dc2626`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Glow Ambient Light Effects */}
      <div className="relative">
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-black p-8 border border-slate-800/80 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-red-400">
                OMS Recruitment System • Scan-To-Join
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Company Onboarding QR Portal
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Generate scannable recruitment QR Code badges for candidates to instantly register on mobile phones or PCs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-red-600/30 border border-red-400/20 transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <IconFileText className="h-4 w-4" /> Print HD Recruitment Poster
            </button>
            <Link href="/hr" className="btn-secondary text-xs px-4 py-3 rounded-xl">
              ← Back to HR Suite
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Glass QR Poster & Department Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Premium QR Code Badge Poster (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl bg-slate-900/90 backdrop-blur-xl p-8 border border-slate-800 shadow-2xl space-y-6 text-center hover:border-red-500/40 transition duration-300">
            {/* Top Brand Tag */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-2xl shadow-lg shadow-red-600/40 border border-red-400/30">
                  O
                </div>
                <div>
                  <h2 className="font-black text-white text-base leading-none">OMS Enterprise</h2>
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block mt-1">
                    Official Recruitment Portal
                  </span>
                </div>
              </div>
              <span className="badge badge-success text-[10px]">Active Portal</span>
            </div>

            {/* Glowing QR Frame */}
            <div className="relative inline-block p-4 rounded-2xl bg-white shadow-2xl border-4 border-red-600/20 group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 opacity-20 blur-md group-hover:opacity-40 transition duration-500"></div>
              <img
                src={qrImageUrl}
                alt="Scan to Join OMS Enterprise"
                className="relative h-64 w-64 object-contain rounded-xl"
              />
            </div>

            {/* Department Info Box */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Scan With Mobile Smartphone
              </span>
              <h3 className="font-extrabold text-white text-base">
                Join <span className="text-red-400">{selectedDept.name}</span>
              </h3>
              <p className="text-xs text-slate-400">Position: {roleTitle}</p>
            </div>

            {/* URL Display */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 truncate">
              {registrationUrl}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Department Switcher & Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="pro-card p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                1. Select Target Department
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Click any department below to update the scannable QR code instantly:
              </p>
            </div>

            {/* Interactive Department Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departmentOptions.map((dept) => {
                const IconComp = dept.icon;
                const isSelected = selectedDept.id === dept.id;

                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3.5 ${
                      isSelected
                        ? "bg-slate-950 text-white border-red-600 shadow-xl ring-2 ring-red-600/30"
                        : "bg-white text-slate-800 border-slate-200 hover:border-red-300 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        isSelected
                          ? `bg-gradient-to-tr ${dept.color} text-white`
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-extrabold text-xs truncate">{dept.name}</p>
                      <span className={`text-[10px] font-semibold ${isSelected ? "text-red-400" : "text-slate-400"}`}>
                        {isSelected ? "Selected ✓" : "Click to Generate"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Role Title Input */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                2. Position Designation / Role Title
              </h3>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 font-semibold focus:border-red-600 focus:outline-none bg-slate-50"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 px-5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <IconZap className="h-4 w-4 text-amber-400" />
                {copiedLink ? "✓ Copied Direct URL!" : "Copy Direct Registration URL"}
              </button>

              <Link
                href={`/auth/register?company=OMS_Enterprise&dept=${encodeURIComponent(selectedDept.id)}`}
                className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3.5 px-5 rounded-xl text-center shadow-lg shadow-red-600/25 transition"
              >
                Launch Candidate Form →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
