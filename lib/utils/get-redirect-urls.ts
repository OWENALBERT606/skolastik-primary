// lib/utils/get-redirect-url.ts

import { db } from "@/prisma/db";

type School = {
  id: string;
  slug: string;
  name: string;
} | null | undefined;

export async function getRedirectUrl(
  userId: string,
  roleNames: string[],
  school: School
): Promise<string> {
  // Super Admin / System Admin
  if (roleNames.includes("super_admin") || roleNames.includes("admin")) {
    return "/dashboard";
  }

  // School Admin
  if (roleNames.includes("school_admin") || roleNames.includes("schooladmin")) {
    if (school?.slug) {
      return `/school/${school.slug}`;
    }
    const userSchool = await db.school.findFirst({
      where: { adminId: userId },
      select: { slug: true },
    });
    return userSchool ? `/school/${userSchool.slug}` : "/dashboard";
  }

  // Director of Studies
  if (roleNames.includes("director_of_studies") || roleNames.includes("dos")) {
    if (school?.slug) {
      return `/school/${school.slug}/portal-select`;
    }
    const teacher = await db.teacher.findUnique({
      where:  { userId },
      select: { schoolId: true },
    });
    if (!teacher?.schoolId) return "/dashboard";
    const dosSchool = await db.school.findUnique({
      where:  { id: teacher.schoolId },
      select: { slug: true },
    });
    return dosSchool ? `/school/${dosSchool.slug}/portal-select` : "/dashboard";
  }

  // Teacher — also check if they have a DOS StaffRole (assigned via staff management)
  if (roleNames.includes("teacher")) {
    // Resolve school slug first
    let slug = school?.slug;
    let teacherId: string | null = null;

    if (!slug) {
      const teacher = await db.teacher.findUnique({
        where:  { userId },
        select: { id: true, schoolId: true },
      });
      if (!teacher?.schoolId) return "/dashboard";
      teacherId = teacher.id;
      const teacherSchool = await db.school.findUnique({
        where:  { id: teacher.schoolId },
        select: { slug: true },
      });
      slug = teacherSchool?.slug ?? undefined;
    }

    if (!slug) return "/dashboard";

    // Check if this teacher also has an active DOS StaffRole
    // Try via Teacher.staffId first, then fall back to Staff.userId
    const teacherRecord = await db.teacher.findUnique({
      where:  { userId },
      select: { id: true, staffId: true },
    });

    let hasDOS = false;

    if (teacherRecord?.staffId) {
      const dosRole = await db.staffRole.findFirst({
        where: {
          staffId:        teacherRecord.staffId,
          isActive:       true,
          roleDefinition: { code: { in: ["DOS", "dos", "director_of_studies", "DIRECTOR_OF_STUDIES"] } },
        },
      });
      hasDOS = !!dosRole;
    }

    // Fallback: look up Staff by userId directly
    if (!hasDOS) {
      const staff = await db.staff.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (staff) {
        const allRoles = await db.staffRole.findMany({
          where: { staffId: staff.id },
          include: { roleDefinition: { select: { code: true } } },
        });
        const dosRole = allRoles.find(r =>
          r.isActive &&
          ["DOS", "dos", "director_of_studies", "DIRECTOR_OF_STUDIES"].includes(r.roleDefinition.code)
        );
        hasDOS = !!dosRole;
      }
    }

    if (hasDOS) {
      return `/school/${slug}/portal-select`;
    }

    return `/school/${slug}/teacher/dashboard`;  }

  // Parent
  if (roleNames.includes("parent")) {
    if (school?.slug) {
      return `/school/${school.slug}/parent`;
    }
    const parent = await db.parent.findUnique({
      where: { userId },
      include: { school: { select: { slug: true } } },
    });
    return parent ? `/school/${parent.school.slug}/parent` : "/dashboard";
  }

  // Student
  if (roleNames.includes("student")) {
    if (school?.slug) {
      return `/school/${school.slug}/student`;
    }
    const student = await db.student.findUnique({
      where: { userId },
      include: { school: { select: { slug: true } } },
    });
    return student ? `/school/${student.school.slug}/student` : "/dashboard";
  }

  // Default user role
  if (roleNames.includes("user")) {
    return "/";
  }

  return "/dashboard";
}

// Helper to extract role names from roles array
export function getRoleNames(roles: any[]): string[] {
  return roles?.map((role: any) =>
    typeof role === "string" ? role : role.roleName
  ) || [];
}