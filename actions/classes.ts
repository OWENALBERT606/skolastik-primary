


// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { Prisma } from "@prisma/client";

// // ═══════════════════════════════════════════════════════════════════════
// // CLASS TEMPLATE ACTIONS (Master Class Definitions)
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Create a class template (master definition)
//  * This is created ONCE per school and reused across years
//  */
// export async function createClassTemplate(data: {
//   name: string;
//   code?: string;
//   description?: string;
//   level?: number;
//   schoolId: string;
// }) {
//   try {
//     const { name, code, description, level, schoolId } = data;

//     // Validate required fields
//     if (!name?.trim()) {
//       return { ok: false, message: "Class name is required" };
//     }

//     if (!schoolId) {
//       return { ok: false, message: "School ID is required" };
//     }

//     // Check for duplicate name
//     const nameExists = await db.classTemplate.findFirst({
//       where: {
//         schoolId,
//         name: { equals: name.trim(), mode: "insensitive" },
//       },
//     });

//     if (nameExists) {
//       return {
//         ok: false,
//         message: "A class with this name already exists in this school",
//       };
//     }

//     // Check for duplicate code if provided
//     if (code?.trim()) {
//       const codeExists = await db.classTemplate.findFirst({
//         where: {
//           schoolId,
//           code: { equals: code.trim(), mode: "insensitive" },
//         },
//       });

//       if (codeExists) {
//         return {
//           ok: false,
//           message: "A class with this code already exists in this school",
//         };
//       }
//     }

//     const classTemplate = await db.classTemplate.create({
//       data: {
//         name: name.trim(),
//         code: code?.trim() || null,
//         description: description?.trim() || null,
//         level,
//         schoolId,
//       },
//     });

//     revalidatePath("/dashboard/classes");

//     return {
//       ok: true,
//       data: classTemplate,
//       message: `Class template "${classTemplate.name}" created successfully`,
//     };
//   } catch (error: any) {
//     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
//       return {
//         ok: false,
//         message: "Unique constraint failed. Please check class name or code.",
//       };
//     }
//     console.error("❌ Error creating class template:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to create class template",
//     };
//   }
// }

// /**
//  * Get all class templates for a school
//  */
// export async function getClassTemplatesBySchool(schoolId: string) {
//   try {
//     return await db.classTemplate.findMany({
//       where: { schoolId },
//       include: {
//         _count: {
//           select: {
//             classYears: true,
//           },
//         },
//       },
//       orderBy: [
//         { level: "asc" },
//         { name: "asc" },
//       ],
//     });
//   } catch (error) {
//     console.error("❌ Error fetching class templates:", error);
//     return [];
//   }
// }

// /**
//  * Get single class template by ID
//  */
// export async function getClassTemplateById(id: string) {
//   try {
//     return await db.classTemplate.findUnique({
//       where: { id },
//       include: {
//         classYears: {
//           include: {
//             academicYear: true,
//             _count: {
//               select: {
//                 streams: true,
//                 enrollments: true,
//               },
//             },
//           },
//           orderBy: {
//             academicYear: { year: "desc" },
//           },
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching class template:", error);
//     return null;
//   }
// }

// /**
//  * Update class template
//  */
// export async function updateClassTemplate(
//   id: string,
//   data: {
//     name?: string;
//     code?: string;
//     description?: string;
//     level?: number;
//   }
// ) {
//   try {
//     const currentTemplate = await db.classTemplate.findUnique({
//       where: { id },
//       select: { schoolId: true, name: true },
//     });

//     if (!currentTemplate) {
//       return { ok: false, message: "Class template not found" };
//     }

//     // Check for duplicate name if name is being updated
//     if (data.name?.trim()) {
//       const nameExists = await db.classTemplate.findFirst({
//         where: {
//           schoolId: currentTemplate.schoolId,
//           name: { equals: data.name.trim(), mode: "insensitive" },
//           NOT: { id },
//         },
//       });

//       if (nameExists) {
//         return {
//           ok: false,
//           message: "A class with this name already exists in this school",
//         };
//       }
//     }

//     // Check for duplicate code if code is being updated
//     if (data.code?.trim()) {
//       const codeExists = await db.classTemplate.findFirst({
//         where: {
//           schoolId: currentTemplate.schoolId,
//           code: { equals: data.code.trim(), mode: "insensitive" },
//           NOT: { id },
//         },
//       });

