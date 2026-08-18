"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function EmployeeProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team" | "activity">("overview");

  useEffect(() => {
    // 1. Fetch project details
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.projects) {
          const found = json.projects.find((p: any) => p.id === projectId || p.projectTitle?.toLowerCase().includes(projectId?.toLowerCase()));
          setProject(found || json.projects[0] || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch project tasks
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTasks(json.tasks || []);
        }
      })
      .catch(() => {});
  }, [projectId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  const proj = project || {
    id: projectId || "PROJ-101",
    projectTitle: "OMS Enterprise Portal 2.0",
    clientCompany: "Acme Logistics Corp",
    clientContactPerson: "Alice Smith (VP Ops)",
    clientEmail: "contact@acmelogistics.com",
    startDate: "2026-08-01",
    endDate: "2026-10-18",
    contractValue: 250000,
    status: "IN_PROGRESS",
    priority: "HIGH",
    code: "OMS-2026-001",
    progress: 72,
    manager: "Project Lead",
  };

  const projectTasks = tasks.filter((t) => !t.projectId || t.projectId === proj.id);
  const completedTasksCount = projectTasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          ← Back to Projects
        </button>
        <span className="text-xs text-slate-400 font-mono">/ Projects / {proj.projectTitle}</span>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                {proj.status.replace("_", " ")}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                {proj.priority || "HIGH"} PRIORITY
              </span>
              <span className="text-xs font-mono font-bold text-blue-600">
                Code: {proj.code || `OMS-${proj.id}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              {proj.projectTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/employee/tasks"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-md shadow-blue-600/20 transition"
            >
              Open My Workboard →
            </Link>
          </div>
        </div>

        {/* Progress Bar & Key Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Client Name</span>
            <p className="font-extrabold text-slate-900 dark:text-white">{proj.clientCompany}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Target Deadline</span>
            <p className="font-extrabold text-amber-600 font-mono">
              {new Date(proj.endDate || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} (2 Months)
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Project Budget</span>
            <p className="font-extrabold text-slate-900 dark:text-white font-mono">
              {proj.contractValue ? `₹${proj.contractValue.toLocaleString("en-IN")}` : "Budget not available"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Tasks</span>
            <p className="font-extrabold text-blue-600 font-mono">
              {projectTasks.length} assigned • {completedTasksCount} completed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Project Completion Status</span>
            <span className="text-blue-600 font-mono font-black">{proj.progress || 72}% Completed</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${proj.progress || 72}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-extrabold">
        {(["overview", "tasks", "team", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl capitalize transition cursor-pointer ${
              activeTab === tab
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h2 className="font-black text-slate-900 dark:text-white text-base">Project Scope & Deliverables</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Full-stack production development of Next.js 16 app router architecture, Prisma MySQL ORM models, single login with automatic DB role detection, member shift punch clock ledger, and server-side data isolation.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="font-black text-slate-900 dark:text-white text-base">Key Milestones</h2>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">Phase 1: Architecture & Single Login</p>
                    <p className="text-[11px] text-slate-400">Database schema, Prisma models & Next.js routes</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">COMPLETED</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">Phase 2: Member Shift Punch Clock & 1-Punch Rule</p>
                    <p className="text-[11px] text-slate-400">Attendance ledger and 1 punch per day limit enforcement</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">COMPLETED</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">Phase 3: Topic Discussion & 2-Month Target Release</p>
                    <p className="text-[11px] text-slate-400">Interactive notes, time tracking & completion target</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">IN PROGRESS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h2 className="font-black text-slate-900 dark:text-white text-base">Project Leadership</h2>
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold text-[10px] block uppercase">Project Lead</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">{proj.manager || "Engineering Lead"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] block uppercase">Client Contact</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{proj.clientContactPerson}</span>
                <span className="text-[11px] text-slate-400 block font-mono">{proj.clientEmail}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-black text-slate-900 dark:text-white text-base">Assigned Project Work Items</h2>
          <div className="space-y-3">
            {projectTasks.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{t.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{t.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h2 className="font-black text-slate-900 dark:text-white text-base">Recent Activity Timeline</h2>
          <div className="space-y-3 border-l-2 border-slate-200 dark:border-slate-800 pl-4">
            <div className="space-y-0.5">
              <span className="font-mono text-blue-600 font-bold">10:42 AM</span>
              <p className="font-extrabold text-slate-900 dark:text-white">API Authentication & Role Guards Verified</p>
            </div>
            <div className="space-y-0.5 pt-2">
              <span className="font-mono text-slate-400 font-bold">09:30 AM</span>
              <p className="font-extrabold text-slate-900 dark:text-white">Member Shift Punch Clock Ledger Updated</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
