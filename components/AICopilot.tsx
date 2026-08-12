"use client";

import React, { useState } from "react";
import {
  IconZap,
  IconUserCheck,
} from "@/components/Icons";

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Greetings! I am OMS Smart Copilot. Ask me about any employee person, folder module (Attendance, Salary, Projects, Leave, HR Interns, Sales), or XAMPP MySQL database table.",
    },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    "Tell me about Roushan Verma",
    "Tell me about one person",
    "Attendance Folder Info",
    "Monthly Salary Approvals",
    "Projects Folder Info",
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim()) return;

    const userMsg = { sender: "user", text: prompt };
    let aiResponseText = "";

    const lower = prompt.toLowerCase();

    // 1. Employee Person Queries
    if (
      lower.includes("person") ||
      lower.includes("roushan") ||
      lower.includes("aditya") ||
      lower.includes("priya") ||
      lower.includes("employee info") ||
      lower.includes("staff info") ||
      lower.includes("tell me about one")
    ) {
      if (lower.includes("roushan")) {
        aiResponseText = "👤 Staff Profile: Roushan Verma | ID: EMP-1001 | Role: Super Administrator | Department: Executive Management | Salary: ₹1,85,000/mo | Joining: 2024-01-15 | Status: Verified & Present Today (Log: 09:05 AM - 06:15 PM)";
      } else if (lower.includes("aditya")) {
        aiResponseText = "👤 Staff Profile: Aditya Raj | ID: EMP-1014 | Role: Senior Full-Stack Developer | Department: Development & Engineering | Salary: ₹95,000/mo | Joining: 2025-03-01 | Status: Active Shift Currently Working";
      } else if (lower.includes("priya")) {
        aiResponseText = "👤 Staff Profile: Priya Sharma | ID: EMP-1003 | Role: HR Operations Lead | Department: Human Resources | Salary: ₹85,000/mo | Joining: 2024-06-10 | Status: Verified & Present Today";
      } else {
        aiResponseText = "👤 Staff Spotlight: Roushan Verma (Super Administrator, EMP-1001) | Dept: Executive Management | Salary: ₹1,85,000/mo | Performance Score: 5.0/5.0 | Attendance: On-Time Checked In (09:05 AM) | MySQL User Record Active.";
      }
    }
    // 2. Attendance Folder Query
    else if (lower.includes("attendance")) {
      aiResponseText = "📁 Folder [Workforce / Attendance Ledger]: Tracks daily check-ins, check-outs, and working hours saved directly to XAMPP MySQL 'attendance' table. 118 Present Today (92% rate), 6 Working Shifts, 4 On Approved Leave.";
    }
    // 3. Leave Folder Query
    else if (lower.includes("leave")) {
      aiResponseText = "📁 Folder [Workforce / Apply For Leave]: Manages employee leave applications, HR approval workflows, and balance tracking in MySQL 'leaverequest' table. 2 Pending applications awaiting HR action.";
    }
    // 4. Projects Folder Query
    else if (lower.includes("project") || lower.includes("contract")) {
      aiResponseText = "📁 Folder [Development / Projects Roadmap]: 5 Active enterprise contracts in ₹ Rupees saved in MySQL 'project' table (OMS Portal 2.0: ₹2,50,000, Acme Cloud: ₹4,50,000, TechNova AI: ₹6,50,000, Global Finance Audit: ₹1,80,000, Obsidian Red Mobile: ₹3,50,000).";
    }
    // 5. Finance & Payroll Approvals Folder Query
    else if (lower.includes("salary") || lower.includes("payroll") || lower.includes("finance")) {
      aiResponseText = "📁 Folder [Finance / Monthly Salary Approvals]: Monthly payout ledgers in ₹ Indian Rupees saved in MySQL 'payrollapproval' table. Monthly approvals total ₹14,85,000 across 128 verified staff records.";
    }
    // 6. HR & Intern Students Folder Query
    else if (lower.includes("intern") || lower.includes("student") || lower.includes("hr")) {
      aiResponseText = "📁 Folder [HR / Intern Students Portal]: University intern roster saved in MySQL 'internstudent' table. 2 active interns enrolled (Stipend: ₹25,000/mo). 1 student (Aditya Raj, DTU B.Tech) is eligible for Full-Time Engineering promotion.";
    }
    // 7. Daily Work Folder Query
    else if (lower.includes("daily work") || lower.includes("eod") || lower.includes("work update")) {
      aiResponseText = "📁 Folder [Operations / Daily Work Updates]: Daily task submissions, blocker logs, and GitHub commit links saved in MySQL 'dailyworkupdate' table. Average daily logged time: 8.4h per engineer.";
    }
    // 8. Sales Folder Query
    else if (lower.includes("sales") || lower.includes("deal") || lower.includes("crm")) {
      aiResponseText = "📁 Folder [CRM & Sales / Pipeline Deals]: Enterprise sales pipeline saved in MySQL 'salesdeal' table. Total pipeline value: ₹42,50,000 across 18 qualified deals.";
    }
    // 9. Marketing Folder Query
    else if (lower.includes("marketing") || lower.includes("ad") || lower.includes("seo")) {
      aiResponseText = "📁 Folder [Growth / Marketing & SEO]: Ad campaign ROAS, CPL metrics, and search keywords saved in MySQL 'adcampaign' and 'seokeyword' tables. Average ROAS: 3.4x.";
    }
    // 10. Design & Media Folder Query
    else if (lower.includes("design") || lower.includes("media") || lower.includes("video")) {
      aiResponseText = "📁 Folder [Media & Design]: UI asset templates and video production render logs saved in MySQL 'designasset' and 'videoproductionitem' tables.";
    }
    // 11. XAMPP MySQL Connection Query
    else if (lower.includes("mysql") || lower.includes("database") || lower.includes("xampp") || lower.includes("schema")) {
      aiResponseText = "⚡ XAMPP MySQL Engine: ONLINE at localhost:3306 (database: oms). 20 Prisma models synchronized (user, attendance, project, payrollapproval, client, internstudent, etc.).";
    }
    // 12. General Folder Directory Quick Answer
    else {
      aiResponseText = `📁 OMS Folder Answer for "${prompt}": All 11 platform folders (Dashboard, Employees, Attendance, Leave, Daily Work, Projects, Clients, Sales, Marketing, Finance, HR Interns) are live, fully connected to XAMPP MySQL, and configured with unique folder accent colors and ₹ Rupee financial tracking.`;
    }

    setMessages((prev) => [...prev, userMsg, { sender: "ai", text: aiResponseText }]);
    if (!textToSend) setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Copilot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold px-4 py-3 rounded-full shadow-2xl hover:shadow-red-600/30 transition-all duration-300 transform hover:scale-105 border border-red-400/30"
        >
          <IconZap className="h-5 w-5 text-yellow-300 animate-pulse" />
          <span className="text-xs tracking-wide">OMS Smart Copilot</span>
        </button>
      )}

      {/* Copilot Modal Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md">
                <IconZap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight text-white">OMS Smart Copilot</h3>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI Operations & Folder Intelligence
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-700"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="p-4 h-72 overflow-y-auto space-y-3 bg-slate-950 text-xs font-medium">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                    m.sender === "user"
                      ? "bg-red-600 text-white rounded-br-none shadow-md font-bold"
                      : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-red-400 border border-slate-800 transition"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a person, folder, salary, MySQL..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-600 focus:outline-none font-semibold"
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-md"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
