"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { IconStar, IconAward, IconCheck } from "@/components/Icons";

const QUICK_TAGS = [
  "🚀 Fast Delivery",
  "✨ High Code Quality",
  "🎯 Great Problem Solver",
  "💬 Clear Communication",
  "🛡️ Reliable & Secure",
  "💡 Creative Solutions",
  "🤝 Highly Recommended",
  "⭐ Exceeded Expectations",
];

export default function PublicFeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const employeeToken = resolvedParams.token || "EMP-8595";

  const [employeeInfo, setEmployeeInfo] = useState<{
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  }>({
    id: employeeToken,
    name: "OMS Specialist",
    role: "Project Engineer",
  });

  // Rating States (1-5)
  const [rating, setRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [timeRating, setTimeRating] = useState(5);

  // Form States
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerRole, setCustomerRole] = useState("");
  const [projectName, setProjectName] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "✨ High Code Quality",
    "🚀 Fast Delivery",
  ]);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultId, setResultId] = useState("");

  useEffect(() => {
    // Attempt to load employee name from backend
    fetch(`/api/employees`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const emp = json.data.find(
            (e: any) =>
              (e.employeeId && e.employeeId.toLowerCase() === employeeToken.toLowerCase()) ||
              (e.id && e.id.toLowerCase() === employeeToken.toLowerCase()) ||
              (e.email && e.email.toLowerCase().includes(employeeToken.toLowerCase()))
          );
          if (emp) {
            setEmployeeInfo({
              id: emp.employeeId || emp.id,
              name: emp.name,
              role: emp.role?.replace(/_/g, " ") || "Software Engineer",
              avatarUrl: emp.avatarUrl,
            });
          }
        }
      })
      .catch(() => {});
  }, [employeeToken]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customerName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (!feedbackText.trim()) {
      setErrorMsg("Please share your feedback or testimonial.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeInfo.id,
          employeeName: employeeInfo.name,
          projectName: projectName || "Client Engagement",
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerCompany: customerCompany.trim(),
          customerRole: customerRole.trim(),
          rating,
          communicationRating: commRating,
          codeQualityRating: qualityRating,
          timelinessRating: timeRating,
          reviewTitle: reviewTitle || `${rating}-Star Client Experience`,
          feedbackText: feedbackText.trim(),
          highlights: selectedTags.join(" • "),
          serviceCategory: employeeInfo.role || "Engineering",
          status: "PUBLISHED",
          verifiedByClient: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultId(data.reviewId || "REV-VERIFIED");
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      setErrorMsg("Network error submitting review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStarPicker = (
    value: number,
    onChange: (val: number) => void,
    label: string,
    description?: string
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <span className="text-xs font-bold text-slate-900 block">{label}</span>
          {description && <span className="text-[11px] text-slate-500">{description}</span>}
        </div>
        <div className="flex items-center gap-1 mt-2 sm:mt-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => onChange(star)}
              className={`p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                star <= value ? "text-amber-400 fill-amber-400" : "text-slate-300"
              }`}
            >
              <svg className="h-6 w-6" fill={star <= value ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {value}.0
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100 flex flex-col justify-between font-sans p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-600/30">
            O
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight">OMS Enterprise</span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-blue-400">
              Verified Client Review Portal
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-extrabold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Verified Link
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full my-6">
        {submitted ? (
          <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-center space-y-6 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
              ✓
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                Review Submitted
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Thank You for Your Feedback!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                Your review for <strong>{employeeInfo.name}</strong> has been securely published and attached to their verified employee profile.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
              <p>Reference Code: <strong>{resultId}</strong></p>
              <p>Rating: <strong>{rating}.0 / 5.0 ⭐</strong></p>
              <p>Status: <span className="text-emerald-700 font-bold">Verified & Published</span></p>
            </div>

            <div className="pt-2">
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
              >
                Go to OMS Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-8">
            {/* Employee Target Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                {employeeInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  Client Review For
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {employeeInfo.name}
                </h3>
                <p className="text-xs text-slate-600 font-medium truncate">
                  {employeeInfo.role} • ID: {employeeInfo.id}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Ratings Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  1. Experience & Quality Ratings
                </h4>
                {renderStarPicker(rating, setRating, "⭐ Overall Satisfaction", "Overall deliverable quality & partnership")}
                {renderStarPicker(commRating, setCommRating, "💬 Communication & Responsiveness", "Updates clarity, availability & response speed")}
                {renderStarPicker(qualityRating, setQualityRating, "🛠️ Technical / Work Quality", "Precision, standards, and cleanliness of work")}
                {renderStarPicker(timeRating, setTimeRating, "⏱️ Timeliness & Schedule", "Adherence to milestone deadlines")}
              </div>

              {/* Compliments / Highlights Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                  2. Select Key Highlights
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tag} {isSelected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Testimonial Text */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  3. Your Review & Testimonial
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Review Headline / Summary
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Exceptional technical leadership and flawless delivery"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Testimonial / Feedback *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share specific achievements, project success, communication quality, or recommendations..."
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none custom-scrollbar"
                  />
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  4. Your Details (Client / Stakeholder)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. David Sterling"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. david@apexsolutions.com"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={customerCompany}
                      onChange={(e) => setCustomerCompany(e.target.value)}
                      placeholder="e.g. Apex Cloud Solutions"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Role / Designation
                    </label>
                    <input
                      type="text"
                      value={customerRole}
                      onChange={(e) => setCustomerRole(e.target.value)}
                      placeholder="e.g. CTO / Product Manager"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Name / Engagement Title
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Enterprise Cloud Platform Migration"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm tracking-wider uppercase transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Submitting Review..." : "⭐ Submit Verified Client Review"}
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                  Protected by OMS Enterprise Quality Assurance System
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4">
        © 2026 OMS Enterprise Systems • All Rights Reserved
      </footer>
    </div>
  );
}
