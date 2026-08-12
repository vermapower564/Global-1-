"use client";

import React, { useState, useEffect } from "react";
import { getStoredMediaShoots, MediaShootLog } from "@/utils/mediaStore";
import { exportToCSV } from "@/utils/exportEngine";

export default function MediaPage() {
  const [shoots, setShoots] = useState<MediaShootLog[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<MediaShootLog | null>(null);

  const [newShoot, setNewShoot] = useState({
    projectTitle: "",
    clientName: "Acme Corp",
    shootLocation: "Studio A / Corporate HQ",
    shootDate: new Date().toISOString().split("T")[0],
    cameraOperator: "Mohit Sen (Camera Team Lead)",
    editorAssigned: "Rahul Sharma (Video Editor)",
    equipmentUsed: "Sony FX6 4K, G-Master Lenses, Aputure 600d Light",
    rawDriveLink: "drive.google.com/raw-footage-new",
    renderStatus: "Raw Logged" as const,
    deliveryVersion: "v1.0 Raw",
  });

  useEffect(() => {
    setShoots(getStoredMediaShoots());
  }, []);

  const handleCreateShootLog = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `SHT-20${shoots.length + 1}`;
    const updated = [{ ...newShoot, id }, ...shoots];
    setShoots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("oms_media_shoots", JSON.stringify(updated));
    }
    setShowLogModal(false);
    setNewShoot({
      projectTitle: "",
      clientName: "Acme Corp",
      shootLocation: "Studio A / Corporate HQ",
      shootDate: new Date().toISOString().split("T")[0],
      cameraOperator: "Mohit Sen (Camera Team Lead)",
      editorAssigned: "Rahul Sharma (Video Editor)",
      equipmentUsed: "Sony FX6 4K, G-Master Lenses, Aputure 600d Light",
      rawDriveLink: "drive.google.com/raw-footage-new",
      renderStatus: "Raw Logged",
      deliveryVersion: "v1.0 Raw",
    });
  };

  const handleUpdateStatus = (shootId: string, status: MediaShootLog["renderStatus"], version: string) => {
    const updated = shoots.map((s) => (s.id === shootId ? { ...s, renderStatus: status, deliveryVersion: version } : s));
    setShoots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("oms_media_shoots", JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-purple p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Phase 5: Creative & Media Production</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Camera Team Operations & Video Editing Production Hub</h1>
          <p className="text-xs text-purple-100 mt-1">
            Manage video shoots, camera gear checkouts, raw footage drive links, DaVinci Resolve color grading, rendering pipelines, and version delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogModal(!showLogModal)}
            className="bg-white text-purple-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-md hover:bg-slate-100 transition"
          >
            📹 + Log New Video Shoot
          </button>
          <button
            onClick={() => exportToCSV("Camera_Team_Shoots", shoots)}
            className="bg-purple-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-purple-700 transition"
          >
            📄 Export Shoots CSV
          </button>
        </div>
      </div>

      {/* Production & Video Editing KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Camera Team Lead</span>
          <p className="text-lg font-extrabold text-slate-900 mt-1">Mohit Sen</p>
          <span className="text-[11px] font-semibold text-purple-600">Lead Cinematographer</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Lead Video Editor</span>
          <p className="text-lg font-extrabold text-slate-900 mt-1">Rahul Sharma</p>
          <span className="text-[11px] font-semibold text-amber-600">DaVinci Resolve / Premiere Pro</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Editing Pipeline</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">4K ProRes 422</p>
          <span className="text-[11px] font-semibold text-blue-600">Color Graded & Sound Mixed</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Rendered Deliveries</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{shoots.length} Projects</p>
          <span className="text-[11px] font-semibold text-emerald-600">100% Client Satisfaction</span>
        </div>
      </div>

      {/* Form: Log New Shoot Drawer */}
      {showLogModal && (
        <div className="pro-card p-6 bg-purple-50/50 border-purple-200 space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm">Log New Camera Team Video Shoot</h3>
          <form onSubmit={handleCreateShootLog} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={newShoot.projectTitle}
                onChange={(e) => setNewShoot({ ...newShoot, projectTitle: e.target.value })}
                placeholder="e.g. Acme Brand Identity Video"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={newShoot.clientName}
                onChange={(e) => setNewShoot({ ...newShoot, clientName: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shoot Location *</label>
              <input
                type="text"
                required
                value={newShoot.shootLocation}
                onChange={(e) => setNewShoot({ ...newShoot, shootLocation: e.target.value })}
                placeholder="e.g. Main HQ Studio A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Camera Operator *</label>
              <input
                type="text"
                required
                value={newShoot.cameraOperator}
                onChange={(e) => setNewShoot({ ...newShoot, cameraOperator: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Editor Assigned *</label>
              <input
                type="text"
                required
                value={newShoot.editorAssigned}
                onChange={(e) => setNewShoot({ ...newShoot, editorAssigned: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Raw Drive Link *</label>
              <input
                type="text"
                required
                value={newShoot.rawDriveLink}
                onChange={(e) => setNewShoot({ ...newShoot, rawDriveLink: e.target.value })}
                placeholder="drive.google.com/raw-footage"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Camera Equipment Checked Out *</label>
              <input
                type="text"
                required
                value={newShoot.equipmentUsed}
                onChange={(e) => setNewShoot({ ...newShoot, equipmentUsed: e.target.value })}
                placeholder="Sony FX6 4K, G-Master 24-70mm f2.8, Wireless Audio, Aputure Light"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowLogModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md">
                Save Shoot Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Production Pipeline & Video Editing Desk Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Camera Team Shoot Logs & Video Editor Rendering Pipeline
        </h2>
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Shoot ID</th>
                <th>Project Title & Client</th>
                <th>Location & Date</th>
                <th>Camera Operator & Video Editor</th>
                <th>Equipment Checkout</th>
                <th>Raw Drive Link</th>
                <th>Rendering Status</th>
                <th>Version</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shoots.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs font-bold text-slate-600">{s.id}</td>
                  <td>
                    <p className="font-bold text-slate-900">{s.projectTitle}</p>
                    <p className="text-xs text-slate-500">{s.clientName}</p>
                  </td>
                  <td className="text-xs">
                    <p className="text-slate-800">{s.shootLocation}</p>
                    <p className="font-mono text-[10px] text-slate-400">{s.shootDate}</p>
                  </td>
                  <td className="text-xs">
                    <p className="font-bold text-purple-700">Cam: {s.cameraOperator}</p>
                    <p className="font-bold text-amber-700">Edit: {s.editorAssigned}</p>
                  </td>
                  <td className="text-xs max-w-xs text-slate-600">{s.equipmentUsed}</td>
                  <td>
                    <a
                      href={`https://${s.rawDriveLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                    >
                      📁 Open Drive
                    </a>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.renderStatus === "Rendered"
                          ? "badge-success"
                          : s.renderStatus === "In Editing"
                          ? "badge-warning"
                          : s.renderStatus === "Color Graded"
                          ? "badge-info"
                          : "badge-purple"
                      }`}
                    >
                      {s.renderStatus}
                    </span>
                  </td>
                  <td className="font-mono text-xs font-bold text-slate-800">{s.deliveryVersion}</td>
                  <td>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          s.id,
                          s.renderStatus === "Raw Logged"
                            ? "In Editing"
                            : s.renderStatus === "In Editing"
                            ? "Color Graded"
                            : s.renderStatus === "Color Graded"
                            ? "Rendered"
                            : "Delivered",
                          s.renderStatus === "Raw Logged"
                            ? "v1.1 Rough Cut"
                            : s.renderStatus === "In Editing"
                            ? "v1.2 Color Graded"
                            : s.renderStatus === "Color Graded"
                            ? "v2.0 Final Render"
                            : "v2.0 Final Client Approved"
                        )
                      }
                      className="text-[11px] font-bold text-purple-700 hover:underline bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition whitespace-nowrap"
                    >
                      🎬 Advance Render
                    </button>
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
