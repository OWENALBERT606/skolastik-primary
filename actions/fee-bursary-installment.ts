// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import {
//   Bursary,
//   StudentBursary,
//   BursaryAllocation,
//   InstallmentPlan,
//   Installment,
//   PenaltyRule,
//   AutoInvoiceConfig,
//   CarryForwardLog,
//   TransactionType,
//   AccountStatus,
// } from "@prisma/client";
// import { recalculateAccountBalance } from "./fee-account-invoice";

// // ════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ════════════════════════════════════════════════════════════════════════════

// type ActionResult<T> =
//   | { ok: true; data: T }
//   | { ok: false; error: string };

// // ════════════════════════════════════════════════════════════════════════════
// // ██████████████████████████████████████████████████████████████████████████
// // BURSARY
// // ██████████████████████████████████████████████████████████████████████████
// // ════════════════════════════════════════════════════════════════════════════

// interface CreateBursaryInput {
//   schoolId: string;
//   name: string;
//   code: string;
//   description?: string;
//   percentage?: number;   // e.g. 50 = 50% off
//   fixedAmount?: number;  // e.g. 200000 UGX fixed discount
// }

// interface UpdateBursaryInput {
//   name?: string;
//   description?: string;
//   percentage?: number;
//   fixedAmount?: number;
//   isActive?: boolean;
// }

// // ─── CREATE ─────────────────────────────────────────────────────────────────

// export async function createBursary(
//   input: CreateBursaryInput
// ): Promise<ActionResult<Bursary>> {
//   try {
//     if (!input.schoolId) return { ok: false, error: "School ID is required" };
//     if (!input.name || input.name.trim().length === 0) return { ok: false, error: "Bursary name is required" };
//     if (!input.code || input.code.trim().length === 0) return { ok: false, error: "Bursary code is required" };

//     if (!input.percentage && !input.fixedAmount) {
//       return { ok: false, error: "Either a percentage or a fixed amount is required" };
//     }
//     if (input.percentage && input.fixedAmount) {
//       return { ok: false, error: "Provide either a percentage or a fixed amount, not both" };
//     }
//     if (input.percentage && (input.percentage <= 0 || input.percentage > 100)) {
//       return { ok: false, error: "Percentage must be between 1 and 100" };
//     }
//     if (input.fixedAmount && input.fixedAmount <= 0) {
//       return { ok: false, error: "Fixed amount must be greater than zero" };
//     }

//     const code = input.code.trim().toUpperCase();
//     const existing = await db.bursary.findUnique({
//       where: { schoolId_code: { schoolId: input.schoolId, code } },
//     });
//     if (existing) return { ok: false, error: `A bursary with code '${code}' already exists` };

//     const bursary = await db.bursary.create({
//       data: {
//         schoolId: input.schoolId,
//         name: input.name.trim(),
//         code,
//         description: input.description?.trim(),
//         percentage: input.percentage,
//         fixedAmount: input.fixedAmount,
//       },
//     });

//     revalidatePath("/dashboard/fees/bursaries");
//     return { ok: true, data: bursary };
//   } catch (error) {
//     console.error("Error creating bursary:", error);
//     return { ok: false, error: "Failed to create bursary. Please try again." };
//   }
// }

// // ─── READ ───────────────────────────────────────────────────────────────────

// export async function getBursariesBySchool(
//   schoolId: string,
//   activeOnly = false
// ): Promise<ActionResult<(Bursary & { _count: { studentBursaries: number; allocations: number } })[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const bursaries = await db.bursary.findMany({
//       where: { schoolId, ...(activeOnly && { isActive: true }) },
//       orderBy: { name: "asc" },
//       include: {
//         _count: { select: { studentBursaries: true, allocations: true } },
//       },
//     });

//     return { ok: true, data: bursaries };
//   } catch (error) {
//     console.error("Error fetching bursaries:", error);
//     return { ok: false, error: "Failed to fetch bursaries" };
//   }
// }

// // ─── UPDATE ──────────────────────────────────────────────────────────────────

// export async function updateBursary(
//   id: string,
//   data: UpdateBursaryInput
// ): Promise<ActionResult<Bursary>> {
//   try {
//     if (!id) return { ok: false, error: "Bursary ID is required" };

//     const existing = await db.bursary.findUnique({ where: { id } });
//     if (!existing) return { ok: false, error: "Bursary not found" };

//     if (data.percentage && data.fixedAmount) {
//       return { ok: false, error: "Provide either a percentage or a fixed amount, not both" };
//     }
//     if (data.percentage !== undefined && data.percentage !== null) {
//       if (data.percentage <= 0 || data.percentage > 100) {
//         return { ok: false, error: "Percentage must be between 1 and 100" };
//       }
//     }
//     if (data.fixedAmount !== undefined && data.fixedAmount !== null) {
//       if (data.fixedAmount <= 0) {
//         return { ok: false, error: "Fixed amount must be greater than zero" };
//       }
//     }

//     const updated = await db.bursary.update({
//       where: { id },
//       data: {
//         ...(data.name && { name: data.name.trim() }),
//         ...(data.description !== undefined && { description: data.description?.trim() }),
//         ...(data.percentage !== undefined && { percentage: data.percentage, fixedAmount: null }),
//         ...(data.fixedAmount !== undefined && { fixedAmount: data.fixedAmount, percentage: null }),
//         ...(data.isActive !== undefined && { isActive: data.isActive }),
//       },
//     });

//     revalidatePath("/dashboard/fees/bursaries");
//     return { ok: true, data: updated };
//   } catch (error) {
//     console.error("Error updating bursary:", error);
//     return { ok: false, error: "Failed to update bursary. Please try again." };
//   }
// }

// // ─── DELETE ──────────────────────────────────────────────────────────────────

// export async function deleteBursary(id: string): Promise<ActionResult<Bursary>> {
//   try {
//     if (!id) return { ok: false, error: "Bursary ID is required" };

//     const existing = await db.bursary.findUnique({
//       where: { id },
//       include: { _count: { select: { allocations: true, studentBursaries: true } } },
//     });
//     if (!existing) return { ok: false, error: "Bursary not found" };

//     if (existing._count.allocations > 0) {
//       return {
//         ok: false,
//         error: `Cannot delete: this bursary has been applied ${existing._count.allocations} time(s). Deactivate it instead.`,
//       };
//     }
//     if (existing._count.studentBursaries > 0) {
//       return {
//         ok: false,
//         error: `Cannot delete: ${existing._count.studentBursaries} student(s) are assigned this bursary. Remove assignments first.`,
//       };
//     }

//     const deleted = await db.bursary.delete({ where: { id } });
//     revalidatePath("/dashboard/fees/bursaries");
//     return { ok: true, data: deleted };
//   } catch (error) {
//     console.error("Error deleting bursary:", error);
//     return { ok: false, error: "Failed to delete bursary. Please try again." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STUDENT BURSARY — assign / revoke bursary to a student
// // ════════════════════════════════════════════════════════════════════════════

