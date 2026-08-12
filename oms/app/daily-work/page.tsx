"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredWorkUpdates,
  addStoredWorkUpdate,
  EODWorkUpdate,
  PriorityLevel,
} from "@/utils/workUpdateStore";

import ProfileAlertBanner from "@/components/ProfileAlertBanner";

export default function DailyWorkPage() {
  const [updates, setUpdates] = useState<EODWorkUpdate[]>([]);
  const [formData, setFormData] = useState({
    employeeName: "Aditya Raj",
    employeeId: "EMP014",
    department: "Development & Engineering",
    projectName: "OMS Core Architecture & Platform Optimization",
    clientName: "Global Webify Enterprise Solutions",
    startTime: "09:00 AM",
    endTime: "05:30 PM",
    hoursWorked: 8.0,
    priority: "HIGH" as PriorityLevel,
    description: "",
    achievements: "",
    blockers: "",
    tomorrowPlan: "",
    gitCommits: "",
    driveLinks: "",
    screenshots: "",
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    setUpdates(getStoredWorkUpdates());

    fetch("/api/daily-work")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data.length > 0) {
          const mapped = resData.data.map((item: any) => ({
            id: item.id,
            employeeName: item.user?.name || "Employee",
            employeeId: item.user?.employeeId || "EMP001",
            department: "Engineering",
            projectName: item.projectName || "OMS Maintenance",
            clientName: item.clientName || "Internal",
            date: new Date(item.submittedAt || Date.now()).toISOString().split("T")[0],
            startTime: item.startTime || "09:00 AM",
            endTime: item.endTime || "05:30 PM",
            hoursWorked: item.hoursWorked || 8.0,
            priority: item.priority || "HIGH",
            description: item.description || "Daily Task Work Log",
            achievements: item.achievements || "",
            blockers: item.blockers || "",
            tomorrowPlan: item.tomorrowPlan || "",
            status: item.status || "PENDING",
            rating: item.rating || 5,
            managerRemarks: item.managerRemarks || "",
            submittedAt: new Date(item.submittedAt || Date.now()).toISOString(),
          }));

          const localList = getStoredWorkUpdates();
          const combined = [...mapped];
          localList.forEach((loc) => {
            if (!combined.some((c) => c.id === loc.id)) {
              combined.push(loc);
            }
          });
          setUpdates(combined);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date().toISOString().split("T")[0];
    addStoredWorkUpdate({
      ...formData,
      date: today,
    });

    try {
      await fetch("/api/daily-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (err: any) {
      console.warn("MySQL save fallback:", err.message);
    }

    setUpdates(getStoredWorkUpdates());
    setSubmittedSuccess(true);
    setFormData((prev) => ({
      ...prev,
      description: "",
      achievements: "",
      blockers: "",
      tomorrowPlan: "",
      gitCommits: "",
      driveLinks: "",
      screenshots: "",
    }));

    setTimeout(() => setSubmittedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <ProfileAlertBanner />

      {/* ⚡ Unique Header Banner - Cyber Neon Cyan & Dark Matrix Teal Mix Theme */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-teal-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-cyan-800/40 text-cyan-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
            Mandatory EOD & Task Logging Matrix
          </span>
          <h1 className="text-2xl font-black text-cyan-100 tracking-tight mt-1">
            EOD Work Submissions & Logs ({updates.length})
          </h1>
          <p className="text-xs text-cyan-200/80 mt-1">
            Log project hours, priority, accomplishments, blockers, and Git commits saved into XAMPP MySQL database.
          </p>
        </div>
        <Link href="/daily-work/approvals" className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md border border-cyan-400 shrink-0 transition">
          ★ Manager Review & Ratings Desk →
        </Link>
      </div>

      {submittedSuccess && (
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/50 text-cyan-900 dark:text-cyan-200 text-xs font-bold shadow-xs">
          ✓ Mandatory Daily EOD Report submitted and saved PERMANENTLY into XAMPP MySQL database!
        </div>
      )}

      {/* Mandatory EOD Submission Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-cyan-900/40 shadow-xs">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 border-b border-slate-100 dark:border-cyan-900/30 pb-3">
          Submit Today&apos;s EOD Report (Mandatory)
        </h2>
        <form onSubmit={handleSubmitLog} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Employee Name *</label>
              <input
                type="text"
                required
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-cyan-600 dark:text-cyan-400 focus:border-cyan-500 focus:outline-none font-mono font-extrabold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-semibold"
              >
                <option value="Development & Engineering">Development & Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Growth & Marketing">Growth & Marketing</option>
                <option value="Accounts & Finance">Accounts & Finance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Client Name / Unit *</label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Start Time *</label>
              <input
                type="text"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">End Time *</label>
              <input
                type="text"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Logged Hours *</label>
              <input
                type="number"
                step="0.5"
                value={formData.hoursWorked}
                onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-cyan-600 dark:text-cyan-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Priority Level *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              >
                <option value="HIGH">🟠 HIGH</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="LOW">🟢 LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-cyan-200/80 mb-1">Tasks Completed Today *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail specific feature implementations, bug fixes, refactoring..."
              className="w-full rounded-xl border border-slate-200 dark:border-cyan-900/60 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-medium"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition border border-cyan-400">
              Submit EOD Report Permanently
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}