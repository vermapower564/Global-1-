"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { exportToCSV, generatePrintablePDF } from "@/utils/exportEngine";

export interface MonthlySalaryApproval {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  month: string;
  baseSalary: number;
  attendanceDays: number;
  overtimeBonus: number;
  deductions: number;
  netPayable: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "DISBURSED" | "REJECTED";
  bankAccount: string;
}

const initialMonthlySalaries: MonthlySalaryApproval[] = [
  {
    id: "SAL-2026-08-001",
    employeeId: "EMP001",
    name: "Roushan Verma",
    role: "Super Admin",
    department: "Executive Management",
    month: "August 2026",
    baseSalary: 150000,
    attendanceDays: 22,
    overtimeBonus: 5000,
    deductions: 12000,
    netPayable: 143000,
    status: "APPROVED",
    bankAccount: "HDFC0001234 • PAN: ABCDE1234F",
  },
  {
    id: "SAL-2026-08-002",
    employeeId: "EMP002",
    name: "Rajesh Verma",
    role: "Director",
    department: "Executive Management",
    month: "August 2026",
    baseSalary: 140000,
    attendanceDays: 22,
    overtimeBonus: 0,
    deductions: 11200,
    netPayable: 128800,
    status: "APPROVED",
    bankAccount: "ICIC0009876 • PAN: RJV123456K",
  },
  {
    id: "SAL-2026-08-003",
    employeeId: "EMP003",
    name: "Priya Sharma",
    role: "HR Operations Lead",
    department: "Human Resources",
    month: "August 2026",
    baseSalary: 95000,
    attendanceDays: 21,
    overtimeBonus: 2500,
    deductions: 7600,
    netPayable: 89900,
    status: "PENDING_APPROVAL",
    bankAccount: "SBIN0005432 • PAN: PRY987654M",
  },
  {
    id: "SAL-2026-08-004",
    employeeId: "EMP004",
    name: "Amit Patel",
    role: "Finance Lead",
    department: "Accounts & Finance",
    month: "August 2026",
    baseSalary: 105000,
    attendanceDays: 22,
    overtimeBonus: 3000,
    deductions: 8400,
    netPayable: 99600,
    status: "PENDING_APPROVAL",
    bankAccount: "AXIS0008888 • PAN: AMT112233P",
  },
  {
    id: "SAL-2026-08-005",
    employeeId: "EMP005",
    name: "Vikram Malhotra",
    role: "Sales Manager",
    department: "Sales & CRM",
    month: "August 2026",
    baseSalary: 120000,
    attendanceDays: 22,
    overtimeBonus: 10000,
    deductions: 9600,
    netPayable: 120400,
    status: "PENDING_APPROVAL",
    bankAccount: "KOTAK0003333 • PAN: VKM998877L",
  },
];

