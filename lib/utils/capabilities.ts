// lib/utils/capabilities.ts
// Single source of truth for building user capability set from DB

import { db, withRetry } from "@/prisma/db";

export type Capabilities = {
  isTeacher:     boolean;
  isDOS:         boolean;
  isHeadTeacher: boolean;
  isDeputy:      boolean;
  isAccountant:  boolean;
  isLibrarian:   boolean;
  isBursar:      boolean;
  primaryRole:   string;
  school:        { id: string; slug: string; name: string } | null;
};

const DOS_CODES        = ["DOS", "DIRECTOR_OF_STUDIES"];
const HEAD_CODES       = ["HEAD_TEACHER", "HEADTEACHER", "HEAD"];
const DEPUTY_CODES     = ["DEPUTY_HEAD", "DEPUTY"];
const ACCOUNTANT_CODES = ["ACCOUNTANT"];
const LIBRARIAN_CODES  = ["LIBRARIAN"];
const BURSAR_CODES     = ["BURSAR", "BURSARY_OFFICER", "FINANCE_OFFICER", "ACCOUNTANT"];

function matchCode(code: string, list: string[]) {
  return list.includes(code.toUpperCase());
}

export async function buildCapabilities(userId: string): Promise<Capabilities> {
  const empty: Capabilities = {
    isTeacher: false, isDOS: false, isHeadTeacher: false,
    isDeputy: false, isAccountant: false, isLibrarian: false, isBursar: false,
    primaryRole: "user", school: null,
  };

  const user = await withRetry(() => db.user.findUnique({
    where: { id: userId },
    include: {
      roles: { select: { roleName: true } },
      teacher: {
        select: {
          id: true,
          schoolId: true,
          staffId: true,
        },
      },
    },
  }));

  if (!user) return empty;

  const systemRoles   = user.roles.map(r => r.roleName.toLowerCase());
  const isSchoolAdmin = systemRoles.includes("schooladmin") || systemRoles.includes("school_admin");
  const isAdmin       = systemRoles.includes("admin") || systemRoles.includes("super_admin");

  if (isAdmin) return { ...empty, primaryRole: "admin" };

  if (isSchoolAdmin) {
    const school = await db.school.findFirst({
      where:  { adminId: userId },
      select: { id: true, slug: true, name: true },
    });
    return { ...empty, primaryRole: "schooladmin", school };
  }

  const teacher   = user.teacher;
  const isTeacher = !!teacher;

  // Collect ALL Staff records for this user across all their positions.
  // Always query by userId — do NOT filter by schoolId here because a staff-only
  // user (no Teacher record) has no schoolId anchor yet.
  const allStaffRecords = await db.staff.findMany({
    where:  { userId },
    select: { id: true, schoolId: true },
  });

  const staffIdSet = new Set<string>();
  if (teacher?.staffId) staffIdSet.add(teacher.staffId);
  allStaffRecords.forEach(s => staffIdSet.add(s.id));

  let staffRoles: { isPrimary: boolean; roleDefinition: { code: string; name: string } }[] = [];
  if (staffIdSet.size > 0) {
    staffRoles = await db.staffRole.findMany({
      where:   { staffId: { in: [...staffIdSet] }, isActive: true },
      include: { roleDefinition: { select: { code: true, name: true } } },
      orderBy: { isPrimary: "desc" },
    });
  }

  // Check StaffRole records first, then fall back to system User.roles
  const isDOS         = staffRoles.some(r => matchCode(r.roleDefinition.code, DOS_CODES))
    || systemRoles.some(r => DOS_CODES.includes(r.toUpperCase()) || r === "dos" || r === "director_of_studies");
  const isHeadTeacher = staffRoles.some(r => matchCode(r.roleDefinition.code, HEAD_CODES))
    || systemRoles.some(r => HEAD_CODES.includes(r.toUpperCase()) || r === "headteacher" || r === "head_teacher");
  const isDeputy      = staffRoles.some(r => matchCode(r.roleDefinition.code, DEPUTY_CODES))
    || systemRoles.some(r => DEPUTY_CODES.includes(r.toUpperCase()) || r === "deputy");
  const isAccountant  = staffRoles.some(r => matchCode(r.roleDefinition.code, ACCOUNTANT_CODES));
  const isLibrarian   = staffRoles.some(r => matchCode(r.roleDefinition.code, LIBRARIAN_CODES));
  const isBursar      = staffRoles.some(r => matchCode(r.roleDefinition.code, BURSAR_CODES));

  // Primary role: prefer isPrimary flag, else highest privilege
  const primaryStaffRole = staffRoles.find(r => r.isPrimary);
  let primaryRole = "teacher";

  if (primaryStaffRole) {
    primaryRole = primaryStaffRole.roleDefinition.code;
  } else if (isHeadTeacher) {
    primaryRole = "HEAD_TEACHER";
  } else if (isDOS) {
    primaryRole = "DOS";
  } else if (isDeputy) {
    primaryRole = "DEPUTY";
  }

  // Resolve school — prefer Teacher.schoolId, fall back to any Staff.schoolId
  let school: { id: string; slug: string; name: string } | null = null;
  const schoolId = teacher?.schoolId ?? allStaffRecords.find(s => s.schoolId)?.schoolId ?? null;
  if (schoolId) {
    school = await db.school.findUnique({
      where:  { id: schoolId },
      select: { id: true, slug: true, name: true },
    });
  }

  return { isTeacher, isDOS, isHeadTeacher, isDeputy, isAccountant, isLibrarian, isBursar, primaryRole, school };
}
