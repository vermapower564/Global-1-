"use client";

import React, { useState, useEffect } from "react";
import { getStoredCampaigns, addStoredCampaign, getStoredKeywords, addStoredKeyword, AdCampaign, SeoKeyword } from "@/utils/marketingStore";
import { exportToCSV } from "@/utils/exportEngine";

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);

  const [newCamp, setNewCamp] = useState({
    name: "",
    platform: "Meta Ads" as const,
    budget: 100000,
    adSpend: 50000,
    leadsGenerated: 100,
    ctr: "3.20%",
    impressions: "150,000",
  });

  const [newKw, setNewKw] = useState({
    keyword: "",
    searchVolume: "10,000/mo",
    currentRank: 5,
    targetUrl: "/solutions",
  });

  useEffect(() => {
    setCampaigns(getStoredCampaigns());
    setKeywords(getStoredKeywords());
  }, []);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    addStoredCampaign(newCamp);
    setCampaigns(getStoredCampaigns());
    setShowAddCampaign(false);
  };

  const handleCreateKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    addStoredKeyword(newKw);
    setKeywords(getStoredKeywords());
    setShowAddKeyword(false);
  };

  const totalAdSpend = campaigns.reduce((acc, c) => acc + c.adSpend, 0);
  const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + c.leadsGenerated, 0);
  const avgCpl = totalLeads > 0 ? (totalAdSpend / totalLeads).toFixed(2) : "0.00";
  const burnRate = totalBudget > 0 ? ((totalAdSpend / totalBudget) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">Phase 5: Digital Marketing & SEO</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Digital Marketing, SEO & Analytics Folder</h1>
          <p className="text-xs text-slate-300 mt-1">
            Track multi-channel ad spend (Meta, Google, LinkedIn) in ₹ Rupees, CPL, ROAS, budget burn rate, and Search Console ranks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddCampaign(!showAddCampaign)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
          >
            + Create Campaign
          </button>
          <button
            onClick={() => setShowAddKeyword(!showAddKeyword)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
          >
            + Track Keyword
          </button>
        </div>
      </div>

      {/* Primary Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-red-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Ad Spend & Burn Rate</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalAdSpend.toLocaleString()}</p>
          <span className="text-[11px] font-semibold text-red-600">{burnRate}% Budget Consumed</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Leads Generated</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalLeads}</p>
          <span className="text-[11px] font-semibold text-emerald-600">Verified Inquiries</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase text-slate-400">Average CPL & ROAS</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{avgCpl}</p>
          <span className="text-[11px] font-semibold text-purple-600">4.53x ROAS Multiplier</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-400">Backlinks & GA4 Traffic</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">1,420 Backlinks</p>
          <span className="text-[11px] font-semibold text-amber-600">145,000 Impressions</span>
        </div>
      </div>

      {/* Ad Campaigns Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Active Ad Campaigns (Clear Display)</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Campaign ID</th>
                <th className="p-3">Campaign Name</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Ad Spend / Budget</th>
                <th className="p-3">Leads Generated</th>
                <th className="p-3">CPL</th>
                <th className="p-3">ROAS</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <span className="font-mono text-xs font-extrabold text-red-700 bg-red-100 border border-red-300 px-2 py-1 rounded">
                      {c.id}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                  <td className="p-3 font-bold text-purple-700">{c.platform}</td>
                  <td className="p-3 font-mono text-xs font-bold text-slate-900">
                    ₹{c.adSpend.toLocaleString()} / <span className="text-slate-500">₹{c.budget.toLocaleString()}</span>
                  </td>
                  <td className="p-3 font-extrabold text-emerald-700">{c.leadsGenerated}</td>
                  <td className="p-3 font-mono text-xs font-bold text-slate-800">₹{c.cpl.toFixed(2)}</td>
                  <td className="p-3 font-bold text-red-600">{c.roas}x</td>
                  <td className="p-3 font-bold">
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px]">
                      {c.status}
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
