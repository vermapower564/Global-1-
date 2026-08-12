"use client";

import React, { useState, useEffect } from "react";
import CustomerCareModal from "@/components/CustomerCareModal";
import { exportToCSV } from "@/utils/exportEngine";
import { IconBuilding, IconZap, IconFileText, IconEye } from "@/components/Icons";

export interface ClientWorkItem {
  taskName: string;
  assignedUser: string;
  status: "COMPLETED" | "PENDING";
  dueDate: string;
}

export interface ClientPaymentRecord {
  billNo: string;
  date: string;
  amount: number;
  mode: string;
  status: "PAID" | "PENDING";
}

export interface ClientItem {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  totalBilled: number;
  assignedTeam: string[]; // List of employee users working on this client
  documents?: string[];
  workItems: ClientWorkItem[]; // Active & Completed Work Tasks
  paymentHistory: ClientPaymentRecord[]; // Complete Payment Ledger
  history?: { date: string; note: string }[];
}

const initialClients: ClientItem[] = [
  {
    id: "CLI-1001",
    companyName: "Acme Logistics Corp",
    contactPerson: "Alice Smith (VP Ops)",
    email: "alice@acme.com",
    phone: "+91 98765 11122",
    industry: "Logistics & Supply Chain",
    totalBilled: 2500000,
    assignedTeam: ["Roushan Verma (Tech Lead)", "Aditya Raj (Fullstack Dev)", "Sneha Reddy (Marketing)"],
    documents: [
      "Master Service Agreement (SLA).pdf",
      "Non-Disclosure Agreement (NDA).pdf",
      "GST Billing Invoice #INV-2026-089.pdf",
    ],
    workItems: [
      { taskName: "API Gateway Integration & Fleet Tracking Dashboard", assignedUser: "Roushan Verma", status: "COMPLETED", dueDate: "2026-08-01" },
      { taskName: "Automated WhatsApp Logistics Notification System", assignedUser: "Aditya Raj", status: "COMPLETED", dueDate: "2026-08-05" },
      { taskName: "Q3 Meta B2B Lead Acquisition Campaign", assignedUser: "Sneha Reddy", status: "PENDING", dueDate: "2026-08-25" },
    ],
    paymentHistory: [
      { billNo: "PAY-2026-001", date: "2026-08-01", amount: 1500000, mode: "Bank NEFT Transfer", status: "PAID" },
      { billNo: "PAY-2026-002", date: "2026-07-15", amount: 1000000, mode: "Corporate Cheque", status: "PAID" },
    ],
    history: [
      { date: "2026-08-03", note: "Quarterly performance review meeting completed successfully." },
      { date: "2026-07-28", note: "Invoice #INV-2026-089 issued for ₹4,50,000." },
    ],
  },
  {
    id: "CLI-1002",
    companyName: "TechNova SaaS Inc",
    contactPerson: "Bob Johnson (CTO)",
    email: "bob@technova.com",
    phone: "+91 98765 33344",
    industry: "SaaS & Cloud Software",
    totalBilled: 1800000,
    assignedTeam: ["Aarav Sharma (Senior Engineer)", "Priya Sharma (HR Coordinator)"],
    documents: [
      "Software Development Contract.pdf",
      "Data Processing Addendum (DPA).pdf",
    ],
    workItems: [
      { taskName: "AWS Cloud Infrastructure Migration Phase 1", assignedUser: "Aarav Sharma", status: "COMPLETED", dueDate: "2026-07-20" },
      { taskName: "Multi-Tenant OAuth Authentication Module", assignedUser: "Aarav Sharma", status: "PENDING", dueDate: "2026-08-18" },
    ],
    paymentHistory: [
      { billNo: "PAY-2026-003", date: "2026-08-02", amount: 1800000, mode: "Razorpay Corporate UPI", status: "PAID" },
    ],
    history: [
      { date: "2026-08-01", note: "Cloud Migration milestone 2 delivered ahead of schedule." },
    ],
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>(initialClients);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem>(initialClients[0]);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formCompany, setFormCompany] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("+91 98765 ");
  const [formIndustry, setFormIndustry] = useState("Enterprise Technology");
  const [formBilled, setFormBilled] = useState(1500000);

  // Fetch Clients from API -> Prisma -> XAMPP MySQL
  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data.length > 0) {
          const mapped = resData.data.map((item: any) => ({
            id: item.id,
            companyName: item.companyName,
            contactPerson: item.contactPerson,
            email: item.email,
            phone: item.phone,
            industry: item.industry,
            totalBilled: item.totalBilled,
            assignedTeam: ["Roushan Verma (Tech Lead)", "Aditya Raj (Dev)"],
            documents: ["Master Service Agreement (SLA).pdf", "NDA.pdf"],
            workItems: [
              { taskName: "Initial Onboarding & Scope Setup", assignedUser: "Roushan Verma", status: "COMPLETED", dueDate: "2026-08-01" },
            ],
            paymentHistory: [
              { billNo: `PAY-${Date.now().toString().slice(-4)}`, date: new Date().toISOString().split("T")[0], amount: item.totalBilled, mode: "Bank NEFT", status: "PAID" },
            ],
            history: [{ date: new Date().toISOString().split("T")[0], note: "Client account registered in OMS Database." }],
          }));
          setClients([...mapped, ...initialClients]);
        }
      })
      .catch(() => {});
  }, []);

  // Save Client -> POST /api/clients -> XAMPP MySQL
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formCompany,
          contactPerson: formContact,
          email: formEmail,
          phone: formPhone,
          industry: formIndustry,
          totalBilled: formBilled,
        }),
      });

      const resData = await response.json();

      const newRec: ClientItem = {
        id: resData.data?.id || `CLI-${Date.now().toString().slice(-4)}`,
        companyName: formCompany,
        contactPerson: formContact,
        email: formEmail,
        phone: formPhone,
        industry: formIndustry,
        totalBilled: formBilled,
        assignedTeam: ["Roushan Verma (Tech Lead)", "Aditya Raj (Dev)"],
        documents: ["Master Service Agreement (SLA).pdf"],
        workItems: [{ taskName: "Initial System Setup", assignedUser: "Aditya Raj", status: "PENDING", dueDate: "2026-08-30" }],
        paymentHistory: [{ billNo: `PAY-${Date.now().toString().slice(-4)}`, date: new Date().toISOString().split("T")[0], amount: formBilled, mode: "Bank NEFT", status: "PAID" }],
        history: [{ date: new Date().toISOString().split("T")[0], note: "New client registered via Form." }],
      };

      setClients([newRec, ...clients]);
      setSelectedClient(newRec);
      setShowForm(false);
      setToastMsg("✓ Client record saved to XAMPP MySQL database!");
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      alert("Error saving client: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const updatedDocs = [data.fileName, ...(selectedClient.documents || [])];
        const updatedClient = { ...selectedClient, documents: updatedDocs };
        setSelectedClient(updatedClient);
        setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
        setToastMsg(`✓ File "${data.fileName}" uploaded & attached!`);
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const completedTasks = selectedClient.workItems.filter((w) => w.status === "COMPLETED").length;
  const pendingTasks = selectedClient.workItems.filter((w) => w.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white font-extrabold text-xs p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Phase 3: Corporate Client Folder & Assigned User Work History
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Client Folder, Employee Work Tracking & Payment Ledger ({clients.length})
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Track assigned employee team members, completed vs pending work tasks, client billing history & contract SLAs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            + Register New Client
          </button>
          <button
            onClick={() => exportToCSV("Enterprise_Clients_Ledger", filteredClients)}
            className="btn-secondary text-xs"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-red-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Client Accounts</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{clients.length}</p>
          <span className="text-[11px] font-semibold text-red-600">Verified Corporate CRM</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Billed Volume</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            ₹{clients.reduce((acc, curr) => acc + curr.totalBilled, 0).toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600">Verified Revenue (₹)</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Work Deliverables</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {completedTasks} Done • {pendingTasks} Pending
          </p>
          <span className="text-[11px] font-semibold text-blue-600">Active Deliverables Progress</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Database Engine</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">XAMPP MySQL</p>
          <span className="text-[11px] font-semibold text-purple-600">Prisma Client Synced</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search by Client ID, company name or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:border-red-600 focus:outline-none shadow-xs font-semibold"
        />
      </div>

      {/* Client Master Directory & Interactive Client Folder Work Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 pro-card p-6 space-y-4">
          <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            Client Accounts Directory & Team Assignments
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Client ID</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Assigned Employee Users</th>
                  <th className="p-3">Total Billed</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredClients.map((client) => {
                  const displayId = client.id.length > 12 ? client.id.slice(0, 10) + "..." : client.id;
                  const isSelected = selectedClient.id === client.id;

                  return (
                    <tr key={client.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${isSelected ? "bg-red-50/40 dark:bg-slate-800" : ""}`}>
                      <td className="p-3">
                        <span className="font-mono text-xs font-extrabold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 px-2 py-1 rounded-md inline-block">
                          {displayId}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        {client.companyName}
                        <p className="text-[10px] text-slate-500 font-normal">{client.contactPerson}</p>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {client.assignedTeam.map((member, idx) => (
                            <span key={idx} className="inline-block text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded mr-1">
                              👤 {member}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        ₹{client.totalBilled.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="text-[11px] font-extrabold text-white bg-slate-900 dark:bg-slate-800 hover:bg-red-600 px-3 py-1.5 rounded-lg transition"
                        >
                          Open Folder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Client Work & Payment Folder Inspector */}
        <div className="pro-card p-6 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Client Folder Work Inspector</h2>
              <p className="text-xs text-slate-500">{selectedClient.companyName}</p>
            </div>
            <span className="font-mono text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded">
              {selectedClient.id.slice(0, 10)}
            </span>
          </div>

          {/* Assigned Team Members */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white block">Assigned Employee Users Working on Account:</span>
            <div className="space-y-1">
              {selectedClient.assignedTeam.map((user, idx) => (
                <div key={idx} className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>{user}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables Breakdown: Completed vs Pending Work */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Work Tasks Deliverables ({selectedClient.workItems.length}):
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {completedTasks} Done • {pendingTasks} Pending
              </span>
            </div>

            <div className="space-y-2">
              {selectedClient.workItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 dark:text-white leading-tight">{item.taskName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      item.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-900">
                    <span>Assigned User: <strong className="text-slate-700 dark:text-slate-300">{item.assignedUser}</strong></span>
                    <span className="font-mono">Due: {item.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Financial Payment Receipts Ledger */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Company Payment Receipt History (₹):</span>
            <div className="space-y-2">
              {selectedClient.paymentHistory.map((pay, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{pay.billNo}</span>
                    <p className="text-[10px] text-slate-500">{pay.date} • {pay.mode}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">₹{pay.amount.toLocaleString()}</span>
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase">{pay.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
