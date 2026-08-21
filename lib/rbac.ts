export type Role =
  | "SUPER_ADMIN"
  | "DIRECTOR"
  | "ADMIN_HR"
  | "HR"
  | "FINANCE"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "PROJECT_MANAGER"
  | "TEAM_LEADER"
  | "DEVELOPER"
  | "UI_UX_DESIGNER"
  | "GRAPHIC_DESIGNER"
  | "VIDEO_EDITOR"
  | "CAMERA_TEAM"
  | "DIGITAL_MARKETING_MANAGER"
  | "SEO_EXECUTIVE"
  | "CONTENT_WRITER"
  | "INTERN"
  | "CLIENT";

export interface UserPermission {
  canApproveEOD: boolean;
  canManageFinance: boolean;
  canManageHR: boolean;
  canManageSales: boolean;
  canManageMarketing: boolean;
  canManageMedia: boolean;
  canManageProjects: boolean;
}

export function getRolePermissions(role: Role): UserPermission {
  switch (role) {
    case "SUPER_ADMIN":
    case "DIRECTOR":
    case "ADMIN_HR":
      return {
        canApproveEOD: true,
        canManageFinance: true,
        canManageHR: true,
        canManageSales: true,
        canManageMarketing: true,
        canManageMedia: true,
        canManageProjects: true,
      };

    case "HR":
      return {
        canApproveEOD: true,
        canManageFinance: false,
        canManageHR: true,
        canManageSales: false,
        canManageMarketing: false,
        canManageMedia: false,
        canManageProjects: false,
      };

    case "FINANCE":
      return {
        canApproveEOD: false,
        canManageFinance: true,
        canManageHR: false,
        canManageSales: false,
        canManageMarketing: false,
        canManageMedia: false,
        canManageProjects: false,
      };

    case "SALES_MANAGER":
    case "SALES_EXECUTIVE":
      return {
        canApproveEOD: role === "SALES_MANAGER",
        canManageFinance: false,
        canManageHR: false,
        canManageSales: true,
        canManageMarketing: false,
        canManageMedia: false,
        canManageProjects: false,
      };

    case "PROJECT_MANAGER":
    case "TEAM_LEADER":
      return {
        canApproveEOD: true,
        canManageFinance: false,
        canManageHR: false,
        canManageSales: false,
        canManageMarketing: false,
        canManageMedia: false,
        canManageProjects: true,
      };

    case "DIGITAL_MARKETING_MANAGER":
    case "SEO_EXECUTIVE":
    case "CONTENT_WRITER":
      return {
        canApproveEOD: role === "DIGITAL_MARKETING_MANAGER",
        canManageFinance: false,
        canManageHR: false,
        canManageSales: false,
        canManageMarketing: true,
        canManageMedia: false,
        canManageProjects: false,
      };

    case "VIDEO_EDITOR":
    case "CAMERA_TEAM":
      return {
        canApproveEOD: false,
        canManageFinance: false,
        canManageHR: false,
        canManageSales: false,
        canManageMarketing: false,
        canManageMedia: true,
        canManageProjects: false,
      };

    default:
      return {
        canApproveEOD: false,
        canManageFinance: false,
        canManageHR: false,
        canManageSales: false,
        canManageMarketing: false,
        canManageMedia: false,
        canManageProjects: false,
      };
  }
}
