



// // actions/subject-papers.ts
// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { Prisma } from "@prisma/client";

// // ═════════════════════════════════════════════════════════════════════════
// // TYPES
// // ═════════════════════════════════════════════════════════════════════════

// type CreateSubjectPaperPayload = {
//   subjectId: string;
//   paperNumber: number;
//   name: string;
//   paperCode?: string | null; // ✅ NEW
//   description?: string | null;
//   maxMarks?: number;
//   weight?: number;
//   aoiCount?: number;
// };

// type UpdateSubjectPaperData = Partial<{
//   name: string;
//   paperCode: string | null; // ✅ NEW
//   description: string | null;
//   maxMarks: number;
//   weight: number;
//   aoiCount: number;
//   isActive: boolean;
// }>;

// // ═════════════════════════════════════════════════════════════════════════
// // CREATE SUBJECT PAPER
// // ═════════════════════════════════════════════════════════════════════════

// export async function createSubjectPaper(data: CreateSubjectPaperPayload) {
//   try {
//     const {
//       subjectId,
//       paperNumber,
//       name,
//       paperCode, // ✅ NEW
//       description,
//       maxMarks = 100,
//       weight = 1.0,
//       aoiCount = 0,
//     } = data;

//     // Validate required fields
//     if (!name?.trim()) {
//       return { ok: false, message: "Paper name is required" };
//     }

//     if (!subjectId) {
//       return { ok: false, message: "Subject ID is required" };
//     }

//     if (!paperNumber || paperNumber < 1) {
//       return { ok: false, message: "Valid paper number is required" };
//     }

//     // ✅ Get subject to auto-generate paper code if needed
//     const subject = await db.subject.findUnique({
//       where: { id: subjectId },
//       select: { code: true, name: true },
//     });

//     if (!subject) {
//       return { ok: false, message: "Subject not found" };
//     }

//     // Check if paper number already exists
//     const existsByNumber = await db.subjectPaper.findUnique({
//       where: {
//         subjectId_paperNumber: {
//           subjectId,
//           paperNumber,
//         },
//       },
//     });

//     if (existsByNumber) {
//       return {
//         ok: false,
//         message: `Paper ${paperNumber} already exists for this subject`,
//       };
//     }

//     // ✅ Auto-generate paper code if not provided and subject has a code
//     let finalPaperCode = paperCode?.trim() || null;
//     if (!finalPaperCode && subject.code) {
//       finalPaperCode = `${subject.code}/${paperNumber}`;
//     }

//     // ✅ Check if paper code already exists (if provided or generated)
//     if (finalPaperCode) {
//       const existsByCode = await db.subjectPaper.findFirst({
//         where: {
//           subjectId,
//           paperCode: finalPaperCode,
//         },
//       });

