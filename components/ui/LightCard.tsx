"use client";

import React from "react";

interface LightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export default function LightCard({
  children,
  className = "",
  onClick,
  hoverEffect = false,
}: LightCardProps) {
  const baseClasses = "bg-white rounded-3xl border border-gray-200 shadow-xs p-6";
  const hoverClasses = hoverEffect
    ? "hover:border-blue-400 hover:shadow-sm transition cursor-pointer group"
    : "";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
