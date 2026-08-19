"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addStoredEmployee } from "@/utils/employeeStore";
import { cleanIndianPhoneDigits, formatIndianPhone } from "@/utils/phoneUtils";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";
import { validateBankDetails } from "@/lib/bankHelper";
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
    // Bank Details
    accountHolderName: "",
    bankName: "HDFC Bank",
    accountNumber: "",
    ifscCode: "",
    branchName: "Main Branch",
    accountType: "Savings",
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

  // When name changes and accountHolderName is empty, auto-fill accountHolderName
  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      accountHolderName: prev.accountHolderName === prev.name || !prev.accountHolderName ? val : prev.accountHolderName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    // Form Validations
    if (!formData.name.trim()) {
      setErrorMsg("Full employee name is required.");
      return;
    }

    // Strict Gmail Check
    const emailValidation = validateAndNormalizeGmail(formData.email);
    if (!emailValidation.isValid) {
      setErrorMsg(emailValidation.error || "Only Gmail addresses ending with @gmail.com are allowed.");
      return;
    }

    const cleanGmail = emailValidation.normalizedEmail;

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

    // Required Bank Details Validation
    const bankValidation = validateBankDetails({
      accountHolderName: formData.accountHolderName || formData.name,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
    });

    if (!bankValidation.isValid) {
      setErrorMsg(bankValidation.error || "Please provide valid employee bank details.");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("Saving employee account & banking records into MySQL...");

    const generatedEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = formatIndianPhone(formData.phone);
    const payload = {
      id: generatedEmpId,
      ...formData,
      accountHolderName: formData.accountHolderName || formData.name,
      email: cleanGmail,
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
      cleanGmail,
      generatedEmpId,
      formData.department
    );
    setOnboardingEmail(emailRecord);
    setIsSubmitting(false);
    setShowEmailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/employees"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mb-2"
            >
              ← Back to Employee Workforce Directory
            </Link>
            <h1 className="text-2xl font-black text-black tracking-tight">Onboard New Employee</h1>
            <p className="text-xs text-gray-500 mt-1">
              Create account credentials, department assignment, and banking payment records.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold animate-in fade-in">
            ℹ️ {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xs space-y-8">
          {/* SECTION 1: Personal & Account Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
              <span>👤</span> 1. Basic & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">Gmail Address (@gmail.com) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rahul.sharma@gmail.com"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Choose Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                >
                  {availableDepartments.map((deptName) => (
                    <option key={deptName} value={deptName}>
                      🏢 {deptName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">System Role & Access *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
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
                <label className="block text-xs font-bold text-black mb-1">
                  Indian Contact Mobile (+91) *
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2.5 text-xs font-bold text-gray-700 rounded-l-xl">
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
                    className="w-full rounded-r-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-mono font-bold shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">Annual CTC Salary (₹ INR) *</label>
                <input
                  type="number"
                  required
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g. 850000"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-mono font-bold shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Dedicated Bank Details Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
                <span>🏦</span> 2. Bank Details & Salary Account Information
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Required for Monthly Payslip Processing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">Bank Name *</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Other">Other Bank</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, "") })}
                  placeholder="e.g. 50100432198765"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-mono font-bold shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  IFSC Code * <span className="text-gray-400 font-normal">(11 Alphanumeric Characters)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. HDFC0001234"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-mono font-bold uppercase shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Branch Name</label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="e.g. Cyber City Branch"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">Account Type *</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-blue-600 focus:outline-none font-bold shadow-2xs"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                  <option value="Salary">Salary Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Initial Password & Credentials */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-sm font-black text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
              <span>🔐</span> 3. Security & Initial Portal Credentials
            </h2>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-black">Set Initial Password *</span>
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
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none shadow-2xs"
              />

              <div>
                <label className="block text-xs font-bold text-black mb-1">Confirm Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter initial password..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-200">
            <Link
              href="/admin/employees"
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Creating Employee Account..." : "✓ Complete Onboarding & Save Bank Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Welcome Email Modal */}
      {showEmailModal && onboardingEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-gray-300 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-extrabold text-lg text-black">Official Onboarding Welcome Email Dispatched</h3>
                  <p className="text-xs text-blue-600 font-bold">✓ Sent to {onboardingEmail.recipientEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/admin/employees");
                }}
                className="text-gray-400 hover:text-black font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs font-mono font-bold text-black">
              Subject: {onboardingEmail.emailSubject}
            </div>

            <div
              className="border border-gray-200 rounded-xl p-4 bg-white text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: onboardingEmail.emailBodyHtml }}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => window.print()}
                className="bg-gray-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                🖨️ Print Welcome Letter
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  router.push("/admin/employees");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
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
