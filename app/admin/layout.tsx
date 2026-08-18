"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserContext } from "@/utils/userContextStore";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Client Context Role Check
    const user = getCurrentUserContext();
    const isUserAdmin = ADMIN_ROLES.includes(user?.role?.toUpperCase() || "") || user?.activeMode === "ADMIN_HR";

    // 2. Server-side session verification check
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.user) {
          // Unauthenticated visitor -> redirect cleanly to /login
          setAuthorized(false);
          router.replace("/login");
          return;
        }

        const serverRole = (json.user.role || "").toUpperCase();
        if (!ADMIN_ROLES.includes(serverRole)) {
          // Authenticated Employee attempting admin route -> redirect to /employee
          setAuthorized(false);
          router.replace("/employee");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        if (isUserAdmin) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace("/login");
        }
      });
  }, [pathname, router]);

  if (authorized !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xl space-y-3 max-w-sm w-full">
          <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-700">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
