// // actions/school.ts

// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { seedStaffRoleDefinitions } from "@/prisma/seeds/staff-role-definitions";

// export interface SchoolCreateProps {
//   name: string;
//   slug: string;
//   code: string;
//   adminId: string;
//   motto?: string | null;
//   address?: string | null;
//   contact?: string | null;
//   contact2?: string | null;
//   contact3?: string | null;
//   email?: string | null;
//   email2?: string | null;
//   website?: string | null;
//   logo?: string | null;
//   isActive?: boolean;
// }

// export interface SchoolUpdateProps {
//   name?: string;
//   slug?: string;
//   code?: string;
//   motto?: string | null;
//   address?: string | null;
//   contact?: string | null;
//   contact2?: string | null;
//   contact3?: string | null;
//   email?: string | null;
//   email2?: string | null;
//   website?: string | null;
//   logo?: string | null;
//   isActive?: boolean;
// }

// // Shared return type used by all functions in this file
// type ActionResponse<T = any> = {
//   ok: boolean;
//   data?: T | null;
//   message?: string;
//   requiresConfirmation?: boolean;
// };

// // ─── Create ───────────────────────────────────────────────────────────────────

// export async function createSchool(
//   data: SchoolCreateProps
// ): Promise<ActionResponse> {
//   try {
//     const [existingSlug, existingCode] = await Promise.all([
//       db.school.findUnique({ where: { slug: data.slug } }),
//       db.school.findUnique({ where: { code: data.code } }),
//     ]);

//     if (existingSlug) {
//       return { ok: false, message: "A school with this slug already exists" };
//     }

//     if (existingCode) {
//       return { ok: false, message: `School code "${data.code}" is already in use` };
//     }

//     const admin = await db.user.findUnique({
//       where: { id: data.adminId },
//     });

//     if (!admin) {
//       return { ok: false, message: "Admin user not found" };
//     }

//     const newSchool = await db.school.create({
//       data: {
//         name:     data.name,
//         slug:     data.slug,
//         code:     data.code,
//         adminId:  data.adminId,
//         motto:    data.motto    ?? null,
//         address:  data.address  ?? null,
//         contact:  data.contact  ?? null,
//         contact2: data.contact2 ?? null,
//         contact3: data.contact3 ?? null,
//         email:    data.email    ?? null,
//         email2:   data.email2   ?? null,
//         website:  data.website  ?? null,
//         logo:     data.logo     ?? null,
//         isActive: data.isActive ?? true,
//       },
//     });

//     // Auto-seed staff role definitions — non-fatal if it fails
//     try {
//       const seedResult = await seedStaffRoleDefinitions(newSchool.id);
//       console.log(
//         `✅ Role definitions seeded for "${newSchool.name}": ` +
//         `${seedResult.created} created, ${seedResult.updated} updated`
//       );
//     } catch (seedError) {
//       console.error(
//         `⚠️  School created but role seed failed for ${newSchool.id}:`,
//         seedError
//       );
//     }

//     revalidatePath("/dashboard/schools");

//     return {
//       ok: true,
//       data: newSchool,
//       message: `School "${newSchool.name}" created successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ createSchool:", error);
//     if (error.code === "P2002") {
//       return { ok: false, message: "A school with this slug or code already exists" };
//     }
//     return { ok: false, message: error?.message ?? "Failed to create school" };
//   }
// }

// // ─── Read ─────────────────────────────────────────────────────────────────────

// export async function getAllSchools(): Promise<ActionResponse> {
//   try {
//     const schools = await db.school.findMany({
//       orderBy: { createdAt: "desc" },
//       include: {
//         admin: {
//           select: { id: true, name: true, email: true, image: true },
//         },
//         _count: {
//           select: {
//             academicYears:  true,
//             classTemplates: true,
//             teachers:       true,
//             parents:        true,
//             students:       true,
//             streams:        true,
//             subjects:       true,
//             staff:          true,
//           },
//         },
//       },
//     });

//     return { ok: true, data: schools };
//   } catch (error) {
//     console.error("Error fetching schools:", error);
//     return { ok: false, data: [], message: "Failed to fetch schools" };
//   }
// }

