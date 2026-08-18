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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Control Desk</span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Workforce Attendance Ledger & Shift Clock
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor employee shift punch times, hours worked, and attendance records in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/employees"
            className="bg-white hover:bg-gray-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition"
          >
            ← Employee Directory
          </Link>
        </div>
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-black text-base">
            Master Workforce Attendance Punch Logs ({records.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-bold text-xs">Loading attendance ledger...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-black font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Shift Hours</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition text-black">
                    <td className="py-3 px-4 font-bold text-black">
                      <Link
                        href={`/admin/employees/${r.user?.employeeId || r.userId}`}
                        className="hover:text-blue-600 transition"
                      >
                        {r.user?.name || "Employee"} <span className="font-mono text-gray-500 font-normal">({r.user?.employeeId || "EMP"})</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Active Shift"}
                    </td>
                    <td className="py-3 px-4 font-bold text-black font-mono">
                      {r.hoursWorked ? `${r.hoursWorked} hrs` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {r.status || "PRESENT"}
                      </span>
                    </td>
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 italic text-xs">
                      No attendance punch records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
