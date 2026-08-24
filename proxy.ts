import { NextRequest, NextResponse } from "next/server";
import { verifyJwtEdge, DecodedJWTPayload } from "@/lib/jwtEdge";

// Public file extensions that bypass middleware
const PUBLIC_FILE_EXTENSIONS = [
  ".ico", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".css", ".js", ".map", ".txt", ".woff", ".woff2", ".ttf"
];

// Public exact paths
const PUBLIC_EXACT_PATHS = [
  "/login",
  "/auth/login",
  "/auth/register",
  "/auth/forget-password",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-otp",
  "/forget-password",
  "/forgot-password",
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-otp",
];

// Public path prefixes (e.g. static assets, public review/feedback tokens)
const PUBLIC_PREFIXES = [
  "/_next",
  "/api/feedback",
  "/api/review",
  "/feedback",
  "/review",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  for (const ext of PUBLIC_FILE_EXTENSIONS) {
    if (pathname.endsWith(ext)) return true;
  }
  return false;
}

function getDashboardForRole(role?: string | null): string {
  if (!role) return "/login";
  const r = role.toUpperCase();
  if (["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "ADMIN"].includes(r)) {
    return "/admin/dashboard";
  }
  if (r === "HR") {
    return "/hr";
  }
  if (r === "PROJECT_MANAGER") {
    return "/project-manager";
  }
  if (r === "TEAM_LEADER") {
    return "/team-leader";
  }
  return "/employee/dashboard";
}

function isRoleAuthorizedForPath(role: string, pathname: string): boolean {
  const r = role.toUpperCase();
  const isAdmin = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "ADMIN"].includes(r);

  // Admin routes: only Super Admin, Director, Admin HR, Admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return isAdmin;
  }

  // HR routes: HR + Admins
  if (pathname.startsWith("/hr") || pathname.startsWith("/api/hr")) {
    return isAdmin || r === "HR";
  }

  // Project Manager routes: PM + Admins
  if (pathname.startsWith("/project-manager") || pathname.startsWith("/api/project-manager")) {
    return isAdmin || r === "PROJECT_MANAGER";
  }

  // Team Leader routes: TL + PM + Admins
  if (pathname.startsWith("/team-leader") || pathname.startsWith("/api/team-leader")) {
    return isAdmin || r === "PROJECT_MANAGER" || r === "TEAM_LEADER";
  }

  // Employee routes: accessible to all authenticated staff
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip public static assets and public endpoints
  if (isPublicRoute(pathname)) {
    // If authenticated user visits /login or /auth/login, redirect to their home dashboard
    if (pathname === "/login" || pathname === "/auth/login") {
      const token = request.cookies.get("oms_session")?.value;
      if (token) {
        const decoded: DecodedJWTPayload | null = await verifyJwtEdge(token);
        if (decoded && decoded.id) {
          const dashboardUrl = new URL(getDashboardForRole(decoded.role), request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      }
    }
    return NextResponse.next();
  }

  // 2. Extract session token from Cookie or Authorization header
  const cookieToken = request.cookies.get("oms_session")?.value;
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (cookieToken) {
    token = cookieToken;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // 3. Cryptographic Signature Verification
  let decodedUser: DecodedJWTPayload | null = null;
  if (token) {
    decodedUser = await verifyJwtEdge(token);
  }

  // 4. Handle Unauthenticated Requests
  if (!decodedUser || !decodedUser.id) {
    // If it is an API route, return 401 Unauthorized JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Session missing or expired. Please sign in.",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // For any protected page (or root '/'), redirect to /login
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/" && !pathname.startsWith("/login")) {
      loginUrl.searchParams.set("redirect", pathname);
    }

    const response = NextResponse.redirect(loginUrl);
    // Clear any invalid/expired cookie
    if (cookieToken) {
      response.cookies.delete("oms_session");
    }
    return response;
  }

  // 5. Handle Authenticated User accessing root '/'
  if (pathname === "/") {
    const targetDashboard = getDashboardForRole(decodedUser.role);
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  // 6. Enforce Role-Based Access Control (RBAC)
  const userRole = decodedUser.role || "EMPLOYEE";
  if (!isRoleAuthorizedForPath(userRole, pathname)) {
    // If API route: return 403 Forbidden JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Role '${userRole}' is not authorized to access this resource.`,
        },
        { status: 403 }
      );
    }

    // If Page route: redirect user to their own authorized dashboard
    const userHome = getDashboardForRole(userRole);
    return NextResponse.redirect(new URL(userHome, request.url));
  }

  // 7. Prevent Caching of Protected Pages (Security for shared browsers & back-button navigation)
  const response = NextResponse.next();
  if (!pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
