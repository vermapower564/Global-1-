"use client";

import React, { useState } from "react";
import Link from "next/link";
import { exportToCSV } from "@/utils/exportEngine";
import { IconPalette, IconEye, IconFileText, IconZap, IconFolder } from "@/components/Icons";

export interface DesignAssetItem {
  id: string;
  assetTitle: string;
  platform: string;
  format: string;
  designerName: string;
  status: "IN_DESIGN" | "CLIENT_REVIEW" | "APPROVED";
  revisions: number;
  scheduledDate: string;
  engagement: string;
  previewColor: string;
  assetUrl?: string;
}

const initialAssets: DesignAssetItem[] = [
  {
    id: "DSGN-1001",
    assetTitle: "Q3 Enterprise ERP Product Showcase Infographic",
    platform: "LinkedIn & Twitter",
    format: "PNG (1080x1350px)",
    designerName: "Ananya Roy (Graphic Designer)",
    status: "APPROVED",
    revisions: 2,
    scheduledDate: "2026-08-06",
    engagement: "4.8k Reach",
    previewColor: "from-blue-600 to-indigo-700",
  },
  {
    id: "DSGN-1002",
    assetTitle: "Behind the Scenes Production Teaser Banner",
    platform: "Instagram & YouTube Shorts",
    format: "MP4 / Reel Banner (1080x1920px)",
    designerName: "Ananya Roy (Graphic Designer)",
    status: "CLIENT_REVIEW",
    revisions: 1,
    scheduledDate: "2026-08-08",
    engagement: "12.5k Views",
    previewColor: "from-purple-600 to-pink-600",
  },
  {
    id: "DSGN-1003",
    assetTitle: "Customer Success Story: Acme Case Study",
    platform: "LinkedIn Article & Web Hero",
    format: "Figma Vector (1920x1080px)",
    designerName: "Ananya Roy (Graphic Designer)",
    status: "IN_DESIGN",
    revisions: 3,
    scheduledDate: "2026-08-12",
    engagement: "Pending Publish",
    previewColor: "from-emerald-600 to-teal-700",
  },
  {
    id: "DSGN-1004",
    assetTitle: "OMS Mobile App Dark Mode UI Kit Preview",
    platform: "Dribbble & Behance",
    format: "PSD / Illustrator (4K)",
    designerName: "Ananya Roy (Graphic Designer)",
    status: "APPROVED",
    revisions: 1,
    scheduledDate: "2026-08-04",
    engagement: "8.2k Likes",
    previewColor: "from-rose-600 to-red-700",
  },
];

