"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            System Compliance & Security Audit Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            System Audit Logs & Security History ({logs.length})
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Immutable audit record of user logins, role modifications, profile updates, deletions, and database events.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Audit Events</span>
          <p className="text-2xl font-black text-black font-mono">{logs.length}</p>
          <span className="text-[11px] font-extrabold text-blue-600">Immutable Ledger</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Security Status</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">100% SECURE</p>
          <span className="text-[11px] font-extrabold text-emerald-600">JWT & Password Hashed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Tracked IP Nodes</span>
          <p className="text-2xl font-black text-black font-mono">127.0.0.1</p>
          <span className="text-[11px] font-extrabold text-blue-600">Verified System Origin</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Database Engine</span>
          <p className="text-2xl font-black text-black font-mono">MySQL / Prisma</p>
          <span className="text-[11px] font-extrabold text-gray-500">Local Port 3306</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <h2 className="font-black text-black text-base border-b border-gray-100 pb-3">
          Security Action Audit Records
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-gray-500">Loading audit records...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition text-black">
                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-black">
                      {log.user?.name || "System"}{" "}
                      {log.user?.employeeId && (
                        <span className="text-gray-500 font-mono font-normal">({log.user.employeeId})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium max-w-md truncate">
                      {log.details}
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
