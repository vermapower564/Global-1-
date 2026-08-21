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
  ADMIN_REVIEWS: "/admin/reviews",

  // Centralized Employee Routes
  EMPLOYEE_HOME: "/employee",
  EMPLOYEE_DASHBOARD: "/employee/dashboard",
  EMPLOYEE_TASKS: "/employee/tasks",
  EMPLOYEE_WORK: "/employee/work",
  EMPLOYEE_ATTENDANCE: "/employee/attendance",
  EMPLOYEE_PROJECTS: "/employee/projects",
  EMPLOYEE_REVIEWS: "/employee/reviews",
  EMPLOYEE_FEEDBACK: "/employee/feedback",
  EMPLOYEE_PROFILE: "/employee/profile",
} as const;

export function getHomeRouteForRole(role?: string | null): string {
  if (!role) return "/login";
  const upperRole = role.toUpperCase();
  if (["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR"].includes(upperRole)) return "/admin/dashboard";
  if (upperRole === "HR") return "/hr";
  if (upperRole === "PROJECT_MANAGER") return "/project-manager";
  if (upperRole === "TEAM_LEADER") return "/team-leader";
  return "/employee/dashboard";
}
