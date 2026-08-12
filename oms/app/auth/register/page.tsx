"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  evaluatePasswordStrength,
  generateCongratulationsWelcomeEmail,
  OnboardingEmailRecord,
  PasswordStrengthResult,
} from "@/utils/onboardingEmail";
import { addStoredEmployee } from "@/utils/employeeStore";
import { cleanIndianPhoneDigits, formatIndianPhone } from "@/utils/phoneUtils";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlDept = searchParams?.get("dept") || "Development & Engineering";

  const [availableDepartments, setAvailableDepartments] = useState<string[]>([
    "Development & Engineering",
    "Human Resources",
    "Accounts & Finance",
    "Growth & Sales",
    "UI/UX & Graphic Design",
    "Camera & Video Production",
    "Digital Marketing",
    "Executive Management",
  ]);

  // Form Input States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("9876543210");
  const [department, setDepartment] = useState(urlDept);
  const [role, setRole] = useState("Senior Software Engineer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email & Modal States
  const [onboardingEmail, setOnboardingEmail] = useState<OnboardingEmailRecord | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [strength, setStrength] = useState<PasswordStrengthResult>(evaluatePasswordStrength(""));

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          const deptNames = json.data.map((d: any) => d.name);
          const combined = Array.from(new Set([...deptNames, ...availableDepartments]));
          setAvailableDepartments(combined);
          if (!department) setDepartment(combined[0]);
        }
      })
      .catch((err) => console.warn("Failed to fetch departments list:", err));
  }, []);

  useEffect(() => {
    setStrength(evaluatePasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match. Please re-enter.");
      return;
    }

    if (strength.score < 50) {
      const proceed = confirm("⚠️ Your password is weak. Are you sure you want to register with this password?");
      if (!proceed) return;
    }

    setIsSubmitting(true);

    const generatedEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = formatIndianPhone(phone);

    const payload = {
      id: generatedEmpId,
      name,
      email,
      department,
      role,
      salary: "₹8,50,000",
      phone: formattedPhone,
    };

    // 1. Save to XAMPP MySQL API
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("MySQL save fallback");
    }

    // 2. Save to Local Employees Store
    addStoredEmployee(payload);

    // 3. Generate Congratulations Welcome Email & Security Advice
    const emailRecord = generateCongratulationsWelcomeEmail(name, email, generatedEmpId, department);
    setOnboardingEmail(emailRecord);
    setShowEmailModal(true);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl border border-slate-200 relative z-10 space-y-6 my-8">
      {/* Header Title */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-extrabold text-2xl shadow-xl shadow-red-600/30 mb-3 border-2 border-white">
          O
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Join OMS Enterprise</h1>
        <p className="text-xs text-slate-500 mt-1">Official Candidate Registration & Employee Onboarding Portal</p>
      </div>

      {/* Candidate Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-red-600 focus:outline-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Registered Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@oms.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-red-600 focus:outline-none shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 🏢 Department Option Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Choose Department to Join *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-red-600 focus:outline-none bg-white text-slate-900 shadow-inner"
            >
              {availableDepartments.map((deptName) => (
                <option key={deptName} value={deptName}>
                  🏢 {deptName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Indian Mobile Contact (+91) *</label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600 rounded-l-xl">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(cleanIndianPhoneDigits(e.target.value))}
                placeholder="9876543210"
                className="w-full rounded-r-xl border border-slate-300 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-red-600 focus:outline-none shadow-inner"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Job Title / Designation *</label>
          <input
            type="text"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Fullstack Developer"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-red-600 focus:outline-none shadow-inner"
          />
        </div>

        {/* 🔐 PASSWORD STRENGTH */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900">Create Account Password *</span>
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
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-red-600 focus:outline-none bg-white shadow-inner"
          />

          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                strength.score >= 80 ? "bg-emerald-500" : strength.score >= 50 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.max(5, strength.score)}%` }}
            ></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-red-600 focus:outline-none bg-white shadow-inner"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-red-600 py-3.5 font-extrabold text-xs text-white hover:bg-red-700 transition shadow-lg shadow-red-600/30"
        >
          {isSubmitting ? "Processing Registration..." : "🚀 Submit Application & Generate Welcome Email"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
        Already registered?{" "}
        <Link href="/auth/login" className="font-extrabold text-red-600 hover:underline">
          Sign In to Employee Portal
        </Link>
      </p>

      {/* Welcome Email Modal */}
      {showEmailModal && onboardingEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-300 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Official Onboarding Welcome Email Sent</h3>
                  <p className="text-xs text-emerald-600 font-bold">✓ Email Dispatched to {onboardingEmail.recipientEmail}</p>
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
              Subject: {onboardingEmail.emailSubject}
            </div>

            <div
              className="border rounded-xl p-4 bg-white text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: onboardingEmail.emailBodyHtml }}
            />

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                🖨️ Print Welcome Letter
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

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-slate-950 to-slate-950" />
      <Suspense fallback={<div className="text-white text-xs font-bold p-8">Loading Candidate Onboarding Desk...</div>}>
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}
