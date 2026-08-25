"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { exportToCSV } from "@/utils/exportEngine";
import { getStoredWorkUpdates, EODWorkUpdate } from "@/utils/workUpdateStore";
import { getStoredAttendance, AttendanceRecord } from "@/utils/attendanceStore";

export interface MasterPaymentHistoryItem {
  id: string;
  type: "PAYROLL" | "CLIENT_INVOICE" | "VENDOR_PAYMENT" | "EXPENSE";
  recipientOrPayer: string;
  amount: number;
  date: string;
  paymentMode: string;
  status: "COMPLETED" | "PENDING";
  description: string;
}

const initialPaymentLedger: MasterPaymentHistoryItem[] = [
  {
    id: "PAY-2026-801",
    type: "PAYROLL",
    recipientOrPayer: "Roushan Verma (Tech Lead)",
    amount: 130000,
    date: "2026-08-01",
    paymentMode: "Direct Bank HDFC NEFT",
    status: "COMPLETED",
    description: "August 2026 Monthly Salary Payout + Performance Bonus",
  },
  {
    id: "PAY-2026-802",
    type: "CLIENT_INVOICE",
    recipientOrPayer: "Acme Logistics Corp (Client)",
    amount: 1500000,
    date: "2026-08-01",
    paymentMode: "Bank NEFT Transfer",
    status: "COMPLETED",
    description: "Milestone 1 Payment Receipt for API Integration",
  },
  {
    id: "PAY-2026-803",
    type: "PAYROLL",
    recipientOrPayer: "Priya Sharma (HR Lead)",
    amount: 96000,
    date: "2026-08-01",
    paymentMode: "Direct Bank ICICI",
    status: "COMPLETED",
    description: "August 2026 Monthly Salary Payout",
  },
  {
    id: "PAY-2026-804",
    type: "VENDOR_PAYMENT",
    recipientOrPayer: "AWS Cloud Infrastructure India",
    amount: 45000,
    date: "2026-08-05",
    paymentMode: "Corporate Credit Card",
    status: "COMPLETED",
    description: "Monthly Production Cloud Server Hosting Invoice",
  },
  {
    id: "PAY-2026-805",
    type: "CLIENT_INVOICE",
    recipientOrPayer: "TechNova SaaS Inc (Client)",
    amount: 1800000,
    date: "2026-08-02",
    paymentMode: "Razorpay Corporate UPI",
    status: "COMPLETED",
    description: "Full Cloud Migration Contract Payment Receipt",
  },
];

