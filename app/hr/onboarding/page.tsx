"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconUsers, IconUserCheck, IconCalendar } from "@/components/Icons";

export default function HROnboardingPage() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [newEmployees, setNewEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    department: "Engineering & Development",
    role: "Software Developer",
    phone: "",
    employeeId: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      const [invRes, empRes] = await Promise.all([
        fetch("/api/invitations"),
        fetch("/api/employees"),
      ]);
      const invJson = await invRes.json();
      const empJson = await empRes.json();

      if (invJson.success && Array.isArray(invJson.data)) {
        setInvitations(invJson.data);
      }
      if (empJson.success && Array.isArray(empJson.data || empJson.employees)) {
        const allEmps = empJson.data || empJson.employees;
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600 * 1000);
        setNewEmployees(allEmps.filter((e: any) => e.joiningDate && new Date(e.joiningDate) >= sixtyDaysAgo));
      }
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Onboarding invitation dispatched to ${inviteForm.email}!`);
        setShowInviteModal(false);
        setInviteForm({
          name: "",
          email: "",
          department: "Engineering & Development",
          role: "Software Developer",
          phone: "",
          employeeId: "",
        });
        fetchOnboardingData();
      } else {
        alert(json.error || "Failed to dispatch invitation");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSending(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleResend = async (inv: any) => {
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inv.name,
          email: inv.email,
          department: inv.department,
          role: inv.role,
          phone: inv.phone,
          employeeId: inv.employeeId,
          resendToken: inv.token,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Invitation resent to ${inv.email}!`);
        fetchOnboardingData();
      }
    } catch (err) {}
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this onboarding token?")) return;
    try {
      await fetch(`/api/invitations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setToastMsg("✓ Invitation cancelled.");
      fetchOnboardingData();
    } catch (err) {}
    setTimeout(() => setToastMsg(null), 4000);
  };

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
            <span className="text-xs text-slate-400 font-bold">• Joinee Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>🚀</span> Joinee Onboarding & Invitation Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track active invitation tokens, onboarding document completion progress, and recent joiner integrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>✉️</span> + Invite Joinee
          </button>
          <Link
            href="/hr/join-qr"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📱</span> Company Join QR
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active Invitations</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
            {invitations.filter((i) => i.status === "INVITED").length} Pending
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Tokens awaiting registration</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Completed Registrations</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {invitations.filter((i) => i.status === "ACTIVE").length} Onboarded
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Accounts active in OMS</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-purple-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Recent Joinees (60 Days)</span>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">{newEmployees.length} Members</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Integrated into teams</p>
        </div>
      </div>

      {/* Table 1: Active Onboarding Invitations */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Candidate Invitation Tokens</h2>
            <p className="text-xs text-slate-400 font-medium">Secured email tokens allowing joinees to configure account passwords</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="text-xs font-black text-blue-600 hover:text-blue-700"
          >
            + Send New Token →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Candidate</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department & Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Expires Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Loading invitation ledger...
                  </td>
                </tr>
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No onboarding invitations dispatched yet. Click "+ Invite Joinee" to send one.
                  </td>
                </tr>
              ) : (
                invitations.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3">
                      <p className="font-black text-slate-900">{inv.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{inv.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{inv.employeeId || "Auto"}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{inv.department}</p>
                      <p className="text-[10px] text-slate-400">{inv.role}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          inv.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : inv.status === "INVITED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {inv.status === "INVITED" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResend(inv)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-700 font-black rounded-lg text-[11px] transition cursor-pointer"
                          >
                            🔄 Resend
                          </button>
                          <button
                            onClick={() => handleCancel(inv.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">✓ Onboarded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Recent Joiners Progress */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent New Joiners</h2>
          <p className="text-xs text-slate-400 font-medium">Workforce members onboarded within the last 60 days</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newEmployees.map((emp: any) => (
            <div
              key={emp.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 text-sm">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId} • {emp.email}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <p>🏢 Department: <span className="font-bold text-slate-800">{emp.department || "Engineering"}</span></p>
                <p>👔 Role: <span className="font-bold text-slate-800">{emp.role?.replace(/_/g, " ")}</span></p>
                <p>📅 Joined: <span className="font-mono font-bold text-blue-700">{emp.joiningDate ? new Date(emp.joiningDate).toISOString().split("T")[0] : "Recent"}</span></p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Documents: 3/3 Verified</span>
                <Link
                  href={`/hr/employees/${emp.id || emp.employeeId}`}
                  className="text-xs font-black text-blue-600 hover:text-blue-700"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Send Onboarding Invitation</h3>
                <p className="text-xs text-slate-400 font-medium">Dispatches email activation link to candidate.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 font-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Kumar"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Candidate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Department</label>
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Engineering & Development">Engineering & Development</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Sales & Growth">Sales & Growth</option>
                    <option value="Design & Creative">Design & Creative</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Role / Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Engineer"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? "Sending..." : "✉️ Send Invitation Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
