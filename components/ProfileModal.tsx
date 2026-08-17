"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export interface ProfileUser {
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string | null;
  joiningDate?: string | null;
  avatarUrl?: string | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser | null;
}

function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [imgError, setImgError] = React.useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isAdminRole = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(user.role);
  const displayName = user.name;
  const displayId = user.employeeId || user.id;
  const initials = getInitials(user.name);
  const avatarUrl = user.avatarUrl;

  const formattedJoiningDate = user.joiningDate
    ? new Date(user.joiningDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close X Button */}
        <button
          onClick={onClose}
          aria-label="Close Profile Preview"
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer font-extrabold text-sm"
        >
          ✕
        </button>

        {/* Large Profile Avatar */}
        <div className="relative inline-block pt-2">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={() => setImgError(true)}
              className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-xl shadow-blue-600/20 mx-auto"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-slate-900 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-xl mx-auto">
              {initials}
            </div>
          )}

          <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white" title="Account Active"></span>
        </div>

        {/* User Branding & Identity */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{displayName}</h2>
          <p className="text-xs font-mono font-bold text-blue-600">{displayId}</p>
          <div className="pt-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isAdminRole
                  ? "bg-slate-900 text-white"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isAdminRole ? `ADMIN (${user.role.replace(/_/g, " ")})` : `EMPLOYEE (${user.role.replace(/_/g, " ")})`}
            </span>
          </div>
        </div>

        {/* Basic Profile Details Grid */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-bold">Email Address</span>
            <span className="font-mono font-bold text-slate-900 truncate max-w-[200px]">{user.email}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-bold">Department</span>
            <span className="font-extrabold text-slate-900">{user.department || "Operations"}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-bold">Designation</span>
            <span className="font-extrabold text-slate-900">{user.role.replace(/_/g, " ")}</span>
          </div>

          {formattedJoiningDate && (
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Joining Date</span>
              <span className="font-mono font-bold text-slate-900">{formattedJoiningDate}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold">Account Status</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition cursor-pointer"
          >
            Close
          </button>
          <Link
            href={isAdminRole ? "/admin/employees" : "/employee/profile"}
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-md shadow-blue-600/20 text-center"
          >
            View Full Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
