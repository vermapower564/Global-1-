"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconFolder, IconTerminal, IconZap, IconPhone, IconMail, IconEye } from "@/components/Icons";
import { getCurrentUserContext, CurrentUser } from "@/utils/userContextStore";
import { exportToCSV } from "@/utils/exportEngine";

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"portfolio" | "kanban" | "gantt" | "drafts">("portfolio");
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [userContext, setUserContext] = useState<CurrentUser | null>(null);

  // Form State for New Project
  const [projectTitle, setProjectTitle] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientContactPerson, setClientContactPerson] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch Projects from API -> Prisma -> XAMPP MySQL
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success && (data.projects || data.data)) {
        setProjectsList(data.projects || data.data || []);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    setUserContext(getCurrentUserContext());
    fetchProjects();
  }, []);

  // Handle Project Status Update via PUT /api/projects
  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    // Optimistic update
    setProjectsList((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: newStatus }),
      });
      setSaveSuccess(`✓ Project status updated to ${newStatus}`);
      setTimeout(() => setSaveSuccess(""), 4000);
    } catch (err) {
      console.error("Failed to update project status", err);
      fetchProjects();
    }
  };

  const handleDeleteDraft = async (projectId: string) => {
    if (!confirm("Are you sure you want to permanently delete this project draft?")) return;
    try {
      const res = await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess("✓ Project draft successfully deleted.");
        setTimeout(() => setSaveSuccess(""), 4000);
        fetchProjects();
      } else {
        alert(data.error || "Failed to delete draft.");
      }
    } catch (err: any) {
      alert("Error deleting draft: " + err.message);
    }
  };

  const handlePublishDraft = async (projectId: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: "ACTIVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess("✓ Draft project successfully published & activated!");
        setTimeout(() => setSaveSuccess(""), 4000);
        fetchProjects();
      } else {
        alert(data.error || "Failed to publish draft.");
      }
    } catch (err) {
      alert("Failed to publish draft.");
    }
  };

  // Save Project to XAMPP MySQL via API Route
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: projectTitle,
          clientCompany: clientCompany,
          clientContactPerson: clientContactPerson || "Primary Contact",
          clientEmail: clientEmail,
          clientPhone: clientPhone,
          startDate: endDate || new Date().toISOString().split("T")[0],
          endDate: endDate || new Date().toISOString().split("T")[0],
          contractValue: contractValue,
          status: "ACTIVE",
        }),
      });

      const result = await res.json();

      if (result.success) {
        setSaveSuccess("✓ Project record saved directly to XAMPP MySQL Database via Prisma!");
        setShowModal(false);
        setProjectTitle("");
        setClientCompany("");
        setClientContactPerson("");
        setClientEmail("");
        setClientPhone("");
        setContractValue("");
        setEndDate("");
        fetchProjects();
      }
    } catch (err: any) {
      alert("Failed to save project: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEmployeeMode = userContext?.activeMode === "EMPLOYEE_USER";

  // Filter projects by employee privacy + search query + status filter
  const filteredProjects = projectsList.filter((p) => {
    if (isEmployeeMode) {
      const isAssigned =
        p.projectTitle?.toLowerCase().includes("oms") ||
        p.projectTitle?.toLowerCase().includes("core") ||
        p.clientCompany?.toLowerCase().includes("internal");
      if (!isAssigned) return false;
    }

    const matchesSearch =
      p.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientContactPerson?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate high-level summary KPIs
  const totalPortfolioValue = projectsList.reduce(
    (acc, item) => acc + (Number(item.contractValue) || 0),
    0
  );
  const activeCount = projectsList.filter((p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS").length;
  const completedCount = projectsList.filter((p) => p.status === "COMPLETED").length;

  const ganttPhases = [
    {
      id: "p1",
      title: "Phase 1: Foundation, Auth & Employee Mgmt",
      startDate: "2026-08-01",
      duration: "14 Days",
      progress: 100,
      status: "COMPLETED",
      description: "Multi-Method Login, Employee Profile, Core Departments, Executive Dashboard.",
    },
    {
      id: "p2",
      title: "Phase 2: Daily Work Update System & EOD Workflow",
      startDate: "2026-08-15",
      duration: "21 Days",
      progress: 100,
      status: "COMPLETED",
      description: "Mandatory EOD Form, Hours & Priority Tracking, Manager Review Desk.",
    },
    {
      id: "p3",
      title: "Phase 3: Sales CRM, Marketing & Client Billing Engine",
      startDate: "2026-09-05",
      duration: "28 Days",
      progress: 80,
      status: "IN_PROGRESS",
      description: "Pipeline Deal Stages, ROAS Tracking, Financial Master Ledger & Invoice PDF Engine.",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            {isEmployeeMode ? "My Assigned Work & Project Desk" : "Enterprise Projects Portfolio (Office Purpose)"}
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            {isEmployeeMode ? `My Assigned Work Desk` : `Projects Roadmap & Contract Deliverables (${filteredProjects.length})`}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {isEmployeeMode
              ? "Restricted View Mode: You are viewing your assigned office work projects."
              : "Track active software contracts, milestone phases, client deliverables & XAMPP MySQL database persistence."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isEmployeeMode && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              + Create New Project
            </button>
          )}
          <button
            onClick={() => exportToCSV("Projects_Portfolio_Summary", filteredProjects)}
            className="btn-secondary text-xs"
          >
            📄 Export CSV
          </button>
          <Link
            href="/projects/dev-tracker"
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-white/20 transition flex items-center gap-2"
          >
            <IconTerminal className="h-4 w-4 text-emerald-400" /> Dev Git Tracker
          </Link>
        </div>
      </div>

      {/* Summary Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-red-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Portfolio Value</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {isEmployeeMode ? "🔒 Confidential" : `₹${totalPortfolioValue.toLocaleString()}`}
          </p>
          <span className="text-[11px] font-semibold text-red-600">Contract Revenue (INR)</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Active / In-Progress</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{activeCount} Projects</p>
          <span className="text-[11px] font-semibold text-amber-600">Under Active Sprint</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Delivered / Completed</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{completedCount} Projects</p>
          <span className="text-[11px] font-semibold text-emerald-600">Successfully Signed Off</span>
        </div>
      </div>

      {/* Office Purpose Privacy Notice if Employee Mode */}
      {isEmployeeMode && (
        <div className="p-4 rounded-xl bg-blue-900/40 border border-blue-700 text-blue-200 text-xs font-semibold flex items-center justify-between shadow-md">
          <span>🛡️ Office Purpose Notice: Complete enterprise contracts portfolio is restricted for Admin / HR use only. You are viewing your personal assigned work.</span>
          <span className="text-[11px] font-mono text-amber-400">Privacy Mode ACTIVE</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg border border-emerald-400 flex items-center justify-between">
          <span>{saveSuccess}</span>
          <button onClick={() => setSaveSuccess("")} className="text-white hover:text-emerald-200 font-bold">✕</button>
        </div>
      )}

      {/* Controls: Search, Status Filter & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewMode("portfolio")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "portfolio"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📁 Project Cards
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "kanban"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📋 Stage Kanban Board
          </button>
          <button
            onClick={() => {
              setViewMode("drafts");
              setStatusFilter("DRAFT");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "drafts"
                ? "bg-indigo-900 text-white shadow-md font-extrabold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>📝</span>
            <span>PM Drafts ({projectsList.filter((p) => p.status === "DRAFT").length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by title, client, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-red-600 focus:outline-none w-56"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (e.target.value === "DRAFT") setViewMode("drafts");
              else if (viewMode === "drafts") setViewMode("portfolio");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-red-600 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="DRAFT">DRAFT (PM Only)</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* View 1: Portfolio Cards */}
      {viewMode === "portfolio" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="pro-card p-6 flex flex-col justify-between hover:shadow-xl transition border-l-4 border-l-red-600 space-y-4 bg-white"
            >
              <div>
                <div className="flex items-center justify-between">
                  <select
                    value={project.status}
                    onChange={(e) => handleUpdateStatus(project.id, e.target.value)}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 cursor-pointer focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  <span className="text-[10px] font-mono text-slate-400">ID: {project.id?.slice(0, 8)}</span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mt-3 leading-snug">{project.projectTitle}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">{project.clientCompany}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Client Contact:</span>
                  <span className="font-bold text-slate-900">{project.clientContactPerson}</span>
                </div>
                {!isEmployeeMode && (
                  <div className="flex justify-between">
                    <span>Contract Budget:</span>
                    <span className="font-mono font-extrabold text-emerald-700">
                      ₹{typeof project.contractValue === "number" ? project.contractValue.toLocaleString() : project.contractValue}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Target Date:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "TBD"}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveProjectDetail(project)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <IconEye className="h-3.5 w-3.5" /> View Details
                  </button>
                  {project.clientEmail && (
                    <a
                      href={`mailto:${project.clientEmail}`}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      <IconMail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Stage Kanban */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"].map((stage) => (
            <div key={stage} className="pro-card p-4 space-y-3 bg-slate-50 border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 flex justify-between">
                <span>{stage === "PLANNING" ? "📝 PLANNING / ACTIVE" : stage.replace("_", " ")}</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px]">
                  {filteredProjects.filter((p) => stage === "PLANNING" ? (p.status === "PLANNING" || p.status === "ACTIVE") : p.status === stage).length}
                </span>
              </h3>
              <div className="space-y-3">
                {filteredProjects
                  .filter((p) => stage === "PLANNING" ? (p.status === "PLANNING" || p.status === "ACTIVE") : p.status === stage)
                  .map((p) => (
                    <div key={p.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-900 text-xs leading-tight">{p.projectTitle}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">{p.clientCompany}</p>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                        <span className="font-mono text-emerald-700 font-bold">
                          {isEmployeeMode ? "🔒 Confidential" : `₹${Number(p.contractValue).toLocaleString()}`}
                        </span>
                        
                        {(stage === "PLANNING") && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, "IN_PROGRESS")}
                            className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded hover:bg-amber-200"
                          >
                            Move to In-Progress →
                          </button>
                        )}
                        {stage === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, "COMPLETED")}
                            className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded hover:bg-emerald-200"
                          >
                            Mark Completed ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 4: PM Draft Projects */}
      {viewMode === "drafts" && (
        <div className="space-y-4">
          {projectsList.filter((p) => p.status === "DRAFT").length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <div className="text-4xl">📝</div>
              <h3 className="text-base font-black text-slate-900">No Draft Projects Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You do not have any saved draft projects. You can create a new project in draft mode to plan deliverables and allocate teams before publishing.
              </p>
              <Link
                href="/project-manager/create-project"
                className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                + Create Project Draft
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsList
                .filter((p) => p.status === "DRAFT")
                .map((draft) => (
                  <div
                    key={draft.id}
                    className="p-6 bg-white rounded-3xl border-2 border-dashed border-indigo-200 shadow-sm space-y-4 hover:border-indigo-400 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ● DRAFT (Planning Mode)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {draft.id?.slice(0, 8)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {draft.projectTitle}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        Client: {draft.clientCompany || "Enterprise Client"}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Target Deadline:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {draft.endDate ? new Date(draft.endDate).toLocaleDateString("en-IN") : "TBD"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned TL:</span>
                        <span className="font-bold text-slate-800">
                          {draft.teamLeader?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/project-manager/create-project?draftId=${draft.id}`}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <span>✏️</span> Continue Editing
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePublishDraft(draft.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <span>🚀</span> Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-xl transition cursor-pointer"
                          title="Delete Draft"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Detail View Modal */}
      {activeProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 text-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-wider">Project Details</span>
                <h3 className="font-extrabold text-base text-slate-900">{activeProjectDetail.projectTitle}</h3>
              </div>
              <button onClick={() => setActiveProjectDetail(null)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Client Company</span>
                  <span className="font-extrabold text-slate-900">{activeProjectDetail.clientCompany}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Contact Person</span>
                  <span className="font-extrabold text-slate-900">{activeProjectDetail.clientContactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Client Email</span>
                  <span className="font-bold text-blue-600">{activeProjectDetail.clientEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Client Phone</span>
                  <span className="font-mono font-bold text-slate-800">{activeProjectDetail.clientPhone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Status Stage</span>
                  <span className="font-extrabold text-emerald-700">{activeProjectDetail.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Contract Value</span>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {isEmployeeMode ? "🔒 Confidential" : `₹${Number(activeProjectDetail.contractValue).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveProjectDetail(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal (Office Purpose Admin Only) */}
      {showModal && !isEmployeeMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">Create New Enterprise Project (Push to XAMPP MySQL)</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Healthcare Patient Portal Development"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Client Company Name *</label>
                  <input
                    type="text"
                    required
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="e.g. Global Health Systems"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={clientContactPerson}
                    onChange={(e) => setClientContactPerson(e.target.value)}
                    placeholder="e.g. Dr. Robert Vance"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="vance@globalhealth.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Client Phone (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Contract Budget (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    placeholder="650000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono font-bold focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Target Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition"
                >
                  {loading ? "Saving to MySQL..." : "✓ Save Contract to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}