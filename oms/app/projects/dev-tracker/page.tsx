"use client";

import React, { useState } from "react";
import Link from "next/link";

const initialDevTasks = [
  {
    id: "DEV-401",
    developer: "Roushan Verma",
    project: "OMS Enterprise Portal 2.0",
    commitMsg: "feat: Add Prisma MySQL Schema, RBAC Engine & EOD Evaluation System",
    branch: "main",
    prLink: "github.com/oms/pull/42",
    bugsFound: 0,
    velocityPoints: 13,
    buildStatus: "Success (36/36 prerendered)",
  },
  {
    id: "DEV-402",
    developer: "Amit Kumar",
    project: "Financial Audit Automation",
    commitMsg: "fix: Reconcile GST breakdown and export PDF generator",
    branch: "feature/gst-fix",
    prLink: "github.com/oms/pull/39",
    bugsFound: 1,
    velocityPoints: 8,
    buildStatus: "Success (Pass)",
  },
  {
    id: "DEV-403",
    developer: "Aarav Sharma",
    project: "AI Assistant Copilot Engine",
    commitMsg: "feat: Integrate keyword search & floating copilot drawer",
    branch: "feature/copilot",
    prLink: "github.com/oms/pull/45",
    bugsFound: 0,
    velocityPoints: 10,
    buildStatus: "Success (Pass)",
  },
];

export default function DevTrackerPage() {
  const [tasks, setTasks] = useState(initialDevTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    developer: "Roushan Verma",
    project: "OMS Enterprise Portal 2.0",
    commitMsg: "",
    branch: "main",
    prLink: "github.com/oms/pull/46",
    bugsFound: 0,
    velocityPoints: 5,
  });

  const handleAddCommit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `DEV-${tasks.length + 401}`;
    setTasks([
      {
        ...newTask,
        id,
        buildStatus: "Success (Pass)",
      },
      ...tasks,
    ]);
    setShowAddModal(false);
    setNewTask({ developer: "Roushan Verma", project: "OMS Enterprise Portal 2.0", commitMsg: "", branch: "main", prLink: "github.com/oms/pull/46", bugsFound: 0, velocityPoints: 5 });
  };

  const totalPoints = tasks.reduce((sum, t) => sum + t.velocityPoints, 0);
  const totalBugs = tasks.reduce((sum, t) => sum + t.bugsFound, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Phase 3: Engineering Velocity</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Developer Work Tracker & CI/CD Pipeline</h1>
          <p className="text-xs text-slate-300 mt-1">
            Track Git commits, pull requests, branch names, bug metrics, velocity points, and automated CI/CD deployments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-accent text-xs px-4 py-2.5 shadow-md">
            + Log Git Commit / PR
          </button>
          <Link href="/projects" className="btn-secondary text-xs">
            ← Project Suite
          </Link>
        </div>
      </div>

      {/* KPI Cards for Velocity & Bugs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Sprint Velocity</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalPoints} Story Pts</p>
          <span className="text-[11px] font-semibold text-blue-600">Current Sprint Velocity</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Build Success Rate</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">100%</p>
          <span className="text-[11px] font-semibold text-emerald-600">36/36 Static Routes Prerendered</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Active Bug Count</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalBugs} Open</p>
          <span className="text-[11px] font-semibold text-rose-600">Resolved in Sprint</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Merged PRs</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{tasks.length} PRs</p>
          <span className="text-[11px] font-semibold text-purple-600">Main Branch Merges</span>
        </div>
      </div>

      {/* Modal: Log Commit */}
      {showAddModal && (
        <div className="pro-card p-6 bg-blue-50/50 border-blue-200 space-y-4 max-w-xl mx-auto">
          <h3 className="font-bold text-slate-900 text-sm">Log New Git Commit / Pull Request</h3>
          <form onSubmit={handleAddCommit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commit Message *</label>
              <input
                type="text"
                required
                value={newTask.commitMsg}
                onChange={(e) => setNewTask({ ...newTask, commitMsg: e.target.value })}
                placeholder="feat: Add Kanban Board & Task Dependencies"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={newTask.branch}
                  onChange={(e) => setNewTask({ ...newTask, branch: e.target.value })}
                  placeholder="feature/kanban"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Story Points *</label>
                <input
                  type="number"
                  required
                  value={newTask.velocityPoints}
                  onChange={(e) => setNewTask({ ...newTask, velocityPoints: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" className="btn-accent text-xs">
                Save Commit Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dev Tracker Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Active Engineering Commits & Pull Requests</h2>
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Commit ID</th>
                <th>Developer</th>
                <th>Project</th>
                <th>Git Commit Message</th>
                <th>Branch</th>
                <th>PR Link</th>
                <th>Story Pts</th>
                <th>Bugs</th>
                <th>CI/CD Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs font-bold text-slate-600">{t.id}</td>
                  <td className="font-bold text-slate-900">{t.developer}</td>
                  <td className="text-xs text-slate-700">{t.project}</td>
                  <td className="font-mono text-xs text-slate-800 max-w-xs">{t.commitMsg}</td>
                  <td className="font-mono text-xs text-purple-700">{t.branch}</td>
                  <td>
                    <a
                      href={`https://${t.prLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                    >
                      🔗 Open PR
                    </a>
                  </td>
                  <td className="font-bold text-blue-600">{t.velocityPoints} pts</td>
                  <td className="font-bold text-slate-900">{t.bugsFound}</td>
                  <td>
                    <span className="badge badge-success">{t.buildStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
