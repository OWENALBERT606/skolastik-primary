



// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { Prisma } from "@prisma/client";

// /* ─────────────────────────────────────────────────────────────
//  TYPES
// ───────────────────────────────────────────────────────────── */

// type CreateSubjectPayload = {
//   name: string;
//   code?: string | null;
//   description?: string | null;
//   category?: string | null;
//   schoolId: string;
//   headTeacherId?: string | null;
// };

// type UpdateSubjectData = Partial<{
//   name: string;
//   code: string | null;
//   description: string | null;
//   category: string | null;
//   isActive: boolean;
//   headTeacherId: string | null;
// }>;

// // ✅ ENHANCED: Added paperCode
// type CreateSubjectPaperPayload = {
//   subjectId: string;
//   paperNumber: number;
//   name: string;
//   paperCode?: string | null; // ✅ NEW: e.g., "804/1", "553/2"
//   description?: string | null;
//   maxMarks?: number;
//   weight?: number;
//   aoiCount?: number;
// };

// // ✅ ENHANCED: Added paperCode
// type UpdateSubjectPaperData = Partial<{
//   name: string;
//   paperCode: string | null; // ✅ NEW
//   description: string | null;
//   maxMarks: number;
//   weight: number;
//   aoiCount: number;
//   isActive: boolean;
// }>;

// /* ─────────────────────────────────────────────────────────────
//  SUBJECTS
// ───────────────────────────────────────────────────────────── */

// export async function createSubject(data: CreateSubjectPayload) {
//   try {
//     const { name, code, description, category, schoolId, headTeacherId } = data;

//     if (!name?.trim()) {
//       return { ok: false, message: "Subject name is required" };
//     }

//     // Check for duplicates
//     const existing = await db.subject.findFirst({
//       where: {
//         schoolId,
//         OR: [
//           { name: { equals: name.trim(), mode: Prisma.QueryMode.insensitive } },
//           ...(code ? [{ code: { equals: code.trim(), mode: Prisma.QueryMode.insensitive } }] : []),
//         ],
//       },
//     });

//     if (existing) {
//       return { ok: false, message: "Subject name or code already exists" };
//     }

//     const subject = await db.subject.create({
//       data: {
//         name: name.trim(),
//         code: code?.trim() || null,
//         description: description?.trim() || null,
//         category: category?.trim() || null,
//         schoolId,
//         ...(headTeacherId && { headTeacherId }),
//       },
//       include: {
//         headTeacher: {
//           select: { id: true, firstName: true, lastName: true, staffNo: true },
//         },
//       },
//     });

//     revalidatePath("/dashboard/subjects");

//     return { ok: true, data: subject, message: "Subject created successfully" };
//   } catch (error: any) {
//     console.error("❌ createSubject:", error);
//     return { ok: false, message: "Failed to create subject" };
//   }
// }

// export async function updateSubject(id: string, data: UpdateSubjectData) {
//   try {
//     const subject = await db.subject.findUnique({
//       where: { id },
//       select: { schoolId: true },
//     });

//     if (!subject) return { ok: false, message: "Subject not found" };

//     if (data.name || data.code) {
//       const exists = await db.subject.findFirst({
//         where: {
//           schoolId: subject.schoolId,
//           OR: [
//             ...(data.name
//               ? [{ name: { equals: data.name.trim(), mode: Prisma.QueryMode.insensitive } }]
//               : []),
//             ...(data.code
//               ? [{ code: { equals: data.code.trim(), mode: Prisma.QueryMode.insensitive } }]
//               : []),
//           ],
//           NOT: { id },
//         },
//       });

//       if (exists) {
//         return { ok: false, message: "Subject name or code already exists" };
//       }
//     }

//     const updateData: Prisma.SubjectUpdateInput = {
//       ...(data.name !== undefined && { name: data.name.trim() }),
//       ...(data.code !== undefined && { code: data.code?.trim() || null }),
//       ...(data.description !== undefined && {
//         description: data.description?.trim() || null,
//       }),
//       ...(data.category !== undefined && {
//         category: data.category?.trim() || null,
//       }),
//       ...(data.isActive !== undefined && { isActive: data.isActive }),
//     };

