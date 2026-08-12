"use client";

import React, { useState } from "react";
import Link from "next/link";
import { exportToCSV } from "@/utils/exportEngine";
import {
  IconFileText,
  IconCalendar,
  IconHistory,
  IconPhone,
  IconMail,
  IconFileEdit,
  IconEye,
} from "@/components/Icons";

export interface CompletedProjectHistory {
  id: string;
  projectTitle: string;
  clientCompany: string;
  clientContactPerson: string;
  clientEmail: string;
  clientPhone: string;
  completionDate: string;
  contractValue: number;
  assignedStaff: string;
  rating: number;
  lastContactedNote?: string;
  codeSnippet?: string;
}

const initialHistory: CompletedProjectHistory[] = [
  {
    id: "PRJ-HIS-001",
    projectTitle: "Enterprise ERP Cloud Migration & Mobile Portal",
    clientCompany: "Acme Enterprise Corp",
    clientContactPerson: "Sarah Jenkins (VP Operations)",
    clientEmail: "sarah.j@acmecorp.com",
    clientPhone: "+91 98765 11223",
    completionDate: "2026-07-28",
    contractValue: 1250000,
    assignedStaff: "Roushan Verma (Lead Architect)",
    rating: 5,
    lastContactedNote: "Sent Q3 maintenance check-in email on Aug 2.",
    codeSnippet: `// Acme ERP Cloud Migration Auth Middleware
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/utils/auth';

export async function middleware(req) {
  const token = req.cookies.get('oms_session')?.value;
  const user = await verifyJWT(token);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  return NextResponse.next();
}`,
  },
  {
    id: "PRJ-HIS-002",
    projectTitle: "Global Logistics Tracking & API Webhook Integration",
    clientCompany: "GlobalTech Shipping Solutions",
    clientContactPerson: "Mark Wood (CTO)",
    clientEmail: "mark.wood@globaltech.com",
    clientPhone: "+91 98765 44332",
    completionDate: "2026-07-10",
    contractValue: 850000,
    assignedStaff: "Aarav Sharma (Project Manager)",
    rating: 5,
    lastContactedNote: "Discussed Phase 2 Expansion proposal via phone call.",
    codeSnippet: `// GlobalTech GPS Webhook Event Listener
export async function POST(req: Request) {
  const payload = await req.json();
  const { shipmentId, latitude, longitude, status } = payload;
  await prisma.shipmentLog.update({
    where: { id: shipmentId },
    data: { currentLat: latitude, currentLng: longitude, status }
  });
  return NextResponse.json({ success: true });
}`,
  },
  {
    id: "PRJ-HIS-003",
    projectTitle: "Omnichannel E-Commerce & Payment Gateway Hub",
    clientCompany: "OmniRetail Digital Group",
    clientContactPerson: "Neha Kapoor (Head of Products)",
    clientEmail: "neha.k@omniretail.com",
    clientPhone: "+91 98765 88776",
    completionDate: "2026-06-25",
    contractValue: 950000,
    assignedStaff: "Sneha Reddy (Digital Lead)",
    rating: 5,
    lastContactedNote: "Completed 30-day post-launch review call.",
    codeSnippet: `// Razorpay / Stripe Payment Processing Route
export async function POST(req) {
  const { amount, currency, orderId } = await req.json();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'inr',
    metadata: { orderId }
  });
  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}`,
  },
  {
    id: "PRJ-HIS-004",
    projectTitle: "FinTech Automated Billing & Invoice Engine",
    clientCompany: "PaySwift Financial Services",
    clientContactPerson: "David Miller (Director)",
    clientEmail: "david@payswift.com",
    clientPhone: "+91 98765 99001",
    completionDate: "2026-06-12",
    contractValue: 1100000,
    assignedStaff: "Amit Patel (Finance Lead)",
    rating: 4,
    codeSnippet: `// GST 18% Automated Invoice Calculator
export function calculateGSTInvoice(subtotal: number) {
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const totalNet = subtotal + cgst + sgst;
  return { subtotal, cgst, sgst, totalNet };
}`,
  },
];

export default function ProjectHistoryPage() {
  const [historyList, setHistoryList] = useState<CompletedProjectHistory[]>(initialHistory);
  const [activeModalProject, setActiveModalProject] = useState<CompletedProjectHistory | null>(null);
  const [activeCodeModalProject, setActiveCodeModalProject] = useState<CompletedProjectHistory | null>(null);
  const [recontactNote, setRecontactNote] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSaveContactNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalProject || !recontactNote.trim()) return;

    const updated = historyList.map((item) =>
      item.id === activeModalProject.id
        ? { ...item, lastContactedNote: `${new Date().toLocaleDateString()}: ${recontactNote.trim()}` }
        : item
    );
    setHistoryList(updated);
    setActiveModalProject(null);
    setRecontactNote("");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const totalValue = historyList.reduce((acc, curr) => acc + curr.contractValue, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Projects / Completed Work History (Unrestricted History Vault)
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Completed Projects Directory & Code Inspection Portal ({historyList.length})
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Review completed staff project delivery logs without date cutoffs, inspect source code snippets, and log customer follow-ups.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/history"
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
          >
            🏛️ Master Enterprise History Vault
          </Link>
          <button
            onClick={() => exportToCSV("Completed_Projects_History", historyList)}
            className="btn-secondary text-xs"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Completed Projects Delivered</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{historyList.length} Delivered</p>
          <span className="text-[11px] font-semibold text-emerald-600">100% On-Time Completion</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-red-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue Delivered</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">₹{totalValue.toLocaleString()}</p>
          <span className="text-[11px] font-semibold text-red-600">Verified Contracts (₹)</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Average Client Rating</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">4.95 / 5.0 ★</p>
          <span className="text-[11px] font-semibold text-purple-600">High Satisfaction Score</span>
        </div>
      </div>

      {/* Completed Projects Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
          Completed Staff Projects History
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Project ID</th>
                <th className="p-3">Project Title & Code</th>
                <th className="p-3">Customer & Contact</th>
                <th className="p-3">Delivered Date</th>
                <th className="p-3">Contract Value</th>
                <th className="p-3">Staff Lead</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {historyList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{item.id}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900 dark:text-white">{item.projectTitle}</p>
                    <button
                      onClick={() => setActiveCodeModalProject(item)}
                      className="mt-1 text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 transition inline-flex items-center gap-1"
                    >
                      <IconEye className="h-3 w-3" /> Inspect Code
                    </button>
                  </td>
                  <td className="p-3">
                    <p className="font-extrabold text-slate-900 dark:text-white">{item.clientCompany}</p>
                    <p className="text-xs text-slate-500">{item.clientContactPerson}</p>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">{item.completionDate}</td>
                  <td className="p-3 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    ₹{item.contractValue.toLocaleString()}
                  </td>
                  <td className="p-3 text-xs font-semibold text-purple-700 dark:text-purple-400">{item.assignedStaff}</td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        setActiveModalProject(item);
                        setRecontactNote(item.lastContactedNote || "");
                      }}
                      className="text-[11px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded border border-purple-200 dark:border-purple-800 transition"
                    >
                      Log Contact Note
                    </button>
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