export default function DesignPage() {
  const [assets, setAssets] = useState<DesignAssetItem[]>(initialAssets);
  const [viewMode, setViewMode] = useState<"gallery" | "table" | "kanban">("gallery");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newAsset, setNewAsset] = useState({
    title: "",
    platform: "LinkedIn & Instagram",
    format: "PNG (1080x1080px)",
    designer: "Ananya Roy (Graphic Designer)",
    scheduledDate: new Date().toISOString().split("T")[0],
    engagement: "Pending Publish",
    status: "IN_DESIGN" as const,
  });

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `DSGN-10${assets.length + 1}`;
    const colors = [
      "from-blue-600 to-indigo-700",
      "from-purple-600 to-pink-600",
      "from-emerald-600 to-teal-700",
      "from-amber-600 to-orange-700",
    ];
    const previewColor = colors[assets.length % colors.length];

    const newItem: DesignAssetItem = {
      id,
      assetTitle: newAsset.title,
      platform: newAsset.platform,
      format: newAsset.format,
      designerName: newAsset.designer,
      status: newAsset.status,
      revisions: 0,
      scheduledDate: newAsset.scheduledDate,
      engagement: newAsset.engagement,
      previewColor,
    };

    setAssets([newItem, ...assets]);
    setShowAddModal(false);
    setNewAsset({
      title: "",
      platform: "LinkedIn & Instagram",
      format: "PNG (1080x1080px)",
      designer: "Ananya Roy (Graphic Designer)",
      scheduledDate: new Date().toISOString().split("T")[0],
      engagement: "Pending Publish",
      status: "IN_DESIGN",
    });

    setToastMsg(`✓ Graphic asset "${newAsset.title}" added to Design Folder!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Upload Design Image File -> /api/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const newDocItem: DesignAssetItem = {
          id: `DSGN-${Date.now().toString().slice(-4)}`,
          assetTitle: file.name.replace(/\.[^/.]+$/, ""),
          platform: "Uploaded Graphic Asset",
          format: file.name.split(".").pop()?.toUpperCase() || "IMAGE",
          designerName: "Ananya Roy (Graphic Designer)",
          status: "APPROVED",
          revisions: 0,
          scheduledDate: new Date().toISOString().split("T")[0],
          engagement: "Uploaded File",
          previewColor: "from-indigo-600 to-purple-700",
          assetUrl: data.url,
        };
        setAssets([newDocItem, ...assets]);
        setToastMsg(`✓ File "${data.fileName}" uploaded directly to Design Server disk!`);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleToggleApproval = (id: string) => {
    setAssets(
      assets.map((p) => {
        if (p.id === id) {
          const nextStatus =
            p.status === "IN_DESIGN"
              ? "CLIENT_REVIEW"
              : p.status === "CLIENT_REVIEW"
              ? "APPROVED"
              : "IN_DESIGN";
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-purple-600 text-white font-extrabold text-xs p-4 rounded-2xl shadow-xl border border-purple-400 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-purple p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-purple-900">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
            Phase 5: Creative Operations & Graphic Assets Folder
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Design & Creative Media Gallery ({assets.length})
          </h1>
          <p className="text-xs text-purple-100 mt-1">
            Visual graphic assets gallery, Figma templates, high-contrast approval tables & server uploaded design files.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-white hover:bg-slate-100 text-purple-950 font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
          >
            + Create Graphic Asset
          </button>
          <label
            htmlFor="design-file-upload"
            className="bg-purple-900 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg border border-purple-700 cursor-pointer shadow-md transition inline-flex items-center gap-1.5"
          >
            {isUploading ? "Uploading..." : " Upload Design File"}
          </label>
          <input
            id="design-file-upload"
            type="file"
            accept="image/*,.psd,.ai,.pdf,.svg"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={() => exportToCSV("Graphic_Design_Assets", assets)}
            className="bg-purple-950 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-purple-800 transition"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Lead Graphic Designer</span>
          <p className="text-lg font-extrabold text-slate-900 mt-1">Ananya Roy</p>
          <span className="text-[11px] font-semibold text-purple-600">Figma & Adobe Suite</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Approved Assets</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {assets.filter((a) => a.status === "APPROVED").length} Assets
          </p>
          <span className="text-[11px] font-semibold text-emerald-600">Ready for Publish</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Avg Revision Rate</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">1.8 Turnarounds</p>
          <span className="text-[11px] font-semibold text-blue-600">High Precision</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Monthly Impressions</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">85.4k</p>
          <span className="text-[11px] font-semibold text-amber-600">Social Reach</span>
        </div>
      </div>

      {/* Add Graphic Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white">Create New Graphic Asset Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Asset Title / Infographic Name *</label>
                <input
                  type="text"
                  required
                  value={newAsset.title}
                  onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                  placeholder="e.g. Q4 Cloud Security Banner Infographic"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Target Channels *</label>
                  <input
                    type="text"
                    required
                    value={newAsset.platform}
                    onChange={(e) => setNewAsset({ ...newAsset, platform: e.target.value })}
                    placeholder="LinkedIn & Twitter"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Format / Dimensions *</label>
                  <input
                    type="text"
                    required
                    value={newAsset.format}
                    onChange={(e) => setNewAsset({ ...newAsset, format: e.target.value })}
                    placeholder="PNG (1080x1080px)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Graphic Designer *</label>
                  <input
                    type="text"
                    required
                    value={newAsset.designer}
                    onChange={(e) => setNewAsset({ ...newAsset, designer: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={newAsset.scheduledDate}
                    onChange={(e) => setNewAsset({ ...newAsset, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition"
                >
                  ✓ Save Graphic Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Switcher: Visual Gallery vs Master Table vs Kanban */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setViewMode("gallery")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            viewMode === "gallery"
              ? "bg-purple-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          🖼️ Visual Asset Gallery Cards
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            viewMode === "table"
              ? "bg-purple-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📋 High-Contrast Master Table
        </button>
        <button
          onClick={() => setViewMode("kanban")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            viewMode === "kanban"
              ? "bg-purple-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📊 Approval Stage Kanban Board
        </button>
      </div>

      {/* VIEW 1: Visual Asset Gallery Cards */}
      {viewMode === "gallery" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="pro-card overflow-hidden flex flex-col justify-between hover:shadow-2xl transition border-t-4 border-t-purple-600 group"
            >
              {/* Visual Thumbnail Banner */}
              <div className={`h-36 bg-gradient-to-tr ${asset.previewColor} p-4 flex flex-col justify-between relative`}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-extrabold text-white bg-black/40 px-2 py-0.5 rounded border border-white/20">
                    {asset.id}
                  </span>
                  <span
                    className={`badge font-bold text-[10px] ${
                      asset.status === "APPROVED"
                        ? "bg-emerald-500 text-white"
                        : asset.status === "CLIENT_REVIEW"
                        ? "bg-amber-400 text-amber-950"
                        : "bg-purple-400 text-purple-950"
                    }`}
                  >
                    {asset.status.replace("_", " ")}
                  </span>
                </div>

                <div className="text-white">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/80">{asset.format}</span>
                  <h3 className="text-sm font-extrabold text-white leading-tight drop-shadow-sm truncate">{asset.assetTitle}</h3>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-5 space-y-3 bg-white flex-1 flex flex-col justify-between text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Platform Channels:</span>
                    <span className="font-bold text-blue-600">{asset.platform}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Graphic Designer:</span>
                    <span className="font-extrabold text-purple-800">{asset.designerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Revisions:</span>
                    <span className="font-mono font-bold text-slate-800">{asset.revisions} Iterations</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-emerald-700 font-bold">{asset.engagement}</span>
                  <button
                    onClick={() => handleToggleApproval(asset.id)}
                    className="text-[11px] font-extrabold text-white bg-slate-900 hover:bg-purple-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Advance Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: High-Contrast Master Table */}
      {viewMode === "table" && (
        <div className="pro-card p-6 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
            Graphic Designer Master Table (Clear Visibility & High Contrast)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Graphic Asset Title</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Format / Dimensions</th>
                  <th className="p-3">Designer</th>
                  <th className="p-3">Approval Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {assets.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <span className="font-mono text-xs font-extrabold text-purple-800 bg-purple-100 border border-purple-300 px-2 py-1 rounded">
                        {p.id}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 max-w-xs">{p.assetTitle}</td>
                    <td className="p-3 font-bold text-blue-600">{p.platform}</td>
                    <td className="p-3 font-mono text-slate-700 font-semibold">{p.format}</td>
                    <td className="p-3 font-bold text-purple-800">{p.designerName}</td>
                    <td className="p-3 font-bold">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] border ${
                          p.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : p.status === "CLIENT_REVIEW"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-purple-100 text-purple-900 border-purple-300"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleApproval(p.id)}
                        className="text-[11px] font-bold text-white bg-slate-900 hover:bg-purple-700 px-3 py-1.5 rounded-lg transition"
                      >
                        Advance Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Approval Stage Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["IN_DESIGN", "CLIENT_REVIEW", "APPROVED"] as const).map((stage) => (
            <div key={stage} className="pro-card p-4 space-y-3 bg-slate-50 border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 flex justify-between">
                <span>{stage.replace("_", " ")}</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-mono">
                  {assets.filter((a) => a.status === stage).length}
                </span>
              </h3>
              <div className="space-y-3">
                {assets
                  .filter((a) => a.status === stage)
                  .map((a) => (
                    <div key={a.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                      <span className="font-mono text-[10px] font-bold text-purple-700">{a.id}</span>
                      <p className="font-extrabold text-slate-900 text-xs leading-snug">{a.assetTitle}</p>
                      <p className="text-[11px] text-blue-600 font-semibold">{a.platform}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
