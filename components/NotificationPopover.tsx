"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string;
  senderName?: string;
  senderRole?: string;
  createdAt: string;
}

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeModalNotification, setActiveModalNotification] = useState<NotificationItem | null>(null);
  const [mounted, setMounted] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real notifications and unread badge count from database API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unreadCount || 0));
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Heartbeat poll for updates every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside popover to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Lock body scroll when detail modal is open
  useEffect(() => {
    if (activeModalNotification) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModalNotification]);

  // Close modal or popover on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeModalNotification) {
          setActiveModalNotification(null);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalNotification, isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  // Mark single notification as read and open complete full message modal
  const handleMarkAsRead = async (item: NotificationItem) => {
    // 1. Close dropdown immediately so it is not visible behind the modal
    setIsOpen(false);

    // 2. Open selected notification in dedicated modal
    setActiveModalNotification({ ...item, isRead: true });

    // 3. Mark as read on backend if unread
    if (!item.isRead) {
      try {
        // Immediate optimistic UI update
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Call backend to persist read status
        await fetch(`/api/notifications/${encodeURIComponent(item.id)}`, {
          method: "PATCH",
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getTypeBadge = (type: string) => {
    switch ((type || "").toUpperCase()) {
      case "HOLIDAY":
        return {
          icon: "🏖️",
          label: "Holiday",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "CELEBRATION":
        return {
          icon: "🎉",
          label: "Celebration",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "MEETING":
        return {
          icon: "📅",
          label: "Meeting",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "IMPORTANT":
        return {
          icon: "⚠️",
          label: "Important",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
        };
      case "URGENT":
        return {
          icon: "🚨",
          label: "Urgent Alert",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        };
      default:
        return {
          icon: "📢",
          label: "Announcement",
          badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  const formatFullDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const renderModal = () => {
    if (!activeModalNotification || !mounted) return null;

    const typeInfo = getTypeBadge(activeModalNotification.type);

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setActiveModalNotification(null);
          }
        }}
      >
        <div
          className="relative w-full max-w-lg sm:max-w-xl bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-150 text-slate-900 font-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-notif-title"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white flex-none space-y-3 relative">
            <div className="flex items-center justify-between gap-3 pr-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${typeInfo.badgeClass}`}
              >
                <span>{typeInfo.icon}</span>
                <span>Type: {typeInfo.label}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {formatFullDateTime(activeModalNotification.createdAt)}
              </span>
            </div>

            <h3 id="modal-notif-title" className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug break-words">
              {activeModalNotification.title}
            </h3>

            {/* Top Close 'X' Button */}
            <button
              onClick={() => setActiveModalNotification(null)}
              aria-label="Close modal"
              className="absolute top-4 sm:top-5 right-4 sm:right-5 h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer font-bold text-sm"
            >
              ✕
            </button>
          </div>

          {/* Modal Body: Complete Unabridged Message */}
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-sans">
              {activeModalNotification.message}
            </div>

            {/* Metadata details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                  Sent By / Source
                </span>
                <span className="font-extrabold text-slate-900">
                  {activeModalNotification.senderName || "System Admin"}
                  {activeModalNotification.senderRole ? ` (${activeModalNotification.senderRole})` : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                  Read Status
                </span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <span>✓</span>
                  <span>READ</span>
                </span>
              </div>

              {activeModalNotification.linkUrl && (
                <div className="sm:col-span-2 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                    Associated Link
                  </span>
                  <a
                    href={activeModalNotification.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Open Link</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex-none flex items-center justify-end px-6">
            <button
              onClick={() => setActiveModalNotification(null)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs hover:shadow-md"
            >
              Close Detail
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        aria-label="View notifications"
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer flex items-center justify-center focus:outline-none"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-xs uppercase tracking-wider">
                Notifications & Broadcasts
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10px] font-black">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-blue-300 hover:text-blue-200 hover:underline cursor-pointer transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <span className="text-3xl block">📭</span>
                <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400">
                  Company broadcasts and updates will appear right here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const typeInfo = getTypeBadge(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`p-3.5 transition cursor-pointer border-l-4 ${
                      !n.isRead
                        ? "bg-blue-50/60 hover:bg-blue-50 border-blue-600"
                        : "bg-white hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeInfo.badgeClass}`}
                        >
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <h5
                      className={`text-xs mt-1.5 ${
                        !n.isRead
                          ? "font-black text-slate-900"
                          : "font-semibold text-slate-800"
                      }`}
                    >
                      {n.title}
                    </h5>

                    {/* Short Message Preview */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                      <span className="text-[10px] text-slate-400">
                        {n.senderName ? `By ${n.senderName}` : "Official Notice"}
                      </span>
                      {!n.isRead ? (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                          <span>Unread</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Read</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-4">
            <Link
              href="/admin/announcements"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
            >
              Announcements Hub →
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FULL NOTIFICATION DETAIL MODAL (PORTAL) */}
      {renderModal()}
    </div>
  );
}



