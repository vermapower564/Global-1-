"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface BlockedTask {
  id: string;
  title: string;
  blockerReason?: string;
  priority: string;
  progress: number;
  updatedAt: string;
  assignedToUser?: { id: string; name: string; employeeId: string };
  project?: { id: string; name: string };
}

export default function AdminBlockersPage() {
  const [blockedTasks, setBlockedTasks] = useState<BlockedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const fetchBlockedTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?status=BLOCKED");
      const json = await res.json();
      if (json.success) {
        setBlockedTasks(json.tasks || []);
      }
    } catch (err) {
      console.warn("Failed to fetch blocked tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedTasks();
  }, []);

  const handleUnblockTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          blockerReason: null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg("✓ Task unblocked and status updated to IN_PROGRESS in database!");
        fetchBlockedTasks();
      } else {
        alert(json.error || "Failed to unblock task");
      }
    } catch (err) {
      alert("Network error unblocking task");
    } finally {
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {toastMsg && (
        <div className="p-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Admin Risk Desk • Blocker Resolution Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Blocked Tasks & Dependency Bottlenecks
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review blocker reasons submitted by workforce engineers, assign resolution owners, and resume work execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tasks"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            Organization Task Center →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 font-bold text-xs">Loading blocked tasks...</div>
      ) : blockedTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3 shadow-xs">
          <div className="text-3xl">🎉</div>
          <h3 className="font-extrabold text-black text-base">Zero Blocked Tasks</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            All active project deliverables and assigned workforce tasks are executing normally with zero unresolved bottlenecks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blockedTasks.map((t) => (
            <div
              key={t.id}
              className="bg-white p-6 rounded-3xl border border-rose-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                      BLOCKED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                      {t.priority} PRIORITY
                    </span>
                  </div>
                  <h3 className="font-black text-black text-base mt-1.5">{t.title}</h3>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-gray-700">
                    Owner:{" "}
                    <Link
                      href={`/admin/employees/${encodeURIComponent(t.assignedToUser?.employeeId || t.assignedToUser?.id || "EMP001")}`}
                      title={`View ${t.assignedToUser?.name} Profile`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t.assignedToUser?.name || "Assigned Engineer"}
                    </Link>{" "}
                    <span className="font-mono text-[10px] text-gray-400">({t.assignedToUser?.employeeId || "EMP"})</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Project: {t.project?.name || "OMS Enterprise"}
                  </span>
                </div>
              </div>

              {/* Blocker Reason Box */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-xs">
                <span className="font-bold text-rose-900 uppercase text-[10px] block">Blocker Reason Reported:</span>
                <p className="text-rose-950 font-medium leading-relaxed">
                  {t.blockerReason || "Awaiting third-party credentials and API documentation clearance."}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => handleUnblockTask(t.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  ✓ Mark Blocker Resolved (Resume Task)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
