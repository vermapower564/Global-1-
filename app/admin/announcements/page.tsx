"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/utils/userContextStore";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  targetDepartmentName?: string;
  targetUserName?: string;
  senderName: string;
  senderRole: string;
  recipientsCount: number;
  status: string;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("GENERAL");
  const [audience, setAudience] = useState("ALL_EMPLOYEES");
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Selected Detail Modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        fetch("/api/departments").catch(() => null),
        fetch("/api/employees").catch(() => null),
      ]);
      if (deptRes && deptRes.ok) {
        const dJson = await deptRes.json();
        if (dJson.success) setDepartments(dJson.departments || dJson.data || []);
      }
      if (empRes && empRes.ok) {
        const eJson = await empRes.json();
        if (eJson.success) setEmployees(eJson.employees || eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load departments or employees:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchDependencies();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg("Please enter both a title and message for the announcement.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const targetDept = departments.find((d) => d.id === targetDepartmentId);
      const targetEmp = employees.find((em) => em.id === targetUserId || em.employeeId === targetUserId);

      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          audience,
          targetDepartmentId: audience === "DEPARTMENT" ? targetDepartmentId : null,
          targetDepartmentName: audience === "DEPARTMENT" ? targetDept?.name : null,
          targetUserId: audience === "INDIVIDUAL_EMPLOYEE" ? targetUserId : null,
          targetUserName: audience === "INDIVIDUAL_EMPLOYEE" ? targetEmp?.name : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish announcement.");
      }

      setSuccessMsg(data.message || "Announcement published successfully!");
      setTitle("");
      setMessage("");
      setType("GENERAL");
      setAudience("ALL_EMPLOYEES");
      setTargetDepartmentId("");
      setTargetUserId("");
      setIsCreateModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeStyle = (t: string) => {
    switch ((t || "").toUpperCase()) {
      case "HOLIDAY":
        return {
          icon: "???",
          label: "Holiday",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "CELEBRATION":
        return {
          icon: "??",
          label: "Celebration",
          badge: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "MEETING":
        return {
          icon: "??",
          label: "Meeting",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "IMPORTANT":
        return {
          icon: "??",
          label: "Important",
          badge: "bg-amber-50 text-amber-800 border-amber-300",
        };
      case "URGENT":
        return {
          icon: "??",
          label: "Urgent Alert",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
        };
      default:
        return {
          icon: "??",
          label: "General",
          badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
    }
  };

  const getAudienceLabel = (a: Announcement) => {
    switch (a.audience) {
      case "ALL_EMPLOYEES":
        return `?? All Employees (${a.recipientsCount || "All"})`;
      case "DEPARTMENT":
        return `?? ${a.targetDepartmentName || "Department"}`;
      case "TEAM":
        return `?? Team (${a.recipientsCount || 1})`;
      case "INDIVIDUAL_EMPLOYEE":
        return `?? ${a.targetUserName || "Employee"}`;
      default:
        return "?? All Employees";
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.senderName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === "ALL" || a.type.toUpperCase() === typeFilter.toUpperCase();
    return matchesSearch && matchesType;
  });

  const totalHolidays = announcements.filter((a) => a.type === "HOLIDAY" || a.type === "CELEBRATION").length;
  const totalUrgent = announcements.filter((a) => a.type === "URGENT" || a.type === "IMPORTANT").length;
  const totalRecipients = announcements.reduce((sum, a) => sum + (a.recipientsCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6 font-sans">
      {/* Header & Broadcast CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-md">
              ??
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Company Announcements & Broadcasts
              </h1>
              <p className="text-xs text-blue-300 font-medium">
                Broadcast official holiday notices, celebrations, and alerts directly to employee notification areas.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition cursor-pointer"
        >
          <span>?</span>
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:underline cursor-pointer">
            ?
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:underline cursor-pointer">
            ?
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Total Broadcasts
          </span>
          <p className="text-2xl font-black text-slate-900">{announcements.length}</p>
          <span className="text-[10px] text-slate-400">All-time company notices</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
            Holidays & Celebrations
          </span>
          <p className="text-2xl font-black text-emerald-700">{totalHolidays}</p>
          <span className="text-[10px] text-slate-400">Festive & office days off</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
            Urgent & Important
          </span>
          <p className="text-2xl font-black text-rose-700">{totalUrgent}</p>
          <span className="text-[10px] text-slate-400">High-priority operational alerts</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
            Notifications Delivered
          </span>
          <p className="text-2xl font-black text-blue-700">{totalRecipients}</p>
          <span className="text-[10px] text-slate-400">Delivered to employee inboxes</span>
        </div>
      </div>

      {/* Filter & History Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Broadcast History
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredAnnouncements.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 w-56 font-sans"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="GENERAL">General</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="CELEBRATION">Celebration</option>
              <option value="MEETING">Meeting</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Title & Message</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Target Audience</th>
                <th className="py-3.5 px-4">Broadcast Sender</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin text-2xl">?</div>
                    <p className="mt-2 font-bold text-xs">Loading announcements from database...</p>
                  </td>
                </tr>
              ) : filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center space-y-2">
                    <span className="text-3xl block">??</span>
                    <p className="font-extrabold text-slate-800 text-sm">No announcements found</p>
                    <p className="text-xs text-slate-400">
                      Click "Create Announcement" above to broadcast your first company announcement.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map((a) => {
                  const typeStyle = getTypeStyle(a.type);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 max-w-xs">
                        <span className="font-extrabold text-slate-900 block text-xs truncate">
                          {a.title}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {a.message}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeStyle.badge}`}
                        >
                          <span>{typeStyle.icon}</span>
                          <span>{typeStyle.label}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-800">
                        {getAudienceLabel(a)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{a.senderName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.senderRole}</span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-[11px] font-mono text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ? {a.status || "PUBLISHED"}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedAnnouncement(a)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] rounded-xl transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden text-slate-900 font-sans my-8 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
                  <span>??</span>
                  <span>Broadcast Company Announcement</span>
                </h3>
                <p className="text-xs text-blue-300">
                  Deliver official notification to all employees in real-time.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ?
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-5">
              {/* Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Announcement Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "GENERAL", label: "General", icon: "??", desc: "Company update" },
                    { id: "HOLIDAY", label: "Holiday", icon: "???", desc: "Day off / Holiday" },
                    { id: "CELEBRATION", label: "Celebration", icon: "??", desc: "Annual / Event" },
                    { id: "MEETING", label: "Meeting", icon: "??", desc: "All-hands / Call" },
                    { id: "IMPORTANT", label: "Important", icon: "??", desc: "Action required" },
                    { id: "URGENT", label: "Urgent Alert", icon: "??", desc: "Emergency notice" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        type === t.id
                          ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-600/20"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <span className="font-black text-xs text-slate-900">{t.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Company Holiday / Annual Celebration 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-blue-600"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g., The office will remain closed on 28 August 2026 due to the company celebration. Wishing everyone a wonderful day!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-blue-600 font-sans leading-relaxed"
                />
              </div>

              {/* Audience Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "ALL_EMPLOYEES", label: "All Employees", icon: "??" },
                    { id: "DEPARTMENT", label: "Department", icon: "??" },
                    { id: "TEAM", label: "Team / Role", icon: "??" },
                    { id: "INDIVIDUAL_EMPLOYEE", label: "Individual", icon: "??" },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setAudience(aud.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                        audience === aud.id
                          ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="mr-1.5">{aud.icon}</span>
                      <span>{aud.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Audience Options */}
              {audience === "DEPARTMENT" && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700 block">
                    Select Target Department
                  </label>
                  <select
                    value={targetDepartmentId}
                    onChange={(e) => setTargetDepartmentId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audience === "INDIVIDUAL_EMPLOYEE" && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700 block">
                    Select Individual Employee
                  </label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((em) => (
                      <option key={em.id} value={em.id}>
                        {em.name} ({em.employeeId} � {em.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Live Preview Card */}
              {title.trim() && (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Live Employee Notification Preview:
                  </span>
                  <div className="p-3 bg-white border border-blue-300 rounded-xl shadow-xs space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          getTypeStyle(type).badge
                        }`}
                      >
                        <span>{getTypeStyle(type).icon}</span>
                        <span>{getTypeStyle(type).label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Just now</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900">{title}</h5>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {message || "Announcement message description..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">?</span>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span>??</span>
                      <span>Publish to Employees</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 font-sans animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    getTypeStyle(selectedAnnouncement.type).badge
                  }`}
                >
                  <span>{getTypeStyle(selectedAnnouncement.type).icon}</span>
                  <span>{getTypeStyle(selectedAnnouncement.type).label}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(selectedAnnouncement.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {selectedAnnouncement.title}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.message}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Target Audience
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {getAudienceLabel(selectedAnnouncement)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Delivered To
                  </span>
                  <span className="font-extrabold text-blue-600 font-mono">
                    {selectedAnnouncement.recipientsCount} Employees
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Sender
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {selectedAnnouncement.senderName} ({selectedAnnouncement.senderRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Status
                  </span>
                  <span className="font-extrabold text-emerald-600">
                    ? {selectedAnnouncement.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
