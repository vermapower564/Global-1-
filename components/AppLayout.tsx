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
    return (
      <div className="bg-slate-100 text-slate-900 font-sans min-h-screen antialiased overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-sans h-screen w-full flex antialiased relative overflow-hidden print:h-auto print:overflow-visible print:block print:bg-white print:p-0 print:m-0">
      {/* 1-Hour Inactivity Tracker & Sliding Heartbeat */}
      <InactivityTracker />

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity print:hidden"
        />
      )}

      {/* Sidebar with responsive toggle state */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden transition-all duration-300 print:h-auto print:overflow-visible print:block print:p-0 print:m-0">
        <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto flex flex-col print:h-auto print:overflow-visible print:block print:p-0 print:m-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:block">{children}</main>
          <Footer />
        </div>
      </div>

      <AICopilot />
    </div>
  );
}
