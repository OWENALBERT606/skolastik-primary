


// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { AcademicYear, AcademicTerm } from "@prisma/client";

// // ════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ════════════════════════════════════════════════════════════════════════════

// type ActionResult<T> =
//   | { ok: true; data: T }
//   | { ok: false; error: string };

// type AcademicYearWithRelations = AcademicYear & {
//   school?: { id: string; name: string; slug: string };
//   terms?: AcademicTerm[];
// };

// type AcademicYearWithStats = AcademicYearWithRelations & {
//   stats: {
//     totalTerms: number;
//     totalEnrollments: number;
//     totalStudentFeeAccounts: number;
//     totalPublishedFeeStructures: number;
//     hasData: boolean;
//     hasFeeData: boolean;
//   };
// };

// type AcademicYearFeesSummary = AcademicYearWithRelations & {
//   feesSummary: {
//     totalInvoiced: number;
//     totalCollected: number;
//     totalOutstanding: number;
//     totalDiscount: number;
//     totalWaived: number;
//     totalPenalty: number;
//     collectionRate: number; // percentage
//     studentsWithArrears: number;
//     studentsCleared: number;
//     studentsOverpaid: number;
//     publishedFeeStructures: number;
//     termBreakdown: {
//       termId: string;
//       termName: string;
//       termNumber: number;
//       totalInvoiced: number;
//       totalCollected: number;
//       totalOutstanding: number;
//       publishedStructures: number;
//     }[];
//   };
// };

// interface CreateAcademicYearInput {
//   schoolId: string;
//   year: string;
//   isActive?: boolean;
//   startDate?: Date;
//   endDate?: Date;
// }

// interface UpdateAcademicYearInput {
//   year?: string;
//   isActive?: boolean;
//   startDate?: Date;
//   endDate?: Date;
// }

// // ════════════════════════════════════════════════════════════════════════════
// // VALIDATION
// // ════════════════════════════════════════════════════════════════════════════

// function validateAcademicYearInput(input: CreateAcademicYearInput): string | null {
//   if (!input.year || input.year.trim().length === 0) {
//     return "Academic year is required";
//   }
//   if (!input.schoolId || input.schoolId.trim().length === 0) {
//     return "School ID is required";
//   }
//   if (input.startDate && input.endDate && input.startDate > input.endDate) {
//     return "Start date must be before end date";
//   }
//   const yearPattern = /^\d{4}(\/\d{4})?$/;
//   if (!yearPattern.test(input.year.trim())) {
//     return "Invalid year format. Use '2024' or '2024/2025'";
//   }
//   return null;
// }

// // ════════════════════════════════════════════════════════════════════════════
// // CREATE
// // ════════════════════════════════════════════════════════════════════════════

// export async function createAcademicYear(
//   input: CreateAcademicYearInput
// ): Promise<ActionResult<AcademicYear>> {
//   try {
//     const validationError = validateAcademicYearInput(input);
//     if (validationError) return { ok: false, error: validationError };

//     const existingYear = await db.academicYear.findFirst({
//       where: { schoolId: input.schoolId, year: input.year.trim() },
//     });

//     if (existingYear) {
//       return {
//         ok: false,
//         error: `Academic year '${input.year}' already exists for this school`,
//       };
//     }

//     const newYear = await db.$transaction(async (tx) => {
//       if (input.isActive) {
//         await tx.academicYear.updateMany({
//           where: { schoolId: input.schoolId },
//           data: { isActive: false },
//         });
//       }
//       return tx.academicYear.create({
//         data: {
//           year: input.year.trim(),
//           isActive: input.isActive ?? true,
//           schoolId: input.schoolId,
//           startDate: input.startDate,
//           endDate: input.endDate,
//         },
//       });
//     });

