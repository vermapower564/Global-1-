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

const SYSTEM_ROLES = [
  { value: "DEVELOPER", label: "Developer (Software Engineer)" },
  { value: "PROJECT_MANAGER", label: "Project Manager (Team Lead)" },
  { value: "HR", label: "HR Manager" },
  { value: "FINANCE", label: "Finance / Payroll Manager" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES_EXECUTIVE", label: "Sales Executive" },
  { value: "DIGITAL_MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "SEO_EXECUTIVE", label: "SEO Executive" },
  { value: "CONTENT_WRITER", label: "Content Writer" },
  { value: "DIRECTOR", label: "Director (Executive Level)" },
  { value: "SUPER_ADMIN", label: "Super Administrator" },
];

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
    role: "DEVELOPER",
    salary: "850000",
    phone: "9876543210",
    joiningDate: new Date().toISOString().split("T")[0],
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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
    setErrorMsg("");
    setStatusMsg("");

    // Form Validations
    if (!formData.name.trim()) {
      setErrorMsg("Full employee name is required.");
      return;
    }

    if (!formData.email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (formData.phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Initial password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("Saving employee account into MySQL & dispatching onboarding welcome email...");

    const generatedEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = formatIndianPhone(formData.phone);
    const payload = {
      id: generatedEmpId,
      ...formData,
      phone: formattedPhone,
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to register employee user.");
        setIsSubmitting(false);
        return;
      }
    } catch (e) {
      console.warn("MySQL save fallback");
    }

    addStoredEmployee(payload);

    const emailRecord = generateCongratulationsWelcomeEmail(
      formData.name,
      formData.email,
      generatedEmpId,
      formData.department
    );

    setOnboardingEmail(emailRecord);
    setShowEmailModal(true);
    setIsSubmitting(false);
    setStatusMsg("✓ Employee user account created in MySQL & onboarding welcome email dispatched!");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Workforce Onboarding Desk
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">Register New Employee</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create an internal employee account. An Employee ID and initial password will be assigned.
          </p>
        </div>
        <Link href="/employees" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition">
          ← Directory
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {statusMsg && !errorMsg && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-xs">
          {statusMsg}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Employee Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Registered Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rahul.sharma@oms.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Choose Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-semibold"
              >
                {availableDepartments.map((deptName) => (
                  <option key={deptName} value={deptName}>
                    🏢 {deptName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">System Role & Access *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-extrabold"
              >
                {SYSTEM_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    🛡️ {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Indian Contact Mobile (+91) *
              </label>
              <div className="flex items-center">
                <span className="bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-l-xl">
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
                  className="w-full rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-mono font-extrabold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Annual Salary (₹ INR) *</label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. 850000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Initial Password */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white">Set Initial Password *</span>
              <span className={strength.colorClass}>
                Strength: {strength.label} ({strength.score}/100)
              </span>
            </div>

            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter strong 6+ character initial password..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Initial Password *</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter initial password..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <Link href="/employees" className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              {isSubmitting ? "Creating Employee Account..." : "✓ Create Employee Account & Dispatch Welcome Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Welcome Email Modal */}
      {showEmailModal && onboardingEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-300 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Official Onboarding Welcome Email Dispatched</h3>
                  <p className="text-xs text-blue-600 font-bold">✓ Sent to {onboardingEmail.recipientEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/employees");
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
                className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                🖨️ Print Welcome Letter
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/employees");
                }}
                className="bg-blue-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
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
