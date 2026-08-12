import { getCurrentUserContext } from "./userContextStore";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  reportingManager?: string;
  email: string;
  phone?: string;
  salary?: string;
  status: string;
  joiningDate: string;
  avatar: string;
  isProfileCompleted?: boolean;
  emergencyContact?: string;
  documentsVerified?: boolean;
}

export const initialEmployeeList: Employee[] = [
  {
    id: "EMP001",
    name: "Roushan Verma",
    role: "Super Admin",
    department: "Executive Management",
    reportingManager: "Board of Directors",
    email: "admin@oms.com",
    phone: "+91 98765 43210",
    salary: "150000",
    status: "Active",
    joiningDate: "2023-01-01",
    avatar: "RV",
    isProfileCompleted: false,
    emergencyContact: "",
    documentsVerified: false,
  },
  {
    id: "EMP002",
    name: "Rajesh Verma",
    role: "Director",
    department: "Executive Management",
    reportingManager: "Super Admin",
    email: "director@oms.com",
    phone: "+91 98765 11111",
    salary: "140000",
    status: "Active",
    joiningDate: "2023-01-15",
    avatar: "RJ",
    isProfileCompleted: true,
    emergencyContact: "+91 98765 00001",
    documentsVerified: true,
  },
  {
    id: "EMP003",
    name: "Priya Sharma",
    role: "HR Operations Lead",
    department: "Human Resources",
    reportingManager: "Director",
    email: "priya@oms.com",
    phone: "+91 98765 12345",
    salary: "95000",
    status: "Active",
    joiningDate: "2024-03-01",
    avatar: "PS",
    isProfileCompleted: true,
    emergencyContact: "+91 98765 00002",
    documentsVerified: true,
  },
  {
    id: "EMP004",
    name: "Amit Patel",
    role: "Finance Lead",
    department: "Accounts & Finance",
    reportingManager: "Director",
    email: "amit@oms.com",
    phone: "+91 98765 67890",
    salary: "105000",
    status: "Active",
    joiningDate: "2023-11-20",
    avatar: "AP",
    isProfileCompleted: true,
  },
  {
    id: "EMP005",
    name: "Vikram Malhotra",
    role: "Sales Manager",
    department: "Sales & CRM",
    reportingManager: "Director",
    email: "vikram@oms.com",
    phone: "+91 98765 98765",
    salary: "120000",
    status: "Active",
    joiningDate: "2023-08-05",
    avatar: "VM",
    isProfileCompleted: true,
  },
  {
    id: "EMP006",
    name: "Karan Gupta",
    role: "Sales Executive",
    department: "Sales & CRM",
    reportingManager: "Sales Manager (Vikram Malhotra)",
    email: "karan@oms.com",
    phone: "+91 98765 22222",
    salary: "65000",
    status: "Active",
    joiningDate: "2024-02-01",
    avatar: "KG",
    isProfileCompleted: true,
  },
  {
    id: "EMP007",
    name: "Sneha Reddy",
    role: "Digital Marketing Manager",
    department: "Digital Marketing",
    reportingManager: "Director",
    email: "sneha@oms.com",
    phone: "+91 98765 54321",
    salary: "98000",
    status: "Active",
    joiningDate: "2024-02-10",
    avatar: "SR",
    isProfileCompleted: true,
  },
  {
    id: "EMP008",
    name: "Deepak Kumar",
    role: "SEO Executive",
    department: "Digital Marketing",
    reportingManager: "Digital Marketing Manager (Sneha Reddy)",
    email: "deepak@oms.com",
    phone: "+91 98765 33333",
    salary: "60000",
    status: "Active",
    joiningDate: "2024-04-15",
    avatar: "DK",
    isProfileCompleted: false,
  },
  {
    id: "EMP009",
    name: "Aanya Sen",
    role: "Content Writer",
    department: "Digital Marketing",
    reportingManager: "Digital Marketing Manager (Sneha Reddy)",
    email: "aanya@oms.com",
    phone: "+91 98765 44444",
    salary: "55000",
    status: "Active",
    joiningDate: "2024-05-01",
    avatar: "AS",
    isProfileCompleted: true,
  },
  {
    id: "EMP010",
    name: "Ananya Roy",
    role: "Graphic Designer",
    department: "Design & Social Media",
    reportingManager: "Director",
    email: "ananya@oms.com",
    phone: "+91 98765 55555",
    salary: "75000",
    status: "Active",
    joiningDate: "2024-01-20",
    avatar: "AR",
    isProfileCompleted: true,
  },
  {
    id: "EMP011",
    name: "Rahul Sharma",
    role: "Video Editor",
    department: "Camera & Media Production",
    reportingManager: "Director",
    email: "rahul@oms.com",
    phone: "+91 98765 66666",
    salary: "70000",
    status: "Active",
    joiningDate: "2024-02-15",
    avatar: "RS",
    isProfileCompleted: true,
  },
  {
    id: "EMP012",
    name: "Mohit Sen",
    role: "Camera Team Lead",
    department: "Camera & Media Production",
    reportingManager: "Director",
    email: "mohit@oms.com",
    phone: "+91 98765 77777",
    salary: "68000",
    status: "Active",
    joiningDate: "2024-03-10",
    avatar: "MS",
    isProfileCompleted: true,
  },
  {
    id: "EMP013",
    name: "Aarav Sharma",
    role: "Project Manager",
    department: "Development & Engineering",
    reportingManager: "Director",
    email: "aarav@oms.com",
    phone: "+91 98765 88888",
    salary: "115000",
    status: "Active",
    joiningDate: "2023-09-01",
    avatar: "AS",
    isProfileCompleted: true,
  },
  {
    id: "EMP014",
    name: "Aditya Raj",
    role: "Intern",
    department: "Development & Engineering",
    reportingManager: "Project Manager (Aarav Sharma)",
    email: "aditya@oms.com",
    phone: "+91 98765 99999",
    salary: "25000",
    status: "Active",
    joiningDate: "2024-06-01",
    avatar: "AR",
    isProfileCompleted: false,
  },
];

