"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";
import { ROUTES } from "@/lib/routes";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "";

  // Role Tab Selection: "ADMIN" | "EMPLOYEE"
  const [selectedRoleType, setSelectedRoleType] = useState<"ADMIN" | "EMPLOYEE">("ADMIN");

  // Form States
  const [loginIdentity, setLoginIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRoleTypeChange = (type: "ADMIN" | "EMPLOYEE") => {
    setSelectedRoleType(type);
    setErrorMessage("");
    if (type === "ADMIN") {
      setLoginIdentity("roushan.verma@gmail.com");
      setPassword("Roushan@123");
    } else {
      setLoginIdentity("aditya.raj@gmail.com");
      setPassword("password123");
    }
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginIdentity.trim()) {
      setErrorMessage("Please enter your registered Employee ID or Gmail address.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your account password.");
      setLoading(false);
      return;
    }

    const inputVal = loginIdentity.trim();

    // Frontend strict check if user entered an email address
    if (inputVal.includes("@")) {
      const emailCheck = validateAndNormalizeGmail(inputVal);
      if (!emailCheck.isValid) {
        setErrorMessage(emailCheck.error || "Only Gmail addresses ending with @gmail.com are allowed.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inputVal,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMessage(data.message || "✓ Identity verified. Redirecting...");

        const serverUser = data.user;
        const isAdmin =
          data.isAdmin ||
          ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"].includes(serverUser.role);

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
          if (redirectTarget && redirectTarget.startsWith("/")) {
            if (redirectTarget.startsWith("/admin") && !isAdmin) {
              router.push(ROUTES.EMPLOYEE_HOME);
            } else {
              router.push(redirectTarget);
            }
          } else if (isAdmin) {
            router.push(ROUTES.ADMIN_HOME);
          } else {
            router.push(ROUTES.EMPLOYEE_HOME);
          }
        }, 400);
      } else {
        setErrorMessage(data.error || "Invalid credentials: Account not found or incorrect password.");
      }
    } catch (err: any) {
      setErrorMessage("Network connection error. Please try again.");
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
          <h1 className="text-2xl font-black text-black tracking-tight">OMS Enterprise</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Enterprise Operations Portal Login</p>
        </div>

        {/* Role Type Selector Tabs */}
        <div className="flex rounded-2xl bg-gray-100 p-1 border border-gray-200">
          <button
            type="button"
            onClick={() => handleRoleTypeChange("ADMIN")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedRoleType === "ADMIN"
                ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                : "text-gray-600 hover:text-black"
            }`}
          >
            🛡️ Admin / Management
          </button>
          <button
            type="button"
            onClick={() => handleRoleTypeChange("EMPLOYEE")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedRoleType === "EMPLOYEE"
                ? "bg-white text-blue-600 shadow-xs border border-gray-200"
                : "text-gray-600 hover:text-black"
            }`}
          >
            👤 Employee / Staff
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
            <label className="block text-xs font-bold text-black mb-1">
              {selectedRoleType === "ADMIN" ? "Admin ID / Gmail (@gmail.com)" : "Employee ID / Gmail (@gmail.com)"}
            </label>
            <input
              type="text"
              required
              value={loginIdentity}
              onChange={(e) => setLoginIdentity(e.target.value)}
              placeholder={
                selectedRoleType === "ADMIN"
                  ? "e.g. EMP-8595 or roushan.verma@gmail.com"
                  : "e.g. EMP014 or aditya.raj@gmail.com"
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
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
              placeholder="Enter your account password..."
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
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 font-extrabold text-xs text-white transition shadow-md cursor-pointer"
          >
            {loading ? "Authenticating Account..." : `Sign In as ${selectedRoleType === "ADMIN" ? "Admin" : "Employee"}`}
          </button>
        </form>

        <div className="pt-3 border-t border-gray-100 text-center text-[11px] text-gray-500 font-medium">
          Strict Role-Based Access Control • Server-Side Verification Enforced
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
