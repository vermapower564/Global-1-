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
          const overdueTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "COMPLETED").length;

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Control Desk</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Project Health & Risk Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate corporate project completion ratios, active milestones, blocked tasks, and automated risk scoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/tasks" className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md">
            Organization Task Center →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading project health engine...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                    p.health === "HEALTHY" ? "bg-emerald-100 text-emerald-800" :
                    p.health === "BLOCKED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {p.health.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    Budget: ₹{p.budget ? p.budget.toLocaleString() : "N/A"}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{p.name}</h3>
                {p.description && <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>}

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>Overall Completion Rate</span>
                    <span className="text-blue-600 font-black">{p.progressRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${p.progressRate}%` }}></div>
                  </div>
                </div>

                {/* Risk Explanation */}
                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                  p.health === "HEALTHY" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  p.health === "BLOCKED" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  💡 <strong className="font-bold">Health Analysis:</strong> {p.riskExplanation}
                </div>
              </div>

              {/* Task Counters Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Total</p>
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm">{p.totalTasks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600">Done</p>
                  <p className="font-extrabold text-emerald-600 text-sm">{p.completedTasks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-rose-600">Blocked</p>
                  <p className="font-extrabold text-rose-600 text-sm">{p.blockedTasks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600">Overdue</p>
                  <p className="font-extrabold text-amber-600 text-sm">{p.overdueTasks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
