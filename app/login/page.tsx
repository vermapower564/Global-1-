"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";
import { ROUTES } from "@/lib/routes";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "";

  // Form States
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!identity.trim()) {
      setErrorMessage("Please enter your User ID or Email.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: identity.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMessage(data.message || "✓ Login successful. Redirecting...");

        const serverUser = data.user;
        const isAdmin = !!data.isAdmin;

        // Update Client Context Store
        setCurrentUserContext({
          id: serverUser.id,
          employeeId: serverUser.employeeId || serverUser.id,
          name: serverUser.name,
          email: serverUser.email,
          role: serverUser.role,
          activeMode: isAdmin ? "ADMIN_HR" : "EMPLOYEE_USER",
          avatarUrl: serverUser.avatarUrl || null,
          assignedProjectTitle: "OMS Enterprise System",
        });

        // Determine destination dashboard based on authenticated role
        const destination =
          redirectTarget && redirectTarget.startsWith("/")
            ? redirectTarget.startsWith("/admin") && !isAdmin
              ? (data.redirectTo || "/employee/dashboard")
              : redirectTarget
            : (data.redirectTo || (isAdmin ? "/admin/dashboard" : "/employee/dashboard"));

        setTimeout(() => {
          window.location.href = destination;
        }, 150);
      } else {
        setErrorMessage(data.error || "Invalid Employee ID or password.");
      }
    } catch (err: any) {
      setErrorMessage("Unable to connect to the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans text-black">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-200 space-y-6">
        {/* Header Branding & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-md mb-3 border-2 border-white">
            O
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight">OMS</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Enterprise Operations Management</p>
        </div>

        {searchParams.get("reason") === "inactivity_timeout" && !errorMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-in fade-in flex items-center gap-2">
            <span>⏳</span>
            <span>Your session expired due to 1 hour of inactivity. Please sign in again.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">
              User ID / Employee ID / Email
            </label>
            <input
              type="text"
              required
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Enter User ID, Employee ID or Email"
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-black">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password..."
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember Session</span>
            </label>
            <Link href={ROUTES.FORGOT_PASSWORD} className="text-blue-600 font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 font-extrabold text-xs text-white transition shadow-md cursor-pointer disabled:opacity-50 tracking-wider uppercase"
          >
            {loading ? "Authenticating..." : "LOGIN"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-500 font-medium">
          Protected by Enterprise 2FA & Role-Based Access Control
        </div>
      </div>
    </div>
  );
}

export default function RootLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xl space-y-3">
            <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-gray-700">Loading Login Portal...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
