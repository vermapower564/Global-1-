"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

// 1 Hour in milliseconds
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_THRESHOLD_MS = 55 * 60 * 1000;   // 55 minutes (5 min warning)
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;    // Ping server every 5 min of active work

export default function InactivityTracker() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(Date.now());

  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // Perform automatic logout
  const handleTimeoutLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network failures on logout
    }
    setShowWarning(false);
    router.push("/login?reason=inactivity_timeout");
  }, [router]);

  // Ping server to extend active session (Sliding Window)
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/auth/me");
      lastHeartbeatRef.current = Date.now();
    } catch {
      // Network retry on next interval
    }
  }, []);

  // Handle active user interactions (reset timers)
  const registerActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (showWarning) {
      setShowWarning(false);
    }

    // If active and last heartbeat was > 5 min ago, refresh server sliding window
    if (now - lastHeartbeatRef.current > HEARTBEAT_INTERVAL_MS) {
      sendHeartbeat();
    }
  }, [showWarning, sendHeartbeat]);

  useEffect(() => {
    if (isPublicPage) return;

    // Attach listeners for all user interactions
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click", "focus"];
    
    // Throttle event listener updates
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          registerActivity();
          throttleTimeout = null;
        }, 1000);
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Check inactivity status every 5 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        // Exceeded 1 hour -> logout
        clearInterval(interval);
        handleTimeoutLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Between 55 and 60 minutes -> show warning modal
        const remaining = Math.max(0, Math.round((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 5000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
      clearInterval(interval);
    };
  }, [isPublicPage, registerActivity, handleTimeoutLogout]);

  if (isPublicPage || !showWarning) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-2xl mx-auto">
          ⏳
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-black tracking-tight">
            Session Expiring Due to Inactivity
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            You have been inactive for nearly 1 hour. For enterprise security, your session will automatically close in:
          </p>
        </div>

        <div className="py-3 px-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-mono font-black text-2xl">
          {timeFormatted}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={() => {
              registerActivity();
              sendHeartbeat();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
          >
            ✓ I'm Still Working (Keep Logged In)
          </button>
          <button
            onClick={handleTimeoutLogout}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl border border-gray-200 transition cursor-pointer"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
