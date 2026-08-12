"use client";

import React, { useState, useEffect } from "react";

interface InternTask {
  id: string;
  taskTitle: string;
  dueDate: string;
  githubRepo: string;
  status: string;
  grade: string | null;
  mentorFeedback: string | null;
}

interface InternStudent {
  id: string;
  name: string;
  university: string;
  degree: string;
  department: string;
  mentorName: string;
  stipend: number;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  totalDays: number;
  performanceScore: number;
  completedTasks: number;
  totalTasks: number;
  status: string;
  assignedProject: string;
  offeredFullTimeSalary: number;
  internassignment?: InternTask[];
}

export default function InternsPage() {
  const [interns, setInterns] = useState<InternStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/interns")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setInterns(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 🎓 Header Banner - Teal & Cyan Academy Theme */}
      <div className="bg-gradient-to-r from-teal-950 via-cyan-950 to-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-cyan-800/40 text-cyan-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
            University Relations & Corporate Intern Training Program
          </span>
          <h1 className="text-2xl font-black text-cyan-100 tracking-tight mt-1">
            Intern Student Roster & Task Assignments ({interns.length})
          </h1>
          <p className="text-xs text-cyan-200/80 mt-1">
            Track university student interns, mentors, stipends, GitHub project submissions, grades, and PPO full-time offers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-cyan-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-cyan-300/80">Active Student Interns</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{interns.length}</p>
          <span className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400">IIT / NIT Top Tier</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-cyan-300/80">Average Performance</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">4.8 / 5.0 ⭐</p>
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">High Mentorship Score</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-cyan-300/80">Monthly Stipend</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹25,000</p>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400">Per Intern / Month</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-cyan-900/40 border-l-4 border-l-amber-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-cyan-300/80">PPO Offer Package</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹8.5 LPA</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Full-time Job Offer</span>
        </div>
      </div>

      {/* Interns Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-cyan-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-cyan-900/30 pb-3">
          Intern Student Roster & Task Submissions (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading intern records from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Intern Name</th>
                  <th>University & Degree</th>
                  <th>Assigned Mentor</th>
                  <th>Stipend</th>
                  <th>Project Task</th>
                  <th>Performance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((i) => (
                  <tr key={i.id} className="hover:bg-cyan-950/10 transition">
                    <td>
                      <p className="font-extrabold text-slate-900 dark:text-white">{i.name}</p>
                      <p className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{i.id}</p>
                    </td>
                    <td>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{i.university}</p>
                      <p className="text-[10px] text-slate-500">{i.degree}</p>
                    </td>
                    <td className="font-bold text-slate-700 dark:text-slate-300">{i.mentorName}</td>
                    <td className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">₹{i.stipend.toLocaleString()}/mo</td>
                    <td className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xs">{i.assignedProject}</td>
                    <td className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{i.performanceScore} / 5.0 ⭐</td>
                    <td>
                      <span className="badge badge-success text-[10px]">{i.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
