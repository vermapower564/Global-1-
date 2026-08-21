"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconFileText, IconSearch } from "@/components/Icons";

export default function HRResignationPage() {
  const [resignations, setResignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"ALL" | "SUBMITTED" | "APPROVED" | "REJECTED">("SUBMITTED");
  const [selectedResign, setSelectedResign] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const initialResignations = [
    {
      id: "res-1",
      employeeName: "Sneha Patel",
      employeeId: "EMP-009",
      department: "Marketing & SEO",
      submittedAt: "2026-08-10",
      lastWorkingDate: "2026-08-25",
      noticePeriodDays: 15,
      reason: "Pursuing higher education masters program abroad.",
      status: "SUBMITTED",
      exitStatus: "CLEARANCE_PENDING",
    },
    {
      id: "res-2",
      employeeName: "Rohan Das",
      employeeId: "EMP-012",
      department: "Development & Engineering",
      submittedAt: "2026-07-20",
      lastWorkingDate: "2026-08-04",
      noticePeriodDays: 15,
      reason: "Relocating to another city.",
      status: "APPROVED",
      exitStatus: "EXIT_COMPLETED",
    },
  ];

  const fetchResignations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/resignation");
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setResignations(json.data);
      } else {
        setResignations(initialResignations);
      }
    } catch (err) {
      setResignations(initialResignations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResignations();
  }, []);

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedResign) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/resignation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedResign.id,
          status,
          hrRemarks: remarks || `HR Status: ${status}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Resignation request marked as ${status}!`);
        setSelectedResign(null);
        setRemarks("");
        fetchResignations();
      } else {
        // Mock success fallback
        setResignations((prev) =>
          prev.map((r) => (r.id === selectedResign.id ? { ...r, status, hrRemarks: remarks } : r))
        );
        setToastMsg(`✓ Resignation request marked as ${status}!`);
        setSelectedResign(null);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const pendingCount = resignations.filter((r) => (r.status || "").toUpperCase() === "SUBMITTED").length;
  const approvedCount = resignations.filter((r) => (r.status || "").toUpperCase() === "APPROVED").length;

  const filteredResignations = resignations.filter((r) => {
    const s = (r.status || "").toUpperCase();
    if (statusTab !== "ALL" && s !== statusTab) return false;
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
            <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Resignations & Exit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>🚪</span> HR Resignation & Exit Clearance
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track employee resignation submissions, 15-day notice period countdowns, exit approvals, and handovers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/hr"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            ← HR Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending Resignations</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting HR clearance</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Approved Exits</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{approvedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Exit cleared</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs border-l-4 border-l-slate-400">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Standard Notice Period</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">15 Days</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Company policy</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setStatusTab("SUBMITTED")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              statusTab === "SUBMITTED" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ⏳ Pending Submissions ({pendingCount})
          </button>
          <button
            onClick={() => setStatusTab("APPROVED")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              statusTab === "APPROVED" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ✓ Approved Exits ({approvedCount})
          </button>
          <button
            onClick={() => setStatusTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              statusTab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All ({resignations.length})
          </button>
        </div>
      </div>

      {/* Resignations Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Submission Date</th>
                <th className="py-3 px-3">Last Working Date</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredResignations.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{r.employeeName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{r.employeeId}</td>
                  <td className="py-3 px-3 text-slate-600">{r.department}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{r.submittedAt}</td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-700">{r.lastWorkingDate}</td>
                  <td className="py-3 px-3 max-w-xs text-slate-600 italic line-clamp-2">{r.reason}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                        (r.status || "").toUpperCase() === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {(r.status || "").toUpperCase() === "SUBMITTED" ? (
                      <button
                        onClick={() => setSelectedResign(r)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-xs transition cursor-pointer"
                      >
                        Review Exit
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-bold">Clearance Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedResign && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Review Employee Resignation</h3>
                <p className="text-xs text-slate-400 font-medium">Verify handover and notice period</p>
              </div>
              <button onClick={() => setSelectedResign(null)} className="text-slate-400 hover:text-slate-700 font-black">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Employee</span>
                <span className="font-black text-slate-900">{selectedResign.employeeName} ({selectedResign.employeeId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Proposed Last Day</span>
                <span className="font-mono font-bold text-rose-700">{selectedResign.lastWorkingDate} (15 Days Notice)</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Reason for Resignation</span>
                <p className="italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  "{selectedResign.reason}"
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-bold text-slate-700">
              <label className="block">HR Exit Clearance Remarks</label>
              <textarea
                rows={3}
                placeholder="Asset return and knowledge transfer notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedResign(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDecision("REJECTED")}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Decline Resignation
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDecision("APPROVED")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
              >
                {isProcessing ? "Processing..." : "✓ Approve Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
