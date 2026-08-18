"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext } from "@/utils/userContextStore";

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setUser(getCurrentUserContext());

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg("✓ Password updated successfully in MySQL database!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(json.error || "Failed to change password.");
      }
    } catch (err) {
      setErrorMsg("Network connection error changing password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = user?.name || "Employee User";
  const displayId = user?.employeeId || user?.id || "EMP";
  const displayRole = (user?.role || "EMPLOYEE").replace(/_/g, " ");
  const initials = getInitials(displayName);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Security & Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            My Profile & Security Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage account credentials, security preferences, active sessions, and master identity data.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs shadow-sm animate-in fade-in">
          {msg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-extrabold text-xs shadow-sm animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master Identity Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-16 w-16 rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center border-4 border-white shadow-md">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{displayName}</h2>
              <p className="text-xs font-mono font-bold text-blue-600">{displayId}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 mt-1">
                {displayRole}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-bold">Email Address</span>
              <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-bold">Department</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{user?.department?.name || user?.department || "Engineering"}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-bold">Reporting Lead</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{user?.managerName || "Department Head"}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-bold">Account Status</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active & Verified
              </span>
            </div>
          </div>
        </div>

        {/* Change Password & Security Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            🔐 Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-[11px] text-slate-500 space-y-0.5 font-medium">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Password Requirements:</span>
              <p>• Minimum 8 characters long</p>
              <p>• Includes letters and numbers</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              {isSubmitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