// export async function assignBursaryToStudent(input: {
//   studentId: string;
//   bursaryId: string;
//   schoolId: string;
//   validFrom?: Date;
//   validUntil?: Date;
//   approvedById?: string;
//   notes?: string;
// }): Promise<ActionResult<StudentBursary>> {
//   try {
//     if (!input.studentId) return { ok: false, error: "Student ID is required" };
//     if (!input.bursaryId) return { ok: false, error: "Bursary ID is required" };
//     if (!input.schoolId) return { ok: false, error: "School ID is required" };

//     const bursary = await db.bursary.findUnique({
//       where: { id: input.bursaryId },
//       select: { id: true, isActive: true, schoolId: true },
//     });
//     if (!bursary) return { ok: false, error: "Bursary not found" };
//     if (!bursary.isActive) return { ok: false, error: "Cannot assign an inactive bursary" };
//     if (bursary.schoolId !== input.schoolId) {
//       return { ok: false, error: "Bursary does not belong to this school" };
//     }

//     const existing = await db.studentBursary.findUnique({
//       where: { studentId_bursaryId: { studentId: input.studentId, bursaryId: input.bursaryId } },
//     });
//     if (existing) {
//       return { ok: false, error: "Student already has this bursary assigned" };
//     }

//     const assignment = await db.studentBursary.create({
//       data: {
//         studentId: input.studentId,
//         bursaryId: input.bursaryId,
//         schoolId: input.schoolId,
//         validFrom: input.validFrom ?? new Date(),
//         validUntil: input.validUntil,
//         approvedById: input.approvedById,
//         notes: input.notes?.trim(),
//       },
//     });

//     revalidatePath(`/dashboard/fees/students/${input.studentId}`);
//     return { ok: true, data: assignment };
//   } catch (error) {
//     console.error("Error assigning bursary:", error);
//     return { ok: false, error: "Failed to assign bursary. Please try again." };
//   }
// }

// export async function revokeBursaryFromStudent(
//   studentBursaryId: string
// ): Promise<ActionResult<StudentBursary>> {
//   try {
//     if (!studentBursaryId) return { ok: false, error: "Student bursary ID is required" };

//     const existing = await db.studentBursary.findUnique({
//       where: { id: studentBursaryId },
//       include: { _count: { select: { allocations: true } } },
//     });
//     if (!existing) return { ok: false, error: "Student bursary assignment not found" };

//     if (existing._count.allocations > 0) {
//       // Soft revoke — set inactive and expiry
//       const revoked = await db.studentBursary.update({
//         where: { id: studentBursaryId },
//         data: { isActive: false, validUntil: new Date() },
//       });
//       revalidatePath(`/dashboard/fees/students/${existing.studentId}`);
//       return { ok: true, data: revoked };
//     }

//     const deleted = await db.studentBursary.delete({ where: { id: studentBursaryId } });
//     revalidatePath(`/dashboard/fees/students/${existing.studentId}`);
//     return { ok: true, data: deleted };
//   } catch (error) {
//     console.error("Error revoking bursary:", error);
//     return { ok: false, error: "Failed to revoke bursary. Please try again." };
//   }
// }

// export async function getStudentBursaries(
//   studentId: string
// ): Promise<ActionResult<(StudentBursary & { bursary: Bursary })[]>> {
//   try {
//     if (!studentId) return { ok: false, error: "Student ID is required" };

//     const bursaries = await db.studentBursary.findMany({
//       where: { studentId, isActive: true },
//       include: { bursary: true },
//       orderBy: { createdAt: "desc" },
//     });

//     return { ok: true, data: bursaries };
//   } catch (error) {
//     console.error("Error fetching student bursaries:", error);
//     return { ok: false, error: "Failed to fetch student bursaries" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ██████████████████████████████████████████████████████████████████████████
// // INSTALLMENT PLAN
// // ██████████████████████████████████████████████████████████████████████████
// // ════════════════════════════════════════════════════════════════════════════

// interface CreateInstallmentPlanInput {
//   studentFeeAccountId: string;
//   name: string;
//   installments: Array<{ amount: number; dueDate: Date }>;
//   createdById: string;
// }

// export async function createInstallmentPlan(
//   input: CreateInstallmentPlanInput
// ): Promise<ActionResult<InstallmentPlan & { installments: Installment[] }>> {
//   try {
//     if (!input.studentFeeAccountId) return { ok: false, error: "Account ID is required" };
//     if (!input.name || input.name.trim().length === 0) return { ok: false, error: "Plan name is required" };
//     if (!input.installments || input.installments.length < 2) {
//       return { ok: false, error: "At least 2 installments are required" };
//     }
//     if (!input.createdById) return { ok: false, error: "User ID is required" };

//     for (const inst of input.installments) {
//       if (inst.amount <= 0) return { ok: false, error: "Each installment amount must be greater than zero" };
//       if (!inst.dueDate) return { ok: false, error: "Each installment must have a due date" };
//     }

//     const account = await db.studentFeeAccount.findUnique({
//       where: { id: input.studentFeeAccountId },
//       select: { id: true, balance: true },
//     });
//     if (!account) return { ok: false, error: "Student fee account not found" };

//     const totalAmount = input.installments.reduce((sum, i) => sum + i.amount, 0);

//     if (totalAmount > account.balance) {
//       return {
//         ok: false,
//         error: `Installment total (${totalAmount}) exceeds account balance (${account.balance})`,
//       };
//     }

//     const plan = await db.installmentPlan.create({
//       data: {
//         studentFeeAccountId: input.studentFeeAccountId,
//         name: input.name.trim(),
//         totalAmount,
//         createdById: input.createdById,
//         installments: {
//           create: input.installments.map((inst, index) => ({
//             installmentNumber: index + 1,
//             amount: inst.amount,
//             dueDate: inst.dueDate,
//           })),
//         },
//       },
//       include: { installments: { orderBy: { installmentNumber: "asc" } } },
//     });

//     revalidatePath(`/dashboard/fees/accounts/${input.studentFeeAccountId}`);
//     return { ok: true, data: plan };
//   } catch (error) {
//     console.error("Error creating installment plan:", error);
//     return { ok: false, error: "Failed to create installment plan. Please try again." };
//   }
// }

// export async function markInstallmentPaid(
//   installmentId: string,
//   transactionId: string
// ): Promise<ActionResult<Installment>> {
//   try {
//     if (!installmentId) return { ok: false, error: "Installment ID is required" };
//     if (!transactionId) return { ok: false, error: "Transaction ID is required" };

//     const installment = await db.installment.findUnique({ where: { id: installmentId } });
//     if (!installment) return { ok: false, error: "Installment not found" };
//     if (installment.isPaid) return { ok: false, error: "Installment is already marked as paid" };

//     const updated = await db.installment.update({
//       where: { id: installmentId },
//       data: { isPaid: true, paidAt: new Date(), transactionId },
//     });

//     return { ok: true, data: updated };
//   } catch (error) {
//     console.error("Error marking installment as paid:", error);
//     return { ok: false, error: "Failed to update installment" };
//   }
// }

// export async function getInstallmentPlansByAccount(
//   studentFeeAccountId: string
// ): Promise<ActionResult<(InstallmentPlan & { installments: Installment[] })[]>> {
//   try {
//     if (!studentFeeAccountId) return { ok: false, error: "Account ID is required" };

