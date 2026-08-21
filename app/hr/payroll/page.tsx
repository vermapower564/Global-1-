"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HRPayrollPage() {
  const [slips, setSlips] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("August 2026");
  const [search, setSearch] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State for creating Salary Slip
  const [formData, setFormData] = useState({
    employeeId: "",
    salaryMonth: "August 2026",
    basicSalary: 45000,
    hra: 20000,
    allowances: 10000,
    bonus: 5000,
    overtime: 0,
    pfDeduction: 5400,
    taxDeduction: 3500,
    otherDeductions: 200,
    paymentMethod: "Direct Bank Transfer / NEFT",
    paymentStatus: "PUBLISHED",
    notes: "Regular monthly payroll disbursement",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSalarySlips = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/salary-slips?month=${encodeURIComponent(month)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSlips(json.data);
      } else {
        setSlips([]);
      }
    } catch (err) {
      console.warn("Failed fetching salary slips:", err);
      setSlips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
        if (json.data.length > 0 && !formData.employeeId) {
          const firstEmp = json.data[0];
          setFormData((prev) => ({
            ...prev,
            employeeId: firstEmp.id || firstEmp.employeeId,
            basicSalary: Math.round(((firstEmp.salary || 600000) / 12) * 0.5),
            hra: Math.round(((firstEmp.salary || 600000) / 12) * 0.3),
            allowances: Math.round(((firstEmp.salary || 600000) / 12) * 0.2),
          }));
        }
      }
    } catch (e) {
      console.warn("Failed fetching employees list:", e);
    }
  };

  useEffect(() => {
    fetchSalarySlips();
    fetchEmployees();
  }, [month]);

  const handleEmployeeSelect = (empId: string) => {
    const selected = employees.find((e) => e.id === empId || e.employeeId === empId);
    if (selected) {
      const baseMonthly = selected.salary > 0 ? Math.round(selected.salary / 12) : 65000;
      const basic = Math.round(baseMonthly * 0.5);
      const hra = Math.round(baseMonthly * 0.3);
      const allowances = Math.max(0, baseMonthly - basic - hra);
      const pf = Math.round(basic * 0.12);
      const tax = Math.round(baseMonthly * 0.05);

      setFormData((prev) => ({
        ...prev,
        employeeId: selected.id || selected.employeeId,
        basicSalary: basic,
        hra,
        allowances,
        pfDeduction: pf,
        taxDeduction: tax,
      }));
    } else {
      setFormData((prev) => ({ ...prev, employeeId: empId }));
    }
  };

  const calculatedGross =
    Number(formData.basicSalary || 0) +
    Number(formData.hra || 0) +
    Number(formData.allowances || 0) +
    Number(formData.bonus || 0) +
    Number(formData.overtime || 0);

  const calculatedDeductions =
    Number(formData.pfDeduction || 0) +
    Number(formData.taxDeduction || 0) +
    Number(formData.otherDeductions || 0);

  const calculatedNet = Math.max(0, calculatedGross - calculatedDeductions);

  const handleCreateSalarySlip = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    if (!formData.employeeId) {
      alert("Please select an employee.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/salary-slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentStatus: targetStatus,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setToastMsg(`✓ Salary slip successfully ${targetStatus === "DRAFT" ? "saved as draft" : "generated & published"}!`);
        setShowGenerateModal(false);
        fetchSalarySlips();
      } else {
        alert(json.error || "Failed to generate salary slip.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalGross = slips.reduce((sum, s) => sum + (Number(s.grossSalary) || 0), 0);
  const totalNet = slips.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
  const totalDeductions = slips.reduce((sum, s) => sum + (Number(s.totalDeductions) || 0), 0);

  const filteredSlips = slips.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (s.employeeName || s.user?.name || "").toLowerCase();
      const empId = (s.employeeId || s.user?.employeeId || "").toLowerCase();
      if (!name.includes(q) && !empId.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Salary & Payroll Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>💰</span> Salary Management & Slips
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create, manage, and publish employee salary slips with automated gross/net calculations and official PDF downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Generate Salary Slip
          </button>
          <Link
            href="/hr"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            ← HR Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Gross Payroll</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">
            ₹{totalGross.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">For period {month}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Net Disbursed</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2 font-mono">
            ₹{totalNet.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Direct employee accounts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Deductions</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono">
            ₹{totalDeductions.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">PF, PT, and TDS deductions</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">Select Pay Period:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
            >
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="All">All Months</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search employee or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading payroll records...
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-3xl">📄</div>
            <p className="text-xs font-bold text-slate-600">No salary slip available for the selected period.</p>
            <p className="text-[11px] text-slate-400">Click "Generate Salary Slip" to create a new slip for an employee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Employee ID</th>
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3">Gross Salary</th>
                  <th className="py-3 px-3">Deductions</th>
                  <th className="py-3 px-3">Net Pay</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSlips.map((slip: any) => (
                  <tr key={slip.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{slip.employeeName || slip.user?.name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{slip.employeeId || slip.user?.employeeId}</td>
                    <td className="py-3 px-3 text-slate-600 font-bold">{slip.salaryMonth}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      ₹{Number(slip.grossSalary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-600">
                      -₹{Number(slip.totalDeductions || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600">
                      ₹{Number(slip.netSalary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                        slip.paymentStatus === "DRAFT"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {slip.paymentStatus || "PUBLISHED"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <a
                        href={`/api/salary-slips/${slip.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black rounded-xl text-xs border border-blue-200 transition cursor-pointer"
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Salary Slip Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Generate Employee Salary Slip</h3>
                <p className="text-xs text-slate-500 font-medium">Create and publish verified monthly payroll compensation.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId}) - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pay Period *</label>
                <select
                  value={formData.salaryMonth}
                  onChange={(e) => setFormData({ ...formData, salaryMonth: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="September 2026">September 2026</option>
                </select>
              </div>
            </div>

            {/* Earnings Grid */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Earnings (₹)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Basic Salary</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">HRA</label>
                  <input
                    type="number"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Allowances</label>
                  <input
                    type="number"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Bonus</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Overtime</label>
                  <input
                    type="number"
                    value={formData.overtime}
                    onChange={(e) => setFormData({ ...formData, overtime: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Deductions Grid */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider">Deductions (₹)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">PF Deduction</label>
                  <input
                    type="number"
                    value={formData.pfDeduction}
                    onChange={(e) => setFormData({ ...formData, pfDeduction: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tax (TDS)</label>
                  <input
                    type="number"
                    value={formData.taxDeduction}
                    onChange={(e) => setFormData({ ...formData, taxDeduction: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Other Deductions</label>
                  <input
                    type="number"
                    value={formData.otherDeductions}
                    onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Computed Calculation Box */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Gross Pay</span>
                <span className="text-lg font-black text-emerald-400">₹{calculatedGross.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Total Deductions</span>
                <span className="text-lg font-black text-rose-400">-₹{calculatedDeductions.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Net Disbursed</span>
                <span className="text-xl font-black text-cyan-400">₹{calculatedNet.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCreateSalarySlip("DRAFT")}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-xl transition cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCreateSalarySlip("PUBLISHED")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                {submitting ? "Processing..." : "Generate & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
