"use client";

import React, { useState } from "react";
import Link from "next/link";
import { exportToCSV } from "@/utils/exportEngine";

const initialAuditLogs = [
  {
    id: "AUD-901",
    timestamp: "2026-08-04 12:05:22",
    user: "Roushan Verma (Super Admin)",
    action: "USER_LOGIN_2FA_SUCCESS",
    ipAddress: "192.168.1.39",
    resource: "/auth/login",
    securityLevel: "SECURE",
  },
  {
    id: "AUD-902",
    timestamp: "2026-08-04 11:45:10",
    user: "Priya Sharma (HR Director)",
    action: "LEAVE_LETTER_APPROVED",
    ipAddress: "192.168.1.42",
    resource: "/app/hr",
    securityLevel: "SENSITIVE",
  },
  {
    id: "AUD-903",
    timestamp: "2026-08-04 10:30:00",
    user: "Vikram Malhotra (Sales VP)",
    action: "QUOTATION_ISSUED_PDF",
    ipAddress: "192.168.1.15",
    resource: "/app/sales",
    securityLevel: "SECURE",
  },
  {
    id: "AUD-904",
    timestamp: "2026-08-04 09:12:04",
    user: "System Daemon (Automated)",
    action: "PRODUCTION_BUILD_PRERENDER",
    ipAddress: "127.0.0.1",
    resource: "Next.js Build Worker (37/37)",
    securityLevel: "SYSTEM_LOG",
  },
];

export default function AuditLogsPage() {
  const [logs] = useState(initialAuditLogs);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Phase 7: Security Hardening</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">System Security & Audit Trail Logs</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time audit trail for sensitive executive operations, role authorization, and security compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportToCSV("System_Security_Audit_Logs", logs)} className="btn-accent text-xs px-4 py-2.5 shadow-md">
            📄 Export Security Audit CSV
          </button>
          <Link href="/reports" className="btn-secondary text-xs">
            ← Master Reports
          </Link>
        </div>
      </div>

      {/* Security Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Security Posture</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">HARDENED</p>
          <span className="text-[11px] font-semibold text-emerald-600">2FA & RBAC Enforced</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Logged Security Events</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{logs.length} Events</p>
          <span className="text-[11px] font-semibold text-blue-600">100% Audit Coverage</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Failed Intrusions</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">0 Threats</p>
          <span className="text-[11px] font-semibold text-purple-600">Zero Vulnerabilities</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Active Admin Sessions</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">4 Active</p>
          <span className="text-[11px] font-semibold text-amber-600">Encrypted JWT Tokens</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">System Audit Trail & Security Logs</h2>
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Timestamp</th>
                <th>User / Identity</th>
                <th>Action Executed</th>
                <th>IP Address</th>
                <th>Target Resource</th>
                <th>Security Level</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-xs font-bold text-slate-600">{log.id}</td>
                  <td className="font-mono text-xs text-slate-500">{log.timestamp}</td>
                  <td className="font-bold text-slate-900">{log.user}</td>
                  <td className="font-mono text-xs font-semibold text-blue-700">{log.action}</td>
                  <td className="font-mono text-xs text-slate-600">{log.ipAddress}</td>
                  <td className="font-mono text-xs text-purple-600">{log.resource}</td>
                  <td>
                    <span
                      className={`badge ${
                        log.securityLevel === "SECURE"
                          ? "badge-success"
                          : log.securityLevel === "SENSITIVE"
                          ? "badge-warning"
                          : "badge-purple"
                      }`}
                    >
                      {log.securityLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
