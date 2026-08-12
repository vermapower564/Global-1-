"use client";

import React, { useState, useEffect } from "react";

interface DevCommitItem {
  id: string;
  commitHash: string;
  repository: string;
  branch: string;
  linesAdded: number;
  linesDeleted: number;
  commitMessage: string;
  committedAt: string;
  user?: {
    name: string;
    employeeId: string;
    email: string;
  };
}

export default function DevelopmentPage() {
  const [commits, setCommits] = useState<DevCommitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/development")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCommits(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalLinesAdded = commits.reduce((sum, c) => sum + c.linesAdded, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ⚡ Header Banner - Slate & Developer Indigo Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-indigo-900/40 text-indigo-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
            Software Development & Git Engineering Tracker
          </span>
          <h1 className="text-2xl font-black text-indigo-100 tracking-tight mt-1">
            Dev Commit Logs & Repository Activity ({commits.length})
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1">
            Track line additions, deleted lines, feature commits, pull requests, and developer velocity.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-indigo-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">Total Commits Logged</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{commits.length}</p>
          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">Git Repository Main</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">Lines Code Added</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">+{totalLinesAdded}</p>
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Net Feature Build</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">Active Engineers</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">12 Devs</p>
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">Full-Stack Engineers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-indigo-300/80">PR Build Status</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">100% PASS</p>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400">Next.js Turbopack</span>
        </div>
      </div>

      {/* Dev Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-indigo-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-indigo-900/30 pb-3">
          Git Repository Commit Log Ledger (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading commit logs from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Commit Hash</th>
                  <th>Developer</th>
                  <th>Repository / Branch</th>
                  <th>Diff Lines</th>
                  <th>Commit Message</th>
                  <th>Committed At</th>
                </tr>
              </thead>
              <tbody>
                {commits.map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-950/10 transition">
                    <td className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{c.commitHash}</td>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-white">{c.user?.name || "System Developer"}</p>
                      <p className="font-mono text-[10px] text-slate-500">{c.user?.employeeId || "EMP014"}</p>
                    </td>
                    <td>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{c.repository}</p>
                      <span className="badge badge-neutral text-[9px]">branch: {c.branch}</span>
                    </td>
                    <td className="font-mono text-xs">
                      <span className="text-emerald-600 font-extrabold">+{c.linesAdded}</span>{" "}
                      <span className="text-rose-600 font-bold">-{c.linesDeleted}</span>
                    </td>
                    <td className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xs">{c.commitMessage}</td>
                    <td className="font-mono text-xs text-slate-500">
                      {new Date(c.committedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
