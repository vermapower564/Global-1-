"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  evaluatePasswordStrength,
  generatePasswordResetEmail,
  saveEmployeeUserPassword,
  OnboardingEmailRecord,
  PasswordStrengthResult,
} from "@/utils/onboardingEmail";

export default function ForgetPasswordPage() {
  const router = useRouter();
  const [identityInput, setIdentityInput] = useState("aditya.raj@oms.com");
  const [resetMethod, setResetMethod] = useState<"send_email" | "create_new">("send_email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailRecord, setResetEmailRecord] = useState<OnboardingEmailRecord | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [strength, setStrength] = useState<PasswordStrengthResult>(evaluatePasswordStrength(""));

  useEffect(() => {
    setStrength(evaluatePasswordStrength(newPassword));
  }, [newPassword]);

  // Method 1: Send New Generated Password to Email
  const handleSendEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityInput) return;

    setIsSubmitting(true);
    const generatedTempPass = `Pass@${Math.floor(100000 + Math.random() * 900000)}!`;

    // Save temporary password to store
    saveEmployeeUserPassword(identityInput, generatedTempPass);

    // Generate Official Password Reset Email Record
    const record = generatePasswordResetEmail(identityInput, generatedTempPass);
    setResetEmailRecord(record);
    setShowEmailModal(true);
    setIsSubmitting(false);
  };

  // Method 2: Create Brand New Custom Password via Email Verification
  const handleCreateNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityInput || !newPassword) return;

    if (newPassword !== confirmPassword) {
      alert("❌ New Password and Confirmation do not match!");
      return;
    }

    if (strength.score < 50) {
      const proceed = confirm("⚠️ Your new password is weak. Are you sure you want to save this password?");
      if (!proceed) return;
    }

    setIsSubmitting(true);

    // Save new password
    saveEmployeeUserPassword(identityInput, newPassword);

    // Generate Email Record confirming new password
    const record = generatePasswordResetEmail(identityInput, newPassword);
    setResetEmailRecord(record);
    setShowEmailModal(true);
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Ambient Lights */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-slate-950 to-slate-950" />

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-slate-200 relative z-10 space-y-6 my-8">
        {/* Header Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-extrabold text-2xl shadow-xl shadow-red-600/30 mb-3 border-2 border-white">
            🔑
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Account Password</h1>
          <p className="text-xs text-slate-500 mt-1">Forgot your password? Reset or create a new password via email verification.</p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
          <button
            onClick={() => setResetMethod("send_email")}
            className={`py-2 rounded-lg transition ${resetMethod === "send_email" ? "bg-white text-red-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            📩 Send Password via Email
          </button>
          <button
            onClick={() => setResetMethod("create_new")}
            className={`py-2 rounded-lg transition ${resetMethod === "create_new" ? "bg-white text-red-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            ✍️ Create New Password
          </button>
        </div>

        {/* Option 1: Send New Password via Email */}
        {resetMethod === "send_email" && (
          <form onSubmit={handleSendEmailReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee Registered Email or Employee ID *
              </label>
              <input
                type="text"
                required
                value={identityInput}
                onChange={(e) => setIdentityInput(e.target.value)}
                placeholder="e.g. aditya.raj@oms.com or EMP014"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-red-600 focus:outline-none shadow-inner"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                We will dispatch a new secure account password directly to your registered company email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-red-600 py-3.5 font-extrabold text-xs text-white hover:bg-red-700 transition shadow-lg shadow-red-600/30"
            >
              {isSubmitting ? "Generating Reset Email..." : "📩 Dispatch New Password to My Email"}
            </button>
          </form>
        )}

        {/* Option 2: Create Brand New Custom Password */}
        {resetMethod === "create_new" && (
          <form onSubmit={handleCreateNewPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee Registered Email or Employee ID *
              </label>
              <input
                type="text"
                required
                value={identityInput}
                onChange={(e) => setIdentityInput(e.target.value)}
                placeholder="e.g. aditya.raj@oms.com or EMP014"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-red-600 focus:outline-none shadow-inner"
              />
            </div>

            {/* 🔐 PASSWORD STRENGTH ADVISORY */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-900">Enter New Password *</span>
                <span className={strength.colorClass}>
                  Strength: {strength.label} ({strength.score}/100)
                </span>
              </div>

              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong 12+ character password..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-red-600 focus:outline-none bg-white shadow-inner"
              />

              {/* Password Strength Indicator */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.score >= 80 ? "bg-emerald-500" : strength.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.max(5, strength.score)}%` }}
                ></div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600">
                <p className="font-extrabold text-slate-900">🛡️ Strong Password Security Guidelines:</p>
                <div className="grid grid-cols-2 gap-1 font-medium">
                  <span className={strength.hasMinLength ? "text-emerald-600 font-bold" : "text-slate-400"}>
                    {strength.hasMinLength ? "✓" : "○"} 12+ Characters
                  </span>
                  <span className={strength.hasUpper ? "text-emerald-600 font-bold" : "text-slate-400"}>
                    {strength.hasUpper ? "✓" : "○"} Uppercase (A-Z)
                  </span>
                  <span className={strength.hasLower ? "text-emerald-600 font-bold" : "text-slate-400"}>
                    {strength.hasLower ? "✓" : "○"} Lowercase (a-z)
                  </span>
                  <span className={strength.hasNumber ? "text-emerald-600 font-bold" : "text-slate-400"}>
                    {strength.hasNumber ? "✓" : "○"} Numbers (0-9)
                  </span>
                  <span className={strength.hasSymbol ? "text-emerald-600 font-bold" : "text-slate-400"}>
                    {strength.hasSymbol ? "✓" : "○"} Symbols (@#$%!)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-red-600 focus:outline-none bg-white shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-red-600 py-3.5 font-extrabold text-xs text-white hover:bg-red-700 transition shadow-lg shadow-red-600/30"
            >
              {isSubmitting ? "Updating Password..." : "💾 Update My Password & Email Confirmation"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-extrabold text-red-600 hover:underline">
            Sign In to Employee Portal
          </Link>
        </p>
      </div>

      {/* 🚀 OFFICIAL PASSWORD RESET EMAIL DISPATCH MODAL */}
      {showEmailModal && resetEmailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-300 max-h-[90vh] overflow-y-auto animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Password Reset Email Sent</h3>
                  <p className="text-xs text-emerald-600 font-bold">✓ Email Dispatched to {resetEmailRecord.recipientEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/auth/login");
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Email Subject */}
            <div className="bg-slate-100 p-3 rounded-xl border text-xs font-mono font-bold text-slate-900">
              Subject: {resetEmailRecord.emailSubject}
            </div>

            {/* HTML Email Body Preview */}
            <div
              className="border rounded-xl p-4 bg-white text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: resetEmailRecord.emailBodyHtml }}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                🖨️ Print Reset Confirmation
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/auth/login");
                }}
                className="bg-red-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
              >
                Proceed to Employee Login →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
