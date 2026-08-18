"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/projects").then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/employees").then((r) => r.json()).catch(() => ({ success: false })),
    ]).then(([tasksRes, projRes, empRes]) => {
      if (tasksRes.success) setTasks(tasksRes.tasks || []);
      if (projRes.success) setProjects(projRes.projects || projRes.data || []);
      if (empRes.success) setEmployees(empRes.data || []);
      setLoading(false);
    });
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qLower = query.toLowerCase().trim();

  const filteredTasks = tasks.filter((t) =>
    (t.title || "").toLowerCase().includes(qLower) || (t.description || "").toLowerCase().includes(qLower)
  ).slice(0, 4);

  const filteredProjects = projects.filter((p) =>
    (p.projectTitle || p.name || "").toLowerCase().includes(qLower) || (p.clientCompany || "").toLowerCase().includes(qLower)
  ).slice(0, 4);

  const filteredEmployees = employees.filter((e) =>
    (e.name || "").toLowerCase().includes(qLower) || (e.employeeId || "").toLowerCase().includes(qLower)
  ).slice(0, 4);

  const totalResults = filteredTasks.length + filteredProjects.length + filteredEmployees.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-0 animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, employees, EOD reports... (Esc to close)"
            className="w-full text-sm font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500 hover:text-slate-900 transition"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-extrabold">Searching database records...</div>
          ) : query && totalResults === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-extrabold">No records found matching "{query}"</div>
          ) : (
            <>
              {/* Projects Section */}
              {filteredProjects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 px-2 block">Projects ({filteredProjects.length})</span>
                  <div className="space-y-1">
                    {filteredProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          router.push(`/employee/projects/${p.id}`);
                        }}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{p.projectTitle || p.name}</p>
                          <p className="text-[11px] text-slate-400">Client: {p.clientCompany || "Enterprise"}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {p.status || "IN_PROGRESS"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Section */}
              {filteredTasks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 px-2 block">Tasks ({filteredTasks.length})</span>
                  <div className="space-y-1">
                    {filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onClose();
                          router.push("/employee/tasks");
                        }}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{t.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{t.description}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teammates Section */}
              {filteredEmployees.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 px-2 block">Team Directory ({filteredEmployees.length})</span>
                  <div className="space-y-1">
                    {filteredEmployees.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onClose();
                          router.push("/employee/team");
                        }}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{e.name}</p>
                          <p className="text-[11px] text-slate-400">{e.employeeId || e.id} • {e.email}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {e.role || "ENGINEER"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-extrabold">
          <span>Navigate with Arrow keys & Enter</span>
          <span>OMS Global Search Engine</span>
        </div>
      </div>
    </div>
  );
}
