"use client";

import React, { useState } from "react";

const initialEvents = [
  { id: 1, title: "All-Hands Operations Quarterly Sync", date: "2026-08-05", time: "10:00 AM", category: "Meetings", icon: "📅" },
  { id: 2, title: "Roushan Verma's Birthday Celebration", date: "2026-08-08", time: "04:30 PM", category: "Birthdays", icon: "🎂" },
  { id: 3, title: "Q3 Financial Audit Submission", date: "2026-08-12", time: "05:00 PM", category: "Work Deadlines", icon: "⏰" },
  { id: 4, title: "Independence Day Public Holiday", date: "2026-08-15", time: "Full Day", category: "Holidays", icon: "🏖️" },
  { id: 5, title: "OMS Enterprise 2.5 Production Release", date: "2026-08-20", time: "03:00 PM", category: "Work Deadlines", icon: "🚀" },
  { id: 6, title: "Annual Corporate Tech Summit & Retreat", date: "2026-08-28", time: "Full Day", category: "Company Events", icon: "🏢" },
];

export default function CalendarPage() {
  const [events, setEvents] = useState(initialEvents);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    category: "Meetings",
  });

  const filtered = events.filter((e) => categoryFilter === "All" || e.category === categoryFilter);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const icons: Record<string, string> = {
      Holidays: "🏖️",
      Meetings: "📅",
      Birthdays: "🎂",
      "Work Deadlines": "⏰",
      "Company Events": "🏢",
    };

    setEvents([
      ...events,
      {
        ...newEvent,
        id: events.length + 1,
        icon: icons[newEvent.category] || "📅",
      },
    ]);
    setShowAddModal(false);
    setNewEvent({ title: "", date: new Date().toISOString().split("T")[0], time: "10:00 AM", category: "Meetings" });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Phase 1: Company Calendar</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Company Calendar & Event Schedule</h1>
          <p className="text-xs text-slate-300 mt-1">
            Track Holidays, Corporate Meetings, Team Birthdays, Work Deadlines, and Company Events.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-accent text-xs px-4 py-2.5 shadow-md">
          + Schedule Event
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {["All", "Holidays", "Meetings", "Birthdays", "Work Deadlines", "Company Events"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              categoryFilter === cat
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modal: Add Event */}
      {showAddModal && (
        <div className="pro-card p-6 bg-blue-50/50 border-blue-200 space-y-4 max-w-lg mx-auto">
          <h3 className="font-bold text-slate-900 text-sm">Add New Calendar Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="e.g. Q4 Strategy Meeting"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none"
                >
                  <option value="Holidays">Public Holiday</option>
                  <option value="Meetings">Meeting / Sync</option>
                  <option value="Birthdays">Team Birthday</option>
                  <option value="Work Deadlines">Work Deadline</option>
                  <option value="Company Events">Company Event</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" className="btn-accent text-xs">
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List Table */}
      <div className="pro-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Scheduled Events ({filtered.length})</h2>
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Scheduled Date</th>
                <th>Time Slot</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt) => (
                <tr key={evt.id}>
                  <td className="font-bold text-slate-900">
                    <span className="mr-2">{evt.icon}</span>
                    {evt.title}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        evt.category === "Holidays"
                          ? "badge-purple"
                          : evt.category === "Birthdays"
                          ? "badge-success"
                          : evt.category === "Work Deadlines"
                          ? "badge-danger"
                          : "badge-info"
                      }`}
                    >
                      {evt.category}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-slate-800 font-bold">{evt.date}</td>
                  <td className="text-xs text-slate-600 font-mono">{evt.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}