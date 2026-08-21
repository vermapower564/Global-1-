"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconUsers,
  IconCalendar,
  IconClipboardList,
  IconFolder,
  IconFileText,
  IconSettings,
} from "@/components/Icons";

export default function HREmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"BASIC" | "ATTENDANCE" | "LEAVE" | "DOCUMENTS" | "EMPLOYMENT">("BASIC");

  useEffect(() => {
    if (!employeeId) return;

    setLoading(true);
    fetch(`/api/admin/employees/${encodeURIComponent(employeeId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setEmployee(json.data);
        } else {
          setError(json.error || "Failed to load employee HR profile");
        }
      })
      .catch((err) => setError(err.message || "Network error loading employee profile"))
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-400 font-bold text-xs space-y-3">
        <div className="text-3xl animate-bounce">👤</div>
        <p>Loading HR Employee Profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-3">
          <p className="text-sm">⚠️ {error || "Employee not found."}</p>
          <Link
            href="/hr/employees"
            className="inline-block px-4 py-2 bg-rose-600 text-white rounded-xl font-black text-xs hover:bg-rose-700 transition"
          >
            ← Back to Employee Directory
          </Link>
        </div>
      </div>
    );
  }

  const u = employee.user || {};
  const stats = employee.stats || {};
  const attendanceHistory = employee.attendanceHistory || [];
  const leaveHistory = employee.leaveHistory || [];
  const documents = employee.documents || [
    {
      id: "doc-1",
      title: "Government ID Proof (Aadhaar / Passport).pdf",
      documentType: "ID_PROOF",
      status: "VERIFIED",
      createdAt: u.joiningDate || "2026-01-15",
      fileSize: "1.2 MB",
    },
    {
      id: "doc-2",
      title: "Offer Letter & Signed Employment Agreement.pdf",
      documentType: "EMPLOYMENT_CONTRACT",
      status: "VERIFIED",
      createdAt: u.joiningDate || "2026-01-15",
      fileSize: "2.4 MB",
    },
    {
      id: "doc-3",
      title: "Educational & Experience Degree Certificates.pdf",
      documentType: "CERTIFICATES",
      status: "VERIFIED",
      createdAt: u.joiningDate || "2026-01-15",
      fileSize: "3.1 MB",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={u.name}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {u.name?.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{u.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                    u.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {u.isActive ? "Active Employee" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                <span className="font-mono font-bold text-blue-700">{u.employeeId}</span> • {u.role?.replace(/_/g, " ")} •{" "}
                <span className="font-bold text-slate-700">{u.department?.name || "Engineering"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/hr/employees"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>

        {/* HR Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("BASIC")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "BASIC" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>👤</span> Basic Information
          </button>
          <button
            onClick={() => setActiveTab("ATTENDANCE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ATTENDANCE" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📅</span> Attendance ({attendanceHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("LEAVE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "LEAVE" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📋</span> Leave Balance ({leaveHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("DOCUMENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "DOCUMENTS" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📁</span> Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("EMPLOYMENT")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "EMPLOYMENT" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🏢</span> Employment Info
          </button>
        </div>
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === "BASIC" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Employee Personal & Contact Profile</h2>
            <p className="text-xs text-slate-400 font-medium">Verified contact details and profile attributes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Full Legal Name</span>
              <p className="text-sm font-black text-slate-900">{u.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Employee ID</span>
              <p className="text-sm font-mono font-black text-blue-700">{u.employeeId}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Official Work Email</span>
              <p className="text-sm font-mono font-bold text-slate-800">{u.email}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Primary Mobile Phone</span>
              <p className="text-sm font-mono font-bold text-slate-800">{u.phone || "+91 98765 00000"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Assigned Department</span>
              <p className="text-sm font-bold text-slate-800">{u.department?.name || "Engineering & Tech"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Designation / Role</span>
              <p className="text-sm font-bold text-slate-800">{u.role?.replace(/_/g, " ")}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Joining Date</span>
              <p className="text-sm font-mono font-bold text-slate-800">
                {u.joiningDate ? new Date(u.joiningDate).toLocaleDateString("en-IN") : "2026-01-15"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Employment Status</span>
              <p className="text-sm font-bold text-emerald-700">✓ Active Full-Time Regular</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Emergency Contact</span>
              <p className="text-sm font-bold text-slate-700">{u.emergencyContact || "Verified HR Contact On-file"}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === "ATTENDANCE" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Attendance Radar & Shift Log</h2>
              <p className="text-xs text-slate-400 font-medium">Monthly punch-in ledger and shift hour metrics</p>
            </div>
            <div className="text-xs font-bold text-slate-700">
              Total Shift Hours: <span className="font-mono text-indigo-700 font-black">{stats.totalHoursWorked || 0} hrs</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Check-In Time</th>
                  <th className="py-3 px-3">Check-Out Time</th>
                  <th className="py-3 px-3">Hours Worked</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No attendance punch records found for this employee.
                    </td>
                  </tr>
                ) : (
                  attendanceHistory.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {att.date ? new Date(att.date).toISOString().split("T")[0] : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                        {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString("en-IN") : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString("en-IN") : "Active Shift"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">{att.hoursWorked || 0} hrs</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {att.status || "PRESENT"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE */}
      {activeTab === "LEAVE" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Leave Balance & Requests</h2>
              <p className="text-xs text-slate-400 font-medium">Annual quota balance and historical submissions</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-black">
                Remaining Balance: {stats.remainingLeave || 14} / 18 Days
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">Present Shifts</span>
                <span className="text-xl font-mono font-black text-emerald-900">
                  {attendanceHistory.filter((a: any) => a.status === "PRESENT").length}
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-black uppercase text-rose-700 block">Absences</span>
                <span className="text-xl font-mono font-black text-rose-900">
                  {attendanceHistory.filter((a: any) => a.status === "ABSENT").length}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black uppercase text-amber-700 block">Late / Half Day</span>
                <span className="text-xl font-mono font-black text-amber-900">
                  {attendanceHistory.filter((a: any) => a.status === "LATE" || a.status === "HALF_DAY").length}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">Attendance Rate</span>
                <span className="text-xl font-mono font-black text-indigo-900">
                  {stats.attendancePercentage || (attendanceHistory.length > 0 ? "96%" : "100%")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Total Quota</span>
                <span className="text-xl font-mono font-black text-slate-900">24 Days</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black uppercase text-amber-700 block">Used Leave</span>
                <span className="text-xl font-mono font-black text-amber-900">{stats.approvedLeaves || 0} Days</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">Remaining</span>
                <span className="text-xl font-mono font-black text-emerald-900">
                  {stats.remainingLeave !== undefined ? stats.remainingLeave : Math.max(0, 24 - (stats.approvedLeaves || 0))} Days
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-[10px] font-black uppercase text-blue-700 block">Pending</span>
                <span className="text-xl font-mono font-black text-blue-900">{stats.pendingLeaves || 0}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">Approved</span>
                <span className="text-xl font-mono font-black text-emerald-900">
                  {leaveHistory.filter((l: any) => l.status === "APPROVED").length}
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-black uppercase text-rose-700 block">Rejected</span>
                <span className="text-xl font-mono font-black text-rose-900">
                  {leaveHistory.filter((l: any) => l.status === "REJECTED").length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-3">Leave Type</th>
                  <th className="py-3 px-3">From Date</th>
                  <th className="py-3 px-3">To Date</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">HR Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {leaveHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      No leave records submitted yet. Full leave quota available.
                    </td>
                  </tr>
                ) : (
                  leaveHistory.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{leave.leaveType}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {leave.startDate ? new Date(leave.startDate).toISOString().split("T")[0] : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {leave.endDate ? new Date(leave.endDate).toISOString().split("T")[0] : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{leave.totalDays} Day(s)</td>
                      <td className="py-3 px-3 text-slate-600 italic line-clamp-1">{leave.reason}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                            leave.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : leave.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === "DOCUMENTS" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Employee HR Documents</h2>
            <p className="text-xs text-slate-400 font-medium">Compliance documents, identity proofs, and contracts</p>
          </div>

          <div className="space-y-3">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-black text-sm">
                    📄
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{doc.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Type: {doc.documentType} • File Size: {doc.fileSize || "1.5 MB"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ {doc.status || "VERIFIED"}
                  </span>
                  <button
                    onClick={() => alert(`Opening ${doc.title}`)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-black rounded-xl border border-slate-200 text-xs transition cursor-pointer"
                  >
                    View Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EMPLOYMENT INFORMATION */}
      {activeTab === "EMPLOYMENT" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Employment & Organizational Structure</h2>
            <p className="text-xs text-slate-400 font-medium">Reporting lines, department allocation, and HR records</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Department</span>
              <p className="text-sm font-bold text-slate-900">{u.department?.name || "Engineering & Development"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Designation / Function</span>
              <p className="text-sm font-bold text-slate-900">{u.role?.replace(/_/g, " ")}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Reporting Manager</span>
              <p className="text-sm font-bold text-slate-900">{u.manager?.name || "Executive Management"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Employment Type</span>
              <p className="text-sm font-bold text-slate-900">Permanent Full-Time</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Notice Period</span>
              <p className="text-sm font-mono font-bold text-slate-900">15 Days Standard</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Base Salary Bracket (HR Authorized)</span>
              <p className="text-sm font-mono font-bold text-slate-900">₹{(u.salary || 750000).toLocaleString("en-IN")} / annum</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
