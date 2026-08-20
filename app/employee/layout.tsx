"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.user) {
          // Unauthenticated visitor -> redirect immediately to /login
          setAuthorized(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname || "/employee")}`);
          return;
        }

        // Authenticated Employee or Admin
        setCurrentUserContext({
          id: json.user.id,
          employeeId: json.user.employeeId || json.user.id,
          name: json.user.name,
          email: json.user.email,
          role: json.user.role,
          department: json.user.department || "Development & Engineering",
          avatarUrl: json.user.avatarUrl || null,
          activeMode: "EMPLOYEE_USER",
          assignedProjectTitle: "OMS Enterprise System",
        });
        setAuthorized(true);
      })
      .catch(() => {
        setAuthorized(false);
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/employee")}`);
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