//       if (codeExists) {
//         return {
//           ok: false,
//           message: "A class with this code already exists in this school",
//         };
//       }
//     }

//     const updatedTemplate = await db.classTemplate.update({
//       where: { id },
//       data: {
//         ...(data.name !== undefined && { name: data.name.trim() }),
//         ...(data.code !== undefined && { code: data.code?.trim() || null }),
//         ...(data.description !== undefined && { description: data.description?.trim() || null }),
//         ...(data.level !== undefined && { level: data.level }),
//       },
//     });

//     revalidatePath("/dashboard/classes");

//     return {
//       ok: true,
//       data: updatedTemplate,
//       message: "Class template updated successfully",
//     };
//   } catch (error: any) {
//     console.error("❌ Error updating class template:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to update class template",
//     };
//   }
// }

// /**
//  * Delete class template
//  */
// export async function deleteClassTemplate(id: string) {
//   try {
//     const template = await db.classTemplate.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: {
//             classYears: true,
//           },
//         },
//       },
//     });

//     if (!template) {
//       return { ok: false, message: "Class template not found" };
//     }

//     if (template._count.classYears > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete class template "${template.name}". It has been used in ${template._count.classYears} academic year(s). Delete those first.`,
//       };
//     }

//     await db.classTemplate.delete({
//       where: { id },
//     });

//     revalidatePath("/dashboard/classes");

//     return {
//       ok: true,
//       message: `Class template "${template.name}" deleted successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error deleting class template:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to delete class template",
//     };
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════
// // CLASS YEAR ACTIONS (Class Instance per Academic Year)
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Create a class year (class instance for specific academic year)
//  */
// export async function createClassYear(data: {
//   classTemplateId: string;
//   academicYearId: string;
//   maxStudents?: number;
//   classTeacherId?: string;
//   remarks?: string;
// }) {
//   try {
//     const { classTemplateId, academicYearId, maxStudents, classTeacherId, remarks } = data;

//     // Verify class template exists
//     const classTemplate = await db.classTemplate.findUnique({
//       where: { id: classTemplateId },
//       select: { name: true, schoolId: true },
//     });

//     if (!classTemplate) {
//       return { ok: false, message: "Class template not found" };
//     }

//     // Verify academic year exists and has terms
//     const academicYear = await db.academicYear.findUnique({
//       where: { id: academicYearId },
//       include: { terms: true },
//     });

//     if (!academicYear) {
//       return { ok: false, message: "Academic year not found" };
//     }

//     if (academicYear.schoolId !== classTemplate.schoolId) {
//       return {
//         ok: false,
//         message: "Class template and academic year must belong to the same school",
//       };
//     }

//     if (academicYear.terms.length === 0) {
//       return {
//         ok: false,
//         message: `Academic year ${academicYear.year} must have terms before creating classes`,
//       };
//     }

//     // Check if class year already exists
//     const existing = await db.classYear.findUnique({
//       where: {
//         classTemplateId_academicYearId: {
//           classTemplateId,
//           academicYearId,
//         },
//       },
//     });

//     if (existing) {
//       return {
//         ok: false,
//         message: `Class "${classTemplate.name}" already exists for academic year ${academicYear.year}`,
//       };
//     }

//     const classYear = await db.classYear.create({
//       data: {
//         classTemplateId,
//         academicYearId,
//         maxStudents,
//         classTeacherId,
//         remarks,
//       },
//       include: {
//         classTemplate: true,
//         academicYear: {
//           include: { terms: true },
//         },
//       },
//     });

//     revalidatePath("/dashboard/classes");
//     revalidatePath(`/dashboard/academic-years/${academicYearId}`);

//     return {
//       ok: true,
//       data: classYear,
//       message: `Class "${classYear.classTemplate.name}" created for ${classYear.academicYear.year}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error creating class year:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to create class year",
//     };
//   }
// }

// /**
//  * Get all class years for a school (optionally filter by academic year)
//  */
// export async function getClassYearsBySchool(
//   schoolId: string,
//   academicYearId?: string
// ) {
//   try {
//     const where: Prisma.ClassYearWhereInput = {
//       classTemplate: { schoolId },
//       ...(academicYearId && { academicYearId }),
//     };

