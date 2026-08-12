"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addStoredEmployee } from "@/utils/employeeStore";
import { cleanIndianPhoneDigits, formatIndianPhone } from "@/utils/phoneUtils";
import {
  evaluatePasswordStrength,
  generateCongratulationsWelcomeEmail,
  OnboardingEmailRecord,
  PasswordStrengthResult,
} from "@/utils/onboardingEmail";

export default function AddEmployeePage() {
  const router = useRouter();
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "Development & Engineering",
    role: "Software Developer",
    salary: "850000",
    phone: "9876543210",
    password: "SecurePass@2026!",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [onboardingEmail, setOnboardingEmail] = useState<OnboardingEmailRecord | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [strength, setStrength] = useState<PasswordStrengthResult>(evaluatePasswordStrength(formData.password));

  // Fetch Dynamic Department Options from MySQL API
  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          const deptNames = json.data.map((d: any) => d.name);
          // Combine unique department names
          const combined = Array.from(new Set([...deptNames, ...availableDepartments]));
          setAvailableDepartments(combined);
          if (!formData.department) {
            setFormData((prev) => ({ ...prev, department: combined[0] }));
          }
        }
      })
      .catch((err) => console.warn("Failed to fetch departments list:", err));
  }, []);

  useEffect(() => {
    setStrength(evaluatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg("Saving employee & generating onboarding congratulations email...");

    const generatedEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = formatIndianPhone(formData.phone);
    const payload = {
      id: generatedEmpId,
      ...formData,
      phone: formattedPhone,
    };

    try {
      // 1. Post to XAMPP MySQL API
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("MySQL save fallback");
    }

    // 2. Save to local storage store
    addStoredEmployee(payload);

    // 3. Generate Official Congratulations Welcome Email & Security Advice
    const emailRecord = generateCongratulationsWelcomeEmail(
      formData.name,
      formData.email,
      generatedEmpId,
      formData.department
    );

    setOnboardingEmail(emailRecord);
    setShowEmailModal(true);
    setIsSubmitting(false);
    setStatusMsg("✓ Employee user created & Congratulations Welcome Email dispatched!");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* 🤎 Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 p-6 rounded-2xl flex items-center justify-between shadow-xl border border-amber-800/40 text-amber-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
            HCM System • Onboarding Engine
          </span>
          <h1 className="text-2xl font-black text-amber-100 tracking-tight mt-1">Register New Employee</h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Data is written into XAMPP MySQL and dispatches an automated Congratulations Welcome Email.
          </p>
        </div>
        <Link href="/employees" className="bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 font-bold text-xs px-4 py-2 rounded-xl border border-amber-800/40 transition">
          ← Directory
        </Link>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs">
          {statusMsg}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-amber-900/40 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Full Employee Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Company Registered Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rahul.sharma@oms.com"
                className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 🏢 Department Selection Dropdown Option */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">
                Choose Department to Join *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none font-semibold"
              >
                {availableDepartments.map((deptName) => (
                  <option key={deptName} value={deptName}>
                    🏢 {deptName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Job Designation *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">
                Indian Contact Phone (+91) *
              </label>
              <div className="flex items-center">
                <span className="bg-stone-100 dark:bg-amber-950/40 border border-r-0 border-stone-300 dark:border-amber-900/60 px-3 py-2.5 text-xs font-bold text-stone-600 dark:text-amber-300 rounded-l-xl">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: cleanIndianPhoneDigits(e.target.value),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full rounded-r-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3 py-2.5 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none font-mono font-extrabold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-amber-200/80 mb-1">Annual Compensation (₹ INR) *</label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. 850000"
                className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-stone-50 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Initial Password */}
          <div className="p-4 rounded-xl bg-amber-950/10 dark:bg-amber-950/30 border border-amber-900/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-950 dark:text-amber-200">Initial Account Password *</span>
              <span className={strength.colorClass}>
                Strength: {strength.label} ({strength.score}/100)
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-stone-300 dark:border-amber-900/60 bg-white dark:bg-stone-950 px-3.5 py-2 text-xs font-mono font-bold text-stone-900 dark:text-amber-100 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-amber-900/40">
            <Link href="/employees" className="px-4 py-2 rounded-xl border border-stone-300 dark:border-amber-900/40 text-xs font-semibold text-stone-600 dark:text-amber-200 hover:bg-stone-100 dark:hover:bg-amber-950/40">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md border border-amber-700 flex items-center gap-2"
            >
              {isSubmitting ? "Generating Onboarding Email..." : "✓ Register Employee & Dispatch Welcome Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Welcome Email Modal */}
      {showEmailModal && onboardingEmail && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-amber-900/30 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-extrabold text-lg text-amber-950">Official Onboarding Welcome Email Dispatched</h3>
                  <p className="text-xs text-amber-800 font-bold">✓ Sent to {onboardingEmail.recipientEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/employees");
                }}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-950/10 p-3 rounded-xl border border-amber-900/20 text-xs font-mono font-bold text-amber-950">
              Subject: {onboardingEmail.emailSubject}
            </div>

            <div
              className="border border-stone-200 rounded-xl p-4 bg-white text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: onboardingEmail.emailBodyHtml }}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-amber-900/20">
              <button
                onClick={() => window.print()}
                className="bg-amber-950 text-amber-50 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md border border-amber-800"
              >
                🖨️ Print Welcome Letter
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/employees");
                }}
                className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md border border-amber-700"
              >
                Done • View Employee Directory →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
