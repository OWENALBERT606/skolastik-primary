"use server";

import { db } from "@/prisma/db";
import { StaffRoleType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/config/useAuth";

type ActionResponse<T = any> = {
  ok: boolean;
  message: string;
  data?: T;
};

// ════════════════════════════════════════════════════════════════════════════
// SEED DEFAULT ROLE DEFINITIONS FOR A SCHOOL
// Call this once when a school is set up, or from an admin panel
// ════════════════════════════════════════════════════════════════════════════

export async function seedDefaultRoleDefinitions(schoolId: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const defaults: {
    roleType: StaffRoleType;
    name: string;
    code: string;
    description: string;
    dashboardPath?: string;
  }[] = [
    // ── Teaching roles ──────────────────────────────────────────────────
    {
      roleType:      StaffRoleType.TEACHER,
      name:          "Teacher",
      code:          "TEACHER",
      description:   "Classroom teacher — teaches subjects, enters marks",
      dashboardPath: "/dashboard/teacher",
    },
    {
      roleType:      StaffRoleType.DOS,
      name:          "Director of Studies",
      code:          "DOS",
      description:   "Oversees academic programmes and timetabling",
      dashboardPath: "/dashboard/dos",
    },
    {
      roleType:      StaffRoleType.DEPUTY_HEAD,
      name:          "Deputy Headteacher",
      code:          "DEPUTY_HEAD",
      description:   "Assists the headteacher in school administration",
      dashboardPath: "/dashboard/admin",
    },
    {
      roleType:      StaffRoleType.HEAD_TEACHER,
      name:          "Headteacher",
      code:          "HEAD_TEACHER",
      description:   "Overall head of the school",
      dashboardPath: "/dashboard/admin",
    },
    // ── Administrative roles ─────────────────────────────────────────────
    {
      roleType:      StaffRoleType.SECRETARY,
      name:          "Secretary",
      code:          "SECRETARY",
      description:   "School secretary and front office",
      dashboardPath: "/dashboard/admin",
    },
    {
      roleType:      StaffRoleType.ACCOUNTANT,
      name:          "Accountant",
      code:          "ACCOUNTANT",
      description:   "Manages school finances and fees",
      dashboardPath: "/dashboard/accounts",
    },
    {
      roleType:      StaffRoleType.LIBRARIAN,
      name:          "Librarian",
      code:          "LIBRARIAN",
      description:   "Manages the school library",
      dashboardPath: "/dashboard/library",
    },
    {
      roleType:      StaffRoleType.STORE_KEEPER,
      name:          "Store Keeper",
      code:          "STORE_KEEPER",
      description:   "Manages school stores and inventory",
      dashboardPath: "/dashboard/stores",
    },
    {
      roleType:      StaffRoleType.NURSE,
      name:          "Nurse",
      code:          "NURSE",
      description:   "School health and medical officer",
      dashboardPath: "/dashboard/admin",
    },
    {
      roleType:      StaffRoleType.COUNSELOR,
      name:          "Counselor",
      code:          "COUNSELOR",
      description:   "Student guidance and counseling",
      dashboardPath: "/dashboard/admin",
    },
    {
      roleType:      StaffRoleType.IT_OFFICER,
      name:          "IT Officer",
      code:          "IT_OFFICER",
      description:   "Manages school ICT infrastructure",
      dashboardPath: "/dashboard/admin",
    },
    {
      roleType:      StaffRoleType.ADMIN,
      name:          "Administrator",
      code:          "ADMIN",
      description:   "General school administrator",
      dashboardPath: "/dashboard/admin",
    },
    // ── Support roles ─────────────────────────────────────────────────────
    {
      roleType:      StaffRoleType.SECURITY,
      name:          "Security",
      code:          "SECURITY",
      description:   "School security personnel",
    },
    {
      roleType:      StaffRoleType.COOK,
      name:          "Cook",
      code:          "COOK",
      description:   "School kitchen and catering",
    },
    {
      roleType:      StaffRoleType.CLEANER,
      name:          "Cleaner",
      code:          "CLEANER",
      description:   "School cleaning and sanitation",
    },
    {
      roleType:      StaffRoleType.DRIVER,
      name:          "Driver",
      code:          "DRIVER",
      description:   "School transport driver",
    },
  ];

  try {
    // Upsert each — safe to call multiple times
    const results = await Promise.all(
      defaults.map((r) =>
        db.staffRoleDefinition.upsert({
          where: { schoolId_code: { schoolId, code: r.code } },
          create: { schoolId, ...r, isActive: true },
          update: { name: r.name, description: r.description, dashboardPath: r.dashboardPath },
        })
      )
    );

    return {
      ok: true,
      data: results,
      message: `${results.length} role definitions seeded successfully`,
    };
  } catch (error: any) {
    console.error("❌ seedDefaultRoleDefinitions:", error);
    return { ok: false, message: error?.message ?? "Failed to seed role definitions" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET ALL ROLE DEFINITIONS FOR A SCHOOL
// Use this to populate the role picker dropdown
// ════════════════════════════════════════════════════════════════════════════

export async function getRoleDefinitions(schoolId: string, staffType?: "TEACHING" | "NON_TEACHING") {
  try {
    // Filter by staff type if requested
    const teachingRoles: StaffRoleType[] = [
      StaffRoleType.TEACHER,
      StaffRoleType.DOS,
      StaffRoleType.DEPUTY_HEAD,
      StaffRoleType.HEAD_TEACHER,
    ];

    const nonTeachingRoles: StaffRoleType[] = [
      StaffRoleType.SECRETARY,
      StaffRoleType.ACCOUNTANT,
      StaffRoleType.LIBRARIAN,
      StaffRoleType.STORE_KEEPER,
      StaffRoleType.NURSE,
      StaffRoleType.COUNSELOR,
      StaffRoleType.IT_OFFICER,
      StaffRoleType.ADMIN,
      StaffRoleType.SECURITY,
      StaffRoleType.COOK,
      StaffRoleType.CLEANER,
      StaffRoleType.DRIVER,
      StaffRoleType.CUSTOM,
    ];

    const roles = await db.staffRoleDefinition.findMany({
      where: {
        schoolId,
        isActive: true,
        ...(staffType === "TEACHING"     && { roleType: { in: teachingRoles } }),
        ...(staffType === "NON_TEACHING" && { roleType: { in: nonTeachingRoles } }),
      },
      orderBy: { name: "asc" },
    });

    return { ok: true, data: roles };
  } catch (error: any) {
    console.error("❌ getRoleDefinitions:", error);
    return { ok: false, data: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ASSIGN A ROLE TO A STAFF MEMBER
// Can be called at creation or any time after
// ════════════════════════════════════════════════════════════════════════════

// Maps a StaffRoleDefinition code to the system User.roleName used by buildCapabilities
const DOS_CODES    = ["DOS", "DIRECTOR_OF_STUDIES"];
const HEAD_CODES   = ["HEAD_TEACHER", "HEADTEACHER", "HEAD"];
const DEPUTY_CODES = ["DEPUTY_HEAD", "DEPUTY"];

async function syncSystemRole(userId: string, roleCode: string) {
  const code = roleCode.toUpperCase();
  let systemRoleName: string | null = null;
  let systemDisplayName: string | null = null;

  if (DOS_CODES.includes(code))         { systemRoleName = "dos";         systemDisplayName = "Director of Studies"; }
  else if (HEAD_CODES.includes(code))   { systemRoleName = "head_teacher"; systemDisplayName = "Head Teacher"; }
  else if (DEPUTY_CODES.includes(code)) { systemRoleName = "deputy";       systemDisplayName = "Deputy Head"; }

  if (!systemRoleName) return;

  const sysRole = await db.role.upsert({
    where:  { roleName: systemRoleName },
    create: { roleName: systemRoleName, displayName: systemDisplayName!, permissions: [] },
    update: {},
  });
  await db.user.update({
    where: { id: userId },
    data:  { roles: { connect: [{ id: sysRole.id }] } },
  });
}

export async function assignRoleToStaff(input: {
  staffId: string;           // Staff.id (not staffId string)
  schoolId: string;
  roleDefinitionId: string;  // StaffRoleDefinition.id
  isPrimary?: boolean;       // Makes this the primary role
  notes?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const { staffId, schoolId, roleDefinitionId, isPrimary = false, notes } = input;

  try {
    // Verify staff and role definition exist in same school
    const [staff, roleDef] = await Promise.all([
      db.staff.findUnique({ where: { id: staffId }, select: { id: true, firstName: true, lastName: true, schoolId: true, userId: true } }),
      db.staffRoleDefinition.findUnique({ where: { id: roleDefinitionId }, select: { id: true, name: true, code: true, schoolId: true } }),
    ]);

    if (!staff)   return { ok: false, message: "Staff member not found" };
    if (!roleDef) return { ok: false, message: "Role definition not found" };
    if (staff.schoolId !== schoolId || roleDef.schoolId !== schoolId) {
      return { ok: false, message: "Staff and role must belong to the same school" };
    }

    // Check if already assigned
    const existing = await db.staffRole.findUnique({
      where: { staffId_staffRoleDefinitionId: { staffId, staffRoleDefinitionId: roleDefinitionId } },
    });
    if (existing) {
      if (existing.isActive) return { ok: false, message: `${staff.firstName} already has the ${roleDef.name} role` };
      // Re-activate if previously deactivated
      const reactivated = await db.staffRole.update({
        where: { id: existing.id },
        data: { isActive: true, assignedDate: new Date(), endDate: null, notes },
      });
      // Sync system User.role so buildCapabilities detects this role
      await syncSystemRole(staff.userId, roleDef.code);
      revalidatePath(`/staff/${staffId}`);
      return { ok: true, data: reactivated, message: `${roleDef.name} role re-assigned to ${staff.firstName} ${staff.lastName}` };
    }

    // If marking as primary, demote current primary first
    if (isPrimary) {
      await db.staffRole.updateMany({
        where: { staffId, schoolId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const role = await db.staffRole.create({
      data: {
        staffId,
        staffRoleDefinitionId: roleDefinitionId,
        schoolId,
        isPrimary,
        isActive: true,
        assignedDate: new Date(),
        notes,
      },
      include: {
        roleDefinition: { select: { name: true, roleType: true, dashboardPath: true } },
      },
    });

    // Sync system User.role so buildCapabilities detects DOS/HEAD/DEPUTY
    await syncSystemRole(staff.userId, roleDef.code);

    revalidatePath(`/staff/${staffId}`);
    return {
      ok: true,
      data: role,
      message: `${roleDef.name} role assigned to ${staff.firstName} ${staff.lastName}`,
    };
  } catch (error: any) {
    console.error("❌ assignRoleToStaff:", error);
    return { ok: false, message: error?.message ?? "Failed to assign role" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REMOVE / DEACTIVATE A ROLE FROM A STAFF MEMBER
// ════════════════════════════════════════════════════════════════════════════

export async function removeRoleFromStaff(
  staffRoleId: string,  // StaffRole.id
  reason?: string
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  try {
    const existing = await db.staffRole.findUnique({
      where: { id: staffRoleId },
      include: {
        staff: { select: { firstName: true, lastName: true } },
        roleDefinition: { select: { name: true } },
      },
    });

    if (!existing) return { ok: false, message: "Role assignment not found" };

    await db.staffRole.update({
      where: { id: staffRoleId },
      data: { isActive: false, endDate: new Date(), notes: reason },
    });

    revalidatePath(`/staff/${existing.staffId}`);
    return {
      ok: true,
      message: `${existing.roleDefinition.name} role removed from ${existing.staff.firstName} ${existing.staff.lastName}`,
    };
  } catch (error: any) {
    console.error("❌ removeRoleFromStaff:", error);
    return { ok: false, message: error?.message ?? "Failed to remove role" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SET PRIMARY ROLE
// Marks one role as primary, demotes all others
// ════════════════════════════════════════════════════════════════════════════

export async function setPrimaryRole(staffRoleId: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  try {
    const existing = await db.staffRole.findUnique({
      where: { id: staffRoleId },
      include: {
        staff: { select: { firstName: true, lastName: true } },
        roleDefinition: { select: { name: true } },
      },
    });

    if (!existing) return { ok: false, message: "Role assignment not found" };

    await db.$transaction([
      // Demote all current primaries
      db.staffRole.updateMany({
        where: { staffId: existing.staffId, isPrimary: true },
        data: { isPrimary: false },
      }),
      // Promote this one
      db.staffRole.update({
        where: { id: staffRoleId },
        data: { isPrimary: true, isActive: true },
      }),
    ]);

    revalidatePath(`/staff/${existing.staffId}`);
    return {
      ok: true,
      message: `${existing.roleDefinition.name} set as primary role for ${existing.staff.firstName} ${existing.staff.lastName}`,
    };
  } catch (error: any) {
    console.error("❌ setPrimaryRole:", error);
    return { ok: false, message: error?.message ?? "Failed to set primary role" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STAFF WITH THEIR ROLES
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffRoles(staffId: string) {
  try {
    const roles = await db.staffRole.findMany({
      where: { staffId, isActive: true },
      include: {
        roleDefinition: {
          select: { id: true, name: true, roleType: true, code: true, description: true, dashboardPath: true },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { assignedDate: "asc" }],
    });

    return { ok: true, data: roles };
  } catch (error: any) {
    console.error("❌ getStaffRoles:", error);
    return { ok: false, data: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET ALL STAFF WITH A SPECIFIC ROLE (e.g. find all DOS in the school)
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffByRole(schoolId: string, roleType: StaffRoleType) {
  try {
    const roles = await db.staffRole.findMany({
      where: {
        schoolId,
        isActive: true,
        roleDefinition: { roleType },
      },
      include: {
        staff: {
          select: {
            id: true, staffId: true, firstName: true, lastName: true,
            phone: true, email: true, imageUrl: true, status: true, staffType: true,
          },
        },
        roleDefinition: { select: { name: true, roleType: true } },
      },
    });

    return { ok: true, data: roles };
  } catch (error: any) {
    console.error("❌ getStaffByRole:", error);
    return { ok: false, data: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET TEACHER RECORD LINKED TO A STAFF MEMBER
// Returns the Teacher record (with subject assignments) for TEACHING staff
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffTeacherRecord(staffId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where: { staffId },
      select: {
        id: true,
        staffNo: true,
        firstName: true,
        lastName: true,
        currentStatus: true,
        streamSubjectAssignments: {
          where: { status: "ACTIVE" },
          include: {
            streamSubject: {
              include: {
                subject:      { select: { id: true, name: true, code: true } },
                subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
                stream:       { select: { id: true, name: true } },
                term:         { select: { id: true, name: true, termNumber: true } },
                _count:       { select: { studentEnrollments: true } },
              },
            },
          },
          orderBy: [
            { streamSubject: { stream:  { name: "asc" } } },
            { streamSubject: { subject: { name: "asc" } } },
          ],
        },
      },
    });

    return { ok: true, data: teacher };
  } catch (error: any) {
    console.error("❌ getStaffTeacherRecord:", error);
    return { ok: false, data: null, message: error?.message ?? "Failed to fetch teacher record" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE STREAM SUBJECTS FOR ASSIGNMENT (school-wide)
// Used in the "Assign Subject" picker on the staff detail page
// ════════════════════════════════════════════════════════════════════════════

export async function getSchoolStreamSubjectsForAssignment(schoolId: string) {
  try {
    const subjects = await db.streamSubject.findMany({
      where: { stream: { school: { id: schoolId } } },
      include: {
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
        stream:       { select: { id: true, name: true } },
        term:         { select: { id: true, name: true, termNumber: true } },
        teacherAssignments: { where: { status: "ACTIVE" }, select: { teacherId: true } },
      },
      orderBy: [
        { stream:   { name: "asc" } },
        { subject:  { name: "asc" } },
      ],
    });

    return { ok: true, data: subjects };
  } catch (error: any) {
    console.error("❌ getSchoolStreamSubjectsForAssignment:", error);
    return { ok: false, data: [], message: error?.message ?? "Failed to fetch stream subjects" };
  }
}