//     return await db.classYear.findMany({
//       where,
//       include: {
//         classTemplate: true,
//         academicYear: true,
//         streams: true,
//         _count: {
//           select: {
//             enrollments: true,
//             streams: true,
//             classSubjects: true,
//           },
//         },
//       },
//       orderBy: [
//         { academicYear: { year: "desc" } },
//         { classTemplate: { level: "asc" } },
//         { classTemplate: { name: "asc" } },
//       ],
//     });
//   } catch (error) {
//     console.error("❌ Error fetching class years:", error);
//     return [];
//   }
// }

// /**
//  * Get class years by academic year
//  */
// export async function getClassYearsByAcademicYear(academicYearId: string) {
//   try {
//     return await db.classYear.findMany({
//       where: { academicYearId },
//       include: {
//         classTemplate: true,
//         academicYear: {
//           include: { terms: true },
//         },
//         streams: {
//           include: {
//             _count: {
//               select: {
//                 enrollments: true,
//               },
//             },
//           },
//         },
//         _count: {
//           select: {
//             enrollments: true,
//             streams: true,
//             classSubjects: true,
//           },
//         },
//       },
//       orderBy: [
//         { classTemplate: { level: "asc" } },
//         { classTemplate: { name: "asc" } },
//       ],
//     });
//   } catch (error) {
//     console.error("❌ Error fetching class years by academic year:", error);
//     return [];
//   }
// }

// /**
//  * Get single class year by ID
//  * ✅ ENHANCED: Includes paper code information in all relations
//  */
// export async function getClassYearById(classYearId: string) {
//   try {
//     const classYear = await db.classYear.findUnique({
//       where: { id: classYearId },
//       include: {
//         classTemplate: true,
//         academicYear: {
//           include: {
//             terms: {
//               orderBy: { termNumber: "asc" },
//             },
//           },
//         },
//         streams: {
//           include: {
//             classHead: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 staffNo: true,
//               },
//             },
//             // ✅ Include streamSubjects to count subjects properly
//             streamSubjects: {
//               select: {
//                 id: true,
//                 subjectId: true,
//                 subjectPaper: {
//                   // ✅ Include paper code
//                   select: {
//                     id: true,
//                     paperNumber: true,
//                     paperCode: true,
//                   },
//                 },
//               },
//             },
//             _count: {
//               select: {
//                 enrollments: true,
//               },
//             },
//           },
//           orderBy: { name: "asc" },
//         },
//         classSubjects: {
//           include: {
//             subject: {
//               include: {
//                 papers: {
//                   where: { isActive: true },
//                   orderBy: { paperNumber: "asc" },
//                   select: {
//                     id: true,
//                     paperNumber: true,
//                     name: true,
//                     paperCode: true, // ✅ Include paper code
//                     maxMarks: true,
//                     weight: true,
//                   },
//                 },
//                 headTeacher: {
//                   select: {
//                     id: true,
//                     firstName: true,
//                     lastName: true,
//                     staffNo: true,
//                   },
//                 },
//               },
//             },
//           },
//           orderBy: {
//             subject: { name: "asc" },
//           },
//         },
//         enrollments: {
//           where: {
//             status: "ACTIVE",
//           },
//           include: {
//             student: {
//               select: {
//                 id: true,
//                 admissionNo: true,
//                 firstName: true,
//                 lastName: true,
//                 gender: true,
//                 imageUrl: true,
//               },
//             },
//             stream: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//             term: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//           orderBy: {
//             student: {
//               firstName: "asc",
//             },
//           },
//         },
//         _count: {
//           select: {
//             streams: true,
//             classSubjects: true,
//             enrollments: true,
//           },
//         },
//       },
//     });

//     return classYear;
//   } catch (error) {
//     console.error("❌ Error fetching class year by ID:", error);
//     return null;
//   }
// }

// /**
//  * Update class year
//  */
// export async function updateClassYear(
//   id: string,
//   data: {
//     maxStudents?: number;
//     classTeacherId?: string | null;
//     remarks?: string;
//     isActive?: boolean;
//   }
// ) {
//   try {
//     const classYear = await db.classYear.findUnique({
//       where: { id },
//       select: { id: true },
//     });

//     if (!classYear) {
//       return { ok: false, message: "Class year not found" };
//     }

