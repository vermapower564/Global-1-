"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext } from "@/utils/userContextStore";
import WorkTimeSlideViewer from "@/components/WorkTimeSlideViewer";

export default function EmployeeAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Digital Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    }, 1000);
    setCurrentTimeStr(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    return () => clearInterval(timer);
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      const res = await fetch("/api/attendance?period=today");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const activeToday = json.data.find((rec: any) => rec.isActiveShift || !rec.checkOutTime);
        if (activeToday) {
          setClockedIn(true);
          setClockTime(
            new Date(activeToday.checkInTime).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        } else {
          setClockedIn(false);
          setClockTime(null);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch shift status:", err);
    }
  };

  useEffect(() => {
    const u = getCurrentUserContext();
    setUser(u);
    if (u?.employeeId) {
      setEmployeeIdInput(u.employeeId);
    }
    fetchCurrentStatus();
  }, [refreshTrigger]);

  const handleClockToggle = async () => {
    setActionMsg("");
    setErrorMsg("");
    setIsSubmitting(true);

    const empIdToUse = employeeIdInput.trim() || user?.employeeId || user?.id;

    if (!clockedIn) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: empIdToUse, userId: user?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setActionMsg("✓ Punch-In Successful! Daily work shift clocked in on TiDB Cloud.");
          setClockedIn(true);
          setRefreshTrigger((prev) => prev + 1);
        } else {
          setErrorMsg(data.error || "Punch in failed.");
        }
      } catch (err) {
        setErrorMsg("Network error checking in.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!confirm("Are you sure you want to end your shift and Punch Out for today?")) {
        setIsSubmitting(false);
        return;
      }
      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: empIdToUse, userId: user?.id }),
        });
        const data = await res.json();
        if (data.success) {
          setActionMsg(`✓ Punch-Out Successful! Shift duration: ${data.hoursWorked} hrs recorded.`);
          setClockedIn(false);
          setRefreshTrigger((prev) => prev + 1);
        } else {
          setErrorMsg(data.error || "Punch out failed.");
        }
      } catch (err) {
        setErrorMsg("Network error checking out.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Employee Self-Service Desk
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono">
              {user?.name} ({user?.employeeId || "EMP"})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Biometric Shift Clock & Work Timeline
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Punch in when your shift begins, punch out when done, and explore your complete punch times and work delivery across Today, Yesterday, Daywise, Month, and Year.
          </p>
        </div>

        {/* Live Clock Card & Large Punch Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="text-center sm:text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              Live IST Time
            </span>
            <span className="text-xl font-black font-mono text-black">
              {currentTimeStr || "09:00:00 AM"}
            </span>
          </div>

          <button
            onClick={handleClockToggle}
            disabled={isSubmitting}
            className={`px-6 py-3.5 rounded-2xl font-black text-xs transition shadow-md cursor-pointer flex items-center gap-2 ${
              clockedIn
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            {isSubmitting ? (
              <span>Syncing with TiDB...</span>
            ) : clockedIn ? (
              <>
                <span>🛑</span>
                <span>PUNCH OUT SHIFT ({clockTime ? `Clocked: ${clockTime}` : "Active"})</span>
              </>
            ) : (
              <>
                <span>🟢</span>
                <span>PUNCH IN SHIFT NOW</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs shadow-2xs flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg("")} className="text-emerald-600 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs shadow-2xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-amber-700 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Embedded Slide Viewer for Employee */}
      <WorkTimeSlideViewer key={refreshTrigger} isAdmin={false} />
    </div>
  );
}