export default function MasterHistoryPage() {
  const [activeTab, setActiveTab] = useState<"client_work" | "attendance" | "payments">("client_work");
  const [workUpdates, setWorkUpdates] = useState<EODWorkUpdate[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<MasterPaymentHistoryItem[]>(initialPaymentLedger);
  const [selectedPaymentModal, setSelectedPaymentModal] = useState<MasterPaymentHistoryItem | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setWorkUpdates(getStoredWorkUpdates());
    setAttendanceLogs(getStoredAttendance());
  }, []);

  const filteredWork = workUpdates.filter(
    (w) =>
      w.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      w.projectName.toLowerCase().includes(search.toLowerCase()) ||
      w.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAttendance = attendanceLogs.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPayments = payments.filter(
    (p) =>
      p.recipientOrPayer.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 rounded-none">
      {/* 📌 Executive Professional Header (Sharp Edges, Solid Neutral Dark Background) */}
      <div className="bg-slate-900 text-white p-6 border border-slate-800 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            ENTERPRISE AUDIT LEDGER / UNRESTRICTED MASTER HISTORY
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Master Audit & Complete Activity History Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspect all client work deliverables, employee entry/exit timestamps, and company payment transactions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/finance/payroll/billing"
            className="bg-slate-100 hover:bg-white text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-none border border-slate-300 transition"
          >
            Admin Salary Bill Desk
          </Link>
          <button
            onClick={() => exportToCSV(`Master_History_${activeTab}`, activeTab === "client_work" ? filteredWork : activeTab === "attendance" ? filteredAttendance : filteredPayments)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-none border border-slate-700 transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* 📌 Sharp Monochrome KPI Overview Cards (No Curve Radius, No Color Background) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-5 rounded-none">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">WORK LOGS VAULT</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{workUpdates.length} Reports</p>
          <span className="text-[11px] font-mono text-slate-500">Permanent Record</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-5 rounded-none">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">ENTRY / EXIT LOGS</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{attendanceLogs.length} Shifts</p>
          <span className="text-[11px] font-mono text-slate-500">Time Clock Verified</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-5 rounded-none">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">TOTAL COMPANY PAYMENTS</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            ₹{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </p>
          <span className="text-[11px] font-mono text-slate-500">Verified Ledger (₹)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-5 rounded-none">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">DATABASE BACKEND</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">XAMPP MySQL</p>
          <span className="text-[11px] font-mono text-slate-500">Unrestricted Retention</span>
        </div>
      </div>

      {/* 📌 Sharp Tab Switcher & Search Bar (No Curves, No Saturated Colors) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("client_work")}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-none border transition ${
              activeTab === "client_work"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            Client Work & Tasks History
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-none border transition ${
              activeTab === "attendance"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            Employee Entry / Exit Time History
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-none border transition ${
              activeTab === "payments"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            Company Payment & Billing Ledger
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search history records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-slate-900 focus:outline-none font-semibold"
          />
        </div>
      </div>

      {/* 📌 TAB 1: Client Work & Deliverables History (Sharp Rectangular Table) */}
      {activeTab === "client_work" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-none space-y-4">
          <h2 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
            Client Folder Work History & Employee Assignments
          </h2>
          <div className="overflow-x-auto border border-slate-300 dark:border-slate-800 rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Log ID</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Working Employee User</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Client & Project Name</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Hours Worked</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Work Deliverables Description</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredWork.map((w, idx) => (
                  <tr key={`${w.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {w.id}
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">
                      {w.employeeName}
                      <p className="text-[10px] text-slate-500 font-normal">{typeof w.department === "object" ? (w.department as any)?.name : w.department}</p>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">
                      {w.clientName}
                      <p className="text-[10px] text-slate-500 font-normal">{w.projectName}</p>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-200">{w.hoursWorked} hrs</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 max-w-xs">{w.description}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold">
                      <span className="px-2 py-0.5 border border-slate-400 text-slate-900 dark:text-slate-200 rounded-none text-[10px] font-mono font-bold uppercase">
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-400">{w.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📌 TAB 2: Employee Entry / Exit Time History (Sharp Rectangular Table) */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-none space-y-4">
          <h2 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
            Employee Entry (Check-In) & Exit (Check-Out) Time History
          </h2>
          <div className="overflow-x-auto border border-slate-300 dark:border-slate-800 rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Employee ID</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Employee Name</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Department</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Entry (Check-In) Time</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Exit (Check-Out) Time</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Total Working Hours</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Status</th>
                  <th className="p-3">Shift Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredAttendance.map((a, idx) => (
                  <tr key={`${a.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono font-extrabold text-slate-900 dark:text-white">{a.employeeId}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">{a.name}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-300">{typeof a.department === "object" ? (a.department as any)?.name : a.department}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white">Check-In: {a.checkIn}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white">Check-Out: {a.checkOut}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono font-extrabold text-slate-900 dark:text-white">{a.hours}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold">
                      <span className="border border-slate-400 text-slate-900 dark:text-slate-200 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-400">{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📌 TAB 3: Company Payment & Billing Ledger (Sharp Rectangular Table) */}
      {activeTab === "payments" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-none space-y-4">
          <h2 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
            Company Payment & Financial Transaction History (₹)
          </h2>
          <div className="overflow-x-auto border border-slate-300 dark:border-slate-800 rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Payment Bill ID</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Transaction Type</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Recipient / Payer Name</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Amount (₹)</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Payment Mode</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Description Note</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      {p.id}
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-extrabold">
                      <span className="border border-slate-400 text-slate-900 dark:text-slate-200 px-2 py-0.5 rounded-none text-[10px] font-mono uppercase">
                        {p.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">{p.recipientOrPayer}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-300">{p.paymentMode}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 max-w-xs">{p.description}</td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-400">{p.date}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedPaymentModal(p)}
                        className="text-[11px] font-extrabold text-slate-900 dark:text-white hover:underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-none border border-slate-400 dark:border-slate-700"
                      >
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📜 OFFICIAL CORPORATE PAYMENT SLIP VOUCHER (Sharp Rectangular Borders, Professional Monochrome) */}
      {selectedPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-none flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-none p-8 max-w-2xl w-full shadow-none space-y-6 border-2 border-slate-900 print:border-none">
            {/* Header / Corporate Identity */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                  OMS Enterprise Global Pvt. Ltd.
                </h2>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  DLF Cyber City, Tower B, Phase 2, Gurugram, India • CIN: L72200HR2026PTC099128
                </p>
              </div>
              <div className="text-right">
                <span className="bg-slate-900 text-white font-mono text-xs px-3 py-1 font-extrabold rounded-none inline-block uppercase">
                  OFFICIAL PAYMENT SLIP
                </span>
                <p className="text-xs font-mono font-extrabold text-slate-900 mt-1">
                  {selectedPaymentModal.id}
                </p>
                <p className="text-[10px] text-slate-600 font-semibold">
                  Date: {selectedPaymentModal.date}
                </p>
              </div>
            </div>

            {/* Transaction Details Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-300 rounded-none text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Recipient / Payer Name</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedPaymentModal.recipientOrPayer}</p>
                <p className="text-slate-700 font-medium">Type: {selectedPaymentModal.type.replace("_", " ")}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Payment Transfer Details</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">₹{selectedPaymentModal.amount.toLocaleString()}</p>
                <p className="text-slate-700 font-medium text-[11px] mt-1">Mode: {selectedPaymentModal.paymentMode}</p>
              </div>
            </div>

            {/* Itemized Payment Note Table */}
            <div className="border border-slate-900 rounded-none overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="p-3 border-r border-slate-700">Transaction Description Note</th>
                    <th className="p-3 text-right">Net Amount Dispatched (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 border-r border-slate-300">{selectedPaymentModal.description}</td>
                    <td className="p-3 font-mono text-right font-extrabold text-slate-900 text-sm">
                      ₹{selectedPaymentModal.amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-extrabold text-slate-900 text-sm border-t border-slate-900">
                    <td className="p-3 border-r border-slate-300">TOTAL VERIFIED DISPATCHED AMOUNT (₹)</td>
                    <td className="p-3 text-right font-mono text-base text-slate-900">
                      ₹{selectedPaymentModal.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verification Signatures */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-500 italic">
                  [Verified Digital Stamp]
                </div>
                <p className="font-extrabold text-slate-900 mt-1">Authorized HR Lead</p>
                <p className="text-[10px] text-slate-600">Priya Sharma</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-500 italic">
                  [Approved Finance Stamp]
                </div>
                <p className="font-extrabold text-slate-900 mt-1">Chief Finance Officer</p>
                <p className="text-[10px] text-slate-600">Amit Patel</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-500 italic">
                  [Received]
                </div>
                <p className="font-extrabold text-slate-900 mt-1">Recipient Acknowledgment</p>
                <p className="text-[10px] text-slate-600">{selectedPaymentModal.recipientOrPayer}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 print:hidden">
              <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-none border border-slate-900 transition">
                Print Payment Slip
              </button>
              <button onClick={() => setSelectedPaymentModal(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-none border border-slate-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
