"use client";

import React, { useState } from "react";
import { IconZap } from "@/components/Icons";

interface CopilotMessage {
  sender: "ai" | "user";
  text: string;
  employeeCard?: {
    name: string;
    email: string;
    role: string;
    employeeId: string;
    department: string;
    status: string;
    salary?: string;
  };
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      sender: "ai",
      text: "Greetings! I am OMS Smart Copilot. Ask me about any employee person, module (Attendance, Salary, Projects, Leave, HR Interns, Sales), or MySQL database table.",
    },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    "Tell me about Roushan Verma",
    "Tell me about Aditya Raj",
    "Tell me about Priya Sharma",
    "Attendance Folder Info",
    "Monthly Salary Approvals",
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim()) return;

    const userMsg: CopilotMessage = { sender: "user", text: prompt };
    let aiResponseText = "";
    let empCard: CopilotMessage["employeeCard"] | undefined = undefined;

    const lower = prompt.toLowerCase();

    // 1. Employee Person Queries
    if (
      lower.includes("person") ||
      lower.includes("roushan") ||
      lower.includes("aditya") ||
      lower.includes("priya") ||
      lower.includes("employee info") ||
      lower.includes("staff info") ||
      lower.includes("tell me about")
    ) {
      if (lower.includes("roushan")) {
        aiResponseText = "Staff details found in MySQL database:";
        empCard = {
          name: "Roushan Verma",
          employeeId: "EMP001 / EMP-8595",
          email: "roushan.verma@gmail.com",
          role: "Super Administrator",
          department: "Development & Engineering",
          status: "🟢 ACTIVE",
          salary: "₹1,85,000 / mo",
        };
      } else if (lower.includes("aditya")) {
        aiResponseText = "Staff details found in MySQL database:";
        empCard = {
          name: "Aditya Raj",
          employeeId: "EMP014",
          email: "aditya.dev@gmail.com",
          role: "Software Developer",
          department: "Development & Engineering",
          status: "🟢 ACTIVE",
          salary: "₹95,000 / mo",
        };
      } else if (lower.includes("priya")) {
        aiResponseText = "Staff details found in MySQL database:";
        empCard = {
          name: "Priya Sharma",
          employeeId: "EMP002 / EMP-8316",
          email: "priya.hr@gmail.com",
          role: "HR Operations Lead",
          department: "Human Resources",
          status: "🟢 ACTIVE",
          salary: "₹85,000 / mo",
        };
      } else {
        aiResponseText = "Staff details found in MySQL database:";
        empCard = {
          name: "Roushan Verma",
          employeeId: "EMP001",
          email: "admin@gmail.com",
          role: "Super Administrator",
          department: "Development & Engineering",
          status: "🟢 ACTIVE",
          salary: "₹1,85,000 / mo",
        };
      }
    }
    // 2. Attendance Folder Query
    else if (lower.includes("attendance")) {
      aiResponseText = "📁 Folder [Workforce / Attendance Ledger]: Tracks daily check-ins, check-outs, and worked hours in MySQL 'attendance' table. 118 Present Today (92% rate), 6 Active Shifts, 4 On Approved Leave.";
    }
    // 3. Leave Folder Query
    else if (lower.includes("leave")) {
      aiResponseText = "📁 Folder [Workforce / Apply For Leave]: Manages employee leave applications, HR approval workflows, and balance tracking in MySQL 'leaverequest' table. 2 Pending applications awaiting HR action.";
    }
    // 4. Projects Folder Query
    else if (lower.includes("project") || lower.includes("contract")) {
      aiResponseText = "📁 Folder [Development / Projects Roadmap]: Active enterprise contracts saved in MySQL 'project' table (OMS Portal 2.0, Acme Logistics, TechNova AI, Global Finance Audit).";
    }
    // 5. Finance & Payroll Approvals Folder Query
    else if (lower.includes("salary") || lower.includes("payroll") || lower.includes("finance")) {
      aiResponseText = "📁 Folder [Finance / Monthly Salary Approvals]: Monthly payout ledgers in ₹ Indian Rupees saved in MySQL 'payrollapproval' table.";
    }
    // 6. HR & Intern Students Folder Query
    else if (lower.includes("intern") || lower.includes("student") || lower.includes("hr")) {
      aiResponseText = "📁 Folder [HR / Intern Students Portal]: University intern roster saved in MySQL 'internstudent' table. 2 active interns enrolled.";
    }
    // 7. Daily Work Folder Query
    else if (lower.includes("daily work") || lower.includes("eod") || lower.includes("work update")) {
      aiResponseText = "📁 Folder [Operations / Daily Work Updates]: Daily task submissions, blocker logs, and commit links saved in MySQL 'dailyworkupdate' table.";
    }
    // 8. General Folder Directory Quick Answer
    else {
      aiResponseText = `📁 OMS Smart Copilot: System online at localhost:3306 (database: oms). 29 Prisma models synchronized.`;
    }

    setMessages((prev) => [
      ...prev,
      userMsg,
      { sender: "ai", text: aiResponseText, employeeCard: empCard },
    ]);
    if (!textToSend) setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden screen-only">
      {/* Floating Copilot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-950 text-white font-extrabold px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 border border-slate-700 cursor-pointer"
        >
          <IconZap className="h-5 w-5 text-yellow-400 animate-pulse" />
          <span className="text-xs tracking-wide font-black text-white">OMS Smart Copilot</span>
        </button>
      )}

      {/* Copilot Modal Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <IconZap className="h-4 w-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight text-white">OMS Smart Copilot</h3>
                <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI Operations & Employee Intelligence
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="p-4 h-80 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-900 text-xs font-medium">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl leading-relaxed ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-md font-bold"
                      : "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-xs space-y-2"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* STRUCTURED EMPLOYEE CARD WITH DARK CONTRAST STYLING FOR NAME, EMAIL, ROLE */}
                  {m.employeeCard && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-2 text-xs">
                      {/* NAME IN DARK BOLD COLOR */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Employee Name</span>
                        <span className="text-slate-950 dark:text-white font-black text-sm">
                          {m.employeeCard.name}
                        </span>
                      </div>

                      {/* EMPLOYEE ID */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Employee ID</span>
                        <span className="text-slate-900 dark:text-slate-100 font-mono font-black">
                          {m.employeeCard.employeeId}
                        </span>
                      </div>

                      {/* EMAIL IN DARK COLOR */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Gmail Address</span>
                        <a
                          href={`mailto:${m.employeeCard.email}`}
                          className="text-slate-950 dark:text-blue-400 font-mono font-black hover:underline"
                        >
                          {m.employeeCard.email}
                        </a>
                      </div>

                      {/* ROLE IN DARK COLOR */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Role / Designation</span>
                        <span className="text-slate-950 dark:text-white font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                          {m.employeeCard.role}
                        </span>
                      </div>

                      {/* DEPARTMENT */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Department</span>
                        <span className="text-slate-900 dark:text-slate-200 font-bold">
                          {typeof m.employeeCard.department === "object" ? (m.employeeCard.department as any)?.name : m.employeeCard.department}
                        </span>
                      </div>

                      {/* STATUS */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Status</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                          {m.employeeCard.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] font-extrabold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
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
            className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a person, name, email, role, folder..."
              className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none font-bold"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-md cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
