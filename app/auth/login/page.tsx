"use client";

import React, { Suspense } from "react";
import RootLoginPage from "../../login/page";

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading Login Portal...</div>}>
      <RootLoginPage />
    </Suspense>
  );
}
