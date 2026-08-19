"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryFolder {
  id: string;
  name: string;
  code: string;
  icon: string;
  count: number;
  description: string;
  color: string;
}

export default function MasterHistoryArchivesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [activeFolderId, setActiveFolderId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Folder Data States
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [taskLogs, setTaskLogs] = useState<any[]>([]);
  const [salaryLogs, setSalaryLogs] = useState<any[]>([]);
  const [reviewLogs, setReviewLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [leaveLogs, setLeaveLogs] = useState<any[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch (e) {}
  };

  const loadAllHistory = async (empId: string) => {
    try {
      setLoading(true);
      const isSpecific = empId !== "ALL";

      // 1. Attendance Punches
      const attUrl = isSpecific ? `/api/attendance?employeeId=${empId}` : `/api/attendance`;
      const attRes = await fetch(attUrl);
      const attJson = await attRes.json();
      if (attJson.success) setAttendanceLogs(attJson.data || []);

      // 2. Tasks
      const taskUrl = `/api/tasks`;
      const taskRes = await fetch(taskUrl);
      const taskJson = await taskRes.json();
      if (taskJson.success) {
        let tasks = taskJson.tasks || [];
        if (isSpecific) {
          tasks = tasks.filter(
            (t: any) =>
              t.assignedToUserId === empId ||
              t.assignedToEmployeeId === empId ||
              t.assignedToName?.toLowerCase().includes(empId.toLowerCase())
          );
        }
        setTaskLogs(tasks);
      }

      // 3. Salary Slips
      const slipUrl = `/api/admin/salary-slips`;
      const slipRes = await fetch(slipUrl);
      const slipJson = await slipRes.json();
      if (slipJson.success) {
        let slips = slipJson.data || [];
        if (isSpecific) {
          slips = slips.filter(
            (s: any) => s.userId === empId || s.employeeId === empId
          );
        }
        setSalaryLogs(slips);
      }

      // 4. Audit Logs
      const auditUrl = `/api/audit-logs`;
      const auditRes = await fetch(auditUrl);
      const auditJson = await auditRes.json();
      if (auditJson.success) {
        let logs = auditJson.data || [];
        if (isSpecific) {
          logs = logs.filter(
            (a: any) => a.userId === empId || a.user_employeeId === empId
          );
        }
        setAuditLogs(logs);
      }

      // 5. Customer Reviews
      const revUrl = `/api/customer-reviews`;
      const revRes = await fetch(revUrl);
      const revJson = await revRes.json();
      if (revJson.success) {
        let revs = revJson.reviews || revJson.data || [];
        if (isSpecific) {
          revs = revs.filter(
            (r: any) => r.userId === empId || r.employeeId === empId
          );
        }
        setReviewLogs(revs);
      }
    } catch (err) {
      console.warn("Failed to load history archives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    loadAllHistory(selectedEmployeeId);
  }, [selectedEmployeeId]);

  const historyFolders: HistoryFolder[] = [
    {
      id: "ATTENDANCE",
      name: "Shift Punch & Attendance History",
      code: "ATT-HIST",
      icon: "🕒",
      count: attendanceLogs.length,
      description: "Biometric punch-in/out timestamps, hours worked, and shift duration ledger.",
      color: "blue",
    },
    {
      id: "TASKS",
      name: "Task & Project Delivery History",
      code: "TSK-HIST",
      icon: "💼",
      count: taskLogs.length,
      description: "Sprint tasks, deliverables, completion statuses, priorities, and deadlines.",
      color: "emerald",
    },
    {
      id: "SALARY",
      name: "Salary Slips & Payment Ledger",
      code: "PAY-HIST",
      icon: "💰",
      count: salaryLogs.length,
      description: "Monthly payroll records, allowances, tax deductions, and bank payouts.",
      color: "purple",
    },
    {
      id: "REVIEWS",
      name: "Client Feedback & NPS Ratings",
      code: "REV-HIST",
      icon: "⭐",
      count: reviewLogs.length,
      description: "Customer satisfaction ratings, verified feedback, and project reviews.",
      color: "amber",
    },
    {
      id: "AUDIT",
      name: "Security & Cyber Activity Audit",
      code: "SEC-HIST",
      icon: "🔒",
      count: auditLogs.length,
      description: "User authentication logs, IP addresses, session changes, and security events.",
      color: "rose",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Command Desk
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              📁 Dedicated History Folders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
            Master Workforce History & Historical Dossiers
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete database archives for shifts, sprint tasks, payroll slips, client reviews, and security audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/employees"
            className="bg-white hover:bg-gray-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition shadow-2xs flex items-center gap-1.5"
          >
            <span>👥</span>
            <span>Employee Directory</span>
          </Link>
          <Link
            href="/admin/attendance"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
          >
            <span>🕒</span>
            <span>Live Punch Clock</span>
          </Link>
        </div>
      </div>

      {/* Filter & Employee Selector Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-extrabold text-black">Filter by Employee:</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-black font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="ALL">🏢 All Organization Workforce (Master View)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.employeeId || emp.id}>
                {emp.name} ({emp.employeeId || "EMP"}) - {emp.role}
              </option>
            ))}
          </select>

          {selectedEmployeeId !== "ALL" && (
            <button
              onClick={() => setSelectedEmployeeId("ALL")}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search records in active folder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-black focus:border-blue-600 focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* History Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {historyFolders.map((folder) => {
          const isActive = activeFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              className={`p-5 rounded-3xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-600/20"
                  : "bg-white border-gray-200 hover:border-gray-300 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{folder.icon}</span>
                  <span className="text-[10px] font-black font-mono uppercase px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">
                    {folder.code}
                  </span>
                </div>
                <h3 className="font-black text-sm text-black mt-3">{folder.name}</h3>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {folder.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-bold">Total Entries:</span>
                <span className="text-sm font-black text-black font-mono">{folder.count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Folder Tabs Switcher Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveFolderId("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
            activeFolderId === "ALL"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📂 All Dossiers Summary
        </button>
        {historyFolders.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFolderId(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFolderId === f.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFolderId === f.id ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Dynamic Folder View Render */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6">
        {loading ? (
          <div className="text-center py-16 text-gray-500 font-bold text-xs">
            Loading historical archives from TiDB Cloud...
          </div>
        ) : (
          <div>
            {/* 1. ATTENDANCE HISTORY VIEW */}
            {(activeFolderId === "ATTENDANCE" || activeFolderId === "ALL") && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-black text-base text-black flex items-center gap-2">
                    <span>🕒 Shift Punch & Biometric Attendance History</span>
                    <span className="text-xs text-gray-500 font-normal">
                      ({attendanceLogs.length} historical punches)
                    </span>
                  </h3>
                  <Link
                    href="/admin/attendance"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Full Ledger →
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Punch-In</th>
                        <th className="py-3 px-4">Punch-Out</th>
                        <th className="py-3 px-4">Shift Hours</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceLogs.slice(0, 10).map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition text-black">
                          <td className="py-3 px-4 font-bold">
                            <Link
                              href={`/admin/employees/${r.user?.employeeId || r.userId}`}
                              className="text-blue-600 hover:underline"
                            >
                              {r.user?.name || "Employee"} ({r.user?.employeeId || "EMP"})
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-700">
                            {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "-"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-IN") : "-"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-700">
                            {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN") : "🟢 Active Shift"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {r.hoursWorked ? `${r.hoursWorked} hrs` : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {r.status || "PRESENT"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. TASKS & PROJECT DELIVERY HISTORY VIEW */}
            {(activeFolderId === "TASKS" || activeFolderId === "ALL") && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-black text-base text-black flex items-center gap-2">
                    <span>💼 Task & Project Delivery History</span>
                    <span className="text-xs text-gray-500 font-normal">
                      ({taskLogs.length} tasks)
                    </span>
                  </h3>
                  <Link
                    href="/admin/tasks"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Task Dispatcher →
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Task Title</th>
                        <th className="py-3 px-4">Assigned To</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Progress</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {taskLogs.slice(0, 10).map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition text-black">
                          <td className="py-3 px-4 font-bold text-black">{t.title}</td>
                          <td className="py-3 px-4 font-medium text-gray-700">
                            {t.assignedToName || t.assignedToUserId || "-"}
                          </td>
                          <td className="py-3 px-4 font-medium text-blue-600">{t.projectName || "General Ops"}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                t.priority === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800"
                                  : t.priority === "HIGH"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">{t.progress || 0}%</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-800">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SALARY SLIPS & PAYROLL LEDGER */}
            {(activeFolderId === "SALARY" || activeFolderId === "ALL") && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-black text-base text-black flex items-center gap-2">
                    <span>💰 Salary Slips & Compensation Ledger</span>
                    <span className="text-xs text-gray-500 font-normal">
                      ({salaryLogs.length} slips generated)
                    </span>
                  </h3>
                  <Link
                    href="/admin/salary-slips"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Salary Hub →
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Salary Month</th>
                        <th className="py-3 px-4">Gross Salary</th>
                        <th className="py-3 px-4">Deductions</th>
                        <th className="py-3 px-4">Net Payout</th>
                        <th className="py-3 px-4">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salaryLogs.slice(0, 10).map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition text-black">
                          <td className="py-3 px-4 font-bold">
                            {s.employeeName} <span className="font-mono text-gray-500 font-normal">({s.employeeId})</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700">{s.salaryMonth}</td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">
                            ₹{(s.grossSalary || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-600">
                            ₹{(s.totalDeductions || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-700">
                            ₹{(s.netSalary || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {s.paymentStatus || "PAID"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. SECURITY & AUDIT LOGS */}
            {(activeFolderId === "AUDIT" || activeFolderId === "ALL") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-black text-base text-black flex items-center gap-2">
                    <span>🔒 Security & Activity Audit Log</span>
                    <span className="text-xs text-gray-500 font-normal">
                      ({auditLogs.length} audit records)
                    </span>
                  </h3>
                  <Link
                    href="/admin/audit-logs"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Security Desk →
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-black font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.slice(0, 10).map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 transition text-black">
                          <td className="py-3 px-4 font-mono text-gray-500">
                            {a.timestamp ? new Date(a.timestamp).toLocaleString("en-IN") : "-"}
                          </td>
                          <td className="py-3 px-4 font-bold">{a.user_name || a.userId || "System"}</td>
                          <td className="py-3 px-4 font-mono font-bold text-purple-700">{a.action}</td>
                          <td className="py-3 px-4 text-gray-700">{a.details || "-"}</td>
                          <td className="py-3 px-4 font-mono text-gray-500">{a.ipAddress || "127.0.0.1"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