// export async function getSchoolById(id: string): Promise<ActionResponse> {
//   try {
//     const school = await db.school.findUnique({
//       where: { id },
//       include: {
//         admin: {
//           select: { id: true, name: true, email: true, image: true },
//         },
//         academicYears: {
//           orderBy: { year: "desc" },
//           include: {
//             terms: { orderBy: { termNumber: "asc" } },
//           },
//         },
//         _count: {
//           select: {
//             classTemplates: true,
//             teachers:       true,
//             parents:        true,
//             students:       true,
//             streams:        true,
//             subjects:       true,
//             staff:          true,
//           },
//         },
//       },
//     });

//     if (!school) return { ok: false, data: null, message: "School not found" };

//     return { ok: true, data: school };
//   } catch (error) {
//     console.error("Error fetching school:", error);
//     return { ok: false, data: null, message: "Failed to fetch school" };
//   }
// }

// export async function getSchoolBySlug(slug: string): Promise<ActionResponse> {
//   try {
//     const school = await db.school.findUnique({
//       where: { slug },
//       include: {
//         admin: {
//           select: { id: true, name: true, email: true, image: true },
//         },
//         academicYears: {
//           where: { isActive: true },
//           include: {
//             terms: { where: { isActive: true } },
//           },
//         },
//         _count: {
//           select: {
//             classTemplates: true,
//             teachers:       true,
//             parents:        true,
//             students:       true,
//             streams:        true,
//             subjects:       true,
//             staff:          true,
//           },
//         },
//       },
//     });

//     if (!school) return { ok: false, data: null, message: "School not found" };

//     return { ok: true, data: school };
//   } catch (error) {
//     console.error("Error fetching school by slug:", error);
//     return { ok: false, data: null, message: "Failed to fetch school" };
//   }
// }

// /**
//  * Step 1 of the login flow — verify school code before showing loginId + password fields.
//  */
// export async function getSchoolByCode(code: string): Promise<ActionResponse> {
//   try {
//     const school = await db.school.findUnique({
//       where: { code },
//       select: {
//         id:       true,
//         name:     true,
//         code:     true,
//         slug:     true,
//         logo:     true,
//         isActive: true,
//       },
//     });

//     if (!school) return { ok: false, data: null, message: "Invalid school code" };
//     if (!school.isActive) return { ok: false, data: null, message: "This school account is inactive" };

//     return { ok: true, data: school };
//   } catch (error) {
//     console.error("Error fetching school by code:", error);
//     return { ok: false, data: null, message: "Failed to verify school code" };
//   }
// }

// export async function getSchoolsByAdminId(adminId: string): Promise<ActionResponse> {
//   try {
//     const schools = await db.school.findMany({
//       where: { adminId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         _count: {
//           select: {
//             academicYears:  true,
//             classTemplates: true,
//             teachers:       true,
//             parents:        true,
//             students:       true,
//             staff:          true,
//           },
//         },
//       },
//     });

//     return { ok: true, data: schools };
//   } catch (error) {
//     console.error("Error fetching schools by adminId:", error);
//     return { ok: false, data: [], message: "Failed to fetch schools" };
//   }
// }

// // ─── Update ───────────────────────────────────────────────────────────────────

// export async function updateSchoolById(
//   id: string,
//   data: SchoolUpdateProps
// ): Promise<ActionResponse> {
//   try {
//     if (data.slug) {
//       const existing = await db.school.findFirst({
//         where: { slug: data.slug, NOT: { id } },
//       });
//       if (existing) {
//         return { ok: false, message: "A school with this slug already exists" };
//       }
//     }

//     if (data.code) {
//       const existing = await db.school.findFirst({
//         where: { code: data.code, NOT: { id } },
//       });
//       if (existing) {
//         return { ok: false, message: `School code "${data.code}" is already in use` };
//       }
//     }

//     const updatedSchool = await db.school.update({
//       where: { id },
//       data,
//     });

//     revalidatePath("/dashboard/schools");
//     revalidatePath(`/school/${updatedSchool.slug}`);

//     return { ok: true, data: updatedSchool, message: "School updated successfully" };
//   } catch (error) {
//     console.error("Error updating school:", error);
//     return { ok: false, message: "Failed to update school" };
//   }
// }

// export async function toggleSchoolStatus(id: string): Promise<ActionResponse> {
//   try {
//     const school = await db.school.findUnique({
//       where: { id },
//       select: { isActive: true },
//     });

