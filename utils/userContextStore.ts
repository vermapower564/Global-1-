export type UserRole = "ADMIN_HR" | "EMPLOYEE_USER";

export interface CurrentUser {
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  activeMode: UserRole;
  avatarUrl?: string | null;
  assignedProjectTitle: string;
}

const STORAGE_KEY = "oms_current_user_context_v1";

const defaultUser: CurrentUser = {
  id: "EMP014",
  name: "Aditya Raj",
  email: "aditya.raj@oms.com",
  role: "Developer",
  activeMode: "ADMIN_HR", // Default to Admin/HR view, toggleable in Header
  assignedProjectTitle: "OMS Core Architecture & Platform Optimization",
};

export function getCurrentUserContext(): CurrentUser {
  if (typeof window === "undefined") return defaultUser;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return defaultUser;
}

export function setCurrentUserContext(user: CurrentUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {}
}

export function toggleUserRoleMode(): CurrentUser {
  const current = getCurrentUserContext();
  const nextMode: UserRole = current.activeMode === "ADMIN_HR" ? "EMPLOYEE_USER" : "ADMIN_HR";
  const updated = { ...current, activeMode: nextMode };
  setCurrentUserContext(updated);
  return updated;
}
