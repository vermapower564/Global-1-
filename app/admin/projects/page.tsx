"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ProjectHealthItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  progressRate: number;
  health: "HEALTHY" | "AT_RISK" | "BLOCKED";
  riskExplanation: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectHealthItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectsHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const enriched = json.data.map((p: any) => {
          const tasks = p.task || [];
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
          const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
          const blockedTasks = tasks.filter((t: any) => t.status === "BLOCKED").length;
          const overdueTasks = tasks.filter(
            (t: any) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "COMPLETED"
          ).length;

          const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          let health: "HEALTHY" | "AT_RISK" | "BLOCKED" = "HEALTHY";
          let riskExplanation = "Project is executing smoothly within schedule parameters.";

          if (blockedTasks > 0) {
            health = "BLOCKED";
            riskExplanation = `${blockedTasks} task(s) currently blocked by dependency bottlenecks.`;
          } else if (overdueTasks > 0 || progressRate < 40) {
            health = "AT_RISK";
            riskExplanation = `${overdueTasks} task(s) overdue with low completion rate (${progressRate}%).`;
          }

          return {
            ...p,
            totalTasks,
            completedTasks,
            inProgressTasks,
            blockedTasks,
            overdueTasks,
            progressRate,
            health,
            riskExplanation,
          };
        });
        setProjects(enriched);
      }
    } catch (err) {
      console.warn("Failed to fetch project health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Control Desk</span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Project Health & Risk Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Evaluate corporate project completion ratios, active milestones, blocked tasks, and automated risk scoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tasks"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            Organization Task Center →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 font-bold text-xs">Loading project health data...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2 shadow-xs">
          <p className="text-gray-400 italic text-xs">No active projects found in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4 hover:border-blue-500 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-black">{proj.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{proj.description || "Enterprise client contract deliverables."}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    proj.health === "HEALTHY"
                      ? "bg-emerald-100 text-emerald-800"
                      : proj.health === "AT_RISK"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  ● {proj.health}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Overall Milestone Progress</span>
                  <span className="font-mono text-blue-600">{proj.progressRate}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${proj.progressRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Task Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-gray-100">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Total</span>
                  <span className="font-black text-black text-sm">{proj.totalTasks}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase block">Active</span>
                  <span className="font-black text-blue-700 text-sm">{proj.inProgressTasks}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Done</span>
                  <span className="font-black text-emerald-700 text-sm">{proj.completedTasks}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Blocked</span>
                  <span className="font-black text-rose-700 text-sm">{proj.blockedTasks}</span>
                </div>
              </div>

              {/* Risk Assessment Note */}
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200 font-medium">
                <strong>Status Note:</strong> {proj.riskExplanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
