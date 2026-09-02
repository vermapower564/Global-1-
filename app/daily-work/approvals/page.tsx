"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getFilteredWorkUpdates, evaluateWorkUpdate, EODWorkUpdate, WorkStatus } from "@/utils/workUpdateStore";
import { exportToCSV } from "@/utils/exportEngine";

export default function ManagerEODApprovalsPage() {
  const [updates, setUpdates] = useState<EODWorkUpdate[]>([]);
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedItem, setSelectedItem] = useState<EODWorkUpdate | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [remarks, setRemarks] = useState("");

  const refreshList = async () => {
    const local = getFilteredWorkUpdates(deptFilter, statusFilter, searchQuery);
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.set("search", searchQuery);
      const res = await fetch(`/api/daily-work?${query.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((r: any) => ({
          id: r.id,
          employeeName: r.user?.name || "Employee",
          employeeId: r.user?.employeeId || "EMP001",
          department: r.user?.department?.name || "Engineering",
          projectName: r.projectName || "OMS Operations",
          clientName: r.clientName || "Internal",
          date: new Date(r.submittedAt || Date.now()).toISOString().split("T")[0],
          startTime: r.startTime || "09:00 AM",
          endTime: r.endTime || "05:30 PM",
          hoursWorked: r.hoursWorked || 8.0,
          priority: r.priority || "HIGH",
          description: r.description || "Daily Task Work Log",
          achievements: r.achievements || "",
          blockers: r.blockers || "",
          tomorrowPlan: r.tomorrowPlan || "",
          gitCommits: r.gitCommits || "",
          evidenceUrl: r.evidenceUrl,
          evidenceName: r.evidenceName,
          evidenceType: r.evidenceType,
          evidenceSize: r.evidenceSize,
          workEvidence: r.workEvidence || [],
          status: r.status || "PENDING",
          rating: r.rating || 5,
          managerRemarks: r.managerRemarks || "",
          submittedAt: new Date(r.submittedAt || Date.now()).toISOString(),
        }));

        // Filter by dept & status if selected
        const filtered = mapped.filter((item: any) => {
          const matchDept = deptFilter === "All" || item.department === deptFilter;
          const matchStatus = statusFilter === "All" || item.status === statusFilter;
          return matchDept && matchStatus;
        });

        // Merge with local if any missing
        const combined = [...filtered];
        local.forEach((loc) => {
          if (!combined.some((c) => c.id === loc.id)) {
            combined.push(loc);
          }
        });

        setUpdates(combined);
        return;
      }
    } catch (err) {
      console.warn("API fetch fallback to local store:", err);
    }
    setUpdates(local);
  };

  useEffect(() => {
    refreshList();
  }, [deptFilter, statusFilter, searchQuery]);

  const handleEvaluate = async (status: WorkStatus) => {
    if (!selectedItem) return;
    evaluateWorkUpdate(selectedItem.id, status, rating, remarks);

    try {
      await fetch("/api/daily-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          status,
          rating,
          managerRemarks: remarks,
        }),
      });
    } catch (err) {
      console.warn("API evaluate error:", err);
    }

    refreshList();
    setSelectedItem(null);
    setRemarks("");
  };

  const handleExportCSV = () => {
    exportToCSV("EOD_Manager_Evaluations", updates);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Phase 2: EOD Evaluation Engine</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Manager EOD Review & Rating Portal</h1>
          <p className="text-xs text-slate-300 mt-1">
            Review daily work updates, inspect Git commits, evaluate team productivity with 1-5 Star Ratings, and provide feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-secondary text-xs">
            📄 Export EOD CSV
          </button>
          <Link href="/daily-work" className="btn-accent text-xs">
            + Submit EOD Report
          </Link>
        </div>
      </div>

      {/* Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by employee name or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved Only</option>
              <option value="CHANGES_REQUESTED">Revisions Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid: EOD List & Detailed Evaluation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EOD List */}
        <div className="lg:col-span-2 pro-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Daily Work Updates Submitted</h2>
            <span className="text-xs text-slate-400">Total {updates.length} Updates Listed</span>
          </div>

          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>EOD ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Hours</th>
                  <th>Status & Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {updates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No daily work updates match the selected filters.
                    </td>
                  </tr>
                ) : (
                  updates.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-semibold text-slate-600">{item.id}</td>
                      <td>
                        <p className="font-bold text-slate-900">{item.employeeName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.employeeId}</p>
                      </td>
                      <td>{typeof item.department === "object" ? (item.department as any)?.name : item.department}</td>
                      <td className="font-bold text-blue-600">{item.hoursWorked} hrs</td>
                      <td>
                        <div className="space-y-1">
                          <span
                            className={`badge ${
                              item.status === "APPROVED"
                                ? "badge-success"
                                : item.status === "PENDING"
                                ? "badge-warning"
                                : item.status === "CHANGES_REQUESTED"
                                ? "badge-info"
                                : "badge-danger"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.rating && (
                            <div className="text-xs text-amber-500 font-bold">
                              {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setRating(item.rating || 5);
                            setRemarks(item.managerRemarks || "");
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition"
                        >
                          Inspect & Rate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Rating & Evaluation Panel */}
        <div className="pro-card p-6 space-y-5">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Manager Evaluation Desk
          </h2>

          {selectedItem ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-400">{selectedItem.id}</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedItem.employeeName}</p>
                <p className="text-slate-500">
                  {typeof selectedItem.department === "object" ? (selectedItem.department as any)?.name : selectedItem.department} • {selectedItem.hoursWorked} Hours Logged
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800">Task Summary:</span>
                <p className="p-2.5 bg-white border border-slate-200 rounded mt-1 text-slate-700 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.gitCommits && (
                <div>
                  <span className="font-bold text-slate-800">Git Commits / PR Links:</span>
                  <p className="font-mono text-[11px] text-blue-600 bg-blue-50 p-2 rounded mt-1 border border-blue-100">
                    {selectedItem.gitCommits}
                  </p>
                </div>
              )}

              {/* Work Evidence Attachment Section */}
              {((selectedItem.workEvidence && selectedItem.workEvidence.length > 0) || selectedItem.evidenceUrl) && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    📁 Attached Work Evidence Document(s)
                  </span>
                  <div className="space-y-2">
                    {(selectedItem.workEvidence && selectedItem.workEvidence.length > 0
                      ? selectedItem.workEvidence
                      : [
                          {
                            id: "ev-single",
                            fileName: selectedItem.evidenceName || "work-evidence-file",
                            fileType: selectedItem.evidenceType || "application/octet-stream",
                            fileSize: selectedItem.evidenceSize || 0,
                            fileUrl: selectedItem.evidenceUrl!,
                            uploadedAt: selectedItem.submittedAt,
                          },
                        ]
                    ).map((ev, idx) => {
                      const isImage = (ev.fileType || "").startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(ev.fileName || "");
                      const isPdf = (ev.fileType || "").includes("pdf") || (ev.fileName || "").endsWith(".pdf");

                      return (
                        <div key={ev.id || idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-base">{isImage ? "🖼️" : isPdf ? "📄" : "📊"}</span>
                              <div className="truncate">
                                <p className="font-bold text-slate-900 truncate text-[11px]">{ev.fileName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {ev.fileSize ? `${(ev.fileSize / 1024).toFixed(1)} KB` : "Document"} • {ev.fileType || "file"}
                                </p>
                              </div>
                            </div>
                            <a
                              href={ev.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition"
                            >
                              {isPdf ? "📄 View PDF" : isImage ? "🔍 View Image" : "⬇️ Download"}
                            </a>
                          </div>

                          {/* Image Thumbnail Preview */}
                          {isImage && ev.fileUrl && (
                            <div className="relative mt-1 max-h-36 overflow-hidden rounded border border-slate-200">
                              <img
                                src={ev.fileUrl}
                                alt={ev.fileName}
                                className="w-full object-cover max-h-36 rounded hover:opacity-95 transition"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1-5 Star Rating Selector */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Productivity Rating (1 - 5 Stars):</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`h-9 w-9 rounded-lg font-bold text-sm transition ${
                        rating >= star ? "bg-amber-500 text-white shadow-xs" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Manager Remarks */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Manager Remarks / Feedback:</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter productivity feedback or revision notes for employee..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Decision Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleEvaluate("APPROVED")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition shadow-xs text-xs"
                >
                  ✓ Approve EOD Report
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEvaluate("CHANGES_REQUESTED")}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition text-[11px]"
                  >
                    ✏ Request Revisions
                  </button>
                  <button
                    onClick={() => handleEvaluate("REJECTED")}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg transition text-[11px]"
                  >
                    ✕ Reject Update
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an EOD update from the table to inspect details and assign a 1-5 Star productivity rating.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
