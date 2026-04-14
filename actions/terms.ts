


// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { AcademicTerm } from "@prisma/client";

// // ════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ════════════════════════════════════════════════════════════════════════════

// type ActionResult<T> =
//   | { ok: true; data: T }
//   | { ok: false; error: string };

// type AcademicTermWithRelations = AcademicTerm & {
//   academicYear?: {
//     id: string;
//     year: string;
//     schoolId: string;
//     isActive: boolean;
//     school?: { id: string; name: string; slug: string };
//   };
// };

// type AcademicTermWithStats = AcademicTermWithRelations & {
//   stats: {
//     totalExams: number;
//     totalEnrollments: number;
//     totalStreamSubjects: number;
//     totalAssessmentConfigs: number;
//     // Fee stats
//     totalFeeStructures: number;
//     totalPublishedFeeStructures: number;
//     totalStudentFeeAccounts: number;
//     hasData: boolean;
//     hasFeeData: boolean;
//   };
// };

// type AcademicTermFeesSummary = AcademicTermWithRelations & {
//   feesSummary: {
//     totalInvoiced: number;
//     totalCollected: number;
//     totalOutstanding: number;
//     totalDiscount: number;
//     totalWaived: number;
//     totalPenalty: number;
//     collectionRate: number;
//     studentsWithArrears: number;
//     studentsCleared: number;
//     studentsOverpaid: number;
//     autoInvoiceEnabled: boolean;
//     autoInvoiceGeneratedCount: number;
//     publishedFeeStructures: number;
//     totalFeeStructures: number;
//   };
// };

// interface CreateAcademicTermInput {
//   academicYearId: string;
//   name: string;
//   termNumber: number;
//   startDate: Date;
//   endDate: Date;
//   isActive?: boolean;
// }

// interface UpdateAcademicTermInput {
//   name?: string;
//   termNumber?: number;
//   startDate?: Date;
//   endDate?: Date;
//   isActive?: boolean;
// }

// // ════════════════════════════════════════════════════════════════════════════
// // VALIDATION
// // ════════════════════════════════════════════════════════════════════════════

// function validateAcademicTermInput(input: CreateAcademicTermInput): string | null {
//   if (!input.name || input.name.trim().length === 0) {
//     return "Term name is required";
//   }
//   if (!input.academicYearId || input.academicYearId.trim().length === 0) {
//     return "Academic year ID is required";
//   }
//   if (!input.termNumber || input.termNumber < 1 || input.termNumber > 3) {
//     return "Term number must be between 1 and 3";
//   }
//   if (!input.startDate || !input.endDate) {
//     return "Start date and end date are required";
//   }
//   if (input.startDate >= input.endDate) {
//     return "Start date must be before end date";
//   }
//   return null;
// }

// // ════════════════════════════════════════════════════════════════════════════
// // CREATE
// // ════════════════════════════════════════════════════════════════════════════

// export async function createAcademicTerm(
//   input: CreateAcademicTermInput
// ): Promise<ActionResult<AcademicTermWithRelations>> {
//   try {
//     const validationError = validateAcademicTermInput(input);
//     if (validationError) return { ok: false, error: validationError };

//     const existingTerm = await db.academicTerm.findUnique({
//       where: {
//         termNumber_academicYearId: {
//           termNumber: input.termNumber,
//           academicYearId: input.academicYearId,
//         },
//       },
//     });

//     if (existingTerm) {
//       return {
//         ok: false,
//         error: `Term ${input.termNumber} already exists for this academic year`,
//       };
//     }

//     const newTerm = await db.$transaction(async (tx) => {
//       if (input.isActive) {
//         await tx.academicTerm.updateMany({
//           where: { academicYearId: input.academicYearId, isActive: true },
//           data: { isActive: false },
//         });
//       }

//       return tx.academicTerm.create({
//         data: {
//           name: input.name.trim(),
//           termNumber: input.termNumber,
//           startDate: input.startDate,
//           endDate: input.endDate,
//           isActive: input.isActive ?? true,
//           academicYearId: input.academicYearId,
//         },
//         include: {
//           academicYear: {
//             select: { id: true, year: true, schoolId: true, isActive: true },
//           },
//         },
//       });
//     });

