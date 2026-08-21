"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconDashboard,
  IconUsers,
  IconCalendar,
  IconFileEdit,
  IconClipboardList,
  IconFolder,
  IconFileText,
  IconUserCheck,
  IconCoins,
} from "@/components/Icons";

export default function HRDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Failed to fetch HR dashboard data");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading HR metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleQuickLeaveAction = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leaveId, status, hrRemarks: `Quick decision by HR (${status})` }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setToastMsg(`✓ Leave application marked as ${status}!`);
        fetchHRData();
      } else {
        alert(json.error || "Failed to update leave request");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setTimeout(() => setToastMsg(null), 4000);
  };

  const summary = data?.summary || {
    totalEmployees: 0,
    activeEmployees: 0,
    newJoiners: 0,
    pendingLeavesCount: 0,
    pendingResignationsCount: 0,
    todayAttendance: { present: 0, active: 0, ratio: "0 / 0", percentage: 0 },
  };

  const recentEmployees = data?.recentEmployees || [];
  const pendingLeaves = data?.pendingLeaveRequests || [];
  const recentActivities = data?.recentActivities || [];

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
        <div className="text-4xl">🚫</div>
        <h2 className="text-lg font-black text-rose-900">HR Access Restricted</h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">{error}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Admin Dashboard
          </Link>
          <Link
            href="/employee/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            My Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Operations & Workforce</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>👥</span> HR Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Centralized employee lifecycle management, attendance ledger, leave reviews, onboarding, and resignation workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/hr/onboarding"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>✉️</span> + Invite Joinee
          </Link>
          <Link
            href="/hr/attendance"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📅</span> Attendance Radar
          </Link>
          <Link
            href="/hr/leave"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋</span> Leave Requests
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* 1. Main KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Employees</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalEmployees}</span>
            <span className="text-xs font-bold text-slate-500">All staff</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Headcount registered</p>
        </div>

        {/* Card 2: Active Employees */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-300 border-l-4 border-l-emerald-500 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active Employees</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{summary.activeEmployees}</span>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
              {summary.totalEmployees > 0 ? Math.round((summary.activeEmployees / summary.totalEmployees) * 100) : 100}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Active workforce</p>
        </div>

        {/* Card 3: New Joiners */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-300 border-l-4 border-l-blue-500 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">New Joiners</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{summary.newJoiners}</span>
            <span className="text-xs font-bold text-blue-600">Last 60d</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Recent onboardings</p>
        </div>

        {/* Card 4: Pending Leaves */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-amber-300 border-l-4 border-l-amber-500 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending Leaves</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{summary.pendingLeavesCount}</span>
            <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">Review</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting decision</p>
        </div>

        {/* Card 5: Pending Resignations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-rose-300 border-l-4 border-l-rose-500 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending Resignations</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{summary.pendingResignationsCount}</span>
            <span className="text-[10px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md">Exit</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Notice clearance</p>
        </div>

        {/* Card 6: Today's Attendance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-300 border-l-4 border-l-indigo-500 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Today's Attendance</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-600">{summary.todayAttendance.ratio}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {summary.todayAttendance.percentage}% present today
          </p>
        </div>
      </div>

      {/* 2. Middle Section: Recent Employees & Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>👤</span> Recent Employees
              </h2>
              <p className="text-xs text-slate-400 font-medium">Recently registered and active team members</p>
            </div>
            <Link
              href="/hr/employees"
              className="text-xs font-black text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
            >
              View All Employees ({summary.totalEmployees}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Employee ID</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-3">Joining Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  recentEmployees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="h-8 w-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                              {emp.name?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{emp.employeeId}</td>
                      <td className="py-3 px-3 text-slate-600 font-bold">{emp.department}</td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">{emp.designation}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{emp.joiningDate}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                            emp.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/hr/employees/${emp.id || emp.employeeId}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-lg text-[11px] transition inline-block cursor-pointer"
                        >
                          Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Leave Requests (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>📋</span> Pending Leaves
              </h2>
              <p className="text-xs text-slate-400 font-medium">Awaiting HR authorization</p>
            </div>
            <Link href="/hr/leave" className="text-xs font-black text-blue-600 hover:text-blue-700">
              Manage All →
            </Link>
          </div>

          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-2xl block mb-1">✓</span>
                <p className="text-xs font-bold text-slate-500">All leave requests have been reviewed.</p>
              </div>
            ) : (
              pendingLeaves.map((leave: any) => (
                <div
                  key={leave.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-900">{leave.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{leave.employeeId} • {leave.department}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black rounded-md">
                      {leave.leaveType}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      📅 {leave.startDate} to {leave.endDate}
                    </span>
                    <span className="font-bold text-slate-800 font-mono">({leave.totalDays}d)</span>
                  </div>

                  <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100 line-clamp-1">
                    "{leave.reason}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleQuickLeaveAction(leave.id, "REJECTED")}
                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black rounded-lg transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleQuickLeaveAction(leave.id, "APPROVED")}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition shadow-xs cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Recent HR Activity & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent HR Activity (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> Recent HR Activity
              </h2>
              <p className="text-xs text-slate-400 font-medium">Log of workforce events, approvals, and onboarding</p>
            </div>
            <span className="text-xs font-bold text-slate-400">Live Audit Stream</span>
          </div>

          <div className="space-y-2.5">
            {recentActivities.map((act: any) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:border-slate-200 transition"
              >
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  📌
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {act.action?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{act.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Logged by: {act.userName} ({act.userRole})</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick HR Navigation Hub (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>🧭</span> HR Navigation Hub
            </h2>
            <p className="text-xs text-slate-400 font-medium">Quick access to authorized HR modules</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/hr/employees"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-center space-y-1 block cursor-pointer group"
            >
              <div className="text-lg">👥</div>
              <p className="text-xs font-black text-slate-900 group-hover:text-blue-700">Employees</p>
              <p className="text-[10px] text-slate-400">{summary.totalEmployees} Registered</p>
            </Link>

            <Link
              href="/hr/attendance"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition text-center space-y-1 block cursor-pointer group"
            >
              <div className="text-lg">📅</div>
              <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700">Attendance</p>
              <p className="text-[10px] text-slate-400">{summary.todayAttendance.ratio} Today</p>
            </Link>

            <Link
              href="/hr/leave"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition text-center space-y-1 block cursor-pointer group"
            >
              <div className="text-lg">📋</div>
              <p className="text-xs font-black text-slate-900 group-hover:text-amber-700">Leave Desk</p>
              <p className="text-[10px] text-slate-400">{summary.pendingLeavesCount} Pending</p>
            </Link>

            <Link
              href="/hr/onboarding"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition text-center space-y-1 block cursor-pointer group"
            >
              <div className="text-lg">🚀</div>
              <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700">Onboarding</p>
              <p className="text-[10px] text-slate-400">{summary.activeInvitationsCount} Invited</p>
            </Link>

            <Link
              href="/hr/documents"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition text-center space-y-1 block cursor-pointer group"
            >
              <div className="text-lg">📁</div>
              <p className="text-xs font-black text-slate-900 group-hover:text-purple-700">Documents</p>
              <p className="text-[10px] text-slate-400">{summary.trackedDocumentsCount} Tracked</p>
            </Link>

            <Link
              href="/hr/reports"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition text-center space-y-1 block cursor-pointer group"
            >
              <div className="text-lg">📊</div>
              <p className="text-xs font-black text-slate-900 group-hover:text-rose-700">HR Reports</p>
              <p className="text-[10px] text-slate-400">Analytics & CSV</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}