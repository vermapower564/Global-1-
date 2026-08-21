"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delivery Mode: "IMMEDIATE" (deliver to selected TL) or "DRAFT" (PM planning mode)
  const [deliveryMode, setDeliveryMode] = useState<"IMMEDIATE" | "DRAFT">("IMMEDIATE");

  const [formData, setFormData] = useState({
    projectTitle: "",
    projectCode: "",
    clientCompany: "",
    clientContactPerson: "",
    clientEmail: "",
    clientPhone: "+91 98765 00000",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
    priority: "HIGH",
    projectType: "Web Application",
    requiredSkills: "React, Next.js, Node.js, MySQL, UI/UX",
    requiredRoles: "Developer, UI/UX Designer, QA Tester",
    techStack: "React 19, Next.js 16, Tailwind CSS, MySQL",
    expectedTeamSize: 5,
    teamLeaderId: "",
    deliveryNotes: "",
    status: "ACTIVE",
    contractValue: 250000,
  });

  useEffect(() => {
    // Fetch Team Leaders & Senior staff and current projects for workload calculation
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([empRes, projRes]) => {
        if (empRes.success && Array.isArray(empRes.data)) {
          const eligible = empRes.data.filter(
            (e: any) =>
              e.role === "TEAM_LEADER" ||
              e.role === "DEVELOPER" ||
              e.role === "PROJECT_MANAGER" ||
              e.role === "UI_UX_DESIGNER"
          );
          setTeamLeaders(eligible);
          if (eligible.length > 0) {
            setFormData((prev) => ({ ...prev, teamLeaderId: eligible[0].id }));
          }
        }
        if (projRes.success && Array.isArray(projRes.projects || projRes.data)) {
          setExistingProjects(projRes.projects || projRes.data || []);
        }
      })
      .catch((err) => console.warn("Failed fetching metadata:", err));
  }, []);

  // Selected Team Leader metadata & workload calculation
  const selectedTLInfo = useMemo(() => {
    if (!formData.teamLeaderId) return null;
    const tl = teamLeaders.find((t) => t.id === formData.teamLeaderId);
    if (!tl) return null;

    const activeProjCount = existingProjects.filter(
      (p) => p.teamLeaderId === tl.id && p.status !== "COMPLETED"
    ).length;

    let workloadStatus: "AVAILABLE" | "OPTIMAL" | "HIGH_LOAD" = "AVAILABLE";
    if (activeProjCount >= 3) workloadStatus = "HIGH_LOAD";
    else if (activeProjCount >= 1) workloadStatus = "OPTIMAL";

    // Skills match score
    const required = (formData.requiredSkills || "")
      .toLowerCase()
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const tlSkills = (tl.skills || "")
      .toLowerCase()
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const matches = required.filter((r) => tlSkills.some((ts: string) => ts.includes(r) || r.includes(ts)));
    const matchPct = required.length > 0 ? Math.round((matches.length / required.length) * 100) : 100;

    return {
      ...tl,
      activeProjCount,
      workloadStatus,
      matchPct,
      matchingSkills: matches,
    };
  }, [formData.teamLeaderId, teamLeaders, existingProjects, formData.requiredSkills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!formData.projectTitle.trim()) {
      setError("Project Name is required.");
      setLoading(false);
      return;
    }

    if (deliveryMode === "IMMEDIATE" && !formData.teamLeaderId) {
      setError("Please choose a Team Leader to deliver this project to.");
      setLoading(false);
      return;
    }

    const finalTLId = deliveryMode === "IMMEDIATE" ? formData.teamLeaderId : null;
    const finalStatus = deliveryMode === "IMMEDIATE" ? "ACTIVE" : "PLANNING";

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          teamLeaderId: finalTLId,
          status: finalStatus,
          memberUserIds: finalTLId ? [finalTLId] : [],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const tlName = selectedTLInfo?.name || "Team Leader";
        const message =
          deliveryMode === "IMMEDIATE"
            ? `✓ Project successfully created and delivered to Team Leader (${tlName})!`
            : "✓ Project created in Planning draft mode!";
        setSuccess(message);
        setTimeout(() => {
          router.push("/projects");
        }, 1200);
      } else {
        setError(json.error || "Failed to create project.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🚀</span> Create & Deliver Enterprise Project
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Define requirements, technology stack, and deliver the project to a chosen Team Leader for team allocation and execution.
          </p>
        </div>
        <Link
          href="/project-manager"
          className="text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition"
        >
          ← Back to PM Portal
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Section 1: General Deliverable Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. General Deliverable Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. E-Commerce Multi-Vendor Platform"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Code</label>
              <input
                type="text"
                placeholder="e.g. ECOM-2026"
                value={formData.projectCode}
                onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Scope & Description</label>
            <textarea
              rows={3}
              placeholder="Outline project objectives, architecture milestones, and key deliverables..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Client & Timelines */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Client & Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Company *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Corp"
                value={formData.clientCompany}
                onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.clientContactPerson}
                onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Deadline / Target Delivery</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Skills, Roles & Tech Stack */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Skills, Stack & Team Requirements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Required Skills (Comma separated for Smart TL Matching)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Next.js, Node.js, MySQL, UI/UX"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Technology Stack</label>
              <input
                type="text"
                placeholder="e.g. Next.js 16, MySQL, Prisma, Docker, Tailwind CSS"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Type</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile App (iOS/Android)">Mobile App (iOS/Android)</option>
                <option value="Enterprise Portal">Enterprise Portal / SaaS</option>
                <option value="E-Commerce Store">E-Commerce Store</option>
                <option value="API & Cloud Infrastructure">API & Cloud Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: PROJECT DELIVERY TO TEAM LEADER (REQUESTED OPTION) */}
        <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span> 4. Project Delivery & Team Leader Handover Option
            </h3>
            <span className="text-[10px] font-black px-2.5 py-0.5 bg-indigo-600 text-white rounded-full uppercase">
              Leadership Delegation
            </span>
          </div>

          {/* Delivery Mode Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              onClick={() => setDeliveryMode("IMMEDIATE")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                deliveryMode === "IMMEDIATE"
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white/60 border-slate-200 hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="deliveryMode"
                checked={deliveryMode === "IMMEDIATE"}
                onChange={() => setDeliveryMode("IMMEDIATE")}
                className="mt-1"
              />
              <div>
                <p className="text-xs font-black text-slate-900">
                  Deliver & Assign to Team Leader Immediately (Recommended)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hands over the project directly to the chosen Team Leader so they can start allocating tasks to team members.
                </p>
              </div>
            </label>

            <label
              onClick={() => setDeliveryMode("DRAFT")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                deliveryMode === "DRAFT"
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white/60 border-slate-200 hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="deliveryMode"
                checked={deliveryMode === "DRAFT"}
                onChange={() => setDeliveryMode("DRAFT")}
                className="mt-1"
              />
              <div>
                <p className="text-xs font-black text-slate-900">
                  Save as PM Draft (Deliver Later)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Keeps the project in PM planning stage. You can deliver it to a Team Leader later from the Command Portal.
                </p>
              </div>
            </label>
          </div>

          {/* If Immediate Delivery: Choose Team Leader and View Smart Match */}
          {deliveryMode === "IMMEDIATE" && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Choose Team Leader to Deliver Project To *
                </label>
                <select
                  required
                  value={formData.teamLeaderId}
                  onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-indigo-600 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Team Leader for Delivery --</option>
                  {teamLeaders.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.name} ({tl.employeeId}) — {tl.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Team Leader Smart Profile Card */}
              {selectedTLInfo && (
                <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selectedTLInfo.avatarUrl ? (
                      <img
                        src={selectedTLInfo.avatarUrl}
                        alt={selectedTLInfo.name}
                        className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center">
                        {selectedTLInfo.name?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{selectedTLInfo.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          ({selectedTLInfo.employeeId})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Role: {selectedTLInfo.role} • Active Projects:{" "}
                        <span className="font-bold text-slate-800">{selectedTLInfo.activeProjCount}</span>
                      </p>
                      {selectedTLInfo.skills && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                          Skills: {selectedTLInfo.skills}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider ${
                        selectedTLInfo.workloadStatus === "HIGH_LOAD"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : selectedTLInfo.workloadStatus === "OPTIMAL"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {selectedTLInfo.workloadStatus === "HIGH_LOAD"
                        ? "⚠️ High Load"
                        : selectedTLInfo.workloadStatus === "OPTIMAL"
                        ? "Optimal Load"
                        : "✓ Available"}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery Directives & Instructions */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Delivery Directives & Execution Instructions for Team Leader (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Schedule architecture review with engineering team by Tuesday, allocate UI designer for sprint 1..."
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/project-manager"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              "Delivering Deliverable..."
            ) : deliveryMode === "IMMEDIATE" ? (
              <>
                <span>🚀</span> Deliver Project to Team Leader
              </>
            ) : (
              <>
                <span>💾</span> Save Project Draft
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