//     const updatedClassYear = await db.classYear.update({
//       where: { id },
//       data: {
//         ...(data.maxStudents !== undefined && { maxStudents: data.maxStudents }),
//         ...(data.classTeacherId !== undefined && {
//           classTeacherId: data.classTeacherId,
//         }),
//         ...(data.remarks !== undefined && { remarks: data.remarks }),
//         ...(data.isActive !== undefined && { isActive: data.isActive }),
//       },
//       include: {
//         classTemplate: true,
//         academicYear: true,
//       },
//     });

//     revalidatePath("/dashboard/classes");
//     revalidatePath(`/dashboard/classes/${id}`);

//     return {
//       ok: true,
//       data: updatedClassYear,
//       message: "Class year updated successfully",
//     };
//   } catch (error: any) {
//     console.error("❌ Error updating class year:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to update class year",
//     };
//   }
// }

// /**
//  * Delete class year
//  */
// export async function deleteClassYear(id: string) {
//   try {
//     const classYear = await db.classYear.findUnique({
//       where: { id },
//       include: {
//         classTemplate: true,
//         academicYear: true,
//         _count: {
//           select: {
//             enrollments: true,
//             streams: true,
//             classSubjects: true,
//             exams: true,
//           },
//         },
//       },
//     });

//     if (!classYear) {
//       return { ok: false, message: "Class year not found" };
//     }

//     // Check for dependencies
//     if (classYear._count.enrollments > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete class. It has ${classYear._count.enrollments} student enrollment(s). Remove these first.`,
//       };
//     }

//     if (classYear._count.streams > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete class. It has ${classYear._count.streams} stream(s). Remove these first.`,
//       };
//     }

//     if (classYear._count.classSubjects > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete class. It has ${classYear._count.classSubjects} subject assignment(s). Remove these first.`,
//       };
//     }

//     if (classYear._count.exams > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete class. It has ${classYear._count.exams} exam(s). Remove these first.`,
//       };
//     }

//     await db.classYear.delete({
//       where: { id },
//     });

//     revalidatePath("/dashboard/classes");
//     revalidatePath(`/dashboard/academic-years/${classYear.academicYearId}`);

//     return {
//       ok: true,
//       message: `Class "${classYear.classTemplate.name}" deleted successfully for ${classYear.academicYear.year}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error deleting class year:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to delete class year",
//     };
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════
// // UTILITY FUNCTIONS
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Copy classes from one academic year to another
//  * Useful for setting up a new academic year
//  */
// export async function copyClassesToNewYear(
//   fromAcademicYearId: string,
//   toAcademicYearId: string,
//   schoolId: string
// ) {
//   try {
//     // Verify both academic years exist and belong to the school
//     const [fromYear, toYear] = await Promise.all([
//       db.academicYear.findFirst({
//         where: { id: fromAcademicYearId, schoolId },
//         select: { id: true, year: true },
//       }),
//       db.academicYear.findFirst({
//         where: { id: toAcademicYearId, schoolId },
//         include: { terms: true },
//       }),
//     ]);

//     if (!fromYear || !toYear) {
//       return { ok: false, message: "Invalid academic year(s)" };
//     }

//     if (toYear.terms.length === 0) {
//       return {
//         ok: false,
//         message: `Academic year ${toYear.year} must have terms before copying classes`,
//       };
//     }

//     // Get all class years from previous year
//     const previousClassYears = await db.classYear.findMany({
//       where: {
//         academicYearId: fromAcademicYearId,
//       },
//       select: {
//         classTemplateId: true,
//         maxStudents: true,
//         classTeacherId: true,
//       },
//     });

//     if (previousClassYears.length === 0) {
//       return {
//         ok: false,
//         message: `No classes found for academic year ${fromYear.year}`,
//       };
//     }

//     // Check for existing classes in target year
//     const existingInNewYear = await db.classYear.findMany({
//       where: {
//         academicYearId: toAcademicYearId,
//         classTemplateId: {
//           in: previousClassYears.map((cy) => cy.classTemplateId),
//         },
//       },
//       select: { classTemplateId: true },
//     });

//     const existingTemplateIds = new Set(
//       existingInNewYear.map((cy) => cy.classTemplateId)
//     );

//     const newClassYears = previousClassYears.filter(
//       (cy) => !existingTemplateIds.has(cy.classTemplateId)
//     );