//     const plans = await db.installmentPlan.findMany({
//       where: { studentFeeAccountId },
//       include: { installments: { orderBy: { installmentNumber: "asc" } } },
//       orderBy: { createdAt: "desc" },
//     });

//     return { ok: true, data: plans };
//   } catch (error) {
//     console.error("Error fetching installment plans:", error);
//     return { ok: false, error: "Failed to fetch installment plans" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ██████████████████████████████████████████████████████████████████████████
// // PENALTY RULE
// // ██████████████████████████████████████████████████████████████████████████
// // ════════════════════════════════════════════════════════════════════════════

// interface CreatePenaltyRuleInput {
//   schoolId: string;
//   name: string;
//   description?: string;
//   daysOverdue: number;
//   percentage?: number;
//   fixedAmount?: number;
//   isRecurring?: boolean;
// }

// export async function createPenaltyRule(
//   input: CreatePenaltyRuleInput
// ): Promise<ActionResult<PenaltyRule>> {
//   try {
//     if (!input.schoolId) return { ok: false, error: "School ID is required" };
//     if (!input.name || input.name.trim().length === 0) return { ok: false, error: "Rule name is required" };
//     if (!input.daysOverdue || input.daysOverdue < 1) {
//       return { ok: false, error: "Days overdue must be at least 1" };
//     }
//     if (!input.percentage && !input.fixedAmount) {
//       return { ok: false, error: "Either a percentage or a fixed amount is required" };
//     }
//     if (input.percentage && input.fixedAmount) {
//       return { ok: false, error: "Provide either a percentage or a fixed amount, not both" };
//     }
//     if (input.percentage && (input.percentage <= 0 || input.percentage > 100)) {
//       return { ok: false, error: "Percentage must be between 1 and 100" };
//     }
//     if (input.fixedAmount && input.fixedAmount <= 0) {
//       return { ok: false, error: "Fixed amount must be greater than zero" };
//     }

//     const rule = await db.penaltyRule.create({
//       data: {
//         schoolId: input.schoolId,
//         name: input.name.trim(),
//         description: input.description?.trim(),
//         daysOverdue: input.daysOverdue,
//         percentage: input.percentage,
//         fixedAmount: input.fixedAmount,
//         isRecurring: input.isRecurring ?? false,
//       },
//     });

//     revalidatePath("/dashboard/fees/penalty-rules");
//     return { ok: true, data: rule };
//   } catch (error) {
//     console.error("Error creating penalty rule:", error);
//     return { ok: false, error: "Failed to create penalty rule. Please try again." };
//   }
// }

// export async function getPenaltyRules(
//   schoolId: string
// ): Promise<ActionResult<PenaltyRule[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const rules = await db.penaltyRule.findMany({
//       where: { schoolId },
//       orderBy: [{ isActive: "desc" }, { daysOverdue: "asc" }],
//     });

//     return { ok: true, data: rules };
//   } catch (error) {
//     console.error("Error fetching penalty rules:", error);
//     return { ok: false, error: "Failed to fetch penalty rules" };
//   }
// }

// export async function togglePenaltyRuleStatus(
//   id: string
// ): Promise<ActionResult<PenaltyRule>> {
//   try {
//     if (!id) return { ok: false, error: "Penalty rule ID is required" };

//     const rule = await db.penaltyRule.findUnique({ where: { id } });
//     if (!rule) return { ok: false, error: "Penalty rule not found" };

//     const updated = await db.penaltyRule.update({
//       where: { id },
//       data: { isActive: !rule.isActive },
//     });

//     revalidatePath("/dashboard/fees/penalty-rules");
//     return { ok: true, data: updated };
//   } catch (error) {
//     console.error("Error toggling penalty rule:", error);
//     return { ok: false, error: "Failed to toggle penalty rule status" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ██████████████████████████████████████████████████████████████████████████
// // AUTO INVOICE CONFIG
// // ██████████████████████████████████████████████████████████████████████████
// // ════════════════════════════════════════════════════════════════════════════

// interface UpsertAutoInvoiceConfigInput {
//   schoolId: string;
//   academicYearId: string;
//   termId: string;
//   isEnabled?: boolean;
//   generateOnEnrollment?: boolean;
//   generateOnDate?: Date | null;
//   includeCarryForward?: boolean;
//   applyBursaries?: boolean;
//   sendNotification?: boolean;
// }

// export async function upsertAutoInvoiceConfig(
//   input: UpsertAutoInvoiceConfigInput
// ): Promise<ActionResult<AutoInvoiceConfig>> {
//   try {
//     if (!input.schoolId) return { ok: false, error: "School ID is required" };
//     if (!input.academicYearId) return { ok: false, error: "Academic year ID is required" };
//     if (!input.termId) return { ok: false, error: "Term ID is required" };

//     if (input.generateOnEnrollment === false && !input.generateOnDate) {
//       return {
//         ok: false,
//         error: "Either 'generate on enrollment' must be enabled or a specific date must be set",
//       };
//     }

//     const config = await db.autoInvoiceConfig.upsert({
//       where: {
//         schoolId_academicYearId_termId: {
//           schoolId: input.schoolId,
//           academicYearId: input.academicYearId,
//           termId: input.termId,
//         },
//       },
//       create: {
//         schoolId: input.schoolId,
//         academicYearId: input.academicYearId,
//         termId: input.termId,
//         isEnabled: input.isEnabled ?? true,
//         generateOnEnrollment: input.generateOnEnrollment ?? true,
//         generateOnDate: input.generateOnDate,
//         includeCarryForward: input.includeCarryForward ?? true,
//         applyBursaries: input.applyBursaries ?? true,
//         sendNotification: input.sendNotification ?? false,
//       },
//       update: {
//         ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
//         ...(input.generateOnEnrollment !== undefined && { generateOnEnrollment: input.generateOnEnrollment }),
//         ...(input.generateOnDate !== undefined && { generateOnDate: input.generateOnDate }),
//         ...(input.includeCarryForward !== undefined && { includeCarryForward: input.includeCarryForward }),
//         ...(input.applyBursaries !== undefined && { applyBursaries: input.applyBursaries }),
//         ...(input.sendNotification !== undefined && { sendNotification: input.sendNotification }),
//       },
//     });

//     revalidatePath("/dashboard/fees/config");
//     return { ok: true, data: config };
//   } catch (error) {
//     console.error("Error upserting auto invoice config:", error);
//     return { ok: false, error: "Failed to save auto invoice configuration" };
//   }
// }

// export async function getAutoInvoiceConfig(
//   schoolId: string,
//   academicYearId: string,
//   termId: string
// ): Promise<ActionResult<AutoInvoiceConfig | null>> {
//   try {
//     const config = await db.autoInvoiceConfig.findUnique({
//       where: {
//         schoolId_academicYearId_termId: { schoolId, academicYearId, termId },
//       },
//     });
//     return { ok: true, data: config };
//   } catch (error) {
//     console.error("Error fetching auto invoice config:", error);
//     return { ok: false, error: "Failed to fetch auto invoice configuration" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ██████████████████████████████████████████████████████████████████████████
// // CARRY FORWARD — end-of-term processing
// // ██████████████████████████████████████████████████████████████████████████
// // ════════════════════════════════════════════════════════════════════════════

