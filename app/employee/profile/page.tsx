"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setUser(getCurrentUserContext());
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
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
        setMsg("✓ Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(json.error || "Failed to change password");
      }
    } catch (err) {
      alert("Network error changing password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border flex justify-between items-center shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-blue-600">Employee Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">My Profile & Security Settings</h1>
          <p className="text-xs text-slate-500">Manage account credentials, security preferences, and master profile data.</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Account Identity Details</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border">
              <span className="text-slate-400 font-bold block">Employee Name</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">{user?.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border">
              <span className="text-slate-400 font-bold block">Employee ID</span>
              <span className="font-mono font-bold text-blue-600 text-sm">{user?.id}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border">
              <span className="text-slate-400 font-bold block">Email Address</span>
              <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border">
              <span className="text-slate-400 font-bold block">Assigned Role</span>
              <span className="font-black text-blue-600 uppercase">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Change Password</h3>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-extrabold py-2.5 rounded-xl shadow-md transition"
            >
              {isSubmitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