export default function MonthlySalaryApprovalPage() {
  const [salaries, setSalaries] = useState<MonthlySalaryApproval[]>(initialMonthlySalaries);
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [deptFilter, setDeptFilter] = useState("All");

  const handleApproveSalary = (id: string) => {
    setSalaries(
      salaries.map((sal) => (sal.id === id ? { ...sal, status: "APPROVED" } : sal))
    );
  };

  const handleDisburseSalary = (id: string) => {
    setSalaries(
      salaries.map((sal) => (sal.id === id ? { ...sal, status: "DISBURSED" } : sal))
    );
  };

  const handleApproveAll = () => {
    setSalaries(
      salaries.map((sal) => ({ ...sal, status: "APPROVED" }))
    );
  };

  const filtered = salaries.filter((sal) => {
    const matchesMonth = sal.month === selectedMonth;
    const matchesDept = deptFilter === "All" || sal.department === deptFilter;
    return matchesMonth && matchesDept;
  });

  const totalGross = filtered.reduce((acc, s) => acc + s.baseSalary + s.overtimeBonus, 0);
  const totalDeductions = filtered.reduce((acc, s) => acc + s.deductions, 0);
  const totalNet = filtered.reduce((acc, s) => acc + s.netPayable, 0);
  const pendingCount = filtered.filter((s) => s.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-emerald p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Finance / Payroll / Approvals
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            Monthly Salary Approval & Disbursement Desk
          </h1>
          <p className="text-xs text-emerald-100 mt-1">
            Authorize monthly employee salary payouts, calculate attendance & bonus adjustments, and disburse via direct bank transfer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleApproveAll}
            className="bg-white text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-md hover:bg-slate-100 transition"
          >
            ✓ Approve All Pending Salaries
          </button>
          <button
            onClick={() => generatePrintablePDF("Monthly_Salary_Approval_Sheet")}
            className="bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md hover:bg-emerald-800 transition"
          >
            🖨️ Print Payslips Sheet
          </button>
          <button
            onClick={() => exportToCSV("Monthly_Salary_Payroll_Approvals", filtered)}
            className="bg-emerald-950 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-emerald-700 transition"
          >
            📄 Export Payroll CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Cards with ₹ Rupee Symbol */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Monthly Gross</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalGross.toLocaleString()}</p>
          <span className="text-[11px] font-semibold text-emerald-600">Base Salary + Overtime</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Taxes & Deductions</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalDeductions.toLocaleString()}</p>
          <span className="text-[11px] font-semibold text-rose-600">TDS & PF Withholding</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Net Payable</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalNet.toLocaleString()}</p>
          <span className="text-[11px] font-semibold text-blue-600">Bank Transfer Amount</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Pending Approvals</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{pendingCount} Salaries</p>
          <span className="text-[11px] font-semibold text-amber-600">Requires Executive Sign-Off</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Select Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white font-bold text-slate-800 focus:outline-none"
          >
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="June 2026">June 2026</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filter Department:</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Executive Management">Executive Management</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Accounts & Finance">Accounts & Finance</option>
            <option value="Sales & CRM">Sales & CRM</option>
          </select>
        </div>
      </div>

      {/* Monthly Salary Approval Table */}
      <div className="pro-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-base">
            Employee Monthly Salary Approval & Bank Transfer Ledger
          </h2>
          <span className="text-xs text-slate-400">Total {filtered.length} Employee Records</span>
        </div>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Salary ID</th>
                <th>Employee</th>
                <th>Department & Role</th>
                <th>Base Salary</th>
                <th>Overtime</th>
                <th>Deductions</th>
                <th>Net Payable</th>
                <th>Bank Account</th>
                <th>Approval Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sal) => (
                <tr key={sal.id}>
                  <td className="font-mono text-xs font-bold text-slate-600">{sal.id}</td>
                  <td>
                    <p className="font-bold text-slate-900">{sal.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{sal.employeeId}</p>
                  </td>
                  <td>
                    <p className="font-semibold text-slate-800">{sal.role}</p>
                    <p className="text-xs text-slate-500">{typeof sal.department === "object" ? (sal.department as any)?.name : sal.department}</p>
                  </td>
                  <td className="font-mono text-xs font-semibold text-slate-800">
                    ₹{sal.baseSalary.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-emerald-600 font-semibold">
                    +₹{sal.overtimeBonus.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-rose-600 font-semibold">
                    -₹{sal.deductions.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs font-extrabold text-emerald-700">
                    ₹{sal.netPayable.toLocaleString()}
                  </td>
                  <td className="font-mono text-[10px] text-slate-500">{sal.bankAccount}</td>
                  <td>
                    <span
                      className={`badge ${
                        sal.status === "DISBURSED"
                          ? "badge-success"
                          : sal.status === "APPROVED"
                          ? "badge-info"
                          : sal.status === "PENDING_APPROVAL"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {sal.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {sal.status === "PENDING_APPROVAL" && (
                        <button
                          onClick={() => handleApproveSalary(sal.id)}
                          className="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {sal.status === "APPROVED" && (
                        <button
                          onClick={() => handleDisburseSalary(sal.id)}
                          className="text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition"
                        >
                          🏦 Disburse
                        </button>
                      )}
                      {sal.status === "DISBURSED" && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          Paid ✓
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
