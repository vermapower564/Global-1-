"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredLeaveRequests, updateLeaveStatus, LeaveRequest } from "@/utils/leaveStore";
import LeaveLetterModal from "@/components/LeaveLetterModal";
import EmailDispatchModal from "@/components/EmailDispatchModal";
import { IconFileEdit, IconCoins, IconFileText } from "@/components/Icons";

const candidatesList = [
  { id: "CAN-101", name: "Aarav Sharma", role: "Senior Full Stack Dev", round: "Offer Sent", status: "Offer Accepted", date: "2026-08-01" },
  { id: "CAN-102", name: "Ananya Roy", role: "UI/UX Designer", round: "Technical Round", status: "In Evaluation", date: "2026-08-03" },
  { id: "CAN-103", name: "Karan Gupta", role: "Sales Executive", round: "HR Final Round", status: "Scheduled", date: "2026-08-04" },
];

const companyAssets = [
  { id: "AST-801", name: "Apple MacBook Pro M3 Max 16\"", allocatedTo: "Roushan Verma (EMP-001)", category: "Laptop", serial: "C02G1234MD6R", status: "Assigned" },
  { id: "AST-802", name: "Dell XPS 15 4K Touch", allocatedTo: "Priya Sharma (EMP-002)", category: "Laptop", serial: "DLXPS987654", status: "Assigned" },
  { id: "AST-803", name: "Sony FX6 Camera Body + 24-70mm GM", allocatedTo: "Rahul Sharma (EMP-005)", category: "Media Gear", serial: "SNYFX6-9921", status: "Assigned" },
  { id: "AST-804", name: "iPad Pro 12.9\" M2 Test Device", allocatedTo: "Ananya Roy (EMP-006)", category: "Mobile Device", serial: "IPD129-4411", status: "Assigned" },
];