//     revalidatePath("/dashboard/academic-terms");
//     return { ok: true, data: newTerm };
//   } catch (error) {
//     console.error("Error creating academic term:", error);
//     return { ok: false, error: "Failed to create academic term. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — ALL TERMS FOR A YEAR
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicTermsByYear(
//   academicYearId: string
// ): Promise<ActionResult<any[]>> {
//   try {
//     if (!academicYearId) return { ok: false, error: "Academic year ID is required" };

//     const terms = await db.academicTerm.findMany({
//       where: { academicYearId },
//       orderBy: { termNumber: "asc" },
//       include: {
//         academicYear: {
//           select: { id: true, year: true, schoolId: true },
//         },
//         feeStructures: {
//           select: { id: true, isPublished: true, totalAmount: true, classYearId: true },
//         },
//         autoInvoiceConfigs: {
//           select: { id: true, isEnabled: true, generateOnEnrollment: true },
//         },
//         _count: {
//           select: {
//             exams: true,
//             enrollments: true,
//             streamSubjects: true,
//             assessmentConfigs: true,
//             feeStructures: true,
//             studentFeeAccounts: true,
//           },
//         },
//       },
//     });

//     return { ok: true, data: terms };
//   } catch (error) {
//     console.error("Error fetching academic terms:", error);
//     return { ok: false, error: "Failed to fetch academic terms" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — ALL TERMS FOR A SCHOOL
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicTermsBySchool(
//   schoolId: string
// ): Promise<ActionResult<any[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const terms = await db.academicTerm.findMany({
//       where: { academicYear: { schoolId } },
//       orderBy: [
//         { academicYear: { year: "desc" } },
//         { termNumber: "asc" },
//       ],
//       include: {
//         academicYear: {
//           select: { id: true, year: true, schoolId: true, isActive: true },
//         },
//         _count: {
//           select: {
//             exams: true,
//             enrollments: true,
//             streamSubjects: true,
//             assessmentConfigs: true,
//             feeStructures: true,
//             studentFeeAccounts: true,
//           },
//         },
//       },
//     });

//     return { ok: true, data: terms };
//   } catch (error) {
//     console.error("Error fetching academic terms by school:", error);
//     return { ok: false, error: "Failed to fetch academic terms" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — WITH STATS (for listing pages)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicTermsWithStats(
//   schoolId: string
// ): Promise<ActionResult<AcademicTermWithStats[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const terms = await db.academicTerm.findMany({
//       where: { academicYear: { schoolId } },
//       orderBy: [
//         { academicYear: { isActive: "desc" } },
//         { academicYear: { year: "desc" } },
//         { termNumber: "asc" },
//       ],
//       include: {
//         academicYear: {
//           select: { id: true, year: true, schoolId: true, isActive: true },
//         },
//         feeStructures: {
//           select: { id: true, isPublished: true },
//         },
//         _count: {
//           select: {
//             exams: true,
//             enrollments: true,
//             streamSubjects: true,
//             assessmentConfigs: true,
//             feeStructures: true,
//             studentFeeAccounts: true,
//           },
//         },
//       },
//     });

//     const termsWithStats: AcademicTermWithStats[] = terms.map((term) => ({
//       ...term,
//       stats: {
//         totalExams: term._count.exams,
//         totalEnrollments: term._count.enrollments,
//         totalStreamSubjects: term._count.streamSubjects,
//         totalAssessmentConfigs: term._count.assessmentConfigs,
//         totalFeeStructures: term._count.feeStructures,
//         totalPublishedFeeStructures: term.feeStructures.filter((f) => f.isPublished).length,
//         totalStudentFeeAccounts: term._count.studentFeeAccounts,
//         hasData:
//           term._count.enrollments > 0 ||
//           term._count.exams > 0 ||
//           term._count.streamSubjects > 0,
//         hasFeeData: term._count.studentFeeAccounts > 0,
//       },
//     }));

//     return { ok: true, data: termsWithStats };
//   } catch (error) {
//     console.error("Error fetching academic terms with stats:", error);
//     return { ok: false, error: "Failed to fetch academic terms" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — SINGLE TERM
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicTermById(
//   id: string
// ): Promise<ActionResult<any>> {
//   try {
//     if (!id) return { ok: false, error: "Academic term ID is required" };

//     const term = await db.academicTerm.findUnique({
//       where: { id },
//       include: {
//         academicYear: {
//           select: {
//             id: true,
//             year: true,
//             schoolId: true,
//             isActive: true,
//             school: { select: { id: true, name: true, slug: true } },
//           },
//         },
//         feeStructures: {
//           select: {
//             id: true,
//             name: true,
//             isPublished: true,
//             totalAmount: true,
//             classYearId: true,
//           },
//         },
//         autoInvoiceConfigs: {
//           select: {
//             id: true,
//             isEnabled: true,
//             generateOnEnrollment: true,
//             generateOnDate: true,
//             includeCarryForward: true,
//             applyBursaries: true,
//             sendNotification: true,
//           },
//         },
//         _count: {
//           select: {
//             exams: true,
//             enrollments: true,
//             streamSubjects: true,
//             assessmentConfigs: true,
//             feeStructures: true,
//             studentFeeAccounts: true,
//           },
//         },
//       },
//     });

//     if (!term) return { ok: false, error: "Academic term not found" };

//     return { ok: true, data: term };
//   } catch (error) {
//     console.error("Error fetching academic term:", error);
//     return { ok: false, error: "Failed to fetch academic term" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // READ — FEES SUMMARY FOR A TERM (finance dashboard)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAcademicTermWithFeesSummary(
//   id: string
// ): Promise<ActionResult<AcademicTermFeesSummary>> {
//   try {
//     if (!id) return { ok: false, error: "Academic term ID is required" };

//     const term = await db.academicTerm.findUnique({
//       where: { id },
//       include: {
//         academicYear: {
//           select: {
//             id: true,
//             year: true,
//             schoolId: true,
//             isActive: true,
//             school: { select: { id: true, name: true, slug: true } },
//           },
//         },
//         feeStructures: {
//           select: { id: true, isPublished: true, totalAmount: true, classYearId: true },
//         },
//         autoInvoiceConfigs: {
//           select: { isEnabled: true, generateOnEnrollment: true },
//         },
//       },
//     });

//     if (!term) return { ok: false, error: "Academic term not found" };

//     // Aggregate StudentFeeAccount totals for this term
//     const feeAgg = await db.studentFeeAccount.aggregate({
//       where: { termId: id },
//       _sum: {
//         totalInvoiced: true,
//         totalPaid: true,
//         totalDiscount: true,
//         totalWaived: true,
//         totalPenalty: true,
//         balance: true,
//       },
//     });

//     // Auto-invoice count
//     const autoInvoiceGeneratedCount = await db.studentFeeAccount.count({
//       where: { termId: id, autoInvoiceGenerated: true },
//     });

//     // Status breakdowns
//     const [studentsWithArrears, studentsCleared, studentsOverpaid] = await Promise.all([
//       db.studentFeeAccount.count({
//         where: { termId: id, balance: { gt: 0 } },
//       }),
//       db.studentFeeAccount.count({
//         where: { termId: id, status: "CLEARED" },
//       }),
//       db.studentFeeAccount.count({
//         where: { termId: id, status: "OVERPAID" },
//       }),
//     ]);

//     const totalInvoiced = feeAgg._sum.totalInvoiced ?? 0;
//     const totalCollected = feeAgg._sum.totalPaid ?? 0;
//     const collectionRate =
//       totalInvoiced > 0
//         ? Math.round((totalCollected / totalInvoiced) * 100 * 10) / 10
//         : 0;

//     const publishedFeeStructures = term.feeStructures.filter((f) => f.isPublished).length;
//     const autoInvoiceEnabled = term.autoInvoiceConfigs.some((c) => c.isEnabled);

//     return {
//       ok: true,
//       data: {
//         ...term,
//         feesSummary: {
//           totalInvoiced,
//           totalCollected,
//           totalOutstanding: feeAgg._sum.balance ?? 0,
//           totalDiscount: feeAgg._sum.totalDiscount ?? 0,
//           totalWaived: feeAgg._sum.totalWaived ?? 0,
//           totalPenalty: feeAgg._sum.totalPenalty ?? 0,
//           collectionRate,
//           studentsWithArrears,
//           studentsCleared,
//           studentsOverpaid,
//           autoInvoiceEnabled,
//           autoInvoiceGeneratedCount,
//           publishedFeeStructures,
//           totalFeeStructures: term.feeStructures.length,
//         },
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching term fees summary:", error);
//     return { ok: false, error: "Failed to fetch fees summary" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // UPDATE
// // ════════════════════════════════════════════════════════════════════════════

// export async function updateAcademicTerm(
//   id: string,
//   data: UpdateAcademicTermInput
// ): Promise<ActionResult<AcademicTerm>> {
//   try {
//     if (!id) return { ok: false, error: "Academic term ID is required" };

//     if (data.startDate && data.endDate && data.startDate >= data.endDate) {
//       return { ok: false, error: "Start date must be before end date" };
//     }

//     const existingTerm = await db.academicTerm.findUnique({ where: { id } });
//     if (!existingTerm) return { ok: false, error: "Academic term not found" };

//     if (data.termNumber && data.termNumber !== existingTerm.termNumber) {
//       const duplicate = await db.academicTerm.findUnique({
//         where: {
//           termNumber_academicYearId: {
//             termNumber: data.termNumber,
//             academicYearId: existingTerm.academicYearId,
//           },
//         },
//       });
//       if (duplicate) {
//         return {
//           ok: false,
//           error: `Term ${data.termNumber} already exists for this academic year`,
//         };
//       }
//     }

//     const updatedTerm = await db.$transaction(async (tx) => {
//       if (data.isActive === true) {
//         await tx.academicTerm.updateMany({
//           where: { academicYearId: existingTerm.academicYearId, id: { not: id } },
//           data: { isActive: false },
//         });
//       }

//       return tx.academicTerm.update({
//         where: { id },
//         data: {
//           ...(data.name && { name: data.name.trim() }),
//           ...(data.termNumber !== undefined && { termNumber: data.termNumber }),
//           ...(data.startDate !== undefined && { startDate: data.startDate }),
//           ...(data.endDate !== undefined && { endDate: data.endDate }),
//           ...(data.isActive !== undefined && { isActive: data.isActive }),
//           updatedAt: new Date(),
//         },
//       });
//     });

//     revalidatePath("/dashboard/academic-terms");
//     revalidatePath(`/dashboard/academic-terms/${id}`);
//     return { ok: true, data: updatedTerm };
//   } catch (error) {
//     console.error("Error updating academic term:", error);
//     return { ok: false, error: "Failed to update academic term. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // DELETE — with full fee data guard
// // ════════════════════════════════════════════════════════════════════════════

// export async function deleteAcademicTerm(
//   id: string
// ): Promise<ActionResult<AcademicTerm>> {
//   try {
//     if (!id) return { ok: false, error: "Academic term ID is required" };

//     const existingTerm = await db.academicTerm.findUnique({
//       where: { id },
//       include: {
//         // Published fee structures guard
//         feeStructures: {
//           where: { isPublished: true },
//           select: { id: true, name: true },
//         },
//         // Any financial activity guard
//         studentFeeAccounts: {
//           where: {
//             OR: [{ totalPaid: { gt: 0 } }, { totalInvoiced: { gt: 0 } }],
//           },
//           select: { id: true },
//           take: 1,
//         },
//         _count: {
//           select: {
//             enrollments: true,
//             exams: true,
//             streamSubjects: true,
//           },
//         },
//       },
//     });

//     if (!existingTerm) return { ok: false, error: "Academic term not found" };

//     // Guard: enrollments
//     if (existingTerm._count.enrollments > 0) {
//       return {
//         ok: false,
//         error: `Cannot delete: this term has ${existingTerm._count.enrollments} student enrollment(s)`,
//       };
//     }

//     // Guard: exams
//     if (existingTerm._count.exams > 0) {
//       return {
//         ok: false,
//         error: `Cannot delete: this term has ${existingTerm._count.exams} exam(s)`,
//       };
//     }

//     // Guard: stream subjects
//     if (existingTerm._count.streamSubjects > 0) {
//       return {
//         ok: false,
//         error: `Cannot delete: this term has ${existingTerm._count.streamSubjects} stream subject(s) assigned`,
//       };
//     }

//     // Guard: published fee structures
//     if (existingTerm.feeStructures.length > 0) {
//       const names = existingTerm.feeStructures.map((f) => f.name ?? f.id).join(", ");
//       return {
//         ok: false,
//         error: `Cannot delete: published fee structures exist (${names}). Unpublish them first.`,
//       };
//     }

//     // Guard: financial transaction history
//     if (existingTerm.studentFeeAccounts.length > 0) {
//       return {
//         ok: false,
//         error: "Cannot delete: this term has fee payment history. Archive the academic year instead.",
//       };
//     }

//     const deletedTerm = await db.academicTerm.delete({ where: { id } });

//     revalidatePath("/dashboard/academic-terms");
//     return { ok: true, data: deletedTerm };
//   } catch (error) {
//     console.error("Error deleting academic term:", error);
//     return { ok: false, error: "Failed to delete academic term. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // GET ACTIVE TERM
// // ════════════════════════════════════════════════════════════════════════════

// export async function getActiveAcademicTerm(
//   academicYearId: string
// ): Promise<ActionResult<any>> {
//   try {
//     if (!academicYearId) return { ok: false, error: "Academic year ID is required" };

//     const activeTerm = await db.academicTerm.findFirst({
//       where: { academicYearId, isActive: true },
//       include: {
//         academicYear: {
//           select: { id: true, year: true, schoolId: true },
//         },
//         // Include auto-invoice config — needed by enrollment flow
//         autoInvoiceConfigs: {
//           select: {
//             isEnabled: true,
//             generateOnEnrollment: true,
//             includeCarryForward: true,
//             applyBursaries: true,
//             sendNotification: true,
//           },
//         },
//         feeStructures: {
//           where: { isPublished: true },
//           select: {
//             id: true,
//             classYearId: true,
//             totalAmount: true,
//             isPublished: true,
//           },
//         },
//         _count: {
//           select: {
//             exams: true,
//             enrollments: true,
//             studentFeeAccounts: true,
//           },
//         },
//       },
//     });

//     if (!activeTerm) return { ok: false, error: "No active term found" };

//     return { ok: true, data: activeTerm };
//   } catch (error) {
//     console.error("Error fetching active academic term:", error);
//     return { ok: false, error: "Failed to fetch active academic term" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // GET CURRENT TERM (date-based)
// // ════════════════════════════════════════════════════════════════════════════

// export async function getCurrentAcademicTerm(
//   schoolId: string
// ): Promise<ActionResult<any>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const now = new Date();

//     const currentTerm = await db.academicTerm.findFirst({
//       where: {
//         academicYear: { schoolId, isActive: true },
//         startDate: { lte: now },
//         endDate: { gte: now },
//       },
//       include: {
//         academicYear: {
//           select: { id: true, year: true, schoolId: true },
//         },
//         autoInvoiceConfigs: {
//           select: {
//             isEnabled: true,
//             generateOnEnrollment: true,
//             includeCarryForward: true,
//             applyBursaries: true,
//           },
//         },
//         feeStructures: {
//           where: { isPublished: true },
//           select: { id: true, classYearId: true, totalAmount: true },
//         },
//         _count: {
//           select: { enrollments: true, studentFeeAccounts: true },
//         },
//       },
//     });

//     if (!currentTerm) return { ok: false, error: "No current term found based on dates" };

//     return { ok: true, data: currentTerm };
//   } catch (error) {
//     console.error("Error fetching current academic term:", error);
//     return { ok: false, error: "Failed to fetch current academic term" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // TOGGLE STATUS
// // ════════════════════════════════════════════════════════════════════════════

// export async function toggleAcademicTermStatus(
//   id: string
// ): Promise<ActionResult<AcademicTerm>> {
//   try {
//     if (!id) return { ok: false, error: "Academic term ID is required" };

//     const term = await db.academicTerm.findUnique({ where: { id } });
//     if (!term) return { ok: false, error: "Academic term not found" };

//     return updateAcademicTerm(id, { isActive: !term.isActive });
//   } catch (error) {
//     console.error("Error toggling academic term status:", error);
//     return { ok: false, error: "Failed to toggle term status" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // BULK CREATE
// // ════════════════════════════════════════════════════════════════════════════

// export async function bulkCreateAcademicTerms(
//   academicYearId: string,
//   terms: Array<{
//     name: string;
//     termNumber: number;
//     startDate: Date;
//     endDate: Date;
//   }>
// ): Promise<ActionResult<AcademicTerm[]>> {
//   try {
//     if (!academicYearId) return { ok: false, error: "Academic year ID is required" };
//     if (!terms || terms.length === 0) {
//       return { ok: false, error: "At least one term is required" };
//     }

//     for (const term of terms) {
//       if (!term.name || term.name.trim().length === 0) {
//         return { ok: false, error: "All terms must have a name" };
//       }
//       if (term.startDate >= term.endDate) {
//         return {
//           ok: false,
//           error: `Start date must be before end date for "${term.name}"`,
//         };
//       }
//     }

//     const existingTerms = await db.academicTerm.findMany({
//       where: {
//         academicYearId,
//         termNumber: { in: terms.map((t) => t.termNumber) },
//       },
//       select: { termNumber: true },
//     });

//     if (existingTerms.length > 0) {
//       const existingNumbers = existingTerms.map((t) => t.termNumber).join(", ");
//       return {
//         ok: false,
//         error: `The following term numbers already exist: ${existingNumbers}`,
//       };
//     }

//     const createdTerms = await db.$transaction(
//       terms.map((term, index) =>
//         db.academicTerm.create({
//           data: {
//             name: term.name.trim(),
//             termNumber: term.termNumber,
//             startDate: term.startDate,
//             endDate: term.endDate,
//             isActive: index === 0,
//             academicYearId,
//           },
//         })
//       )
//     );

//     revalidatePath("/dashboard/academic-terms");
//     return { ok: true, data: createdTerms };
//   } catch (error) {
//     console.error("Error bulk creating academic terms:", error);
//     return { ok: false, error: "Failed to create academic terms" };
//   }
// }





"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { AcademicTerm } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type AcademicTermWithRelations = AcademicTerm & {
  academicYear?: {
    id: string;
    year: string;
    schoolId: string;
    isActive: boolean;
    school?: { id: string; name: string; slug: string };
  };
};

// ── Counts available via Prisma _count on AcademicTerm ───────────────────
// All of these are valid back-relations in the schema:
//   exams, enrollments, streamSubjects, assessmentConfigs,
//   feeStructures, studentFeeAccounts
type AcademicTermCounts = {
  exams: number;
  enrollments: number;
  streamSubjects: number;
  assessmentConfigs: number;
  feeStructures: number;
  studentFeeAccounts: number;
};

type AcademicTermWithStats = AcademicTermWithRelations & {
  feeStructures: { id: string; isPublished: boolean }[];
  _count: AcademicTermCounts;
  stats: {
    totalExams: number;
    totalEnrollments: number;
    totalStreamSubjects: number;
    totalAssessmentConfigs: number;
    totalFeeStructures: number;
    totalPublishedFeeStructures: number;
    totalStudentFeeAccounts: number;
    hasData: boolean;
    hasFeeData: boolean;
  };
};

type AcademicTermFeesSummary = AcademicTermWithRelations & {
  feesSummary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;   // sum of positive balances only
    totalOverpaid: number;      // sum of absolute negative balances only
    totalDiscount: number;
    totalWaived: number;
    totalPenalty: number;
    collectionRate: number;
    studentsWithArrears: number;
    studentsCleared: number;
    studentsOverpaid: number;
    autoInvoiceEnabled: boolean;
    autoInvoiceGeneratedCount: number;
    publishedFeeStructures: number;
    totalFeeStructures: number;
  };
};

// Full term detail shape — used instead of any
type AcademicTermDetail = AcademicTermWithRelations & {
  feeStructures: {
    id: string;
    name: string | null;
    isPublished: boolean;
    totalAmount: number;
    classYearId: string;
  }[];
  autoInvoiceConfigs: {
    id: string;
    isEnabled: boolean;
    generateOnEnrollment: boolean;
    generateOnDate: Date | null;
    includeCarryForward: boolean;
    applyBursaries: boolean;
    sendNotification: boolean;
  }[];
  _count: AcademicTermCounts;
};

interface CreateAcademicTermInput {
  academicYearId: string;
  name: string;
  termNumber: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}

interface UpdateAcademicTermInput {
  name?: string;
  termNumber?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════

function validateAcademicTermInput(input: CreateAcademicTermInput): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return "Term name is required";
  }
  if (!input.academicYearId || input.academicYearId.trim().length === 0) {
    return "Academic year ID is required";
  }
  if (!input.termNumber || input.termNumber < 1 || input.termNumber > 3) {
    return "Term number must be between 1 and 3";
  }
  if (!input.startDate || !input.endDate) {
    return "Start date and end date are required";
  }
  if (input.startDate >= input.endDate) {
    return "Start date must be before end date";
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════════════════════════════

export async function createAcademicTerm(
  input: CreateAcademicTermInput
): Promise<ActionResult<AcademicTermWithRelations>> {
  try {
    const validationError = validateAcademicTermInput(input);
    if (validationError) return { ok: false, error: validationError };

    // Schema has @@unique([termNumber, academicYearId]) → Prisma key: termNumber_academicYearId
    const existingTerm = await db.academicTerm.findUnique({
      where: {
        termNumber_academicYearId: {
          termNumber: input.termNumber,
          academicYearId: input.academicYearId,
        },
      },
    });

    if (existingTerm) {
      return {
        ok: false,
        error: `Term ${input.termNumber} already exists for this academic year`,
      };
    }

    const newTerm = await db.$transaction(async (tx) => {
      if (input.isActive) {
        await tx.academicTerm.updateMany({
          where: { academicYearId: input.academicYearId, isActive: true },
          data: { isActive: false },
        });
      }

      const term = await tx.academicTerm.create({
        data: {
          name: input.name.trim(),
          termNumber: input.termNumber,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: input.isActive ?? true,
          academicYearId: input.academicYearId,
        },
        include: {
          academicYear: {
            select: { id: true, year: true, schoolId: true, isActive: true },
          },
        },
      });

      // Auto-create AutoInvoiceConfig enabled by default for every new term
      await tx.autoInvoiceConfig.upsert({
        where: {
          schoolId_academicYearId_termId: {
            schoolId:       term.academicYear.schoolId,
            academicYearId: input.academicYearId,
            termId:         term.id,
          },
        },
        create: {
          schoolId:            term.academicYear.schoolId,
          academicYearId:      input.academicYearId,
          termId:              term.id,
          isEnabled:           true,
          generateOnEnrollment: true,
          includeCarryForward: true,
          applyBursaries:      true,
          sendNotification:    false,
        },
        update: {}, // don't overwrite if already exists
      });

      return term;
    });

    revalidatePath("/dashboard/academic-terms");
    return { ok: true, data: newTerm };
  } catch (error) {
    console.error("Error creating academic term:", error);
    return { ok: false, error: "Failed to create academic term. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — ALL TERMS FOR A YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicTermsByYear(
  academicYearId: string
): Promise<ActionResult<AcademicTermWithStats[]>> {
  try {
    if (!academicYearId) return { ok: false, error: "Academic year ID is required" };

    const terms = await db.academicTerm.findMany({
      where: { academicYearId },
      orderBy: { termNumber: "asc" },
      include: {
        academicYear: {
          select: { id: true, year: true, schoolId: true, isActive: true },
        },
        feeStructures: {
          select: { id: true, isPublished: true, totalAmount: true, classYearId: true },
        },
        autoInvoiceConfigs: {
          select: { id: true, isEnabled: true, generateOnEnrollment: true },
        },
        _count: {
          select: {
            exams: true,
            enrollments: true,
            streamSubjects: true,
            assessmentConfigs: true,
            feeStructures: true,
            studentFeeAccounts: true,
          },
        },
      },
    });

    // FIX [note — type safety]: compute stats on the shaped data
    const termsWithStats: AcademicTermWithStats[] = terms.map((term) => ({
      ...term,
      stats: {
        totalExams: term._count.exams,
        totalEnrollments: term._count.enrollments,
        totalStreamSubjects: term._count.streamSubjects,
        totalAssessmentConfigs: term._count.assessmentConfigs,
        totalFeeStructures: term._count.feeStructures,
        totalPublishedFeeStructures: term.feeStructures.filter((f) => f.isPublished).length,
        totalStudentFeeAccounts: term._count.studentFeeAccounts,
        hasData:
          term._count.enrollments > 0 ||
          term._count.exams > 0 ||
          term._count.streamSubjects > 0,
        hasFeeData: term._count.studentFeeAccounts > 0,
      },
    }));

    return { ok: true, data: termsWithStats };
  } catch (error) {
    console.error("Error fetching academic terms:", error);
    return { ok: false, error: "Failed to fetch academic terms" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — ALL TERMS FOR A SCHOOL
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicTermsBySchool(
  schoolId: string
): Promise<ActionResult<AcademicTermWithStats[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const terms = await db.academicTerm.findMany({
      where: { academicYear: { schoolId } },
      orderBy: [
        { academicYear: { year: "desc" } },
        { termNumber: "asc" },
      ],
      include: {
        academicYear: {
          select: { id: true, year: true, schoolId: true, isActive: true },
        },
        feeStructures: {
          select: { id: true, isPublished: true },
        },
        _count: {
          select: {
            exams: true,
            enrollments: true,
            streamSubjects: true,
            assessmentConfigs: true,
            feeStructures: true,
            studentFeeAccounts: true,
          },
        },
      },
    });

    const termsWithStats: AcademicTermWithStats[] = terms.map((term) => ({
      ...term,
      stats: {
        totalExams: term._count.exams,
        totalEnrollments: term._count.enrollments,
        totalStreamSubjects: term._count.streamSubjects,
        totalAssessmentConfigs: term._count.assessmentConfigs,
        totalFeeStructures: term._count.feeStructures,
        totalPublishedFeeStructures: term.feeStructures.filter((f) => f.isPublished).length,
        totalStudentFeeAccounts: term._count.studentFeeAccounts,
        hasData:
          term._count.enrollments > 0 ||
          term._count.exams > 0 ||
          term._count.streamSubjects > 0,
        hasFeeData: term._count.studentFeeAccounts > 0,
      },
    }));

    return { ok: true, data: termsWithStats };
  } catch (error) {
    console.error("Error fetching academic terms by school:", error);
    return { ok: false, error: "Failed to fetch academic terms" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — WITH STATS (listing pages)
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicTermsWithStats(
  schoolId: string
): Promise<ActionResult<AcademicTermWithStats[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const terms = await db.academicTerm.findMany({
      where: { academicYear: { schoolId } },
      orderBy: [
        { academicYear: { isActive: "desc" } },
        { academicYear: { year: "desc" } },
        { termNumber: "asc" },
      ],
      include: {
        academicYear: {
          select: { id: true, year: true, schoolId: true, isActive: true },
        },
        feeStructures: {
          select: { id: true, isPublished: true },
        },
        _count: {
          select: {
            exams: true,
            enrollments: true,
            streamSubjects: true,
            assessmentConfigs: true,
            feeStructures: true,
            studentFeeAccounts: true,
          },
        },
      },
    });

    const termsWithStats: AcademicTermWithStats[] = terms.map((term) => ({
      ...term,
      stats: {
        totalExams: term._count.exams,
        totalEnrollments: term._count.enrollments,
        totalStreamSubjects: term._count.streamSubjects,
        totalAssessmentConfigs: term._count.assessmentConfigs,
        totalFeeStructures: term._count.feeStructures,
        totalPublishedFeeStructures: term.feeStructures.filter((f) => f.isPublished).length,
        totalStudentFeeAccounts: term._count.studentFeeAccounts,
        hasData:
          term._count.enrollments > 0 ||
          term._count.exams > 0 ||
          term._count.streamSubjects > 0,
        hasFeeData: term._count.studentFeeAccounts > 0,
      },
    }));

    return { ok: true, data: termsWithStats };
  } catch (error) {
    console.error("Error fetching academic terms with stats:", error);
    return { ok: false, error: "Failed to fetch academic terms" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — SINGLE TERM
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicTermById(
  id: string
): Promise<ActionResult<AcademicTermDetail>> {
  try {
    if (!id) return { ok: false, error: "Academic term ID is required" };

    const term = await db.academicTerm.findUnique({
      where: { id },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            schoolId: true,
            isActive: true,
            school: { select: { id: true, name: true, slug: true } },
          },
        },
        feeStructures: {
          select: {
            id: true,
            name: true,
            isPublished: true,
            totalAmount: true,
            classYearId: true,
          },
        },
        autoInvoiceConfigs: {
          select: {
            id: true,
            isEnabled: true,
            generateOnEnrollment: true,
            generateOnDate: true,
            includeCarryForward: true,
            applyBursaries: true,
            sendNotification: true,
          },
        },
        _count: {
          select: {
            exams: true,
            enrollments: true,
            streamSubjects: true,
            assessmentConfigs: true,
            feeStructures: true,
            studentFeeAccounts: true,
          },
        },
      },
    });

    if (!term) return { ok: false, error: "Academic term not found" };

    return { ok: true, data: term };
  } catch (error) {
    console.error("Error fetching academic term:", error);
    return { ok: false, error: "Failed to fetch academic term" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — FEES SUMMARY FOR A TERM
// ════════════════════════════════════════════════════════════════════════════

export async function getAcademicTermWithFeesSummary(
  id: string
): Promise<ActionResult<AcademicTermFeesSummary>> {
  try {
    if (!id) return { ok: false, error: "Academic term ID is required" };

    const term = await db.academicTerm.findUnique({
      where: { id },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            schoolId: true,
            isActive: true,
            school: { select: { id: true, name: true, slug: true } },
          },
        },
        feeStructures: {
          select: { id: true, isPublished: true, totalAmount: true, classYearId: true },
        },
        autoInvoiceConfigs: {
          select: { isEnabled: true, generateOnEnrollment: true },
        },
      },
    });

    if (!term) return { ok: false, error: "Academic term not found" };

    // Aggregate non-balance totals
    const feeAgg = await db.studentFeeAccount.aggregate({
      where: { termId: id },
      _sum: {
        totalInvoiced: true,
        totalPaid: true,
        totalDiscount: true,
        totalWaived: true,
        totalPenalty: true,
      },
    });

    // FIX [note]: separate outstanding and overpaid instead of net sum
    const [outstandingAgg, overpaidAgg] = await Promise.all([
      db.studentFeeAccount.aggregate({
        where: { termId: id, balance: { gt: 0 } },
        _sum: { balance: true },
      }),
      db.studentFeeAccount.aggregate({
        where: { termId: id, balance: { lt: 0 } },
        _sum: { balance: true },
      }),
    ]);

    const autoInvoiceGeneratedCount = await db.studentFeeAccount.count({
      where: { termId: id, autoInvoiceGenerated: true },
    });

    const [studentsWithArrears, studentsCleared, studentsOverpaid] = await Promise.all([
      db.studentFeeAccount.count({
        where: { termId: id, balance: { gt: 0 } },
      }),
      db.studentFeeAccount.count({
        where: { termId: id, status: "CLEARED" },
      }),
      db.studentFeeAccount.count({
        where: { termId: id, status: "OVERPAID" },
      }),
    ]);

    const totalInvoiced = feeAgg._sum.totalInvoiced ?? 0;
    const totalCollected = feeAgg._sum.totalPaid ?? 0;
    const collectionRate =
      totalInvoiced > 0
        ? Math.round((totalCollected / totalInvoiced) * 100 * 10) / 10
        : 0;

    const publishedFeeStructures = term.feeStructures.filter((f) => f.isPublished).length;
    const autoInvoiceEnabled = term.autoInvoiceConfigs.some((c) => c.isEnabled);

    return {
      ok: true,
      data: {
        ...term,
        feesSummary: {
          totalInvoiced,
          totalCollected,
          totalOutstanding: outstandingAgg._sum.balance ?? 0,
          totalOverpaid: Math.abs(overpaidAgg._sum.balance ?? 0),
          totalDiscount: feeAgg._sum.totalDiscount ?? 0,
          totalWaived: feeAgg._sum.totalWaived ?? 0,
          totalPenalty: feeAgg._sum.totalPenalty ?? 0,
          collectionRate,
          studentsWithArrears,
          studentsCleared,
          studentsOverpaid,
          autoInvoiceEnabled,
          autoInvoiceGeneratedCount,
          publishedFeeStructures,
          totalFeeStructures: term.feeStructures.length,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching term fees summary:", error);
    return { ok: false, error: "Failed to fetch fees summary" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════════════════════════════════════════

export async function updateAcademicTerm(
  id: string,
  data: UpdateAcademicTermInput
): Promise<ActionResult<AcademicTerm>> {
  try {
    if (!id) return { ok: false, error: "Academic term ID is required" };

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      return { ok: false, error: "Start date must be before end date" };
    }

    const existingTerm = await db.academicTerm.findUnique({ where: { id } });
    if (!existingTerm) return { ok: false, error: "Academic term not found" };

    if (data.termNumber !== undefined && data.termNumber !== existingTerm.termNumber) {
      const duplicate = await db.academicTerm.findUnique({
        where: {
          termNumber_academicYearId: {
            termNumber: data.termNumber,
            academicYearId: existingTerm.academicYearId,
          },
        },
      });
      if (duplicate) {
        return {
          ok: false,
          error: `Term ${data.termNumber} already exists for this academic year`,
        };
      }
    }

    const updatedTerm = await db.$transaction(async (tx) => {
      if (data.isActive === true) {
        await tx.academicTerm.updateMany({
          where: { academicYearId: existingTerm.academicYearId, id: { not: id } },
          data: { isActive: false },
        });
      }

      return tx.academicTerm.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.termNumber !== undefined && { termNumber: data.termNumber }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          updatedAt: new Date(),
        },
      });
    });

    revalidatePath("/dashboard/academic-terms");
    revalidatePath(`/dashboard/academic-terms/${id}`);
    return { ok: true, data: updatedTerm };
  } catch (error) {
    console.error("Error updating academic term:", error);
    return { ok: false, error: "Failed to update academic term. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE — with full fee data guard
// ════════════════════════════════════════════════════════════════════════════

export async function deleteAcademicTerm(
  id: string
): Promise<ActionResult<AcademicTerm>> {
  try {
    if (!id) return { ok: false, error: "Academic term ID is required" };

    const existingTerm = await db.academicTerm.findUnique({
      where: { id },
      include: {
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
        _count: {
          select: {
            enrollments: true,
            exams: true,
            streamSubjects: true,
          },
        },
      },
    });

    if (!existingTerm) return { ok: false, error: "Academic term not found" };

    if (existingTerm._count.enrollments > 0) {
      return {
        ok: false,
        error: `Cannot delete: this term has ${existingTerm._count.enrollments} student enrollment(s)`,
      };
    }

    if (existingTerm._count.exams > 0) {
      return {
        ok: false,
        error: `Cannot delete: this term has ${existingTerm._count.exams} exam(s)`,
      };
    }

    if (existingTerm._count.streamSubjects > 0) {
      return {
        ok: false,
        error: `Cannot delete: this term has ${existingTerm._count.streamSubjects} stream subject(s) assigned`,
      };
    }

    if (existingTerm.feeStructures.length > 0) {
      const names = existingTerm.feeStructures.map((f) => f.name ?? f.id).join(", ");
      return {
        ok: false,
        error: `Cannot delete: published fee structures exist (${names}). Unpublish them first.`,
      };
    }

    if (existingTerm.studentFeeAccounts.length > 0) {
      return {
        ok: false,
        error: "Cannot delete: this term has fee payment history. Archive the academic year instead.",
      };
    }

    const deletedTerm = await db.academicTerm.delete({ where: { id } });

    revalidatePath("/dashboard/academic-terms");
    return { ok: true, data: deletedTerm };
  } catch (error) {
    console.error("Error deleting academic term:", error);
    return { ok: false, error: "Failed to delete academic term. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET ACTIVE TERM
// ════════════════════════════════════════════════════════════════════════════

export async function getActiveAcademicTerm(
  academicYearId: string
): Promise<ActionResult<AcademicTermDetail>> {
  try {
    if (!academicYearId) return { ok: false, error: "Academic year ID is required" };

    const activeTerm = await db.academicTerm.findFirst({
      where: { academicYearId, isActive: true },
      include: {
        academicYear: {
          select: { id: true, year: true, schoolId: true, isActive: true },
        },
        autoInvoiceConfigs: {
          select: {
            id: true,
            isEnabled: true,
            generateOnEnrollment: true,
            generateOnDate: true,
            includeCarryForward: true,
            applyBursaries: true,
            sendNotification: true,
          },
        },
        feeStructures: {
          where: { isPublished: true },
          select: {
            id: true,
            name: true,
            isPublished: true,
            totalAmount: true,
            classYearId: true,
          },
        },
        _count: {
          select: {
            exams: true,
            enrollments: true,
            streamSubjects: true,
            assessmentConfigs: true,
            feeStructures: true,
            studentFeeAccounts: true,
          },
        },
      },
    });

    if (!activeTerm) return { ok: false, error: "No active term found" };

    return { ok: true, data: activeTerm };
  } catch (error) {
    console.error("Error fetching active academic term:", error);
    return { ok: false, error: "Failed to fetch active academic term" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET CURRENT TERM (date-based)
// FIX [6]: fallback was calling getActiveAcademicYear (wrong module, wrong type).
//          Now correctly calls getActiveAcademicTerm with the active year's id.
// ════════════════════════════════════════════════════════════════════════════

export async function getCurrentAcademicTerm(
  schoolId: string
): Promise<ActionResult<AcademicTermDetail>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const now = new Date();

    const currentTerm = await db.academicTerm.findFirst({
      where: {
        academicYear: { schoolId, isActive: true },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        academicYear: {
          select: { id: true, year: true, schoolId: true, isActive: true },
        },
        autoInvoiceConfigs: {
          select: {
            id: true,
            isEnabled: true,
            generateOnEnrollment: true,
            generateOnDate: true,
            includeCarryForward: true,
            applyBursaries: true,
            sendNotification: true,
          },
        },
        feeStructures: {
          where: { isPublished: true },
          select: {
            id: true,
            name: true,
            isPublished: true,
            totalAmount: true,
            classYearId: true,
          },
        },
        _count: {
          select: {
            exams: true,
            enrollments: true,
            streamSubjects: true,
            assessmentConfigs: true,
            feeStructures: true,
            studentFeeAccounts: true,
          },
        },
      },
    });

    if (currentTerm) return { ok: true, data: currentTerm };

    // FIX [6]: fallback to the active term of the active year for this school —
    // NOT to getActiveAcademicYear (which returns an AcademicYear, not a term)
    const activeYear = await db.academicYear.findFirst({
      where: { schoolId, isActive: true },
      select: { id: true },
    });

    if (!activeYear) {
      return { ok: false, error: "No active academic year or current term found" };
    }

    return getActiveAcademicTerm(activeYear.id);
  } catch (error) {
    console.error("Error fetching current academic term:", error);
    return { ok: false, error: "Failed to fetch current academic term" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function toggleAcademicTermStatus(
  id: string
): Promise<ActionResult<AcademicTerm>> {
  try {
    if (!id) return { ok: false, error: "Academic term ID is required" };

    const term = await db.academicTerm.findUnique({ where: { id } });
    if (!term) return { ok: false, error: "Academic term not found" };

    return updateAcademicTerm(id, { isActive: !term.isActive });
  } catch (error) {
    console.error("Error toggling academic term status:", error);
    return { ok: false, error: "Failed to toggle term status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK CREATE
// FIX [5]: deactivate existing active term before activating terms[0]
// ════════════════════════════════════════════════════════════════════════════

export async function bulkCreateAcademicTerms(
  academicYearId: string,
  terms: Array<{
    name: string;
    termNumber: number;
    startDate: Date;
    endDate: Date;
  }>
): Promise<ActionResult<AcademicTerm[]>> {
  try {
    if (!academicYearId) return { ok: false, error: "Academic year ID is required" };
    if (!terms || terms.length === 0) {
      return { ok: false, error: "At least one term is required" };
    }

    for (const term of terms) {
      if (!term.name || term.name.trim().length === 0) {
        return { ok: false, error: "All terms must have a name" };
      }
      if (term.startDate >= term.endDate) {
        return {
          ok: false,
          error: `Start date must be before end date for "${term.name}"`,
        };
      }
    }

    const existingTerms = await db.academicTerm.findMany({
      where: {
        academicYearId,
        termNumber: { in: terms.map((t) => t.termNumber) },
      },
      select: { termNumber: true },
    });

    if (existingTerms.length > 0) {
      const existingNumbers = existingTerms.map((t) => t.termNumber).join(", ");
      return {
        ok: false,
        error: `The following term numbers already exist: ${existingNumbers}`,
      };
    }

    const createdTerms = await db.$transaction(async (tx) => {
      // FIX [5]: deactivate all existing active terms in this year before
      // activating the first term in the new batch
      await tx.academicTerm.updateMany({
        where: { academicYearId, isActive: true },
        data: { isActive: false },
      });

      const year = await tx.academicYear.findUnique({
        where:  { id: academicYearId },
        select: { schoolId: true },
      });

      const created = await Promise.all(
        terms.map((term, index) =>
          tx.academicTerm.create({
            data: {
              name: term.name.trim(),
              termNumber: term.termNumber,
              startDate: term.startDate,
              endDate: term.endDate,
              // Only the first term in the batch becomes active
              isActive: index === 0,
              academicYearId,
            },
          })
        )
      );

      // Auto-create AutoInvoiceConfig (enabled) for each new term
      if (year?.schoolId) {
        await Promise.all(
          created.map(t =>
            tx.autoInvoiceConfig.upsert({
              where: {
                schoolId_academicYearId_termId: {
                  schoolId: year.schoolId,
                  academicYearId,
                  termId: t.id,
                },
              },
              create: {
                schoolId:             year.schoolId,
                academicYearId,
                termId:               t.id,
                isEnabled:            true,
                generateOnEnrollment: true,
                includeCarryForward:  true,
                applyBursaries:       true,
                sendNotification:     false,
              },
              update: {},
            })
          )
        );
      }

      return created;
    });

    revalidatePath("/dashboard/academic-terms");
    return { ok: true, data: createdTerms };
  } catch (error) {
    console.error("Error bulk creating academic terms:", error);
    return { ok: false, error: "Failed to create academic terms" };
  }
}