//     if (newClassYears.length === 0) {
//       return {
//         ok: false,
//         message: `All classes from ${fromYear.year} already exist in ${toYear.year}`,
//       };
//     }

//     // Create class years for new academic year
//     const created = await db.classYear.createMany({
//       data: newClassYears.map((cy) => ({
//         classTemplateId: cy.classTemplateId,
//         academicYearId: toAcademicYearId,
//         maxStudents: cy.maxStudents,
//         classTeacherId: cy.classTeacherId,
//       })),
//       skipDuplicates: true,
//     });

//     revalidatePath("/dashboard/classes");
//     revalidatePath(`/dashboard/academic-years/${toAcademicYearId}`);

//     return {
//       ok: true,
//       data: {
//         count: created.count,
//         from: fromYear.year,
//         to: toYear.year,
//       },
//       message: `Successfully copied ${created.count} class(es) from ${fromYear.year} to ${toYear.year}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error copying classes to new year:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to copy classes to new academic year",
//     };
//   }
// }

// /**
//  * Get class statistics for a school
//  */
// export async function getClassStats(schoolId: string, academicYearId?: string) {
//   try {
//     const where: Prisma.ClassYearWhereInput = {
//       classTemplate: { schoolId },
//       ...(academicYearId && { academicYearId }),
//     };

//     const [totalClasses, classesWithStreams, totalStudents] = await Promise.all([
//       db.classYear.count({ where }),
//       db.classYear.count({
//         where: {
//           ...where,
//           streams: { some: {} },
//         },
//       }),
//       db.enrollment.count({
//         where: {
//           ...(academicYearId && { academicYearId }),
//           classYear: {
//             classTemplate: { schoolId },
//           },
//         },
//       }),
//     ]);

//     return {
//       totalClasses,
//       classesWithStreams,
//       classesWithoutStreams: totalClasses - classesWithStreams,
//       totalStudents,
//     };
//   } catch (error) {
//     console.error("❌ Error fetching class stats:", error);
//     return {
//       totalClasses: 0,
//       classesWithStreams: 0,
//       classesWithoutStreams: 0,
//       totalStudents: 0,
//     };
//   }
// }



"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { Prisma, EnrollmentStatus } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════
// CLASS TEMPLATE ACTIONS
// ═══════════════════════════════════════════════════════════════════════

export async function createClassTemplate(data: {
  name:         string;
  code?:        string;
  description?: string;
  level?:       number;
  schoolId:     string;
}) {
  try {
    const { name, code, description, level, schoolId } = data;

    if (!name?.trim()) return { ok: false, message: "Class name is required" };
    if (!schoolId)     return { ok: false, message: "School ID is required" };

    const nameExists = await db.classTemplate.findFirst({
      where: {
        schoolId,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });
    if (nameExists) {
      return { ok: false, message: "A class with this name already exists in this school" };
    }

    if (code?.trim()) {
      const codeExists = await db.classTemplate.findFirst({
        where: {
          schoolId,
          code: { equals: code.trim(), mode: "insensitive" },
        },
      });
      if (codeExists) {
        return { ok: false, message: "A class with this code already exists in this school" };
      }
    }

    const classTemplate = await db.classTemplate.create({
      data: {
        name:        name.trim(),
        code:        code?.trim() || null,
        description: description?.trim() || null,
        level,
        schoolId,
      },
    });

    revalidatePath("/dashboard/classes");

    return {
      ok:      true,
      data:    classTemplate,
      message: `Class template "${classTemplate.name}" created successfully`,
    };
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Unique constraint failed. Please check class name or code." };
    }
    console.error("❌ Error creating class template:", error);
    return { ok: false, message: error?.message ?? "Failed to create class template" };
  }
}

