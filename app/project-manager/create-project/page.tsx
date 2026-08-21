"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function CreateProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [loading, setLoading] = useState(false);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Delivery Mode: "IMMEDIATE" (deliver to selected TL) or "DRAFT" (PM planning mode)
  const [deliveryMode, setDeliveryMode] = useState<"IMMEDIATE" | "DRAFT">("IMMEDIATE");

  const [formData, setFormData] = useState({
    id: "",
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

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your project draft.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Fetch Team Leaders & Draft Project (if editing draft)
  useEffect(() => {
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
        }
        if (projRes.success && Array.isArray(projRes.projects || projRes.data)) {
          const allProjs = projRes.projects || projRes.data || [];
          setExistingProjects(allProjs);

          // If draftId is present, load saved draft data
          if (draftId) {
            const foundDraft = allProjs.find((p: any) => p.id === draftId || p.projectCode === draftId);
            if (foundDraft) {
              setFormData({
                id: foundDraft.id,
                projectTitle: foundDraft.projectTitle || "",
                projectCode: foundDraft.projectCode || foundDraft.id || "",
                clientCompany: foundDraft.clientCompany || "",
                clientContactPerson: foundDraft.clientContactPerson || "",
                clientEmail: foundDraft.clientEmail || "",
                clientPhone: foundDraft.clientPhone || "+91 98765 00000",
                description: foundDraft.description || "",
                startDate: foundDraft.startDate ? foundDraft.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
                endDate: foundDraft.endDate ? foundDraft.endDate.split("T")[0] : new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
                priority: foundDraft.priority || "HIGH",
                projectType: foundDraft.projectType || "Web Application",
                requiredSkills: foundDraft.requiredSkills || "React, Next.js, Node.js, MySQL, UI/UX",
                requiredRoles: foundDraft.requiredRoles || "Developer, UI/UX Designer, QA Tester",
                techStack: foundDraft.techStack || "React 19, Next.js 16, Tailwind CSS, MySQL",
                expectedTeamSize: foundDraft.expectedTeamSize || 5,
                teamLeaderId: foundDraft.teamLeaderId || foundDraft.teamLeader?.id || "",
                deliveryNotes: "",
                status: foundDraft.status || "DRAFT",
                contractValue: foundDraft.contractValue || 250000,
              });
              setDeliveryMode(foundDraft.status === "DRAFT" ? "DRAFT" : "IMMEDIATE");
            }
          }
        }
      })
      .catch((err) => console.warn("Failed fetching metadata:", err));
  }, [draftId]);

  // Selected Team Leader metadata & workload calculation
  const selectedTLInfo = useMemo(() => {
    if (!formData.teamLeaderId) return null;
    const tl = teamLeaders.find((t) => t.id === formData.teamLeaderId);
    if (!tl) return null;

    const activeProjCount = existingProjects.filter(
      (p) => p.teamLeaderId === tl.id && p.status !== "COMPLETED" && p.status !== "DRAFT"
    ).length;

    let workloadStatus: "AVAILABLE" | "OPTIMAL" | "HIGH_LOAD" = "AVAILABLE";
    if (activeProjCount >= 3) workloadStatus = "HIGH_LOAD";
    else if (activeProjCount >= 1) workloadStatus = "OPTIMAL";

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

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async (asDraft: boolean) => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!formData.projectTitle.trim()) {
      setError("Project Name is required.");
      setLoading(false);
      return;
    }

    if (!asDraft && !formData.teamLeaderId) {
      setError("Please choose a Team Leader to deliver this project to.");
      setLoading(false);
      return;
    }

    try {
      const finalStatus = asDraft ? "DRAFT" : "ACTIVE";
      const finalTLId = asDraft ? formData.teamLeaderId || null : formData.teamLeaderId;

      const isUpdate = !!formData.id;
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch("/api/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isDraft: asDraft,
          status: finalStatus,
          teamLeaderId: finalTLId,
          memberUserIds: finalTLId ? [finalTLId] : [],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsDirty(false);
        const tlName = selectedTLInfo?.name || "Team Leader";
        const message = asDraft
          ? "✓ Project successfully saved as PM Draft in database!"
          : `✓ Project successfully created and delivered to Team Leader (${tlName})!`;
        setSuccess(message);
        setTimeout(() => {
          router.push("/projects");
        }, 1200);
      } else {
        setError(json.error || "Failed to save project.");
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
            <span>🚀</span> {draftId ? "Edit & Deliver Project Draft" : "Create & Deliver Enterprise Project"}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Define requirements, technology stack, save as a persistent draft, or deliver immediately to a chosen Team Leader.
          </p>
        </div>
        <Link
          href="/projects"
          className="text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition cursor-pointer"
        >
          ← Back to Projects
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave(deliveryMode === "DRAFT");
        }}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
      >
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
                onChange={(e) => handleFieldChange("projectTitle", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Code</label>
              <input
                type="text"
                placeholder="e.g. ECOM-2026"
                value={formData.projectCode}
                onChange={(e) => handleFieldChange("projectCode", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Company</label>
              <input
                type="text"
                placeholder="e.g. Acme Global Logistics"
                value={formData.clientCompany}
                onChange={(e) => handleFieldChange("clientCompany", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Malhotra (VP Tech)"
                value={formData.clientContactPerson}
                onChange={(e) => handleFieldChange("clientContactPerson", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Email</label>
              <input
                type="email"
                placeholder="client@acme.com"
                value={formData.clientEmail}
                onChange={(e) => handleFieldChange("clientEmail", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Phone</label>
              <input
                type="text"
                placeholder="+91 98765 00000"
                value={formData.clientPhone}
                onChange={(e) => handleFieldChange("clientPhone", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1">Executive Summary / Scope</label>
            <textarea
              rows={3}
              placeholder="Outline project deliverables, key milestones, and business objectives..."
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Timeline & Budget */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Schedule, Value & Priority
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Target End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleFieldChange("endDate", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Contract Value (INR)</label>
              <input
                type="number"
                value={formData.contractValue}
                onChange={(e) => handleFieldChange("contractValue", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleFieldChange("priority", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Technical Specifications & Skills */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Technical Stack & Skill Matrix
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Technology Stack</label>
              <input
                type="text"
                placeholder="e.g. Next.js 16, React, Node.js, MySQL"
                value={formData.techStack}
                onChange={(e) => handleFieldChange("techStack", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. React, Node.js, MySQL, Tailwind, UI/UX"
                value={formData.requiredSkills}
                onChange={(e) => handleFieldChange("requiredSkills", e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Project Delivery Mode */}
        <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                <span>🎯</span> 4. Project Delivery & Team Allocation
              </h3>
              <p className="text-[11px] text-indigo-800">
                Choose whether to deliver this project immediately to a Team Leader or save as a private PM draft.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                deliveryMode === "IMMEDIATE"
                  ? "bg-white border-indigo-600 shadow-sm"
                  : "bg-slate-50 border-slate-200 opacity-80"
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
                  Deliver Immediately to Team Leader
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hands off the project to the selected Team Leader with execution instructions.
                </p>
              </div>
            </label>

            <label
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                deliveryMode === "DRAFT"
                  ? "bg-white border-indigo-600 shadow-sm"
                  : "bg-slate-50 border-slate-200 opacity-80"
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
                  Save as Persistent PM Draft
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Keeps the project in private PM planning mode. Visible under Projects → Drafts.
                </p>
              </div>
            </label>
          </div>

          {/* If Immediate Delivery: Choose Team Leader */}
          {deliveryMode === "IMMEDIATE" && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Choose Team Leader to Deliver Project To *
                </label>
                <select
                  required={deliveryMode === "IMMEDIATE"}
                  value={formData.teamLeaderId}
                  onChange={(e) => handleFieldChange("teamLeaderId", e.target.value)}
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
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider self-end sm:self-auto ${
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
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Delivery Directives & Execution Instructions for Team Leader
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Schedule sprint planning with engineering by Tuesday, prioritize auth module..."
                  value={formData.deliveryNotes}
                  onChange={(e) => handleFieldChange("deliveryNotes", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/projects"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-300 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>💾</span> Save as Draft
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                "Processing Deliverable..."
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
        </div>
      </form>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-slate-400">Loading project editor...</div>}>
      <CreateProjectForm />
    </Suspense>
  );
}
