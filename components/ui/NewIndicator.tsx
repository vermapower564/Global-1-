"use client";

import React from "react";

interface NewIndicatorProps {
  label?: string;
  className?: string;
}

export default function NewIndicator({ label = "NEW", className = "" }: NewIndicatorProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs ${className}`}
    >
      {label}
    </span>
  );
}