//     if (data.headTeacherId === null) {
//       updateData.headTeacher = { disconnect: true };
//     } else if (data.headTeacherId) {
//       updateData.headTeacher = { connect: { id: data.headTeacherId } };
//     }

//     const updated = await db.subject.update({
//       where: { id },
//       data: updateData,
//     });

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${id}`);

//     return { ok: true, data: updated, message: "Subject updated successfully" };
//   } catch (error: any) {
//     console.error("❌ updateSubject:", error);
//     return { ok: false, message: "Failed to update subject" };
//   }
// }

// export async function deleteSubject(id: string) {
//   try {
//     const subject = await db.subject.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: {
//             classSubjects: true,
//             papers: true,
//             streamSubjects: true,
//           },
//         },
//       },
//     });

//     if (!subject) return { ok: false, message: "Subject not found" };

//     if (
//       subject._count.classSubjects > 0 ||
//       subject._count.streamSubjects > 0 ||
//       subject._count.papers > 0
//     ) {
//       return {
//         ok: false,
//         message: "Cannot delete subject with active dependencies",
//       };
//     }

//     await db.subject.delete({ where: { id } });
//     revalidatePath("/dashboard/subjects");

//     return { ok: true, message: "Subject deleted successfully" };
//   } catch (error: any) {
//     console.error("❌ deleteSubject:", error);
//     return { ok: false, message: "Failed to delete subject" };
//   }
// }

// /* ─────────────────────────────────────────────────────────────
//  SUBJECT PAPERS
// ───────────────────────────────────────────────────────────── */

// // ✅ ENHANCED: Auto-generate paper code if not provided
// export async function createSubjectPaper(data: CreateSubjectPaperPayload) {
//   try {
//     const { subjectId, paperNumber, name, paperCode, description, maxMarks, weight, aoiCount } = data;

//     // Get subject to build default paper code
//     const subject = await db.subject.findUnique({
//       where: { id: subjectId },
//       select: { code: true, name: true },
//     });

//     if (!subject) {
//       return { ok: false, message: "Subject not found" };
//     }

//     // Check if paper number already exists
//     const existingByNumber = await db.subjectPaper.findUnique({
//       where: {
//         subjectId_paperNumber: {
//           subjectId,
//           paperNumber,
//         },
//       },
//     });

//     if (existingByNumber) {
//       return { ok: false, message: `Paper ${paperNumber} already exists for this subject` };
//     }

//     // Auto-generate paper code if not provided and subject has a code
//     let finalPaperCode = paperCode?.trim() || null;
//     if (!finalPaperCode && subject.code) {
//       finalPaperCode = `${subject.code}/${paperNumber}`;
//     }

//     // Check if paper code already exists (if provided or generated)
//     if (finalPaperCode) {
//       const existingByCode = await db.subjectPaper.findFirst({
//         where: {
//           subjectId,
//           paperCode: finalPaperCode,
//         },
//       });

//       if (existingByCode) {
//         return {
//           ok: false,
//           message: `Paper code "${finalPaperCode}" already exists for this subject`,
//         };
//       }
//     }

//     const paper = await db.subjectPaper.create({
//       data: {
//         subjectId,
//         paperNumber,
//         name: name.trim(),
//         paperCode: finalPaperCode,
//         description: description?.trim() || null,
//         maxMarks: maxMarks ?? 100,
//         weight: weight ?? 1,
//         aoiCount: aoiCount ?? 0,
//       },
//     });

//     revalidatePath(`/dashboard/subjects/${subjectId}`);

//     return {
//       ok: true,
//       data: paper,
//       message: `${paper.name} created successfully${finalPaperCode ? ` with code ${finalPaperCode}` : ""}`,
//     };
//   } catch (error: any) {
//     console.error("❌ createSubjectPaper:", error);
//     return { ok: false, message: "Failed to create paper" };
//   }
// }

// // ✅ ENHANCED: Support updating paper code
// export async function updateSubjectPaper(id: string, data: UpdateSubjectPaperData) {
//   try {
//     const paper = await db.subjectPaper.findUnique({
//       where: { id },
//       select: { subjectId: true, paperCode: true },
//     });

//     if (!paper) {
//       return { ok: false, message: "Paper not found" };
//     }

//     // If updating paper code, check for duplicates
//     if (data.paperCode !== undefined && data.paperCode !== paper.paperCode) {
//       const finalCode = data.paperCode?.trim() || null;

//       if (finalCode) {
//         const existing = await db.subjectPaper.findFirst({
//           where: {
//             subjectId: paper.subjectId,
//             paperCode: finalCode,
//             NOT: { id },
//           },
//         });

//         if (existing) {
//           return {
//             ok: false,
//             message: `Paper code "${finalCode}" already exists for this subject`,
//           };
//         }
//       }
//     }

//     const updated = await db.subjectPaper.update({
//       where: { id },
//       data: {
//         ...(data.name !== undefined && { name: data.name.trim() }),
//         ...(data.paperCode !== undefined && { paperCode: data.paperCode?.trim() || null }),
//         ...(data.description !== undefined && {
//           description: data.description?.trim() || null,
//         }),
//         ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
//         ...(data.weight !== undefined && { weight: data.weight }),
//         ...(data.aoiCount !== undefined && { aoiCount: data.aoiCount }),
//         ...(data.isActive !== undefined && { isActive: data.isActive }),
//       },
//     });

//     revalidatePath(`/dashboard/subjects/${updated.subjectId}`);

//     return { ok: true, data: updated, message: "Paper updated successfully" };
//   } catch (error: any) {
//     console.error("❌ updateSubjectPaper:", error);
//     return { ok: false, message: "Failed to update paper" };
//   }
// }

// export async function deleteSubjectPaper(id: string) {
//   try {
//     const paper = await db.subjectPaper.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: {
//             aoiTopics: true,
//             aoiUnits: true,
//             examMarks: true,
//             paperResults: true,
//             streamSubjects: true, // ✅ Also check stream subjects
//           },
//         },
//       },
//     });

//     if (!paper) return { ok: false, message: "Paper not found" };

//     const deps =
//       paper._count.aoiTopics +
//       paper._count.aoiUnits +
//       paper._count.examMarks +
//       paper._count.paperResults +
//       paper._count.streamSubjects;

//     if (deps > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete paper. It has ${deps} dependent record(s)`,
//       };
//     }

