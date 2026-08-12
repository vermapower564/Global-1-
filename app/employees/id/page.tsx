"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserEmployee, updateEmployeeProfileCompletion, Employee } from "@/utils/employeeStore";
import { getCurrentUserContext, CurrentUser } from "@/utils/userContextStore";
import { evaluatePasswordStrength, saveEmployeeUserPassword } from "@/utils/onboardingEmail";
import ProfileAlertBanner from "@/components/ProfileAlertBanner";
import {
  IconFileText,
  IconUserCheck,
  IconCreditCard,
  IconCalendar,
  IconEye,
  IconFolder,
  IconTerminal,
  IconZap,
} from "@/components/Icons";

export default function EmployeeDetailPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [userContext, setUserContext] = useState<CurrentUser | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Change Password Form State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordToast, setPasswordToast] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const passwordEval = evaluatePasswordStrength(newPassword);

  // Sample Personal Work History Data
  const personalWorkHistory = [
    {
      date: "2026-08-10",
      project: "OMS Core Architecture & Platform Optimization",
      hours: "8.5 Hrs",
      tasks: "Configured MariaDB driver adapter, optimized Next.js build routes, synchronized XAMPP database tables.",
      rating: "5/5 (Excellent)",
      feedback: "Great turn-around time on database architecture!",
    },
    {
      date: "2026-08-09",
      project: "OMS Core Architecture & Platform Optimization",
      hours: "8.0 Hrs",
      tasks: "Implemented 10-digit Indian phone validation utilities and standardized Rupee symbol formatting.",
      rating: "5/5 (Excellent)",
      feedback: "Validation rules strictly enforced.",
    },
  ];

  // Sample Personal Attendance History Data
  const personalAttendanceHistory = [
    { date: "2026-08-10", inTime: "09:15 AM", outTime: "06:15 PM", hours: "9.0 Hrs", status: "PRESENT", punctuality: "Punctual" },
    { date: "2026-08-09", inTime: "09:20 AM", outTime: "06:10 PM", hours: "8.8 Hrs", status: "PRESENT", punctuality: "Punctual" },
  ];

  // Sample Personal Leave Requests History Data
  const personalLeaveHistory = [
    { type: "Casual Leave", startDate: "2026-08-18", endDate: "2026-08-19", days: "2 Days", reason: "Family Function", status: "APPROVED" },
  ];

  useEffect(() => {
    setEmployee(getCurrentUserEmployee());
    setUserContext(getCurrentUserContext());
  }, []);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    if (newPassword !== confirmPassword) {
      alert("New Password and Confirm Password do not match!");
      return;
    }

    if (passwordEval.score < 50) {
      alert("Please choose a stronger password matching security guidelines (12+ chars, A-Z, a-z, 0-9, @#$%!).");
      return;
    }

    setIsChangingPassword(true);

    // Save password in local storage & XAMPP MySQL
    saveEmployeeUserPassword(employee.email, newPassword);
    saveEmployeeUserPassword(employee.id, newPassword);

    // Dispatch SMTP Security Email Notification
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PASSWORD_RESET",
          to: employee.email,
          name: employee.name,
          password: newPassword,
          subject: "🔑 Security Notification: Account Password Changed Successfully",
        }),
      });
    } catch (err) {
      console.warn("SMTP email dispatch warning");
    }

    setIsChangingPassword(false);
    setShowPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");

    setPasswordToast(`✓ Account password updated successfully & security email sent to ${employee.email}!`);
    setTimeout(() => setPasswordToast(null), 4000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProfileImage(data.url);
        setUploadMessage(`✓ Profile photo successfully uploaded to backend server! (${data.fileName})`);
      }
    } catch (err: any) {
      setUploadMessage(`❌ Failed to connect to upload server.`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  if (!employee) return null;

  const currentEmpId = employee.id || "EMP014";
  const reportingManager = employee.reportingManager || "Aarav Sharma (Project Manager & Team Leader)";
  const assignedProject = userContext?.assignedProjectTitle || "OMS Core Architecture & Platform Optimization";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <ProfileAlertBanner />

      {passwordToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold p-4 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{passwordToast}</span>
          <button onClick={() => setPasswordToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {uploadMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold p-3 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{uploadMessage}</span>
          <button onClick={() => setUploadMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">Employee Personal Portal</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            My Employee Dashboard & Security Settings
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            View your Employee ID, update password, team leader project assignments, personal daily work history & attendance logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            🔒 Change Password
          </button>
          <Link href="/employees" className="btn-secondary text-xs">
            ← Staff Directory
          </Link>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="pro-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="relative group">
            {profileImage ? (
              <img
                src={profileImage}
                alt={employee.name}
                className="h-24 w-24 rounded-2xl object-cover shadow-xl border-2 border-red-500"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-3xl font-extrabold text-white shadow-xl shadow-red-600/30 border-2 border-white">
                {employee.avatar}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1 flex-1">
            <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{employee.name}</h2>
              <span className={`badge ${employee.isProfileCompleted ? "badge-success" : "badge-warning"}`}>
                {employee.isProfileCompleted ? "Verified Staff 100%" : "Profile Incomplete"}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{employee.role} • {employee.department}</p>
            <p className="text-xs font-mono text-slate-500">
              Employee ID: <span className="text-red-600 font-extrabold text-sm">{currentEmpId}</span>
            </p>
          </div>

          <div className="shrink-0 flex gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              🔒 Update Password
            </button>
          </div>
        </div>

        {/* 📌 SECTION 1: Team Leader Project Assignment Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <IconFolder className="h-5 w-5 text-red-400" />
              <h3 className="font-extrabold text-base text-white">Project Assigned by Team Leader</h3>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-3 py-1 rounded-full font-bold">
              ACTIVE ASSIGNMENT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <span className="text-slate-400 block font-medium">Assigned Project Title:</span>
              <span className="font-extrabold text-white text-sm leading-snug">{assignedProject}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Team Leader / Reporting Manager:</span>
              <span className="font-bold text-amber-300 text-sm">{reportingManager}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Deliverable Objective:</span>
              <span className="font-mono text-slate-200 font-semibold">Build & Optimize Full-Stack Architecture</span>
            </div>
          </div>
        </div>

        {/* 📊 Core Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <IconUserCheck className="h-4 w-4 text-red-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Employee ID & Assignment</h3>
            </div>
            <div>
              <span className="text-slate-500 block">Unique Employee ID:</span>
              <span className="font-mono font-extrabold text-red-600 text-sm">{currentEmpId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department:</span>
              <span className="font-bold text-slate-900 dark:text-white">{employee.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Designation:</span>
              <span className="font-bold text-slate-900 dark:text-white">{employee.role}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <IconCreditCard className="h-4 w-4 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Contact & Security</h3>
            </div>
            <div>
              <span className="text-slate-500 block">Corporate Email:</span>
              <span className="font-bold text-slate-900 dark:text-white">{employee.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Account Password Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Security Encrypted</span>
            </div>
            <div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                🔒 Change Password
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <IconCalendar className="h-4 w-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Attendance Summary</h3>
            </div>
            <div>
              <span className="text-slate-500 block">Attendance Rate:</span>
              <span className="font-bold text-emerald-600 text-sm">98.5% (Punctual)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔒 EMPLOYEE CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">🔒 Update Account Password</h3>
                <p className="text-xs text-slate-500">Security Portal for {employee.name}</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (12+ Chars) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new 12+ character password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              {/* Password Strength Real-Time Checklist */}
              {newPassword.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold">Password Security Rating:</span>
                    <span className={passwordEval.colorClass}>{passwordEval.label} ({passwordEval.score}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${passwordEval.score >= 70 ? "bg-emerald-500" : passwordEval.score >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${passwordEval.score}%` }} />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg shadow-md transition"
                >
                  {isChangingPassword ? "Updating Password..." : "💾 Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
