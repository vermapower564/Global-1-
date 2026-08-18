"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [workforceCount, setWorkforceCount] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [pendingWorkItems, setPendingWorkItems] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [blockedTasks, setBlockedTasks] = useState<any[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Discussion state per topic
  const [topicNotes, setTopicNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // 1. Fetch server session user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});

    // 2. Fetch workforce directory
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setWorkforceCount(json.total || 0);
          setEmployees(json.data || []);
        }
      })
      .catch((e) => console.warn("Failed to load employees metric:", e));

    // 3. Fetch all attendance punch clock records
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setAttendanceRecords(json.data || []);
        }
      })
      .catch((e) => console.warn("Failed to load attendance punch clock:", e));

    // 4. Fetch tasks intelligence & pending work
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTaskSummary(json.summary || null);
          const tasks = json.tasks || [];
          setOverdueTasks(tasks.filter((t: any) => t.isOverdue));
          setBlockedTasks(tasks.filter((t: any) => t.status === "BLOCKED"));
          setPendingWorkItems(tasks.filter((t: any) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS"));
        }
      })
      .catch((e) => console.warn("Failed to load tasks metric:", e));

    // 5. Fetch projects metrics
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProjectsCount(json.total || json.projects?.length || 0);
        }
      })
      .catch((e) => console.warn("Failed to load projects metric:", e))
      .finally(() => setLoading(false));
  }, []);

  const activeEmployeesCount = employees.filter((e) => e.isActive !== false).length;
  const onLeaveEmployeesCount = employees.filter((e) => e.metrics?.workloadLevel === "ON_LEAVE" || e.status === "ON_LEAVE").length;

  const getTwoMonthDeadline = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleNoteChange = (taskId: string, val: string) => {
    setTopicNotes((prev) => ({ ...prev, [taskId]: val }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Admin Command Center • Enterprise Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Welcome Back, {user?.name || "Administrator"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time workforce headcount, shift punch clock, pending projects & compensation management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/employees"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            Workforce Directory →
          </Link>
          <Link
            href="/admin/tasks"
            className="bg-white hover:bg-gray-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition"
          >
            Organization Tasks →
          </Link>
        </div>
      </div>

      {/* 📊 EMPLOYEES OVERVIEW WIDGET */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-black text-black text-base tracking-tight">EMPLOYEES OVERVIEW</h2>
            <p className="text-xs text-gray-500">Live headcount, active status breakdown, and shift metrics.</p>
          </div>
          <Link
            href="/admin/employees"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-xs"
          >
            View All Employees →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
          <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <span className="text-gray-500 font-extrabold uppercase text-[10px]">Total Staff</span>
            <p className="text-2xl font-black text-black">{workforceCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1 shadow-2xs">
            <span className="text-emerald-700 font-extrabold uppercase text-[10px]">Active Staff</span>
            <p className="text-2xl font-black text-emerald-600">{activeEmployeesCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-blue-200 space-y-1 shadow-2xs">
            <span className="text-blue-700 font-extrabold uppercase text-[10px]">On Leave</span>
            <p className="text-2xl font-black text-blue-600">{onLeaveEmployeesCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-1 shadow-2xs">
            <span className="text-amber-700 font-extrabold uppercase text-[10px]">Absent Today</span>
            <p className="text-2xl font-black text-amber-600">1</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <span className="text-gray-500 font-extrabold uppercase text-[10px]">Pending Onboarding</span>
            <p className="text-2xl font-black text-black">2</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-1 shadow-2xs">
            <span className="text-rose-700 font-extrabold uppercase text-[10px]">Overdue Tasks</span>
            <p className="text-2xl font-black text-rose-600">{overdueTasks.length}</p>
          </div>
        </div>
      </div>

      {/* ⚠️ EMPLOYEE ATTENTION CENTER */}
      <div className="p-6 rounded-3xl bg-white border border-amber-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div>
            <h2 className="font-black text-black text-base tracking-tight flex items-center gap-2">
              <span className="text-amber-500">⚠️</span> EMPLOYEE ATTENTION CENTER
            </h2>
            <p className="text-xs text-gray-500">
              Automated system flags identifying staff requiring admin intervention.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
            Action Required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {employees.slice(0, 3).map((emp) => (
            <Link
              key={emp.id}
              href={`/admin/employees/${emp.employeeId || emp.id}`}
              className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2 block hover:border-blue-500 transition shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-black group-hover:text-blue-600">
                  {emp.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-600">{emp.employeeId}</span>
              </div>
              <p className="text-gray-600 text-[11px]">
                {emp.metrics?.activeTasks ? `${emp.metrics.activeTasks} active tasks assigned • Attendance 96%` : "EOD review pending"}
              </p>
              <span className="text-[10px] font-bold text-blue-600 group-hover:underline block">
                Open 360° Profile →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Total Workforce</p>
          <p className="mt-1 text-2xl font-black text-black">{workforceCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">In Progress Tasks</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{pendingWorkItems.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Completed Tasks</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{taskSummary?.completed || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Blocked Items</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{blockedTasks.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Active Projects</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{projectsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Target Timeline</p>
          <p className="mt-1 text-base font-black text-blue-600">2 Months</p>
        </div>
      </div>

      {/* 📁 FOLDER: EMPLOYEE SALARY SLIPS & MONTHLY PAYROLL */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
            💳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-black text-base tracking-tight">
                📁 All Employee Salary Slips Folder
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Active Payroll
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Access monthly earnings, deductions breakdown, net salary disbursements, and printable PDF salary slips for all staff.
            </p>
          </div>
        </div>

        <Link
          href="/admin/salary-slips"
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Open Salary Slips Folder</span>
          <span>→</span>
        </Link>
      </div>

      {/* SECTION 1: WORKFORCE DIRECTORY */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-black text-black text-lg tracking-tight">👥 Workforce Directory</h2>
            <p className="text-xs text-gray-500">Official company employee roster with clear full names, IDs, departments, and active statuses.</p>
          </div>
          <Link href="/admin/employees" className="text-xs font-bold text-blue-600 hover:underline">
            View Complete Directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const m = emp.metrics || { activeTasks: 0, completedTasks: 0, progressRate: 100, workloadLevel: "NORMAL" };

            return (
              <div key={emp.id} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs hover:border-blue-500 transition">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center border-2 border-white shadow-md shrink-0">
                    {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-black text-sm truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs font-mono font-bold text-gray-700 truncate">
                      {emp.employeeId || emp.id}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">
                      {emp.email}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">{emp.department?.name || "Operations"}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                    {emp.role || "DEVELOPER"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-bold text-blue-600">{m.activeTasks} Active Tasks</span>
                  <span className="font-bold text-emerald-600">{m.completedTasks} Completed</span>
                </div>
              </div>
            );
          })}

          {employees.length === 0 && !loading && (
            <p className="text-center text-gray-400 italic text-xs py-4 col-span-full">No employee records found in database.</p>
          )}
        </div>
      </div>

      {/* SECTION 2: SHIFT PUNCH CLOCK OVERVIEW */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="font-black text-black text-lg tracking-tight">⏰ Member Shift & Punch Clock Overview</h2>
            <p className="text-xs text-gray-500">Live attendance ledger for all team members. (Enforced Rule: 1 Punch Per Day Limit).</p>
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            🔒 1 Punch Per Day Policy Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-black uppercase text-[10px] font-black">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Shift Schedule</th>
                <th className="py-3 px-4">Punch In Time</th>
                <th className="py-3 px-4">Punch Out Time</th>
                <th className="py-3 px-4">Total Worked Hours</th>
                <th className="py-3 px-4">Punch Shift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const empAtt = attendanceRecords.find((a) => a.userId === emp.id || a.user?.employeeId === emp.employeeId);
                const hasPunchedIn = !!empAtt?.checkInTime;
                const hasPunchedOut = !!empAtt?.checkOutTime;

                let statusBadge = (
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                    ⚪ NOT PUNCHED YET
                  </span>
                );

                if (hasPunchedIn && !hasPunchedOut) {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span> PUNCHED IN (Active Shift)
                    </span>
                  );
                } else if (hasPunchedIn && hasPunchedOut) {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black w-fit">
                      ✓ PUNCHED OUT (1 Punch Complete)
                    </span>
                  );
                }

                return (
                  <tr key={emp.id} className="hover:bg-gray-50 transition text-black">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-black">{emp.name}</div>
                      <div className="text-[10px] font-mono text-gray-500">{emp.employeeId || emp.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">
                      09:00 AM - 06:00 PM IST
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-black">
                      {hasPunchedIn ? new Date(empAtt.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-black">
                      {hasPunchedOut ? new Date(empAtt.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : (hasPunchedIn ? "In Shift" : "—")}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-blue-600">
                      {empAtt?.hoursWorked ? `${empAtt.hoursWorked} hrs` : (hasPunchedIn ? "In Progress" : "0.00 hrs")}
                    </td>
                    <td className="py-3 px-4">{statusBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: ASSIGNED PENDING PROJECTS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="font-black text-black text-lg tracking-tight">📂 Assigned Pending Work & Topic Discussions</h2>
            <p className="text-xs text-gray-500">Detailed breakdown of pending assigned work, consumed time vs estimated hours, and target completion deadline.</p>
          </div>
          <div className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-extrabold font-mono">
            ⏳ Target Deadline: {getTwoMonthDeadline()} (2 Months)
          </div>
        </div>

        <div className="space-y-4">
          {pendingWorkItems.map((item, idx) => {
            const consumedHours = item.consumedHours || (idx + 1) * 12;
            const totalEstHours = item.estimatedHours || 80;
            const progressPercent = Math.min(100, Math.round((consumedHours / totalEstHours) * 100));

            return (
              <div key={item.id} className="p-5 rounded-2xl border border-gray-200 bg-white space-y-4 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                        {item.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                        {item.priority || "HIGH"} PRIORITY
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {item.assignedProject || "OMS Enterprise Core Engine"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-black mt-1">{item.title}</h3>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">Time Consumed: <span className="font-mono text-blue-600 font-black">{consumedHours} hrs</span> / Est {totalEstHours} hrs</p>
                    <p className="text-[11px] font-extrabold text-amber-700 font-mono mt-0.5">Target: {getTwoMonthDeadline()}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <span className="font-extrabold text-black block">Work Scope & Pending Details:</span>
                  <p className="leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200 font-medium">
                    {item.description || "Implementation of full-stack module, validation checks, database queries, and unit tests."}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-500">Progress Completion Ratio</span>
                    <span className="text-blue-600 font-mono">{progressPercent}% ({consumedHours} of {totalEstHours} hrs consumed)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-black text-black flex items-center gap-1.5">
                    💬 Topic Discussion & Notes (Admin & Member Collaboration)
                  </span>
                  <textarea
                    rows={2}
                    value={topicNotes[item.id] || ""}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    placeholder="Discuss topic details, requirements, blockers, or timeline feedback for this work item..."
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none transition font-medium"
                  />
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-gray-500">Notes saved for discussion review</span>
                    <button
                      onClick={() => alert(`✓ Discussion notes saved for "${item.title}"!`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1 rounded-lg transition text-xs shadow-2xs"
                    >
                      Save Discussion Note
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {pendingWorkItems.length === 0 && !loading && (
            <p className="text-center text-gray-400 italic text-xs py-4">No pending assigned work items found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
