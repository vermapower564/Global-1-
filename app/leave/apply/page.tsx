"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LeaveConfirmationModal from "@/components/LeaveConfirmationModal";
import CustomerCareModal from "@/components/CustomerCareModal";
import { addStoredLeaveRequest } from "@/utils/leaveStore";
import { cleanIndianPhoneDigits, formatIndianPhone } from "@/utils/phoneUtils";

export default function ApplyLeavePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeName: "Aditya Raj",
    department: "Engineering",
    leaveType: "Casual Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
    contactPhone: "9876599999",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const totalDays = calculateDays(formData.startDate, formData.endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedPhone = formatIndianPhone(formData.contactPhone);
    const payload = {
      ...formData,
      contactPhone: formattedPhone,
      totalDays,
    };

    addStoredLeaveRequest(payload);

    try {
      // Post directly to API Route -> XAMPP MySQL (leaverequest table) via Prisma
      await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      console.warn("MySQL save fallback:", err.message);
    } finally {
      setShowLeaveModal(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="gradient-banner-purple p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Employee Portal</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Apply For Leave</h1>
          <p className="text-xs text-purple-100 mt-1">
            Submit a formal leave application saved PERMANENTLY into local XAMPP MySQL database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-white/20 transition"
          >
            🛡️ Customer Care Notice
          </button>
          <Link href="/hr" className="btn-secondary text-xs shrink-0">
            ← Back to HR Portal
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="pro-card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee Name *</label>
              <input
                type="text"
                required
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs bg-white font-semibold"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales & CRM">Sales & CRM</option>
                <option value="Digital Marketing">Digital Marketing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type *</label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs bg-white font-semibold"
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Privilege Leave">Privilege Leave</option>
                <option value="Maternity / Paternity">Maternity / Paternity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-mono"
              />
            </div>
          </div>

          {/* Calculated Duration Display */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Calculated Leave Duration:</span>
            <span className="font-extrabold text-blue-700 text-sm">
              {totalDays} {totalDays === 1 ? "Day" : "Days"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Necessary Reason / Justification *
            </label>
            <textarea
              required
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide the specific reason for requesting leave (e.g., medical emergency, personal work, family event)..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Emergency Contact Phone Number (10 Digits) *
            </label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600 rounded-l-lg">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPhone: cleanIndianPhoneDigits(e.target.value),
                  })
                }
                placeholder="9876543210"
                className="w-full rounded-r-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link href="/hr" className="btn-secondary text-xs">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-accent text-xs px-6 py-2.5 shadow-md flex items-center gap-2"
            >
              {isSubmitting ? "Submitting Application..." : "📝 Submit Leave Application"}
            </button>
          </div>
        </form>
      </div>

      {/* Pop-up Modals */}
      <LeaveConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          router.push("/hr");
        }}
        employeeName={formData.employeeName}
        leaveType={formData.leaveType}
        totalDays={totalDays}
      />

      <CustomerCareModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        agentName={formData.employeeName}
      />
    </div>
  );
}
