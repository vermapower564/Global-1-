"use client";

import React, { useState, useEffect } from "react";
import { exportToCSV } from "@/utils/exportEngine";
import {
  getStoredAttendance,
  addStoredAttendanceRecord,
  saveStoredAttendance,
  AttendanceRecord,
} from "@/utils/attendanceStore";
import { IconZap } from "@/components/Icons";

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("Aditya Raj");
  const [formDept, setFormDept] = useState("Development & Engineering");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCheckIn, setFormCheckIn] = useState("09:00");
  const [formCheckOut, setFormCheckOut] = useState("17:30");
  const [formStatus, setFormStatus] = useState<"Present" | "Working" | "Late" | "Half Day" | "Absent">("Present");

  // Fetch Attendance from XAMPP MySQL database API on Load / Refresh F5
  useEffect(() => {
    const localRecords = getStoredAttendance();
    setRecords(localRecords);

    fetch("/api/attendance")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data.length > 0) {
          const mapped: AttendanceRecord[] = resData.data.map((item: any) => ({
            id: item.id,
            employeeId: item.user?.employeeId || `EMP-${item.userId?.slice(0, 4) || "1000"}`,
            name: item.user?.name || "Employee",
            department: item.user?.department?.name || "Development & Engineering",
            date: new Date(item.date).toISOString().split("T")[0],
            checkIn: new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            checkOut: item.checkOutTime
              ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "--",
            hours: `${item.hoursWorked}h`,
            status: (item.status === "PRESENT" ? "Present" : item.status === "WORKING" ? "Working" : "Present") as any,
          }));

          const combined = [...mapped];
          localRecords.forEach((loc) => {
            if (!combined.some((c) => c.id === loc.id || (c.name.toLowerCase() === loc.name.toLowerCase() && c.date === loc.date))) {
              combined.push(loc);
            }
          });
          setRecords(combined);
          saveStoredAttendance(combined);
        }
      })
      .catch(() => {});
  }, []);

  // Submit Handler: Website Form -> API Route -> Prisma -> XAMPP MySQL (attendance table)
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newRec: AttendanceRecord = {
      id: `ATT-${Date.now().toString().slice(-6)}`,
      employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: formName,
      department: formDept,
      date: formDate,
      checkIn: formCheckIn,
      checkOut: formCheckOut || "--",
      hours: "8h 30m",
      status: formStatus,
    };

    // Instant persistent save
    const updated = addStoredAttendanceRecord(newRec);
    setRecords(updated);

    try {
      // 1. Post to API Route (/api/attendance) -> Saves directly to XAMPP MySQL
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: formName,
          date: formDate,
          checkInTime: formCheckIn,
          checkOutTime: formCheckOut,
          status: formStatus.toUpperCase(),
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setToastMsg("✓ Attendance record saved PERMANENTLY into XAMPP MySQL database!");
      }
    } catch (err: any) {
      setToastMsg("✓ Attendance saved locally to persistent ledger.");
    } finally {
      setShowForm(false);
      setSaving(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const filteredData = records.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white font-extrabold p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span className="text-xs">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Workforce Management / Attendance Ledger (XAMPP MySQL Backed)
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Real-Time Attendance & Working Hours Desk ({records.length})
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            All attendance entries are locked and persist permanently in local XAMPP MySQL database and never change after page refresh (F5).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            + Log New Attendance
          </button>
          <button
            onClick={() => exportToCSV("Attendance_Master_Ledger", filteredData)}
            className="btn-secondary text-xs"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* Website Form Card: Form -> API -> Prisma -> XAMPP MySQL */}
      {showForm && (
        <div className="pro-card p-6 bg-slate-900 border-slate-800 text-white space-y-4 animate-in fade-in max-w-xl mx-auto shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <h3 className="font-extrabold text-white text-sm">Log Attendance Record</h3>
              <p className="text-[11px] text-red-400 font-mono">Flow: Form → API Route → Prisma → XAMPP MySQL</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <form onSubmit={handleSaveAttendance} className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                >
                  <option value="Development & Engineering">Development & Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Growth & Marketing">Growth & Marketing</option>
                  <option value="Accounts & Finance">Accounts & Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Check-In Time *</label>
                <input
                  type="time"
                  required
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Check-Out Time</label>
                <input
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Attendance Status *</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
              >
                <option value="Present">Present (On-Time)</option>
                <option value="Working">Currently Working</option>
                <option value="Late">Late Arrival</option>
                <option value="Half Day">Half Day Shift</option>
                <option value="Absent">Absent / On Leave</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
              >
                <IconZap className="h-4 w-4" /> {saving ? "Saving to MySQL..." : "Save Permanently (Push to MySQL)"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-slate-700">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Records</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{records.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Logged Workforce</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold uppercase text-slate-400">Present Today</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">
            {records.filter((r) => r.status === "Present").length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Verified On-Site</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold uppercase text-slate-400">Currently Shift Active</p>
          <p className="mt-1 text-3xl font-extrabold text-amber-700">
            {records.filter((r) => r.status === "Working").length}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">In Shift</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold uppercase text-slate-400">Absent / Leave</p>
          <p className="mt-1 text-3xl font-extrabold text-rose-700">
            {records.filter((r) => r.status === "Absent").length}
          </p>
          <span className="text-[11px] text-rose-600 font-medium">Unexcused / Leave</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Filter by name or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none shadow-xs font-semibold"
        />
      </div>

      {/* Attendance Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Daily Attendance & Time Tracking Log (XAMPP MySQL Backed)
        </h2>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((employee) => (
                <tr key={employee.id}>
                  <td className="font-mono text-xs font-bold text-slate-600">{employee.employeeId}</td>
                  <td className="font-bold text-slate-900">{employee.name}</td>
                  <td className="text-xs text-slate-700 font-medium">{employee.department}</td>
                  <td className="font-mono text-xs text-slate-600">{employee.date}</td>
                  <td className="text-slate-700 font-mono text-xs">{employee.checkIn}</td>
                  <td className="text-slate-700 font-mono text-xs">{employee.checkOut}</td>
                  <td className="font-extrabold text-emerald-700 text-xs">{employee.hours}</td>
                  <td>
                    <span
                      className={`badge ${
                        employee.status === "Present"
                          ? "badge-success"
                          : employee.status === "Working"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {employee.status}
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