//     if (!school) return { ok: false, message: "School not found" };

//     const updatedSchool = await db.school.update({
//       where: { id },
//       data: { isActive: !school.isActive },
//     });

//     revalidatePath("/dashboard/schools");

//     return { ok: true, data: updatedSchool };
//   } catch (error) {
//     console.error("Error toggling school status:", error);
//     return { ok: false, message: "Failed to toggle school status" };
//   }
// }

// // ─── Delete ───────────────────────────────────────────────────────────────────

// export async function deleteSchool(id: string): Promise<ActionResponse> {
//   try {
//     const school = await db.school.findUnique({
//       where: { id },
//       include: {
//         _count: { select: { students: true, teachers: true, staff: true } },
//       },
//     });

//     if (!school) return { ok: false, message: "School not found" };

//     const hasData =
//       school._count.students > 0 ||
//       school._count.teachers > 0 ||
//       school._count.staff > 0;

//     if (hasData) {
//       return {
//         ok: false,
//         message:
//           `Cannot delete school with existing data. ` +
//           `Found ${school._count.students} students, ` +
//           `${school._count.teachers} teachers, ` +
//           `${school._count.staff} staff.`,
//         requiresConfirmation: true,
//       };
//     }

//     const deleted = await db.school.delete({ where: { id } });
//     revalidatePath("/dashboard/schools");

//     return { ok: true, data: deleted };
//   } catch (error) {
//     console.error("Error deleting school:", error);
//     return { ok: false, message: "Failed to delete school" };
//   }
// }

// export async function forceDeleteSchool(id: string): Promise<ActionResponse> {
//   try {
//     const deleted = await db.school.delete({ where: { id } });
//     revalidatePath("/dashboard/schools");
//     return { ok: true, data: deleted };
//   } catch (error) {
//     console.error("Error force deleting school:", error);
//     return { ok: false, message: "Failed to delete school" };
//   }
// }

// // ─── Search ───────────────────────────────────────────────────────────────────

// export async function searchSchools(query: string): Promise<ActionResponse> {
//   try {
//     const schools = await db.school.findMany({
//       where: {
//         OR: [
//           { name:    { contains: query, mode: "insensitive" } },
//           { slug:    { contains: query, mode: "insensitive" } },
//           { code:    { contains: query, mode: "insensitive" } },
//           { email:   { contains: query, mode: "insensitive" } },
//           { address: { contains: query, mode: "insensitive" } },
//         ],
//       },
//       orderBy: { name: "asc" },
//       include: {
//         _count: { select: { students: true, teachers: true, staff: true } },
//       },
//     });

//     return { ok: true, data: schools };
//   } catch (error) {
//     console.error("Error searching schools:", error);
//     return { ok: false, data: [], message: "Failed to search schools" };
//   }
// }

// // ─── Stats ────────────────────────────────────────────────────────────────────

// export async function getSchoolDashboardStats(schoolId: string): Promise<ActionResponse> {
//   try {
//     const [
//       studentsCount,
//       teachersCount,
//       parentsCount,
//       classTemplatesCount,
//       staffCount,
//       activeStudents,
//       activeTeachers,
//       activeStaff,
//     ] = await Promise.all([
//       db.student.count({ where: { schoolId } }),
//       db.teacher.count({ where: { schoolId } }),
//       db.parent.count({ where: { schoolId } }),
//       db.classTemplate.count({ where: { schoolId } }),
//       db.staff.count({ where: { schoolId } }),
//       db.student.count({ where: { schoolId, isActive: true } }),
//       db.teacher.count({ where: { schoolId, status: "ACTIVE" } }),
//       db.staff.count({ where: { schoolId, status: "ACTIVE" } }),
//     ]);

//     const currentYear = await db.academicYear.findFirst({
//       where: { schoolId, isActive: true },
//       include: {
//         terms: { where: { isActive: true }, take: 1 },
//       },
//     });

