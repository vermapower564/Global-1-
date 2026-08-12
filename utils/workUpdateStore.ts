export type WorkStatus = "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export interface EODWorkUpdate {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  projectName: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  priority: PriorityLevel;
  description: string;
  achievements?: string;
  blockers?: string;
  tomorrowPlan?: string;
  gitCommits?: string;
  driveLinks?: string;
  screenshots?: string;
  status: WorkStatus;
  rating?: number; // 1-5 Star rating by Manager
  managerRemarks?: string;
  submittedAt: string;
}

export const initialWorkUpdates: EODWorkUpdate[] = [
  {
    id: "EOD-101",
    employeeName: "Roushan Verma",
    employeeId: "EMP001",
    department: "Engineering",
    projectName: "OMS Enterprise Portal 2.0",
    clientName: "Internal Operations",
    date: "2026-08-04",
    startTime: "09:00 AM",
    endTime: "05:30 PM",
    hoursWorked: 8.5,
    priority: "HIGH",
    description: "Configured Next.js 16 App Router, built Prisma MySQL schema, and optimized SSR layout.",
    achievements: "Completed full Phase 1 & Phase 2 architecture blueprint integration with 0 build errors.",
    blockers: "None",
    tomorrowPlan: "Implement automated CSV & PDF export engine for executive reports.",
    gitCommits: "git commit -m 'feat: Add Prisma MySQL Schema & RBAC Engine'",
    driveLinks: "drive.google.com/oms-architecture-spec",
    screenshots: "drive.google.com/eod-screenshots-101",
    status: "APPROVED",
    rating: 5,
    managerRemarks: "Exceptional speed and technical execution. Blueprint perfectly aligned.",
    submittedAt: "2026-08-04 17:30",
  },
  {
    id: "EOD-102",
    employeeName: "Priya Sharma",
    employeeId: "EMP002",
    department: "Human Resources",
    projectName: "Q3 HR Onboarding & Leave Review",
    clientName: "Internal HR",
    date: "2026-08-04",
    startTime: "09:30 AM",
    endTime: "05:00 PM",
    hoursWorked: 7.5,
    priority: "MEDIUM",
    description: "Processed Q3 employee leave requests, conducted candidate interviews, and dispatched HR email notices.",
    achievements: "Approved 4 leave applications and conducted 3 senior dev interviews.",
    blockers: "Waiting on candidate feedback for Sales Lead role.",
    tomorrowPlan: "Finalize August payroll calculations.",
    status: "PENDING",
    submittedAt: "2026-08-04 17:45",
  },
  {
    id: "EOD-103",
    employeeName: "Sneha Reddy",
    employeeId: "EMP004",
    department: "Marketing",
    projectName: "Meta & Google B2B Ad Campaign",
    clientName: "Growth Acquisition",
    date: "2026-08-04",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    hoursWorked: 8.0,
    priority: "HIGH",
    description: "Optimized Meta & Google Ad campaigns, generated 45 CPL leads, and published weekly SEO blog.",
    achievements: "Increased ROAS to 4.53x on Meta Ad campaign.",
    blockers: "None",
    tomorrowPlan: "Launch LinkedIn B2B Ad Campaign.",
    status: "PENDING",
    submittedAt: "2026-08-04 18:00",
  },
];

export function getStoredWorkUpdates(): EODWorkUpdate[] {
  if (typeof window === "undefined") return initialWorkUpdates;
  const data = localStorage.getItem("oms_eod_updates");
  if (!data) {
    localStorage.setItem("oms_eod_updates", JSON.stringify(initialWorkUpdates));
    return initialWorkUpdates;
  }
  try {
    const parsed: EODWorkUpdate[] = JSON.parse(data);
    // Deduplicate by ID to ensure React keys are always unique
    const seen = new Set<string>();
    const deduplicated = parsed.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return deduplicated;
  } catch (e) {
    return initialWorkUpdates;
  }
}

export function addStoredWorkUpdate(update: Omit<EODWorkUpdate, "id" | "status" | "submittedAt">): EODWorkUpdate {
  const current = getStoredWorkUpdates();
  const maxIdNum = current.reduce((max, u) => {
    const num = parseInt(u.id.replace("EOD-", ""), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 100);

  const id = `EOD-${maxIdNum + 1}`;
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);

  const newUpdate: EODWorkUpdate = {
    ...update,
    id,
    status: "PENDING",
    submittedAt: now,
  };

  const updated = [newUpdate, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_eod_updates", JSON.stringify(updated));
  }
  return newUpdate;
}

export function evaluateWorkUpdate(
  id: string,
  status: WorkStatus,
  rating: number,
  managerRemarks: string
): EODWorkUpdate[] {
  const current = getStoredWorkUpdates();
  const updated = current.map((item) =>
    item.id === id ? { ...item, status, rating, managerRemarks } : item
  );

  if (typeof window !== "undefined") {
    localStorage.setItem("oms_eod_updates", JSON.stringify(updated));
  }
  return updated;
}

export function getFilteredWorkUpdates(
  departmentFilter: string = "All",
  statusFilter: string = "All",
  searchQuery: string = ""
): EODWorkUpdate[] {
  const current = getStoredWorkUpdates();
  return current.filter((item) => {
    const matchesDept = departmentFilter === "All" || item.department === departmentFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });
}
