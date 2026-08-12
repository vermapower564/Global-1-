export interface InternStudent {
  id: string;
  name: string;
  university: string;
  degree: string;
  department: string;
  mentorName?: string;
  mentor?: string;
  stipend: number;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  totalDays: number;
  performanceScore: number;
  completedTasks: number;
  totalTasks: number;
  status: "Active Intern" | "Eligible for Full-Time Job" | "Graduated & Promoted";
  assignedProject: string;
  githubRepo?: string;
  offeredFullTimeSalary?: number;
}

export const initialInternStudents: InternStudent[] = [
  {
    id: "INT-2026-01",
    name: "Aditya Raj",
    university: "Delhi Technological University (DTU)",
    degree: "B.Tech Computer Science (Final Year)",
    department: "Development & Engineering",
    mentorName: "Aarav Sharma (Project Manager)",
    mentor: "Aarav Sharma (Project Manager)",
    stipend: 25000,
    startDate: "2026-05-01",
    endDate: "2026-08-01",
    daysCompleted: 90,
    totalDays: 90,
    performanceScore: 4.9,
    completedTasks: 18,
    totalTasks: 18,
    status: "Eligible for Full-Time Job",
    assignedProject: "OMS Enterprise Cloud Portal & Microservices API",
    githubRepo: "github.com/oms-enterprise/cloud-portal-intern",
    offeredFullTimeSalary: 750000,
  },
  {
    id: "INT-2026-02",
    name: "Pooja Nair",
    university: "National Institute of Design (NID)",
    degree: "B.Des Communication Design",
    department: "UI/UX & Graphic Design",
    mentorName: "Ananya Roy (Design Lead)",
    mentor: "Ananya Roy (Design Lead)",
    stipend: 22000,
    startDate: "2026-05-15",
    endDate: "2026-08-15",
    daysCompleted: 84,
    totalDays: 90,
    performanceScore: 4.8,
    completedTasks: 14,
    totalTasks: 15,
    status: "Active Intern",
    assignedProject: "OMS Mobile App & Obsidian Red UI Design System",
    offeredFullTimeSalary: 650000,
  },
];
