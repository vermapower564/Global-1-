"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getStoredEmployees, Employee } from "@/utils/employeeStore";
import { exportToCSV } from "@/utils/exportEngine";
import {
  IconUserCheck,
  IconFileText,
  IconCoins,
  IconTerminal,
  IconBuilding,
  IconEye,
} from "@/components/Icons";

export interface InternTrackRecord {
  id: string;
  name: string;
  department: string;
  currentRole: string;
  targetRole: string;
  mentor: string;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  totalDaysRequired: number;
  performanceScore: number; // out of 5
  status: "Completed - Eligible for Job" | "In Progress" | "Promoted to Full-Time";
  stipend: number;
  offeredFullTimeSalary: number;
  email: string;
  phone: string;
}

const initialInterns: InternTrackRecord[] = [
  {
    id: "INT-2026-01",
    name: "Aditya Raj",
    department: "Development & Engineering",
    currentRole: "Software Engineering Intern",
    targetRole: "Full Stack Software Engineer",
    mentor: "Aarav Sharma (Project Manager)",
    startDate: "2026-05-01",
    endDate: "2026-08-01",
    daysCompleted: 90,
    totalDaysRequired: 90,
    performanceScore: 4.9,
    status: "Completed - Eligible for Job",
    stipend: 25000,
    offeredFullTimeSalary: 850000,
    email: "aditya@oms.com",
    phone: "+91 98765 99999",
  },
  {
    id: "INT-2026-02",
    name: "Pooja Nair",
    department: "UI/UX & Graphic Design",
    currentRole: "UI/UX Design Intern",
    targetRole: "Associate UI/UX Designer",
    mentor: "Ananya Roy (Design Lead)",
    startDate: "2026-05-15",
    endDate: "2026-08-15",
    daysCompleted: 84,
    totalDaysRequired: 90,
    performanceScore: 4.8,
    status: "Completed - Eligible for Job",
    stipend: 22000,
    offeredFullTimeSalary: 720000,
    email: "pooja.nair@oms.com",
    phone: "+91 98765 11224",
  },
  {
    id: "INT-2026-03",
    name: "Rohan Mehta",
    department: "Growth & Marketing",
    currentRole: "Digital Marketing Intern",
    targetRole: "SEO & Growth Executive",
    mentor: "Sneha Reddy (Marketing Manager)",
    startDate: "2026-06-01",
    endDate: "2026-09-01",
    daysCompleted: 67,
    totalDaysRequired: 90,
    performanceScore: 4.6,
    status: "In Progress",
    stipend: 20000,
    offeredFullTimeSalary: 650000,
    email: "rohan.m@oms.com",
    phone: "+91 98765 33445",
  },
];

