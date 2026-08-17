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
    const isUserAdmin = ADMIN_ROLES.includes(user.role?.toUpperCase()) || user.activeMode === "ADMIN_HR";

    if (!isUserAdmin) {
      console.warn(`Unauthorized access attempt to admin route (${pathname}) by role: ${user.role}`);
      setAuthorized(false);
      router.replace("/dashboard");
      return;
    }

    // 2. Server-side session verification check
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.user) {
          setAuthorized(false);
          router.replace("/auth/login");
          return;
        }

        const serverRole = (json.user.role || "").toUpperCase();
        if (!ADMIN_ROLES.includes(serverRole)) {
          setAuthorized(false);
          router.replace("/dashboard");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        setAuthorized(true);
      });
  }, [pathname, router]);

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🛡️
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-500">
            You are not authorized to access Admin routes. Redirecting to your Employee Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
