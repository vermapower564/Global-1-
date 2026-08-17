"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/attendance");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecords(json.data);
        const todayStr = new Date().toISOString().split("T")[0];
        const activeToday = json.data.find((rec: any) => rec.date?.startsWith(todayStr) && !rec.checkOutTime);
        if (activeToday) {
          setClockedIn(true);
          setClockTime(new Date(activeToday.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUserContext());
    fetchAttendance();
  }, []);

  const handleClockToggle = async () => {
    if (!clockedIn) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setClockedIn(true);
          fetchAttendance();
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.warn("Check-in error:", err);
      }
    } else {
      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setClockedIn(false);
          fetchAttendance();
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.warn("Check-out error:", err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Attendance Clock</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">My Shift Punch Clock & History</h1>
          <p className="text-xs text-slate-500">Log daily shift check-in and check-out times stored safely in MySQL.</p>
        </div>

        <button
          onClick={handleClockToggle}
          className={`px-6 py-3 rounded-xl font-extrabold text-xs transition shadow-md border ${
            clockedIn ? "bg-rose-600 text-white border-rose-400" : "bg-blue-600 text-white border-blue-400"
          }`}
        >
          {clockedIn ? `🛑 Punch Out (${clockTime})` : "⏱️ Punch In / Start Shift"}
        </button>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Recent Attendance Punch Ledger</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Check-In</th>
                  <th className="pb-3">Check-Out</th>
                  <th className="pb-3">Hours Logged</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.slice(0, 10).map((r) => (
                  <tr key={r.id} className="font-semibold text-slate-700 dark:text-slate-300">
                    <td className="py-3 font-mono">{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                    <td className="py-3 font-mono text-emerald-600">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                    <td className="py-3 font-mono text-rose-600">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}</td>
                    <td className="py-3 font-bold">{r.hoursWorked ? `${r.hoursWorked} hrs` : "-"}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        r.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                      }`}>
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