//     return {
//       ok: true,
//       data: {
//         students:            { total: studentsCount,      active: activeStudents },
//         teachers:            { total: teachersCount,      active: activeTeachers },
//         staff:               { total: staffCount,         active: activeStaff },
//         parents:             parentsCount,
//         classes:             classTemplatesCount,
//         currentAcademicYear: currentYear?.year   ?? null,
//         currentTerm:         currentYear?.terms[0]?.name ?? null,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     return { ok: false, data: null, message: "Failed to fetch dashboard stats" };
//   }
// }

// // ─── Bulk ─────────────────────────────────────────────────────────────────────

// export async function createBulkSchools(
//   schools: SchoolCreateProps[]
// ): Promise<ActionResponse> {
//   try {
//     const results = [];
//     const errors:  { school: string; error: string }[] = [];

//     for (const school of schools) {
//       const result = await createSchool(school);
//       if (result.ok) {
//         results.push(result.data);
//       } else {
//         errors.push({ school: school.name, error: result.message ?? "Unknown error" });
//       }
//     }

//     revalidatePath("/dashboard/schools");

//     return {
//       ok:     errors.length === 0,
//       data:   results,
//       message: errors.length > 0
//         ? `${results.length} created, ${errors.length} failed`
//         : `${results.length} schools created successfully`,
//     };
//   } catch (error) {
//     console.error("Error bulk creating schools:", error);
//     return { ok: false, message: "Failed to create schools" };
//   }
// }


// actions/school.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { seedStaffRoleDefinitions } from "@/prisma/seeds/staff-role-definitions";

export interface SchoolCreateProps {
  name: string;
  slug: string;
  code: string;
  adminId: string;
  motto?: string | null;
  address?: string | null;
  contact?: string | null;
  contact2?: string | null;
  contact3?: string | null;
  email?: string | null;
  email2?: string | null;
  website?: string | null;
  logo?: string | null;
  isActive?: boolean;
}

export interface SchoolUpdateProps {
  name?: string;
  slug?: string;
  code?: string;
  motto?: string | null;
  address?: string | null;
  contact?: string | null;
  contact2?: string | null;
  contact3?: string | null;
  email?: string | null;
  email2?: string | null;
  website?: string | null;
  logo?: string | null;
  isActive?: boolean;
}

type ActionResponse<T = any> = {
  ok: boolean;
  data?: T | null;
  message?: string;
  requiresConfirmation?: boolean;
};

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSchool(data: SchoolCreateProps): Promise<ActionResponse> {
  try {
    const [existingSlug, existingCode] = await Promise.all([
      db.school.findUnique({ where: { slug: data.slug } }),
      db.school.findUnique({ where: { code: data.code } }),
    ]);

    if (existingSlug) return { ok: false, message: "A school with this slug already exists" };
    if (existingCode) return { ok: false, message: `School code "${data.code}" is already in use` };

    const admin = await db.user.findUnique({ where: { id: data.adminId } });
    if (!admin) return { ok: false, message: "Admin user not found" };

    const newSchool = await db.school.create({
      data: {
        name:     data.name,
        slug:     data.slug,
        code:     data.code,
        adminId:  data.adminId,
        motto:    data.motto    ?? null,
        address:  data.address  ?? null,
        contact:  data.contact  ?? null,
        contact2: data.contact2 ?? null,
        contact3: data.contact3 ?? null,
        email:    data.email    ?? null,
        email2:   data.email2   ?? null,
        website:  data.website  ?? null,
        logo:     data.logo     ?? null,
        isActive: data.isActive ?? true,
      },
    });

    // Auto-seed staff role definitions — non-fatal if it fails
    try {
      const seedResult = await seedStaffRoleDefinitions(newSchool.id);
      console.log(
        `✅ Role definitions seeded for "${newSchool.name}": ` +
        `${seedResult.created} created, ${seedResult.updated} updated`
      );
    } catch (seedError) {
      console.error(`⚠️  School created but role seed failed for ${newSchool.id}:`, seedError);
    }

    revalidatePath("/dashboard/schools");
    return { ok: true, data: newSchool, message: `School "${newSchool.name}" created successfully` };
  } catch (error: any) {
    console.error("❌ createSchool:", error);
    if (error.code === "P2002") {
      return { ok: false, message: "A school with this slug or code already exists" };
    }
    return { ok: false, message: error?.message ?? "Failed to create school" };
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAllSchools(): Promise<ActionResponse> {
  try {
    const schools = await db.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true, image: true } },
        _count: {
          select: {
            academicYears:  true,
            classTemplates: true,
            teachers:       true,
            parents:        true,
            students:       true,
            streams:        true,
            subjects:       true,
            staff:          true,
          },
        },
      },
    });
    return { ok: true, data: schools };
  } catch (error) {
    console.error("Error fetching schools:", error);
    return { ok: false, data: [], message: "Failed to fetch schools" };
  }
}

