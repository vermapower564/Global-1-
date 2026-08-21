"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function TeamLeadersManagementPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newTlId, setNewTlId] = useState("");
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/employees"),
      ]);
      const pJson = await pRes.json();
      const eJson = await eRes.json();

      if (pJson.success && Array.isArray(pJson.projects || pJson.data)) {
        setProjects(pJson.projects || pJson.data || []);
      }
      if (eJson.success && Array.isArray(eJson.data)) {
        const eligible = eJson.data.filter(
          (e: any) => e.role === "TEAM_LEADER" || e.role === "DEVELOPER" || e.role === "PROJECT_MANAGER"
        );
        setTeamLeaders(eligible);
      }
    } catch (err) {
      console.warn("Failed loading TLs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTlId) return;

    setUpdating(true);
    setError("");
    setMsg("");

    try {
      const res = await fetch(`/api/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProject.id,
          projectTitle: selectedProject.projectTitle,
          clientCompany: selectedProject.clientCompany,
          startDate: selectedProject.startDate,
          endDate: selectedProject.endDate,
          contractValue: selectedProject.contractValue,
          status: selectedProject.status,
          teamLeaderId: newTlId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMsg(`✓ Successfully reassigned Team Leader for ${selectedProject.projectTitle}!`);
        setReassignModalOpen(false);
        loadData();
      } else {
        setError(json.error || "Failed to reassign Team Leader.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>👥</span> Project Team Leaders Command
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor Team Leader performance, assigned deliverables, and reassign project leadership.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/project-manager/create-project"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
          >
            + Create Project
          </Link>
          <Link
            href="/project-manager"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← PM Dashboard
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-3xl"></div>
          <div className="h-44 bg-slate-100 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const tl = proj.teamLeader;
            const healthColor =
              proj.projectHealth === "CRITICAL"
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : proj.projectHealth === "AT_RISK"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-emerald-100 text-emerald-800 border-emerald-200";

            return (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {proj.projectCode || proj.id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 line-clamp-1">{proj.projectTitle}</h3>
                      <p className="text-xs text-slate-500 font-medium">{proj.clientCompany}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${healthColor}`}>
                      {proj.projectHealth || "HEALTHY"}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                    {tl?.avatarUrl ? (
                      <img src={tl.avatarUrl} alt={tl.name} className="h-10 w-10 rounded-xl object-cover border border-white shadow-xs" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                        {tl?.name ? tl.name.substring(0, 2).toUpperCase() : "TL"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Team Leader</p>
                      <h4 className="text-xs font-black text-slate-900 truncate">{tl?.name || "Unassigned"}</h4>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{tl?.email || "No contact"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold text-slate-600 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-slate-400 text-[9px]">Progress</p>
                      <p className="text-xs font-black text-slate-900">{proj.metrics?.overallProgress || 0}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px]">Team Size</p>
                      <p className="text-xs font-black text-slate-900">{proj.memberCount || 0} members</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px]">Blocked</p>
                      <p className={`text-xs font-black ${proj.metrics?.blockedTasks > 0 ? "text-rose-600" : "text-slate-900"}`}>
                        {proj.metrics?.blockedTasks || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/employee/projects/${proj.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    View Workboard →
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedProject(proj);
                      setNewTlId(proj.teamLeaderId || "");
                      setReassignModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-xl transition cursor-pointer"
                  >
                    Reassign TL
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reassign Team Leader Modal */}
      {reassignModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReassignModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>🔄</span> Reassign Team Leader
              </h3>
              <button
                onClick={() => setReassignModalOpen(false)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500">Project:</p>
              <p className="text-sm font-black text-slate-900">{selectedProject?.projectTitle}</p>
            </div>

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Select New Team Leader *
                </label>
                <select
                  required
                  value={newTlId}
                  onChange={(e) => setNewTlId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                >
                  <option value="">-- Choose Leader --</option>
                  {teamLeaders.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.name} ({tl.employeeId}) — {tl.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs disabled:opacity-50"
                >
                  {updating ? "Updating..." : "✓ Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