//     await db.subjectPaper.delete({ where: { id } });
//     revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

//     return { ok: true, message: "Paper deleted successfully" };
//   } catch (error: any) {
//     console.error("❌ deleteSubjectPaper:", error);
//     return { ok: false, message: "Failed to delete paper" };
//   }
// }

// // ✅ NEW: Get paper by code
// export async function getSubjectPaperByCode(subjectId: string, paperCode: string) {
//   try {
//     const paper = await db.subjectPaper.findFirst({
//       where: {
//         subjectId,
//         paperCode,
//       },
//       include: {
//         subject: {
//           select: {
//             id: true,
//             name: true,
//             code: true,
//           },
//         },
//       },
//     });

//     return paper;
//   } catch (error) {
//     console.error("❌ getSubjectPaperByCode:", error);
//     return null;
//   }
// }

// /* ─────────────────────────────────────────────────────────────
//  CLASS SUBJECT ASSIGNMENTS
// ───────────────────────────────────────────────────────────── */

// export async function assignSubjectsToClassYear(data: {
//   classYearId: string;
//   subjectIds: string[];
// }) {
//   try {
//     const existing = await db.classSubject.findMany({
//       where: {
//         classYearId: data.classYearId,
//         subjectId: { in: data.subjectIds },
//       },
//       select: { subjectId: true },
//     });

//     const existingIds = new Set(existing.map((e) => e.subjectId));
//     const newIds = data.subjectIds.filter((id) => !existingIds.has(id));