export function getDeletedEmployeeIds(): string[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("oms_deleted_employee_ids");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function getStoredEmployees(): Employee[] {
  if (typeof window === "undefined") return initialEmployeeList;
  const deletedIds = getDeletedEmployeeIds();
  const data = localStorage.getItem("oms_employees");
  let list: Employee[] = initialEmployeeList;
  if (data) {
    try {
      list = JSON.parse(data);
    } catch (e) {
      list = initialEmployeeList;
    }
  } else {
    localStorage.setItem("oms_employees", JSON.stringify(initialEmployeeList));
  }
  return list.filter((emp) => !deletedIds.includes(emp.id) && !deletedIds.includes(emp.email));
}

export function getCurrentUserEmployee(): Employee {
  const employees = getStoredEmployees();
  if (typeof window !== "undefined") {
    const ctx = getCurrentUserContext();
    if (ctx && ctx.id) {
      const found = employees.find(
        (e) =>
          e.id.toLowerCase().trim() === ctx.id.toLowerCase().trim() ||
          e.email.toLowerCase().trim() === ctx.email.toLowerCase().trim()
      );
      if (found) return found;

      const avatarParts = (ctx.name || "Employee User").trim().split(" ");
      const avatar = avatarParts.length > 1 
        ? (avatarParts[0][0] + avatarParts[avatarParts.length - 1][0]).toUpperCase()
        : (ctx.name || "EU").slice(0, 2).toUpperCase();

      return {
        id: ctx.id,
        name: ctx.name || "Employee User",
        email: ctx.email || "employee@oms.com",
        role: ctx.role || "Developer",
        department: "Engineering & Operations",
        salary: "₹8,50,000",
        status: "Active",
        joiningDate: "2026-01-01",
        avatar,
        isProfileCompleted: true,
        phone: "+91 98765 00014",
        reportingManager: "Aarav Sharma (Project Manager)",
      };
    }
  }
  return employees[0];
}

export function updateEmployeeProfileCompletion(id: string, isCompleted: boolean) {
  const current = getStoredEmployees();
  const updated = current.map((emp) => (emp.id === id ? { ...emp, isProfileCompleted: isCompleted, documentsVerified: isCompleted } : emp));
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_employees", JSON.stringify(updated));
  }
  return updated;
}

export function addStoredEmployee(emp: {
  id?: string;
  name: string;
  role: string;
  department: string;
  reportingManager?: string;
  email: string;
  salary: string;
  phone?: string;
}): Employee {
  const current = getStoredEmployees();
  const nextNum = current.length + 1;
  const id = emp.id || `EMP${nextNum.toString().padStart(3, "0")}`;
  
  const parts = emp.name.trim().split(" ");
  const avatar = parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : emp.name.slice(0, 2).toUpperCase();

  const today = new Date().toISOString().split("T")[0];

  const newEmp: Employee = {
    ...emp,
    id,
    joiningDate: today,
    avatar,
    status: "Active",
    phone: emp.phone || "+91 98765 " + Math.floor(10000 + Math.random() * 90000),
    isProfileCompleted: false,
  };

  const updated = [newEmp, ...current.filter(e => e.id !== id)];
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_employees", JSON.stringify(updated));
  }

  // Remove from deleted IDs blacklist if re-added
  if (typeof window !== "undefined") {
    const deleted = getDeletedEmployeeIds().filter(d => d !== id && d !== emp.email);
    localStorage.setItem("oms_deleted_employee_ids", JSON.stringify(deleted));
  }

  return newEmp;
}

export function deleteStoredEmployee(id: string): Employee[] {
  const current = getStoredEmployees();
  const updated = current.filter((emp) => emp.id !== id && emp.email !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_employees", JSON.stringify(updated));
    const deleted = getDeletedEmployeeIds();
    if (!deleted.includes(id)) {
      localStorage.setItem("oms_deleted_employee_ids", JSON.stringify([...deleted, id]));
    }
  }
  return updated;
}