//     revalidatePath("/dashboard/academic-years");
//     return { ok: true, data: newYear };
//   } catch (error) {
//     console.error("Error creating academic year:", error);
//     return { ok: false, error: "Failed to create academic year. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — ALL
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicYearsBySchool(
//   schoolId: string
// ): Promise<ActionResult<AcademicYearWithRelations[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const academicYears = await db.academicYear.findMany({
//       where: { schoolId },
//       orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
//       include: {
//         school: { select: { id: true, name: true, slug: true } },
//         terms: { orderBy: { termNumber: "asc" } },
//       },
//     });

//     return { ok: true, data: academicYears };
//   } catch (error) {
//     console.error("Error fetching academic years:", error);
//     return { ok: false, error: "Failed to fetch academic years" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — SINGLE WITH FULL RELATIONS (including fees)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicYearById(
//   id: string
// ): Promise<ActionResult<AcademicYearWithRelations>> {
//   try {
//     if (!id) return { ok: false, error: "Academic year ID is required" };

//     const academicYear = await db.academicYear.findUnique({
//       where: { id },
//       include: {
//         school: { select: { id: true, name: true, slug: true } },
//         terms: { orderBy: { termNumber: "asc" } },
//         enrollments: { select: { id: true } },
//         gradingConfigs: true,
//         // Fees relations
//         feeStructures: {
//           select: {
//             id: true,
//             name: true,
//             isPublished: true,
//             totalAmount: true,
//             classYearId: true,
//             termId: true,
//           },
//         },
//         autoInvoiceConfigs: {
//           select: {
//             id: true,
//             termId: true,
//             isEnabled: true,
//             generateOnEnrollment: true,
//           },
//         },
//       },
//     });

//     if (!academicYear) return { ok: false, error: "Academic year not found" };

//     return { ok: true, data: academicYear };
//   } catch (error) {
//     console.error("Error fetching academic year:", error);
//     return { ok: false, error: "Failed to fetch academic year" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — WITH FULL FEES SUMMARY (finance dashboard)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicYearWithFeesSummary(
//   id: string
// ): Promise<ActionResult<AcademicYearFeesSummary>> {
//   try {
//     if (!id) return { ok: false, error: "Academic year ID is required" };

//     const academicYear = await db.academicYear.findUnique({
//       where: { id },
//       include: {
//         school: { select: { id: true, name: true, slug: true } },
//         terms: { orderBy: { termNumber: "asc" } },
//         feeStructures: {
//           select: { id: true, isPublished: true, termId: true },
//         },
//       },
//     });

//     if (!academicYear) return { ok: false, error: "Academic year not found" };

//     // Aggregate all StudentFeeAccount totals for this academic year
//     const feeAccountAggregates = await db.studentFeeAccount.aggregate({
//       where: { academicYearId: id },
//       _sum: {
//         totalInvoiced: true,
//         totalPaid: true,
//         totalDiscount: true,
//         totalWaived: true,
//         totalPenalty: true,
//         balance: true,
//       },
//       _count: { id: true },
//     });

//     // Count accounts by status
//     const [studentsWithArrears, studentsCleared, studentsOverpaid] = await Promise.all([
//       db.studentFeeAccount.count({
//         where: { academicYearId: id, status: "ACTIVE", balance: { gt: 0 } },
//       }),
//       db.studentFeeAccount.count({
//         where: { academicYearId: id, status: "CLEARED" },
//       }),
//       db.studentFeeAccount.count({
//         where: { academicYearId: id, status: "OVERPAID" },
//       }),
//     ]);

//     // Per-term breakdown
//     const termBreakdown = await Promise.all(
//       academicYear.terms.map(async (term) => {
//         const termAgg = await db.studentFeeAccount.aggregate({
//           where: { academicYearId: id, termId: term.id },
//           _sum: { totalInvoiced: true, totalPaid: true, balance: true },
//         });

//         const publishedStructures = academicYear.feeStructures.filter(
//           (fs) => fs.termId === term.id && fs.isPublished
//         ).length;

//         return {
//           termId: term.id,
//           termName: term.name,
//           termNumber: term.termNumber,
//           totalInvoiced: termAgg._sum.totalInvoiced ?? 0,
//           totalCollected: termAgg._sum.totalPaid ?? 0,
//           totalOutstanding: termAgg._sum.balance ?? 0,
//           publishedStructures,
//         };
//       })
//     );

//     const totalInvoiced = feeAccountAggregates._sum.totalInvoiced ?? 0;
//     const totalCollected = feeAccountAggregates._sum.totalPaid ?? 0;
//     const totalOutstanding = feeAccountAggregates._sum.balance ?? 0;
//     const collectionRate =
//       totalInvoiced > 0
//         ? Math.round((totalCollected / totalInvoiced) * 100 * 10) / 10
//         : 0;

//     return {
//       ok: true,
//       data: {
//         ...academicYear,
//         feesSummary: {
//           totalInvoiced,
//           totalCollected,
//           totalOutstanding,
//           totalDiscount: feeAccountAggregates._sum.totalDiscount ?? 0,
//           totalWaived: feeAccountAggregates._sum.totalWaived ?? 0,
//           totalPenalty: feeAccountAggregates._sum.totalPenalty ?? 0,
//           collectionRate,
//           studentsWithArrears,
//           studentsCleared,
//           studentsOverpaid,
//           publishedFeeStructures: academicYear.feeStructures.filter((fs) => fs.isPublished).length,
//           termBreakdown,
//         },
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching academic year fees summary:", error);
//     return { ok: false, error: "Failed to fetch fees summary" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // UPDATE
// // ════════════════════════════════════════════════════════════════════════════

// export async function updateAcademicYear(
//   id: string,
//   data: UpdateAcademicYearInput
// ): Promise<ActionResult<AcademicYear>> {
//   try {
//     if (!id) return { ok: false, error: "Academic year ID is required" };

//     if (data.startDate && data.endDate && data.startDate > data.endDate) {
//       return { ok: false, error: "Start date must be before end date" };
//     }

//     const existingYear = await db.academicYear.findUnique({ where: { id } });
//     if (!existingYear) return { ok: false, error: "Academic year not found" };

//     if (data.year && data.year !== existingYear.year) {
//       const duplicate = await db.academicYear.findFirst({
//         where: {
//           schoolId: existingYear.schoolId,
//           year: data.year.trim(),
//           id: { not: id },
//         },
//       });
//       if (duplicate) {
//         return {
//           ok: false,
//           error: `Academic year '${data.year}' already exists for this school`,
//         };
//       }
//     }

//     const updatedYear = await db.$transaction(async (tx) => {
//       if (data.isActive === true) {
//         await tx.academicYear.updateMany({
//           where: { schoolId: existingYear.schoolId, id: { not: id } },
//           data: { isActive: false },
//         });
//       }
//       return tx.academicYear.update({
//         where: { id },
//         data: {
//           ...(data.year && { year: data.year.trim() }),
//           ...(data.isActive !== undefined && { isActive: data.isActive }),
//           ...(data.startDate !== undefined && { startDate: data.startDate }),
//           ...(data.endDate !== undefined && { endDate: data.endDate }),
//           updatedAt: new Date(),
//         },
//       });
//     });

//     revalidatePath("/dashboard/academic-years");
//     revalidatePath(`/dashboard/academic-years/${id}`);
//     return { ok: true, data: updatedYear };
//   } catch (error) {
//     console.error("Error updating academic year:", error);
//     return { ok: false, error: "Failed to update academic year. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // DELETE — with full fee data guard
// // ════════════════════════════════════════════════════════════════════════════

// export async function deleteAcademicYear(
//   id: string
// ): Promise<ActionResult<AcademicYear>> {
//   try {
//     if (!id) return { ok: false, error: "Academic year ID is required" };

//     const existingYear = await db.academicYear.findUnique({
//       where: { id },
//       include: {
//         enrollments: { select: { id: true } },
//         // ── Fee guards ──────────────────────────────────────
//         feeStructures: {
//           where: { isPublished: true },
//           select: { id: true, name: true },
//         },
//         studentFeeAccounts: {
//           where: {
//             OR: [{ totalPaid: { gt: 0 } }, { totalInvoiced: { gt: 0 } }],
//           },
//           select: { id: true },
//           take: 1, // We only need to know if ANY exist
//         },
//       },
//     });

//     if (!existingYear) return { ok: false, error: "Academic year not found" };

//     // Guard: active enrollments
//     if (existingYear.enrollments.length > 0) {
//       return {
//         ok: false,
//         error: `Cannot delete: this academic year has ${existingYear.enrollments.length} student enrollment(s)`,
//       };
//     }

//     // Guard: published fee structures
//     if (existingYear.feeStructures.length > 0) {
//       const names = existingYear.feeStructures.map((f) => f.name ?? f.id).join(", ");
//       return {
//         ok: false,
//         error: `Cannot delete: there are published fee structures (${names}). Unpublish them first.`,
//       };
//     }

//     // Guard: any financial transactions exist
//     if (existingYear.studentFeeAccounts.length > 0) {
//       return {
//         ok: false,
//         error: "Cannot delete: this academic year has fee payment history. Archive it instead.",
//       };
//     }

//     const deletedYear = await db.academicYear.delete({ where: { id } });

//     revalidatePath("/dashboard/academic-years");
//     return { ok: true, data: deletedYear };
//   } catch (error) {
//     console.error("Error deleting academic year:", error);
//     return { ok: false, error: "Failed to delete academic year. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // GET ACTIVE
// // ════════════════════════════════════════════════════════════════════════════

// export async function getActiveAcademicYear(
//   schoolId: string
// ): Promise<ActionResult<AcademicYearWithRelations>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const activeYear = await db.academicYear.findFirst({
//       where: { schoolId, isActive: true },
//       include: {
//         terms: { orderBy: { termNumber: "asc" } },
//         school: { select: { id: true, name: true, slug: true } },
//         // Include auto-invoice config so enrollment flow knows what to do
//         autoInvoiceConfigs: {
//           select: {
//             termId: true,
//             isEnabled: true,
//             generateOnEnrollment: true,
//             includeCarryForward: true,
//             applyBursaries: true,
//           },
//         },
//       },
//     });

//     if (!activeYear) return { ok: false, error: "No active academic year found" };

//     return { ok: true, data: activeYear };
//   } catch (error) {
//     console.error("Error fetching active academic year:", error);
//     return { ok: false, error: "Failed to fetch active academic year" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // GET CURRENT (date-based)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getCurrentAcademicYear(
//   schoolId: string
// ): Promise<ActionResult<AcademicYearWithRelations>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const now = new Date();

//     const currentYear = await db.academicYear.findFirst({
//       where: {
//         schoolId,
//         startDate: { lte: now },
//         endDate: { gte: now },
//       },
//       include: {
//         terms: {
//           where: { startDate: { lte: now }, endDate: { gte: now } },
//           orderBy: { termNumber: "asc" },
//         },
//         school: { select: { id: true, name: true, slug: true } },
//         autoInvoiceConfigs: {
//           select: {
//             termId: true,
//             isEnabled: true,
//             generateOnEnrollment: true,
//             includeCarryForward: true,
//             applyBursaries: true,
//           },
//         },
//       },
//     });

//     // Fallback to active flag if no date-based match
//     if (!currentYear) return getActiveAcademicYear(schoolId);

//     return { ok: true, data: currentYear };
//   } catch (error) {
//     console.error("Error fetching current academic year:", error);
//     return { ok: false, error: "Failed to fetch current academic year" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // TOGGLE STATUS
// // ════════════════════════════════════════════════════════════════════════════

// export async function toggleAcademicYearStatus(
//   id: string
// ): Promise<ActionResult<AcademicYear>> {
//   try {
//     if (!id) return { ok: false, error: "Academic year ID is required" };

//     const academicYear = await db.academicYear.findUnique({ where: { id } });
//     if (!academicYear) return { ok: false, error: "Academic year not found" };

//     return updateAcademicYear(id, { isActive: !academicYear.isActive });
//   } catch (error) {
//     console.error("Error toggling academic year status:", error);
//     return { ok: false, error: "Failed to toggle academic year status" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // WITH STATS (updated to include fee stats)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicYearsWithStats(
//   schoolId: string
// ): Promise<ActionResult<AcademicYearWithStats[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const academicYears = await db.academicYear.findMany({
//       where: { schoolId },
//       orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
//       include: {
//         terms: true,
//         enrollments: { select: { id: true } },
//         feeStructures: { select: { id: true, isPublished: true } },
//         _count: {
//           select: {
//             terms: true,
//             enrollments: true,
//             studentFeeAccounts: true,
//             feeStructures: true,
//           },
//         },
//       },
//     });

//     const yearsWithStats: AcademicYearWithStats[] = academicYears.map((year) => ({
//       ...year,
//       stats: {
//         totalTerms: year._count.terms,
//         totalEnrollments: year._count.enrollments,
//         totalStudentFeeAccounts: year._count.studentFeeAccounts,
//         totalPublishedFeeStructures: year.feeStructures.filter((f) => f.isPublished).length,
//         hasData: year._count.enrollments > 0,
//         hasFeeData: year._count.studentFeeAccounts > 0,
//       },
//     }));

//     return { ok: true, data: yearsWithStats };
//   } catch (error) {
//     console.error("Error fetching academic years with stats:", error);
//     return { ok: false, error: "Failed to fetch academic years" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // BULK CREATE
// // ════════════════════════════════════════════════════════════════════════════

// export async function bulkCreateAcademicYears(
//   schoolId: string,
//   years: string[]
// ): Promise<ActionResult<AcademicYear[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };
//     if (!years || years.length === 0) {
//       return { ok: false, error: "At least one year is required" };
//     }

//     for (const year of years) {
//       const validationError = validateAcademicYearInput({ schoolId, year });
//       if (validationError) return { ok: false, error: validationError };
//     }

//     const existingYears = await db.academicYear.findMany({
//       where: { schoolId, year: { in: years } },
//       select: { year: true },
//     });

//     if (existingYears.length > 0) {
//       const list = existingYears.map((y) => y.year).join(", ");
//       return { ok: false, error: `The following years already exist: ${list}` };
//     }

//     const createdYears = await db.$transaction(
//       years.map((year, index) =>
//         db.academicYear.create({
//           data: {
//             year: year.trim(),
//             isActive: index === 0,
//             schoolId,
//           },
//         })
//       )
//     );

//     revalidatePath("/dashboard/academic-years");
//     return { ok: true, data: createdYears };
//   } catch (error) {
//     console.error("Error bulk creating academic years:", error);
//     return { ok: false, error: "Failed to create academic years" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ARCHIVE (soft alternative to delete when fee data exists)
// // ════════════════════════════════════════════════════════════════════════════

// export async function archiveAcademicYear(
//   id: string
// ): Promise<ActionResult<AcademicYear>> {
//   try {
//     if (!id) return { ok: false, error: "Academic year ID is required" };

//     const academicYear = await db.academicYear.findUnique({ where: { id } });
//     if (!academicYear) return { ok: false, error: "Academic year not found" };

//     if (!academicYear.isActive && academicYear.endDate) {
//       return { ok: false, error: "Academic year is already archived" };
//     }

//     // Deactivate and set end date to now if not already set
//     const archived = await db.academicYear.update({
//       where: { id },
//       data: {
//         isActive: false,
//         endDate: academicYear.endDate ?? new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     revalidatePath("/dashboard/academic-years");
//     revalidatePath(`/dashboard/academic-years/${id}`);
//     return { ok: true, data: archived };
//   } catch (error) {
//     console.error("Error archiving academic year:", error);
//     return { ok: false, error: "Failed to archive academic year" };
//   }
// }




"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { AcademicYear, AcademicTerm } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type AcademicYearWithRelations = AcademicYear & {
  school?: { id: string; name: string; slug: string };
  terms?: AcademicTerm[];
};

