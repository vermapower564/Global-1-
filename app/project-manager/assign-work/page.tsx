"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface SectionFormItem {
  id: string;
  title: string;
  sectionName: string;
  description: string;
  priority: string;
  dueDate: string;
  estimatedHours: string;
  teamLeaderId: string;
}

function ProjectManagerAssignWorkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTaskId = searchParams.get("mainTaskId");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(preselectedTaskId || "");
  const [sections, setSections] = useState<SectionFormItem[]>([
    {
      id: "sec-1",
      title: "",
      sectionName: "Frontend Work",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
      estimatedHours: "16",
      teamLeaderId: "",
    },
    {
      id: "sec-2",
      title: "",
      sectionName: "Backend & API Work",
      description: "",
      priority: "HIGH",
      dueDate: "",
      estimatedHours: "24",
      teamLeaderId: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/project-manager/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
          if (!selectedTaskId && json.adminMainTasks?.length > 0) {
            setSelectedTaskId(json.adminMainTasks[0].id);
          }
        }
      })
      .catch((err) => console.warn("Error loading PM data:", err))
      .finally(() => setLoading(false));
  }, []);

  const adminMainTasks = data?.adminMainTasks || [];
  const teamLeaders = data?.teamLeaders || [];
  const selectedTask = adminMainTasks.find((t: any) => t.id === selectedTaskId);

  // Set default teamLeaderId when task is selected
  useEffect(() => {
    if (selectedTask?.projectTeamLeader?.id) {
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          teamLeaderId: s.teamLeaderId || selectedTask.projectTeamLeader.id,
          dueDate: s.dueDate || (selectedTask.dueDate ? selectedTask.dueDate.split("T")[0] : ""),
        }))
      );
    }
  }, [selectedTask]);

  const handleAddSection = () => {
    const defaultTl = selectedTask?.projectTeamLeader?.id || (teamLeaders[0]?.id || "");
    const nextIdx = sections.length + 1;
    setSections([
      ...sections,
      {
        id: `sec-${Date.now()}`,
        title: "",
        sectionName: `Section ${nextIdx}`,
        description: "",
        priority: selectedTask?.priority || "MEDIUM",
        dueDate: selectedTask?.dueDate ? selectedTask.dueDate.split("T")[0] : "",
        estimatedHours: "16",
        teamLeaderId: defaultTl,
      },
    ]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleUpdateSection = (id: string, field: keyof SectionFormItem, value: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) {
      setErrorMsg("Please select a main task from Admin.");
      return;
    }

    const validSections = sections.filter((s) => s.title.trim().length > 0);
    if (validSections.length === 0) {
      setErrorMsg("Please enter at least one valid section title.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/project-manager/divide-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainTaskId: selectedTaskId,
          sections: validSections,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg("✓ Work sections created and assigned to Team Leader successfully!");
        setTimeout(() => {
          router.push("/project-manager");
        }, 1200);
      } else {
        setErrorMsg(json.error || "Failed to divide main task.");
      }
    } catch (err) {
      setErrorMsg("Network error while submitting work sections.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs font-bold text-slate-400">
        Loading task divider workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              Project Manager Workflow
            </span>
            <span className="text-xs font-bold text-slate-500">• Task Breakdown Tool</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Divide Admin Task into Work Sections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Split the executive deliverable into project-specific work areas (Frontend, Backend, Database, Testing, etc.) and assign to Team Leaders.
          </p>
        </div>

        <Link
          href="/project-manager"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition shrink-0"
        >
          ← Back to PM Dashboard
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Main Task */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
            1. Select Admin Main Task to Divide
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Admin Assigned Main Task <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- Choose Admin Task --</option>
              {adminMainTasks.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.projectTitle}) - Priority: {t.priority}
                </option>
              ))}
            </select>
          </div>

          {selectedTask && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-slate-900">{selectedTask.title}</h4>
                <span className="font-mono text-[10px] text-slate-400">{selectedTask.id}</span>
              </div>
              <p className="text-slate-600">{selectedTask.description || "No description provided."}</p>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1 font-medium">
                <span>Project: <strong className="text-slate-800">{selectedTask.projectTitle}</strong></span>
                <span>Assigned By: <strong className="text-slate-800">{selectedTask.assignedBy}</strong></span>
                <span>Due Date: <strong className="text-slate-800">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "—"}</strong></span>
                {selectedTask.projectTeamLeader && (
                  <span>Project Team Leader: <strong className="text-indigo-700">{selectedTask.projectTeamLeader.name} ({selectedTask.projectTeamLeader.employeeId})</strong></span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Work Sections */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                2. Define Project Work Sections & Assign to Team Leader
              </h3>
              <p className="text-[11px] text-slate-500">
                Create meaningful work sections tailored to this project's requirements.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSection}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition cursor-pointer border border-indigo-200"
            >
              + Add Section
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">
                    Work Section #{idx + 1}
                  </span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Section Title / Deliverable <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(sec.id, "title", e.target.value)}
                      placeholder="e.g. Customer API Endpoints & Auth"
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Section Category Name
                    </label>
                    <input
                      type="text"
                      value={sec.sectionName}
                      onChange={(e) => handleUpdateSection(sec.id, "sectionName", e.target.value)}
                      placeholder="e.g. Backend API, UI Components, Database"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Section Scope & Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={sec.description}
                    onChange={(e) => handleUpdateSection(sec.id, "description", e.target.value)}
                    placeholder="Describe deliverable expectations, architecture requirements, or acceptance criteria..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Assigned Team Leader <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={sec.teamLeaderId}
                      onChange={(e) => handleUpdateSection(sec.id, "teamLeaderId", e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    >
                      <option value="">-- Choose Team Leader --</option>
                      {teamLeaders.map((tl: any) => (
                        <option key={tl.id} value={tl.id}>
                          {tl.name} ({tl.employeeId}) - {tl.projectTitle}
                        </option>
                      ))}
                      {selectedTask?.projectTeamLeader && (
                        <option value={selectedTask.projectTeamLeader.id}>
                          {selectedTask.projectTeamLeader.name} ({selectedTask.projectTeamLeader.employeeId}) [Project TL]
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={sec.priority}
                      onChange={(e) => handleUpdateSection(sec.id, "priority", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Deadline / Due Date
                    </label>
                    <input
                      type="date"
                      value={sec.dueDate}
                      onChange={(e) => handleUpdateSection(sec.id, "dueDate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <Link
            href="/project-manager"
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Creating Work Sections..." : "✓ Assign Work Sections to Team Leader"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectManagerAssignWorkPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-12 text-center text-xs font-bold text-slate-400">
          Loading task assignment workspace...
        </div>
      }
    >
      <ProjectManagerAssignWorkContent />
    </Suspense>
  );
}