//     if (!newIds.length) {
//       return { ok: false, message: "Subjects already assigned" };
//     }

//     const res = await db.classSubject.createMany({
//       data: newIds.map((subjectId) => ({
//         classYearId: data.classYearId,
//         subjectId,
//       })),
//     });

//     revalidatePath("/dashboard/classes");

//     return { ok: true, message: `${res.count} subjects assigned` };
//   } catch (error: any) {
//     console.error("❌ assignSubjects:", error);
//     return { ok: false, message: "Failed to assign subjects" };
//   }
// }

// export async function removeSubjectFromClassYear(id: string) {
//   try {
//     const cs = await db.classSubject.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: {
//             aoiTopics: true,
//             streamSubjects: true, // ✅ Also check stream subjects
//           },
//         },
//       },
//     });

//     if (!cs) return { ok: false, message: "Assignment not found" };

//     if (cs._count.aoiTopics > 0 || cs._count.streamSubjects > 0) {
//       return {
//         ok: false,
//         message: "Cannot remove subject with existing data or stream assignments",
//       };
//     }

//     await db.classSubject.delete({ where: { id } });
//     revalidatePath("/dashboard/classes");

//     return { ok: true, message: "Subject removed from class" };
//   } catch (error: any) {
//     console.error("❌ removeSubject:", error);
//     return { ok: false, message: "Failed to remove subject" };
//   }
// }

// /* ─────────────────────────────────────────────────────────────
//  QUERIES
// ───────────────────────────────────────────────────────────── */

// export async function getAllSubjects(schoolId: string) {
//   return db.subject.findMany({
//     where: { schoolId },
//     include: {
//       headTeacher: { select: { firstName: true, lastName: true, staffNo: true } },
//       papers: {
//         orderBy: { paperNumber: "asc" },
//         include: {
//           _count: {
//             select: {
//               streamSubjects: true,
//             },
//           },
//         },
//       },
//       _count: { select: { classSubjects: true, papers: true } },
//     },
//     orderBy: { name: "asc" },
//   });
// }

// export async function getSubjectById(id: string) {
//   return db.subject.findUnique({
//     where: { id },
//     include: {
//       headTeacher: true,
//       papers: {
//         include: {
//           _count: {
//             select: {
//               aoiTopics: true,
//               aoiUnits: true,
//               examMarks: true,
//               paperResults: true,
//               streamSubjects: true,
//             },
//           },
//         },
//         orderBy: { paperNumber: "asc" },
//       },
//       classSubjects: {
//         include: {
//           classYear: {
//             include: {
//               classTemplate: true,
//               academicYear: true,
//             },
//           },
//         },
//       },
//     },
//   });
// }

// export async function getAvailableTeachersForHead(
//   schoolId: string,
//   excludeSubjectId?: string
// ) {
//   return db.teacher.findMany({
//     where: {
//       schoolId,
//       currentStatus: "ACTIVE",
//       OR: [
//         { subjectHeadOf: { none: {} } },
//         ...(excludeSubjectId
//           ? [{ subjectHeadOf: { some: { id: excludeSubjectId } } }]
//           : []),
//       ],
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       staffNo: true,
//       email: true,
//     },
//     orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
//   });
// }

// export async function getSubjectStats(schoolId: string) {
//   const total = await db.subject.count({ where: { schoolId } });
//   const withHeadTeacher = await db.subject.count({
//     where: { schoolId, headTeacherId: { not: null } },
//   });
//   const withPapers = await db.subject.count({
//     where: { schoolId, papers: { some: {} } },
//   });
//   const assigned = await db.classSubject.groupBy({
//     by: ["subjectId"],
//     where: { classYear: { academicYear: { schoolId } } },
//   });

//   return {
//     total,
//     withHeadTeacher,
//     withPapers,
//     assignedToClasses: assigned.length,
//     notAssigned: total - assigned.length,
//   };
// }

