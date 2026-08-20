"use client";

import React, { useState, useEffect } from "react";
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
    setFormTeamLeaderId(employees[0]?.id || "");
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
    setFormTeamLeaderId(proj.teamLeaderId || proj.teamLeader?.id || "");
    setFormMemberIds(proj.teamMembers ? proj.teamMembers.map((m: any) => m.id) : []);
    setFormError("");
    setFormSuccess("");
    setIsCreateModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Project Title is required.");
      return;
    }
    if (!formTeamLeaderId) {
      setFormError("Please select a Team Leader for the project.");
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
        contractValue: parseFloat(formContractValue) || 250000,
        status: formStatus,
        teamLeaderId: formTeamLeaderId,
        memberUserIds: formMemberIds,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess(isEditMode ? "✓ Project successfully updated!" : "✓ Project created with Team Leader & members!");
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
                          <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            👑 {leader.name} ({leader.employeeId})
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-bold">⚠️ No Team Leader Assigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-bold">Project Members ({members.length}):</span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {members.slice(0, 4).map((m: any) => (
                          <span
                            key={m.id}
                            title={`${m.name} (${m.role})`}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                          >
                            {m.name.split(" ")[0]}
                          </span>
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
                    📊 Monitor Details & Progress →
                  </button>

                  <button
                    onClick={() => openEditModal(proj)}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200 transition cursor-pointer"
                  >
                    ✏️ Edit / Reassign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditMode ? "Edit Project Configuration" : "Create New Project"}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign a dedicated Team Leader and select contributing project members.
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

              {/* TEAM LEADER SELECTION */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <label className="block font-black text-blue-900">
                  👑 Select Project Team Leader *
                </label>
                <p className="text-[11px] text-blue-700 font-medium">
                  The selected Team Leader will manage sections, create tasks, and assign work to members.
                </p>
                <select
                  required
                  value={formTeamLeaderId}
                  onChange={(e) => setFormTeamLeaderId(e.target.value)}
                  className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Team Leader --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || "EMP"}) • {emp.role?.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* PROJECT MEMBERS MULTI-SELECT */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-black text-slate-900">
                    👥 Select Project Employees ({formMemberIds.length} Selected)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Check employees who belong to this project
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 p-2 space-y-1 bg-slate-50">
                  {employees.map((emp) => {
                    const isSelected = formMemberIds.includes(emp.id);
                    const isLeader = formTeamLeaderId === emp.id;

                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                          isSelected || isLeader
                            ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                            : "hover:bg-white text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected || isLeader}
                            disabled={isLeader}
                            onChange={() => toggleMemberSelection(emp.id)}
                            className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span>
                            {emp.name} ({emp.employeeId})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {isLeader ? "👑 Team Leader" : emp.role?.replace(/_/g, " ")}
                        </span>
                      </label>
                    );
                  })}
                </div>
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
                  {submitting ? "Saving..." : isEditMode ? "✓ Save Changes" : "✓ Create Project"}
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
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Team Leader</span>
                <p className="font-extrabold text-blue-700 text-xs mt-0.5">
                  👑 {selectedProject.teamLeader?.name || "Unassigned"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Team Members</span>
                <p className="font-extrabold text-slate-900 text-xs mt-0.5">
                  👥 {selectedProject.teamMembers?.length || 0} Employees
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
                          {ep.name} <span className="text-[10px] font-mono text-slate-400">({ep.employeeId})</span>
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
    </div>
  );
}
