import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── In-memory rate limiter (per IP) ────────────────────────────────────────
// Works for single-instance deployments. For multi-instance use Redis.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const API_WINDOW_MS   = 60_000; // 1 minute window
const LOGIN_MAX       = 10;     // max login attempts per window
const API_MAX         = 120;    // max general API calls per window

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string, max: number): boolean {
  const now   = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + API_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

// Clean up old entries every 5 minutes to avoid memory leaks
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, val] of loginAttempts.entries()) {
    if (now > val.resetAt) loginAttempts.delete(key);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  maybeCleanup();

  const ip = getClientIp(req);

  // Rate-limit the credentials login endpoint strictly
  if (pathname === "/api/auth/callback/credentials") {
    if (isRateLimited(`login:${ip}`, LOGIN_MAX)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many login attempts. Please wait a minute." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }
  }

  // Rate-limit all other API routes more loosely
  if (pathname.startsWith("/api/") && pathname !== "/api/auth/callback/credentials") {
    if (isRateLimited(`api:${ip}`, API_MAX)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }
  }

  // Only guard school routes
  if (!pathname.startsWith("/school/")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.next(); // let auth pages handle unauthenticated

  const roles: any[] = (token.roles as any[]) ?? [];
  const roleNames = roles.map((r) => r.roleName?.toLowerCase());

  const isTeacherOnly =
    roles.length > 0 && roleNames.every((r) => r === "teacher");

  const isDOSOnly =
    roles.length > 0 && roleNames.every((r) => r === "dos");

  // Extract slug — pathname is /school/[slug]/...
  const parts = pathname.split("/"); // ["", "school", slug, ...rest]
  const slug  = parts[2];
  const rest  = parts.slice(3).join("/"); // everything after /school/[slug]/

  // Pure teacher: only allowed under /school/[slug]/teacher/...
  if (isTeacherOnly) {
    if (rest.startsWith("teacher/") || rest === "teacher") return NextResponse.next();
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = `/school/${slug}/teacher/dashboard`;
    return NextResponse.redirect(dashboardUrl);
  }

  // Pure DOS: only allowed under /school/[slug]/dos/...
  if (isDOSOnly) {
    if (rest.startsWith("dos/") || rest === "dos") return NextResponse.next();
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = `/school/${slug}/dos/dashboard`;
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/school/:slug*", "/api/:path*"],
};
