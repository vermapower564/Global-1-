"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PromotionsContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("promoteId");

  const [employees, setEmployees] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/project-manager/promotions");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.employees || []);
        setHistory(json.promotionHistory || []);
        if (preselectedId) {
          const found = (json.employees || []).find((e: any) => e.employeeId === preselectedId || e.id === preselectedId);
          if (found) {
            setSelectedEmpId(found.id);
            setReason("Consistently completed project tasks ahead of deadlines and demonstrated outstanding team coordination.");
          }
        }
      }
    } catch (err) {
      console.warn("Failed loading promotion data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preselectedId]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !reason.trim()) return;

    setSubmitting(true);
    setError("");
    setMsg("");

    try {
      const res = await fetch("/api/project-manager/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          newRole: "TEAM_LEADER",
          performanceScore: selectedEmployee.metrics?.overallScore || 88,
          reason: reason.trim(),
          comments: comments.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMsg(`✓ ${json.message}`);
        setSelectedEmpId("");
        setReason("");
        setComments("");
        loadData();
      } else {
        setError(json.error || "Failed to promote employee.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 font-sans text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏆</span> Employee → Team Leader Promotions
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Evaluate high-performing employees and authorize official promotions with permanent audit records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/project-manager/performance"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← Performance Matrix
          </Link>
          <Link
            href="/project-manager"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
          >
            PM Dashboard
          </Link>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>✓</span> {msg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Promotion Action Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>📝</span> Authorize New Team Leader Promotion
        </h2>

        <form onSubmit={handlePromote} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                Select Eligible Employee *
              </label>
              <select
                required
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="">-- Choose Candidate --</option>
                {employees
                  .filter((e) => e.role !== "TEAM_LEADER" && e.role !== "PROJECT_MANAGER")
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId}) — Score: {emp.metrics?.overallScore}% • {emp.role}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                Promoted Role
              </label>
              <input
                type="text"
                disabled
                value="TEAM_LEADER (Project Team Leader)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-600"
              />
            </div>
          </div>

          {selectedEmployee && (
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Candidate</p>
                <p className="text-xs font-black text-slate-900">{selectedEmployee.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Performance Score</p>
                <p className="text-xs font-black text-blue-700">{selectedEmployee.metrics?.overallScore}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Task Completion</p>
                <p className="text-xs font-black text-slate-900">{selectedEmployee.metrics?.taskCompletionRate}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Work Quality</p>
                <p className="text-xs font-black text-slate-900">{selectedEmployee.metrics?.qualityRate}%</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              Promotion Justification Reason *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Detail candidate's leadership, on-time delivery track record, and project contribution..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              Internal Manager Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Recommended by Sprint Review board on Aug 21, 2026."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedEmpId}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Processing Promotion..." : "🏆 Authorize Promotion to Team Leader"}
            </button>
          </div>
        </form>
      </div>

      {/* Permanent Promotion History Log */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-3 p-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <span>📜</span> Permanent Promotion Audit History
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold py-6 text-center">
            No promotion records on file yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role Transition</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{record.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{record.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className="text-slate-500">{record.previousRole}</span>
                      <span className="mx-1.5 text-blue-600 font-black">→</span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {record.newRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700">
                      {record.performanceScore}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={record.reason}>
                      {record.reason}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {record.promotedByName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(record.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading promotions...</div>}>
      <PromotionsContent />
    </Suspense>
  );
}
