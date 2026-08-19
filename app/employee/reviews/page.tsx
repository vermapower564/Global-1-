"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconStar, IconAward, IconMail, IconSearch, IconZap } from "@/components/Icons";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeReviewsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    avgRating: 5.0,
    avgCommunication: 5.0,
    avgCodeQuality: 5.0,
    avgTimeliness: 5.0,
    satisfactionRate: 100,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite Client Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteProject, setInviteProject] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  // Log Feedback Modal States
  const [showLogModal, setShowLogModal] = useState(false);
  const [logClientName, setLogClientName] = useState("");
  const [logClientCompany, setLogClientCompany] = useState("");
  const [logClientEmail, setLogClientEmail] = useState("");
  const [logRating, setLogRating] = useState(5);
  const [logTitle, setLogTitle] = useState("");
  const [logFeedback, setLogFeedback] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Inline Response States
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    const u = getCurrentUserContext();
    setCurrentUser(u);
    loadReviews(u?.employeeId || u?.id);
  }, []);

  const loadReviews = async (empId?: string) => {
    setLoading(true);
    try {
      const url = empId ? `/api/reviews?employeeId=${empId}` : "/api/reviews";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPublicLink = () => {
    const empId = currentUser?.employeeId || currentUser?.id || "EMP-8595";
    const publicUrl = `${window.location.origin}/feedback/${empId}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSending(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const res = await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: inviteEmail.trim(),
          clientName: inviteName.trim(),
          employeeName: currentUser?.name || "Team Specialist",
          employeeId: currentUser?.employeeId || "EMP-8595",
          projectName: inviteProject.trim() || "Recent Project Delivery",
          customNote: inviteNote.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInviteSuccess(`✓ Review invitation sent to ${inviteEmail}!`);
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteEmail("");
          setInviteName("");
          setInviteProject("");
          setInviteNote("");
          setInviteSuccess("");
        }, 2000);
      } else {
        setInviteError(data.error || "Failed to send invitation.");
      }
    } catch (err) {
      setInviteError("Network error. Please try again.");
    } finally {
      setInviteSending(false);
    }
  };

  const handleLogManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentUser?.employeeId || "EMP-8595",
          employeeName: currentUser?.name || "Specialist",
          customerName: logClientName.trim(),
          customerCompany: logClientCompany.trim() || "Independent Client",
          customerEmail: logClientEmail.trim() || "client@verified.com",
          rating: logRating,
          reviewTitle: logTitle.trim() || "Direct Client Praise",
          feedbackText: logFeedback.trim(),
          highlights: "Client Endorsement • Direct Feedback",
          status: "PUBLISHED",
          verifiedByClient: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowLogModal(false);
        setLogClientName("");
        setLogClientCompany("");
        setLogClientEmail("");
        setLogTitle("");
        setLogFeedback("");
        loadReviews(currentUser?.employeeId || currentUser?.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogSubmitting(false);
    }
  };

  const handleSaveResponse = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseComment: replyText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setReviews(
          reviews.map((r) =>
            r.id === reviewId ? { ...r, responseComment: replyText.trim(), respondedAt: new Date() } : r
          )
        );
        setReplyingId(null);
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to save response:", err);
    } finally {
      setReplySubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.feedbackText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.projectName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "ALL" ||
      (ratingFilter === "5" && r.rating === 5) ||
      (ratingFilter === "4" && r.rating === 4) ||
      (ratingFilter === "FEATURED" && r.status === "FEATURED");

    return matchesSearch && matchesRating;
  });

  const empDisplayId = currentUser?.employeeId || currentUser?.id || "EMP-8595";
  const empDisplayName = currentUser?.name || "Employee";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 font-sans text-slate-900">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Pro-Advance Module
            </span>
            <span className="text-xs font-bold text-slate-500">• Client Satisfaction & NPS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Reviews & Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Collect verified customer testimonials, share feedback links, monitor multi-dimensional ratings, and build your client credibility portfolio.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyPublicLink}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition text-xs font-extrabold cursor-pointer shadow-xs"
          >
            <span>🔗</span>
            <span>{copiedLink ? "✓ Link Copied!" : "Copy Review Link"}</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-extrabold cursor-pointer shadow-md shadow-blue-600/20"
          >
            <IconMail className="h-4 w-4" />
            <span>Invite Client for Review</span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition text-xs font-extrabold cursor-pointer shadow-sm"
          >
            <span>✍️</span>
            <span>Log Client Praise</span>
          </button>
        </div>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Rating */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Overall Rating
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
              <IconStar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {metrics.avgRating.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                className={`h-4 w-4 ${s <= Math.round(metrics.avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-[11px] font-bold text-emerald-600 ml-1">Top 5% Tier</span>
          </div>
        </div>

        {/* Card 2: Total Client Reviews */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Verified Reviews
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <IconAward className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {reviews.length}
            </span>
            <span className="text-xs font-bold text-slate-400">Testimonials</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-500">
            100% Client-authenticated feedback
          </p>
        </div>

        {/* Card 3: Satisfaction Rate */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Satisfaction Rate
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <IconZap className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {metrics.satisfactionRate}%
            </span>
            <span className="text-xs font-bold text-emerald-600 font-bold">Excellent</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-500">
            Based on 5-Star & 4-Star Ratings
          </p>
        </div>

        {/* Card 4: Quality & Timeliness Indices */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Quality & Timeliness
          </span>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-600">Code/Work Quality</span>
              <span className="font-mono text-slate-900">{metrics.avgCodeQuality.toFixed(1)} / 5</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(metrics.avgCodeQuality / 5) * 100}%` }}></div>
            </div>

            <div className="flex justify-between text-[11px] font-bold pt-1">
              <span className="text-slate-600">Communication & Timeliness</span>
              <span className="font-mono text-slate-900">{metrics.avgTimeliness.toFixed(1)} / 5</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(metrics.avgTimeliness / 5) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, company, keywords, project..."
            className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
          />
          <span className="absolute left-3.5 top-3 text-slate-400">
            <IconSearch className="h-4 w-4" />
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Reviews" },
            { id: "5", label: "5 ★ Stars Only" },
            { id: "4", label: "4 ★ Stars" },
            { id: "FEATURED", label: "✨ Featured" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRatingFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                ratingFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-600">Loading customer reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⭐
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Reviews Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No customer reviews match your search or filter criteria. Send an invitation to your clients to receive your first testimonial!
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition"
            >
              Invite Client for Review
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Header: Client info & Rating */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                    {rev.clientAvatar || rev.customerName?.slice(0, 2).toUpperCase() || "CL"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        {rev.customerName}
                      </h3>
                      {rev.verifiedByClient && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          ✓ Verified Client
                        </span>
                      )}
                      {rev.status === "FEATURED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          ✨ Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {rev.customerRole || "Stakeholder"} • <strong>{rev.customerCompany || "Client"}</strong> • Project: <span className="text-blue-600 font-semibold">{rev.projectName || "OMS Delivery"}</span>
                    </p>
                  </div>
                </div>

                {/* Stars and Date */}
                <div className="text-left sm:text-right">
                  <div className="flex items-center sm:justify-end gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        className={`h-4 w-4 ${s <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs font-black font-mono text-slate-800 ml-1">
                      {rev.rating}.0
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                    {new Date(rev.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Review Title & Highlights */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  "{rev.reviewTitle || "Client Endorsement"}"
                </h4>
                {rev.highlights && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rev.highlights.split("•").map((h: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-bold border border-slate-200"
                      >
                        {h.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Content */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal italic relative">
                <span className="text-blue-500 font-serif font-black text-lg mr-1">“</span>
                {rev.feedbackText}
                <span className="text-blue-500 font-serif font-black text-lg ml-1">”</span>
              </div>

              {/* Multi-Dimensional Ratings Breakdown Pill */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-bold bg-white px-3 py-2 rounded-xl border border-slate-100">
                <span>💬 Communication: <strong className="text-slate-800">{rev.communicationRating || 5}/5</strong></span>
                <span>🛠️ Quality: <strong className="text-slate-800">{rev.codeQualityRating || 5}/5</strong></span>
                <span>⏱️ Timeliness: <strong className="text-slate-800">{rev.timelinessRating || 5}/5</strong></span>
              </div>

              {/* Employee Response Section */}
              {rev.responseComment ? (
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                      Your Official Response
                    </span>
                    <button
                      onClick={() => {
                        setReplyingId(rev.id);
                        setReplyText(rev.responseComment);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 font-medium">
                    {rev.responseComment}
                  </p>
                </div>
              ) : replyingId === rev.id ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-blue-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    Write Official Response to {rev.customerName}:
                  </span>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Thank the client for their partnership and feedback..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveResponse(rev.id)}
                      disabled={replySubmitting}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {replySubmitting ? "Saving..." : "Post Response"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setReplyingId(rev.id);
                      setReplyText("");
                    }}
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>💬 Add Public Response</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Invite Client Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  Client Engagement
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Invite Client for Review
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {inviteSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {inviteSuccess}
              </div>
            )}

            {inviteError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {inviteError}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. client.lead@company.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={inviteProject}
                  onChange={(e) => setInviteProject(e.target.value)}
                  placeholder="e.g. Enterprise Cloud Migration"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Personal Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  placeholder="e.g. Thank you for the great collaboration on our last sprint release!"
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSending}
                  className="w-2/3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {inviteSending ? "Sending Invitation..." : "Send Review Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Manual Praise Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Offline Records
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Log Client Feedback / Praise
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogManualReview} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={logClientName}
                    onChange={(e) => setLogClientName(e.target.value)}
                    placeholder="e.g. David Sterling"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Company
                  </label>
                  <input
                    type="text"
                    value={logClientCompany}
                    onChange={(e) => setLogClientCompany(e.target.value)}
                    placeholder="e.g. Apex Cloud"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Star Rating (1-5)
                </label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setLogRating(st)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        logRating === st
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {st} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  placeholder="e.g. Flawless sprint delivery"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Praise or Feedback Received *
                </label>
                <textarea
                  rows={3}
                  required
                  value={logFeedback}
                  onChange={(e) => setLogFeedback(e.target.value)}
                  placeholder="Paste email praise or transcribe verbal client compliments..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="w-2/3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {logSubmitting ? "Recording..." : "Save Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
