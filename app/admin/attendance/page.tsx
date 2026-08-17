"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setRecords(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Admin Control Desk</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Workforce Attendance Ledger & Shift Clock</h1>
          <p className="text-xs text-slate-500">Monitor employee shift punch times, hours worked, and attendance correlation in real-time.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Master Workforce Attendance Punch Logs</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading attendance ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Check-In</th>
                  <th className="pb-3">Check-Out</th>
                  <th className="pb-3">Shift Hours</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r.id} className="font-semibold text-slate-700 dark:text-slate-300">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{r.user?.name || "Employee"} ({r.user?.employeeId || "EMP"})</td>
                    <td className="py-3 font-mono">{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                    <td className="py-3 font-mono text-emerald-600">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                    <td className="py-3 font-mono text-rose-600">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active Shift"}</td>
                    <td className="py-3 font-bold">{r.hoursWorked ? `${r.hoursWorked} hrs` : "-"}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {r.status || "PRESENT"}
                      </span>
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
