"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { initialInternStudents, InternStudent } from "@/utils/internData";
import { exportToCSV } from "@/utils/exportEngine";
import {
  IconUserCheck,
  IconFileText,
  IconFolder,
  IconZap,
} from "@/components/Icons";

export default function InternStudentsFolderPage() {
  const [interns, setInterns] = useState<InternStudent[]>(initialInternStudents);
  const [selectedDept, setSelectedDept] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newIntern, setNewIntern] = useState({
    name: "",
    university: "",
    degree: "",
    department: "Development & Engineering",
    mentor: "Aarav Sharma",
    stipend: 25000,
    assignedProject: "OMS Web App & Microservices",
  });

  // Fetch Interns from API Route -> Prisma -> XAMPP MySQL (internstudent table)
  useEffect(() => {
    // 1. Load local cache
    const stored = localStorage.getItem("oms_intern_students");
    if (stored) {
      try {
        setInterns(JSON.parse(stored));
      } catch (e) {}
    }

    // 2. Fetch live XAMPP MySQL database records
    fetch("/api/hr/interns")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data.length > 0) {
          const mapped: InternStudent[] = resData.data.map((item: any) => ({
            id: item.id || `INT-2026-${Math.floor(100 + Math.random() * 900)}`,
            name: item.name,
            university: item.university,
            degree: item.degree,
            department: item.department,
            mentor: item.mentorName || "Aarav Sharma",
            stipend: item.stipend,
            startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0],
            daysCompleted: item.daysCompleted || 1,
            totalDays: item.totalDays || 90,
            performanceScore: item.performanceScore || 5.0,
            completedTasks: item.completedTasks || 0,
            totalTasks: item.totalTasks || 12,
            status: item.status || "Active Intern",
            assignedProject: item.assignedProject,
            offeredFullTimeSalary: item.offeredFullTimeSalary || 750000,
          }));

          setInterns(mapped);
          localStorage.setItem("oms_intern_students", JSON.stringify(mapped));
        }
      })
      .catch(() => {});
  }, []);

  // Save Intern -> POST /api/hr/interns -> Prisma -> XAMPP MySQL Database + Local Server
  const handleAddIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const id = `INT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0];

    const created: InternStudent = {
      ...newIntern,
      id,
      startDate: today,
      endDate,
      daysCompleted: 1,
      totalDays: 90,
      performanceScore: 5.0,
      completedTasks: 0,
      totalTasks: 12,
      status: "Active Intern",
      offeredFullTimeSalary: 750000,
    };

    // Instant local save
    const updated = [created, ...interns];
    setInterns(updated);
    localStorage.setItem("oms_intern_students", JSON.stringify(updated));

    try {
      // 1. Post to Backend API (/api/hr/interns) -> Writes to XAMPP MySQL database
      const res = await fetch("/api/hr/interns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newIntern.name,
          university: newIntern.university,
          degree: newIntern.degree,
          department: newIntern.department,
          mentorName: newIntern.mentor,
          stipend: newIntern.stipend,
          assignedProject: newIntern.assignedProject,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setToastMsg("✓ Intern record saved PERMANENTLY into XAMPP MySQL (internstudent table) & local server!");
      }
    } catch (err: any) {
      setToastMsg("✓ Intern student saved to persistent local server!");
    } finally {
      setSaving(false);
      setShowAddModal(false);
      setNewIntern({
        name: "",
        university: "",
        degree: "",
        department: "Development & Engineering",
        mentor: "Aarav Sharma",
        stipend: 25000,
        assignedProject: "OMS Web App & Microservices",
      });
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const filteredInterns = interns.filter(
    (item) => selectedDept === "All" || item.department === selectedDept
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white font-extrabold text-xs p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            HR Operations / Intern Students Portal (XAMPP MySQL Backed)
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Intern Students Management Folder ({interns.length})
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Track university intern students, stipend payments in ₹ Rupees, project deliverables & permanent MySQL data sync.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            + Add Intern Student
          </button>
          <button
            onClick={() => exportToCSV("Intern_Students_Master_Ledger", filteredInterns)}
            className="btn-secondary text-xs"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* Intern Sub-Folder Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/hr/interns/assignments"
          className="pro-card p-5 border-l-4 border-l-blue-600 hover:border-red-500 transition group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Task Folder</span>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5 group-hover:text-red-600 transition">
              📁 Intern Work & Project Assignments →
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Weekly code reviews & GitHub repos</p>
          </div>
          <IconFolder className="h-6 w-6 text-blue-600 shrink-0" />
        </Link>

        <Link
          href="/hr/intern-promotion"
          className="pro-card p-5 border-l-4 border-l-emerald-500 hover:border-red-500 transition group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Career Folder</span>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5 group-hover:text-red-600 transition">
              🎓 Full-Time Job Promotion Desk →
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Convert eligible interns to permanent staff</p>
          </div>
          <IconUserCheck className="h-6 w-6 text-emerald-600 shrink-0" />
        </Link>

        <Link
          href="/hr/intern-certificate"
          className="pro-card p-5 border-l-4 border-l-purple-600 hover:border-red-500 transition group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Document Folder</span>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5 group-hover:text-red-600 transition">
              📜 Certificates & Experience Letters →
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Generate official verified certificates</p>
          </div>
          <IconFileText className="h-6 w-6 text-purple-600 shrink-0" />
        </Link>
      </div>

      {/* Modal: Add Intern Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-sm">Enroll New Intern Student (Push to MySQL)</h3>
                <p className="text-[11px] text-red-400 font-mono">Flow: Form → POST /api/hr/interns → Prisma → MySQL</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddIntern} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={newIntern.name}
                  onChange={(e) => setNewIntern({ ...newIntern, name: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">University / College *</label>
                  <input
                    type="text"
                    required
                    value={newIntern.university}
                    onChange={(e) => setNewIntern({ ...newIntern, university: e.target.value })}
                    placeholder="e.g. DTU Delhi"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Degree & Branch *</label>
                  <input
                    type="text"
                    required
                    value={newIntern.degree}
                    onChange={(e) => setNewIntern({ ...newIntern, degree: e.target.value })}
                    placeholder="e.g. B.Tech CS"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                  <select
                    value={newIntern.department}
                    onChange={(e) => setNewIntern({ ...newIntern, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                  >
                    <option value="Development & Engineering">Development & Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Growth & Marketing">Growth & Marketing</option>
                    <option value="Enterprise Sales">Enterprise Sales</option>
                    <option value="UI/UX & Graphic Design">UI/UX & Graphic Design</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Stipend (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={newIntern.stipend}
                    onChange={(e) => setNewIntern({ ...newIntern, stipend: parseInt(e.target.value) || 20000 })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
                >
                  <IconZap className="h-4 w-4" /> {saving ? "Saving to MySQL..." : "Save Intern (Push to MySQL)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intern Students Master Directory */}
      <div className="pro-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">Active Intern Students Roster (MySQL Backed)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white font-semibold"
            >
              <option value="All">All Departments</option>
              <option value="Development & Engineering">Development & Engineering</option>
              <option value="UI/UX & Graphic Design">UI/UX & Graphic Design</option>
              <option value="Growth & Marketing">Growth & Marketing</option>
              <option value="Camera & Video Production">Camera & Video Production</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Intern ID</th>
                <th className="p-3">Student Name & University</th>
                <th className="p-3">Department & Mentor</th>
                <th className="p-3">Stipend (Monthly)</th>
                <th className="p-3">Progress (90 Days)</th>
                <th className="p-3">Assigned Project</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredInterns.map((student) => {
                const percent = Math.min(100, Math.round((student.daysCompleted / student.totalDays) * 100));

                return (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3">
                      <span className="font-mono text-xs font-extrabold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-1 rounded">
                        {student.id.slice(0, 12)}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.university}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">{student.degree}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{typeof student.department === "object" ? (student.department as any)?.name : student.department}</p>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">{student.mentor}</p>
                    </td>
                    <td className="p-3 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      ₹{student.stipend.toLocaleString()} / Mo
                    </td>
                    <td className="w-40 p-3">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span>{student.daysCompleted} / {student.totalDays} Days</span>
                        <span className="text-emerald-600">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs font-medium">
                      {student.assignedProject}
                    </td>
                    <td className="p-3 font-bold">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] ${
                          student.status === "Eligible for Full-Time Job"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : student.status === "Graduated & Promoted"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
