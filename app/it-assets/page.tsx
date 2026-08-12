"use client";

import React, { useState, useEffect } from "react";

interface ITAssetItem {
  id: string;
  assetName: string;
  category: string;
  serialNumber: string;
  allocatedToUserId: string | null;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    employeeId: string;
    email: string;
  };
}

export default function ITAssetsPage() {
  const [assets, setAssets] = useState<ITAssetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/it-assets")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setAssets(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 🖥️ Header Banner - Slate & Amber Hardware IT Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-zinc-900 to-amber-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-amber-900/40 text-amber-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
            Corporate IT Infrastructure & Device Inventory
          </span>
          <h1 className="text-2xl font-black text-amber-100 tracking-tight mt-1">
            IT Asset Allocation & Hardware Inventory ({assets.length})
          </h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Track company MacBooks, laptops, workstations, serial numbers, allocation status, and staff assignees.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-amber-900/40 border-l-4 border-l-amber-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Total IT Devices</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{assets.length}</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Company Hardware</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-amber-900/40 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Assigned Devices</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {assets.filter((a) => a.status === "Assigned").length}
          </p>
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Allocated to Staff</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-amber-900/40 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Available Inventory</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {assets.filter((a) => a.status === "Available").length}
          </p>
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">Ready to Deploy</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-amber-900/40 border-l-4 border-l-rose-600 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-amber-300/80">Under Maintenance</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">0</p>
          <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">IT Health Check OK</span>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-amber-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-amber-900/30 pb-3">
          Hardware Assets Ledger (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading IT assets from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Device Name</th>
                  <th>Category</th>
                  <th>Hardware Serial Number</th>
                  <th>Allocated Employee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-amber-950/10 transition">
                    <td className="font-mono text-xs font-extrabold text-amber-700 dark:text-amber-400">{a.id}</td>
                    <td className="font-bold text-slate-900 dark:text-white">{a.assetName}</td>
                    <td>
                      <span className="badge badge-purple text-[10px]">{a.category}</span>
                    </td>
                    <td className="font-mono text-xs text-slate-700 dark:text-slate-300">{a.serialNumber}</td>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-white">{a.user?.name || "Unassigned Stock"}</p>
                      {a.user && <p className="font-mono text-[10px] text-slate-500">{a.user.employeeId}</p>}
                    </td>
                    <td>
                      <span className={`badge ${a.status === "Assigned" ? "badge-success" : "badge-neutral"}`}>
                        {a.status}
                      </span>
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
