"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Steps: 1 = Enter ID/Email, 2 = Enter OTP, 3 = Enter New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form States
  const [identityInput, setIdentityInput] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check incoming query parameters from SMTP email link
  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const identity = searchParams.get("identity");

    if (token && (email || identity)) {
      const targetId = (identity || email || "").trim();
      setIdentityInput(targetId);
      setOtpCode(token.trim());
      setSuccessMessage("✓ Reset link verified! Please enter your new secure password.");
      setStep(3);
    }
  }, [searchParams]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!identityInput.trim()) {
      setErrorMessage("Please enter your registered Employee ID or Gmail address.");
      setLoading(false);
      return;
    }

    const inputVal = identityInput.trim();

    // Frontend strict check if email format entered
    if (inputVal.includes("@")) {
      const emailCheck = validateAndNormalizeGmail(inputVal);
      if (!emailCheck.isValid) {
        setErrorMessage(emailCheck.error || "Only Gmail addresses ending with @gmail.com are allowed.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityInput: inputVal }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMaskedEmail(data.maskedEmail || data.email);
        setSuccessMessage("OTP sent successfully to your registered Gmail address.");
        if (data.demoOtp) {
          console.log(`[DEBUG] OTP for testing: ${data.demoOtp}`);
        }
        setStep(2);
      } else {
        setErrorMessage(data.error || "Account not found for the entered ID or Gmail address.");
      }
    } catch (err: any) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!otpCode.trim()) {
      setErrorMessage("Please enter the 6-digit OTP code sent to your Gmail.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityInput: identityInput.trim(),
          otpCode: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("OTP verified successfully. Please set your new password.");
        setStep(3);
      } else {
        setErrorMessage(data.error || "Invalid or expired OTP.");
      }
    } catch (err: any) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Update Password in Database
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please enter and confirm your new password.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityInput: identityInput.trim(),
          otpCode: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("Password updated successfully.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        setErrorMessage(data.error || "Failed to update password.");
      }
    } catch (err: any) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 space-y-6">
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-md mb-3 border-2 border-white">
            🔑
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {step === 1 && "Enter your Employee ID or Gmail address (@gmail.com) to receive OTP"}
            {step === 2 && `Enter the 6-digit OTP code sent to ${maskedEmail || "your Gmail"}`}
            {step === 3 && "Set your new password for OMS Enterprise"}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
            ✓ {successMessage}
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered ID or Gmail (@gmail.com)
              </label>
              <input
                type="text"
                required
                value={identityInput}
                onChange={(e) => setIdentityInput(e.target.value)}
                placeholder="e.g. EMP-8595 or roushan.verma@gmail.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-extrabold text-xs text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
            >
              {loading ? "Finding Account..." : "Send OTP Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 6-Digit Verification OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-Digit OTP Code"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-center font-mono font-bold text-lg text-blue-600 focus:border-blue-600 focus:outline-none tracking-widest shadow-inner"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-xl bg-slate-100 py-3 font-extrabold text-xs text-slate-700 hover:bg-slate-200 transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 rounded-xl bg-blue-600 py-3 font-extrabold text-xs text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
              >
                {loading ? "Verifying..." : "Verify OTP Code"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">New Password</label>
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter 8+ character new password..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-blue-600 focus:outline-none shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-extrabold text-xs text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
            >
              {loading ? "Updating Database..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-slate-100 text-center text-[11px]">
          <Link href="/auth/login" className="font-extrabold text-blue-600 hover:underline">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
