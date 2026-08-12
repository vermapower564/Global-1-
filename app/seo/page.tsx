"use client";

import React, { useState, useEffect } from "react";

interface SeoKeywordItem {
  id: string;
  keyword: string;
  searchVolume: string;
  currentRank: number;
  previousRank: number;
  targetUrl: string;
  status: string;
}

export default function SeoPage() {
  const [keywords, setKeywords] = useState<SeoKeywordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKw, setNewKw] = useState({
    keyword: "",
    searchVolume: "12,000/mo",
    currentRank: 5,
    targetUrl: "https://globalwebify.com/oms",
  });

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/seo");
      const json = await res.json();
      if (json.success) {
        setKeywords(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKw),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewKw({ keyword: "", searchVolume: "12,000/mo", currentRank: 5, targetUrl: "https://globalwebify.com/oms" });
        fetchKeywords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 💚 Header Banner - Emerald & Teal SEO Theme */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-emerald-800/40 text-emerald-50">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            SEO & Digital Search Engine Dominance
          </span>
          <h1 className="text-2xl font-black text-emerald-100 tracking-tight mt-1">
            SEO Keyword Tracker & Ranking Matrix ({keywords.length})
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            Monitor Google SERP positions, monthly search volumes, target landing URLs, and ranking movements.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md border border-emerald-400 transition shrink-0"
        >
          + Track New Keyword
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/40 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-emerald-300/80">Tracked Keywords</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{keywords.length}</p>
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Active Monitoring</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/40 border-l-4 border-l-teal-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-emerald-300/80">Top 3 Rankings</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {keywords.filter((k) => k.currentRank <= 3).length} Keywords
          </p>
          <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400">Page #1 Spot</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/40 border-l-4 border-l-cyan-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-emerald-300/80">Average SERP Rank</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">#4.2</p>
          <span className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400">Google India Search</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/40 border-l-4 border-l-amber-500 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-emerald-300/80">Monthly Traffic Potential</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">45.2K</p>
          <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">Organic Clicks</span>
        </div>
      </div>

      {/* SEO Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-emerald-900/40 shadow-xs space-y-4">
        <h2 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-emerald-900/30 pb-3">
          Master SEO Keywords Matrix (Prisma MySQL Backed)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading SEO keywords from MySQL...</div>
        ) : (
          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Target Keyword</th>
                  <th>Monthly Search Volume</th>
                  <th>Current Rank</th>
                  <th>Previous Rank</th>
                  <th>Target Landing URL</th>
                  <th>SERP Trend Status</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-emerald-950/10 transition">
                    <td className="font-extrabold text-slate-900 dark:text-white">{kw.keyword}</td>
                    <td className="font-mono text-xs text-slate-600 dark:text-slate-300">{kw.searchVolume}</td>
                    <td className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">#{kw.currentRank}</td>
                    <td className="font-mono text-xs text-slate-500">#{kw.previousRank}</td>
                    <td className="font-mono text-xs text-cyan-600 dark:text-cyan-400 truncate max-w-xs">{kw.targetUrl}</td>
                    <td>
                      <span className="badge badge-success text-[10px]">{kw.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Keyword */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">Track New Target SEO Keyword</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleAddKeyword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Search Keyword *</label>
                <input
                  type="text"
                  required
                  value={newKw.keyword}
                  onChange={(e) => setNewKw({ ...newKw, keyword: e.target.value })}
                  placeholder="e.g. enterprise erp software india"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Target Landing Page URL *</label>
                <input
                  type="url"
                  required
                  value={newKw.targetUrl}
                  onChange={(e) => setNewKw({ ...newKw, targetUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Search Volume</label>
                  <input
                    type="text"
                    value={newKw.searchVolume}
                    onChange={(e) => setNewKw({ ...newKw, searchVolume: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Current Google Rank</label>
                  <input
                    type="number"
                    value={newKw.currentRank}
                    onChange={(e) => setNewKw({ ...newKw, currentRank: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl">Save & Track</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
