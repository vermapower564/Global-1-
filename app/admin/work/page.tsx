"use client";

import React, { useState, useEffect } from "react";

export default function AdminWorkPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-work");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUpdates(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch work updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkUpdates();
  }, []);

  const handleEvaluate = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/daily-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rating: 5, managerRemarks: "Approved by Admin" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`✓ EOD update status changed to ${status}!`);
        fetchWorkUpdates();
      }
    } catch (err) {
      console.warn("Error evaluating update:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Review Desk</span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Daily Work EOD Approvals Desk
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Inspect employee task updates, achievements, blocker reports, and deliverables.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-bold text-xs">Loading EOD submissions...</div>
        ) : updates.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-400 italic text-xs">
            No daily work reports submitted yet.
          </div>
        ) : (
          updates.map((u) => (
            <div
              key={u.id}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-black">
                    {u.user?.name || u.employeeName || "Employee"} ({u.user?.employeeId || u.employeeId})
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      u.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {u.status || "PENDING"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-700">
                  {u.projectName || "OMS Core"} • {u.description}
                </h4>
                {u.achievements && <p className="text-xs text-gray-500">🏆 {u.achievements}</p>}
                {u.blockers && <p className="text-xs text-rose-600 font-semibold">⚠️ {u.blockers}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEvaluate(u.id, "APPROVED")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  ✓ Approve EOD
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
