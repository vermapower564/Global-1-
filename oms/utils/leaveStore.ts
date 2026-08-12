export interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId?: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  contactPhone?: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
}

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "LR-001",
    employeeName: "Rahul Sharma",
    employeeId: "EMP002",
    department: "Human Resources",
    leaveType: "Casual Leave",
    startDate: "2026-08-10",
    endDate: "2026-08-12",
    totalDays: 3,
    reason: "Attending family function out of station",
    status: "Pending",
    submittedAt: "2026-08-03",
  },
  {
    id: "LR-002",
    employeeName: "Amit Kumar",
    employeeId: "EMP003",
    department: "Finance",
    leaveType: "Medical Leave",
    startDate: "2026-08-05",
    endDate: "2026-08-06",
    totalDays: 2,
    reason: "High fever and doctor advised rest",
    status: "Approved",
    submittedAt: "2026-08-02",
  },
  {
    id: "LR-003",
    employeeName: "Sneha Reddy",
    employeeId: "EMP004",
    department: "Marketing",
    leaveType: "Paid Time Off",
    startDate: "2026-08-18",
    endDate: "2026-08-19",
    totalDays: 2,
    reason: "Personal work at hometown",
    status: "Pending",
    submittedAt: "2026-08-03",
  },
];

export function getStoredLeaveRequests(): LeaveRequest[] {
  if (typeof window === "undefined") return initialLeaveRequests;
  const data = localStorage.getItem("oms_leave_requests");
  if (!data) {
    localStorage.setItem("oms_leave_requests", JSON.stringify(initialLeaveRequests));
    return initialLeaveRequests;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialLeaveRequests;
  }
}

export function addStoredLeaveRequest(req: {
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  contactPhone?: string;
}): LeaveRequest {
  const current = getStoredLeaveRequests();
  const nextNum = current.length + 1;
  const id = `LR-${nextNum.toString().padStart(3, "0")}`;
  const today = new Date().toISOString().split("T")[0];

  const newReq: LeaveRequest = {
    ...req,
    id,
    status: "Pending",
    submittedAt: today,
  };

  const updated = [newReq, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_leave_requests", JSON.stringify(updated));
  }
  return newReq;
}

export function updateLeaveStatus(id: string, newStatus: "Approved" | "Rejected"): LeaveRequest[] {
  const current = getStoredLeaveRequests();
  const updated = current.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_leave_requests", JSON.stringify(updated));
  }
  return updated;
}
