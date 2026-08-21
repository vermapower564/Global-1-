"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectManagerProgressPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/project-manager/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        }
      })
      .catch((err) => console.warn("Failed loading PM progress:", err))
      .finally(() => setLoading(false));
  }, []);

  const pmProjects = data?.pmProjects || [];
  const workSections = data?.workSections || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              Executive Project Milestones
            </span>
            <span className="text-xs font-bold text-slate-500">• {pmProjects.length} Managed Projects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Project Milestone & Section Progress
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time delivery tracking across projects, work sections, and assigned Team Leaders.
          </p>
        </div>

        <Link
          href="/project-manager"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition shrink-0"
        >
          ← Back to PM Center
        </Link>
      </div>

      {/* Projects and their Sections Breakdown */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            Loading project progress tracker...
          </div>
        ) : pmProjects.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
            No active projects currently managed by you.
          </div>
        ) : (
          pmProjects.map((project: any) => {
            const projSections = workSections.filter((s: any) => s.projectId === project.id);
            const totalSec = projSections.length;
            const completedSec = projSections.filter((s: any) => s.status === "COMPLETED").length;
            const overallPct = totalSec > 0 ? Math.round((completedSec / totalSec) * 100) : 0;

            return (
              <div
                key={project.id}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {project.status}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Client: {project.clientCompany}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{project.projectTitle}</h3>
                    {project.teamLeader?.name && (
                      <p className="text-xs text-indigo-700 mt-0.5 font-medium">
                        👑 Team Leader: <strong>{project.teamLeader.name}</strong> ({project.teamLeader.employeeId})
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-blue-600 font-mono">{overallPct}%</div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Milestones Completed</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${overallPct}%` }}
                  ></div>
                </div>

                {/* Sections Table */}
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Work Sections ({projSections.length})
                  </h4>
                  {projSections.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 font-bold text-center">
                      No work sections created yet for this project.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {projSections.map((sec: any) => (
                        <div
                          key={sec.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {sec.section}
                            </span>
                            <span className="font-mono font-bold text-blue-600">{sec.progress}%</span>
                          </div>
                          <h5 className="font-bold text-slate-900">{sec.title}</h5>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>TL: {sec.teamLeader?.name}</span>
                            <span className="font-bold">{sec.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
