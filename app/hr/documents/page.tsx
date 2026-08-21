"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconFolder, IconFileText, IconSearch } from "@/components/Icons";

export default function HRDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTab, setCategoryTab] = useState<"ALL" | "ID_PROOF" | "CONTRACT" | "CERTIFICATE" | "OTHER">("ALL");
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const initialDocs = [
    {
      id: "doc-1",
      title: "Master Employment Agreement Template.pdf",
      employeeName: "All Employees",
      department: "Human Resources",
      documentType: "CONTRACT",
      fileSize: "2.4 MB",
      uploadedAt: "2026-08-01",
      status: "APPROVED",
    },
    {
      id: "doc-2",
      title: "Roushan Verma - Aadhaar & PAN Card ID Proof.pdf",
      employeeName: "Roushan Verma (EMP-001)",
      department: "Human Resources",
      documentType: "ID_PROOF",
      fileSize: "1.8 MB",
      uploadedAt: "2026-08-05",
      status: "VERIFIED",
    },
    {
      id: "doc-3",
      title: "Priya Sharma - HR Executive Appointment Letter.pdf",
      employeeName: "Priya Sharma (EMP-002)",
      department: "Human Resources",
      documentType: "CONTRACT",
      fileSize: "1.2 MB",
      uploadedAt: "2026-08-08",
      status: "VERIFIED",
    },
    {
      id: "doc-4",
      title: "Vikram Singh - B.Tech Degree Certificate.pdf",
      employeeName: "Vikram Singh (EMP-8222)",
      department: "Project Management",
      documentType: "CERTIFICATE",
      fileSize: "3.5 MB",
      uploadedAt: "2026-08-10",
      status: "VERIFIED",
    },
    {
      id: "doc-5",
      title: "Aditya Raj - Non-Disclosure Agreement (NDA).pdf",
      employeeName: "Aditya Raj (EMP-014)",
      department: "Development & Engineering",
      documentType: "CONTRACT",
      fileSize: "950 KB",
      uploadedAt: "2026-08-12",
      status: "VERIFIED",
    },
  ];

  useEffect(() => {
    setLoading(true);
    fetch("/api/documents")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDocuments(json.data);
        } else {
          setDocuments(initialDocs);
        }
      })
      .catch(() => setDocuments(initialDocs))
      .finally(() => setLoading(false));
  }, []);

  const filteredDocs = documents.filter((doc) => {
    if (categoryTab !== "ALL" && doc.documentType !== categoryTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (doc.title || "").toLowerCase();
      const emp = (doc.employeeName || "").toLowerCase();
      if (!title.includes(q) && !emp.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase tracking-wider">
              Human Resources Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">• Document Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <span>📁</span> HR Documents & Records Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Central repository for employee ID proofs, joining contracts, educational certificates, and compliance papers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📄</span> + Upload HR Document
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setCategoryTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                categoryTab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Documents ({documents.length})
            </button>
            <button
              onClick={() => setCategoryTab("ID_PROOF")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                categoryTab === "ID_PROOF" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🪪 ID Proofs
            </button>
            <button
              onClick={() => setCategoryTab("CONTRACT")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                categoryTab === "CONTRACT" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              📝 Contracts
            </button>
            <button
              onClick={() => setCategoryTab("CERTIFICATE")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                categoryTab === "CERTIFICATE" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🎓 Certificates
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search document title or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none"
            />
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Document Title</th>
                <th className="py-3 px-3">Associated Employee</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">File Size</th>
                <th className="py-3 px-3">Upload Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredDocs.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">📄</span>
                      <span className="font-black text-slate-900">{doc.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-bold">{doc.employeeName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                      {doc.documentType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">{doc.fileSize || "1.2 MB"}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{doc.uploadedAt}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ {doc.status || "VERIFIED"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => alert(`Viewing document: ${doc.title}`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs transition cursor-pointer"
                    >
                      Download / View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Upload HR Document</h3>
                <p className="text-xs text-slate-400 font-medium">Add verified personnel file to database</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700 font-black">
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma - Degree Certificate.pdf"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1">Document Category</label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900">
                  <option value="ID_PROOF">ID Proof (Aadhaar / Passport / PAN)</option>
                  <option value="CONTRACT">Employment Contract / Offer Letter</option>
                  <option value="CERTIFICATE">Degree / Experience Certificate</option>
                  <option value="OTHER">Other HR Document</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Select File (PDF, DOCX, PNG)</label>
                <input type="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setToastMsg("✓ Document uploaded and verified!");
                    setShowUploadModal(false);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