export default function HRPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);

  // Onboarding Invitations State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    department: "Development & Engineering",
    role: "Software Developer",
    phone: "9876543210",
    employeeId: "",
  });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Email Dispatch Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAction, setEmailAction] = useState<"Approved" | "Rejected" | null>(null);

  const fetchInvitations = () => {
    fetch("/api/invitations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvitations(data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setRequests(getStoredLeaveRequests());
    fetchInvitations();
  }, []);

  const handleApprove = (id: string) => {
    const updated = updateLeaveStatus(id, "Approved");
    setRequests(updated);
    const target = updated.find((r) => r.id === id) || null;
    setSelectedRequest(target);
    setShowLetterModal(false);
    setEmailAction("Approved");
    setShowEmailModal(true);
  };

  const handleReject = (id: string) => {
    const updated = updateLeaveStatus(id, "Rejected");
    setRequests(updated);
    const target = updated.find((r) => r.id === id) || null;
    setSelectedRequest(target);
    setShowLetterModal(false);
    setEmailAction("Rejected");
    setShowEmailModal(true);
  };

  // HR Sends Onboarding Invitation Email
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingInvite(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();

      if (data.success) {
        setToastMsg(`✓ Onboarding invitation email dispatched to ${inviteForm.email}!`);
        setShowInviteModal(false);
        setInviteForm({
          name: "",
          email: "",
          department: "Development & Engineering",
          role: "Software Developer",
          phone: "9876543210",
          employeeId: "",
        });
        fetchInvitations();
      } else {
        alert(`❌ Invitation Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error sending invitation: ${err.message}`);
    } finally {
      setIsSendingInvite(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Resend Invitation
  const handleResendInvitation = async (inv: any) => {
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
      const data = await res.json();
      if (data.success) {
        setToastMsg(`✓ Invitation resent to ${inv.email}! Old link invalidated.`);
        fetchInvitations();
      }
    } catch (err) {}
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Cancel Invitation
  const handleCancelInvitation = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this onboarding invitation token?")) return;
    try {
      await fetch(`/api/invitations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setToastMsg("✓ Invitation token cancelled successfully.");
      fetchInvitations();
    } catch (err) {}
    setTimeout(() => setToastMsg(null), 5000);
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-semibold text-xs p-4 rounded-xl shadow-md border border-slate-800 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-purple p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-purple-900">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Phase 4: HR, Recruitment & Onboarding</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-white">HR Suite, Employee Onboarding & Assets Hub</h1>
          <p className="text-xs text-purple-100 mt-1">
            Secure joinee token invitations, Nodemailer emails, ATS recruitment, IT assets, and formal leave approvals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            ✉️ Send Onboarding Invitation
          </button>
          <Link
            href="/hr/join-qr"
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            📱 Company Join QR Code
          </Link>
          <Link href="/leave/apply" className="bg-white text-purple-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-md hover:bg-slate-100 transition flex items-center gap-1.5">
            <IconFileEdit className="h-4 w-4" /> Apply For Leave
          </Link>
        </div>
      </div>

      {/* Primary HR KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="pro-card p-4 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Headcount</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">128 Members</p>
        </div>
        <div className="pro-card p-4 text-center border-l-4 border-l-blue-500">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Joinee Invitations</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{invitations.filter(i => i.status === "INVITED").length} Pending</p>
        </div>
        <div className="pro-card p-4 text-center border-l-4 border-l-amber-500">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending HR Review</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount} Applications</p>
        </div>
        <div className="pro-card p-4 text-center border-l-4 border-l-purple-600">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Tracked IT Assets</span>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{companyAssets.length} Devices</p>
        </div>
      </div>

      {/* ✉️ EMPLOYEE ONBOARDING INVITATIONS TRACKER */}
      <div className="pro-card p-6 space-y-4 border-l-4 border-l-blue-600">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Secure Joinee Onboarding Invitations</h2>
            <p className="text-xs text-slate-500">Track tokens sent via Nodemailer SMTP for candidate account setup.</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
          >
            + Invite New Employee
          </button>
        </div>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Joinee Name & Email</th>
                <th>Department & Role</th>
                <th>Invitation Status</th>
                <th>Expires Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                    No onboarding invitations dispatched yet. Click "+ Invite New Employee" to send one.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs font-bold text-blue-600">{inv.employeeId}</td>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-white">{inv.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{inv.email}</p>
                    </td>
                    <td>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{inv.department}</p>
                      <p className="text-[11px] text-slate-500">{inv.role}</p>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inv.status === "ACTIVE"
                            ? "badge-success"
                            : inv.status === "INVITED"
                            ? "badge-info"
                            : inv.status === "EXPIRED"
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {new Date(inv.expiresAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {inv.status !== "ACTIVE" && inv.status !== "CANCELLED" && (
                          <>
                            <button
                              onClick={() => handleResendInvitation(inv)}
                              className="text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded"
                            >
                              🔄 Resend Email
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-[11px] font-bold text-rose-600 hover:underline bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded"
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        {inv.status === "ACTIVE" && (
                          <span className="text-[11px] font-bold text-emerald-600">✓ Account Active</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate ATS & Interview Pipeline */}
      <div className="pro-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">Candidate ATS & Recruitment Pipeline</h2>
          <span className="badge badge-purple">{candidatesList.length} Active Candidates</span>
        </div>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Candidate Name</th>
                <th>Applied Role</th>
                <th>Interview Round</th>
                <th>Recruitment Status</th>
                <th>Date Applied</th>
              </tr>
            </thead>
            <tbody>
              {candidatesList.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-semibold text-slate-600">{c.id}</td>
                  <td className="font-bold text-slate-900 dark:text-white">{c.name}</td>
                  <td className="text-xs text-slate-700 dark:text-slate-300">{c.role}</td>
                  <td>
                    <span className="badge badge-info">{c.round}</span>
                  </td>
                  <td>
                    <span className="badge badge-success">{c.status}</span>
                  </td>
                  <td className="font-mono text-xs text-slate-500">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Approval Panel */}
      <div className="pro-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">Leave Letters & HR Decision Desk</h2>
          <Link href="/leave/apply" className="text-xs font-bold text-purple-600 hover:underline">
            + Submit New Application
          </Link>
        </div>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Dates & Duration</th>
                <th>Leave Type & Justification</th>
                <th>Status</th>
                <th>HR Decision & Email</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                    No leave applications found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="font-mono text-xs font-semibold text-slate-600">{req.id}</td>
                    <td className="font-bold text-slate-900 dark:text-white">{req.employeeName}</td>
                    <td>{req.department}</td>
                    <td className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      <div>{req.startDate} to {req.endDate}</div>
                      <span className="text-[10px] text-blue-600 font-bold">({req.totalDays} {req.totalDays === 1 ? "Day" : "Days"})</span>
                    </td>
                    <td className="text-xs max-w-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{req.leaveType}</p>
                      <p className="text-slate-500 line-clamp-2">{req.reason}</p>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          req.status === "Approved"
                            ? "badge-success"
                            : req.status === "Pending"
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowLetterModal(true);
                          }}
                          className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded transition flex items-center gap-1"
                        >
                          <IconFileText className="h-3 w-3" /> View Letter
                        </button>

                        {req.status === "Pending" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✉️ HR CREATE INVITATION MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Send Onboarding Invitation Token</h3>
                <p className="text-xs text-slate-500">Dispatches Nodemailer SMTP activation link to joinee email.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Candidate Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="e.g. rahul@oms.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Department *</label>
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium"
                  >
                    <option value="Development & Engineering">Development & Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                    <option value="Growth & Sales">Growth & Sales</option>
                    <option value="UI/UX & Graphic Design">UI/UX & Graphic Design</option>
                    <option value="Camera & Video Production">Camera & Video Production</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Employee ID (Optional)</label>
                  <input
                    type="text"
                    value={inviteForm.employeeId}
                    onChange={(e) => setInviteForm({ ...inviteForm, employeeId: e.target.value })}
                    placeholder="Auto-generated if blank"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">10-Digit Mobile Phone</label>
                  <input
                    type="tel"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-200">
                🛡️ HR does not create the candidate's password. The invitation email will contain a secure token link allowing the joinee to set their own password.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded-lg border text-xs font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow-md"
                >
                  {isSendingInvite ? "Dispatching Email..." : "✉️ Dispatch Invitation Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Modals */}
      <LeaveLetterModal
        isOpen={showLetterModal}
        onClose={() => setShowLetterModal(false)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <EmailDispatchModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        request={selectedRequest}
        action={emailAction}
      />
    </div>
  );
}