// app/api/auth/redirect/route.ts

import { getServerSession } from "next-auth/next";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/config/auth";
import { buildCapabilities } from "@/lib/utils/capabilities";
import { db }               from "@/prisma/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) return NextResponse.json({ redirectUrl: "/login" });

    const userId  = ((session as any).user).id as string;
    const loginAs = ((session as any).user).loginAs as string | undefined;

    // ── Parent check — always first, regardless of loginAs/roles ─────────
    // Parents login with email so loginAs may be stale ("admin") on old JWTs.
    // DB lookup is the authoritative check.
    const parentRecord = await db.parent.findUnique({
      where:  { userId },
      select: { school: { select: { slug: true } } },
    });
    if (parentRecord?.school?.slug) {
      return NextResponse.json({ redirectUrl: `/school/${parentRecord.school.slug}/parent/dashboard` });
    }

    // Always re-derive capabilities fresh from DB
    const caps = await buildCapabilities(userId);
    const slug = caps.school?.slug;

    // ── Admin / school admin ─────────────────────────────────────────────
    if (caps.primaryRole === "admin" || caps.primaryRole === "super_admin") {
      return NextResponse.json({ redirectUrl: "/dashboard" });
    }
    if (caps.primaryRole === "schooladmin") {
      if (slug) return NextResponse.json({ redirectUrl: `/school/${slug}` });
      const school = await db.school.findFirst({ where: { adminId: userId }, select: { slug: true } });
      return NextResponse.json({ redirectUrl: school ? `/school/${school.slug}` : "/dashboard" });
    }

    // ── Student login → student portal (must come before slug resolution) ─
    if (loginAs === "student") {
      let studentSlug: string | null | undefined = slug;
      if (!studentSlug) {
        const studentRecord = await db.student.findFirst({
          where:  { userId },
          select: { school: { select: { slug: true } } },
        });
        studentSlug = studentRecord?.school?.slug;
      }
      if (studentSlug) return NextResponse.json({ redirectUrl: `/school/${studentSlug}/student/dashboard` });
      return NextResponse.json({ redirectUrl: "/login" });
    }

    // ── Parent login → parent portal ─────────────────────────────────────
    if (loginAs === "parent") {
      let parentSlug: string | null | undefined = slug;
      if (!parentSlug) {
        const parentRecord = await db.parent.findFirst({
          where:  { userId },
          select: { school: { select: { slug: true } } },
        });
        parentSlug = parentRecord?.school?.slug;
      }
      if (parentSlug) return NextResponse.json({ redirectUrl: `/school/${parentSlug}/parent/dashboard` });
      return NextResponse.json({ redirectUrl: "/login" });
    }

    // ── Resolve school slug for teacher/staff logins ─────────────────────
    let resolvedSlug = slug;
    if (!resolvedSlug) {
      const teacher = await db.teacher.findUnique({ where: { userId }, select: { schoolId: true } });
      if (!teacher?.schoolId) {
        // Try staff record
        const staff = await db.staff.findFirst({ where: { userId }, select: { schoolId: true } });
        if (!staff?.schoolId) return NextResponse.json({ redirectUrl: "/dashboard" });
        const school = await db.school.findUnique({ where: { id: staff.schoolId }, select: { slug: true } });
        resolvedSlug = school?.slug;
      } else {
        const school = await db.school.findUnique({ where: { id: teacher.schoolId }, select: { slug: true } });
        resolvedSlug = school?.slug;
      }
      if (!resolvedSlug) return NextResponse.json({ redirectUrl: "/dashboard" });
    }

    // ── Route directly by loginAs — set from ID prefix at sign-in ────────
    if (loginAs === "teacher") {
      // TCH… login → always teacher portal
      return NextResponse.json({ redirectUrl: `/school/${resolvedSlug}/teacher/dashboard` });
    }

    if (loginAs === "staff") {
      // STF… login → bursar portal if accountant/bursar, else DOS portal
      if (caps.isBursar && !caps.isDOS && !caps.isHeadTeacher && !caps.isDeputy) {
        return NextResponse.json({ redirectUrl: `/school/${resolvedSlug}/bursar/dashboard` });
      }
      // Has both bursar + academic role → portal select
      if (caps.isBursar && (caps.isDOS || caps.isHeadTeacher || caps.isDeputy)) {
        return NextResponse.json({ redirectUrl: `/school/${resolvedSlug}/portal-select` });
      }
      return NextResponse.json({ redirectUrl: `/school/${resolvedSlug}/dos/dashboard` });
    }

    // ── Fallback for email (admin) logins ────────────────────────────────
    return NextResponse.json({ redirectUrl: resolveStaffUrl(caps, resolvedSlug) });

  } catch (err) {
    console.error("[redirect]", err);
    return NextResponse.json({ redirectUrl: "/login" });
  }
}

function resolveStaffUrl(caps: any, slug: string): string {
  const { isDOS, isHeadTeacher, isDeputy, isTeacher, isBursar } = caps;

  if (isDOS || isHeadTeacher || isDeputy) {
    return `/school/${slug}/dos/dashboard`;
  }
  if (isBursar) {
    return `/school/${slug}/bursar/dashboard`;
  }
  if (isTeacher) {
    return `/school/${slug}/teacher/dashboard`;
  }
  return "/dashboard";
}
