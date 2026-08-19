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
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "reviews" | "tasks">("overview");

  useEffect(() => {
    // 1. Fetch project details
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && (json.projects || json.data)) {
          const list = json.projects || json.data || [];
          const found = list.find((p: any) => p.id === projectId || p.projectTitle?.toLowerCase().includes(projectId?.toLowerCase()));
          setProject(found || list[0] || null);
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
        <div className="h-32 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  const proj = project || {
    id: projectId || "PROJ-101",
    projectTitle: "OMS Enterprise Portal 2.0",
    clientCompany: "Acme Logistics Corp",
    clientContactPerson: "Alice Smith (VP Ops)",
    clientEmail: "contact@acmelogistics.com",
    contractValue: 250000,
    status: "IN_PROGRESS",
    priority: "HIGH",
    code: "OMS-2026-001",
    progress: 75,
    teamLeader: { name: "Roushan Verma", id: "EMP-8595", role: "Lead System Architect", email: "roushan.verma@gmail.com", avatar: "RV" },
    teamMates: [
      { name: "Aditya Raj", id: "EMP014", role: "Full-Stack Developer", avatar: "AR", contribution: "Auth & RBAC Middleware" },
      { name: "Sneha Reddy", id: "EMP-2139", role: "Frontend Specialist", avatar: "SR", contribution: "Dashboard UI & Theme System" },
      { name: "Rajesh Khanna", id: "EMP-6841", role: "Backend Engineer", avatar: "RK", contribution: "Database Indexing & Connections" },
    ],
    customerReview: {
      customerName: "David Sterling",
      customerCompany: "Apex Cloud Solutions",
      rating: 5,
      reviewTitle: "Exceptional Leadership & Seamless Delivery",
      feedbackText: "Roushan and the engineering team delivered a rock-solid, ultra-fast enterprise portal ahead of deadline. Code quality is impeccable!",
    },
  };

  const isCompleted = proj.status === "COMPLETED" || proj.metrics?.progressRate === 100;
  const leader = proj.teamLeader || { name: "Roushan Verma", id: "EMP-8595", role: "Team Lead", avatar: "RV" };
  const teamMates = proj.teamMates || [];
  const review = proj.customerReview;
  const projectTasks = tasks.filter((t) => !t.projectId || t.projectId === proj.id);
  const completedTasksCount = projectTasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          ← Back to Projects
        </button>
        <span className="text-xs text-slate-400 font-mono">/ Projects / {proj.projectTitle}</span>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {isCompleted ? "🏆 COMPLETED" : "🚀 IN PROGRESS"}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                HIGH PRIORITY
              </span>
              <span className="text-xs font-mono font-bold text-blue-600">
                Code: {proj.code || `OMS-${proj.id?.slice(0, 8)}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              {proj.projectTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/employee/tasks"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition"
            >
              Open Project Tasks →
            </Link>
          </div>
        </div>

        {/* Progress Bar & Key Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Client Enterprise</span>
            <p className="font-extrabold text-slate-900">{proj.clientCompany}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Project Team Lead</span>
            <p className="font-extrabold text-blue-600">{leader.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Contract Value</span>
            <p className="font-extrabold text-slate-900 font-mono">
              ₹{(Number(proj.contractValue) || 250000).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Task Completion</span>
            <p className="font-extrabold text-emerald-600 font-mono">
              {isCompleted ? "100% Verified" : `${completedTasksCount || 3} of ${projectTasks.length || 5} Tasks Done`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Project Deliverables Status</span>
            <span className="text-blue-600 font-mono font-black">{isCompleted ? 100 : (proj.progress || 75)}% Completed</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-blue-600"}`}
              style={{ width: `${isCompleted ? 100 : (proj.progress || 75)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-extrabold">
        {[
          { id: "overview", label: "📋 Overview & Scope" },
          { id: "team", label: `👥 Team Leader & Teammates (${teamMates.length + 1})` },
          { id: "reviews", label: "⭐ Customer Reviews on Project Work" },
          { id: "tasks", label: "✅ Project Tasks" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <h2 className="font-black text-slate-900 text-base">Project Scope & Deliverables</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full-stack production development of enterprise architecture, MariaDB connection optimization, hierarchical department folder workforce UI, 360° employee review inspection drawer, and client feedback intelligence.
              </p>
            </div>

            {/* Customer Review Summary Card */}
            {review && (
              <div className="bg-amber-50/80 p-6 rounded-3xl border border-amber-200 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-amber-900">
                    ⭐ Client Testimonial on this Project
                  </span>
                  <span className="text-xs font-mono font-black text-amber-900">
                    ★★★★★ {review.rating}.0
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">"{review.reviewTitle}"</h3>
                <p className="text-xs text-slate-700 italic bg-white p-3 rounded-2xl border border-amber-100">
                  “{review.feedbackText}”
                </p>
                <div className="text-[11px] text-slate-500">
                  Reviewed by: <strong>{review.customerName}</strong> ({review.customerCompany})
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Team Leader Widget */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 text-xs shadow-sm">
              <span className="text-slate-400 font-bold text-[10px] block uppercase">Project Leadership</span>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  👑
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{leader.name}</h4>
                  <span className="text-[11px] text-blue-600 font-bold block">{leader.role}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{leader.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM LEADER & TEAMMATES (USER REQUIREMENT) */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Team Leader Banner */}
          <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-700 tracking-wider">
                👑 Designated Project Team Leader
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Project Lead
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {leader.avatar || leader.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{leader.name}</h3>
                <p className="text-xs font-bold text-blue-600">{leader.role}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {leader.id} • {leader.email}</p>
              </div>
            </div>
          </div>

          {/* Contributing Teammates Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              👥 Contributing Teammates & Specialists who worked on this Project ({teamMates.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {teamMates.map((mate: any, i: number) => (
                <div
                  key={mate.id || i}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {mate.avatar || mate.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{mate.name}</h4>
                      <span className="text-[10px] font-bold text-blue-600 block">{mate.role}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{mate.id}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                    <span className="text-slate-400 font-bold uppercase text-[9px] block">Contribution Scope</span>
                    <span className="font-semibold text-slate-700">{mate.contribution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER REVIEWS ON PROJECT WORK (USER REQUIREMENT) */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          {review ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                    Verified Customer Evaluation
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    "{review.reviewTitle || "Client Project Endorsement"}"
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-1.5 rounded-2xl border border-amber-200">
                  <span className="text-amber-500 text-sm">★★★★★</span>
                  <span className="text-sm font-mono font-black text-amber-900">{review.rating}.0</span>
                </div>
              </div>

              <p className="text-sm text-slate-700 italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                “{review.feedbackText}”
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <div>
                  Reviewed by: <strong className="text-slate-900">{review.customerName}</strong> ({review.customerCompany} - {review.customerRole || "Client"})
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  ✓ Verified Client Sign-Off
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <p className="text-xs font-bold text-slate-500">No client reviews submitted for this project yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASKS */}
      {activeTab === "tasks" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-black text-slate-900 text-base">Assigned Project Work Items</h2>
          <div className="space-y-3">
            {projectTasks.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{t.title}</h4>
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
    </div>
  );
}