type AcademicYearWithStats = AcademicYearWithRelations & {
  stats: {
    totalTerms: number;
    totalEnrollments: number;
    totalStudentFeeAccounts: number;
    totalPublishedFeeStructures: number;
    hasData: boolean;
    hasFeeData: boolean;
  };
};

type AcademicYearFeesSummary = AcademicYearWithRelations & {
  feesSummary: {
    totalInvoiced: number;
    totalCollected: number;
    // FIX [note]: split into gross outstanding and overpaid
    // rather than net balance sum which can mislead when overpaid accounts exist
    totalOutstanding: number;   // sum of positive balances only
    totalOverpaid: number;      // sum of absolute negative balances only
    totalDiscount: number;
    totalWaived: number;
    totalPenalty: number;
    collectionRate: number;
    studentsWithArrears: number;
    studentsCleared: number;
    studentsOverpaid: number;
    publishedFeeStructures: number;
    termBreakdown: {
      termId: string;
      termName: string;
      termNumber: number;
      totalInvoiced: number;
      totalCollected: number;
      totalOutstanding: number;
      publishedStructures: number;
    }[];
  };
};

interface CreateAcademicYearInput {
  schoolId: string;
  year: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface UpdateAcademicYearInput {
  year?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════

function validateAcademicYearInput(input: CreateAcademicYearInput): string | null {
  if (!input.year || input.year.trim().length === 0) {
    return "Academic year is required";
  }
  if (!input.schoolId || input.schoolId.trim().length === 0) {
    return "School ID is required";
  }
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return "Start date must be before end date";
  }
  const yearPattern = /^\d{4}(\/\d{4})?$/;
  if (!yearPattern.test(input.year.trim())) {
    return "Invalid year format. Use '2024' or '2024/2025'";
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════════════════════════════

export async function createAcademicYear(
  input: CreateAcademicYearInput
): Promise<ActionResult<AcademicYear>> {
  try {
    const validationError = validateAcademicYearInput(input);
    if (validationError) return { ok: false, error: validationError };

    // FIX [1]: use findUnique with the compound key generated by
    // @@unique([year, schoolId]) — faster and semantically correct
    const existingYear = await db.academicYear.findUnique({
      where: { year_schoolId: { year: input.year.trim(), schoolId: input.schoolId } },
    });

    if (existingYear) {
      return {
        ok: false,
        error: `Academic year '${input.year}' already exists for this school`,
      };
    }

    const newYear = await db.$transaction(async (tx) => {
      if (input.isActive) {
        await tx.academicYear.updateMany({
          where: { schoolId: input.schoolId },
          data: { isActive: false },
        });
      }
      return tx.academicYear.create({
        data: {
          year: input.year.trim(),
          isActive: input.isActive ?? true,
          schoolId: input.schoolId,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
    });

    revalidatePath("/dashboard/academic-years");
    return { ok: true, data: newYear };
  } catch (error) {
    console.error("Error creating academic year:", error);
    return { ok: false, error: "Failed to create academic year. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — ALL
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicYearsBySchool(
  schoolId: string
): Promise<ActionResult<AcademicYearWithRelations[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const academicYears = await db.academicYear.findMany({
      where: { schoolId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        school: { select: { id: true, name: true, slug: true } },
        terms: { orderBy: { termNumber: "asc" } },
      },
    });

    return { ok: true, data: academicYears };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return { ok: false, error: "Failed to fetch academic years" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — SINGLE WITH FULL RELATIONS
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicYearById(
  id: string
): Promise<ActionResult<AcademicYearWithRelations>> {
  try {
    if (!id) return { ok: false, error: "Academic year ID is required" };

    const academicYear = await db.academicYear.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true, slug: true } },
        terms: { orderBy: { termNumber: "asc" } },
        enrollments: { select: { id: true } },
        gradingConfigs: true,
        feeStructures: {
          select: {
            id: true,
            name: true,
            isPublished: true,
            totalAmount: true,
            classYearId: true,
            termId: true,
          },
        },
        autoInvoiceConfigs: {
          select: {
            id: true,
            termId: true,
            isEnabled: true,
            generateOnEnrollment: true,
          },
        },
      },
    });

    if (!academicYear) return { ok: false, error: "Academic year not found" };

    return { ok: true, data: academicYear };
  } catch (error) {
    console.error("Error fetching academic year:", error);
    return { ok: false, error: "Failed to fetch academic year" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — WITH FEES SUMMARY
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicYearWithFeesSummary(
  id: string
): Promise<ActionResult<AcademicYearFeesSummary>> {
  try {
    if (!id) return { ok: false, error: "Academic year ID is required" };

    const academicYear = await db.academicYear.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true, slug: true } },
        terms: { orderBy: { termNumber: "asc" } },
        feeStructures: {
          select: { id: true, isPublished: true, termId: true },
        },
      },
    });

    if (!academicYear) return { ok: false, error: "Academic year not found" };

    // Aggregate totals (excluding balance — handled separately below)
    const feeAccountAggregates = await db.studentFeeAccount.aggregate({
      where: { academicYearId: id },
      _sum: {
        totalInvoiced: true,
        totalPaid: true,
        totalDiscount: true,
        totalWaived: true,
        totalPenalty: true,
      },
    });

    // FIX [note]: compute outstanding and overpaid separately so they don't cancel out
    const [outstandingAgg, overpaidAgg] = await Promise.all([
      db.studentFeeAccount.aggregate({
        where: { academicYearId: id, balance: { gt: 0 } },
        _sum: { balance: true },
      }),
      db.studentFeeAccount.aggregate({
        where: { academicYearId: id, balance: { lt: 0 } },
        _sum: { balance: true },
      }),
    ]);

    const [studentsWithArrears, studentsCleared, studentsOverpaid] = await Promise.all([
      db.studentFeeAccount.count({
        where: { academicYearId: id, balance: { gt: 0 } },
      }),
      db.studentFeeAccount.count({
        where: { academicYearId: id, status: "CLEARED" },
      }),
      db.studentFeeAccount.count({
        where: { academicYearId: id, status: "OVERPAID" },
      }),
    ]);

    const termBreakdown = await Promise.all(
      academicYear.terms.map(async (term) => {
        const termOutstanding = await db.studentFeeAccount.aggregate({
          where: { academicYearId: id, termId: term.id, balance: { gt: 0 } },
          _sum: { totalInvoiced: true, totalPaid: true, balance: true },
        });
        const publishedStructures = academicYear.feeStructures.filter(
          (fs) => fs.termId === term.id && fs.isPublished
        ).length;

        return {
          termId: term.id,
          termName: term.name,
          termNumber: term.termNumber,
          totalInvoiced: termOutstanding._sum.totalInvoiced ?? 0,
          totalCollected: termOutstanding._sum.totalPaid ?? 0,
          totalOutstanding: termOutstanding._sum.balance ?? 0,
          publishedStructures,
        };
      })
    );

    const totalInvoiced = feeAccountAggregates._sum.totalInvoiced ?? 0;
    const totalCollected = feeAccountAggregates._sum.totalPaid ?? 0;
    const collectionRate =
      totalInvoiced > 0
        ? Math.round((totalCollected / totalInvoiced) * 100 * 10) / 10
        : 0;

    return {
      ok: true,
      data: {
        ...academicYear,
        feesSummary: {
          totalInvoiced,
          totalCollected,
          totalOutstanding: outstandingAgg._sum.balance ?? 0,
          totalOverpaid: Math.abs(overpaidAgg._sum.balance ?? 0),
          totalDiscount: feeAccountAggregates._sum.totalDiscount ?? 0,
          totalWaived: feeAccountAggregates._sum.totalWaived ?? 0,
          totalPenalty: feeAccountAggregates._sum.totalPenalty ?? 0,
          collectionRate,
          studentsWithArrears,
          studentsCleared,
          studentsOverpaid,
          publishedFeeStructures: academicYear.feeStructures.filter((fs) => fs.isPublished).length,
          termBreakdown,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching academic year fees summary:", error);
    return { ok: false, error: "Failed to fetch fees summary" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════════════════════════════════════════

export async function updateAcademicYear(
  id: string,
  data: UpdateAcademicYearInput
): Promise<ActionResult<AcademicYear>> {
  try {
    if (!id) return { ok: false, error: "Academic year ID is required" };

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      return { ok: false, error: "Start date must be before end date" };
    }

    const existingYear = await db.academicYear.findUnique({ where: { id } });
    if (!existingYear) return { ok: false, error: "Academic year not found" };

    if (data.year && data.year.trim() !== existingYear.year) {
      // FIX [2]: use compound unique key instead of findFirst
      const duplicate = await db.academicYear.findUnique({
        where: {
          year_schoolId: { year: data.year.trim(), schoolId: existingYear.schoolId },
        },
      });
      if (duplicate && duplicate.id !== id) {
        return {
          ok: false,
          error: `Academic year '${data.year}' already exists for this school`,
        };
      }
    }

    const updatedYear = await db.$transaction(async (tx) => {
      if (data.isActive === true) {
        await tx.academicYear.updateMany({
          where: { schoolId: existingYear.schoolId, id: { not: id } },
          data: { isActive: false },
        });
      }
      return tx.academicYear.update({
        where: { id },
        data: {
          ...(data.year && { year: data.year.trim() }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          updatedAt: new Date(),
        },
      });
    });

    revalidatePath("/dashboard/academic-years");
    revalidatePath(`/dashboard/academic-years/${id}`);
    return { ok: true, data: updatedYear };
  } catch (error) {
    console.error("Error updating academic year:", error);
    return { ok: false, error: "Failed to update academic year. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE — with full fee data guard
// ════════════════════════════════════════════════════════════════════════════

export async function deleteAcademicYear(
  id: string
): Promise<ActionResult<AcademicYear>> {
  try {
    if (!id) return { ok: false, error: "Academic year ID is required" };

    const existingYear = await db.academicYear.findUnique({
      where: { id },
      include: {
        enrollments: { select: { id: true } },
        feeStructures: {
          where: { isPublished: true },
          select: { id: true, name: true },
        },
        studentFeeAccounts: {
          where: {
            OR: [{ totalPaid: { gt: 0 } }, { totalInvoiced: { gt: 0 } }],
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existingYear) return { ok: false, error: "Academic year not found" };

    if (existingYear.enrollments.length > 0) {
      return {
        ok: false,
        error: `Cannot delete: this academic year has ${existingYear.enrollments.length} student enrollment(s)`,
      };
    }

    if (existingYear.feeStructures.length > 0) {
      const names = existingYear.feeStructures.map((f) => f.name ?? f.id).join(", ");
      return {
        ok: false,
        error: `Cannot delete: published fee structures exist (${names}). Unpublish them first.`,
      };
    }

    if (existingYear.studentFeeAccounts.length > 0) {
      return {
        ok: false,
        error: "Cannot delete: this academic year has fee payment history. Archive it instead.",
      };
    }

    const deletedYear = await db.academicYear.delete({ where: { id } });

    revalidatePath("/dashboard/academic-years");
    return { ok: true, data: deletedYear };
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return { ok: false, error: "Failed to delete academic year. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET ACTIVE
// ════════════════════════════════════════════════════════════════════════════

export async function getActiveAcademicYear(
  schoolId: string
): Promise<ActionResult<AcademicYearWithRelations>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const activeYear = await db.academicYear.findFirst({
      where: { schoolId, isActive: true },
      include: {
        terms: { orderBy: { termNumber: "asc" } },
        school: { select: { id: true, name: true, slug: true } },
        autoInvoiceConfigs: {
          select: {
            termId: true,
            isEnabled: true,
            generateOnEnrollment: true,
            includeCarryForward: true,
            applyBursaries: true,
          },
        },
      },
    });

    if (!activeYear) return { ok: false, error: "No active academic year found" };

    return { ok: true, data: activeYear };
  } catch (error) {
    console.error("Error fetching active academic year:", error);
    return { ok: false, error: "Failed to fetch active academic year" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET CURRENT (date-based)
// ════════════════════════════════════════════════════════════════════════════

export async function getCurrentAcademicYear(
  schoolId: string
): Promise<ActionResult<AcademicYearWithRelations>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const now = new Date();

    const currentYear = await db.academicYear.findFirst({
      where: {
        schoolId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        terms: {
          where: { startDate: { lte: now }, endDate: { gte: now } },
          orderBy: { termNumber: "asc" },
        },
        school: { select: { id: true, name: true, slug: true } },
        autoInvoiceConfigs: {
          select: {
            termId: true,
            isEnabled: true,
            generateOnEnrollment: true,
            includeCarryForward: true,
            applyBursaries: true,
          },
        },
      },
    });

    if (!currentYear) return getActiveAcademicYear(schoolId);

    return { ok: true, data: currentYear };
  } catch (error) {
    console.error("Error fetching current academic year:", error);
    return { ok: false, error: "Failed to fetch current academic year" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function toggleAcademicYearStatus(
  id: string
): Promise<ActionResult<AcademicYear>> {
  try {
    if (!id) return { ok: false, error: "Academic year ID is required" };

    const academicYear = await db.academicYear.findUnique({ where: { id } });
    if (!academicYear) return { ok: false, error: "Academic year not found" };

    return updateAcademicYear(id, { isActive: !academicYear.isActive });
  } catch (error) {
    console.error("Error toggling academic year status:", error);
    return { ok: false, error: "Failed to toggle academic year status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// WITH STATS
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicYearsWithStats(
  schoolId: string
): Promise<ActionResult<AcademicYearWithStats[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const academicYears = await db.academicYear.findMany({
      where: { schoolId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        terms: true,
        enrollments: { select: { id: true } },
        feeStructures: { select: { id: true, isPublished: true } },
        _count: {
          select: {
            terms: true,
            enrollments: true,
            studentFeeAccounts: true,
            feeStructures: true,
          },
        },
      },
    });

    const yearsWithStats: AcademicYearWithStats[] = academicYears.map((year) => ({
      ...year,
      stats: {
        totalTerms: year._count.terms,
        totalEnrollments: year._count.enrollments,
        totalStudentFeeAccounts: year._count.studentFeeAccounts,
        totalPublishedFeeStructures: year.feeStructures.filter((f) => f.isPublished).length,
        hasData: year._count.enrollments > 0,
        hasFeeData: year._count.studentFeeAccounts > 0,
      },
    }));

    return { ok: true, data: yearsWithStats };
  } catch (error) {
    console.error("Error fetching academic years with stats:", error);
    return { ok: false, error: "Failed to fetch academic years" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK CREATE
// FIX [4]: deactivate any existing active year before activating the first new year
// ════════════════════════════════════════════════════════════════════════════

export async function bulkCreateAcademicYears(
  schoolId: string,
  years: string[]
): Promise<ActionResult<AcademicYear[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };
    if (!years || years.length === 0) {
      return { ok: false, error: "At least one year is required" };
    }

    for (const year of years) {
      const validationError = validateAcademicYearInput({ schoolId, year });
      if (validationError) return { ok: false, error: validationError };
    }

    const existingYears = await db.academicYear.findMany({
      where: { schoolId, year: { in: years.map((y) => y.trim()) } },
      select: { year: true },
    });

    if (existingYears.length > 0) {
      const list = existingYears.map((y) => y.year).join(", ");
      return { ok: false, error: `The following years already exist: ${list}` };
    }

    const createdYears = await db.$transaction(async (tx) => {
      // FIX [4]: deactivate all existing active years first so only one is active
      await tx.academicYear.updateMany({
        where: { schoolId },
        data: { isActive: false },
      });

      return Promise.all(
        years.map((year, index) =>
          tx.academicYear.create({
            data: {
              year: year.trim(),
              // Only the first year in the batch becomes active
              isActive: index === 0,
              schoolId,
            },
          })
        )
      );
    });

    revalidatePath("/dashboard/academic-years");
    return { ok: true, data: createdYears };
  } catch (error) {
    console.error("Error bulk creating academic years:", error);
    return { ok: false, error: "Failed to create academic years" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ARCHIVE
// FIX [3]: isActive:false alone is the archived state — endDate is optional metadata.
//          Guard corrected: only reject if already inactive AND we've already set endDate.
// ════════════════════════════════════════════════════════════════════════════

export async function archiveAcademicYear(
  id: string
): Promise<ActionResult<AcademicYear>> {
  try {
    if (!id) return { ok: false, error: "Academic year ID is required" };

    const academicYear = await db.academicYear.findUnique({ where: { id } });
    if (!academicYear) return { ok: false, error: "Academic year not found" };

    // FIX [3]: archived = isActive is already false. endDate being null doesn't
    // mean it isn't archived — updateAcademicYear(isActive:false) is a valid path.
    if (!academicYear.isActive) {
      return { ok: false, error: "Academic year is already archived (inactive)" };
    }

    const archived = await db.academicYear.update({
      where: { id },
      data: {
        isActive: false,
        // Set endDate to now only if not already set — preserves intentional future end dates
        endDate: academicYear.endDate ?? new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/academic-years");
    revalidatePath(`/dashboard/academic-years/${id}`);
    return { ok: true, data: archived };
  } catch (error) {
    console.error("Error archiving academic year:", error);
    return { ok: false, error: "Failed to archive academic year" };
  }
}