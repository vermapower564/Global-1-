"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    projectTitle: "",
    projectCode: "",
    clientCompany: "",
    clientContactPerson: "",
    clientEmail: "",
    clientPhone: "+91 98765 00000",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
    priority: "HIGH",
    projectType: "Web Application",
    requiredSkills: "React, Next.js, Node.js, MySQL, UI/UX",
    requiredRoles: "Developer, UI/UX Designer, QA Tester",
    techStack: "React 19, Next.js 16, Tailwind CSS, MySQL",
    expectedTeamSize: 5,
    teamLeaderId: "",
    status: "ACTIVE",
    contractValue: 250000,
  });

  useEffect(() => {
    // Fetch Team Leaders & Senior Developers
    fetch("/api/employees")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const eligible = res.data.filter(
            (e: any) => e.role === "TEAM_LEADER" || e.role === "DEVELOPER" || e.role === "PROJECT_MANAGER"
          );
          setTeamLeaders(eligible);
          if (eligible.length > 0) {
            setFormData((prev) => ({ ...prev, teamLeaderId: eligible[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!formData.projectTitle.trim()) {
      setError("Project Name is required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          memberUserIds: formData.teamLeaderId ? [formData.teamLeaderId] : [],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess("✓ Project created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/projects");
        }, 1000);
      } else {
        setError(json.error || "Failed to create project.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🚀</span> Create Enterprise Project
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Define requirements, technology stack, and assign a Team Leader for project execution.
          </p>
        </div>
        <Link
          href="/project-manager"
          className="text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition"
        >
          ← Back
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. General Deliverable Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. E-Commerce Multi-Vendor Platform"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Code</label>
              <input
                type="text"
                placeholder="e.g. ECOM-2026"
                value={formData.projectCode}
                onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Scope & Description</label>
            <textarea
              rows={3}
              placeholder="Outline project objectives, architecture milestones, and key deliverables..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-black focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Client & Timelines */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Client & Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Company *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Corp"
                value={formData.clientCompany}
                onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.clientContactPerson}
                onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Email</label>
              <input
                type="email"
                placeholder="client@apexcorp.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Client Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Deadline / Delivery Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Skills, Roles & Tech Stack */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Skills, Stack & Team Requirements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Required Skills (Comma separated for Smart Matching)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Next.js, Node.js, MySQL, UI/UX"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Team Leaders will use these tags to get automated smart employee recommendations.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Required Roles</label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer, Backend Lead, UI/UX Designer"
                value={formData.requiredRoles}
                onChange={(e) => setFormData({ ...formData, requiredRoles: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Technology Stack & Tools</label>
              <input
                type="text"
                placeholder="e.g. Next.js 16, MySQL, Prisma, Docker, Tailwind CSS"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-black focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Type</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile App (iOS/Android)">Mobile App (iOS/Android)</option>
                <option value="Enterprise Portal">Enterprise Portal / SaaS</option>
                <option value="E-Commerce Store">E-Commerce Store</option>
                <option value="API & Cloud Infrastructure">API & Cloud Infrastructure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Leadership & Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            4. Execution Leadership & Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Assigned Team Leader *</label>
              <select
                required
                value={formData.teamLeaderId}
                onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="">-- Select Team Leader --</option>
                {teamLeaders.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {tl.name} ({tl.employeeId}) — {tl.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Project Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active (In Progress)</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/project-manager"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating Deliverable..." : "🚀 Launch Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
