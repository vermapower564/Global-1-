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
    if (!user || !user.id) {
      setAuthorized(false);
      router.replace(ROUTES.LOGIN);
      return;
    }

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
        setAuthorized(true);
      });
  }, [pathname, router]);

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🔐
          </div>
          <h2 className="text-xl font-bold text-slate-900">Session Expired</h2>
          <p className="text-xs text-slate-500">
            Please sign in to access your Employee Workspace. Redirecting to Login...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
