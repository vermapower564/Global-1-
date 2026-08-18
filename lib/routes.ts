export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_OTP: "/auth/verify-otp",
  RESET_PASSWORD: "/auth/reset-password",

  // Centralized Admin Routes
  ADMIN_HOME: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_EMPLOYEES: "/admin/employees",
  ADMIN_TASKS: "/admin/tasks",
  ADMIN_PROJECTS: "/admin/projects",
  ADMIN_BLOCKERS: "/admin/blockers",
  ADMIN_ATTENDANCE: "/admin/attendance",
  ADMIN_WORK: "/admin/work",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",

  // Centralized Employee Routes
  EMPLOYEE_HOME: "/employee",
  EMPLOYEE_DASHBOARD: "/employee/dashboard",
  EMPLOYEE_TASKS: "/employee/tasks",
  EMPLOYEE_WORK: "/employee/work",
  EMPLOYEE_ATTENDANCE: "/employee/attendance",
  EMPLOYEE_PROJECTS: "/employee/projects",
  EMPLOYEE_PROFILE: "/employee/profile",
} as const;

export function getHomeRouteForRole(role?: string | null): string {
  if (!role) return ROUTES.LOGIN;
  const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];
  return adminRoles.includes(role.toUpperCase()) ? ROUTES.ADMIN_HOME : ROUTES.EMPLOYEE_HOME;
}
