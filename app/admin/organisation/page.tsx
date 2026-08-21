"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

type TabType = "PROJECT_MANAGERS" | "TEAM_LEADERS" | "EMPLOYEES";
type PersonProfileTab = "WORK_OVERVIEW" | "ORG_STRUCTURE" | "ATTENDANCE_LEAVES" | "ACCOUNT_MANAGEMENT";
type TaskStatusFilter = "ALL" | "COMPLETED" | "IN_PROGRESS" | "PENDING" | "IN_REVIEW" | "BLOCKED";

export default function AdminOrganisationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("PROJECT_MANAGERS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<{
    projectManagers: any[];
    teamLeaders: any[];
    employees: any[];
    projects: any[];
    departments: any[];
  }>({
    projectManagers: [],
    teamLeaders: [],
    employees: [],
    projects: [],
    departments: [],
  });

  // Selected Person (opens full authorized profile)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [profileTab, setProfileTab] = useState<PersonProfileTab>("WORK_OVERVIEW");

  // Task Details Modal
  const [activeTaskModal, setActiveTaskModal] = useState<any | null>(null);

  // Employee Workboard State
  const [empWorkboardProjectFilter, setEmpWorkboardProjectFilter] = useState("ALL");
  const [empWorkboardStatusTab, setEmpWorkboardStatusTab] = useState<TaskStatusFilter>("ALL");

  // Tab 1 Filters: Project Managers
  const [pmSearch, setPmSearch] = useState("");
  const [pmStatusFilter, setPmStatusFilter] = useState("ALL");
  const [pmDeptFilter, setPmDeptFilter] = useState("ALL");

  // Tab 2 Filters: Team Leaders
  const [tlSearch, setTlSearch] = useState("");
  const [tlStatusFilter, setTlStatusFilter] = useState("ALL");
  const [tlProjectFilter, setTlProjectFilter] = useState("ALL");

  // Tab 3 Filters: Employees
  const [empSearch, setEmpSearch] = useState("");
  const [empProjectFilter, setEmpProjectFilter] = useState("ALL");
  const [empTLFilter, setEmpTLFilter] = useState("ALL");
  const [empStatusFilter, setEmpStatusFilter] = useState("ALL");
  const [empPage, setEmpPage] = useState(1);
  const EMP_PER_PAGE = 8;

  // -------------------------------------------------------------
  // Account Management State
  // -------------------------------------------------------------
  const [editAccountData, setEditAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    departmentId: "",
    isActive: true,
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState("");
  const [accountError, setAccountError] = useState("");

  // -------------------------------------------------------------
  // OTP-Protected Bank Details State
  // -------------------------------------------------------------
  const [unmaskedBankData, setUnmaskedBankData] = useState<any | null>(null);
  const [isBankViewUnlocked, setIsBankViewUnlocked] = useState(false);

  // OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<"VIEW_BANK_DETAILS" | "EDIT_BANK_DETAILS">("VIEW_BANK_DETAILS");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);
  const [otpMaskedEmail, setOtpMaskedEmail] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccessMsg, setOtpSuccessMsg] = useState("");
  const [editAuthToken, setEditAuthToken] = useState("");

  // Edit Bank Details Form
  const [showEditBankForm, setShowEditBankForm] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: "State Bank of India",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "Main Branch",
    accountType: "Savings",
  });
  const [showBankConfirmModal, setShowBankConfirmModal] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/organisation")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load work data.");
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
          // If a person is currently selected, refresh their data
          if (selectedPerson) {
            const all = [
              ...json.data.projectManagers,
              ...json.data.teamLeaders,
              ...json.data.employees,
            ];
            const updated = all.find((p: any) => p.id === selectedPerson.id);
            if (updated) setSelectedPerson(updated);
          }
        } else {
          setError(json.error || "No work data available.");
        }
      })
      .catch((err) => {
        console.warn("Organisation fetch error:", err);
        setError("Unable to load work data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && showOtpModal) {
      setOtpError("Verification code has expired. Please request a new OTP.");
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // When a person is selected, sync account edit fields
  const handleSelectPerson = (person: any) => {
    setSelectedPerson(person);
    setProfileTab("WORK_OVERVIEW");
    setUnmaskedBankData(null);
    setIsBankViewUnlocked(false);
    setShowEditBankForm(false);
    setEditAuthToken("");
    setAccountMsg("");
    setAccountError("");
    setEditAccountData({
      name: person.name || "",
      email: person.email || "",
      phone: person.phone || "",
      role: person.role || "",
      departmentId: person.departmentId || "",
      isActive: person.status === "ACTIVE",
    });
    setBankFormData({
      bankName: person.bankDetails?.bankName || "State Bank of India",
      accountHolderName: person.name || "",
      accountNumber: "",
      ifscCode: "",
      branchName: person.bankDetails?.branchName || "Main Branch",
      accountType: person.bankDetails?.accountType || "Savings",
    });
  };

  // -------------------------------------------------------------
  // Filtered Lists (Strict Role Scoping)
  // -------------------------------------------------------------
  const filteredPMs = useMemo(() => {
    return data.projectManagers.filter((pm) => {
      const q = pmSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pm.name?.toLowerCase().includes(q) ||
        pm.employeeId?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (pmStatusFilter !== "ALL" && pm.status !== pmStatusFilter) return false;
      if (pmDeptFilter !== "ALL" && pm.department !== pmDeptFilter) return false;
      return true;
    });
  }, [data.projectManagers, pmSearch, pmStatusFilter, pmDeptFilter]);

  const filteredTLs = useMemo(() => {
    return data.teamLeaders.filter((tl) => {
      const q = tlSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tl.name?.toLowerCase().includes(q) ||
        tl.employeeId?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (tlStatusFilter !== "ALL" && tl.status !== tlStatusFilter) return false;
      if (tlProjectFilter !== "ALL") {
        const inProj = (tl.projects || []).some((p: any) => p.id === tlProjectFilter);
        if (!inProj) return false;
      }
      return true;
    });
  }, [data.teamLeaders, tlSearch, tlStatusFilter, tlProjectFilter]);

  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp) => {
      const q = empSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (empProjectFilter !== "ALL") {
        const inProj =
          emp.currentProject?.id === empProjectFilter ||
          (emp.assignedProjects || []).some((p: any) => p.id === empProjectFilter);
        if (!inProj) return false;
      }
      if (empTLFilter !== "ALL") {
        if (emp.teamLeader?.id !== empTLFilter && emp.teamLeader?.employeeId !== empTLFilter) {
          return false;
        }
      }
      if (empStatusFilter !== "ALL" && emp.status !== empStatusFilter) return false;
      return true;
    });
  }, [data.employees, empSearch, empProjectFilter, empTLFilter, empStatusFilter]);

  const totalEmpPages = Math.max(1, Math.ceil(filteredEmployees.length / EMP_PER_PAGE));
  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * EMP_PER_PAGE;
    return filteredEmployees.slice(start, start + EMP_PER_PAGE);
  }, [filteredEmployees, empPage]);

  // Unique Team Leaders for dropdown
  const uniqueTLs = useMemo(() => {
    const tls = new Map<string, string>();
    data.employees.forEach((e) => {
      if (e.teamLeader) {
        tls.set(e.teamLeader.id, e.teamLeader.name);
      }
    });
    return Array.from(tls.entries()).map(([id, name]) => ({ id, name }));
  }, [data.employees]);

  // Unique Departments for PMs
  const uniquePMDepts = useMemo(() => {
    const depts = new Set<string>();
    data.projectManagers.forEach((pm) => pm.department && depts.add(pm.department));
    return Array.from(depts);
  }, [data.projectManagers]);

  // -------------------------------------------------------------
  // Employee Workboard Calculations (Scoped to Selected Project)
  // -------------------------------------------------------------
  const employeeWorkboardData = useMemo(() => {
    if (!selectedPerson) return null;

    const allEmpTasks: any[] = selectedPerson.allTasks || [];
    const scopedTasks =
      empWorkboardProjectFilter === "ALL"
        ? allEmpTasks
        : allEmpTasks.filter((t: any) => t.projectId === empWorkboardProjectFilter);

    const totalTasks = scopedTasks.length;
    const completedTasks = scopedTasks.filter((t: any) => t.status === "COMPLETED");
    const inProgressTasks = scopedTasks.filter((t: any) => t.status === "IN_PROGRESS");
    const pendingTasks = scopedTasks.filter((t: any) => t.status === "PENDING" || t.status === "ASSIGNED");
    const inReviewTasks = scopedTasks.filter((t: any) => t.status === "IN_REVIEW");
    const blockedTasks = scopedTasks.filter((t: any) => t.status === "BLOCKED");

    const taskCompletionRate = totalTasks > 0 ? ((completedTasks.length / totalTasks) * 100).toFixed(1) : "0";
    const overallProgressVal =
      totalTasks > 0
        ? (scopedTasks.reduce((acc: number, t: any) => acc + (t.progress || 0), 0) / totalTasks).toFixed(1)
        : "0";

    let visibleTasks = scopedTasks;
    if (empWorkboardStatusTab === "COMPLETED") visibleTasks = completedTasks;
    else if (empWorkboardStatusTab === "IN_PROGRESS") visibleTasks = inProgressTasks;
    else if (empWorkboardStatusTab === "PENDING") visibleTasks = pendingTasks;
    else if (empWorkboardStatusTab === "IN_REVIEW") visibleTasks = inReviewTasks;
    else if (empWorkboardStatusTab === "BLOCKED") visibleTasks = blockedTasks;

    return {
      totalTasks,
      completedCount: completedTasks.length,
      inProgressCount: inProgressTasks.length,
      pendingCount: pendingTasks.length,
      inReviewCount: inReviewTasks.length,
      blockedCount: blockedTasks.length,
      taskCompletionRate,
      overallProgressVal,
      visibleTasks,
    };
  }, [selectedPerson, empWorkboardProjectFilter, empWorkboardStatusTab]);

  // -------------------------------------------------------------
  // Account Management Save Handler
  // -------------------------------------------------------------
  const handleSaveAccountInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;

    setIsSavingAccount(true);
    setAccountMsg("");
    setAccountError("");

    try {
      const res = await fetch(`/api/admin/employees/${selectedPerson.employeeId || selectedPerson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAccountData),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAccountMsg("✓ Account information updated successfully!");
        loadData();
      } else {
        setAccountError(json.error || "Failed to update account information.");
      }
    } catch (err: any) {
      setAccountError(err.message || "Network error while updating account.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // -------------------------------------------------------------
  // OTP Flow Handlers (View & Edit Bank Details)
  // -------------------------------------------------------------
  const handleInitiateOtp = async (purpose: "VIEW_BANK_DETAILS" | "EDIT_BANK_DETAILS") => {
    if (!selectedPerson) return;
    setOtpPurpose(purpose);
    setOtpCode("");
    setOtpError("");
    setOtpSuccessMsg("");
    setOtpLoading(true);

    try {
      const res = await fetch("/api/admin/bank/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedPerson.id,
          purpose,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOtpMaskedEmail(json.emailMasked || "registered email");
        setOtpTimer(json.expiresInSeconds || 300);
        setShowOtpModal(true);
      } else {
        alert(json.error || "Failed to request verification code.");
      }
    } catch (err: any) {
      alert(err.message || "Network error requesting OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !otpCode.trim()) return;

    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/admin/bank/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedPerson.id,
          purpose: otpPurpose,
          otpCode: otpCode.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowOtpModal(false);
        if (otpPurpose === "VIEW_BANK_DETAILS") {
          setUnmaskedBankData(json.unmaskedBankDetails);
          setIsBankViewUnlocked(true);
        } else if (otpPurpose === "EDIT_BANK_DETAILS") {
          setEditAuthToken(json.authToken);
          setShowEditBankForm(true);
        }
      } else {
        setOtpError(json.error || "Invalid verification code.");
      }
    } catch (err: any) {
      setOtpError(err.message || "OTP verification error.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!selectedPerson || !editAuthToken) return;

    setIsSavingBank(true);
    try {
      const res = await fetch("/api/admin/bank/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedPerson.id,
          authToken: editAuthToken,
          bankDetails: bankFormData,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowBankConfirmModal(false);
        setShowEditBankForm(false);
        setEditAuthToken("");
        alert("✓ Bank details updated successfully! Audit record created and employee notified.");
        loadData();
      } else {
        alert(json.error || "Failed to update bank details.");
      }
    } catch (err: any) {
      alert(err.message || "Network error updating bank details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏢</span> Organisation Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Account administration, dynamic organization hierarchy, and OTP-protected confidential information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </div>

      {/* 1. THREE MAIN VIEWS TABS (Project Managers | Team Leaders | Employees) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 max-w-lg shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab("PROJECT_MANAGERS");
            setSelectedPerson(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "PROJECT_MANAGERS"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Project Managers ({data.projectManagers.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("TEAM_LEADERS");
            setSelectedPerson(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "TEAM_LEADERS"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Team Leaders ({data.teamLeaders.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("EMPLOYEES");
            setSelectedPerson(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "EMPLOYEES"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Employees ({data.employees.length})
        </button>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-xs font-bold animate-pulse">
          Loading organization records...
        </div>
      ) : error ? (
        <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <p className="text-xs font-bold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* COMPLETE AUTHORIZED PROFILE VIEW (WHEN ANY PERSON IS CLICKED)               */}
          {/* ========================================================================= */}
          {selectedPerson ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
              {/* Back Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  ← Back to {activeTab === "PROJECT_MANAGERS" ? "Project Managers" : activeTab === "TEAM_LEADERS" ? "Team Leaders" : "Employees"}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {selectedPerson.role?.replace(/_/g, " ")} Dossier
                  </span>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                    {selectedPerson.status}
                  </span>
                </div>
              </div>

              {/* Authorized Profile Header Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedPerson.avatarUrl ? (
                    <img
                      src={selectedPerson.avatarUrl}
                      alt={selectedPerson.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shadow-xs">
                      {selectedPerson.name ? selectedPerson.name.substring(0, 2).toUpperCase() : "U"}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{selectedPerson.name}</h2>
                    <p className="text-xs text-slate-500 font-mono">
                      ID: <span className="font-bold text-slate-800">{selectedPerson.employeeId}</span> • Email: <span className="font-bold text-slate-700">{selectedPerson.email}</span> • Phone: <span className="font-bold text-slate-700">{selectedPerson.phone}</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600 font-medium">
                      <div>
                        <span className="text-slate-400 font-bold">Designation:</span> {selectedPerson.role}
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Department:</span> {selectedPerson.department}
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Joining Date:</span>{" "}
                        {new Date(selectedPerson.joiningDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Employment:</span> {selectedPerson.employmentStatus}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold">Current Project:</span>{" "}
                        <span className="font-bold text-blue-700">
                          {selectedPerson.currentProject?.projectTitle || (selectedPerson.projects && selectedPerson.projects[0]?.projectTitle) || "Operational Deliverables"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold">Reporting Manager / TL:</span>{" "}
                        <span className="font-bold text-slate-800">
                          {selectedPerson.teamLeader?.name || selectedPerson.reportingManager?.name || selectedPerson.managerName || "Direct to Super Admin"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Sub-Section Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setProfileTab("WORK_OVERVIEW")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    profileTab === "WORK_OVERVIEW"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  📊 Work & Deliverables
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab("ORG_STRUCTURE")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    profileTab === "ORG_STRUCTURE"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  🌳 Organisation Structure
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab("ATTENDANCE_LEAVES")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    profileTab === "ATTENDANCE_LEAVES"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  ⏱️ Attendance & Leaves
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab("ACCOUNT_MANAGEMENT")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    profileTab === "ACCOUNT_MANAGEMENT"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  🔐 Account Control & Bank Security
                </button>
              </div>

              {/* ========================================================================= */}
              {/* SUB-TAB 1: WORK & DELIVERABLES OVERVIEW                                    */}
              {/* ========================================================================= */}
              {profileTab === "WORK_OVERVIEW" && (
                <div className="space-y-6">
                  {/* For PM: Projects Table */}
                  {selectedPerson.role === "PROJECT_MANAGER" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Total Projects</p>
                          <p className="text-lg font-black text-slate-900 mt-1">{selectedPerson.totalProjects}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30">
                          <p className="text-[10px] font-bold uppercase text-blue-700">Active Projects</p>
                          <p className="text-lg font-black text-blue-800 mt-1">{selectedPerson.activeProjectsCount}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                          <p className="text-[10px] font-bold uppercase text-emerald-700">Completed</p>
                          <p className="text-lg font-black text-emerald-800 mt-1">{selectedPerson.completedProjectsCount}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/30">
                          <p className="text-[10px] font-bold uppercase text-rose-700">Delayed</p>
                          <p className="text-lg font-black text-rose-800 mt-1">{selectedPerson.delayedProjectsCount}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Project</th>
                              <th className="py-3 px-4">Team Leader</th>
                              <th className="py-3 px-4 text-center">Progress</th>
                              <th className="py-3 px-4 text-center">Deadline</th>
                              <th className="py-3 px-4 text-center">Health</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {selectedPerson.projects?.map((proj: any) => (
                              <tr key={proj.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">{proj.projectTitle}</td>
                                <td className="py-3 px-4">{proj.teamLeaderName || "Unassigned"}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{proj.progress}%</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600">
                                  {new Date(proj.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black border uppercase">
                                    {proj.projectHealth || "HEALTHY"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">{proj.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* For TL: Team Work & Pipeline */}
                  {selectedPerson.role === "TEAM_LEADER" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                        <h4 className="text-[11px] font-black uppercase text-amber-400">Team Leader Execution Workflow</h4>
                        <p className="text-xs text-slate-300 font-semibold">
                          Project Manager → Project → Team Leader ({selectedPerson.name}) → Employees → Tasks → Review → Completed
                        </p>
                      </div>

                      <div className="space-y-3">
                        {selectedPerson.projects?.map((proj: any) => (
                          <div key={proj.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <div>
                                <h4 className="text-sm font-black text-slate-900">{proj.projectTitle}</h4>
                                <p className="text-xs text-slate-500">Client: {proj.clientCompany}</p>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-900">Progress: {proj.progress}%</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {proj.members?.map((m: any) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    const found = data.employees.find((e) => e.id === m.id);
                                    if (found) handleSelectPerson(found);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer"
                                >
                                  {m.name} ({m.employeeId})
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* For Employees: Workboard */}
                  {selectedPerson.role !== "PROJECT_MANAGER" && selectedPerson.role !== "TEAM_LEADER" && employeeWorkboardData && (
                    <div className="space-y-4">
                      {/* Workboard Scope & Status Tabs */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Employee Workboard
                        </h3>
                        <select
                          value={empWorkboardProjectFilter}
                          onChange={(e) => setEmpWorkboardProjectFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-blue-600 focus:outline-none"
                        >
                          <option value="ALL">All Projects ({selectedPerson.allTasks?.length || 0} Total Tasks)</option>
                          {selectedPerson.assignedProjects?.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.projectTitle}</option>
                          ))}
                        </select>
                      </div>

                      {/* Numbers */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                        <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Total Tasks</p>
                          <p className="text-base font-black text-slate-900 mt-1">{employeeWorkboardData.totalTasks}</p>
                        </div>
                        <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                          <p className="text-[10px] font-bold uppercase text-emerald-700">Completed</p>
                          <p className="text-base font-black text-emerald-800 mt-1">{employeeWorkboardData.completedCount}</p>
                        </div>
                        <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/30">
                          <p className="text-[10px] font-bold uppercase text-blue-700">In Progress</p>
                          <p className="text-base font-black text-blue-800 mt-1">{employeeWorkboardData.inProgressCount}</p>
                        </div>
                        <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Pending</p>
                          <p className="text-base font-black text-slate-700 mt-1">{employeeWorkboardData.pendingCount}</p>
                        </div>
                        <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/30">
                          <p className="text-[10px] font-bold uppercase text-amber-700">In Review</p>
                          <p className="text-base font-black text-amber-800 mt-1">{employeeWorkboardData.inReviewCount}</p>
                        </div>
                        <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50/30">
                          <p className="text-[10px] font-bold uppercase text-rose-700">Blocked</p>
                          <p className="text-base font-black text-rose-800 mt-1">{employeeWorkboardData.blockedCount}</p>
                        </div>
                      </div>

                      {/* Status Tabs */}
                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setEmpWorkboardStatusTab("ALL")}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            empWorkboardStatusTab === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          All ({employeeWorkboardData.totalTasks})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmpWorkboardStatusTab("COMPLETED")}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            empWorkboardStatusTab === "COMPLETED" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Completed ({employeeWorkboardData.completedCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmpWorkboardStatusTab("IN_PROGRESS")}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            empWorkboardStatusTab === "IN_PROGRESS" ? "bg-white text-blue-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          In Progress ({employeeWorkboardData.inProgressCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmpWorkboardStatusTab("PENDING")}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            empWorkboardStatusTab === "PENDING" ? "bg-white text-slate-900 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Pending ({employeeWorkboardData.pendingCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmpWorkboardStatusTab("IN_REVIEW")}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            empWorkboardStatusTab === "IN_REVIEW" ? "bg-white text-amber-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          In Review ({employeeWorkboardData.inReviewCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmpWorkboardStatusTab("BLOCKED")}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            empWorkboardStatusTab === "BLOCKED" ? "bg-white text-rose-800 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Blocked ({employeeWorkboardData.blockedCount})
                        </button>
                      </div>

                      {/* Tasks Table */}
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Task</th>
                              <th className="py-3 px-4">Project</th>
                              <th className="py-3 px-4 text-center">Priority</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-center">Due Date</th>
                              <th className="py-3 px-4 text-center">Progress</th>
                              <th className="py-3 px-4 text-right">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {employeeWorkboardData.visibleTasks.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-slate-400 font-bold">
                                  No tasks found.
                                </td>
                              </tr>
                            ) : (
                              employeeWorkboardData.visibleTasks.map((t: any) => (
                                <tr key={t.id} onClick={() => setActiveTaskModal(t)} className="hover:bg-slate-50/80 transition cursor-pointer">
                                  <td className="py-3 px-4 font-bold text-slate-900">{t.title}</td>
                                  <td className="py-3 px-4 text-slate-600">{t.projectTitle || "General"}</td>
                                  <td className="py-3 px-4 text-center">{t.priority}</td>
                                  <td className="py-3 px-4 text-center">{t.status}</td>
                                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "N/A"}
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono font-bold">{t.progress}%</td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTaskModal(t);
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg"
                                    >
                                      View →
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* SUB-TAB 2: INTERACTIVE DYNAMIC ORGANISATION HIERARCHY DIAGRAM               */}
              {/* ========================================================================= */}
              {profileTab === "ORG_STRUCTURE" && selectedPerson.orgHierarchy && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        Dynamic Organisation Structure
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Live relationship graph generated from real project and department hierarchies. Click any related person to open their profile.
                      </p>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl bg-slate-950 text-white flex flex-col items-center space-y-6 overflow-x-auto">
                    {/* Level 1: Superior (Admin or PM) */}
                    {selectedPerson.orgHierarchy.level1 && (
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            const u = selectedPerson.orgHierarchy.level1.user;
                            const found = data.projectManagers.find((pm) => pm.id === u.id);
                            if (found) handleSelectPerson(found);
                          }}
                          className="p-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-center transition cursor-pointer shadow-lg w-64"
                        >
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md uppercase">
                            {selectedPerson.orgHierarchy.level1.title}
                          </span>
                          <p className="text-sm font-black text-white mt-1">{selectedPerson.orgHierarchy.level1.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{selectedPerson.orgHierarchy.level1.user.employeeId}</p>
                        </button>
                        <div className="h-6 w-0.5 bg-slate-700 mt-2"></div>
                        <span className="text-slate-500 text-xs">▼</span>
                      </div>
                    )}

                    {/* Level 2: Middle Tier (PM or TL) */}
                    {selectedPerson.orgHierarchy.level2 && (
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            const u = selectedPerson.orgHierarchy.level2.user;
                            const found =
                              data.projectManagers.find((pm) => pm.id === u.id) ||
                              data.teamLeaders.find((tl) => tl.id === u.id);
                            if (found) handleSelectPerson(found);
                          }}
                          className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500 hover:border-indigo-300 text-center transition cursor-pointer shadow-lg w-64"
                        >
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md uppercase">
                            {selectedPerson.orgHierarchy.level2.title}
                          </span>
                          <p className="text-sm font-black text-white mt-1">{selectedPerson.orgHierarchy.level2.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{selectedPerson.orgHierarchy.level2.user.employeeId}</p>
                        </button>
                        <div className="h-6 w-0.5 bg-slate-700 mt-2"></div>
                        <span className="text-slate-500 text-xs">▼</span>
                      </div>
                    )}

                    {/* Level 3: Subordinates / Direct Reports */}
                    {selectedPerson.orgHierarchy.level3 && (
                      <div className="flex flex-wrap justify-center gap-4">
                        {Array.isArray(selectedPerson.orgHierarchy.level3) ? (
                          selectedPerson.orgHierarchy.level3.map((item: any, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const found =
                                  data.employees.find((e) => e.id === item.user?.id) ||
                                  data.teamLeaders.find((tl) => tl.id === item.user?.id);
                                if (found) handleSelectPerson(found);
                              }}
                              className={`p-3.5 rounded-2xl border text-center transition cursor-pointer w-56 ${
                                item.isSelected
                                  ? "bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40"
                                  : "bg-slate-900 border-slate-800 hover:border-slate-600"
                              }`}
                            >
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md uppercase">
                                {item.title || "Team Member"}
                              </span>
                              <p className="text-xs font-black text-white mt-1 truncate">{item.user?.name || "Member"}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.user?.employeeId}</p>
                            </button>
                          ))
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SUB-TAB 3: ATTENDANCE & LEAVES SUMMARY                                     */}
              {/* ========================================================================= */}
              {profileTab === "ATTENDANCE_LEAVES" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Recorded Days</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{selectedPerson.attendanceSummary?.totalDays || 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Days Present</p>
                      <p className="text-xl font-black text-emerald-800 mt-1">{selectedPerson.attendanceSummary?.presentDays || 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30">
                      <p className="text-[10px] font-bold uppercase text-blue-700">Total Hours Logged</p>
                      <p className="text-xl font-black text-blue-800 mt-1">{selectedPerson.attendanceSummary?.totalHours || 0} hrs</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30">
                      <p className="text-[10px] font-bold uppercase text-amber-700">Approved Leaves</p>
                      <p className="text-xl font-black text-amber-800 mt-1">{selectedPerson.leaveSummary?.approvedLeaves || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SUB-TAB 4: ACCOUNT MANAGEMENT & OTP-PROTECTED BANK DETAILS                 */}
              {/* ========================================================================= */}
              {profileTab === "ACCOUNT_MANAGEMENT" && (
                <div className="space-y-8">
                  {/* 1. Account Management (Non-Sensitive Fields) */}
                  <form onSubmit={handleSaveAccountInfo} className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Account Control & Profile Info
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Update authorized profile fields. Sensitive bank information requires separate OTP authorization.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md border border-blue-200 uppercase">
                        Admin Privileged Action
                      </span>
                    </div>

                    {accountMsg && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                        {accountMsg}
                      </div>
                    )}
                    {accountError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                        {accountError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={editAccountData.name}
                          onChange={(e) => setEditAccountData({ ...editAccountData, name: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-black focus:border-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Corporate Email</label>
                        <input
                          type="email"
                          required
                          value={editAccountData.email}
                          onChange={(e) => setEditAccountData({ ...editAccountData, email: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-black focus:border-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editAccountData.phone}
                          onChange={(e) => setEditAccountData({ ...editAccountData, phone: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-black focus:border-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Designation / Role</label>
                        <select
                          value={editAccountData.role}
                          onChange={(e) => setEditAccountData({ ...editAccountData, role: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-black focus:border-slate-900 focus:outline-none"
                        >
                          <option value="DEVELOPER">Developer</option>
                          <option value="TEAM_LEADER">Team Leader</option>
                          <option value="PROJECT_MANAGER">Project Manager</option>
                          <option value="UI_UX_DESIGNER">UI/UX Designer</option>
                          <option value="QA_TESTER">QA Tester</option>
                          <option value="HR">HR</option>
                          <option value="FINANCE">Finance</option>
                          <option value="INTERN">Intern</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Department</label>
                        <select
                          value={editAccountData.departmentId}
                          onChange={(e) => setEditAccountData({ ...editAccountData, departmentId: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-black focus:border-slate-900 focus:outline-none"
                        >
                          <option value="">-- Select Department --</option>
                          {data.departments?.map((d: any) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Account Status</label>
                        <select
                          value={editAccountData.isActive ? "ACTIVE" : "INACTIVE"}
                          onChange={(e) => setEditAccountData({ ...editAccountData, isActive: e.target.value === "ACTIVE" })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-black focus:border-slate-900 focus:outline-none"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive / Suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSavingAccount}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingAccount ? "Saving Updates..." : "Save Account Info"}
                      </button>
                    </div>
                  </form>

                  {/* 2. OTP-Protected Bank Account Section */}
                  <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🏦</span> Confidential Bank Account Details
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Strictly masked by default. Requires one-time OTP verification directly from the account owner.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isBankViewUnlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsBankViewUnlocked(false);
                              setUnmaskedBankData(null);
                            }}
                            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Hide Details 🔒
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleInitiateOtp("VIEW_BANK_DETAILS")}
                            disabled={otpLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                          >
                            Request OTP to View Details 👁️
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInitiateOtp("EDIT_BANK_DETAILS")}
                          disabled={otpLoading}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Edit Bank Details ✏️
                        </button>
                      </div>
                    </div>

                    {/* Bank Display Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Name</span>
                        <span className="font-bold text-slate-900">
                          {isBankViewUnlocked && unmaskedBankData
                            ? unmaskedBankData.bankName
                            : selectedPerson.bankDetails?.bankName || "State Bank of India"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Holder</span>
                        <span className="font-bold text-slate-900">
                          {isBankViewUnlocked && unmaskedBankData
                            ? unmaskedBankData.accountHolderName
                            : selectedPerson.bankDetails?.accountHolderNameMasked || "R**** V****"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Number</span>
                        <span className="font-mono font-bold text-slate-900">
                          {isBankViewUnlocked && unmaskedBankData
                            ? unmaskedBankData.accountNumber
                            : selectedPerson.bankDetails?.accountNumberMasked || "************4521"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-900">
                          {isBankViewUnlocked && unmaskedBankData
                            ? unmaskedBankData.ifscCode
                            : selectedPerson.bankDetails?.ifscCodeMasked || "********123"}
                        </span>
                      </div>
                    </div>

                    {/* If Edit Bank Form is Unlocked */}
                    {showEditBankForm && (
                      <div className="p-5 rounded-2xl bg-white border border-indigo-200 space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <h4 className="text-xs font-black uppercase text-indigo-950">
                            Authorized Bank Detail Modification Form
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                            OTP Verified Session Active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Bank Name *</label>
                            <input
                              type="text"
                              required
                              value={bankFormData.bankName}
                              onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                              className="w-full p-2 rounded-xl border border-slate-300 font-medium text-black focus:border-indigo-600 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              required
                              value={bankFormData.accountHolderName}
                              onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
                              className="w-full p-2 rounded-xl border border-slate-300 font-medium text-black focus:border-indigo-600 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">New Account Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 123456789012"
                              value={bankFormData.accountNumber}
                              onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                              className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold text-black focus:border-indigo-600 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">New IFSC Code *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. SBIN0001234"
                              value={bankFormData.ifscCode}
                              onChange={(e) => setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })}
                              className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold text-black focus:border-indigo-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowEditBankForm(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!bankFormData.accountNumber || !bankFormData.ifscCode) {
                                alert("Please enter new Account Number and IFSC Code.");
                                return;
                              }
                              setShowBankConfirmModal(true);
                            }}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                          >
                            Review & Confirm Changes →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* DIRECTORY LIST VIEWS (Project Managers | Team Leaders | Employees)         */
            /* ========================================================================= */
            <div>
              {/* Project Managers View */}
              {activeTab === "PROJECT_MANAGERS" && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Project Managers ({filteredPMs.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Project Manager name or ID to open their complete authorized profile.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Search PM name or ID..."
                      value={pmSearch}
                      onChange={(e) => setPmSearch(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-slate-900 focus:outline-none"
                    />

                    <select
                      value={pmStatusFilter}
                      onChange={(e) => setPmStatusFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>

                    <select
                      value={pmDeptFilter}
                      onChange={(e) => setPmDeptFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Departments</option>
                      {uniquePMDepts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Profile & Name</th>
                          <th className="py-3.5 px-4">Project Manager ID</th>
                          <th className="py-3.5 px-4">Designation / Dept</th>
                          <th className="py-3.5 px-4 text-center">Projects</th>
                          <th className="py-3.5 px-4 text-center">Active Projects</th>
                          <th className="py-3.5 px-4 text-center">Progress</th>
                          <th className="py-3.5 px-4 text-center">Team Leaders</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {filteredPMs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                              No Project Managers registered.
                            </td>
                          </tr>
                        ) : (
                          filteredPMs.map((pm) => (
                            <tr key={pm.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {pm.avatarUrl ? (
                                    <img src={pm.avatarUrl} alt={pm.name} className="h-8 w-8 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {pm.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPerson(pm)}
                                    className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                                  >
                                    {pm.name}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold">
                                <button
                                  type="button"
                                  onClick={() => handleSelectPerson(pm)}
                                  className="text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {pm.employeeId}
                                </button>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{pm.role}</div>
                                <div className="text-[10px] text-slate-500">{pm.department}</div>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold">{pm.totalProjects}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">{pm.activeProjectsCount}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold">{pm.projectCompletionRate}%</td>
                              <td className="py-3.5 px-4 text-center font-mono">{pm.teamLeadersManagedCount} TLs</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {pm.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Team Leaders View */}
              {activeTab === "TEAM_LEADERS" && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Team Leaders ({filteredTLs.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Team Leader name or ID to open their complete authorized profile.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Search TL name or ID..."
                      value={tlSearch}
                      onChange={(e) => setTlSearch(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-slate-900 focus:outline-none"
                    />

                    <select
                      value={tlStatusFilter}
                      onChange={(e) => setTlStatusFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>

                    <select
                      value={tlProjectFilter}
                      onChange={(e) => setTlProjectFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Projects</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.projectTitle}</option>
                      ))}
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Profile & Name</th>
                          <th className="py-3.5 px-4">Team Leader ID</th>
                          <th className="py-3.5 px-4">Designation / Dept</th>
                          <th className="py-3.5 px-4 text-center">Projects</th>
                          <th className="py-3.5 px-4 text-center">Team Size</th>
                          <th className="py-3.5 px-4 text-center">Tasks Managed</th>
                          <th className="py-3.5 px-4 text-center">Task Completion</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {filteredTLs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                              No Team Leaders registered.
                            </td>
                          </tr>
                        ) : (
                          filteredTLs.map((tl) => (
                            <tr key={tl.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {tl.avatarUrl ? (
                                    <img src={tl.avatarUrl} alt={tl.name} className="h-8 w-8 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {tl.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPerson(tl)}
                                    className="font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer text-left"
                                  >
                                    {tl.name}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold">
                                <button
                                  type="button"
                                  onClick={() => handleSelectPerson(tl)}
                                  className="text-slate-700 hover:text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {tl.employeeId}
                                </button>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{tl.role}</div>
                                <div className="text-[10px] text-slate-500">{tl.department}</div>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold">{tl.projectsCount}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold">{tl.teamSize}</td>
                              <td className="py-3.5 px-4 text-center font-mono">{tl.metrics?.totalTasks || 0}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-700">{tl.taskCompletionPct}%</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {tl.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Employees View */}
              {activeTab === "EMPLOYEES" && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Employees Workforce ({filteredEmployees.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Click on any Employee name or ID to open their complete authorized profile.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Search Name or Employee ID..."
                      value={empSearch}
                      onChange={(e) => {
                        setEmpSearch(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:border-slate-900 focus:outline-none"
                    />

                    <select
                      value={empProjectFilter}
                      onChange={(e) => {
                        setEmpProjectFilter(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Projects</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.projectTitle}</option>
                      ))}
                    </select>

                    <select
                      value={empTLFilter}
                      onChange={(e) => {
                        setEmpTLFilter(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Team Leaders</option>
                      {uniqueTLs.map((tl) => (
                        <option key={tl.id} value={tl.id}>{tl.name}</option>
                      ))}
                    </select>

                    <select
                      value={empStatusFilter}
                      onChange={(e) => {
                        setEmpStatusFilter(e.target.value);
                        setEmpPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black focus:border-slate-900 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Profile & Name</th>
                          <th className="py-3.5 px-4">Employee ID</th>
                          <th className="py-3.5 px-4">Designation / Dept</th>
                          <th className="py-3.5 px-4">Current Project</th>
                          <th className="py-3.5 px-4">Team Leader</th>
                          <th className="py-3.5 px-4 text-center">Tasks</th>
                          <th className="py-3.5 px-4 text-center">Completed</th>
                          <th className="py-3.5 px-4 text-center">Progress</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {paginatedEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                              No employees found matching criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.name} className="h-8 w-8 rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {emp.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPerson(emp)}
                                    className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                                  >
                                    {emp.name}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold">
                                <button
                                  type="button"
                                  onClick={() => handleSelectPerson(emp)}
                                  className="text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {emp.employeeId}
                                </button>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{emp.role}</div>
                                <div className="text-[10px] text-slate-500">{emp.department}</div>
                              </td>

                              <td className="py-3.5 px-4 font-bold text-slate-900 line-clamp-1">
                                {emp.currentProject?.projectTitle || "Operational"}
                              </td>

                              <td className="py-3.5 px-4 font-semibold text-slate-700">
                                {emp.teamLeader?.name || "Unassigned"}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold">{emp.tasksAssignedCount}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">{emp.completedTasksCount}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">{emp.overallWorkProgress}%</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {emp.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalEmpPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-slate-500 font-medium">Page {empPage} of {totalEmpPages}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={empPage <= 1}
                          onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          ← Previous
                        </button>
                        <button
                          type="button"
                          disabled={empPage >= totalEmpPages}
                          onClick={() => setEmpPage((p) => Math.min(totalEmpPages, p + 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 6. OTP VERIFICATION DIALOG MODAL (SENSITIVE BANK INFO PROTECTION)          */}
      {/* ========================================================================= */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto text-xl font-bold">
                🔐
              </div>
              <h3 className="text-base font-black text-slate-900">OTP Security Verification</h3>
              <p className="text-xs text-slate-500 font-medium">
                A one-time verification code has been dispatched to <strong>{selectedPerson?.name}</strong>'s registered contact (<span className="font-mono text-slate-700 font-bold">{otpMaskedEmail}</span>).
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                  Enter 6-Digit OTP Code provided by account owner
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-mono font-black tracking-widest p-3 rounded-xl border border-slate-300 text-black focus:border-indigo-600 focus:outline-none bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                <span>
                  Valid for: <strong className={otpTimer < 60 ? "text-rose-600" : "text-slate-900"}>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleInitiateOtp(otpPurpose)}
                  disabled={otpLoading || otpTimer > 240}
                  className="text-indigo-600 hover:underline disabled:opacity-40 cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? "Verifying..." : "Verify OTP Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. BANK DETAILS CHANGE CONFIRMATION MODAL                                */}
      {/* ========================================================================= */}
      {showBankConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              Confirm Bank Account Modification
            </h3>

            <p className="text-xs text-slate-600 font-medium">
              Please review the confidential bank account details before saving. This will update payroll records and create an audit event.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Target Employee:</span>
                <span className="font-bold text-slate-900">{selectedPerson?.name} ({selectedPerson?.employeeId})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Bank Name:</span>
                <span className="font-bold text-slate-900">{bankFormData.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">New Account Number:</span>
                <span className="font-mono font-bold text-indigo-700">
                  ••••••••{bankFormData.accountNumber.slice(-4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">IFSC Code:</span>
                <span className="font-mono font-bold text-slate-900">{bankFormData.ifscCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBankConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBankDetails}
                disabled={isSavingBank}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSavingBank ? "Saving..." : "Confirm & Save Bank Detail"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {activeTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">ID: {activeTaskModal.id}</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{activeTaskModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium">Project: {activeTaskModal.projectTitle || "Operational"}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                <span className="font-bold text-slate-900">{activeTaskModal.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Priority</span>
                <span className="font-bold text-slate-900">{activeTaskModal.priority}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Progress</span>
                <span className="font-bold text-blue-700">{activeTaskModal.progress}%</span>
              </div>
            </div>

            {activeTaskModal.description && (
              <p className="text-xs text-slate-700 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                {activeTaskModal.description}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
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
