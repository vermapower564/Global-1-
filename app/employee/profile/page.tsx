"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserContext, setCurrentUserContext } from "@/utils/userContextStore";

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

  // Edit Personal Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState("");

  // Edit Bank Details Modal State
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editBankHolder, setEditBankHolder] = useState("");
  const [editBankName, setEditBankName] = useState("State Bank of India");
  const [editBankAccNo, setEditBankAccNo] = useState("");
  const [editBankIfsc, setEditBankIfsc] = useState("");
  const [editBankBranch, setEditBankBranch] = useState("Main Branch");
  const [editBankType, setEditBankType] = useState("Savings");
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [editBankError, setEditBankError] = useState("");

  const loadUserData = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
          setEditName(json.user.name || "");
          setEditEmail(json.user.email || "");
          setEditPhone(json.user.phone || "");
          setEditEmergencyContact(json.user.emergencyContact || "");
          setEditAvatarUrl(json.user.avatarUrl || "");
        }
      })
      .catch(() => {});
  };

  const loadBankData = () => {
    fetch("/api/employee/bank-details")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.bankDetails) {
          setBankDetails(json.bankDetails);
          setEditBankHolder(json.bankDetails.accountHolderName || "");
          setEditBankName(json.bankDetails.bankName || "State Bank of India");
          setEditBankIfsc(json.bankDetails.ifscCode || "");
          setEditBankBranch(json.bankDetails.branchName || "Main Branch");
          setEditBankType(json.bankDetails.accountType || "Savings");
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setUser(getCurrentUserContext());
    loadUserData();
    loadBankData();
  }, []);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditBankError("");
    setIsSavingBank(true);

    try {
      const res = await fetch("/api/employee/bank-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: editBankHolder.trim() || user?.name || "",
          bankName: editBankName.trim(),
          accountNumber: editBankAccNo.trim(),
          ifscCode: editBankIfsc.trim().toUpperCase(),
          branchName: editBankBranch.trim(),
          accountType: editBankType,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMsg("✓ Your bank details have been saved successfully!");
        setShowEditBankModal(false);
        setEditBankAccNo("");
        loadBankData();
      } else {
        setEditBankError(json.error || "Failed to save bank details.");
      }
    } catch (err) {
      setEditBankError("Network error saving bank details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleSavePersonalDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          emergencyContact: editEmergencyContact.trim(),
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMsg("✓ Your personal details have been updated successfully!");
        setShowEditModal(false);
        if (json.user) {
          setUser(json.user);
          setCurrentUserContext({
            ...getCurrentUserContext(),
            name: json.user.name,
            email: json.user.email,
            avatarUrl: json.user.avatarUrl,
          });
        }
        loadUserData();
      } else {
        setEditError(json.error || "Failed to update profile.");
      }
    } catch (err) {
      setEditError("Network error while updating profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

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
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center border-4 border-white shadow-md">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-black">{displayName}</h2>
                <p className="text-xs font-mono font-bold text-blue-600">{displayId}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 mt-1">
                  {displayRole}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition cursor-pointer border border-indigo-200 flex items-center gap-1.5 shadow-2xs"
            >
              <span>✏️</span>
              <span>Edit Details</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-bold">Email Address</span>
              <span className="font-bold text-black">{user?.email}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-bold">Phone Number</span>
              <span className="font-mono font-bold text-black">{user?.phone || "+91 98765 00000"}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-bold">Emergency Contact</span>
              <span className="font-bold text-black">{user?.emergencyContact || "Not configured"}</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-black flex items-center gap-2">
              <span>🏦</span> Bank Details & Salary Account
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your registered banking information for monthly direct deposit salary transfers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Verified Salary Account
            </span>
            <button
              onClick={() => setShowEditBankModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition cursor-pointer border border-indigo-200 flex items-center gap-1.5 shadow-2xs"
            >
              <span>✏️</span>
              <span>Edit Bank Account</span>
            </button>
          </div>
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

      {/* Edit Personal Details Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-5 text-black animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-black flex items-center gap-2">
                  <span>✏️</span> Edit Personal Details
                </h3>
                <p className="text-xs text-gray-500 font-mono">{user?.employeeId} • {displayName}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSavePersonalDetails} className="space-y-4 text-xs">
              {/* Profile Photo Upload & Live Preview */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Profile Photo</label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt="Avatar Preview"
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                      {getInitials(editName || user?.name || "U")}
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      id="profile-avatar-upload"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith("image/")) {
                            setEditError("Please select a valid image (JPEG, PNG, WEBP).");
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setEditError("Image size must be under 5 MB.");
                            return;
                          }
                          setEditError("");
                          const reader = new FileReader();
                          reader.onload = () => {
                            setEditAvatarUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <label
                        htmlFor="profile-avatar-upload"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] cursor-pointer transition shadow-xs"
                      >
                        📷 Upload Photo
                      </label>
                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl("")}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-[11px] cursor-pointer transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">Supported: PNG, JPEG, WEBP (Max 5 MB). Clean letter avatar used if empty.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Display Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Roushan Verma"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Work Email Address (Gmail) *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. roushan.verma@gmail.com"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-mono text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Emergency Contact Information</label>
                <input
                  type="text"
                  value={editEmergencyContact}
                  onChange={(e) => setEditEmergencyContact(e.target.value)}
                  placeholder="e.g. +91 98765 11111 (Parent/Spouse)"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "✓ Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Account Details Modal */}
      {showEditBankModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditBankModal(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-5 text-black animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-black flex items-center gap-2">
                  <span>🏦</span> Manage Bank Account & Documents
                </h3>
                <p className="text-xs text-gray-500 font-mono">Confidential Salary Payout Information</p>
              </div>
              <button
                onClick={() => setShowEditBankModal(false)}
                className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editBankError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {editBankError}
              </div>
            )}

            <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={editBankHolder}
                    onChange={(e) => setEditBankHolder(e.target.value)}
                    placeholder="e.g. Roushan Verma"
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Name *</label>
                  <select
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Other">Other Bank</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    required
                    value={editBankAccNo}
                    onChange={(e) => setEditBankAccNo(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 50100432198765"
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono font-bold text-black focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={editBankIfsc}
                    onChange={(e) => setEditBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001001"
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono font-bold uppercase text-black focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editBankBranch}
                    onChange={(e) => setEditBankBranch(e.target.value)}
                    placeholder="e.g. Cyber City Branch"
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Account Type</label>
                  <select
                    value={editBankType}
                    onChange={(e) => setEditBankType(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Salary">Salary Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex items-center gap-2">
                <span>🔒</span>
                <span>Protected with end-to-end masking. Team Leaders and general staff cannot view your full account number or sensitive documents.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingBank ? "Saving..." : "✓ Save Bank Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
