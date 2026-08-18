"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeWorkPage() {
  const [user, setUser] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // EOD Form States
  const [projectName, setProjectName] = useState("OMS Enterprise Portal 2.0");
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [achievements, setAchievements] = useState("");
  const [blockers, setBlockers] = useState("");
  const [hoursWorked, setHoursWorked] = useState("8.0");
  const [gitCommits, setGitCommits] = useState("");
  const [tomorrowsPlan, setTomorrowsPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const fetchEodReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-work");
      const json = await res.json();
      if (json.success) setUpdates(json.data || []);
    } catch (e) {
      console.warn("Failed to fetch EOD reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUserContext());
    fetchEodReports();
  }, []);

  const handleSubmitEod = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg("");
    if (!tasksCompleted.trim()) {
      alert("Please describe the tasks completed today.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/daily-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          projectName,
          description: tasksCompleted.trim(),
          achievements: achievements.trim() || undefined,
          blockers: blockers.trim() || undefined,
          hoursWorked: parseFloat(hoursWorked) || 8.0,
          gitCommits: gitCommits.trim() || undefined,
          tomorrowsPlan: tomorrowsPlan.trim() || undefined,
          status: "SUBMITTED",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMsg("✓ EOD Report submitted successfully to MySQL database!");
        setTasksCompleted("");
        setAchievements("");
        setBlockers("");
        setGitCommits("");
        setTomorrowsPlan("");
        fetchEodReports();
      } else {
        alert(data.error || "Failed to submit EOD report.");
      }
    } catch (err) {
      alert("Network error submitting EOD report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Daily Work Log Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            End of Day (EOD) Work Reporting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit daily task progress, deliverables, Git commit hashes, and report blockers directly to your project manager.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs shadow-sm animate-in fade-in">
          {actionMsg}
        </div>
      )}

      {/* Main Container: Form + EOD History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            + Submit Today's EOD Report
          </h2>

          <form onSubmit={handleSubmitEod} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Project Name *</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Tasks Completed Today *</label>
              <textarea
                rows={3}
                required
                value={tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
                placeholder="Describe key work items completed today..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Key Achievements / PR Links</label>
              <input
                type="text"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="e.g. Completed single login RBAC guard"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-rose-600">Blockers / Challenges (If Any)</label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Describe technical blockers requiring support..."
                className="w-full rounded-xl border border-rose-200 dark:border-rose-900 px-3 py-2 bg-rose-50/50 dark:bg-rose-950/40 text-slate-900 dark:text-white focus:border-rose-600 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Hours Logged</label>
                <input
                  type="number"
                  step="0.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Git Commit Hash</label>
                <input
                  type="text"
                  value={gitCommits}
                  onChange={(e) => setGitCommits(e.target.value)}
                  placeholder="e.g. commit 4f891a"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Tomorrow's Plan</label>
              <input
                type="text"
                value={tomorrowsPlan}
                onChange={(e) => setTomorrowsPlan(e.target.value)}
                placeholder="What will you work on tomorrow?"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              {isSubmitting ? "Submitting EOD..." : "Submit EOD Report →"}
            </button>
          </form>
        </div>

        {/* EOD History Ledger */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-black text-slate-900 dark:text-white text-base">EOD Submission History</h2>
            <span className="text-xs font-bold text-slate-400">Database Records</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading EOD reports...</div>
          ) : updates.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="text-2xl">📋</div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">No EOD Reports Yet</h3>
              <p className="text-xs text-slate-500">Submit your first EOD report using the form.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((u) => (
                <div key={u.id} className="bg-slate-50/60 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {u.projectName || "OMS Project"} • {u.date ? new Date(u.date).toLocaleDateString("en-IN") : "Today"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      u.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {u.status || "SUBMITTED"}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{u.description}</h3>
                  {u.achievements && <p className="text-xs text-slate-600 dark:text-slate-400">🏆 <strong>Achievements:</strong> {u.achievements}</p>}
                  {u.blockers && <p className="text-xs text-rose-600 font-semibold">⚠️ <strong>Blockers:</strong> {u.blockers}</p>}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                    <span>Logged Hours: {u.hoursWorked || 8.0} hrs</span>
                    <span>Submitted by {user?.name || "Employee"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
