"use client";

import { useState } from "react";
import { exportToCSV, generatePrintablePDF } from "@/utils/exportEngine";

const initialInvoices = [
  { id: "INV-2026-001", client: "Acme Logistics Corp", amount: 24500, gstTax: 4410, totalWithGst: 28910, date: "2026-08-01", status: "Paid", category: "Enterprise Retainer" },
  { id: "INV-2026-002", client: "TechNova SaaS Inc", amount: 18200, gstTax: 3276, totalWithGst: 21476, date: "2026-08-02", status: "Pending", category: "Cloud Migration" },
  { id: "INV-2026-003", client: "Global Health Systems", amount: 9800, gstTax: 1764, totalWithGst: 11564, date: "2026-07-28", status: "Overdue", category: "Consulting & Audit" },
  { id: "INV-2026-004", client: "Apex Solutions", amount: 32000, gstTax: 5760, totalWithGst: 37760, date: "2026-07-25", status: "Paid", category: "Custom ERP Development" },
];

const categorizedExpenses = [
  { id: "EXP-101", title: "AWS & GCP Cloud Server Infrastructure", category: "Cloud Hosting", amount: 12500, vendor: "Amazon Web Services", date: "2026-08-01" },
  { id: "AST-102", title: "Corporate Office HQ Lease Payment", category: "Office Operations", amount: 18000, vendor: "Commercial Real Estate Ltd", date: "2026-08-01" },
  { id: "EXP-103", title: "SaaS Subscriptions (GitHub, Figma, Slack)", category: "Software Licenses", amount: 4800, vendor: "SaaS Vendors Inc", date: "2026-08-02" },
];

export default function FinancePage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInv, setNewInv] = useState({
    client: "",
    amount: 15000,
    category: "Consulting Services",
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const gstTax = newInv.amount * 0.18;
    const totalWithGst = newInv.amount + gstTax;
    const id = `INV-2026-00${invoices.length + 1}`;
    const today = new Date().toISOString().split("T")[0];

    setInvoices([
      {
        id,
        client: newInv.client,
        amount: newInv.amount,
        gstTax,
        totalWithGst,
        date: today,
        status: "Pending",
        category: newInv.category,
      },
      ...invoices,
    ]);

    setShowAddInvoice(false);
    setNewInv({ client: "", amount: 15000, category: "Consulting Services" });
  };

  const totalRevenue = invoices.filter((i) => i.status === "Paid").reduce((acc, i) => acc + i.amount, 0);
  const totalGstCollected = invoices.filter((i) => i.status === "Paid").reduce((acc, i) => acc + i.gstTax, 0);
  const totalExpenses = categorizedExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 💙 Unique Header Banner - Deep Sapphire & Royal Ocean Blue Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-cyan-800/40 text-cyan-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
            Corporate Treasury & Accounting Engine
          </span>
          <h1 className="text-2xl font-black text-cyan-100 tracking-tight mt-1">Financial Analytics & Dynamic Invoicing</h1>
          <p className="text-xs text-cyan-200/80 mt-1">
            Real-time income/expense tracking, 18% GST tax breakdown, cash flow forecasts, and printable PDF invoices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowAddInvoice(!showAddInvoice)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md border border-cyan-400 transition">
            + Generate Invoice
          </button>
          <button onClick={() => generatePrintablePDF("Financial_Ledger")} className="bg-slate-900 hover:bg-black text-cyan-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-cyan-800/50 transition">
            🖨️ Print PDF
          </button>
          <button onClick={() => exportToCSV("Corporate_Invoices", invoices)} className="bg-cyan-950 hover:bg-slate-900 text-cyan-300 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-cyan-800/50 transition">
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-cyan-600 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-cyan-300/80 uppercase">Paid Revenue (Net)</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400">Collected Inflow</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-cyan-300/80 uppercase">18% GST Tax Collected</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalGstCollected.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">Tax Breakdown</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-rose-500 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-cyan-300/80 uppercase">Categorized Expenses</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalExpenses.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">Cloud & Ops Expense</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-teal-500 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-cyan-300/80 uppercase">Cash Flow Net Profit</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{netProfit.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400">Net Margin</span>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-cyan-900/40 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-cyan-900/30 pb-3">
          <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Corporate Invoices & GST Tax Breakdown</h2>
          <span className="text-xs font-bold text-slate-500 dark:text-cyan-300/80">Total {invoices.length} Invoices Listed</span>
        </div>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Client Account</th>
                <th>Category</th>
                <th>Base Amount</th>
                <th>18% GST Tax</th>
                <th>Total Payable</th>
                <th>Billing Date</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-cyan-950/10 transition">
                  <td className="font-mono text-xs font-extrabold text-cyan-700 dark:text-cyan-400">{inv.id}</td>
                  <td className="font-bold text-slate-900 dark:text-white">{inv.client}</td>
                  <td className="text-slate-500 dark:text-slate-400">{inv.category}</td>
                  <td className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">₹{inv.amount.toLocaleString()}</td>
                  <td className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">₹{inv.gstTax.toLocaleString()}</td>
                  <td className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₹{inv.totalWithGst.toLocaleString()}</td>
                  <td className="font-mono text-xs text-slate-600 dark:text-slate-400">{inv.date}</td>
                  <td>
                    <span className={`badge ${inv.status === "Paid" ? "badge-success" : "badge-warning"}`}>
                      {inv.status}
                    </span>
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