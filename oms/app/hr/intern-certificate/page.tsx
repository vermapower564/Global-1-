"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconFileText, IconUserCheck, IconBuilding, IconZap } from "@/components/Icons";

export default function InternCertificatePage() {
  const [internName, setInternName] = useState("Aditya Raj");
  const [department, setDepartment] = useState("Development & Engineering");
  const [role, setRole] = useState("Software Engineering Intern");
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-08-01");
  const [mentorName, setMentorName] = useState("Aarav Sharma (Project Manager)");
  const [certType, setCertType] = useState<"CERTIFICATE" | "EXPERIENCE_LETTER">("CERTIFICATE");
  const [certId, setCertId] = useState("CERT-OMS-2026-901");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            HR Operations / Certification Engine
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Internship Certificate & Experience Letter Generator
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Generate and print official verified certificates of internship completion and work experience letters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            <IconFileText className="h-4 w-4" /> Print Official Certificate
          </button>
          <Link href="/hr/intern-promotion" className="btn-secondary text-xs">
            ← Back to Intern Promotions
          </Link>
        </div>
      </div>

      {/* Grid: Controls & Certificate Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (4 Cols) */}
        <div className="lg:col-span-4 pro-card p-6 space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Configure Certificate Details
          </h3>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Document Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCertType("CERTIFICATE")}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  certType === "CERTIFICATE"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                📜 Certificate
              </button>
              <button
                type="button"
                onClick={() => setCertType("EXPERIENCE_LETTER")}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  certType === "EXPERIENCE_LETTER"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                📄 Exp Letter
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Intern Full Name *</label>
            <input
              type="text"
              value={internName}
              onChange={(e) => setInternName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Department *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:border-red-600 focus:outline-none bg-white"
            >
              <option value="Development & Engineering">Development & Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Growth & Marketing">Growth & Marketing</option>
              <option value="Enterprise Sales">Enterprise Sales</option>
              <option value="UI/UX & Graphic Design">UI/UX & Graphic Design</option>
              <option value="Camera & Video Production">Camera & Video Production</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Internship Job Role *</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:border-red-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reporting Mentor *</label>
            <input
              type="text"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Certificate Verification ID</label>
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Certificate Printable Preview Box (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-10 rounded-3xl border-4 border-amber-400 shadow-2xl space-y-6 relative overflow-hidden text-center text-slate-900 font-serif">
          {/* Watermark / Seal */}
          <div className="absolute top-6 right-6 opacity-20 pointer-events-none">
            <div className="h-28 w-28 rounded-full border-4 border-amber-600 flex items-center justify-center font-bold text-amber-700 text-xs uppercase tracking-widest text-center rotate-12">
              OMS Verified Excellence
            </div>
          </div>

          {/* Corporate Header */}
          <div className="flex items-center justify-center gap-3 border-b border-slate-200 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white font-sans font-black text-2xl shadow-lg">
              O
            </div>
            <div className="text-left font-sans">
              <h2 className="font-black text-slate-900 text-xl leading-none tracking-wide">OMS ENTERPRISE</h2>
              <span className="text-xs text-red-600 font-bold uppercase tracking-widest block mt-0.5">
                Corporate Headquarters & HR Division
              </span>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1 py-4">
            <span className="font-sans text-xs uppercase tracking-widest font-extrabold text-amber-600">
              {certType === "CERTIFICATE" ? "Official Certification" : "Work Experience Documentation"}
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 italic">
              {certType === "CERTIFICATE" ? "Certificate of Internship Excellence" : "Work Experience Letter"}
            </h2>
            <p className="font-sans text-xs text-slate-500">Verification ID: <span className="font-mono font-bold text-slate-700">{certId}</span></p>
          </div>

          {/* Body Content */}
          <div className="font-sans text-sm space-y-4 max-w-2xl mx-auto leading-relaxed text-slate-700">
            <p>This is to proudly certify that</p>
            <p className="text-2xl font-black text-slate-900 border-b-2 border-slate-900 inline-block px-8 py-1 tracking-wide font-serif">
              {internName}
            </p>
            <p>
              has successfully completed their official Internship Program in the department of{" "}
              <span className="font-bold text-slate-900">{department}</span> at OMS Enterprise as a{" "}
              <span className="font-bold text-slate-900">{role}</span> during the period from{" "}
              <span className="font-mono font-bold text-slate-900">{startDate}</span> to{" "}
              <span className="font-mono font-bold text-slate-900">{endDate}</span>.
            </p>
            <p className="text-xs text-slate-600 italic">
              During their tenure, {internName} demonstrated exceptional work ethics, technical proficiency, and outstanding dedication to corporate deliverables under the supervision of {mentorName}.
            </p>
          </div>

          {/* Signatures & Seal Block */}
          <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans text-xs text-slate-700">
            <div className="text-left space-y-1">
              <div className="h-10 border-b border-slate-400 max-w-[180px]"></div>
              <p className="font-extrabold text-slate-900">{mentorName}</p>
              <p className="text-[11px] text-slate-500">Project Mentor & Department Lead</p>
            </div>

            <div className="text-right space-y-1">
              <div className="h-10 border-b border-slate-400 max-w-[180px] ml-auto"></div>
              <p className="font-extrabold text-slate-900">Priya Sharma</p>
              <p className="text-[11px] text-slate-500">Head of Human Resources & Operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
