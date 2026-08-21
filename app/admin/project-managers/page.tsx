"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProjectManagersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/organisation");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs font-bold text-slate-400">
      Redirecting to Organisation directory...
    </div>
  );
}
