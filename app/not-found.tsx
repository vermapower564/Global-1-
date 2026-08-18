"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
      <div className="max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
          404
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          The page you're looking for doesn't exist, may have been moved, or is temporarily unavailable in OMS Enterprise.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs hover:bg-slate-200 transition cursor-pointer"
          >
            ← Go Back
          </button>
          <Link
            href={ROUTES.EMPLOYEE_DASHBOARD}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
