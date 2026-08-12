"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState("/api/health");
  const [httpMethod, setHttpMethod] = useState("GET");
  const [requestBody, setRequestBody] = useState("{}");
  const [responseLog, setResponseLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { name: "System Health", path: "/api/health", method: "GET", body: "" },
    { name: "List Employees", path: "/api/employees", method: "GET", body: "" },
    { name: "Create Employee", path: "/api/employees", method: "POST", body: JSON.stringify({ name: "Aarav Sharma", email: "aarav@oms.com", department: "Engineering", role: "Developer", salary: "95000" }, null, 2) },
    { name: "Sales Pipeline & Deals", path: "/api/sales", method: "GET", body: "" },
    { name: "Create Sales Quotation", path: "/api/sales", method: "POST", body: JSON.stringify({ clientName: "Apex Logistics Ltd", dealValue: 75000, assignedExec: "Vikram Malhotra" }, null, 2) },
    { name: "HR ATS & IT Assets", path: "/api/hr", method: "GET", body: "" },
    { name: "Add ATS Candidate", path: "/api/hr", method: "POST", body: JSON.stringify({ candidateName: "Rohan Das", role: "Senior DevOps Engineer" }, null, 2) },
    { name: "List Leave Applications", path: "/api/leave", method: "GET", body: "" },
    { name: "Submit Leave Request", path: "/api/leave", method: "POST", body: JSON.stringify({ employeeName: "Aarav Sharma", department: "Engineering", leaveType: "Casual Leave", totalDays: 2, reason: "Family Function" }, null, 2) },
    { name: "HR Leave Approval & Email", path: "/api/leave", method: "PATCH", body: JSON.stringify({ id: "LV-201", status: "Approved" }, null, 2) },
    { name: "List EOD Work Updates", path: "/api/daily-work", method: "GET", body: "" },
    { name: "Manager 1-5 Star EOD Rating", path: "/api/daily-work", method: "PATCH", body: JSON.stringify({ id: "EOD-102", status: "APPROVED", rating: 5, managerRemarks: "Great performance on Q3 sprint!" }, null, 2) },
    { name: "Digital Marketing & SEO", path: "/api/marketing", method: "GET", body: "" },
    { name: "Projects Portfolio", path: "/api/projects", method: "GET", body: "" },
    { name: "Finance Invoicing Metrics", path: "/api/finance", method: "GET", body: "" },
    { name: "Auth JWT Login", path: "/api/auth/login", method: "POST", body: JSON.stringify({ email: "admin@oms.com", password: "admin123" }, null, 2) },
  ];

  const handleSelectEndpoint = (ep: typeof endpoints[0]) => {
    setActiveEndpoint(ep.path);
    setHttpMethod(ep.method);
    setRequestBody(ep.body);
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseLog(null);

    const startTime = Date.now();
    try {
      const options: RequestInit = {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
      };

      if (httpMethod !== "GET" && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(activeEndpoint, options);
      const json = await res.json();
      const elapsed = Date.now() - startTime;

      setResponseLog({
        status: res.status,
        statusText: res.statusText,
        elapsedMs: elapsed,
        data: json,
      });
    } catch (err: any) {
      setResponseLog({
        status: 500,
        statusText: "Client Fetch Error",
        elapsedMs: Date.now() - startTime,
        data: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="gradient-banner-dark p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">REST API Engine & Swagger Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Backend API Interactive Playground</h1>
          <p className="text-xs text-slate-300 mt-1">
            Test Next.js 16 backend API routes, JWT authentication, MySQL Prisma queries, and simulated email dispatches live in your browser.
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary text-xs">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint Selector Sidebar */}
        <div className="pro-card p-5 space-y-3">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
            Available REST Endpoints ({endpoints.length})
          </h2>
          <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between ${
                  activeEndpoint === ep.path && httpMethod === ep.method
                    ? "border-blue-600 bg-blue-50 font-bold text-blue-900 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div>
                  <span className="block font-bold text-slate-900">{ep.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{ep.path}</span>
                </div>
                <span
                  className={`badge ${
                    ep.method === "GET"
                      ? "badge-success"
                      : ep.method === "POST"
                      ? "badge-info"
                      : "badge-warning"
                  }`}
                >
                  {ep.method}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* API Testing Request & Response Console */}
        <div className="lg:col-span-2 pro-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span
                className={`badge text-xs px-3 py-1.5 ${
                  httpMethod === "GET"
                    ? "badge-success"
                    : httpMethod === "POST"
                    ? "badge-info"
                    : "badge-warning"
                }`}
              >
                {httpMethod}
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                {activeEndpoint}
              </span>
            </div>

            <button
              onClick={handleExecuteRequest}
              disabled={loading}
              className="btn-accent text-xs px-6 py-2.5 shadow-md w-full sm:w-auto"
            >
              {loading ? "⚡ Executing..." : "🚀 Execute API Request"}
            </button>
          </div>

          {/* Request Body Input for POST/PATCH */}
          {httpMethod !== "GET" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                JSON Request Payload (Body):
              </label>
              <textarea
                rows={5}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 bg-slate-950 text-emerald-400 focus:outline-none"
              />
            </div>
          )}

          {/* Response Inspector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                HTTP Response Inspector:
              </label>
              {responseLog && (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`badge ${
                      responseLog.status >= 200 && responseLog.status < 300
                        ? "badge-success"
                        : "badge-danger"
                    }`}
                  >
                    Status: {responseLog.status} {responseLog.statusText}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    ⚡ {responseLog.elapsedMs} ms
                  </span>
                </div>
              )}
            </div>

            <pre className="w-full font-mono text-xs p-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 overflow-x-auto min-h-[220px] max-h-[360px]">
              {loading ? (
                <span className="text-amber-400 animate-pulse">
                  Sending HTTP Request to {activeEndpoint}...
                </span>
              ) : responseLog ? (
                JSON.stringify(responseLog.data, null, 2)
              ) : (
                <span className="text-slate-500">
                  Click 'Execute API Request' above to test this backend endpoint live.
                </span>
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
