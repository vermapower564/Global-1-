"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";

export default function LoginPage() {
  const router = useRouter();

  // Form States
  const [loginIdentity, setLoginIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginIdentity.trim() || !password) {
      setErrorMessage("Please enter your registered ID or Email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginIdentity.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMessage(data.message || "✓ Credentials verified. Redirecting...");
        
        const serverUser = data.user;
        const isAdmin = data.isAdmin || ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(serverUser.role);
        
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

        setTimeout(() => {
          if (isAdmin) {
            router.push("/admin/dashboard");
          } else {
            router.push("/employee/dashboard");
          }
        }, 400);
      } else {
        setErrorMessage(data.error || "Invalid ID/email or password.");
      }
    } catch (err: any) {
      setErrorMessage("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 space-y-6">
        {/* Header Branding & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-md mb-3 border-2 border-white">
            O
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">OMS Enterprise</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Secure Login</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleIdentitySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ID or Email
            </label>
            <input
              type="text"
              required
              value={loginIdentity}
              onChange={(e) => setLoginIdentity(e.target.value)}
              placeholder="e.g. EMP-8595 or roushan.verma@oms.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none transition shadow-inner"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                {showPassword ? "👁️ Hide" : "👁️ Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember Session</span>
            </label>
            <Link href="/auth/forgot-password" className="text-blue-600 font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3.5 font-extrabold text-xs text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          Protected by OMS Enterprise Database & Session Security
        </div>
      </div>
    </div>
  );
}
