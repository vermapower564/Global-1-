"use client";

import React from "react";
import { getStatusTheme } from "@/lib/theme";

interface StatusBadgeProps {
  status: string | undefined | null;
  customLabel?: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  customLabel,
  size = "sm",
  showDot = true,
  className = "",
}: StatusBadgeProps) {
  const theme = getStatusTheme(status);
  const label = customLabel || theme.label;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-xs font-black",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider transition ${theme.badge} ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${theme.dot} ${
            status === "IN_PROGRESS" || status === "ACTIVE" ? "animate-pulse" : ""
          }`}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
