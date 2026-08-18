"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserContext } from "@/utils/userContextStore";
import { ROUTES } from "@/lib/routes";

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
          setAuthorized(false);
          router.replace(ROUTES.LOGIN);
          return;
        }

        const serverRole = (json.user.role || "").toUpperCase();
        if (!ADMIN_ROLES.includes(serverRole)) {
          setAuthorized(false);
          router.replace(ROUTES.EMPLOYEE_HOME);
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        if (isUserAdmin) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace(ROUTES.LOGIN);
        }
      });
  }, [pathname, router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center font-sans">
        <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xl space-y-3 max-w-sm w-full">
          <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-700">Verifying Admin Authorization...</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center font-sans">
        <div className="max-w-md p-8 rounded-3xl bg-white border border-rose-200 shadow-xl space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🛡️
          </div>
          <h2 className="text-xl font-black text-black">Access Denied</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            You do not have Administrator permissions. Redirecting to your authorized workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
