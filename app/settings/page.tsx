"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredCompanyProfile,
  saveCompanyProfile,
  CompanyProfile,
  OfficeLocation,
} from "@/utils/companyStore";

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile>(getStoredCompanyProfile());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState<OfficeLocation>({
    id: "",
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isHeadquarters: false,
    phone: "",
    email: "",
  });

  // SMTP Configuration States
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("hr.oms.enterprise@gmail.com");
  const [smtpFromEmail, setSmtpFromEmail] = useState("hr@oms.com");
  const [testEmailRecipient, setTestEmailRecipient] = useState("admin@oms.com");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);

  useEffect(() => {
    setProfile(getStoredCompanyProfile());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanyProfile(profile);
    setToastMsg("✓ Company Profile & Location Details Saved Permanently!");
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const locId = `LOC-0${profile.officeLocations.length + 1}`;
    const updatedLocs = [...profile.officeLocations, { ...newLocation, id: locId }];
    const updatedProfile = { ...profile, officeLocations: updatedLocs };
    setProfile(updatedProfile);
    saveCompanyProfile(updatedProfile);
    setShowLocationModal(false);
    setToastMsg("✓ New Office Location Center Added & Saved!");
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleTestSmtpConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WELCOME",
          to: testEmailRecipient,
          name: "SMTP Diagnostics Administrator",
          employeeId: "EMP-ADMIN",
          subject: "⚡ OMS Enterprise SMTP Transport Diagnostics Test",
        }),
      });

      const data = await res.json();
      setSmtpTestResult(data);
      setToastMsg(data.success ? `✓ SMTP Test Email Dispatched to ${testEmailRecipient}!` : `❌ SMTP Connection Failed.`);
    } catch (err: any) {
      setSmtpTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-zinc-900 text-zinc-100 font-extrabold text-xs p-4 rounded-2xl shadow-xl border border-zinc-700 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* 👤 My Profile Quick Access Card */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 p-5 rounded-2xl border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xl shadow-inner shrink-0">
            👤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">My User Profile</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold border border-blue-500/30">
                Personal Settings
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage your personal details, emergency contacts, banking credentials, security password, and avatar.
            </p>
          </div>
        </div>
        <Link
          href="/employee/profile"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <span>Open My Profile</span>
          <span>→</span>
        </Link>
      </div>

      {/* 🖤 Unique Header Banner - Obsidian Carbon & Platinum Slate Mix Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-stone-900 to-zinc-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-zinc-800/60 text-zinc-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            System Administration & Control Center
          </span>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight mt-1">
            Company Identity, Office Locations & SMTP Transport Server
          </h1>
          <p className="text-xs text-zinc-300/80 mt-1">
            Manage official corporate tax registration, Indian Headquarters location, office branch network, and SMTP email server settings.
          </p>
        </div>
        <button
          onClick={() => setShowLocationModal(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md border border-zinc-600 transition flex items-center gap-1.5 self-start md:self-auto"
        >
          + Add Office Location
        </button>
      </div>

      {/* 📌 SECTION 1: Corporate Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6">
        <h2 className="font-extrabold text-slate-900 dark:text-zinc-100 text-base border-b border-slate-100 dark:border-zinc-800 pb-3">
          1. Company Identity & Headquarters Location
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Company Tagline / Domain *</label>
            <input
              type="text"
              required
              value={profile.tagline}
              onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Corporate Registration CIN Number *</label>
            <input
              type="text"
              required
              value={profile.taxRegistrationCin}
              onChange={(e) => setProfile({ ...profile, taxRegistrationCin: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-200 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">GSTIN Tax Registration Number *</label>
            <input
              type="text"
              required
              value={profile.gstinNumber}
              onChange={(e) => setProfile({ ...profile, gstinNumber: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 text-right">
          <button type="submit" className="bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition border border-zinc-700">
            💾 Save Company Profile & Location Details
          </button>
        </div>
      </form>

      {/* 📌 SECTION 2: SMTP Configuration */}
      <form onSubmit={handleTestSmtpConnection} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              Real Nodemailer Transport Service
            </span>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
              2. Corporate SMTP Email Server Configuration
            </h2>
          </div>
          <span className="bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-800">
            SMTP ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">SMTP Host Server *</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">SMTP Port *</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Sender Email Address *</label>
            <input
              type="email"
              value={smtpFromEmail}
              onChange={(e) => setSmtpFromEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2 font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="w-full sm:w-80">
            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Test Recipient Email:</label>
            <input
              type="email"
              required
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isTestingSmtp}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition shrink-0 border border-zinc-700"
          >
            {isTestingSmtp ? "Testing..." : "⚡ Test Live SMTP Connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