// interface ProcessCarryForwardInput {
//   schoolId: string;
//   fromAcademicYearId: string;
//   fromTermId: string;
//   toAcademicYearId: string;
//   toTermId: string;
//   processedById: string;
//   studentIds?: string[]; // optional — if empty, processes ALL students with a balance
// }

// export async function processCarryForward(
//   input: ProcessCarryForwardInput
// ): Promise<ActionResult<{ processed: number; skipped: number; logs: CarryForwardLog[] }>> {
//   try {
//     if (!input.schoolId) return { ok: false, error: "School ID is required" };
//     if (!input.fromTermId) return { ok: false, error: "Source term ID is required" };
//     if (!input.toTermId) return { ok: false, error: "Target term ID is required" };
//     if (!input.processedById) return { ok: false, error: "User ID is required" };
//     if (input.fromTermId === input.toTermId) {
//       return { ok: false, error: "Source and target terms must be different" };
//     }

//     // Get all accounts from the source term with a non-zero balance
//     const sourceAccounts = await db.studentFeeAccount.findMany({
//       where: {
//         schoolId: input.schoolId,
//         termId: input.fromTermId,
//         academicYearId: input.fromAcademicYearId,
//         balance: { not: 0 }, // skip accounts already at zero
//         ...(input.studentIds && input.studentIds.length > 0
//           ? { studentId: { in: input.studentIds } }
//           : {}),
//       },
//       select: {
//         id: true,
//         studentId: true,
//         balance: true,
//         academicYearId: true,
//         termId: true,
//       },
//     });

//     let processed = 0;
//     let skipped = 0;
//     const logs: CarryForwardLog[] = [];

//     await db.$transaction(async (tx) => {
//       for (const fromAccount of sourceAccounts) {
//         // Check if target term account already has carry-forward recorded
//         const toAccount = await tx.studentFeeAccount.findUnique({
//           where: {
//             studentId_academicYearId_termId: {
//               studentId: fromAccount.studentId,
//               academicYearId: input.toAcademicYearId,
//               termId: input.toTermId,
//             },
//           },
//         });

//         if (!toAccount) {
//           // No enrollment for next term yet — skip, will be handled on enrollment
//           skipped++;
//           continue;
//         }

//         // Update the target account's carry-forward
//         await tx.studentFeeAccount.update({
//           where: { id: toAccount.id },
//           data: { carryForward: fromAccount.balance },
//         });

//         // Create CARRY_FORWARD transaction in the target account's ledger
//         await tx.feeTransaction.create({
//           data: {
//             studentFeeAccountId: toAccount.id,
//             transactionType: "CARRY_FORWARD" as TransactionType,
//             amount: Math.abs(fromAccount.balance),
//             description:
//               fromAccount.balance > 0
//                 ? "Arrears carried forward from previous term"
//                 : "Credit carried forward from previous term",
//             createdById: input.processedById,
//           },
//         });

//         // Recalculate the target account balance
//         await recalculateAccountBalance(toAccount.id, tx);

//         // Create audit log
//         const log = await tx.carryForwardLog.create({
//           data: {
//             studentId: fromAccount.studentId,
//             schoolId: input.schoolId,
//             fromAcademicYearId: input.fromAcademicYearId,
//             fromTermId: input.fromTermId,
//             toAcademicYearId: input.toAcademicYearId,
//             toTermId: input.toTermId,
//             fromStudentFeeAccountId: fromAccount.id,
//             toStudentFeeAccountId: toAccount.id,
//             amount: fromAccount.balance,
//             processedById: input.processedById,
//             notes: "Batch carry-forward processing",
//           },
//         });

//         logs.push(log);
//         processed++;
//       }
//     });

//     revalidatePath("/dashboard/fees");
//     return { ok: true, data: { processed, skipped, logs } };
//   } catch (error) {
//     console.error("Error processing carry forward:", error);
//     return { ok: false, error: "Failed to process carry forward. Please try again." };
//   }
// }

// export async function getCarryForwardLogs(
//   schoolId: string,
//   termId?: string
// ): Promise<ActionResult<CarryForwardLog[]>> {
//   try {
//     if (!schoolId) return { ok: false, error: "School ID is required" };

//     const logs = await db.carryForwardLog.findMany({
//       where: {
//         schoolId,
//         ...(termId && { toTermId: termId }),
//       },
//       orderBy: { processedAt: "desc" },
//     });

//     return { ok: true, data: logs };
//   } catch (error) {
//     console.error("Error fetching carry forward logs:", error);
//     return { ok: false, error: "Failed to fetch carry forward logs" };
//   }
// }


// export async function toggleBursaryStatus(
//   id: string
// ): Promise<ActionResult<Bursary>> {
//   try {
//     if (!id) return { ok: false, error: "Bursary ID is required" };

//     const bursary = await db.bursary.findUnique({ where: { id } });
//     if (!bursary) return { ok: false, error: "Bursary not found" };

//     const updated = await db.bursary.update({
//       where: { id },
//       data:  { isActive: !bursary.isActive },
//     });

//     revalidatePath("/dashboard/fees/bursaries");
//     return { ok: true, data: updated };
//   } catch (error) {
//     console.error("Error toggling bursary status:", error);
//     return { ok: false, error: "Failed to toggle bursary status" };
//   }
// }



"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import {
  Bursary,
  StudentBursary,
  BursaryAllocation,
  InstallmentPlan,
  Installment,
  PenaltyRule,
  AutoInvoiceConfig,
  CarryForwardLog,
  TransactionType,
  AccountStatus,
} from "@prisma/client";
import { recalculateAccountBalance } from "./fee-account-invoice";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████
// BURSARY
// ██████████████████████████████████████████████████████████████████████████
// ════════════════════════════════════════════════════════════════════════════

interface CreateBursaryInput {
  schoolId:     string;
  name:         string;
  code:         string;
  description?: string;
  percentage?:  number;   // e.g. 50 = 50% off
  fixedAmount?: number;   // e.g. 200000 UGX fixed discount
}

interface UpdateBursaryInput {
  name?:        string;
  description?: string;
  percentage?:  number;
  fixedAmount?: number;
  isActive?:    boolean;
}

// ─── CREATE ─────────────────────────────────────────────────────────────────

export async function createBursary(
  input: CreateBursaryInput
): Promise<ActionResult<Bursary>> {
  try {
    if (!input.schoolId) return { ok: false, error: "School ID is required" };
    if (!input.name || input.name.trim().length === 0) return { ok: false, error: "Bursary name is required" };
    if (!input.code || input.code.trim().length === 0) return { ok: false, error: "Bursary code is required" };

    if (!input.percentage && !input.fixedAmount) {
      return { ok: false, error: "Either a percentage or a fixed amount is required" };
    }
    if (input.percentage && input.fixedAmount) {
      return { ok: false, error: "Provide either a percentage or a fixed amount, not both" };
    }
    if (input.percentage && (input.percentage <= 0 || input.percentage > 100)) {
      return { ok: false, error: "Percentage must be between 1 and 100" };
    }
    if (input.fixedAmount && input.fixedAmount <= 0) {
      return { ok: false, error: "Fixed amount must be greater than zero" };
    }

    const code = input.code.trim().toUpperCase();
    const existing = await db.bursary.findUnique({
      where: { schoolId_code: { schoolId: input.schoolId, code } },
    });
    if (existing) return { ok: false, error: `A bursary with code '${code}' already exists` };

    const bursary = await db.bursary.create({
      data: {
        schoolId:    input.schoolId,
        name:        input.name.trim(),
        code,
        description: input.description?.trim(),
        percentage:  input.percentage,
        fixedAmount: input.fixedAmount,
      },
    });

    revalidatePath("/dashboard/fees/bursaries");
    return { ok: true, data: bursary };
  } catch (error) {
    console.error("Error creating bursary:", error);
    return { ok: false, error: "Failed to create bursary. Please try again." };
  }
}

