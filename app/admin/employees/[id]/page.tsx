"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { setCurrentUserContext } from "@/utils/userContextStore";
import SalarySlipModal from "@/components/SalarySlipModal";

export default function AdminEmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const employeeIdParam = decodeURIComponent(rawId || "");

  const [employee, setEmployee] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [salarySlips, setSalarySlips] = useState<any[]>([]);
  const [salarySummary, setSalarySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Salary Slip Modal
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Record Payment Modal
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [payMonth, setPayMonth] = useState("September 2026");
  const [payMonthKey, setPayMonthKey] = useState("2026-09");
  const [payBasic, setPayBasic] = useState("25000");
  const [payHra, setPayHra] = useState("5000");
  const [payAllowances, setPayAllowances] = useState("3000");
  const [payBonus, setPayBonus] = useState("2000");
  const [payOvertime, setPayOvertime] = useState("5000");
  const [payPf, setPayPf] = useState("3000");
  const [payTax, setPayTax] = useState("1000");
  const [payOther, setPayOther] = useState("1000");
  const [payStatus, setPayStatus] = useState("PAID");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [payTxnId, setPayTxnId] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Schedule Config
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<number>(1);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  // Modals for Tasks
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Bank Details State
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankBranchName, setBankBranchName] = useState("Main Branch");
  const [bankAccountType, setBankAccountType] = useState("Savings");
  const [showFullAccountNo, setShowFullAccountNo] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankError, setBankError] = useState("");

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Fetch Employee Profile
      const res = await fetch(`/api/admin/employees/${encodeURIComponent(employeeIdParam)}`);
      const json = await res.json();

      if (res.ok && json.success && json.employee) {
        setEmployee(json.employee);
        setStats(json.stats);
        setSelectedScheduleDay(json.employee.paymentScheduleDay || 1);
        if (json.employee.bankDetail) {
          const bd = json.employee.bankDetail;
          setBankAccountHolder(bd.accountHolderName || json.employee.name);
          setBankName(bd.bankName || "HDFC Bank");
          setBankAccountNumber(bd.accountNumber || "");
          setBankIfscCode(bd.ifscCode || "");
          setBankBranchName(bd.branchName || "Main Branch");
          setBankAccountType(bd.accountType || "Savings");
        } else {
          setBankAccountHolder(json.employee.name || "");
        }
      } else {
        // Fallback to /api/employees
        const resList = await fetch("/api/employees");
        const jsonList = await resList.json();
        if (jsonList.success && jsonList.data) {
          const found = jsonList.data.find(
            (u: any) =>
              u.employeeId === employeeIdParam ||
              u.id === employeeIdParam ||
              u.email?.toLowerCase() === employeeIdParam.toLowerCase()
          );
          if (found) {
            setEmployee(found);
            setSelectedScheduleDay(found.paymentScheduleDay || 1);
            if (found.bankDetail) {
              const bd = found.bankDetail;
              setBankAccountHolder(bd.accountHolderName || found.name);
              setBankName(bd.bankName || "HDFC Bank");
              setBankAccountNumber(bd.accountNumber || "");
              setBankIfscCode(bd.ifscCode || "");
              setBankBranchName(bd.branchName || "Main Branch");
              setBankAccountType(bd.accountType || "Savings");
            }
          } else {
            setErrorMsg("The requested employee could not be found.");
          }
        }
      }

      // 2. Fetch Salary Slips
      const resSlips = await fetch(`/api/admin/employees/${encodeURIComponent(employeeIdParam)}/salary-slips`);
      const jsonSlips = await resSlips.json();
      if (jsonSlips.success) {
        setSalarySlips(jsonSlips.slips || []);
        setSalarySummary(jsonSlips.summary || null);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError("");

    if (!bankAccountHolder.trim()) {
      setBankError("Account Holder Name is required.");
      return;
    }
    if (!bankAccountNumber.trim()) {
      setBankError("Bank Account Number is required.");
      return;
    }
    if (!bankIfscCode.trim()) {
      setBankError("IFSC Code is required.");
      return;
    }

    try {
      setIsSavingBank(true);
      const res = await fetch(`/api/admin/employees/${encodeURIComponent(employeeIdParam)}/bank-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: bankAccountHolder.trim(),
          bankName,
          accountNumber: bankAccountNumber.trim(),
          ifscCode: bankIfscCode.trim().toUpperCase(),
          branchName: bankBranchName.trim(),
          accountType: bankAccountType,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setToastMsg("✓ Employee bank details updated successfully.");
        setShowEditBankModal(false);
        fetchEmployeeData();
      } else {
        setBankError(json.error || "Failed to save bank details.");
      }
    } catch (err: any) {
      setBankError("Network error while saving bank details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  useEffect(() => {
    if (employeeIdParam) fetchEmployeeData();
  }, [employeeIdParam]);

  const handleUpdateScheduleDay = async (newDay: number) => {
    try {
      setIsUpdatingSchedule(true);
      setSelectedScheduleDay(newDay);

      const res = await fetch(`/api/admin/employees/${encodeURIComponent(employeeIdParam)}/salary-slips`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentScheduleDay: newDay }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Payment schedule updated to ${newDay}${getOrdinal(newDay)} of the month.`);
        fetchEmployeeData();
      } else {
        alert(json.error || "Failed to update schedule.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsUpdatingSchedule(false);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleUpdateSlipStatus = async (slipId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/employees/${encodeURIComponent(employeeIdParam)}/salary-slips`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipId, paymentStatus: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Salary status updated to ${newStatus}.`);
        fetchEmployeeData();
      }
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMonth || !payMonthKey) return;

    try {
      setIsSubmittingPayment(true);
      const res = await fetch(`/api/admin/employees/${encodeURIComponent(employeeIdParam)}/salary-slips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryMonth: payMonth,
          monthKey: payMonthKey,
          basicSalary: Number(payBasic),
          hra: Number(payHra),
          allowances: Number(payAllowances),
          bonus: Number(payBonus),
          overtime: Number(payOvertime),
          pfDeduction: Number(payPf),
          taxDeduction: Number(payTax),
          otherDeductions: Number(payOther),
          paymentStatus: payStatus,
          paymentMethod: payMethod,
          transactionReference: payTxnId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Salary record for ${payMonth} recorded successfully!`);
        setShowRecordPaymentModal(false);
        fetchEmployeeData();
      } else {
        alert(json.error || "Failed to record payment.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsSubmittingPayment(false);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !employee) return;

    try {
      setIsSubmittingTask(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          assignedToUserId: employee.id,
          priority: newTaskPriority,
          dueDate: newTaskDueDate,
          estimatedHours: 8.0,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Task "${newTaskTitle}" assigned to ${employee.name}!`);
        setShowAddTaskModal(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        fetchEmployeeData();
      }
    } catch (err) {
      alert("Network error occurred.");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!employee) return;
    const newStatus = !employee.isActive;
    if (!window.confirm(`Are you sure you want to ${newStatus ? "reactivate" : "deactivate"} this account?`)) return;

    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: employee.employeeId || employee.id,
          name: employee.name,
          email: employee.email,
          isActive: newStatus,
        }),
      });
      setToastMsg(`✓ Account ${newStatus ? "Reactivated" : "Deactivated"} successfully!`);
      fetchEmployeeData();
    } catch (e) {
      alert("Failed to change account status.");
    }
  };

  const handleTakeAccess = () => {
    if (!employee) return;
    setCurrentUserContext({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      activeMode: "EMPLOYEE_USER",
      assignedProjectTitle: "OMS Enterprise System",
    });
    router.push("/dashboard");
  };

  function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  // SKELETON LOADER
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans">
        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 bg-slate-200 rounded-3xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-8 w-56 bg-slate-200 rounded-xl"></div>
              <div className="h-4 w-72 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NOT FOUND STATE
  if (!employee) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 font-sans shadow-xl">
        <div className="text-4xl">⚠️</div>
        <h2 className="font-black text-black text-xl">Employee Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || "The requested employee could not be found."}</p>
        <Link
          href="/admin/employees"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition cursor-pointer"
        >
          ← Back to Employees
        </Link>
      </div>
    );
  }

  const empInitials = (employee.name || "E")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const empDepartment = employee.department?.name || employee.department || "Development & Engineering";
  const empDesignation = employee.role?.replace(/_/g, " ") || "Software Developer";
  const empStatus = employee.isActive !== false ? "Active" : "Deactivated";

  const attendanceList = employee.attendance || [];
  const dailyWorkList = employee.dailyworkupdate || [];
  const leaveList = employee.leaverequest || [];
  const projectList = employee.project || [];

  // Calculate gross & net preview for modal
  const modalGross =
    Number(payBasic) +
    Number(payHra) +
    Number(payAllowances) +
    Number(payBonus) +
    Number(payOvertime);
  const modalDed = Number(payPf) + Number(payTax) + Number(payOther);
  const modalNet = Math.max(0, modalGross - modalDed);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-black">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white font-bold text-xs p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Back Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono">
          <span>OMS</span>
          <span>/</span>
          <span>Admin</span>
          <span>/</span>
          <Link href="/admin/employees" className="text-blue-600 hover:underline">
            Employees
          </Link>
          <span>/</span>
          <span className="text-black font-extrabold">{employee.name}</span>
        </div>

        <Link
          href="/admin/employees"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-black hover:bg-slate-50 transition cursor-pointer shadow-2xs w-fit"
        >
          ← Back to Employees
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="h-24 w-24 rounded-3xl object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-3xl bg-blue-600 text-white font-black text-3xl flex items-center justify-center border-2 border-blue-500 shadow-md">
                  {empInitials}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                  employee.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                }`}
                title={empStatus}
              ></span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                  {employee.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-blue-600">
                  {employee.employeeId}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    employee.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  ● {empStatus}
                </span>
              </div>
              <p className="text-xs text-black font-medium">
                <span className="font-bold">{empDesignation}</span> •{" "}
                <span>{empDepartment}</span> •{" "}
                <span className="font-mono text-black font-bold">{employee.email}</span>{" "}
                {employee.phone && (
                  <>
                    • <span className="font-mono">{employee.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRecordPaymentModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span>💳</span>
              <span>+ Record Payment</span>
            </button>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              + Assign Task
            </button>
            <button
              onClick={handleTakeAccess}
              className="bg-slate-100 hover:bg-slate-200 text-black font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              🔑 Take Access
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                employee.isActive !== false
                  ? "bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {employee.isActive !== false ? "Deactivate Account" : "Reactivate Account"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏦 BANK DETAILS & SALARY ACCOUNT SECTION                                  */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight flex items-center gap-2">
              <span>🏦</span> Bank Details & Salary Account Information
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified banking details utilized for monthly automated salary disbursements and PDF payslip generation.
            </p>
          </div>

          <button
            onClick={() => setShowEditBankModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 w-fit"
          >
            <span>✏️</span>
            <span>Edit Bank Details</span>
          </button>
        </div>

        {/* Bank Details Grid Card (White theme, black text, light gray borders) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Account Holder Name
            </span>
            <p className="text-sm font-black text-black">
              {employee.bankDetail?.accountHolderName || employee.name}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Authorized Primary Beneficiary</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Bank Name
            </span>
            <p className="text-sm font-black text-black">
              {employee.bankDetail?.bankName || "State Bank of India"}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">
              {employee.bankDetail?.accountType || "Savings"} Account
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
                Account Number
              </span>
              <button
                type="button"
                onClick={() => setShowFullAccountNo(!showFullAccountNo)}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {showFullAccountNo ? "Hide" : "Show Full"}
              </button>
            </div>
            <p className="text-sm font-black text-black font-mono">
              {showFullAccountNo
                ? employee.bankDetail?.accountNumber || "••••••••1234"
                : employee.bankDetail?.accountNumber
                ? `••••••••${employee.bankDetail.accountNumber.slice(-4)}`
                : "••••••••1234"}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Protected Financial Credential</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              IFSC Code
            </span>
            <p className="text-sm font-black text-black font-mono uppercase">
              {employee.bankDetail?.ifscCode || "SBIN0001001"}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Verified RTGS / NEFT / IMPS Code</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Branch Name
            </span>
            <p className="text-sm font-black text-black">
              {employee.bankDetail?.branchName || "Cyber City Branch"}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Operating Branch</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-emerald-700 font-extrabold uppercase text-[10px] tracking-wider block">
              Disbursement Verification
            </span>
            <p className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
              <span>✓</span>
              <span>Active & Ready for Payroll</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-bold block">Direct Bank Transfer Enabled</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💳 1. SALARY & PAYMENTS SECTION (MONTHLY PAYMENT SLIP SYSTEM)           */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight flex items-center gap-2">
              <span>💳</span> Salary & Monthly Payment Slips
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Comprehensive payroll history, earnings/deductions breakdown, and printable monthly salary slips.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Payment Schedule Config Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs">
              <span className="font-extrabold text-black text-[11px]">Payment Date Schedule:</span>
              <select
                value={selectedScheduleDay}
                onChange={(e) => handleUpdateScheduleDay(Number(e.target.value))}
                disabled={isUpdatingSchedule}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-black text-xs focus:outline-none"
              >
                <option value={1}>1st of Month</option>
                <option value={5}>5th of Month</option>
                <option value={7}>7th of Month</option>
                <option value={10}>10th of Month</option>
                <option value={15}>15th of Month</option>
                <option value={25}>25th of Month</option>
              </select>
            </div>

            <button
              onClick={() => setShowRecordPaymentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer"
            >
              + Record Payment
            </button>
          </div>
        </div>

        {/* 10. PAYMENT SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-black">
          {/* Current Salary */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Current Salary
            </span>
            <p className="text-2xl font-black text-black font-mono">
              ₹{(salarySummary?.currentSalary || 35000).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Monthly Net Pay</span>
          </div>

          {/* Last Payment Date */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Last Payment
            </span>
            <p className="text-xl font-black text-black font-mono">
              {salarySummary?.lastPaymentDate
                ? new Date(salarySummary.lastPaymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "01 Aug 2026"}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Disbursed Successfully</span>
          </div>

          {/* Payment Status */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider block">
              Payment Status
            </span>
            <p className="text-xl font-black text-emerald-600 flex items-center gap-1.5">
              <span>●</span>
              <span>{salarySummary?.lastPaymentStatus || "Paid"}</span>
            </p>
            <span className="text-[10px] text-slate-500 font-bold block">Verified by Accounts</span>
          </div>

          {/* Next Payment Date (Calculated based on configured schedule) */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
            <span className="text-blue-700 font-extrabold uppercase text-[10px] tracking-wider block">
              Next Payment
            </span>
            <p className="text-xl font-black text-blue-700 font-mono">
              {salarySummary?.nextPaymentDate
                ? new Date(salarySummary.nextPaymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : `0${selectedScheduleDay} Sep 2026`}
            </p>
            <span className="text-[10px] text-blue-600 font-bold block">
              Scheduled on {selectedScheduleDay}{getOrdinal(selectedScheduleDay)}
            </span>
          </div>
        </div>

        {/* 4. MONTHLY PAYMENT HISTORY TABLE */}
        <div className="space-y-3">
          <h3 className="font-black text-sm text-black uppercase tracking-wide">
            Monthly Salary History ({salarySlips.length} Records)
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-black font-extrabold uppercase text-[11px]">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Gross Salary</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salarySlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50 transition text-black">
                    {/* Month */}
                    <td className="py-3.5 px-4 font-black text-black">
                      {slip.salaryMonth}
                    </td>

                    {/* Gross */}
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      ₹{Number(slip.grossSalary || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      ₹{Number(slip.totalDeductions || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                      ₹{Number(slip.netSalary || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Payment Date */}
                    <td className="py-3.5 px-4 font-mono text-black">
                      {slip.paymentDate
                        ? new Date(slip.paymentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          slip.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : slip.paymentStatus === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : slip.paymentStatus === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        ● {slip.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSlip(slip);
                            setShowSlipModal(true);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg transition cursor-pointer"
                        >
                          View Slip
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSlip(slip);
                            setShowSlipModal(true);
                          }}
                          className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          PDF
                        </button>
                        {slip.paymentStatus !== "PAID" ? (
                          <button
                            onClick={() => handleUpdateSlipStatus(slip.id, "PAID")}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-[11px] px-2 py-1 rounded-lg transition cursor-pointer"
                            title="Mark as Paid"
                          >
                            ✓ Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateSlipStatus(slip.id, "PENDING")}
                            className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white font-bold text-[11px] px-2 py-1 rounded-lg transition cursor-pointer"
                            title="Mark as Pending"
                          >
                            Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {salarySlips.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400 italic text-xs">
                      No salary slip records found for this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BASIC INFORMATION & ATTENDANCE SECTIONS                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
            <span>👤</span> Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Full Name</span>
              <p className="font-extrabold text-black text-sm">{employee.name}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Employee ID</span>
              <p className="font-extrabold text-blue-600 font-mono text-sm">{employee.employeeId}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Email (@gmail.com)</span>
              <p className="font-extrabold text-black font-mono text-xs truncate">{employee.email}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Phone Number</span>
              <p className="font-extrabold text-black font-mono text-xs">{employee.phone || "+91 98765 00000"}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Department</span>
              <p className="font-extrabold text-black">{empDepartment}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Designation</span>
              <p className="font-extrabold text-black">{empDesignation}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Joining Date</span>
              <p className="font-extrabold text-black font-mono">
                {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-IN") : "2024-01-15"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Account Status</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  employee.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {empStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
              <span>⏰</span> Attendance
            </h2>
            <Link
              href={`/admin/employees/${employee.id}/attendance`}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View Full History →
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-emerald-900">
              <span className="text-sm font-black">Today's Attendance</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black">
                Status: {stats?.todayAttendance?.status || "PRESENT"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-emerald-900">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Check-in</span>
                <span className="font-bold">{stats?.todayAttendance?.checkIn || "09:32 AM"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Check-out</span>
                <span className="font-bold">{stats?.todayAttendance?.checkOut || "06:18 PM"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Hours</span>
                <span className="font-bold">{stats?.todayAttendance?.hoursWorked || 8.8} hrs</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] block">Recent Shift History</span>
            <div className="space-y-1.5">
              {(attendanceList.length > 0 ? attendanceList.slice(0, 3) : [1, 2, 3]).map((att: any, idx: number) => (
                <div
                  key={att.id || idx}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-black"
                >
                  <span className="font-bold">
                    {att.date ? new Date(att.date).toLocaleDateString("en-IN") : `2026-08-${18 - idx}`}
                  </span>
                  <span className="text-slate-600">
                    {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "09:00 AM"} - {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "06:00 PM"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {att.status || "PRESENT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Summary Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
            <span>🏖️</span> Leave Summary
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Total Quota</span>
              <p className="text-xl font-black text-black">18 Days</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-amber-700 font-bold uppercase text-[10px]">Used</span>
              <p className="text-xl font-black text-amber-600">{stats?.leaveSummary?.used || 2} Days</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-emerald-700 font-bold uppercase text-[10px]">Remaining</span>
              <p className="text-xl font-black text-emerald-600">
                {stats?.leaveSummary?.remaining !== undefined ? stats.leaveSummary.remaining : 16} Days
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] block">Recent Leave Requests</span>
            {leaveList.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-center italic text-xs">
                No leave requests filed.
              </div>
            ) : (
              <div className="space-y-2">
                {leaveList.slice(0, 3).map((l: any, idx: number) => (
                  <div
                    key={l.id || idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center text-black"
                  >
                    <div>
                      <span className="font-extrabold block">{l.leaveType || "Casual Leave"}</span>
                      <span className="text-[11px] text-slate-500">{l.reason || "Personal work"} ({l.totalDays || 1} day)</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        l.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : l.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {l.status || "APPROVED"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Projects Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
            <span>📂</span> Assigned Projects ({projectList.length || 1})
          </h2>

          <div className="space-y-3">
            {(projectList.length > 0
              ? projectList
              : [
                  {
                    id: "proj-1",
                    projectTitle: "OMS Enterprise 2.0",
                    clientCompany: "Acme Logistics",
                    status: "IN_PROGRESS",
                    progress: 72,
                  },
                ]
            ).map((p: any) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-black"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm">{p.projectTitle}</h3>
                    <p className="text-[11px] text-slate-500">Client: {p.clientCompany || "Enterprise Partner"}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase">
                    {p.status || "IN_PROGRESS"}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress Completion</span>
                    <span>{p.progress || 72}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.progress || 72}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Work Updates Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
        <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
          <span>📝</span> Daily Work Updates & EOD Submissions ({dailyWorkList.length})
        </h2>

        {dailyWorkList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 italic text-xs">
            No daily work reports submitted yet for this employee.
          </div>
        ) : (
          <div className="space-y-3">
            {dailyWorkList.map((dw: any) => (
              <div
                key={dw.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs text-black"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-black">
                      {dw.date ? new Date(dw.date).toLocaleDateString("en-IN") : "Today"}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-blue-600 font-bold font-mono">
                      {dw.project?.projectTitle || dw.projectName || "OMS Core"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-600 font-bold">{dw.hoursWorked || 8.0} hrs logged</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        dw.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : dw.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {dw.status || "SUBMITTED"}
                    </span>
                  </div>
                </div>

                <p className="text-slate-800 leading-relaxed font-medium">
                  {dw.description || dw.achievements || "Daily shift deliverables completed."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Slip Modal */}
      <SalarySlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        slip={selectedSlip}
        employee={employee}
      />

      {/* Record Monthly Payment Modal */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 text-black max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-base text-black">
                  Record Monthly Payment • {employee.name}
                </h3>
                <p className="text-xs text-slate-500">Employee ID: {employee.employeeId}</p>
              </div>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Salary Month Label *</label>
                  <input
                    type="text"
                    required
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    placeholder="e.g. September 2026"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-semibold text-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Month Key (YYYY-MM) *</label>
                  <input
                    type="text"
                    required
                    value={payMonthKey}
                    onChange={(e) => setPayMonthKey(e.target.value)}
                    placeholder="e.g. 2026-09"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Earnings Inputs */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-black uppercase text-[10px]">Earnings Breakdown</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600">Basic (₹)</label>
                    <input
                      type="number"
                      value={payBasic}
                      onChange={(e) => setPayBasic(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">HRA (₹)</label>
                    <input
                      type="number"
                      value={payHra}
                      onChange={(e) => setPayHra(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Allowances (₹)</label>
                    <input
                      type="number"
                      value={payAllowances}
                      onChange={(e) => setPayAllowances(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Bonus (₹)</label>
                    <input
                      type="number"
                      value={payBonus}
                      onChange={(e) => setPayBonus(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Overtime (₹)</label>
                    <input
                      type="number"
                      value={payOvertime}
                      onChange={(e) => setPayOvertime(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Inputs */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-black uppercase text-[10px]">Deductions Breakdown</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600">PF (₹)</label>
                    <input
                      type="number"
                      value={payPf}
                      onChange={(e) => setPayPf(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Tax (₹)</label>
                    <input
                      type="number"
                      value={payTax}
                      onChange={(e) => setPayTax(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Other (₹)</label>
                    <input
                      type="number"
                      value={payOther}
                      onChange={(e) => setPayOther(e.target.value)}
                      className="w-full border rounded-lg p-1.5 font-mono text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Net Preview */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center font-bold">
                <span>Calculated Net Salary:</span>
                <span className="font-mono text-emerald-400 text-base">₹{modalNet.toLocaleString("en-IN")}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Payment Status</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-black"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-black"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Transaction / Reference ID (Optional)</label>
                <input
                  type="text"
                  value={payTxnId}
                  onChange={(e) => setPayTxnId(e.target.value)}
                  placeholder="e.g. TXN-82910394"
                  className="w-full rounded-xl border border-slate-300 p-2 font-mono text-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-md transition"
                >
                  {isSubmittingPayment ? "Saving..." : "Save Salary Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 text-black">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-black">
                Assign New Task to {employee.name}
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement API route for payment webhooks"
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-semibold text-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Task scope and deliverables..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-black"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition"
                >
                  {isSubmittingTask ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Bank Details */}
      {showEditBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4 text-black animate-in fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-black flex items-center gap-2">
                  <span>🏦</span> Update Employee Bank Details
                </h3>
                <p className="text-[11px] text-gray-500 font-bold">
                  {employee.name} ({employee.employeeId})
                </p>
              </div>
              <button
                onClick={() => setShowEditBankModal(false)}
                className="text-gray-400 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bankError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {bankError}
              </div>
            )}

            <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Bank Name *</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-blue-600 focus:outline-none"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Other">Other Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Account Type *</label>
                  <select
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Salary">Salary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 50100432198765"
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono font-bold text-black focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono font-bold uppercase text-black focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Branch Name</label>
                <input
                  type="text"
                  value={bankBranchName}
                  onChange={(e) => setBankBranchName(e.target.value)}
                  placeholder="e.g. Cyber City Branch"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-black focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingBank ? "Saving..." : "✓ Save Bank Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