//       if (existsByCode) {
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
//         paperCode: finalPaperCode, // ✅ NEW
//         description: description?.trim() || null,
//         maxMarks,
//         weight,
//         aoiCount,
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

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${subjectId}`);

//     return {
//       ok: true,
//       data: paper,
//       message: `${paper.name} created successfully${
//         finalPaperCode ? ` (${finalPaperCode})` : ""
//       }`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error creating subject paper:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to create subject paper",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // UPDATE SUBJECT PAPER
// // ═════════════════════════════════════════════════════════════════════════

// export async function updateSubjectPaper(
//   id: string,
//   data: UpdateSubjectPaperData
// ) {
//   try {
//     if (!id) {
//       return { ok: false, message: "Paper ID is required" };
//     }

//     // ✅ Get current paper to check for paper code changes
//     const currentPaper = await db.subjectPaper.findUnique({
//       where: { id },
//       select: { subjectId: true, paperCode: true },
//     });

//     if (!currentPaper) {
//       return { ok: false, message: "Paper not found" };
//     }

//     // ✅ If updating paper code, check for duplicates
//     if (
//       data.paperCode !== undefined &&
//       data.paperCode !== currentPaper.paperCode
//     ) {
//       const finalCode = data.paperCode?.trim() || null;

//       if (finalCode) {
//         const existingCode = await db.subjectPaper.findFirst({
//           where: {
//             subjectId: currentPaper.subjectId,
//             paperCode: finalCode,
//             NOT: { id },
//           },
//         });

//         if (existingCode) {
//           return {
//             ok: false,
//             message: `Paper code "${finalCode}" already exists for this subject`,
//           };
//         }
//       }
//     }

//     const paper = await db.subjectPaper.update({
//       where: { id },
//       data: {
//         ...(data.name !== undefined && { name: data.name.trim() }),
//         ...(data.paperCode !== undefined && {
//           paperCode: data.paperCode?.trim() || null,
//         }), // ✅ NEW
//         ...(data.description !== undefined && {
//           description: data.description?.trim() || null,
//         }),
//         ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
//         ...(data.weight !== undefined && { weight: data.weight }),
//         ...(data.aoiCount !== undefined && { aoiCount: data.aoiCount }),
//         ...(data.isActive !== undefined && { isActive: data.isActive }),
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

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

//     return {
//       ok: true,
//       data: paper,
//       message: "Paper updated successfully",
//     };
//   } catch (error: any) {
//     console.error("❌ Error updating subject paper:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to update subject paper",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // DELETE SUBJECT PAPER
// // ═════════════════════════════════════════════════════════════════════════

// export async function deleteSubjectPaper(id: string) {
//   try {
//     if (!id) {
//       return { ok: false, message: "Paper ID is required" };
//     }

//     const paper = await db.subjectPaper.findUnique({
//       where: { id },
//       include: {
//         subject: { select: { id: true, name: true } },
//         _count: {
//           select: {
//             aoiTopics: true,
//             aoiUnits: true,
//             examMarks: true,
//             paperResults: true,
//             streamSubjects: true, // ✅ NEW: Also check stream subjects
//           },
//         },
//       },
//     });

//     if (!paper) {
//       return { ok: false, message: "Paper not found" };
//     }

//     const totalDependencies =
//       paper._count.aoiTopics +
//       paper._count.aoiUnits +
//       paper._count.examMarks +
//       paper._count.paperResults +
//       paper._count.streamSubjects; // ✅ NEW

//     if (totalDependencies > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete. Paper has ${totalDependencies} associated record(s)`,
//       };
//     }

//     await db.subjectPaper.delete({ where: { id } });

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

//     return {
//       ok: true,
//       message: `${paper.name} deleted successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error deleting subject paper:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to delete subject paper",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // TOGGLE PAPER STATUS
// // ═════════════════════════════════════════════════════════════════════════

// export async function togglePaperStatus(id: string) {
//   try {
//     if (!id) {
//       return { ok: false, message: "Paper ID is required" };
//     }

//     const paper = await db.subjectPaper.findUnique({
//       where: { id },
//       select: { isActive: true, name: true, subjectId: true },
//     });

//     if (!paper) {
//       return { ok: false, message: "Paper not found" };
//     }

//     const updated = await db.subjectPaper.update({
//       where: { id },
//       data: { isActive: !paper.isActive },
//     });

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

//     return {
//       ok: true,
//       message: `${paper.name} ${
//         updated.isActive ? "activated" : "deactivated"
//       } successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error toggling paper status:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to toggle paper status",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // GET SUBJECT PAPERS
// // ═════════════════════════════════════════════════════════════════════════

// export async function getSubjectPapers(subjectId: string) {
//   try {
//     if (!subjectId) {
//       return [];
//     }

//     return await db.subjectPaper.findMany({
//       where: { subjectId },
//       include: {
//         _count: {
//           select: {
//             aoiTopics: true,
//             aoiUnits: true,
//             examMarks: true,
//             paperResults: true,
//             streamSubjects: true, // ✅ NEW
//           },
//         },
//       },
//       orderBy: { paperNumber: "asc" },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching subject papers:", error);
//     return [];
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // GET SINGLE SUBJECT PAPER BY ID
// // ═════════════════════════════════════════════════════════════════════════

// export async function getSubjectPaperById(id: string) {
//   try {
//     if (!id) {
//       return null;
//     }

//     return await db.subjectPaper.findUnique({
//       where: { id },
//       include: {
//         subject: {
//           select: {
//             id: true,
//             name: true,
//             code: true,
//           },
//         },
//         aoiTopics: {
//           orderBy: { topicNumber: "asc" },
//         },
//         _count: {
//           select: {
//             aoiTopics: true,
//             aoiUnits: true,
//             examMarks: true,
//             paperResults: true,
//             streamSubjects: true, // ✅ NEW
//           },
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching subject paper:", error);
//     return null;
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // ✅ NEW: GET SUBJECT PAPER BY CODE
// // ═════════════════════════════════════════════════════════════════════════

// export async function getSubjectPaperByCode(
//   subjectId: string,
//   paperCode: string
// ) {
//   try {
//     if (!subjectId || !paperCode) {
//       return null;
//     }

//     return await db.subjectPaper.findFirst({
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
//         aoiTopics: {
//           orderBy: { topicNumber: "asc" },
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching subject paper by code:", error);
//     return null;
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // GET SUBJECT WITH PAPERS (for refreshing modal data)
// // ═════════════════════════════════════════════════════════════════════════

// export async function getSubjectWithPapers(
//   subjectId: string,
//   academicYearId?: string
// ) {
//   try {
//     if (!subjectId) {
//       return null;
//     }

//     const subject = await db.subject.findUnique({
//       where: { id: subjectId },
//       include: {
//         headTeacher: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             staffNo: true,
//           },
//         },
//         papers: {
//           include: {
//             _count: {
//               select: {
//                 aoiTopics: true,
//                 aoiUnits: true,
//                 examMarks: true,
//                 paperResults: true,
//                 streamSubjects: true, // ✅ NEW
//               },
//             },
//           },
//           orderBy: { paperNumber: "asc" },
//         },
//         classSubjects: {
//           include: {
//             classYear: {
//               include: {
//                 classTemplate: {
//                   select: {
//                     name: true,
//                     code: true,
//                     level: true,
//                   },
//                 },
//                 academicYear: {
//                   select: {
//                     id: true,
//                     year: true,
//                     isActive: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//         _count: {
//           select: {
//             classSubjects: true,
//             streamSubjects: true,
//           },
//         },
//       },
//     });

//     return subject;
//   } catch (error) {
//     console.error("❌ Error fetching subject with papers:", error);
//     return null;
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // REORDER PAPERS
// // ═════════════════════════════════════════════════════════════════════════

// export async function reorderSubjectPapers(
//   subjectId: string,
//   paperIds: string[]
// ) {
//   try {
//     if (!subjectId || !paperIds || paperIds.length === 0) {
//       return { ok: false, message: "Invalid data provided" };
//     }

//     // Update paper numbers based on new order
//     const updates = paperIds.map((paperId, index) =>
//       db.subjectPaper.update({
//         where: { id: paperId },
//         data: { paperNumber: index + 1 },
//       })
//     );

//     await db.$transaction(updates);

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${subjectId}`);

//     return {
//       ok: true,
//       message: "Papers reordered successfully",
//     };
//   } catch (error: any) {
//     console.error("❌ Error reordering papers:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to reorder papers",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // BULK CREATE PAPERS
// // ═════════════════════════════════════════════════════════════════════════

// export async function bulkCreateSubjectPapers(
//   subjectId: string,
//   papers: Array<{
//     paperNumber: number;
//     name: string;
//     paperCode?: string | null; // ✅ NEW
//     description?: string | null;
//     maxMarks?: number;
//     weight?: number;
//     aoiCount?: number;
//   }>
// ) {
//   try {
//     if (!subjectId) {
//       return { ok: false, message: "Subject ID is required" };
//     }

//     if (!papers || papers.length === 0) {
//       return { ok: false, message: "At least one paper is required" };
//     }

//     // ✅ Get subject for auto-generating codes
//     const subject = await db.subject.findUnique({
//       where: { id: subjectId },
//       select: { code: true, name: true },
//     });

//     if (!subject) {
//       return { ok: false, message: "Subject not found" };
//     }

//     // Validate each paper
//     for (const paper of papers) {
//       if (!paper.name?.trim()) {
//         return { ok: false, message: "All papers must have a name" };
//       }
//       if (!paper.paperNumber || paper.paperNumber < 1) {
//         return {
//           ok: false,
//           message: `Invalid paper number for ${paper.name}`,
//         };
//       }
//     }

//     // Check for existing papers by number
//     const existingPapers = await db.subjectPaper.findMany({
//       where: {
//         subjectId,
//         paperNumber: { in: papers.map((p) => p.paperNumber) },
//       },
//       select: { paperNumber: true },
//     });

//     if (existingPapers.length > 0) {
//       const existingNumbers = existingPapers
//         .map((p) => p.paperNumber)
//         .join(", ");
//       return {
//         ok: false,
//         message: `The following paper numbers already exist: ${existingNumbers}`,
//       };
//     }

//     // ✅ Prepare papers with auto-generated codes if needed
//     const papersToCreate = papers.map((paper) => {
//       let finalPaperCode = paper.paperCode?.trim() || null;
//       if (!finalPaperCode && subject.code) {
//         finalPaperCode = `${subject.code}/${paper.paperNumber}`;
//       }

//       return {
//         subjectId,
//         paperNumber: paper.paperNumber,
//         name: paper.name.trim(),
//         paperCode: finalPaperCode, // ✅ NEW
//         description: paper.description?.trim() || null,
//         maxMarks: paper.maxMarks || 100,
//         weight: paper.weight || 1.0,
//         aoiCount: paper.aoiCount || 0,
//       };
//     });

//     // Create all papers
//     const createdPapers = await db.subjectPaper.createMany({
//       data: papersToCreate,
//       skipDuplicates: true,
//     });

//     revalidatePath("/dashboard/subjects");
//     revalidatePath(`/dashboard/subjects/${subjectId}`);

//     return {
//       ok: true,
//       data: createdPapers,
//       message: `${createdPapers.count} paper(s) created successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error bulk creating subject papers:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to create subject papers",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // GET PAPERS WITH STATS
// // ═════════════════════════════════════════════════════════════════════════

// export async function getSubjectPapersWithStats(subjectId: string) {
//   try {
//     if (!subjectId) {
//       return [];
//     }

//     const papers = await db.subjectPaper.findMany({
//       where: { subjectId },
//       include: {
//         _count: {
//           select: {
//             aoiTopics: true,
//             aoiUnits: true,
//             examMarks: true,
//             paperResults: true,
//             streamSubjects: true, // ✅ NEW
//           },
//         },
//       },
//       orderBy: { paperNumber: "asc" },
//     });

//     return papers.map((paper) => ({
//       ...paper,
//       stats: {
//         totalTopics: paper._count.aoiTopics,
//         totalUnits: paper._count.aoiUnits,
//         totalExamMarks: paper._count.examMarks,
//         totalResults: paper._count.paperResults,
//         totalStreamSubjects: paper._count.streamSubjects, // ✅ NEW
//         hasData:
//           paper._count.aoiTopics > 0 ||
//           paper._count.aoiUnits > 0 ||
//           paper._count.examMarks > 0 ||
//           paper._count.paperResults > 0 ||
//           paper._count.streamSubjects > 0, // ✅ NEW
//       },
//     }));
//   } catch (error) {
//     console.error("❌ Error fetching subject papers with stats:", error);
//     return [];
//   }
// }



// actions/subject-papers.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
// FIX [6]: Removed unused `import { Prisma }` — no QueryMode or typed inputs used here.

// ═════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════════════════════════════
// CREATE SUBJECT PAPER
// ═════════════════════════════════════════════════════════════════════════

export async function createSubjectPaper(data: CreateSubjectPaperPayload) {
  try {
    const {
      subjectId, paperNumber, name, paperCode,
      description, maxMarks = 100, weight = 1.0, aoiCount = 0,
    } = data;

    if (!name?.trim())           return { ok: false, message: "Paper name is required" };
    if (!subjectId)              return { ok: false, message: "Subject ID is required" };
    if (!paperNumber || paperNumber < 1) return { ok: false, message: "Valid paper number is required" };

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: { code: true, name: true },
    });
    if (!subject) return { ok: false, message: "Subject not found" };

    const existsByNumber = await db.subjectPaper.findUnique({
      where: { subjectId_paperNumber: { subjectId, paperNumber } },
    });
    if (existsByNumber) {
      return { ok: false, message: `Paper ${paperNumber} already exists for this subject` };
    }

    let finalPaperCode = paperCode?.trim() || null;
    if (!finalPaperCode && subject.code) {
      finalPaperCode = `${subject.code}/${paperNumber}`;
    }

    if (finalPaperCode) {
      const existsByCode = await db.subjectPaper.findFirst({
        where: { subjectId, paperCode: finalPaperCode },
      });
      if (existsByCode) {
        return { ok: false, message: `Paper code "${finalPaperCode}" already exists for this subject` };
      }
    }

    const paper = await db.subjectPaper.create({
      data: {
        subjectId, paperNumber,
        name: name.trim(),
        paperCode: finalPaperCode,
        description: description?.trim() || null,
        maxMarks, weight, aoiCount,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${subjectId}`);

    return {
      ok: true,
      data: paper,
      message: `${paper.name} created successfully${finalPaperCode ? ` (${finalPaperCode})` : ""}`,
    };
  } catch (error: any) {
    console.error("❌ Error creating subject paper:", error);
    return { ok: false, message: error?.message ?? "Failed to create subject paper" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// UPDATE SUBJECT PAPER
// ═════════════════════════════════════════════════════════════════════════

export async function updateSubjectPaper(id: string, data: UpdateSubjectPaperData) {
  try {
    if (!id) return { ok: false, message: "Paper ID is required" };

    const currentPaper = await db.subjectPaper.findUnique({
      where: { id },
      select: { subjectId: true, paperCode: true },
    });
    if (!currentPaper) return { ok: false, message: "Paper not found" };

    if (data.paperCode !== undefined && data.paperCode !== currentPaper.paperCode) {
      const finalCode = data.paperCode?.trim() || null;
      if (finalCode) {
        const existingCode = await db.subjectPaper.findFirst({
          where: { subjectId: currentPaper.subjectId, paperCode: finalCode, NOT: { id } },
        });
        if (existingCode) {
          return { ok: false, message: `Paper code "${finalCode}" already exists for this subject` };
        }
      }
    }

    const paper = await db.subjectPaper.update({
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
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

    return { ok: true, data: paper, message: "Paper updated successfully" };
  } catch (error: any) {
    console.error("❌ Error updating subject paper:", error);
    return { ok: false, message: error?.message ?? "Failed to update subject paper" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// DELETE SUBJECT PAPER
// ═════════════════════════════════════════════════════════════════════════

export async function deleteSubjectPaper(id: string) {
  try {
    if (!id) return { ok: false, message: "Paper ID is required" };

    const paper = await db.subjectPaper.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true } },
        _count: {
          select: {
            aoiTopics: true,
            aoiUnits: true,
            examMarks: true,
            paperResults: true,
            streamSubjects: true,
            // FIX [1]: Added classSubjectPapers.
            // SubjectPaper.classSubjectPapers ClassSubjectPaper[] stores per-class
            // paper weight configurations. Deleting without checking this would
            // cascade-destroy those configs silently.
            classSubjectPapers: true,
          },
        },
      },
    });

    if (!paper) return { ok: false, message: "Paper not found" };

    const totalDependencies =
      paper._count.aoiTopics +
      paper._count.aoiUnits +
      paper._count.examMarks +
      paper._count.paperResults +
      paper._count.streamSubjects +
      paper._count.classSubjectPapers; // FIX [1]

    if (totalDependencies > 0) {
      return {
        ok: false,
        message: `Cannot delete. Paper has ${totalDependencies} associated record(s)`,
      };
    }

    await db.subjectPaper.delete({ where: { id } });

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

    return { ok: true, message: `${paper.name} deleted successfully` };
  } catch (error: any) {
    console.error("❌ Error deleting subject paper:", error);
    return { ok: false, message: error?.message ?? "Failed to delete subject paper" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// TOGGLE PAPER STATUS
// ═════════════════════════════════════════════════════════════════════════

export async function togglePaperStatus(id: string) {
  try {
    if (!id) return { ok: false, message: "Paper ID is required" };

    const paper = await db.subjectPaper.findUnique({
      where: { id },
      select: { isActive: true, name: true, subjectId: true },
    });
    if (!paper) return { ok: false, message: "Paper not found" };

    const updated = await db.subjectPaper.update({
      where: { id },
      data: { isActive: !paper.isActive },
    });

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${paper.subjectId}`);

    return {
      ok: true,
      message: `${paper.name} ${updated.isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error: any) {
    console.error("❌ Error toggling paper status:", error);
    return { ok: false, message: error?.message ?? "Failed to toggle paper status" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET SUBJECT PAPERS
// ═════════════════════════════════════════════════════════════════════════

export async function getSubjectPapers(subjectId: string) {
  try {
    if (!subjectId) return [];

    return await db.subjectPaper.findMany({
      where: { subjectId },
      include: {
        _count: {
          select: {
            aoiTopics: true,
            aoiUnits: true,
            examMarks: true,
            paperResults: true,
            streamSubjects: true,
            classSubjectPapers: true, // FIX [3]
          },
        },
      },
      orderBy: { paperNumber: "asc" },
    });
  } catch (error) {
    console.error("❌ Error fetching subject papers:", error);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET SINGLE SUBJECT PAPER BY ID
// ═════════════════════════════════════════════════════════════════════════

export async function getSubjectPaperById(id: string) {
  try {
    if (!id) return null;

    return await db.subjectPaper.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        aoiTopics: { orderBy: { topicNumber: "asc" } },
        _count: {
          select: {
            aoiTopics: true,
            aoiUnits: true,
            examMarks: true,
            paperResults: true,
            streamSubjects: true,
            classSubjectPapers: true, // FIX [2]
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching subject paper:", error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET SUBJECT PAPER BY CODE
// ═════════════════════════════════════════════════════════════════════════

export async function getSubjectPaperByCode(subjectId: string, paperCode: string) {
  try {
    if (!subjectId || !paperCode) return null;

    return await db.subjectPaper.findFirst({
      where: { subjectId, paperCode },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        aoiTopics: { orderBy: { topicNumber: "asc" } },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching subject paper by code:", error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET SUBJECT WITH PAPERS
// ═════════════════════════════════════════════════════════════════════════

export async function getSubjectWithPapers(subjectId: string, academicYearId?: string) {
  try {
    if (!subjectId) return null;

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        headTeacher: {
          select: { id: true, firstName: true, lastName: true, staffNo: true },
        },
        papers: {
          include: {
            _count: {
              select: {
                aoiTopics: true,
                aoiUnits: true,
                examMarks: true,
                paperResults: true,
                streamSubjects: true,
                classSubjectPapers: true, // FIX [4]
              },
            },
          },
          orderBy: { paperNumber: "asc" },
        },
        classSubjects: {
          include: {
            classYear: {
              include: {
                classTemplate: { select: { name: true, code: true, level: true } },
                academicYear: { select: { id: true, year: true, isActive: true } },
              },
            },
          },
        },
        _count: {
          select: {
            classSubjects: true,
            streamSubjects: true,
          },
        },
      },
    });

    return subject;
  } catch (error) {
    console.error("❌ Error fetching subject with papers:", error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// REORDER PAPERS
// ═════════════════════════════════════════════════════════════════════════

export async function reorderSubjectPapers(subjectId: string, paperIds: string[]) {
  try {
    if (!subjectId || !paperIds || paperIds.length === 0) {
      return { ok: false, message: "Invalid data provided" };
    }

    const updates = paperIds.map((paperId, index) =>
      db.subjectPaper.update({
        where: { id: paperId },
        data: { paperNumber: index + 1 },
      })
    );

    await db.$transaction(updates);

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${subjectId}`);

    return { ok: true, message: "Papers reordered successfully" };
  } catch (error: any) {
    console.error("❌ Error reordering papers:", error);
    return { ok: false, message: error?.message ?? "Failed to reorder papers" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// BULK CREATE PAPERS
// ═════════════════════════════════════════════════════════════════════════

export async function bulkCreateSubjectPapers(
  subjectId: string,
  papers: Array<{
    paperNumber: number;
    name: string;
    paperCode?: string | null;
    description?: string | null;
    maxMarks?: number;
    weight?: number;
    aoiCount?: number;
  }>
) {
  try {
    if (!subjectId) return { ok: false, message: "Subject ID is required" };
    if (!papers || papers.length === 0) return { ok: false, message: "At least one paper is required" };

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: { code: true, name: true },
    });
    if (!subject) return { ok: false, message: "Subject not found" };

    for (const paper of papers) {
      if (!paper.name?.trim()) return { ok: false, message: "All papers must have a name" };
      if (!paper.paperNumber || paper.paperNumber < 1) {
        return { ok: false, message: `Invalid paper number for ${paper.name}` };
      }
    }

    const existingPapers = await db.subjectPaper.findMany({
      where: { subjectId, paperNumber: { in: papers.map((p) => p.paperNumber) } },
      select: { paperNumber: true },
    });

    if (existingPapers.length > 0) {
      const existingNumbers = existingPapers.map((p) => p.paperNumber).join(", ");
      return { ok: false, message: `The following paper numbers already exist: ${existingNumbers}` };
    }

    const papersToCreate = papers.map((paper) => {
      let finalPaperCode = paper.paperCode?.trim() || null;
      if (!finalPaperCode && subject.code) {
        finalPaperCode = `${subject.code}/${paper.paperNumber}`;
      }
      return {
        subjectId,
        paperNumber: paper.paperNumber,
        name: paper.name.trim(),
        paperCode: finalPaperCode,
        description: paper.description?.trim() || null,
        maxMarks: paper.maxMarks || 100,
        weight: paper.weight || 1.0,
        aoiCount: paper.aoiCount || 0,
      };
    });

    const createdPapers = await db.subjectPaper.createMany({
      data: papersToCreate,
      skipDuplicates: true,
    });

    revalidatePath("/dashboard/subjects");
    revalidatePath(`/dashboard/subjects/${subjectId}`);

    return {
      ok: true,
      data: createdPapers,
      message: `${createdPapers.count} paper(s) created successfully`,
    };
  } catch (error: any) {
    console.error("❌ Error bulk creating subject papers:", error);
    return { ok: false, message: error?.message ?? "Failed to create subject papers" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET PAPERS WITH STATS
// ═════════════════════════════════════════════════════════════════════════

export async function getSubjectPapersWithStats(subjectId: string) {
  try {
    if (!subjectId) return [];

    const papers = await db.subjectPaper.findMany({
      where: { subjectId },
      include: {
        _count: {
          select: {
            aoiTopics: true,
            aoiUnits: true,
            examMarks: true,
            paperResults: true,
            streamSubjects: true,
            classSubjectPapers: true, // FIX [5]
          },
        },
      },
      orderBy: { paperNumber: "asc" },
    });

    return papers.map((paper) => ({
      ...paper,
      stats: {
        totalTopics:         paper._count.aoiTopics,
        totalUnits:          paper._count.aoiUnits,
        totalExamMarks:      paper._count.examMarks,
        totalResults:        paper._count.paperResults,
        totalStreamSubjects: paper._count.streamSubjects,
        totalClassPapers:    paper._count.classSubjectPapers, // FIX [5]
        hasData:
          paper._count.aoiTopics > 0 ||
          paper._count.aoiUnits > 0 ||
          paper._count.examMarks > 0 ||
          paper._count.paperResults > 0 ||
          paper._count.streamSubjects > 0 ||
          paper._count.classSubjectPapers > 0, // FIX [5]
      },
    }));
  } catch (error) {
    console.error("❌ Error fetching subject papers with stats:", error);
    return [];
  }
}