"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  evaluatePasswordStrength,
  generatePasswordResetEmail,
  OnboardingEmailRecord,
  PasswordStrengthResult,
} from "@/utils/onboardingEmail";
import { cleanIndianPhoneDigits } from "@/utils/phoneUtils";

export default function ForgetPasswordPage() {
  const router = useRouter();
  const [identityInput, setIdentityInput] = useState("");
  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailRecord, setResetEmailRecord] = useState<OnboardingEmailRecord | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [strength, setStrength] = useState<PasswordStrengthResult>(evaluatePasswordStrength(""));

  useEffect(() => {
    setStrength(evaluatePasswordStrength(newPassword));
  }, [newPassword]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identityInput || !newPassword) {
      setErrorMsg("Please enter your registered Email/Employee ID and new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("❌ Passwords do not match. Please re-enter.");
      return;
    }

    if (strength.score < 50) {
      const proceed = confirm("⚠️ Your new password is weak. Are you sure you want to proceed?");
      if (!proceed) return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityInput,
          mobile,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to update password.");
        setIsSubmitting(false);
        return;
      }

      // Generate Confirmation Email Preview Modal
      const record = generatePasswordResetEmail(identityInput, newPassword);
      setResetEmailRecord(record);
      setShowEmailModal(true);
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Ambient Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-slate-950 to-slate-950" />

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-slate-200 relative z-10 space-y-6 my-8">
        {/* Header Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-extrabold text-2xl shadow-xl shadow-red-600/30 mb-3 border-2 border-white">
            🔑
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Employee Password</h1>
          <p className="text-xs text-slate-500 mt-1">Verify your registered account details to set a new password in MySQL.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email Address or Employee ID *
            </label>
            <input
              type="text"
              required
              value={identityInput}
              onChange={(e) => setIdentityInput(e.target.value)}
              placeholder="e.g. rahul.sharma@oms.com or EMP014"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-red-600 focus:outline-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Indian Mobile Contact (+91)
            </label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600 rounded-l-xl">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(cleanIndianPhoneDigits(e.target.value))}
                placeholder="9876543210 (Optional for extra security verification)"
                className="w-full rounded-r-xl border border-slate-300 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-red-600 focus:outline-none shadow-inner"
              />
            </div>
          </div>

          {/* 🔐 PASSWORD STRENGTH */}
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
              placeholder="Enter strong 8+ character password..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-red-600 focus:outline-none bg-white shadow-inner"
            />

            {/* Password Strength Indicator Bar */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  strength.score >= 80 ? "bg-emerald-500" : strength.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.max(5, strength.score)}%` }}
              ></div>
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
            {isSubmitting ? "Saving New Password to Database..." : "💾 Update Password & Proceed to Login"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
          Remembered your password?{" "}
          <Link href="/auth/login" className="font-extrabold text-red-600 hover:underline">
            Sign In to Employee Portal
          </Link>
        </p>
      </div>

      {/* Email Dispatch Modal */}
      {showEmailModal && resetEmailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-300 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Password Reset Completed</h3>
                  <p className="text-xs text-emerald-600 font-bold">✓ Security Email Sent to {resetEmailRecord.recipientEmail}</p>
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

            <div className="bg-slate-100 p-3 rounded-xl border text-xs font-mono font-bold text-slate-900">
              Subject: {resetEmailRecord.emailSubject}
            </div>

            <div
              className="border rounded-xl p-4 bg-white text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: resetEmailRecord.emailBodyHtml }}
            />

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/auth/login");
                }}
                className="bg-red-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
              >
                Sign In with New Password →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
