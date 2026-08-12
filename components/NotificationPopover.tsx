"use client";

import React, { useState } from "react";

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifications = [
    { id: 1, title: "Leave Request Submitted", desc: "Rahul Sharma requested 2 days leave for Aug 10-11", time: "10 mins ago", type: "hr" },
    { id: 2, title: "Invoice Paid", desc: "Acme Corp completed payment of ₹2,45,000 for INV-001", time: "1 hour ago", type: "fin" },
    { id: 3, title: "Project Build Deployed", desc: "OMS 2.4 static build successfully passed prerender audit", time: "2 hours ago", type: "sys" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (unreadCount > 0) setUnreadCount(0);
        }}
        className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
      >
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
        🔔
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
            <h4 className="font-bold text-xs">Notifications</h4>
            <span className="text-[10px] text-slate-400">3 New</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 hover:bg-slate-50 transition text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{n.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
