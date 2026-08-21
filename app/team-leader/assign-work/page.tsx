"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const DEFAULT_SECTIONS = [
  "Frontend",
  "Backend",
  "Database",
  "UI/UX Design",
  "Testing & QA",
  "Deployment & CI/CD",
  "Documentation",
  "Research",
];

function AssignWorkForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preMainTaskId = searchParams.get("mainTaskId") || "";
  const preEmployeeId = searchParams.get("employeeId") || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [mainTaskId, setMainTaskId] = useState(preMainTaskId);
  const [section, setSection] = useState("Frontend");
  const [customSection, setCustomSection] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState(preEmployeeId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0]);
  const [estimatedHours, setEstimatedHours] = useState("8");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/team-leader/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
          if (!preMainTaskId && json.adminMainTasks?.length > 0) {
            setMainTaskId(json.adminMainTasks[0].id);
          }
          if (!preEmployeeId && json.teamMembers?.length > 0) {
            const free = json.teamMembers.find((m: any) => m.workloadStatus === "AVAILABLE");
            setAssignedToUserId(free?.id || json.teamMembers[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch smart employee recommendations
    fetch("/api/team-leader/recommendations")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.recommendations)) {
          setRecommendations(res.recommendations);
          setRequiredSkills(res.requiredSkills || []);
        }
      })
      .catch(() => {});
  }, [preMainTaskId, preEmployeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Task title is required.");
      return;
    }
    if (!assignedToUserId) {
      setErrorMsg("Please select a project member.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const finalSection = section === "CUSTOM" ? (customSection.trim() || "General") : section;
      const selectedMain = data?.adminMainTasks?.find((t: any) => t.id === mainTaskId);
      const projectId = selectedMain?.projectId || data?.ledProjects?.[0]?.id || null;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          projectId,
          parentTaskId: mainTaskId || null,
          section: finalSection,
          assignedToUserId,
          priority,
          status: "PENDING",
          dueDate,
          estimatedHours: parseFloat(estimatedHours) || 8,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setSuccessMsg("✓ Work successfully assigned to team member!");
        setTimeout(() => {
          router.push("/team-leader/progress");
        }, 800);
      } else {
        setErrorMsg(resData.error || "Failed to assign work.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const mainTasks = data?.adminMainTasks || [];
  const teamMembers = data?.teamMembers || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Work Breakdown & Assignment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assign Work to Project Member
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Divide your Admin-assigned deliverables into specific technical sections and assign to available team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/team-leader/team"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl border border-slate-200 transition shrink-0"
          >
            Check Member Capacity →
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          {successMsg}
        </div>
      )}

      {/* Smart Skill-Based Employee Recommendations Card */}
      {recommendations.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Smart Employee Recommendations (Skill Match & Capacity)
              </h3>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Target Skills: {requiredSkills.slice(0, 4).join(", ")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec) => {
              const isSelected = assignedToUserId === rec.id;
              const isHighLoad = rec.currentWorkload >= 80;

              return (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20"
                      : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {rec.avatarUrl ? (
                        <img src={rec.avatarUrl} alt={rec.name} className="h-8 w-8 rounded-xl object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {rec.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{rec.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{rec.role}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      ⭐ {rec.matchScore}% Match
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-extrabold">
                      <span className="text-slate-500">Workload:</span>
                      <span className={isHighLoad ? "text-rose-600 font-black" : "text-slate-800 font-black"}>
                        {rec.currentWorkload}% {isHighLoad ? "⚠️ HIGH LOAD" : `(${rec.availableCapacity}% free)`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isHighLoad ? "bg-rose-500" : rec.currentWorkload > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${rec.currentWorkload}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {rec.skills}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAssignedToUserId(rec.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white hover:bg-slate-200 text-slate-800 border border-slate-300"
                      }`}
                    >
                      {isSelected ? "✓ Selected" : "Assign →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assignment Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold text-slate-700">
          {/* Main Task Selector */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1.5">
            <label className="block font-black text-blue-900">
              📌 Select Admin Main Task (Project Deliverable)
            </label>
            <select
              value={mainTaskId}
              onChange={(e) => setMainTaskId(e.target.value)}
              className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="">-- Standalone Project Work --</option>
              {mainTasks.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.projectTitle}) • Status: {t.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Work Section */}
            <div>
              <label className="block mb-1">Technical Section / Division *</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                {DEFAULT_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
                <option value="CUSTOM">+ Custom Section...</option>
              </select>
            </div>

            {/* Custom Section */}
            {section === "CUSTOM" ? (
              <div>
                <label className="block mb-1">Enter Custom Section Name *</label>
                <input
                  type="text"
                  required
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                  placeholder="e.g. Payment Gateway / Cloud Infrastructure"
                  className="w-full rounded-xl border border-blue-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            ) : (
              /* Assign to Project Member */
              <div>
                <label className="block mb-1">Assign to Project Member *</label>
                <select
                  required
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Team Member --</option>
                  {teamMembers.map((m: any) => {
                    const isAvail = m.workloadStatus === "AVAILABLE";
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.employeeId}) — {isAvail ? "🟢 AVAILABLE" : `🟡 ${m.workloadStatus}`} ({m.activeTaskCount} tasks)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {section === "CUSTOM" && (
              <div className="sm:col-span-2">
                <label className="block mb-1">Assign to Project Member *</label>
                <select
                  required
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Team Member --</option>
                  {teamMembers.map((m: any) => {
                    const isAvail = m.workloadStatus === "AVAILABLE";
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.employeeId}) — {isAvail ? "🟢 AVAILABLE" : `🟡 ${m.workloadStatus}`} ({m.activeTaskCount} tasks)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Task Title */}
            <div className="sm:col-span-2">
              <label className="block mb-1">Task / Deliverable Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement User Authentication API & JWT Middleware"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block mb-1">Description & Acceptance Criteria</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail technical requirements, inputs, expected responses, and deliverable links..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block mb-1">Estimated Hours</label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
              />
            </div>

            {/* Deadline */}
            <div className="sm:col-span-2">
              <label className="block mb-1">Deadline / Target Completion Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/team-leader"
              className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md cursor-pointer text-center"
            >
              {submitting ? "Assigning Work..." : "✓ Assign Work to Team Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamLeaderAssignWorkPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading assign work form...</div>}>
      <AssignWorkForm />
    </Suspense>
  );
}
