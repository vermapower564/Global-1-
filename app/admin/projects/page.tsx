"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formClientCompany, setFormClientCompany] = useState("");
  const [formClientPerson, setFormClientPerson] = useState("");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formContractValue, setFormContractValue] = useState("250000");
  const [formStatus, setFormStatus] = useState("IN_PROGRESS");
  const [formProjectManagerId, setFormProjectManagerId] = useState("");
  const [formTeamLeaderId, setFormTeamLeaderId] = useState("");
  const [formMemberIds, setFormMemberIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/employees"),
      ]);
      const pJson = await pRes.json();
      const eJson = await eRes.json();

      if (pJson.success && Array.isArray(pJson.projects || pJson.data)) {
        setProjects(pJson.projects || pJson.data);
      }
      if (eJson.success && Array.isArray(eJson.employees || eJson.data)) {
        setEmployees(eJson.employees || eJson.data);
      }
    } catch (err) {
      console.warn("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDeptUpper = (e: any): string => {
    if (!e) return "";
    if (typeof e.department === "string") return e.department.toUpperCase();
    if (e.department && typeof e.department === "object" && typeof e.department.name === "string") return e.department.name.toUpperCase();
    if (typeof e.departmentName === "string") return e.departmentName.toUpperCase();
    return "";
  };

  // 1. Eligible Project Managers: Strictly users whose actual role is PROJECT_MANAGER
  const eligibleProjectManagers = useMemo(() => {
    return employees.filter((e) => {
      const roleUpper = (e.role || "").toUpperCase();
      return roleUpper === "PROJECT_MANAGER";
    });
  }, [employees]);

  // 2. Eligible Team Leaders: Strictly users whose actual role is TEAM_LEADER (Auto-sorted by lowest workload)
  const eligibleTeamLeaders = useMemo(() => {
    const tls = employees.filter((e) => {
      const roleUpper = (e.role || "").toUpperCase();
      return roleUpper === "TEAM_LEADER";
    });
    const mapped = tls.map((tl) => {
      const activeCount = projects.filter(
        (p) => (p.teamLeaderId === tl.id || p.teamLeader?.id === tl.id) && p.status !== "COMPLETED" && p.status !== "DRAFT"
      ).length;
      return { ...tl, activeCount };
    });
    // Freest first (0 active projects, 1 active project, etc.)
    mapped.sort((a, b) => a.activeCount - b.activeCount);
    return mapped;
  }, [employees, projects]);

  // Modal State for PM Assigning Team Leader
  const [isAssignTLModalOpen, setIsAssignTLModalOpen] = useState(false);
  const [assignTLProject, setAssignTLProject] = useState<any | null>(null);
  const [selectedTLId, setSelectedTLId] = useState("");
  const [assignTLError, setAssignTLError] = useState("");
  const [assignTLSuccess, setAssignTLSuccess] = useState("");
  const [assignTLSubmitting, setAssignTLSubmitting] = useState(false);

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormTitle("");
    setFormDescription("");
    setFormClientCompany("");
    setFormClientPerson("");
    setFormClientEmail("");
    setFormClientPhone("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0]);
    setFormContractValue("500000");
    setFormStatus("IN_PROGRESS");
    const defaultPM = eligibleProjectManagers[0];
    setFormProjectManagerId(defaultPM?.id || "");
    setFormTeamLeaderId("");
    setFormMemberIds([]);
    setFormError("");
    setFormSuccess("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (proj: any) => {
    setIsEditMode(true);
    setSelectedProject(proj);
    setFormTitle(proj.projectTitle || "");
    setFormDescription(proj.description || "");
    setFormClientCompany(proj.clientCompany || "");
    setFormClientPerson(proj.clientContactPerson || "");
    setFormClientEmail(proj.clientEmail || "");
    setFormClientPhone(proj.clientPhone || "");
    setFormStartDate(proj.startDate ? new Date(proj.startDate).toISOString().split("T")[0] : "");
    setFormEndDate(proj.endDate ? new Date(proj.endDate).toISOString().split("T")[0] : "");
    setFormContractValue(proj.contractValue?.toString() || "250000");
    setFormStatus(proj.status || "IN_PROGRESS");
    setFormProjectManagerId(proj.projectManagerId || proj.projectManager?.id || "");
    setFormTeamLeaderId(proj.teamLeaderId || proj.teamLeader?.id || "");
    setFormMemberIds(proj.teamMembers ? proj.teamMembers.map((m: any) => m.id) : []);
    setFormError("");
    setFormSuccess("");
    setIsCreateModalOpen(true);
  };

  const openAssignTLModal = (proj: any) => {
    setAssignTLProject(proj);
    const currentTLId = proj.teamLeaderId || proj.teamLeader?.id || "";
    setSelectedTLId(currentTLId || (eligibleTeamLeaders[0]?.id || ""));
    setAssignTLError("");
    setAssignTLSuccess("");
    setIsAssignTLModalOpen(true);
  };

  const handleAssignTeamLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTLId) {
      setAssignTLError("Please select a Team Leader.");
      return;
    }
    setAssignTLSubmitting(true);
    setAssignTLError("");
    setAssignTLSuccess("");

    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assignTLProject.id,
          teamLeaderId: selectedTLId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignTLSuccess(data.message || "✓ Project successfully assigned to Team Leader!");
        setTimeout(() => {
          setIsAssignTLModalOpen(false);
          fetchData();
        }, 800);
      } else {
        setAssignTLError(data.error || "Failed to assign Team Leader.");
      }
    } catch (err: any) {
      setAssignTLError(err.message || "Network error. Please try again.");
    } finally {
      setAssignTLSubmitting(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Project Title is required.");
      return;
    }
    if (!formProjectManagerId) {
      setFormError("Please select a Project Manager.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const url = "/api/projects";
      const method = isEditMode ? "PUT" : "POST";
      const body = {
        id: isEditMode ? selectedProject?.id : undefined,
        projectTitle: formTitle.trim(),
        description: formDescription.trim(),
        clientCompany: formClientCompany.trim() || "Enterprise Client",
        clientContactPerson: formClientPerson.trim() || "Client Stakeholder",
        clientEmail: formClientEmail.trim() || "client@enterprise.com",
        clientPhone: formClientPhone.trim() || "+91 98765 00000",
        startDate: formStartDate,
        endDate: formEndDate,
        contractValue: formContractValue,
        status: formStatus,
        projectManagerId: formProjectManagerId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess(isEditMode ? "✓ Project successfully updated!" : "✓ Project created and assigned to Project Manager!");
        setTimeout(() => {
          setIsCreateModalOpen(false);
          fetchData();
        }, 600);
      } else {
        setFormError(data.error || "Failed to save project.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    if (formMemberIds.includes(userId)) {
      setFormMemberIds(formMemberIds.filter((id) => id !== userId));
    } else {
      setFormMemberIds([...formMemberIds, userId]);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.projectTitle?.toLowerCase().includes(q) ||
      p.clientCompany?.toLowerCase().includes(q) ||
      p.teamLeader?.name?.toLowerCase().includes(q);

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "COMPLETED") {
      return matchesSearch && (p.status === "COMPLETED" || (p.metrics?.overallProgress || 0) >= 100);
    }
    if (statusFilter === "IN_PROGRESS") {
      return matchesSearch && p.status === "IN_PROGRESS" && (p.metrics?.overallProgress || 0) < 100;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Admin Governance • Projects & Hierarchy
            </span>
            <span className="text-xs font-bold text-slate-500">• {projects.length} Total Projects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Projects, Team Leaders & Section Progress
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Create projects, assign dedicated <strong>Team Leaders</strong> and project members, and monitor overall section and employee-wise progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Create Project</span>
          </button>
          <Link
            href="/admin/tasks"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl border border-slate-200 transition shrink-0"
          >
            All Tasks Center →
          </Link>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, client, or team leader..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "ALL", label: `All Projects (${projects.length})` },
            { id: "IN_PROGRESS", label: "🚀 In Progress" },
            { id: "COMPLETED", label: "🏆 Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 mt-3">Loading projects and team hierarchy...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <p className="text-xs font-bold text-slate-500">No projects match your filter.</p>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((proj) => {
            const isCompleted = proj.status === "COMPLETED" || (proj.metrics?.overallProgress || 0) >= 100;
            const leader = proj.teamLeader;
            const members = proj.teamMembers || [];
            const sections = proj.sections || [];
            const progress = proj.metrics?.overallProgress || 0;

            return (
              <div
                key={proj.id}
                className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                  isCompleted ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isCompleted ? "🏆 COMPLETED" : "🚀 IN PROGRESS"}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {proj.id?.slice(0, 10)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {proj.projectTitle}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Client: <strong className="text-slate-800">{proj.clientCompany}</strong> • {proj.clientContactPerson}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-black text-emerald-600">
                        ₹{(Number(proj.contractValue) || 250000).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Contract Value</span>
                    </div>
                  </div>

                  {/* Team Leader & Members Row */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Team Leader:</span>
                      {leader ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/employees/${encodeURIComponent(leader.employeeId || leader.id)}`}
                            title={`View ${leader.name} Profile`}
                            className="font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 hover:underline inline-flex items-center gap-1 transition"
                          >
                            👑 {leader.name} ({leader.employeeId})
                          </Link>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-bold">⚠️ No Team Leader Assigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-bold">Project Members ({members.length}):</span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {members.slice(0, 4).map((m: any) => (
                          <Link
                            key={m.id}
                            href={`/admin/employees/${encodeURIComponent(m.employeeId || m.id)}`}
                            title={`View ${m.name} (${m.role}) Profile`}
                            className="px-2 py-0.5 rounded-md bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] font-bold text-slate-700 hover:text-blue-700 hover:underline transition"
                          >
                            {m.name.split(" ")[0]}
                          </Link>
                        ))}
                        {members.length > 4 && (
                          <span className="text-[10px] font-extrabold text-slate-500">
                            +{members.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Breakdown Badges */}
                  {sections.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Work Sections Breakdown
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {sections.map((sec: any) => (
                          <div
                            key={sec.name}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1.5"
                          >
                            <span>{sec.name}</span>
                            <span className="font-mono text-blue-600 bg-white px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                              {sec.progress}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overall Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-600">Overall Progress</span>
                      <span className="text-blue-600 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedProject(proj)}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs border border-slate-200 transition cursor-pointer shadow-2xs text-center"
                  >
                    📊 Monitor Details →
                  </button>

                  <button
                    onClick={() => openAssignTLModal(proj)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 transition cursor-pointer"
                    title="Assign or Reassign Team Leader"
                  >
                    👑 {proj.teamLeader ? "Reassign TL" : "Assign TL"}
                  </button>

                  <button
                    onClick={() => openEditModal(proj)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs border border-slate-200 transition cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL (ADMIN -> PROJECT MANAGER ONLY) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditMode ? "Edit Project Configuration" : "Create New Project (Admin → Project Manager)"}
                </h3>
                <p className="text-xs text-slate-500">
                  Enterprise governance: Assign project to authorized <strong>Project Manager</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. E-Commerce Website / CRM System"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1">Project Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detailed scope, goals, and technical deliverables..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Client Company</label>
                  <input
                    type="text"
                    value={formClientCompany}
                    onChange={(e) => setFormClientCompany(e.target.value)}
                    placeholder="e.g. Acme Corp / FinVest Ltd"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Client Contact Person</label>
                  <input
                    type="text"
                    value={formClientPerson}
                    onChange={(e) => setFormClientPerson(e.target.value)}
                    placeholder="e.g. Alice Smith"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1">Deadline / End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1">Contract Value (₹)</label>
                  <input
                    type="number"
                    value={formContractValue}
                    onChange={(e) => setFormContractValue(e.target.value)}
                    placeholder="500000"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1">Project Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="IN_PROGRESS">🚀 In Progress</option>
                    <option value="PLANNING">📝 Planning</option>
                    <option value="COMPLETED">🏆 Completed</option>
                    <option value="ON_HOLD">⏸️ On Hold</option>
                  </select>
                </div>
              </div>

              {/* PROJECT MANAGER SELECTION ONLY (ADMIN -> PM) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <label className="block font-black text-indigo-950">
                  👔 Select Project Manager * (Admin Assignment)
                </label>
                <p className="text-[11px] text-indigo-700 font-medium">
                  Strict Hierarchy: Admin assigns project to <strong>Project Manager ONLY</strong>. Project Manager will subsequently assign a Team Leader.
                </p>
                <select
                  required
                  value={formProjectManagerId}
                  onChange={(e) => setFormProjectManagerId(e.target.value)}
                  className="w-full rounded-xl border border-indigo-300 bg-white px-3.5 py-2 text-xs font-black text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Project Manager --</option>
                  {eligibleProjectManagers.map((pm: any) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name} ({pm.employeeId || "EMP"}) — Project Manager
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                >
                  {submitting ? "Saving..." : isEditMode ? "✓ Save Project" : "✓ Create & Assign PM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT MONITOR DETAILS MODAL */}
      {selectedProject && !isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                    {selectedProject.status}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {selectedProject.id}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedProject.projectTitle}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {selectedProject.description || "Enterprise project deliverable."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAssignTLModal(selectedProject)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                >
                  👑 {selectedProject.teamLeader ? "Reassign Team Leader" : "Assign Team Leader"}
                </button>
                <button
                  onClick={() => openEditModal(selectedProject)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-500 uppercase">Project Manager</span>
                <p className="font-extrabold text-indigo-900 text-xs mt-0.5">
                  👔 {selectedProject.projectManager?.name ? `${selectedProject.projectManager.name} (${selectedProject.projectManager.employeeId || "PM"})` : "Unassigned"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Current Team Leader</span>
                <p className="font-extrabold text-blue-900 text-xs mt-0.5">
                  👑 {selectedProject.teamLeader?.name ? `${selectedProject.teamLeader.name} (${selectedProject.teamLeader.employeeId || "TL"})` : "Unassigned"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tasks</span>
                <p className="font-extrabold text-slate-900 text-xs mt-0.5">
                  📋 {selectedProject.metrics?.totalTasks || 0} ({selectedProject.metrics?.completedTasks || 0} Done)
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Progress</span>
                <p className="font-extrabold text-emerald-600 text-xs mt-0.5 font-mono">
                  {selectedProject.metrics?.overallProgress || 0}%
                </p>
              </div>
            </div>

            {/* Section-Wise Progress Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Section-Wise Progress Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(selectedProject.sections || []).map((sec: any) => (
                  <div key={sec.name} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-900">{sec.name}</span>
                      <span className="font-mono font-bold text-blue-600">{sec.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${sec.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {sec.completedTasks} / {sec.totalTasks} tasks completed
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Employee-Wise Progress Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Employee-Wise Task & Progress Ledger
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Role / Section</th>
                      <th className="p-3 text-center">Tasks Assigned</th>
                      <th className="p-3 text-center">Completed</th>
                      <th className="p-3 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(selectedProject.employeeProgress || []).map((ep: any) => (
                      <tr key={ep.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          <Link
                            href={`/admin/employees/${encodeURIComponent(ep.employeeId || ep.id)}`}
                            title={`View ${ep.name} Profile`}
                            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{ep.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">({ep.employeeId})</span>
                          </Link>
                        </td>
                        <td className="p-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold">
                            {ep.section || "General"}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">{ep.total}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">{ep.completed}</td>
                        <td className="p-3 text-right font-mono font-black text-blue-600">{ep.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TEAM LEADER MODAL (PROJECT MANAGER -> TEAM LEADER ONLY) */}
      {isAssignTLModalOpen && assignTLProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  👑 Assign Team Leader
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Project: <strong className="text-slate-800">{assignTLProject.projectTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAssignTLModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {assignTLError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {assignTLError}
              </div>
            )}
            {assignTLSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {assignTLSuccess}
              </div>
            )}

            <form onSubmit={handleAssignTeamLeader} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <label className="block font-black text-blue-900">
                  Team Leader *
                </label>
                <p className="text-[11px] text-blue-700 font-medium">
                  Select an authorized Team Leader. Workloads are calculated automatically.
                </p>
                <select
                  required
                  value={selectedTLId}
                  onChange={(e) => setSelectedTLId(e.target.value)}
                  className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2.5 text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Team Leader --</option>
                  {eligibleTeamLeaders.map((tl: any) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.name} ({tl.employeeId || "EMP"}) • {tl.activeCount} Active Projects {tl.activeCount === 0 ? "— 🟢 Available" : tl.activeCount === 1 ? "— 🟡 Optimal" : "— 🔴 Busy"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignTLModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignTLSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                >
                  {assignTLSubmitting ? "Assigning..." : "✓ ASSIGN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
