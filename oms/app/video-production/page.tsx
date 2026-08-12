"use client";

import React, { useState, useEffect } from "react";

interface VideoItem {
  id: string;
  projectTitle: string;
  shootLocation: string;
  cameraLead: string;
  editorName: string;
  renderStage: string;
  status: string;
  versionUrl: string;
  createdAt: string;
}

export default function VideoProductionPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/video-production")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setVideos(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 🎬 Header Banner - Crimson & Purple Studio Theme */}
      <div className="bg-gradient-to-r from-rose-950 via-purple-950 to-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-rose-900/40 text-rose-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
            Video Production & Studio Media Suite
          </span>
          <h1 className="text-2xl font-black text-rose-100 tracking-tight mt-1">
            Video Projects, Shoots & Render Pipeline ({videos.length})
          </h1>
          <p className="text-xs text-rose-200/80 mt-1">
            Manage video shoots, camera leads, editors, 4K rendering stages, and client approval links.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-rose-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-rose-300/80">Active Video Shoots</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{videos.length}</p>
          <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">Studio & On-Location</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-rose-300/80">4K Renders Complete</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {videos.filter((v) => v.status === "FINAL_APPROVED").length}
          </p>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400">Client Signed Off</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-indigo-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-rose-300/80">Editing Editors</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">6 Editors</p>
          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">Premiere & DaVinci</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 border-l-4 border-l-amber-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-rose-300/80">Camera Crew Teams</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">4 Teams</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Sony FX6 & RED Cinema</span>
        </div>
      </div>

      {/* Video Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-rose-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-rose-900/30 pb-3">
          Video Production Master Directory (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading video items from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Video Project Title</th>
                  <th>Shoot Location</th>
                  <th>Camera Lead</th>
                  <th>Editor Name</th>
                  <th>Render Stage</th>
                  <th>Status</th>
                  <th>Version Preview URL</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-rose-950/10 transition">
                    <td className="font-extrabold text-slate-900 dark:text-white">{v.projectTitle}</td>
                    <td className="text-xs text-slate-600 dark:text-slate-300">{v.shootLocation}</td>
                    <td className="font-bold text-slate-800 dark:text-slate-200">{v.cameraLead}</td>
                    <td className="font-bold text-rose-600 dark:text-rose-400">{v.editorName}</td>
                    <td>
                      <span className="badge badge-purple text-[10px]">{v.renderStage}</span>
                    </td>
                    <td>
                      <span className="badge badge-success text-[10px]">{v.status}</span>
                    </td>
                    <td className="font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate max-w-xs">{v.versionUrl}</td>
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
