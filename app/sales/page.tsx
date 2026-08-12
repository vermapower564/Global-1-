"use client";

import React, { useState } from "react";
import { exportToCSV } from "@/utils/exportEngine";

const initialDeals = [
  {
    id: "DEAL-501",
    clientName: "Acme Logistics Corp",
    contactPerson: "Alice Smith (VP Ops)",
    dealValue: 850000,
    stage: "WON",
    assignedExec: "Vikram Malhotra (Sales Manager)",
    lastActivity: "Quotation #Q-401 approved by client CFO. Contract signed.",
    callsMade: 12,
    visits: 2,
  },
  {
    id: "DEAL-502",
    clientName: "TechNova SaaS Inc",
    contactPerson: "Bob Johnson (CTO)",
    dealValue: 600000,
    stage: "PROPOSAL_SENT",
    assignedExec: "Sneha Reddy (Digital Marketing Manager)",
    lastActivity: "Quotation #Q-402 sent via corporate email. Follow-up scheduled.",
    callsMade: 8,
    visits: 1,
  },
  {
    id: "DEAL-503",
    clientName: "Global Health Systems",
    contactPerson: "Charlie Lee (Director)",
    dealValue: 1200000,
    stage: "NEGOTIATION",
    assignedExec: "Vikram Malhotra (Sales Manager)",
    lastActivity: "On-site requirement gathering & SLA negotiation meeting conducted.",
    callsMade: 15,
    visits: 3,
  },
  {
    id: "DEAL-504",
    clientName: "Apex Solutions Ltd",
    contactPerson: "Diana Prince (Head of IT)",
    dealValue: 350000,
    stage: "LOST",
    assignedExec: "Roushan Verma (Super Admin)",
    lastActivity: "Client chose internal legacy vendor due to pre-existing agreement.",
    callsMade: 5,
    visits: 1,
  },
];

export default function SalesPage() {
  const [deals, setDeals] = useState(initialDeals);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [newQuotation, setNewQuotation] = useState({
    clientName: "",
    dealValue: 500000,
    assignedExec: "Vikram Malhotra (Sales Manager)",
    notes: "",
  });

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `DEAL-${deals.length + 501}`;
    setDeals([
      {
        id,
        clientName: newQuotation.clientName,
        contactPerson: "Primary Contact",
        dealValue: newQuotation.dealValue,
        stage: "PROPOSAL_SENT",
        assignedExec: newQuotation.assignedExec,
        lastActivity: `Quotation generated: ${newQuotation.notes || "Proposal sent to client"}`,
        callsMade: 1,
        visits: 0,
      },
      ...deals,
    ]);
    setShowQuotationModal(false);
    setNewQuotation({ clientName: "", dealValue: 500000, assignedExec: "Vikram Malhotra (Sales Manager)", notes: "" });
  };

  const totalWon = deals.filter((d) => d.stage === "WON").reduce((sum, d) => sum + d.dealValue, 0);
  const totalPipeline = deals.reduce((sum, d) => sum + d.dealValue, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 🧡 Unique Header Banner - Crimson Sunset & Terracotta Amber Mix Theme */}
      <div className="bg-gradient-to-r from-rose-950 via-amber-950 to-stone-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-rose-900/40 text-amber-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
            Sales Pipeline & Revenue Funnel
          </span>
          <h1 className="text-2xl font-black text-amber-100 tracking-tight mt-1">
            Sales CRM & Quotations Engine ({deals.length})
          </h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Track closed won deals, active proposals, cash collections in ₹ Indian Rupees, and team activity logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowQuotationModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md border border-amber-400 transition"
          >
            + Generate Proposal
          </button>
          <button
            onClick={() => exportToCSV("Sales_Deals_Pipeline", deals)}
            className="bg-rose-950/70 hover:bg-rose-900/80 text-amber-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-rose-800/40 transition"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-amber-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Closed Won Revenue</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalWon.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Verified Cash Inflow</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-rose-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Total Pipeline Value</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalPipeline.toLocaleString()}</p>
          <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">{deals.length} Active Deals</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Daily Sales Activity</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">38 Calls • 4 Visits</p>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400">High Outreach Volume</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-amber-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Today&apos;s Collections</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹4,50,000</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Payments Received</span>
        </div>
      </div>

      {/* Sales Deals Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-rose-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-rose-900/30 pb-3">
          Sales Deals Directory & Stage Pipeline
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-rose-900/30 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-950/10 dark:bg-rose-950/60 text-amber-950 dark:text-amber-200 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Deal ID</th>
                <th className="p-3">Client Company</th>
                <th className="p-3">Primary Contact</th>
                <th className="p-3">Deal Value</th>
                <th className="p-3">Assigned Sales Executive</th>
                <th className="p-3">Pipeline Stage</th>
                <th className="p-3">Latest Activity Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-rose-900/30 bg-white dark:bg-slate-900">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-rose-950/5 dark:hover:bg-rose-950/30 transition">
                  <td className="p-3">
                    <span className="font-mono text-xs font-extrabold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-1 rounded">
                      {d.id}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-slate-900 dark:text-amber-100">{d.clientName}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-amber-200">{d.contactPerson}</td>
                  <td className="p-3 font-mono text-xs font-extrabold text-amber-700 dark:text-amber-400">
                    ₹{d.dealValue.toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-amber-200">{d.assignedExec}</td>
                  <td className="p-3 font-bold">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] ${
                        d.stage === "WON"
                          ? "bg-amber-900 text-amber-100 border border-amber-700"
                          : d.stage === "PROPOSAL_SENT"
                          ? "bg-rose-900 text-rose-100 border border-rose-700"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {d.stage.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-amber-200/70 max-w-xs">{d.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
