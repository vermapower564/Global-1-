import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "ADMIN_HR"];

const PUBLIC_PATHS = [
  "/login",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/forget-password",
  "/auth/reset-password",
  "/auth/verify-otp",
  "/forgot-password",
  "/forget-password",
  "/reset-password",
  "/verify-otp",
  "/feedback",
  "/review",
];

function decodeSessionToken(token: string): { id: string; email: string; role: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js internal files, images, favicon, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 2. ROOT PATH (/) ALWAYS REDIRECTS TO /login FOR FRESH VISITORS
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // 3. Allow public auth routes without session checks
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 4. Extract Session Token from HTTP-Only Cookie or Authorization Header
  const cookieToken = request.cookies.get("oms_session")?.value;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;

  // 5. Verify Session Token
  const session = token ? decodeSessionToken(token) : null;
  const isAuthenticated = !!(session && session.id);
  const userRole = (session?.role || "").toUpperCase();
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // 6. Enforce Authentication on Protected Page Routes
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Enforce Role-Based Access Control on Admin Routes
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/audit-logs") ||
    pathname.startsWith("/payroll");

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/employee", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
