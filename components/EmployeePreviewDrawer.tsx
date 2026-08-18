"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface EmployeePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
}

export default function EmployeePreviewDrawer({
  isOpen,
  onClose,
  employee,
}: EmployeePreviewDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const empId = employee.employeeId || employee.id;
  const initials = (employee.name || "E")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-gray-200 shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 text-black">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-black text-black text-base tracking-tight">
              Employee Quick Preview
            </h3>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Profile Card */}
          <div className="text-center space-y-3">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.name}
                className="h-24 w-24 rounded-3xl object-cover border-2 border-blue-500 shadow-md mx-auto"
              />
            ) : (
              <div className="h-24 w-24 rounded-3xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-2 border-blue-400 shadow-md mx-auto">
                {initials}
              </div>
            )}

            <div>
              <h2 className="text-xl font-black text-black">{employee.name}</h2>
              <span className="text-xs font-mono font-bold text-blue-600 block">{empId}</span>
              <span className="text-xs text-gray-500 font-medium">{employee.role?.replace(/_/g, " ")}</span>
            </div>

            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                employee.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {employee.isActive !== false ? "● Active Account" : "● Deactivated"}
            </span>
          </div>

          {/* Details Grid */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Email Address</span>
              <span className="font-mono font-bold text-black">{employee.email}</span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Department</span>
              <span className="font-black text-black">
                {employee.department?.name || employee.department || "Engineering"}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Current Project</span>
              <span className="font-bold text-black">
                {employee.currentProjectTitle || "OMS Enterprise 2.0"}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Active Tasks</span>
              <span className="font-mono font-black text-blue-600">
                {employee.metrics?.activeTasks || 3} Tasks
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Shift Attendance</span>
              <span className="font-mono font-black text-emerald-700">94.5%</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Link
              href={`/admin/employees/${empId}`}
              onClick={onClose}
              className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition"
            >
              View Full 360° Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