// // ✅ NEW: Bulk create papers for a subject (useful for multi-paper subjects)
// export async function bulkCreateSubjectPapers(data: {
//   subjectId: string;
//   papers: Array<{
//     paperNumber: number;
//     name: string;
//     paperCode?: string;
//     description?: string;
//     maxMarks?: number;
//     weight?: number;
//     aoiCount?: number;
//   }>;
// }) {
//   try {
//     const { subjectId, papers } = data;

//     const subject = await db.subject.findUnique({
//       where: { id: subjectId },
//       select: { code: true, name: true },
//     });

//     if (!subject) {
//       return { ok: false, message: "Subject not found" };
//     }

//     // Prepare papers with auto-generated codes if needed
//     const papersToCreate = papers.map((paper) => ({
//       subjectId,
//       paperNumber: paper.paperNumber,
//       name: paper.name.trim(),
//       paperCode:
//         paper.paperCode?.trim() ||
//         (subject.code ? `${subject.code}/${paper.paperNumber}` : null),
//       description: paper.description?.trim() || null,
//       maxMarks: paper.maxMarks ?? 100,
//       weight: paper.weight ?? 1.0,
//       aoiCount: paper.aoiCount ?? 0,
//     }));

//     await db.subjectPaper.createMany({
//       data: papersToCreate,
//       skipDuplicates: true,
//     });

//     revalidatePath(`/dashboard/subjects/${subjectId}`);

//     return {
//       ok: true,
//       message: `Created ${papers.length} paper(s) successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ bulkCreateSubjectPapers:", error);
//     return { ok: false, message: "Failed to create papers" };
//   }
// }




"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

/* ─────────────────────────────────────────────────────────────
 TYPES
───────────────────────────────────────────────────────────── */

type CreateSubjectPayload = {
  name: string;
  code?: string | null;
  description?: string | null;
  category?: string | null;
  schoolId: string;
  headTeacherId?: string | null;
};
type UpdateSubjectData = Partial<{
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  isActive: boolean;
  headTeacherId: string | null;
}>;

type CreateSubjectPaperPayload = {
  subjectId: string;
  paperNumber: number;
  name: string;
  paperCode?: string | null;
  description?: string | null;
  maxMarks?: number;
  weight?: number;
  aoiCount?: number;
};

type UpdateSubjectPaperData = Partial<{
  name: string;
  paperCode: string | null;
  description: string | null;
  maxMarks: number;
  weight: number;
  aoiCount: number;
  isActive: boolean;
}>;

/* ─────────────────────────────────────────────────────────────
 SUBJECTS
───────────────────────────────────────────────────────────── */

export async function createSubject(data: CreateSubjectPayload) {
  try {
    const {
      name, code, description, category, schoolId, headTeacherId,
    } = data;

    if (!name?.trim()) {
      return { ok: false, message: "Subject name is required" };
    }

    // Duplicate check — schema has @@unique([schoolId, name]) and @@unique([schoolId, code])
    const existing = await db.subject.findFirst({
      where: {
        schoolId,
        OR: [
          { name: { equals: name.trim(), mode: Prisma.QueryMode.insensitive } },
          ...(code ? [{ code: { equals: code.trim(), mode: Prisma.QueryMode.insensitive } }] : []),
        ],
      },
    });

    if (existing) {
      return { ok: false, message: "Subject name or code already exists" };
    }

    const subject = await db.subject.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
        category: category?.trim() || null,
        schoolId,
        ...(headTeacherId && { headTeacherId }),
      },
      include: {
        headTeacher: {
          select: { id: true, firstName: true, lastName: true, staffNo: true },
        },
      },
    });

    revalidatePath("/dashboard/subjects");

    return { ok: true, data: subject, message: "Subject created successfully" };
  } catch (error: any) {
    console.error("❌ createSubject:", error);
    return { ok: false, message: "Failed to create subject" };
  }
}