export async function getSchoolById(id: string): Promise<ActionResponse> {
  try {
    const school = await db.school.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, name: true, email: true, image: true } },
        academicYears: {
          orderBy: { year: "desc" },
          include: { terms: { orderBy: { termNumber: "asc" } } },
        },
        _count: {
          select: {
            classTemplates: true,
            teachers:       true,
            parents:        true,
            students:       true,
            streams:        true,
            subjects:       true,
            staff:          true,
          },
        },
      },
    });
    if (!school) return { ok: false, data: null, message: "School not found" };
    return { ok: true, data: school };
  } catch (error) {
    console.error("Error fetching school:", error);
    return { ok: false, data: null, message: "Failed to fetch school" };
  }
}

export async function getSchoolBySlug(slug: string): Promise<ActionResponse> {
  try {
    const school = await db.school.findUnique({
      where: { slug },
      include: {
        admin: { select: { id: true, name: true, email: true, image: true } },
        academicYears: {
          where: { isActive: true },
          include: { terms: { where: { isActive: true } } },
        },
        _count: {
          select: {
            classTemplates: true,
            teachers:       true,
            parents:        true,
            students:       true,
            streams:        true,
            subjects:       true,
            staff:          true,
          },
        },
      },
    });
    if (!school) return { ok: false, data: null, message: "School not found" };
    return { ok: true, data: school };
  } catch (error) {
    console.error("Error fetching school by slug:", error);
    return { ok: false, data: null, message: "Failed to fetch school" };
  }
}

/**
 * Step 1 of the login flow — verify school code before showing loginId + password fields.
 * FIX [3]: Added 'division' to select so the login flow knows O/A-level context.
 */
export async function getSchoolByCode(code: string): Promise<ActionResponse> {
  try {
    const school = await db.school.findUnique({
      where: { code },
      select: {
        id:       true,
        name:     true,
        code:     true,
        slug:     true,
        logo:     true,
        isActive: true,
      },
    });
    if (!school) return { ok: false, data: null, message: "Invalid school code" };
    if (!school.isActive) return { ok: false, data: null, message: "This school account is inactive" };
    return { ok: true, data: school };
  } catch (error) {
    console.error("Error fetching school by code:", error);
    return { ok: false, data: null, message: "Failed to verify school code" };
  }
}

