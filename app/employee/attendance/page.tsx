"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Digital Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    }, 1000);
    setCurrentTimeStr(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    return () => clearInterval(timer);
  }, []);

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
          setClockTime(new Date(activeToday.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        } else {
          setClockedIn(false);
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
    setActionMsg("");
    setErrorMsg("");

    if (!clockedIn) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setActionMsg("✓ Punch In Successful! Daily shift session started.");
          setClockedIn(true);
          fetchAttendance();
        } else {
          setErrorMsg(data.error || "Punch in failed.");
        }
      } catch (err) {
        setErrorMsg("Network error checking in.");
      }
    } else {
      if (!confirm("Are you sure you want to end your shift and Punch Out for today?")) return;
      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setActionMsg("✓ Punch Out Successful! Shift duration logged in MySQL.");
          setClockedIn(false);
          fetchAttendance();
        } else {
          setErrorMsg(data.error || "Punch out failed.");
        }
      } catch (err) {
        setErrorMsg("Network error checking out.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Shift Attendance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Shift Punch Clock & Daily Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log shift check-in and check-out times stored in MySQL. (Policy: 1 Punch Shift Limit Per Day).
          </p>
        </div>

        {/* Live Clock Card & Large Punch Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-center sm:text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Live IST Time</span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{currentTimeStr || "09:00:00 AM"}</span>
          </div>

          <button
            onClick={handleClockToggle}
            className={`px-6 py-3.5 rounded-2xl font-black text-xs transition shadow-md cursor-pointer ${
              clockedIn
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
            }`}
          >
            {clockedIn ? `🛑 PUNCH OUT SHIFT (${clockTime || "Active"})` : "⏱️ PUNCH IN SHIFT"}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs shadow-sm animate-in fade-in">
          {actionMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs shadow-sm animate-in fade-in">
          {errorMsg}
        </div>
      )}

      {/* Shift Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Scheduled Shift</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono">09:00 AM - 06:00 PM</p>
          <span className="text-xs text-slate-500 block">Standard 9-Hour Corporate Shift</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-200 dark:border-blue-900 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-blue-600">Current Punch Status</span>
          <p className="text-xl font-black text-blue-600">
            {clockedIn ? "PUNCHED IN (Active)" : "NOT PUNCHED IN"}
          </p>
          <span className="text-xs text-slate-500 block">1 Punch Per Day Policy Enforced</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Today's Duration</span>
          <p className="text-xl font-black text-emerald-600 font-mono">
            {records[0]?.hoursWorked ? `${records[0].hoursWorked} hrs` : (clockedIn ? "In Shift" : "0.00 hrs")}
          </p>
          <span className="text-xs text-slate-500 block">Calculated Working Duration</span>
        </div>
      </div>

      {/* Attendance Punch Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-black text-slate-900 dark:text-white text-base">Attendance Punch Ledger</h2>
          <span className="text-xs font-bold text-slate-400">Recent MySQL Records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading attendance ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Punch In</th>
                  <th className="py-3 px-3">Punch Out</th>
                  <th className="py-3 px-3">Logged Duration</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-emerald-600">
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-rose-600">
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : (r.checkInTime ? "Active" : "—")}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-blue-600">
                      {r.hoursWorked ? `${r.hoursWorked} hrs` : (r.checkInTime ? "In Progress" : "0.00 hrs")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
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