export async function updateSubject(id: string, data: UpdateSubjectData) {
  try {
    const subject = await db.subject.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    if (!subject) return { ok: false, message: "Subject not found" };

    if (data.name || data.code) {
      const exists = await db.subject.findFirst({
        where: {
          schoolId: subject.schoolId,
          OR: [
            ...(data.name
              ? [{ name: { equals: data.name.trim(), mode: Prisma.QueryMode.insensitive } }]
              : []),
            ...(data.code
              ? [{ code: { equals: data.code.trim(), mode: Prisma.QueryMode.insensitive } }]
              : []),
          ],
          NOT: { id },
        },
      });

      if (exists) {
        return { ok: false, message: "Subject name or code already exists" };
      }
    }

    const updateData: Prisma.SubjectUpdateInput = {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.code !== undefined && { code: data.code?.trim() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.category !== undefined && { category: data.category?.trim() || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.headTeacherId === null) {
      updateData.headTeacher = { disconnect: true };
    } else if (data.headTeacherId) {
      updateData.headTeacher = { connect: { id: data.headTeacherId } };
    }

    const updated = await db.subject.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${id}`);

    return { ok: true, data: updated, message: "Subject updated successfully" };
  } catch (error: any) {
    console.error("❌ updateSubject:", error);
    return { ok: false, message: "Failed to update subject" };
  }
}

export async function deleteSubject(id: string) {
  try {
    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classSubjects: true,
            papers: true,
            streamSubjects: true,
          },
        },
      },
    });

    if (!subject) return { ok: false, message: "Subject not found" };

    if (
      subject._count.classSubjects > 0 ||
      subject._count.streamSubjects > 0 ||
      subject._count.papers > 0
    ) {
      return {
        ok: false,
        message: "Cannot delete subject with active dependencies",
      };
    }

    await db.subject.delete({ where: { id } });
    revalidatePath("/dashboard/subjects");

    return { ok: true, message: "Subject deleted successfully" };
  } catch (error: any) {
    console.error("❌ deleteSubject:", error);
    return { ok: false, message: "Failed to delete subject" };
  }
}

/* ─────────────────────────────────────────────────────────────
 SUBJECT PAPERS
───────────────────────────────────────────────────────────── */

export async function createSubjectPaper(data: CreateSubjectPaperPayload) {
  try {
    const { subjectId, paperNumber, name, paperCode, description, maxMarks, weight, aoiCount } = data;

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: { code: true, name: true },
    });

    if (!subject) {
      return { ok: false, message: "Subject not found" };
    }

    const existingByNumber = await db.subjectPaper.findUnique({
      where: { subjectId_paperNumber: { subjectId, paperNumber } },
    });

    if (existingByNumber) {
      return { ok: false, message: `Paper ${paperNumber} already exists for this subject` };
    }

    let finalPaperCode = paperCode?.trim() || null;
    if (!finalPaperCode && subject.code) {
      finalPaperCode = `${subject.code}/${paperNumber}`;
    }

    if (finalPaperCode) {
      const existingByCode = await db.subjectPaper.findFirst({
        where: { subjectId, paperCode: finalPaperCode },
      });

      if (existingByCode) {
        return {
          ok: false,
          message: `Paper code "${finalPaperCode}" already exists for this subject`,
        };
      }
    }

    const paper = await db.subjectPaper.create({
      data: {
        subjectId,
        paperNumber,
        name: name.trim(),
        paperCode: finalPaperCode,
        description: description?.trim() || null,
        maxMarks: maxMarks ?? 100,
        weight: weight ?? 1,
        aoiCount: aoiCount ?? 0,
      },
    });

    revalidatePath(`/dashboard/subjects/${subjectId}`);

    return {
      ok: true,
      data: paper,
      message: `${paper.name} created successfully${finalPaperCode ? ` with code ${finalPaperCode}` : ""}`,
    };
  } catch (error: any) {
    console.error("❌ createSubjectPaper:", error);
    return { ok: false, message: "Failed to create paper" };
  }
}

export async function updateSubjectPaper(id: string, data: UpdateSubjectPaperData) {
  try {
    const paper = await db.subjectPaper.findUnique({
      where: { id },
      select: { subjectId: true, paperCode: true },
    });

    if (!paper) {
      return { ok: false, message: "Paper not found" };
    }

    if (data.paperCode !== undefined && data.paperCode !== paper.paperCode) {
      const finalCode = data.paperCode?.trim() || null;

      if (finalCode) {
        const existing = await db.subjectPaper.findFirst({
          where: { subjectId: paper.subjectId, paperCode: finalCode, NOT: { id } },
        });

        if (existing) {
          return {
            ok: false,
            message: `Paper code "${finalCode}" already exists for this subject`,
          };
        }
      }
    }

    const updated = await db.subjectPaper.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.paperCode !== undefined && { paperCode: data.paperCode?.trim() || null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.aoiCount !== undefined && { aoiCount: data.aoiCount }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath(`/dashboard/subjects/${updated.subjectId}`);

    return { ok: true, data: updated, message: "Paper updated successfully" };
  } catch (error: any) {
    console.error("❌ updateSubjectPaper:", error);
    return { ok: false, message: "Failed to update paper" };
  }
}

export async function deleteSubjectPaper(id: string) {
  try {
    const paper = await db.subjectPaper.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            aoiTopics: true,
            aoiUnits: true,
            examMarks: true,
            paperResults: true,
            streamSubjects: true,
            // FIX [6]: Added classSubjectPapers — SubjectPaper has ClassSubjectPaper[]
            // back-relation. Must be zero before deletion or ClassSubjectPaper rows
            // referencing this paper would be orphaned (Cascade would delete them,
            // potentially removing class-level paper weight configs unexpectedly).
            classSubjectPapers: true,
          },
        },
      },
    });

    if (!paper) return { ok: false, message: "Paper not found" };

    const deps =
      paper._count.aoiTopics +
      paper._count.aoiUnits +
      paper._count.examMarks +
      paper._count.paperResults +
      paper._count.streamSubjects +
      paper._count.classSubjectPapers; // FIX [6]

    if (deps > 0) {
      return {
        ok: false,
        message: `Cannot delete paper. It has ${deps} dependent record(s)`,
      };
    }

    await db.subjectPaper.delete({ where: { id } });
    revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

    return { ok: true, message: "Paper deleted successfully" };
  } catch (error: any) {
    console.error("❌ deleteSubjectPaper:", error);
    return { ok: false, message: "Failed to delete paper" };
  }
}

export async function getSubjectPaperByCode(subjectId: string, paperCode: string) {
  try {
    const paper = await db.subjectPaper.findFirst({
      where: { subjectId, paperCode },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return paper;
  } catch (error) {
    console.error("❌ getSubjectPaperByCode:", error);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
 CLASS SUBJECT ASSIGNMENTS
───────────────────────────────────────────────────────────── */

export async function assignSubjectsToClassYear(data: {
  classYearId: string;
  subjectIds: string[];
}) {
  try {
    const existing = await db.classSubject.findMany({
      where: {
        classYearId: data.classYearId,
        subjectId: { in: data.subjectIds },
      },
      select: { subjectId: true },
    });

    const existingIds = new Set(existing.map((e) => e.subjectId));
    const newIds = data.subjectIds.filter((id) => !existingIds.has(id));

    if (!newIds.length) {
      return { ok: false, message: "Subjects already assigned" };
    }

    const res = await db.classSubject.createMany({
      data: newIds.map((subjectId) => ({
        classYearId: data.classYearId,
        subjectId,
      })),
    });

    revalidatePath("/dashboard/classes");

    return { ok: true, message: `${res.count} subjects assigned` };
  } catch (error: any) {
    console.error("❌ assignSubjects:", error);
    return { ok: false, message: "Failed to assign subjects" };
  }
}

export async function removeSubjectFromClassYear(id: string) {
  try {
    const cs = await db.classSubject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            aoiTopics: true,
            streamSubjects: true,
          },
        },
      },
    });

    if (!cs) return { ok: false, message: "Assignment not found" };

    if (cs._count.aoiTopics > 0 || cs._count.streamSubjects > 0) {
      return {
        ok: false,
        message: "Cannot remove subject with existing data or stream assignments",
      };
    }

    await db.classSubject.delete({ where: { id } });
    revalidatePath("/dashboard/classes");

    return { ok: true, message: "Subject removed from class" };
  } catch (error: any) {
    console.error("❌ removeSubject:", error);
    return { ok: false, message: "Failed to remove subject" };
  }
}

/* ─────────────────────────────────────────────────────────────
 QUERIES
───────────────────────────────────────────────────────────── */

export async function getAllSubjects(schoolId: string) {
  return db.subject.findMany({
    where: { schoolId },
    include: {
      headTeacher: { select: { firstName: true, lastName: true, staffNo: true } },
      papers: {
        orderBy: { paperNumber: "asc" },
        include: {
          _count: {
            select: { streamSubjects: true },
          },
        },
      },
      _count: { select: { classSubjects: true, papers: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSubjectById(id: string) {
  return db.subject.findUnique({
    where: { id },
    include: {
      headTeacher: true,
      papers: {
        include: {
          _count: {
            select: {
              aoiTopics: true,
              aoiUnits: true,
              examMarks: true,
              paperResults: true,
              streamSubjects: true,
              classSubjectPapers: true,
            },
          },
        },
        orderBy: { paperNumber: "asc" },
      },
      classSubjects: {
        include: {
          classYear: {
            include: {
              classTemplate: true,
              academicYear: true,
            },
          },
        },
      },
    },
  });
}

export async function getAvailableTeachersForHead(
  schoolId: string,
  excludeSubjectId?: string
) {
  return db.teacher.findMany({
    where: {
      schoolId,
      currentStatus: "ACTIVE",
      OR: [
        { subjectHeadOf: { none: {} } },
        ...(excludeSubjectId
          ? [{ subjectHeadOf: { some: { id: excludeSubjectId } } }]
          : []),
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffNo: true,
      email: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

export async function getSubjectStats(schoolId: string) {
  const total = await db.subject.count({ where: { schoolId } });
  const withHeadTeacher = await db.subject.count({
    where: { schoolId, headTeacherId: { not: null } },
  });
  const withPapers = await db.subject.count({
    where: { schoolId, papers: { some: {} } },
  });
  const assigned = await db.classSubject.groupBy({
    by: ["subjectId"],
    where: { classYear: { academicYear: { schoolId } } },
  });

  return {
    total,
    withHeadTeacher,
    withPapers,
    assignedToClasses: assigned.length,
    notAssigned: total - assigned.length,
  };
}

export async function bulkCreateSubjectPapers(data: {
  subjectId: string;
  papers: Array<{
    paperNumber: number;
    name: string;
    paperCode?: string;
    description?: string;
    maxMarks?: number;
    weight?: number;
    aoiCount?: number;
  }>;
}) {
  try {
    const { subjectId, papers } = data;

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: { code: true, name: true },
    });

    if (!subject) {
      return { ok: false, message: "Subject not found" };
    }

    const papersToCreate = papers.map((paper) => ({
      subjectId,
      paperNumber: paper.paperNumber,
      name: paper.name.trim(),
      paperCode:
        paper.paperCode?.trim() ||
        (subject.code ? `${subject.code}/${paper.paperNumber}` : null),
      description: paper.description?.trim() || null,
      maxMarks: paper.maxMarks ?? 100,
      weight: paper.weight ?? 1.0,
      aoiCount: paper.aoiCount ?? 0,
    }));

    await db.subjectPaper.createMany({
      data: papersToCreate,
      skipDuplicates: true,
    });

    revalidatePath(`/dashboard/subjects/${subjectId}`);

    return {
      ok: true,
      message: `Created ${papers.length} paper(s) successfully`,
    };
  } catch (error: any) {
    console.error("❌ bulkCreateSubjectPapers:", error);
    return { ok: false, message: "Failed to create papers" };
  }
}