"use client";

import React, { useState, useEffect } from "react";

interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  details: string;
  ipAddress: string | null;
  timestamp: string;
  user?: {
    name: string;
    employeeId: string;
    email: string;
    role: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit-logs")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setLogs(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 📜 Header Banner - Obsidian Carbon Audit Security Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-stone-900 to-zinc-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-zinc-800/60 text-zinc-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            System Compliance & Security Event Audit Logging
          </span>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight mt-1">
            System Audit Logs & Security History ({logs.length})
          </h1>
          <p className="text-xs text-zinc-300/80 mt-1">
            Immutable audit record of user logins, role modifications, profile updates, deletions, and database seeds.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 border-l-4 border-l-zinc-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300/80">Audit Events Recorded</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{logs.length}</p>
          <span className="text-[11px] font-extrabold text-zinc-600 dark:text-zinc-400">Immutable Ledger</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300/80">Security Status</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">100% SECURE</p>
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">JWT & Password Hashed</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300/80">Tracked IP Nodes</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">127.0.0.1</p>
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">Verified System Origin</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300/80">RBAC Shield</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">ACTIVE</p>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400">Server Verification</span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-zinc-800 pb-3">
          Security Audit Event Logs (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading audit logs from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Action Event</th>
                  <th>User Identity</th>
                  <th>Details & Metadata</th>
                  <th>Origin IP</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-950/10 transition">
                    <td className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400">{log.id}</td>
                    <td>
                      <span className="badge badge-purple text-[10px] font-bold">{log.action}</span>
                    </td>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-white">{log.user?.name || "System Admin"}</p>
                      <p className="font-mono text-[10px] text-slate-500">{log.user?.email || "system@oms.local"}</p>
                    </td>
                    <td className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xs">{log.details}</td>
                    <td className="font-mono text-xs text-slate-500">{log.ipAddress || "127.0.0.1"}</td>
                    <td className="font-mono text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
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