// ─── READ ───────────────────────────────────────────────────────────────────

export async function getBursariesBySchool(
  schoolId:   string,
  activeOnly = false
): Promise<ActionResult<(Bursary & { _count: { studentBursaries: number; allocations: number } })[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const bursaries = await db.bursary.findMany({
      where:   { schoolId, ...(activeOnly && { isActive: true }) },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { studentBursaries: true, allocations: true } },
      },
    });

    return { ok: true, data: bursaries };
  } catch (error) {
    console.error("Error fetching bursaries:", error);
    return { ok: false, error: "Failed to fetch bursaries" };
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateBursary(
  id:   string,
  data: UpdateBursaryInput
): Promise<ActionResult<Bursary>> {
  try {
    if (!id) return { ok: false, error: "Bursary ID is required" };

    const existing = await db.bursary.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Bursary not found" };

    if (data.percentage && data.fixedAmount) {
      return { ok: false, error: "Provide either a percentage or a fixed amount, not both" };
    }
    if (data.percentage !== undefined && data.percentage !== null) {
      if (data.percentage <= 0 || data.percentage > 100) {
        return { ok: false, error: "Percentage must be between 1 and 100" };
      }
    }
    if (data.fixedAmount !== undefined && data.fixedAmount !== null) {
      if (data.fixedAmount <= 0) {
        return { ok: false, error: "Fixed amount must be greater than zero" };
      }
    }

    const updated = await db.bursary.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        ...(data.percentage  !== undefined && { percentage: data.percentage, fixedAmount: null }),
        ...(data.fixedAmount !== undefined && { fixedAmount: data.fixedAmount, percentage: null }),
        ...(data.isActive    !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/dashboard/fees/bursaries");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error updating bursary:", error);
    return { ok: false, error: "Failed to update bursary. Please try again." };
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteBursary(id: string): Promise<ActionResult<Bursary>> {
  try {
    if (!id) return { ok: false, error: "Bursary ID is required" };

    const existing = await db.bursary.findUnique({
      where:   { id },
      include: { _count: { select: { allocations: true, studentBursaries: true } } },
    });
    if (!existing) return { ok: false, error: "Bursary not found" };

    if (existing._count.allocations > 0) {
      return {
        ok: false,
        error: `Cannot delete: this bursary has been applied ${existing._count.allocations} time(s). Deactivate it instead.`,
      };
    }
    if (existing._count.studentBursaries > 0) {
      return {
        ok: false,
        error: `Cannot delete: ${existing._count.studentBursaries} student(s) are assigned this bursary. Remove assignments first.`,
      };
    }

    const deleted = await db.bursary.delete({ where: { id } });
    revalidatePath("/dashboard/fees/bursaries");
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error deleting bursary:", error);
    return { ok: false, error: "Failed to delete bursary. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// APPLY BURSARY TO EXISTING INVOICE
// ──────────────────────────────────────────────────────────────────────────
// Called automatically from assignBursaryToStudent when an invoice already
// exists for the current term.  Also exported for a manual "Apply Now"
// button on the bursaries page for retroactive corrections.
// ════════════════════════════════════════════════════════════════════════════

export interface ApplyBursaryResult {
  discountApplied:   number;   // UGX deducted this call
  newInvoiceBalance: number;   // invoice balance after discount
  newAccountBalance: number;   // account balance after discount
  alreadyApplied:    boolean;  // true when bursary was already on this account
}

/**
 * applyBursaryToCurrentTermAccount
 *
 * Finds the student's ACTIVE, open invoice for the current (active) term and
 * applies a bursary discount to it.  Safe to call multiple times — checks for
 * an existing BursaryAllocation first and skips duplicates.
 *
 * This is called automatically from assignBursaryToStudent so assigning a
 * bursary immediately reduces the live invoice balance.
 */
export async function applyBursaryToCurrentTermAccount(input: {
  studentId:        string;
  studentBursaryId: string;
  schoolId:         string;
  appliedById?:     string;
}): Promise<ActionResult<ApplyBursaryResult>> {
  try {
    if (!input.studentId)        return { ok: false, error: "Student ID is required" };
    if (!input.studentBursaryId) return { ok: false, error: "Student bursary ID is required" };
    if (!input.schoolId)         return { ok: false, error: "School ID is required" };

    // 1. Load StudentBursary + Bursary definition
    const studentBursary = await db.studentBursary.findUnique({
      where:   { id: input.studentBursaryId },
      include: { bursary: true },
    });
    if (!studentBursary)          return { ok: false, error: "Student bursary not found" };
    if (!studentBursary.isActive) return { ok: false, error: "Bursary is not active" };

    // 2. Find the active term for this school
    const activeTerm = await db.academicTerm.findFirst({
      where: {
        isActive:     true,
        academicYear: { schoolId: input.schoolId, isActive: true },
      },
      select: { id: true },
    });
    if (!activeTerm) return { ok: false, error: "No active term found" };

    // 3. Find the student's fee account for the active term
    const feeAccount = await db.studentFeeAccount.findFirst({
      where: {
        studentId: input.studentId,
        schoolId:  input.schoolId,
        termId:    activeTerm.id,
      },
      include: {
        invoices: {
          where:   { status: { notIn: ["VOID", "CANCELLED", "PAID"] } },
          orderBy: { createdAt: "desc" },
          take:    1,
        },
      },
    });

    if (!feeAccount) {
      return {
        ok:    false,
        error: "No fee account found for this student in the current term. The student may not be enrolled yet — the bursary will be applied automatically on enrollment.",
      };
    }

    const openInvoice = feeAccount.invoices[0];
    if (!openInvoice) {
      return {
        ok:    false,
        error: "No open invoice found for the current term. The invoice may be fully paid or voided.",
      };
    }

    // 4. Check for duplicate allocation (idempotency guard)
    const existingAllocation = await db.bursaryAllocation.findFirst({
      where: {
        studentFeeAccountId: feeAccount.id,
        studentBursaryId:    input.studentBursaryId,
      },
    });
    if (existingAllocation) {
      return {
        ok: true,
        data: {
          discountApplied:   existingAllocation.amountAwarded,
          newInvoiceBalance: openInvoice.balance,
          newAccountBalance: feeAccount.balance,
          alreadyApplied:    true,
        },
      };
    }

    // 5. Calculate discount amount
    const bursary      = studentBursary.bursary;
    const invoiceTotal = openInvoice.totalAmount;
    const rawDiscount  = bursary.percentage
      ? parseFloat(((bursary.percentage / 100) * invoiceTotal).toFixed(2))
      : (bursary.fixedAmount ?? 0);

    // Clamp: discount cannot push invoice balance below zero
    const safeDiscount = Math.min(rawDiscount, Math.max(0, openInvoice.balance));

    if (safeDiscount <= 0) {
      return {
        ok:    false,
        error: "Discount amount is zero or the invoice is already fully discounted.",
      };
    }

    // 6. Apply atomically
    const result = await db.$transaction(async (tx) => {
      const newInvoiceBalance = Math.max(0, openInvoice.balance - safeDiscount);

      // 6a. Update invoice discountAmount + balance + status
      const updatedInvoice = await tx.invoice.update({
        where: { id: openInvoice.id },
        data: {
          discountAmount: openInvoice.discountAmount + safeDiscount,
          balance:        newInvoiceBalance,
          status:
            newInvoiceBalance <= 0
              ? "PAID"
              : openInvoice.paidAmount > 0
              ? "PARTIAL"
              : "ISSUED",
        },
      });

      // 6b. Immutable DISCOUNT ledger entry
      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          invoiceId:           openInvoice.id,
          transactionType:     "DISCOUNT" as TransactionType,
          amount:              safeDiscount,
          description: `Bursary applied: ${bursary.name}${
            bursary.percentage
              ? ` (${bursary.percentage}% of UGX ${invoiceTotal.toLocaleString()})`
              : ` (UGX ${safeDiscount.toLocaleString()} fixed)`
          }`,
          createdById: input.appliedById,
        },
      });

      // 6c. BursaryAllocation audit record
      await tx.bursaryAllocation.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          bursaryId:           bursary.id,
          studentBursaryId:    input.studentBursaryId,
          amountAwarded:       safeDiscount,
          approvedById:        input.appliedById,
          notes:               "Applied automatically after bursary assignment",
        },
      });

      // 6d. Recalculate account balance (totalDiscount increases → balance drops)
      await recalculateAccountBalance(feeAccount.id, tx);

      // 6e. Return fresh account balance
      const refreshedAccount = await tx.studentFeeAccount.findUniqueOrThrow({
        where:  { id: feeAccount.id },
        select: { balance: true },
      });

      return { updatedInvoice, refreshedAccount };
    });

    revalidatePath(`/school/${input.schoolId}/finance/fees/accounts`);
    revalidatePath(`/school/${input.schoolId}/finance/fees/invoices`);

    return {
      ok: true,
      data: {
        discountApplied:   safeDiscount,
        newInvoiceBalance: result.updatedInvoice.balance,
        newAccountBalance: result.refreshedAccount.balance,
        alreadyApplied:    false,
      },
    };
  } catch (error) {
    console.error("Error applying bursary to existing invoice:", error);
    return { ok: false, error: "Failed to apply bursary. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT BURSARY — assign / revoke bursary to a student
// ════════════════════════════════════════════════════════════════════════════

export async function assignBursaryToStudent(input: {
  studentId:     string;
  bursaryId:     string;
  schoolId:      string;
  validFrom?:    Date;
  validUntil?:   Date;
  approvedById?: string;
  notes?:        string;
}): Promise<ActionResult<StudentBursary> & { applied?: ApplyBursaryResult | null; applyError?: string | null }> {
  try {
    if (!input.studentId) return { ok: false, error: "Student ID is required" };
    if (!input.bursaryId) return { ok: false, error: "Bursary ID is required" };
    if (!input.schoolId)  return { ok: false, error: "School ID is required" };

    const bursary = await db.bursary.findUnique({
      where:  { id: input.bursaryId },
      select: { id: true, isActive: true, schoolId: true },
    });
    if (!bursary)                            return { ok: false, error: "Bursary not found" };
    if (!bursary.isActive)                   return { ok: false, error: "Cannot assign an inactive bursary" };
    if (bursary.schoolId !== input.schoolId) return { ok: false, error: "Bursary does not belong to this school" };

    const existing = await db.studentBursary.findUnique({
      where: { studentId_bursaryId: { studentId: input.studentId, bursaryId: input.bursaryId } },
    });
    if (existing) {
      return { ok: false, error: "Student already has this bursary assigned" };
    }

    // Create the StudentBursary row
    const assignment = await db.studentBursary.create({
      data: {
        studentId:    input.studentId,
        bursaryId:    input.bursaryId,
        schoolId:     input.schoolId,
        validFrom:    input.validFrom ?? new Date(),
        validUntil:   input.validUntil,
        approvedById: input.approvedById,
        notes:        input.notes?.trim(),
      },
    });

    // ── Auto-apply to existing open invoice immediately ──────────────────
    // If the student already has an invoice for the current term, apply the
    // discount right now so the balance reduces instantly.
    // If no invoice yet (student not enrolled this term), this is a graceful
    // no-op — the bursary will be picked up by generateAutoInvoiceOnEnrollment.
    const applyResult = await applyBursaryToCurrentTermAccount({
      studentId:        input.studentId,
      studentBursaryId: assignment.id,
      schoolId:         input.schoolId,
      appliedById:      input.approvedById,
    });

    revalidatePath(`/dashboard/fees/students/${input.studentId}`);

    return {
      ok:         true,
      data:       assignment,
      applied:    applyResult.ok ? applyResult.data : null,
      applyError: applyResult.ok ? null : applyResult.error,
    };
  } catch (error) {
    console.error("Error assigning bursary:", error);
    return { ok: false, error: "Failed to assign bursary. Please try again." };
  }
}

export async function revokeBursaryFromStudent(
  studentBursaryId: string
): Promise<ActionResult<StudentBursary>> {
  try {
    if (!studentBursaryId) return { ok: false, error: "Student bursary ID is required" };

    const existing = await db.studentBursary.findUnique({
      where:   { id: studentBursaryId },
      include: { _count: { select: { allocations: true } } },
    });
    if (!existing) return { ok: false, error: "Student bursary assignment not found" };

    if (existing._count.allocations > 0) {
      // Soft revoke — set inactive and set expiry to now
      const revoked = await db.studentBursary.update({
        where: { id: studentBursaryId },
        data:  { isActive: false, validUntil: new Date() },
      });
      revalidatePath(`/dashboard/fees/students/${existing.studentId}`);
      return { ok: true, data: revoked };
    }

    const deleted = await db.studentBursary.delete({ where: { id: studentBursaryId } });
    revalidatePath(`/dashboard/fees/students/${existing.studentId}`);
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error revoking bursary:", error);
    return { ok: false, error: "Failed to revoke bursary. Please try again." };
  }
}

export async function getStudentBursaries(
  studentId: string
): Promise<ActionResult<(StudentBursary & { bursary: Bursary })[]>> {
  try {
    if (!studentId) return { ok: false, error: "Student ID is required" };

    const bursaries = await db.studentBursary.findMany({
      where:   { studentId, isActive: true },
      include: { bursary: true },
      orderBy: { createdAt: "desc" },
    });

    return { ok: true, data: bursaries };
  } catch (error) {
    console.error("Error fetching student bursaries:", error);
    return { ok: false, error: "Failed to fetch student bursaries" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████
// INSTALLMENT PLAN
// ██████████████████████████████████████████████████████████████████████████
// ════════════════════════════════════════════════════════════════════════════

interface CreateInstallmentPlanInput {
  studentFeeAccountId: string;
  name:                string;
  installments:        Array<{ amount: number; dueDate: Date }>;
  createdById:         string;
}

export async function createInstallmentPlan(
  input: CreateInstallmentPlanInput
): Promise<ActionResult<InstallmentPlan & { installments: Installment[] }>> {
  try {
    if (!input.studentFeeAccountId) return { ok: false, error: "Account ID is required" };
    if (!input.name || input.name.trim().length === 0) return { ok: false, error: "Plan name is required" };
    if (!input.installments || input.installments.length < 2) {
      return { ok: false, error: "At least 2 installments are required" };
    }
    if (!input.createdById) return { ok: false, error: "User ID is required" };

    for (const inst of input.installments) {
      if (inst.amount <= 0) return { ok: false, error: "Each installment amount must be greater than zero" };
      if (!inst.dueDate)    return { ok: false, error: "Each installment must have a due date" };
    }

    const account = await db.studentFeeAccount.findUnique({
      where:  { id: input.studentFeeAccountId },
      select: { id: true, balance: true },
    });
    if (!account) return { ok: false, error: "Student fee account not found" };

    const totalAmount = input.installments.reduce((sum, i) => sum + i.amount, 0);

    if (totalAmount > account.balance) {
      return {
        ok:    false,
        error: `Installment total (${totalAmount}) exceeds account balance (${account.balance})`,
      };
    }

    const plan = await db.installmentPlan.create({
      data: {
        studentFeeAccountId: input.studentFeeAccountId,
        name:        input.name.trim(),
        totalAmount,
        createdById: input.createdById,
        installments: {
          create: input.installments.map((inst, index) => ({
            installmentNumber: index + 1,
            amount:            inst.amount,
            dueDate:           inst.dueDate,
          })),
        },
      },
      include: { installments: { orderBy: { installmentNumber: "asc" } } },
    });

    revalidatePath(`/dashboard/fees/accounts/${input.studentFeeAccountId}`);
    return { ok: true, data: plan };
  } catch (error) {
    console.error("Error creating installment plan:", error);
    return { ok: false, error: "Failed to create installment plan. Please try again." };
  }
}

export async function markInstallmentPaid(
  installmentId: string,
  transactionId: string
): Promise<ActionResult<Installment>> {
  try {
    if (!installmentId) return { ok: false, error: "Installment ID is required" };
    if (!transactionId) return { ok: false, error: "Transaction ID is required" };

    const installment = await db.installment.findUnique({ where: { id: installmentId } });
    if (!installment)       return { ok: false, error: "Installment not found" };
    if (installment.isPaid) return { ok: false, error: "Installment is already marked as paid" };

    const updated = await db.installment.update({
      where: { id: installmentId },
      data:  { isPaid: true, paidAt: new Date(), transactionId },
    });

    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error marking installment as paid:", error);
    return { ok: false, error: "Failed to update installment" };
  }
}

export async function getInstallmentPlansByAccount(
  studentFeeAccountId: string
): Promise<ActionResult<(InstallmentPlan & { installments: Installment[] })[]>> {
  try {
    if (!studentFeeAccountId) return { ok: false, error: "Account ID is required" };

    const plans = await db.installmentPlan.findMany({
      where:   { studentFeeAccountId },
      include: { installments: { orderBy: { installmentNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return { ok: true, data: plans };
  } catch (error) {
    console.error("Error fetching installment plans:", error);
    return { ok: false, error: "Failed to fetch installment plans" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████
// PENALTY RULE
// ██████████████████████████████████████████████████████████████████████████
// ════════════════════════════════════════════════════════════════════════════

interface CreatePenaltyRuleInput {
  schoolId:     string;
  name:         string;
  description?: string;
  daysOverdue:  number;
  percentage?:  number;
  fixedAmount?: number;
  isRecurring?: boolean;
}

export async function createPenaltyRule(
  input: CreatePenaltyRuleInput
): Promise<ActionResult<PenaltyRule>> {
  try {
    if (!input.schoolId) return { ok: false, error: "School ID is required" };
    if (!input.name || input.name.trim().length === 0) return { ok: false, error: "Rule name is required" };
    if (!input.daysOverdue || input.daysOverdue < 1) {
      return { ok: false, error: "Days overdue must be at least 1" };
    }
    if (!input.percentage && !input.fixedAmount) {
      return { ok: false, error: "Either a percentage or a fixed amount is required" };
    }
    if (input.percentage && input.fixedAmount) {
      return { ok: false, error: "Provide either a percentage or a fixed amount, not both" };
    }
    if (input.percentage && (input.percentage <= 0 || input.percentage > 100)) {
      return { ok: false, error: "Percentage must be between 1 and 100" };
    }
    if (input.fixedAmount && input.fixedAmount <= 0) {
      return { ok: false, error: "Fixed amount must be greater than zero" };
    }

    const rule = await db.penaltyRule.create({
      data: {
        schoolId:    input.schoolId,
        name:        input.name.trim(),
        description: input.description?.trim(),
        daysOverdue: input.daysOverdue,
        percentage:  input.percentage,
        fixedAmount: input.fixedAmount,
        isRecurring: input.isRecurring ?? false,
      },
    });

    revalidatePath("/dashboard/fees/penalty-rules");
    return { ok: true, data: rule };
  } catch (error) {
    console.error("Error creating penalty rule:", error);
    return { ok: false, error: "Failed to create penalty rule. Please try again." };
  }
}

export async function getPenaltyRules(
  schoolId: string
): Promise<ActionResult<PenaltyRule[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const rules = await db.penaltyRule.findMany({
      where:   { schoolId },
      orderBy: [{ isActive: "desc" }, { daysOverdue: "asc" }],
    });

    return { ok: true, data: rules };
  } catch (error) {
    console.error("Error fetching penalty rules:", error);
    return { ok: false, error: "Failed to fetch penalty rules" };
  }
}

export async function togglePenaltyRuleStatus(
  id: string
): Promise<ActionResult<PenaltyRule>> {
  try {
    if (!id) return { ok: false, error: "Penalty rule ID is required" };

    const rule = await db.penaltyRule.findUnique({ where: { id } });
    if (!rule) return { ok: false, error: "Penalty rule not found" };

    const updated = await db.penaltyRule.update({
      where: { id },
      data:  { isActive: !rule.isActive },
    });

    revalidatePath("/dashboard/fees/penalty-rules");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error toggling penalty rule:", error);
    return { ok: false, error: "Failed to toggle penalty rule status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████
// AUTO INVOICE CONFIG
// ██████████████████████████████████████████████████████████████████████████
// ════════════════════════════════════════════════════════════════════════════

interface UpsertAutoInvoiceConfigInput {
  schoolId:              string;
  academicYearId:        string;
  termId:                string;
  isEnabled?:            boolean;
  generateOnEnrollment?: boolean;
  generateOnDate?:       Date | null;
  includeCarryForward?:  boolean;
  applyBursaries?:       boolean;
  sendNotification?:     boolean;
}

export async function upsertAutoInvoiceConfig(
  input: UpsertAutoInvoiceConfigInput
): Promise<ActionResult<AutoInvoiceConfig>> {
  try {
    if (!input.schoolId)       return { ok: false, error: "School ID is required" };
    if (!input.academicYearId) return { ok: false, error: "Academic year ID is required" };
    if (!input.termId)         return { ok: false, error: "Term ID is required" };

    if (input.generateOnEnrollment === false && !input.generateOnDate) {
      return {
        ok:    false,
        error: "Either 'generate on enrollment' must be enabled or a specific date must be set",
      };
    }

    const config = await db.autoInvoiceConfig.upsert({
      where: {
        schoolId_academicYearId_termId: {
          schoolId:       input.schoolId,
          academicYearId: input.academicYearId,
          termId:         input.termId,
        },
      },
      create: {
        schoolId:             input.schoolId,
        academicYearId:       input.academicYearId,
        termId:               input.termId,
        isEnabled:            input.isEnabled            ?? true,
        generateOnEnrollment: input.generateOnEnrollment ?? true,
        generateOnDate:       input.generateOnDate,
        includeCarryForward:  input.includeCarryForward  ?? true,
        applyBursaries:       input.applyBursaries       ?? true,
        sendNotification:     input.sendNotification     ?? false,
      },
      update: {
        ...(input.isEnabled            !== undefined && { isEnabled:            input.isEnabled }),
        ...(input.generateOnEnrollment !== undefined && { generateOnEnrollment: input.generateOnEnrollment }),
        ...(input.generateOnDate       !== undefined && { generateOnDate:       input.generateOnDate }),
        ...(input.includeCarryForward  !== undefined && { includeCarryForward:  input.includeCarryForward }),
        ...(input.applyBursaries       !== undefined && { applyBursaries:       input.applyBursaries }),
        ...(input.sendNotification     !== undefined && { sendNotification:     input.sendNotification }),
      },
    });

    revalidatePath("/dashboard/fees/config");
    return { ok: true, data: config };
  } catch (error) {
    console.error("Error upserting auto invoice config:", error);
    return { ok: false, error: "Failed to save auto invoice configuration" };
  }
}

export async function getAutoInvoiceConfig(
  schoolId:       string,
  academicYearId: string,
  termId:         string
): Promise<ActionResult<AutoInvoiceConfig | null>> {
  try {
    const config = await db.autoInvoiceConfig.findUnique({
      where: {
        schoolId_academicYearId_termId: { schoolId, academicYearId, termId },
      },
    });
    return { ok: true, data: config };
  } catch (error) {
    console.error("Error fetching auto invoice config:", error);
    return { ok: false, error: "Failed to fetch auto invoice configuration" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████
// CARRY FORWARD — end-of-term processing
// ██████████████████████████████████████████████████████████████████████████
// ════════════════════════════════════════════════════════════════════════════

interface ProcessCarryForwardInput {
  schoolId:           string;
  fromAcademicYearId: string;
  fromTermId:         string;
  toAcademicYearId:   string;
  toTermId:           string;
  processedById:      string;
  studentIds?:        string[]; // optional — if empty, processes ALL students with a balance
}

export async function processCarryForward(
  input: ProcessCarryForwardInput
): Promise<ActionResult<{ processed: number; skipped: number; logs: CarryForwardLog[] }>> {
  try {
    if (!input.schoolId)      return { ok: false, error: "School ID is required" };
    if (!input.fromTermId)    return { ok: false, error: "Source term ID is required" };
    if (!input.toTermId)      return { ok: false, error: "Target term ID is required" };
    if (!input.processedById) return { ok: false, error: "User ID is required" };
    if (input.fromTermId === input.toTermId) {
      return { ok: false, error: "Source and target terms must be different" };
    }

    const sourceAccounts = await db.studentFeeAccount.findMany({
      where: {
        schoolId:       input.schoolId,
        termId:         input.fromTermId,
        academicYearId: input.fromAcademicYearId,
        balance:        { not: 0 },
        ...(input.studentIds && input.studentIds.length > 0
          ? { studentId: { in: input.studentIds } }
          : {}),
      },
      select: {
        id:             true,
        studentId:      true,
        balance:        true,
        academicYearId: true,
        termId:         true,
      },
    });

    let processed = 0;
    let skipped   = 0;
    const logs: CarryForwardLog[] = [];

    await db.$transaction(async (tx) => {
      for (const fromAccount of sourceAccounts) {
        const toAccount = await tx.studentFeeAccount.findUnique({
          where: {
            studentId_academicYearId_termId: {
              studentId:      fromAccount.studentId,
              academicYearId: input.toAcademicYearId,
              termId:         input.toTermId,
            },
          },
        });

        if (!toAccount) {
          // No enrollment for next term yet — will be handled on enrollment
          skipped++;
          continue;
        }

        await tx.studentFeeAccount.update({
          where: { id: toAccount.id },
          data:  { carryForward: fromAccount.balance },
        });

        await tx.feeTransaction.create({
          data: {
            studentFeeAccountId: toAccount.id,
            transactionType:     "CARRY_FORWARD" as TransactionType,
            amount:              Math.abs(fromAccount.balance),
            description:
              fromAccount.balance > 0
                ? "Arrears carried forward from previous term"
                : "Credit carried forward from previous term",
            createdById: input.processedById,
          },
        });

        await recalculateAccountBalance(toAccount.id, tx);

        const log = await tx.carryForwardLog.create({
          data: {
            studentId:               fromAccount.studentId,
            schoolId:                input.schoolId,
            fromAcademicYearId:      input.fromAcademicYearId,
            fromTermId:              input.fromTermId,
            toAcademicYearId:        input.toAcademicYearId,
            toTermId:                input.toTermId,
            fromStudentFeeAccountId: fromAccount.id,
            toStudentFeeAccountId:   toAccount.id,
            amount:                  fromAccount.balance,
            processedById:           input.processedById,
            notes:                   "Batch carry-forward processing",
          },
        });

        logs.push(log);
        processed++;
      }
    });

    revalidatePath("/dashboard/fees");
    return { ok: true, data: { processed, skipped, logs } };
  } catch (error) {
    console.error("Error processing carry forward:", error);
    return { ok: false, error: "Failed to process carry forward. Please try again." };
  }
}

export async function getCarryForwardLogs(
  schoolId: string,
  termId?:  string
): Promise<ActionResult<CarryForwardLog[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const logs = await db.carryForwardLog.findMany({
      where:   { schoolId, ...(termId && { toTermId: termId }) },
      orderBy: { processedAt: "desc" },
    });

    return { ok: true, data: logs };
  } catch (error) {
    console.error("Error fetching carry forward logs:", error);
    return { ok: false, error: "Failed to fetch carry forward logs" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE BURSARY STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function toggleBursaryStatus(
  id: string
): Promise<ActionResult<Bursary>> {
  try {
    if (!id) return { ok: false, error: "Bursary ID is required" };

    const bursary = await db.bursary.findUnique({ where: { id } });
    if (!bursary) return { ok: false, error: "Bursary not found" };

    const updated = await db.bursary.update({
      where: { id },
      data:  { isActive: !bursary.isActive },
    });

    revalidatePath("/dashboard/fees/bursaries");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error toggling bursary status:", error);
    return { ok: false, error: "Failed to toggle bursary status" };
  }
}