"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/footer";
import AICopilot from "@/components/AICopilot";
import InactivityTracker from "@/components/InactivityTracker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Hide OMS Navbar & Sidebar on standalone Auth pages (/auth/* & /login)
  const isAuthPage = pathname?.startsWith("/auth") || pathname === "/login";

  if (isAuthPage) {
    return <div className="bg-slate-100 text-slate-900 font-sans min-h-screen antialiased">{children}</div>;
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex antialiased relative overflow-x-hidden">
      {/* 1-Hour Inactivity Tracker & Sliding Heartbeat */}
      <InactivityTracker />

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar with responsive toggle state */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
        <Footer />
      </div>

      <AICopilot />
    </div>
  );
}
