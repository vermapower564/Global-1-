"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserContext } from "@/utils/userContextStore";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Client Context Check
    const user = getCurrentUserContext();

    // 2. Server Session Verification
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.user) {
          // Unauthenticated visitor -> redirect cleanly to /login
          setAuthorized(false);
          router.replace("/login");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        if (user && user.id) {
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