export async function getClassTemplatesBySchool(schoolId: string) {
  try {
    return await db.classTemplate.findMany({
      where: { schoolId },
      include: { _count: { select: { classYears: true } } },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    console.error("❌ Error fetching class templates:", error);
    return [];
  }
}

export async function getClassTemplateById(id: string) {
  try {
    return await db.classTemplate.findUnique({
      where: { id },
      include: {
        classYears: {
          include: {
            academicYear: true,
            _count: { select: { streams: true, enrollments: true } },
          },
          orderBy: { academicYear: { year: "desc" } },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching class template:", error);
    return null;
  }
}

export async function updateClassTemplate(
  id: string,
  data: {
    name?:        string;
    code?:        string;
    description?: string;
    level?:       number;
  }
) {
  try {
    const currentTemplate = await db.classTemplate.findUnique({
      where: { id },
      select: { schoolId: true, name: true },
    });
    if (!currentTemplate) return { ok: false, message: "Class template not found" };

    if (data.name?.trim()) {
      const nameExists = await db.classTemplate.findFirst({
        where: {
          schoolId: currentTemplate.schoolId,
          name:     { equals: data.name.trim(), mode: "insensitive" },
          NOT:      { id },
        },
      });
      if (nameExists) {
        return { ok: false, message: "A class with this name already exists in this school" };
      }
    }

    if (data.code?.trim()) {
      const codeExists = await db.classTemplate.findFirst({
        where: {
          schoolId: currentTemplate.schoolId,
          code:     { equals: data.code.trim(), mode: "insensitive" },
          NOT:      { id },
        },
      });
      if (codeExists) {
        return { ok: false, message: "A class with this code already exists in this school" };
      }
    }

    const updatedTemplate = await db.classTemplate.update({
      where: { id },
      data: {
        ...(data.name        !== undefined && { name:        data.name.trim() }),
        ...(data.code        !== undefined && { code:        data.code?.trim() || null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.level       !== undefined && { level:       data.level }),
      },
    });

    revalidatePath("/dashboard/classes");

    return { ok: true, data: updatedTemplate, message: "Class template updated successfully" };
  } catch (error: any) {
    console.error("❌ Error updating class template:", error);
    return { ok: false, message: error?.message ?? "Failed to update class template" };
  }
}

export async function deleteClassTemplate(id: string) {
  try {
    const template = await db.classTemplate.findUnique({
      where:   { id },
      include: { _count: { select: { classYears: true } } },
    });
    if (!template) return { ok: false, message: "Class template not found" };

    if (template._count.classYears > 0) {
      return {
        ok:      false,
        message: `Cannot delete class template "${template.name}". It has been used in ${template._count.classYears} academic year(s). Delete those first.`,
      };
    }

    await db.classTemplate.delete({ where: { id } });
    revalidatePath("/dashboard/classes");

    return { ok: true, message: `Class template "${template.name}" deleted successfully` };
  } catch (error: any) {
    console.error("❌ Error deleting class template:", error);
    return { ok: false, message: error?.message ?? "Failed to delete class template" };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CLASS YEAR ACTIONS
// ═══════════════════════════════════════════════════════════════════════

export async function createClassYear(data: {
  classTemplateId:  string;
  academicYearId:   string;
  maxStudents?:     number;
  classTeacherId?:  string;
  remarks?:         string;
}) {
  try {
    const { classTemplateId, academicYearId, maxStudents, classTeacherId, remarks } = data;

    const classTemplate = await db.classTemplate.findUnique({
      where:  { id: classTemplateId },
      select: { name: true, schoolId: true },
    });
    if (!classTemplate) return { ok: false, message: "Class template not found" };

    const academicYear = await db.academicYear.findUnique({
      where:   { id: academicYearId },
      include: { terms: true },
    });
    if (!academicYear) return { ok: false, message: "Academic year not found" };

    if (academicYear.schoolId !== classTemplate.schoolId) {
      return { ok: false, message: "Class template and academic year must belong to the same school" };
    }

    if (academicYear.terms.length === 0) {
      return {
        ok:      false,
        message: `Academic year ${academicYear.year} must have terms before creating classes`,
      };
    }

    const existing = await db.classYear.findUnique({
      where: { classTemplateId_academicYearId: { classTemplateId, academicYearId } },
    });
    if (existing) {
      return {
        ok:      false,
        message: `Class "${classTemplate.name}" already exists for academic year ${academicYear.year}`,
      };
    }

    const classYear = await db.classYear.create({
      data: { classTemplateId, academicYearId, maxStudents, classTeacherId, remarks },
      include: {
        classTemplate: true,
        academicYear:  { include: { terms: true } },
      },
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/academic-years/${academicYearId}`);

    return {
      ok:      true,
      data:    classYear,
      message: `Class "${classYear.classTemplate.name}" created for ${classYear.academicYear.year}`,
    };
  } catch (error: any) {
    console.error("❌ Error creating class year:", error);
    return { ok: false, message: error?.message ?? "Failed to create class year" };
  }
}

export async function getClassYearsBySchool(schoolId: string, academicYearId?: string) {
  try {
    const where: Prisma.ClassYearWhereInput = {
      classTemplate: { schoolId },
      ...(academicYearId && { academicYearId }),
    };

    return await db.classYear.findMany({
      where,
      include: {
        classTemplate: true,
        academicYear:  true,
        streams:       true,
        _count: { select: { enrollments: true, streams: true, classSubjects: true } },
      },
      orderBy: [
        { academicYear: { year: "desc" } },
        { classTemplate: { level: "asc" } },
        { classTemplate: { name:  "asc" } },
      ],
    });
  } catch (error) {
    console.error("❌ Error fetching class years:", error);
    return [];
  }
}

export async function getClassYearsByAcademicYear(academicYearId: string) {
  try {
    return await db.classYear.findMany({
      where: { academicYearId },
      include: {
        classTemplate: true,
        academicYear:  { include: { terms: true } },
        streams: {
          include: { _count: { select: { enrollments: true } } },
        },
        _count: { select: { enrollments: true, streams: true, classSubjects: true } },
      },
      orderBy: [
        { classTemplate: { level: "asc" } },
        { classTemplate: { name:  "asc" } },
      ],
    });
  } catch (error) {
    console.error("❌ Error fetching class years by academic year:", error);
    return [];
  }
}

export async function getClassYearById(classYearId: string) {
  try {
    const classYear = await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        classTemplate: true,
        academicYear: {
          include: { terms: { orderBy: { termNumber: "asc" } } },
        },
        streams: {
          include: {
            classHead: {
              select: { id: true, firstName: true, lastName: true, staffNo: true },
            },
            streamSubjects: {
              select: {
                id: true,
                subjectId: true,
              },
            },
            _count: { select: { enrollments: true } },
          },
          orderBy: { name: "asc" },
        },
        classSubjects: {
          include: {
            subject: {
              include: {
                headTeacher: {
                  select: { id: true, firstName: true, lastName: true, staffNo: true },
                },
              },
            },
          },
          orderBy: { subject: { name: "asc" } },
        },
        enrollments: {
          where: {
            // FIX [1]: Use EnrollmentStatus enum
            status: EnrollmentStatus.ACTIVE,
          },
          include: {
            student: {
              select: { id: true, admissionNo: true, firstName: true, lastName: true, gender: true, imageUrl: true },
            },
            stream: { select: { id: true, name: true } },
            term:   { select: { id: true, name: true } },
          },
          orderBy: { student: { firstName: "asc" } },
        },
        _count: { select: { streams: true, classSubjects: true, enrollments: true } },
      },
    });

    return classYear;
  } catch (error) {
    console.error("❌ Error fetching class year by ID:", error);
    return null;
  }
}

export async function updateClassYear(
  id: string,
  data: {
    maxStudents?:    number;
    classTeacherId?: string | null;
    remarks?:        string;
    isActive?:       boolean;
  }
) {
  try {
    const classYear = await db.classYear.findUnique({
      where:  { id },
      select: { id: true },
    });
    if (!classYear) return { ok: false, message: "Class year not found" };

    const updatedClassYear = await db.classYear.update({
      where: { id },
      data: {
        ...(data.maxStudents    !== undefined && { maxStudents:   data.maxStudents }),
        ...(data.classTeacherId !== undefined && { classTeacherId: data.classTeacherId }),
        ...(data.remarks        !== undefined && { remarks:        data.remarks }),
        ...(data.isActive       !== undefined && { isActive:       data.isActive }),
      },
      include: { classTemplate: true, academicYear: true },
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${id}`);

    return { ok: true, data: updatedClassYear, message: "Class year updated successfully" };
  } catch (error: any) {
    console.error("❌ Error updating class year:", error);
    return { ok: false, message: error?.message ?? "Failed to update class year" };
  }
}

export async function deleteClassYear(id: string) {
  try {
    const classYear = await db.classYear.findUnique({
      where:   { id },
      include: {
        classTemplate: true,
        academicYear:  true,
        _count: { select: { enrollments: true, streams: true, classSubjects: true, exams: true } },
      },
    });
    if (!classYear) return { ok: false, message: "Class year not found" };

    if (classYear._count.enrollments > 0) {
      return { ok: false, message: `Cannot delete class. It has ${classYear._count.enrollments} student enrollment(s). Remove these first.` };
    }
    if (classYear._count.streams > 0) {
      return { ok: false, message: `Cannot delete class. It has ${classYear._count.streams} stream(s). Remove these first.` };
    }
    if (classYear._count.classSubjects > 0) {
      return { ok: false, message: `Cannot delete class. It has ${classYear._count.classSubjects} subject assignment(s). Remove these first.` };
    }
    if (classYear._count.exams > 0) {
      return { ok: false, message: `Cannot delete class. It has ${classYear._count.exams} exam(s). Remove these first.` };
    }

    await db.classYear.delete({ where: { id } });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/academic-years/${classYear.academicYearId}`);

    return {
      ok:      true,
      message: `Class "${classYear.classTemplate.name}" deleted successfully for ${classYear.academicYear.year}`,
    };
  } catch (error: any) {
    console.error("❌ Error deleting class year:", error);
    return { ok: false, message: error?.message ?? "Failed to delete class year" };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

export async function copyClassesToNewYear(
  fromAcademicYearId: string,
  toAcademicYearId:   string,
  schoolId:           string
) {
  try {
    const [fromYear, toYear] = await Promise.all([
      db.academicYear.findFirst({
        where:  { id: fromAcademicYearId, schoolId },
        select: { id: true, year: true },
      }),
      db.academicYear.findFirst({
        where:   { id: toAcademicYearId, schoolId },
        include: { terms: true },
      }),
    ]);

    if (!fromYear || !toYear) return { ok: false, message: "Invalid academic year(s)" };
    if (toYear.terms.length === 0) {
      return { ok: false, message: `Academic year ${toYear.year} must have terms before copying classes` };
    }

    const previousClassYears = await db.classYear.findMany({
      where:  { academicYearId: fromAcademicYearId },
      select: { classTemplateId: true, maxStudents: true, classTeacherId: true },
    });

    if (previousClassYears.length === 0) {
      return { ok: false, message: `No classes found for academic year ${fromYear.year}` };
    }

    const existingInNewYear = await db.classYear.findMany({
      where: {
        academicYearId:  toAcademicYearId,
        classTemplateId: { in: previousClassYears.map(cy => cy.classTemplateId) },
      },
      select: { classTemplateId: true },
    });

    const existingTemplateIds = new Set(existingInNewYear.map(cy => cy.classTemplateId));
    const newClassYears = previousClassYears.filter(cy => !existingTemplateIds.has(cy.classTemplateId));

    if (newClassYears.length === 0) {
      return { ok: false, message: `All classes from ${fromYear.year} already exist in ${toYear.year}` };
    }

    const created = await db.classYear.createMany({
      data: newClassYears.map(cy => ({
        classTemplateId: cy.classTemplateId,
        academicYearId:  toAcademicYearId,
        maxStudents:     cy.maxStudents,
        classTeacherId:  cy.classTeacherId,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/academic-years/${toAcademicYearId}`);

    return {
      ok:      true,
      data:    { count: created.count, from: fromYear.year, to: toYear.year },
      message: `Successfully copied ${created.count} class(es) from ${fromYear.year} to ${toYear.year}`,
    };
  } catch (error: any) {
    console.error("❌ Error copying classes to new year:", error);
    return { ok: false, message: error?.message ?? "Failed to copy classes to new academic year" };
  }
}

export async function getClassStats(schoolId: string, academicYearId?: string) {
  try {
    const where: Prisma.ClassYearWhereInput = {
      classTemplate: { schoolId },
      ...(academicYearId && { academicYearId }),
    };

    const [totalClasses, classesWithStreams, totalStudents] = await Promise.all([
      db.classYear.count({ where }),
      db.classYear.count({ where: { ...where, streams: { some: {} } } }),
      db.enrollment.count({
        where: {
          ...(academicYearId && { academicYearId }),
          classYear: { classTemplate: { schoolId } },
        },
      }),
    ]);

    return {
      totalClasses,
      classesWithStreams,
      classesWithoutStreams: totalClasses - classesWithStreams,
      totalStudents,
    };
  } catch (error) {
    console.error("❌ Error fetching class stats:", error);
    return { totalClasses: 0, classesWithStreams: 0, classesWithoutStreams: 0, totalStudents: 0 };
  }
}