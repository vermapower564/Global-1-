"use client";

import React from "react";

export default function EmployeeDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Work Portal</h1>
        <p className="text-gray-500">Welcome back, Employee</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">My Assigned Tasks</h2>
          <p className="mt-3 text-3xl font-bold text-blue-600">8</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">Hours Logged This Week</h2>
          <p className="mt-3 text-3xl font-bold text-green-600">36.5 hrs</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">Remaining Leave Balance</h2>
          <p className="mt-3 text-3xl font-bold text-purple-600">14 Days</p>
        </div>
      </div>
    </div>
  );
}