export default function InternPromotionPage() {
  const [interns, setInterns] = useState<InternTrackRecord[]>(initialInterns);
  const [selectedOfferIntern, setSelectedOfferIntern] = useState<InternTrackRecord | null>(null);
  const [promotionSuccessMsg, setPromotionSuccessMsg] = useState<string | null>(null);

  const handlePromoteToJob = (internId: string) => {
    const updated = interns.map((item) => {
      if (item.id === internId) {
        return {
          ...item,
          status: "Promoted to Full-Time" as const,
        };
      }
      return item;
    });

    setInterns(updated);
    const target = updated.find((i) => i.id === internId);
    if (target) {
      setPromotionSuccessMsg(`🎉 Congratulations! ${target.name} has been successfully promoted from Intern to Full-Time ${target.targetRole} (Salary: ₹${target.offeredFullTimeSalary.toLocaleString()}/yr)!`);
      setTimeout(() => setPromotionSuccessMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {promotionSuccessMsg && (
        <div className="bg-emerald-600 text-white font-bold p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in fade-in">
          <span className="text-xs">{promotionSuccessMsg}</span>
          <button onClick={() => setPromotionSuccessMsg(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            HR Operations / Talent Pipeline
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Internship Completion & Full-Time Job Promotion Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Evaluate intern performance, track completion ratios, and issue official full-time employment job offers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportToCSV("Intern_Promotion_Ledger", interns)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            <IconFileText className="h-4 w-4" /> Export Promotion Ledger
          </button>
          <Link href="/hr" className="btn-secondary text-xs">
            ← Back to HR Management
          </Link>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="pro-card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Active Interns</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{interns.length} Candidates</p>
          <span className="text-[11px] font-semibold text-purple-600">Under Mentorship Program</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Completed & Eligible for Job</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {interns.filter((i) => i.daysCompleted >= 80).length} Ready to Hire
          </p>
          <span className="text-[11px] font-semibold text-emerald-600">100% Performance Passed</span>
        </div>

        <div className="pro-card p-5 border-l-4 border-l-red-600">
          <span className="text-xs font-semibold text-slate-400 uppercase">Promoted Full-Time Staff</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {interns.filter((i) => i.status === "Promoted to Full-Time").length} Hired
          </p>
          <span className="text-[11px] font-semibold text-red-600">Official Job Contract Issued</span>
        </div>
      </div>

      {/* Main Intern Evaluation Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Intern Work Track Record & Job Promotion Desk
        </h2>

        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Intern ID</th>
                <th>Candidate Name</th>
                <th>Department & Mentor</th>
                <th>Completion Progress</th>
                <th>Work Rating</th>
                <th>Full-Time Salary Offer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interns.map((item) => {
                const completionPercent = Math.min(100, Math.round((item.daysCompleted / item.totalDaysRequired) * 100));
                const isEligible = completionPercent >= 90;

                return (
                  <tr key={item.id}>
                    <td className="font-mono text-xs font-bold text-slate-600">{item.id}</td>
                    <td>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.currentRole}</p>
                    </td>
                    <td>
                      <p className="font-bold text-slate-800 text-xs">{typeof item.department === "object" ? (item.department as any)?.name : item.department}</p>
                      <p className="text-[11px] text-purple-600 font-semibold">{item.mentor}</p>
                    </td>
                    <td className="w-44">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span>{item.daysCompleted} / {item.totalDaysRequired} Days</span>
                        <span className="text-emerald-600">{completionPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${completionPercent}%` }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-extrabold text-amber-500">★ {item.performanceScore} / 5.0</span>
                    </td>
                    <td className="font-mono text-xs font-extrabold text-emerald-700">
                      ₹{item.offeredFullTimeSalary.toLocaleString()} / Year
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === "Promoted to Full-Time"
                            ? "badge-success"
                            : isEligible
                            ? "badge-warning"
                            : "badge-purple"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1.5 min-w-[170px]">
                        {item.status === "Promoted to Full-Time" ? (
                          <button
                            onClick={() => setSelectedOfferIntern(item)}
                            className="text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200 flex items-center justify-center gap-1"
                          >
                            <IconFileText className="h-3 w-3" /> View Job Offer Letter
                          </button>
                        ) : isEligible ? (
                          <button
                            onClick={() => handlePromoteToJob(item.id)}
                            className="text-[11px] font-extrabold bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 py-1.5 rounded shadow-md hover:from-red-500 hover:to-rose-500 transition"
                          >
                            🎓 Promote to Full-Time Job
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">In Internship Training</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Job Offer Letter Preview */}
      {selectedOfferIntern && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border space-y-5 animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white font-extrabold text-xl shadow-md">
                  O
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-none">OMS Enterprise</h3>
                  <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1 block">
                    Official Full-Time Job Offer Letter
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOfferIntern(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed border p-4 rounded-xl bg-slate-50">
              <p className="font-bold text-slate-900">Date: {new Date().toLocaleDateString()}</p>
              <p>Dear <span className="font-bold text-slate-900">{selectedOfferIntern.name}</span>,</p>
              <p>
                We are thrilled to inform you that upon the successful completion of your internship in our <span className="font-bold text-slate-900">{typeof selectedOfferIntern.department === "object" ? (selectedOfferIntern.department as any)?.name : selectedOfferIntern.department}</span> department with an outstanding rating of <span className="font-bold text-emerald-600">{selectedOfferIntern.performanceScore}/5.0</span>, OMS Enterprise is officially extending a full-time job offer for the position of <span className="font-bold text-slate-900">{selectedOfferIntern.targetRole}</span>.
              </p>
              <div className="bg-white p-3 rounded-lg border space-y-1 font-mono text-xs">
                <p>• Department: <span className="font-bold text-slate-900">{typeof selectedOfferIntern.department === "object" ? (selectedOfferIntern.department as any)?.name : selectedOfferIntern.department}</span></p>
                <p>• Role: <span className="font-bold text-slate-900">{selectedOfferIntern.targetRole}</span></p>
                <p>• Annual Base Salary: <span className="font-bold text-emerald-700">₹{selectedOfferIntern.offeredFullTimeSalary.toLocaleString()} / Year</span></p>
                <p>• Employment Status: <span className="font-bold text-blue-600">Full-Time Permanent Staff</span></p>
              </div>
              <p>We look forward to your continued contributions to OMS Enterprise!</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Print Offer Letter
              </button>
              <button
                onClick={() => setSelectedOfferIntern(null)}
                className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
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
