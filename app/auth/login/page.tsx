"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = searchParams.get("portal") || "all";

  const [activePortal, setActivePortal] = useState<"admin" | "employee" | "all">(
    portalParam === "admin" ? "admin" : portalParam === "employee" ? "employee" : "all"
  );

  // Form States
  const [loginIdentity, setLoginIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (portalParam === "admin") {
      setActivePortal("admin");
      setLoginIdentity("roushan.verma@oms.com");
    } else if (portalParam === "employee") {
      setActivePortal("employee");
      setLoginIdentity("aditya.raj@oms.com");
    }
  }, [portalParam]);

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginIdentity || !password) {
      setErrorMessage("Please enter your registered Email/Employee ID and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginIdentity, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMessage(data.message || "✓ Credentials verified. Redirecting to dashboard...");
        
        const serverUser = data.user;
        const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(serverUser.role);
        
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
        setErrorMessage(data.error || "Invalid credentials.");
      }
    } catch (err: any) {
      setErrorMessage("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-slate-200 relative z-10 space-y-6">
      {/* Header Branding & Title */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold text-2xl shadow-xl shadow-blue-600/30 mb-3 border-2 border-white">
          O
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {activePortal === "admin"
            ? "Admin Control Authentication"
            : activePortal === "employee"
            ? "Employee Portal Authentication"
            : "OMS Enterprise Authentication"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {activePortal === "admin"
            ? "Sign in with Administrator credentials"
            : activePortal === "employee"
            ? "Sign in with Employee ID or Email"
            : "Sign in with your corporate Email ID or Employee ID"}
        </p>
      </div>

      {/* Portal Selection Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActivePortal("admin");
            if (!loginIdentity || loginIdentity === "aditya.raj@oms.com") setLoginIdentity("roushan.verma@oms.com");
          }}
          className={`py-2 rounded-lg transition ${
            activePortal === "admin"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🛡️ Admin Portal
        </button>
        <button
          type="button"
          onClick={() => {
            setActivePortal("employee");
            if (!loginIdentity || loginIdentity === "roushan.verma@oms.com") setLoginIdentity("aditya.raj@oms.com");
          }}
          className={`py-2 rounded-lg transition ${
            activePortal === "employee"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          👤 Employee Portal
        </button>
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
            {activePortal === "admin"
              ? "Admin Email Address or Employee ID *"
              : activePortal === "employee"
              ? "Employee ID or Email Address *"
              : "Registered Email Address or Employee ID *"}
          </label>
          <input
            type="text"
            required
            value={loginIdentity}
            onChange={(e) => setLoginIdentity(e.target.value)}
            placeholder={
              activePortal === "admin"
                ? "e.g. roushan.verma@oms.com or EMP-8595"
                : "e.g. aditya.raj@oms.com or EMP014"
            }
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none transition shadow-inner"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-700">Account Password *</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              {showPassword ? "👁️ Hide Password" : "👁️ Show Password"}
            </button>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your account password..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none transition shadow-inner"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span>Remember Session</span>
          </label>
          <Link href="/auth/forget-password" className="text-blue-600 font-bold hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-xl py-3.5 font-extrabold text-xs text-white transition shadow-lg ${
            activePortal === "admin"
              ? "bg-slate-900 hover:bg-slate-950 shadow-slate-900/30"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
          }`}
        >
          {loading ? "Authenticating Against Database..." : "✓ Sign In to Portal"}
        </button>
      </form>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <Link href="/login" className="text-slate-500 hover:text-blue-600 font-bold">
          ← Switch Portal Selection
        </Link>
        <span className="text-slate-400 font-medium">Session Encrypted</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950" />
      <Suspense fallback={<div className="text-white text-xs font-bold">Loading Auth Portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
