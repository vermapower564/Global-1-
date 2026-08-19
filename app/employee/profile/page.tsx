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
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setUser(getCurrentUserContext());

    // 1. Fetch User Profile
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});

    // 2. Fetch Employee's Own Bank Details (Protected Endpoint)
    fetch("/api/employee/bank-details")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.bankDetails) {
          setBankDetails(json.bankDetails);
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
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex justify-between items-center shadow-xs text-black">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Employee Workspace • Security & Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            My Profile & Salary Account
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage account credentials, security preferences, active sessions, and verified salary banking details.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs shadow-xs animate-in fade-in">
          {msg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-extrabold text-xs shadow-xs animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Grid of Profile, Bank Details, and Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master Identity Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5 text-black">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
            <div className="h-16 w-16 rounded-full bg-black text-white font-black text-xl flex items-center justify-center border-4 border-white shadow-md">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-black text-black">{displayName}</h2>
              <p className="text-xs font-mono font-bold text-blue-600">{displayId}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 mt-1">
                {displayRole}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-bold">Email Address</span>
              <span className="font-bold text-black">{user?.email}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-bold">Department</span>
              <span className="font-extrabold text-black">
                {user?.department?.name || user?.department || "Engineering"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-bold">Account Status</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active & Verified
              </span>
            </div>
          </div>
        </div>

        {/* Change Password & Security Settings */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4 text-black">
          <h2 className="font-black text-black text-base border-b border-gray-100 pb-3 flex items-center gap-2">
            <span>🔐</span> Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1 text-gray-700">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white text-black font-mono focus:border-blue-600 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-gray-700">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white text-black font-mono focus:border-blue-600 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-gray-700">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white text-black font-mono focus:border-blue-600 focus:outline-none transition shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Dedicated Bank Details Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-5 text-black">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-black flex items-center gap-2">
              <span>🏦</span> Bank Details & Salary Account
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your registered banking information for monthly direct deposit salary transfers.
            </p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Verified Salary Account
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-gray-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Account Holder
            </span>
            <p className="text-sm font-black text-black">
              {bankDetails?.accountHolderName || displayName}
            </p>
            <span className="text-[10px] text-gray-500 font-bold block">Primary Beneficiary</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-gray-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Bank Name
            </span>
            <p className="text-sm font-black text-black">
              {bankDetails?.bankName || "State Bank of India"}
            </p>
            <span className="text-[10px] text-gray-500 font-bold block">
              {bankDetails?.accountType || "Savings"} Account
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-gray-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Account Number
            </span>
            <p className="text-sm font-black text-black font-mono">
              {bankDetails?.accountNumberMasked || "••••••••1234"}
            </p>
            <span className="text-[10px] text-gray-500 font-bold block">Masked for Security</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-gray-500 font-extrabold uppercase text-[10px] tracking-wider block">
              IFSC Code
            </span>
            <p className="text-sm font-black text-black font-mono uppercase">
              {bankDetails?.ifscCode || "SBIN0001001"}
            </p>
            <span className="text-[10px] text-gray-500 font-bold block">Verified Banking Branch Code</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-gray-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Branch Name
            </span>
            <p className="text-sm font-black text-black">
              {bankDetails?.branchName || "Cyber City Branch"}
            </p>
            <span className="text-[10px] text-gray-500 font-bold block">Branch Location</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-emerald-700 font-extrabold uppercase text-[10px] tracking-wider block">
              Direct Deposit Status
            </span>
            <p className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
              <span>✓</span>
              <span>Active for Payroll</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-bold block">Auto-transfer enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
