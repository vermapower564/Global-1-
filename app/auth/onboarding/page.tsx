"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  evaluatePasswordStrength,
  PasswordStrengthResult,
} from "@/utils/onboardingEmail";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any | null>(null);

  // Password Setup States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState<PasswordStrengthResult>(evaluatePasswordStrength(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  // 1. Verify Invitation Token on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg("Missing invitation token. Please check your invitation email link.");
      setLoading(false);
      return;
    }

    fetch(`/api/invitations?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setErrorMsg(data.error || "Invalid or expired invitation token.");
        } else {
          setInvitation(data.data);
        }
      })
      .catch(() => {
        setErrorMsg("Failed to verify invitation token. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    setStrength(evaluatePasswordStrength(password));
  }, [password]);

  // 2. Submit Password & Activate Account
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match. Please re-enter.");
      return;
    }

    if (strength.score < 50) {
      const proceed = confirm("⚠️ Your password strength is weak. Are you sure you want to proceed with this password?");
      if (!proceed) return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setActivatedSuccess(true);
      } else {
        alert(`❌ Activation Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ Failed to activate account: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl" style={{ backgroundColor: "rgba(37, 6, 6, 0.05)" }}>
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Verifying Onboarding Token...</h3>
        <p className="text-xs text-slate-500 mt-1">Checking secure invitation validity with XAMPP MySQL</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 max-w-md w-full shadow-2xl space-y-4 text-center">
        <div className="h-14 w-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ⚠️
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Invitation Link Problem</h2>
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30">
          {errorMsg}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          If your invitation has expired or been cancelled, please ask your HR Manager to resend a new onboarding link.
        </p>
        <div className="pt-2">
          <Link
            href="/auth/login"
            className="inline-block bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
          >
            ← Return to Login Portal
          </Link>
        </div>
      </div>
    );
  }

  if (activatedSuccess) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 max-w-md w-full shadow-2xl text-center space-y-5 animate-in fade-in">
        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-lg shadow-emerald-500/20">
          🎉
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Account Successfully Activated!</h2>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Welcome to the team, {invitation?.name}!
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1.5 font-medium">
          <p className="text-slate-700 dark:text-slate-300">• <strong>Employee ID:</strong> <span className="font-mono font-bold text-slate-900 dark:text-white">{invitation?.employeeId}</span></p>
          <p className="text-slate-700 dark:text-slate-300">• <strong>Department:</strong> {invitation?.department}</p>
          <p className="text-slate-700 dark:text-slate-300">• <strong>Corporate Email:</strong> {invitation?.email}</p>
          <p className="text-slate-700 dark:text-slate-300">• <strong>Status:</strong> <span className="text-emerald-600 font-bold">ACTIVE</span></p>
        </div>
        <button
          onClick={() => router.push("/auth/login")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-blue-600/30 transition"
        >
          Proceed to Login Portal →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
      {/* Onboarding Header */}
      <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/40">
          Official Candidate Onboarding
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
          Welcome, {invitation?.name}!
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete your secure account activation for OMS Enterprise.
        </p>
      </div>

      {/* Candidate Metadata Summary Card */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2" style={{ backgroundColor: "rgba(37, 6, 6, 0.05)" }}    >
        <h4 className="font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center justify-between">
          <span>Assigned Joinee Profile</span>
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">{invitation?.employeeId}</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-medium">
          <div>
            <span className="text-slate-400 block text-[10px]">Department</span>
            <span className="font-bold text-slate-900 dark:text-white">{invitation?.department}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Designation</span>
            <span className="font-bold text-slate-900 dark:text-white">{invitation?.role}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block text-[10px]">Corporate Email</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{invitation?.email}</span>
          </div>
        </div>
      </div>

      {/* Password Setup Form */}
      <form onSubmit={handleActivateAccount} className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3" style={{ backgroundColor: "rgba(37, 6, 6, 0.05)" }}>
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white">Create Your Account Password *</span>
            <span className={strength.colorClass}>
              Strength: {strength.label} ({strength.score}/100)
            </span>
          </div>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter strong password (min 12 chars)..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none text-slate-900 dark:text-white"
          />

          {/* Strength Bar */}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                strength.score >= 80 ? "bg-emerald-500" : strength.score >= 50 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.max(5, strength.score)}%` }}
            ></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 transition shadow-lg shadow-blue-600/30"
        >
          {isSubmitting ? "Activating Account..." : "✓ Create Password & Activate Account"}
        </button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950" />
      <Suspense fallback={<div className="text-white text-xs font-bold p-8">Loading Onboarding Portal...</div>}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}
