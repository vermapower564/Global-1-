"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconStar, IconAward, IconZap, IconSearch, IconFileText } from "@/components/Icons";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    avgRating: 5.0,
    avgCommunication: 5.0,
    avgCodeQuality: 5.0,
    avgTimeliness: 5.0,
    satisfactionRate: 100,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("ALL");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (review: any) => {
    const newStatus = review.status === "FEATURED" ? "PUBLISHED" : "FEATURED";
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r)));
        setActionSuccess(`✓ Review status updated to ${newStatus}`);
        setTimeout(() => setActionSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to remove this client review?")) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.filter((r) => r.id !== id));
        setActionSuccess("✓ Review deleted from database.");
        setTimeout(() => setActionSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      r.customerName?.toLowerCase().includes(q) ||
      r.customerCompany?.toLowerCase().includes(q) ||
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.feedbackText?.toLowerCase().includes(q);

    const matchR =
      filterRating === "ALL" ||
      (filterRating === "5" && r.rating === 5) ||
      (filterRating === "FEATURED" && r.status === "FEATURED");

    return matchQ && matchR;
  });

  // Calculate Employee Leaderboard
  const employeeMap: Record<string, { name: string; id: string; count: number; avgRating: number; sumRating: number }> = {};
  reviews.forEach((r) => {
    const key = r.employeeId || r.employeeName;
    if (!employeeMap[key]) {
      employeeMap[key] = {
        name: r.employeeName,
        id: r.employeeId,
        count: 0,
        sumRating: 0,
        avgRating: 5.0,
      };
    }
    employeeMap[key].count++;
    employeeMap[key].sumRating += Number(r.rating) || 5;
    employeeMap[key].avgRating = Number((employeeMap[key].sumRating / employeeMap[key].count).toFixed(1));
  });

  const leaderboard = Object.values(employeeMap).sort((a, b) => b.avgRating - a.avgRating || b.count - a.count);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Executive Monitor
            </span>
            <span className="text-xs font-bold text-slate-500">• Quality & Client Retention</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Client Reviews & NPS Command
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Organization-wide customer feedback monitor, employee quality scorecards, client testimonial curation, and retention analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/feedback/EMP001"
            target="_blank"
            className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold hover:bg-blue-100 transition"
          >
            🔗 Open Public Review Form
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold animate-in fade-in">
          {actionSuccess}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Org Customer Rating
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
              <IconStar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {metrics.avgRating.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 5.0</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-emerald-600">Enterprise High Quality</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Total Client Reviews
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <IconAward className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {reviews.length}
            </span>
            <span className="text-xs font-bold text-slate-400">Verified</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-500">Across all active accounts</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Client Satisfaction
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <IconZap className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {metrics.satisfactionRate}%
            </span>
            <span className="text-xs font-bold text-emerald-600">Satisfaction</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-500">Positive sentiment ratio</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Featured Testimonials
            </span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <IconFileText className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {reviews.filter((r) => r.status === "FEATURED").length}
            </span>
            <span className="text-xs font-bold text-slate-400">Highlighted</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-purple-600">Curated showcase</p>
        </div>
      </div>

      {/* Top Performers Leaderboard */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>🏆</span>
            <span>Top-Rated Specialists Leaderboard</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Ranked by client rating</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {leaderboard.slice(0, 4).map((emp, idx) => (
            <div
              key={emp.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 relative overflow-hidden"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                #{idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">{emp.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{emp.id}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-amber-500 text-xs">★</span>
                  <span className="text-xs font-bold font-mono text-slate-900">{emp.avgRating}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({emp.count} reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by specialist, client, company, project, or review text..."
            className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute left-3.5 top-3 text-slate-400">
            <IconSearch className="h-4 w-4" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "5", "FEATURED"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterRating(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterRating === t ? "bg-blue-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t === "ALL" ? "All Reviews" : t === "5" ? "5 ★ Stars" : "✨ Featured Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-500">No reviews found matching criteria.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      For: {rev.employeeName} ({rev.employeeId})
                    </span>
                    {rev.status === "FEATURED" && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ✨ Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1.5">
                    {rev.customerName} • <span className="text-slate-500 font-semibold">{rev.customerCompany}</span> ({rev.customerRole || "Client"})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={s <= rev.rating ? "text-amber-400 text-sm" : "text-slate-200 text-sm"}>
                        ★
                      </span>
                    ))}
                    <span className="text-xs font-mono font-black text-slate-900 ml-1">{rev.rating}.0</span>
                  </div>

                  <button
                    onClick={() => handleToggleFeatured(rev)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    {rev.status === "FEATURED" ? "Unfeature" : "⭐ Feature"}
                  </button>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800">"{rev.reviewTitle}"</h4>
                <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  "{rev.feedbackText}"
                </p>
              </div>

              {rev.responseComment && (
                <div className="text-xs text-blue-800 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                  <span className="font-bold">Specialist Response:</span> {rev.responseComment}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
