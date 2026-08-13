"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";
import { getStoredEmployees } from "@/utils/employeeStore";

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"id_email" | "mobile" | "google">("id_email");

  // Form States: Login Identity (Employee ID or Email) & Password
  const [loginIdentity, setLoginIdentity] = useState("EMP014");
  const [password, setPassword] = useState("password123");
  const [mobileNumber, setMobileNumber] = useState("9876500014");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Demo Preset User Profiles
  const demoUsers = [
    {
      name: "Roushan Verma",
      email: "roushan.verma@oms.com",
      phone: "9876500001",
      role: "Super Admin",
      empId: "EMP001",
      mode: "ADMIN_HR" as const,
      project: "Enterprise Core Architecture & Platform Roadmap",
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@oms.com",
      phone: "9876500003",
      role: "HR Manager",
      empId: "EMP003",
      mode: "ADMIN_HR" as const,
      project: "Talent Onboarding & Attendance Desk",
    },
    {
      name: "Aarav Sharma",
      email: "aarav.sharma@oms.com",
      phone: "9876500013",
      role: "Project Manager (Team Leader)",
      empId: "EMP013",
      mode: "ADMIN_HR" as const,
      project: "OMS Core Architecture & Platform Optimization",
    },
    {
      name: "Aditya Raj",
      email: "aditya.raj@oms.com",
      phone: "9876500014",
      role: "Developer (Employee User)",
      empId: "EMP014",
      mode: "EMPLOYEE_USER" as const,
      project: "OMS Core Architecture & Platform Optimization",
    },
  ];

  const handleSelectPreset = (u: typeof demoUsers[0]) => {
    setLoginIdentity(u.empId);
    setMobileNumber(u.phone);
    setPassword("password123");
    setSuccessMessage(`✓ Selected Employee User: ${u.name} (ID: ${u.empId} • ${u.role})`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleLoginSuccess = (identity: string, resUserData?: any) => {
    const clean = identity.toLowerCase().trim();

    // 1. Check Demo Presets by ID or Email
    const matchedDemo = demoUsers.find(
      (u) => u.empId.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    // 2. Check Added Employees Store by ID or Email
    const storedEmps = getStoredEmployees();
    const matchedStored = storedEmps.find(
      (e) => (e.id && e.id.toLowerCase() === clean) || e.email.toLowerCase() === clean
    );

    const empId = resUserData?.employeeId || matchedDemo?.empId || matchedStored?.id || (clean.toUpperCase().startsWith("EMP") ? clean.toUpperCase() : `EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    const userName = resUserData?.name || matchedDemo?.name || matchedStored?.name || `Employee ${empId}`;
    const userEmail = resUserData?.email || matchedDemo?.email || matchedStored?.email || (clean.includes("@") ? clean : `${clean}@oms.com`);
    const userRole = resUserData?.role || matchedDemo?.role || matchedStored?.role || "Developer (Employee User)";
    const userMode = (matchedDemo?.mode || (clean === "admin@oms.com" || clean === "emp001" || clean.includes("admin") || clean.includes("hr") ? "ADMIN_HR" : "EMPLOYEE_USER")) as any;

    setCurrentUserContext({
      id: empId,
      name: userName,
      email: userEmail,
      role: userRole,
      activeMode: userMode,
      assignedProjectTitle: "OMS Enterprise Applications",
    });

    router.push("/dashboard");
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginIdentity, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMessage(data.message || "✓ Employee Authentication Successful!");
        
        const serverUser = data.user;
        const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(serverUser.role);
        
        setCurrentUserContext({
          id: serverUser.id,
          name: serverUser.name,
          email: serverUser.email,
          role: serverUser.role,
          activeMode: isAdmin ? "ADMIN_HR" : "EMPLOYEE_USER",
          assignedProjectTitle: "OMS Enterprise Applications",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 400);
      } else {
        setErrorMessage(data.error || "Invalid Employee ID or Password credentials.");
      }
    } catch (err: any) {
      setErrorMessage("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setErrorMessage("");
    setOtpSent(true);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginSuccess(loginIdentity);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      handleLoginSuccess("EMP001");
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-slate-950 to-slate-950" />

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-slate-200 relative z-10 space-y-6">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-extrabold text-2xl shadow-xl shadow-red-600/30 mb-3 border-2 border-white">
            O
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">OMS Enterprise Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Employee Access Desk (Employee ID & Password Verified)</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
          <button
            onClick={() => { setAuthMethod("id_email"); setOtpSent(false); }}
            className={`py-2 rounded-lg transition ${authMethod === "id_email" ? "bg-white text-red-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            🪪 ID / Email & Password
          </button>
          <button
            onClick={() => { setAuthMethod("mobile"); setOtpSent(false); }}
            className={`py-2 rounded-lg transition ${authMethod === "mobile" ? "bg-white text-red-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            📱 Mobile OTP
          </button>
          <button
            onClick={handleGoogleLogin}
            className="py-2 rounded-lg text-slate-600 hover:text-slate-900 transition"
          >
            🌐 Google SSO
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            {successMessage}
          </div>
        )}

        {/* Tab 1: Employee ID or Email Address & Password Login */}
        {authMethod === "id_email" && (
          <form onSubmit={handleIdentitySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee ID or Registered Email *
              </label>
              <input
                type="text"
                required
                value={loginIdentity}
                onChange={(e) => setLoginIdentity(e.target.value)}
                placeholder="e.g. EMP014 or aditya.raj@oms.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-red-600 focus:outline-none transition shadow-inner"
              />
              <p className="text-[10px] text-slate-400 mt-1">Enter your assigned Employee ID (e.g. EMP014) or Email.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-red-600 focus:outline-none transition shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 font-medium">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-red-600" />
                <span>Remember Session</span>
              </label>
              <Link href="/auth/forget-password" className="text-red-600 font-bold hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-3 font-extrabold text-xs text-white hover:bg-red-700 transition shadow-lg shadow-red-600/30"
            >
              {loading ? "Authenticating Employee ID..." : "✓ Sign In with Employee ID & Password"}
            </button>
          </form>
        )}

        {/* Tab 2: Mobile OTP Login */}
        {authMethod === "mobile" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendMobileOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">10-Digit Indian Mobile Phone (+91)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876500014"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-12 pr-3.5 text-xs font-mono font-bold focus:border-red-600 focus:outline-none transition shadow-inner"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-3 font-extrabold text-xs text-white hover:bg-emerald-700 transition shadow-md"
                >
                  📩 Send SMS OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  ✓ 6-Digit OTP sent to +91 {mobileNumber}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit Verification OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-300 py-2.5 text-center text-lg font-mono font-bold tracking-widest focus:border-red-600 focus:outline-none shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-red-600 py-3 font-extrabold text-xs text-white hover:bg-red-700 transition shadow-lg"
                >
                  Verify OTP & Login
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick Demo Employee ID Selector */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider text-center">
            Quick One-Click Demo Employee Sign-In:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {demoUsers.map((u, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(u)}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-left transition space-y-0.5 group"
              >
                <div className="font-extrabold text-slate-900 group-hover:text-red-600 transition truncate text-[11px]">
                  {u.name} ({u.empId})
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">{u.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
