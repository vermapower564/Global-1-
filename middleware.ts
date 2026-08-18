import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

const PUBLIC_PATHS = [
  "/login",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-otp",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-otp",
  "/api/auth/logout",
  "/api/health",
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

  // 1. Skip static assets, Next.js internal files, images, favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 2. ROOT PATH (/) MUST ALWAYS REDIRECT TO /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Allow public auth routes without session checks
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 3. Extract Session Token from HTTP-Only Cookie or Authorization Header
  const cookieToken = request.cookies.get("oms_session")?.value;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;

  // 4. Verify Session Token
  const session = token ? decodeSessionToken(token) : null;
  const isAuthenticated = !!(session && session.id);
  const userRole = (session?.role || "").toUpperCase();
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // 5. Enforce Authentication on All Protected Routes
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated: Session token missing or expired." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Enforce Role-Based Access Control on Admin Routes
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/audit-logs") ||
    pathname.startsWith("/payroll");

  if (isAdminRoute && !isAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin role required." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/employee", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
