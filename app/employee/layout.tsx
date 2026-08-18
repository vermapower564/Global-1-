"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserContext } from "@/utils/userContextStore";
import { ROUTES } from "@/lib/routes";

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
          setAuthorized(false);
          router.replace(ROUTES.LOGIN);
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        if (user && user.id) {
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
          <p className="text-xs font-bold text-gray-700">Verifying Employee Session...</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center font-sans">
        <div className="max-w-md p-8 rounded-3xl bg-white border border-gray-200 shadow-xl space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🔐
          </div>
          <h2 className="text-xl font-black text-black">Session Required</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Please sign in to access your Employee Workspace. Redirecting to Login...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