export async function getSchoolsByAdminId(adminId: string): Promise<ActionResponse> {
  try {
    const schools = await db.school.findMany({
      where: { adminId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            academicYears:  true,
            classTemplates: true,
            teachers:       true,
            parents:        true,
            students:       true,
            staff:          true,
          },
        },
      },
    });
    return { ok: true, data: schools };
  } catch (error) {
    console.error("Error fetching schools by adminId:", error);
    return { ok: false, data: [], message: "Failed to fetch schools" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateSchoolById(id: string, data: SchoolUpdateProps): Promise<ActionResponse> {
  try {
    if (data.slug) {
      const existing = await db.school.findFirst({ where: { slug: data.slug, NOT: { id } } });
      if (existing) return { ok: false, message: "A school with this slug already exists" };
    }
    if (data.code) {
      const existing = await db.school.findFirst({ where: { code: data.code, NOT: { id } } });
      if (existing) return { ok: false, message: `School code "${data.code}" is already in use` };
    }

    const updatedSchool = await db.school.update({ where: { id }, data });

    revalidatePath("/dashboard/schools");
    revalidatePath(`/school/${updatedSchool.slug}`);
    return { ok: true, data: updatedSchool, message: "School updated successfully" };
  } catch (error) {
    console.error("Error updating school:", error);
    return { ok: false, message: "Failed to update school" };
  }
}

export async function toggleSchoolStatus(id: string): Promise<ActionResponse> {
  try {
    const school = await db.school.findUnique({ where: { id }, select: { isActive: true } });
    if (!school) return { ok: false, message: "School not found" };

    const updatedSchool = await db.school.update({ where: { id }, data: { isActive: !school.isActive } });
    revalidatePath("/dashboard/schools");
    return { ok: true, data: updatedSchool };
  } catch (error) {
    console.error("Error toggling school status:", error);
    return { ok: false, message: "Failed to toggle school status" };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteSchool(id: string): Promise<ActionResponse> {
  try {
    const school = await db.school.findUnique({
      where: { id },
      include: { _count: { select: { students: true, teachers: true, staff: true } } },
    });
    if (!school) return { ok: false, message: "School not found" };

    const hasData =
      school._count.students > 0 ||
      school._count.teachers > 0 ||
      school._count.staff > 0;

    if (hasData) {
      return {
        ok: false,
        message:
          `Cannot delete school with existing data. ` +
          `Found ${school._count.students} students, ` +
          `${school._count.teachers} teachers, ` +
          `${school._count.staff} staff.`,
        requiresConfirmation: true,
      };
    }

    const deleted = await db.school.delete({ where: { id } });
    revalidatePath("/dashboard/schools");
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error deleting school:", error);
    return { ok: false, message: "Failed to delete school" };
  }
}

export async function forceDeleteSchool(id: string): Promise<ActionResponse> {
  try {
    const deleted = await db.school.delete({ where: { id } });
    revalidatePath("/dashboard/schools");
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error force deleting school:", error);
    return { ok: false, message: "Failed to delete school" };
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchSchools(query: string): Promise<ActionResponse> {
  try {
    const schools = await db.school.findMany({
      where: {
        OR: [
          { name:    { contains: query, mode: "insensitive" } },
          { slug:    { contains: query, mode: "insensitive" } },
          { code:    { contains: query, mode: "insensitive" } },
          { email:   { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      include: { _count: { select: { students: true, teachers: true, staff: true } } },
    });
    return { ok: true, data: schools };
  } catch (error) {
    console.error("Error searching schools:", error);
    return { ok: false, data: [], message: "Failed to search schools" };
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getSchoolDashboardStats(schoolId: string): Promise<ActionResponse> {
  try {
    const [
      studentsCount, teachersCount, parentsCount, classTemplatesCount, staffCount,
      activeStudents, activeTeachers, activeStaff,
    ] = await Promise.all([
      db.student.count({ where: { schoolId } }),
      db.teacher.count({ where: { schoolId } }),
      db.parent.count({ where: { schoolId } }),
      db.classTemplate.count({ where: { schoolId } }),
      db.staff.count({ where: { schoolId } }),
      db.student.count({ where: { schoolId, isActive: true } }),
      db.teacher.count({ where: { schoolId, status: "ACTIVE" } }),
      db.staff.count({ where: { schoolId, status: "ACTIVE" } }),
    ]);

    const currentYear = await db.academicYear.findFirst({
      where: { schoolId, isActive: true },
      include: { terms: { where: { isActive: true }, take: 1 } },
    });

    return {
      ok: true,
      data: {
        students:            { total: studentsCount,  active: activeStudents },
        teachers:            { total: teachersCount,  active: activeTeachers },
        staff:               { total: staffCount,     active: activeStaff },
        parents:             parentsCount,
        classes:             classTemplatesCount,
        currentAcademicYear: currentYear?.year           ?? null,
        currentTerm:         currentYear?.terms[0]?.name ?? null,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { ok: false, data: null, message: "Failed to fetch dashboard stats" };
  }
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export async function createBulkSchools(schools: SchoolCreateProps[]): Promise<ActionResponse> {
  try {
    const results = [];
    const errors: { school: string; error: string }[] = [];

    for (const school of schools) {
      const result = await createSchool(school);
      if (result.ok) {
        results.push(result.data);
      } else {
        errors.push({ school: school.name, error: result.message ?? "Unknown error" });
      }
    }

    revalidatePath("/dashboard/schools");
    return {
      ok: errors.length === 0,
      data: results,
      message: errors.length > 0
        ? `${results.length} created, ${errors.length} failed`
        : `${results.length} schools created successfully`,
    };
  } catch (error) {
    console.error("Error bulk creating schools:", error);
    return { ok: false, message: "Failed to create schools" };
  }
}