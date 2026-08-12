"use client";

import React, { useState } from "react";
import Link from "next/link";
import { exportToCSV } from "@/utils/exportEngine";
import {
  IconFolder,
  IconTerminal,
  IconFileText,
  IconUserCheck,
  IconEye,
} from "@/components/Icons";

export interface InternAssignment {
  id: string;
  internName: string;
  department: string;
  taskTitle: string;
  assignedDate: string;
  dueDate: string;
  githubRepo: string;
  status: "Completed & Reviewed" | "In Review" | "Pending Submission";
  grade: string;
  mentorFeedback: string;
}

const initialAssignments: InternAssignment[] = [
  {
    id: "TASK-INT-01",
    internName: "Aditya Raj",
    department: "Development & Engineering",
    taskTitle: "Prisma MySQL Database Migration & Next.js API Routes",
    assignedDate: "2026-07-20",
    dueDate: "2026-07-27",
    githubRepo: "github.com/oms-enterprise/prisma-migration-aditya",
    status: "Completed & Reviewed",
    grade: "A+ (10/10)",
    mentorFeedback: "Flawless database schema execution and zero compile errors.",
  },
  {
    id: "TASK-INT-02",
    internName: "Pooja Nair",
    department: "UI/UX & Graphic Design",
    taskTitle: "Obsidian Red Glassmorphic UI Design System & Figma Kit",
    assignedDate: "2026-07-22",
    dueDate: "2026-07-29",
    githubRepo: "figma.com/file/oms-obsidian-red-ui-pooja",
    status: "Completed & Reviewed",
    grade: "A (9.5/10)",
    mentorFeedback: "Stunning dark theme design with high accessibility contrast.",
  },
  {
    id: "TASK-INT-03",
    internName: "Rohan Mehta",
    department: "Growth & Marketing",
    taskTitle: "Meta Ads Audience Targeting & ROAS Optimization Report",
    assignedDate: "2026-08-01",
    dueDate: "2026-08-08",
    githubRepo: "drive.google.com/marketing-report-rohan",
    status: "In Review",
    grade: "Pending Grade",
    mentorFeedback: "Audience targeting campaign configured; reviewing CTR metrics.",
  },
];

export default function InternAssignmentsPage() {
  const [assignments, setAssignments] = useState<InternAssignment[]>(initialAssignments);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newTask, setNewTask] = useState({
    internName: "Aditya Raj",
    department: "Development & Engineering",
    taskTitle: "",
    dueDate: "2026-08-15",
    githubRepo: "github.com/oms-enterprise/",
  });

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `TASK-INT-0${assignments.length + 1}`;
    const today = new Date().toISOString().split("T")[0];

    const created: InternAssignment = {
      ...newTask,
      id,
      assignedDate: today,
      status: "In Review",
      grade: "Pending Grade",
      mentorFeedback: "Task assigned and awaiting intern code submission.",
    };

    setAssignments([created, ...assignments]);
    setShowAssignModal(false);
    setNewTask({
      internName: "Aditya Raj",
      department: "Development & Engineering",
      taskTitle: "",
      dueDate: "2026-08-15",
      githubRepo: "github.com/oms-enterprise/",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            HR Operations / Intern Work Folder
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            📁 Intern Project Assignments & Code Reviews
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Assign weekly learning modules, evaluate GitHub repository pull requests, and log mentor feedback.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
          >
            + Assign New Project Task
          </button>
          <Link href="/hr/interns" className="btn-secondary text-xs">
            ← Back to Intern Students Directory
          </Link>
        </div>
      </div>

      {/* Modal: Assign New Task */}
      {showAssignModal && (
        <div className="pro-card p-6 bg-slate-900 border-slate-800 text-white space-y-4 animate-in fade-in max-w-xl mx-auto">
          <h3 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
            Assign Project Task to Intern Student
          </h3>
          <form onSubmit={handleAssignTask} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Intern Student *</label>
              <select
                value={newTask.internName}
                onChange={(e) => setNewTask({ ...newTask, internName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Aditya Raj">Aditya Raj (Development & Engineering)</option>
                <option value="Pooja Nair">Pooja Nair (UI/UX Design)</option>
                <option value="Rohan Mehta">Rohan Mehta (Growth & Marketing)</option>
                <option value="Kavya Singhania">Kavya Singhania (Camera Production)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project Task Title *</label>
              <input
                type="text"
                required
                value={newTask.taskTitle}
                onChange={(e) => setNewTask({ ...newTask, taskTitle: e.target.value })}
                placeholder="e.g. Build GraphQL API Gateway"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Repo / Workspace URL *</label>
              <input
                type="text"
                required
                value={newTask.githubRepo}
                onChange={(e) => setNewTask({ ...newTask, githubRepo: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md">
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Assignments Ledger */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Intern Project Submissions & Code Reviews
        </h2>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Intern Name</th>
                <th>Project Task Title</th>
                <th>Assigned / Due Date</th>
                <th>Code Repo URL</th>
                <th>Grade</th>
                <th>Mentor Feedback</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs font-bold text-slate-600">{item.id}</td>
                  <td>
                    <p className="font-bold text-slate-900">{item.internName}</p>
                    <p className="text-[11px] text-slate-500">{item.department}</p>
                  </td>
                  <td className="font-bold text-slate-800 text-xs">{item.taskTitle}</td>
                  <td className="font-mono text-xs text-slate-600">
                    <div>{item.assignedDate}</div>
                    <span className="text-red-600 font-bold text-[10px]">Due: {item.dueDate}</span>
                  </td>
                  <td className="font-mono text-xs text-blue-600 truncate max-w-xs">{item.githubRepo}</td>
                  <td className="font-bold text-emerald-700 text-xs">{item.grade}</td>
                  <td className="text-xs text-slate-600 max-w-xs">{item.mentorFeedback}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === "Completed & Reviewed" ? "badge-success" : "badge-info"
                      }`}
                    >
                      {item.status}
                    </span>
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
