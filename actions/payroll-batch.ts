// "use server";

// import { revalidatePath } from "next/cache";
// import { db } from "@/prisma/db";
// import { getAuthenticatedUser } from "@/config/useAuth";
// import type {
//   StaffAllowanceProfile,
//   StaffDeductionProfile,
//   AttendanceSummary,
//   OvertimeRequest,
//   StaffLoan,
//   SalaryAdvance,
//   PayrollItemType,
//   AllowanceType,
//   DeductionType,
// } from "@prisma/client";

// // ─── Types ────────────────────────────────────────────────────────────────────

// export type PayrollOptions = {
//   /** Apply standing allowance profiles (housing, transport, etc.) */
//   applyAllowances: boolean;
//   /** Deduct NSSF: 5% employee + 10% employer on gross salary */
//   applyNSSF: boolean;
//   /** Deduct PAYE using Uganda URA tax brackets */
//   applyPAYE: boolean;
//   /** Deduct active loan monthly instalments */
//   applyLoanDeductions: boolean;
//   /** Recover disbursed salary advances */
//   applyAdvanceDeductions: boolean;
//   /** Apply standing deduction profiles (welfare, savings, union dues, etc.) */
//   applyStandingDeductions: boolean;
//   /** Create Payslip records after batch is processed */
//   generatePayslips: boolean;
// };

// const DEFAULT_OPTIONS: PayrollOptions = {
//   applyAllowances:         true,
//   applyNSSF:               true,
//   applyPAYE:               true,
//   applyLoanDeductions:     true,
//   applyAdvanceDeductions:  true,
//   applyStandingDeductions: true,
//   generatePayslips:        false,
// };

// type StaffWithProfiles = {
//   id:                string;
//   basicSalary:       number;
//   allowanceProfiles: StaffAllowanceProfile[];
//   deductionProfiles: StaffDeductionProfile[];
// };

// type PayrollItemInput = {
//   itemType:       PayrollItemType;
//   allowanceType?: AllowanceType;
//   deductionType?: DeductionType;
//   name:           string;
//   amount:         number;
//   isPercentage:   boolean;
//   percentageOf:   number | null;
// };

// type ComputedPayrollLine = {
//   staffId:          string;
//   basicSalary:      number;
//   totalAllowances:  number;
//   grossSalary:      number;
//   taxableIncome:    number;
//   nssfEmployee:     number;
//   nssfEmployer:     number;
//   payeAmount:       number;
//   loanDeductions:   number;
//   advanceDeductions:number;
//   totalDeductions:  number;
//   netSalary:        number;
//   workingDays:      number;
//   daysWorked:       number;
//   absentDays:       number;
//   overtimeHours:    number;
//   overtimePay:      number;
//   items:            PayrollItemInput[];
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function buildBatchNumber(payMonth: number, payYear: number): string {
//   const labels = ["JAN","FEB","MAR","APR","MAY","JUN",
//                   "JUL","AUG","SEP","OCT","NOV","DEC"];
//   return `BATCH-${labels[payMonth - 1]}-${payYear}`;
// }

// /** Uganda Revenue Authority PAYE — 2024/25 annual bands, returned as monthly amount */
// function calculateUgandaPAYE(monthlyTaxable: number): number {
//   const annual = monthlyTaxable * 12;
//   let annualTax = 0;
//   if      (annual <= 2_820_000)   annualTax = 0;
//   else if (annual <= 4_020_000)   annualTax = (annual - 2_820_000) * 0.10;
//   else if (annual <= 4_920_000)   annualTax = 120_000 + (annual - 4_020_000) * 0.20;
//   else if (annual <= 120_000_000) annualTax = 300_000 + (annual - 4_920_000) * 0.30;
//   else                            annualTax = 35_124_000 + (annual - 120_000_000) * 0.40;
//   return annualTax / 12;
// }

// /** Pure CPU — compute one staff member's payroll figures from pre-fetched data */
// function computeStaffPayroll(
//   staff:      StaffWithProfiles,
//   attendance: AttendanceSummary | undefined,
//   overtime:   OvertimeRequest[],
//   loans:      StaffLoan[],
//   advances:   SalaryAdvance[],
//   opts:       PayrollOptions,
// ): ComputedPayrollLine {
//   const { basicSalary } = staff;

//   // ── Attendance fallbacks ──────────────────────────────────────────────────
//   const workingDays = attendance?.totalWorkingDays ?? 22;
//   const daysWorked  = attendance?.presentDays      ?? workingDays;
//   const absentDays  = attendance?.absentDays       ?? 0;

//   // ── Overtime ──────────────────────────────────────────────────────────────
//   const overtimePay   = overtime.reduce((s, r) => s + (r.amountPayable ?? 0), 0);
//   const overtimeHours = overtime.reduce((s, r) => s + r.hoursWorked, 0);

//   const items: PayrollItemInput[] = [];

//   // ── Allowances ────────────────────────────────────────────────────────────
//   let totalAllowances = 0;
//   if (opts.applyAllowances) {
//     for (const a of staff.allowanceProfiles) {
//       const amount = a.isPercentage ? (basicSalary * a.amount) / 100 : a.amount;
//       items.push({
//         itemType: "ALLOWANCE",
//         allowanceType: a.allowanceType,
//         name: a.name,
//         amount,
//         isPercentage: a.isPercentage,
//         percentageOf: a.isPercentage ? basicSalary : null,
//       });
//       totalAllowances += amount;
//     }
//   }

//   const grossSalary = basicSalary + totalAllowances + overtimePay;

//   // ── Statutory: NSSF ───────────────────────────────────────────────────────
//   let nssfEmployee = 0, nssfEmployer = 0;
//   if (opts.applyNSSF) {
//     nssfEmployee = grossSalary * 0.05;
//     nssfEmployer = grossSalary * 0.10;
//   }

//   // ── Statutory: PAYE ───────────────────────────────────────────────────────
//   // Taxable income = gross − employee NSSF (0 when NSSF is skipped → full gross taxed)
//   const taxableIncome = grossSalary - nssfEmployee;
//   const payeAmount    = opts.applyPAYE ? calculateUgandaPAYE(taxableIncome) : 0;

//   // ── Loan & advance recoveries ─────────────────────────────────────────────
//   const loanDeductions = opts.applyLoanDeductions
//     ? loans.reduce((s, l) => s + (l.monthlyInstalment ?? 0), 0)
//     : 0;

//   const advanceDeductions = opts.applyAdvanceDeductions
//     ? advances.reduce((s, a) => s + (a.monthlyRecovery ?? 0), 0)
//     : 0;

//   // ── Standing deductions ───────────────────────────────────────────────────
//   let standingDeductionsTotal = 0;
//   if (opts.applyStandingDeductions) {
//     for (const d of staff.deductionProfiles) {
//       const amount = d.isPercentage ? (basicSalary * d.amount) / 100 : d.amount;
//       items.push({
//         itemType: "DEDUCTION",
//         deductionType: d.deductionType,
//         name: d.name,
//         amount,
//         isPercentage: d.isPercentage,
//         percentageOf: d.isPercentage ? basicSalary : null,
//       });
//       standingDeductionsTotal += amount;
//     }
//   }

//   // ── Absence deduction (factual — not a toggle) ────────────────────────────
//   const absenceDeduction = absentDays > 0
//     ? absentDays * (basicSalary / workingDays)
//     : 0;

//   // ── Build statutory + recovery line items ────────────────────────────────
//   if (opts.applyNSSF) {
//     items.push({ itemType: "DEDUCTION", deductionType: "NSSF",
//       name: "NSSF (5%)", amount: nssfEmployee,
//       isPercentage: true, percentageOf: grossSalary });
//   }
//   if (opts.applyPAYE) {
//     items.push({ itemType: "DEDUCTION", deductionType: "PAYE",
//       name: "PAYE Tax", amount: payeAmount,
//       isPercentage: false, percentageOf: null });
//   }
//   if (opts.applyLoanDeductions && loanDeductions > 0) {
//     items.push({ itemType: "DEDUCTION", deductionType: "LOAN_REPAYMENT",
//       name: "Loan Repayment", amount: loanDeductions,
//       isPercentage: false, percentageOf: null });
//   }
//   if (opts.applyAdvanceDeductions && advanceDeductions > 0) {
//     items.push({ itemType: "DEDUCTION", deductionType: "CUSTOM",
//       name: "Advance Recovery", amount: advanceDeductions,
//       isPercentage: false, percentageOf: null });
//   }
//   if (absenceDeduction > 0) {
//     items.push({ itemType: "DEDUCTION", deductionType: "ABSENCE",
//       name: `Absent ${absentDays} day${absentDays === 1 ? "" : "s"}`,
//       amount: absenceDeduction, isPercentage: false, percentageOf: null });
//   }

//   const totalDeductions =
//     nssfEmployee + payeAmount + loanDeductions +
//     advanceDeductions + standingDeductionsTotal + absenceDeduction;

//   const netSalary = Math.max(0, grossSalary - totalDeductions);

//   return {
//     staffId: staff.id,
//     basicSalary, totalAllowances, grossSalary, taxableIncome,
//     nssfEmployee, nssfEmployer, payeAmount,
//     loanDeductions, advanceDeductions, totalDeductions, netSalary,
//     workingDays, daysWorked, absentDays, overtimeHours, overtimePay,
//     items,
//   };
// }

// // ─── Main action ──────────────────────────────────────────────────────────────

// export async function createPayrollBatch(data: {
//   schoolId: string;
//   payMonth:  number;
//   payYear:   number;
//   /** Omit to use all-enabled defaults (backwards-compatible) */
//   options?:  Partial<PayrollOptions>;
// }) {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const { schoolId, payMonth, payYear } = data;
//   const opts: PayrollOptions = { ...DEFAULT_OPTIONS, ...(data.options ?? {}) };

//   const payPeriod = new Date(payYear, payMonth - 1, 1).toLocaleString("default", {
//     month: "long", year: "numeric",
//   });

//   // ── Guard: duplicate batch ────────────────────────────────────────────────
//   const existing = await db.payrollBatch.findUnique({
//     where: { schoolId_payMonth_payYear: { schoolId, payMonth, payYear } },
//   });
//   if (existing) {
//     return { ok: false, message: `Payroll batch for ${payPeriod} already exists.` };
//   }

//   // ── 1. Load all ACTIVE staff with allowance/deduction profiles ────────────
//   const allStaff = await db.staff.findMany({
//     where: { schoolId, status: "ACTIVE" },
//     include: {
//       allowanceProfiles: { where: { isActive: true } },
//       deductionProfiles: { where: { isActive: true } },
//     },
//   });

//   if (allStaff.length === 0) {
//     return { ok: false, message: "No active staff found for this school." };
//   }

//   const staffIds    = allStaff.map(s => s.id);
//   const periodStart = new Date(payYear, payMonth - 1, 1);
//   const periodEnd   = new Date(payYear, payMonth,     0); // last day of month

//   // ── 2. Bulk-read ALL supporting data OUTSIDE the transaction ──────────────
//   //
//   //    This is the key fix for the "Transaction not found / timeout" error.
//   //    The old code issued 4+ queries per staff member inside the transaction,
//   //    exhausting Prisma's 5-second interactive transaction timeout.
//   //    Here we do 4 queries total, regardless of staff count.

//   const [attendanceSummaries, overtimeRecords, activeLoans, activeAdvances] =
//     await Promise.all([
//       db.attendanceSummary.findMany({
//         where: { staffId: { in: staffIds }, month: payMonth, year: payYear },
//       }),
//       db.overtimeRequest.findMany({
//         where: {
//           staffId: { in: staffIds },
//           status:  "APPROVED",
//           date:    { gte: periodStart, lte: periodEnd },
//         },
//       }),
//       // Skip DB hit entirely when toggle is off
//       opts.applyLoanDeductions
//         ? db.staffLoan.findMany({ where: { staffId: { in: staffIds }, status: "ACTIVE" } })
//         : Promise.resolve([] as StaffLoan[]),
//       opts.applyAdvanceDeductions
//         ? db.salaryAdvance.findMany({ where: { staffId: { in: staffIds }, status: "DISBURSED" } })
//         : Promise.resolve([] as SalaryAdvance[]),
//     ]);

//   // Index results by staffId for O(1) lookup inside the loop
//   const attendanceByStaff = new Map(attendanceSummaries.map(a => [a.staffId, a]));

//   const overtimeByStaff = new Map<string, OvertimeRequest[]>();
//   for (const r of overtimeRecords) {
//     if (!overtimeByStaff.has(r.staffId)) overtimeByStaff.set(r.staffId, []);
//     overtimeByStaff.get(r.staffId)!.push(r);
//   }

//   const loansByStaff = new Map<string, StaffLoan[]>();
//   for (const l of activeLoans) {
//     if (!loansByStaff.has(l.staffId)) loansByStaff.set(l.staffId, []);
//     loansByStaff.get(l.staffId)!.push(l);
//   }

//   const advancesByStaff = new Map<string, SalaryAdvance[]>();
//   for (const a of activeAdvances) {
//     if (!advancesByStaff.has(a.staffId)) advancesByStaff.set(a.staffId, []);
//     advancesByStaff.get(a.staffId)!.push(a);
//   }

//   // ── 3. Pre-compute every staff member's payroll (pure CPU, zero DB calls) ─
//   const computed: ComputedPayrollLine[] = allStaff.map(staff =>
//     computeStaffPayroll(
//       staff,
//       attendanceByStaff.get(staff.id),
//       overtimeByStaff.get(staff.id)   ?? [],
//       loansByStaff.get(staff.id)      ?? [],
//       advancesByStaff.get(staff.id)   ?? [],
//       opts,
//     )
//   );

//   // ── 4. Transaction: writes only — no reads, no timeout risk ──────────────
//   //    Timeout raised to 30 s as a safety net for very large schools,
//   //    though with pure writes even 500 staff should finish in < 5 s.

//   const result = await db.$transaction(
//     async (tx) => {
//       // Create the batch shell
//       const batch = await tx.payrollBatch.create({
//         data: {
//           schoolId,
//           batchNumber: buildBatchNumber(payMonth, payYear),
//           payMonth,
//           payYear,
//           payPeriod,
//           status:          "DRAFT",
//           totalStaffCount: allStaff.length,
//           preparedById:    user.id,
//           preparedAt:      new Date(),
//         },
//       });

//       // Running totals for the batch summary row
//       let totalGross        = 0;
//       let totalNet          = 0;
//       let totalAllowancesAcc = 0;
//       let totalDeductionsAcc = 0;
//       let totalNSSFAcc       = 0;
//       let totalPAYEAcc       = 0;

//       for (const line of computed) {
//         const payroll = await tx.payroll.create({
//           data: {
//             schoolId,
//             staffId:           line.staffId,
//             batchId:           batch.id,
//             payMonth,
//             payYear,
//             payPeriod,
//             basicSalary:       line.basicSalary,
//             totalAllowances:   line.totalAllowances,
//             totalDeductions:   line.totalDeductions,
//             grossSalary:       line.grossSalary,
//             taxableIncome:     line.taxableIncome,
//             nssfContribution:  line.nssfEmployee,
//             nssfEmployer:      line.nssfEmployer,
//             payeAmount:        line.payeAmount,
//             loanDeductions:    line.loanDeductions,
//             advanceDeductions: line.advanceDeductions,
//             netSalary:         line.netSalary,
//             workingDays:       line.workingDays,
//             daysWorked:        line.daysWorked,
//             absentDays:        line.absentDays,
//             overtimeHours:     line.overtimeHours,
//             overtimePay:       line.overtimePay,
//             status: "DRAFT",
//             items: { create: line.items },
//           },
//         });

//         if (opts.generatePayslips) {
//           await tx.payslip.create({
//             data: {
//               payrollId:   payroll.id,
//               schoolId,
//               staffId:     line.staffId,
//               fileUrl:     "", // populated later by a PDF generation job
//               generatedAt: new Date(),
//             },
//           });
//         }

//         totalGross         += line.grossSalary;
//         totalNet           += line.netSalary;
//         totalAllowancesAcc += line.totalAllowances;
//         totalDeductionsAcc += line.totalDeductions;
//         totalNSSFAcc       += line.nssfEmployee + line.nssfEmployer;
//         totalPAYEAcc       += line.payeAmount;
//       }

//       // Stamp the batch with final totals
//       return tx.payrollBatch.update({
//         where: { id: batch.id },
//         data: {
//           processedCount:   computed.length,
//           totalGrossSalary: totalGross,
//           totalNetSalary:   totalNet,
//           totalAllowances:  totalAllowancesAcc,
//           totalDeductions:  totalDeductionsAcc,
//           totalNSSF:        totalNSSFAcc,
//           totalPAYE:        totalPAYEAcc,
//         },
//       });
//     },
//     { timeout: 30_000 }, // 30 s — safe upper bound for large schools
//   );

//   revalidatePath(`/staff/payroll`);

//   return {
//     ok:      true,
//     data:    result,
//     message: `Payroll batch for ${payPeriod} created — ${allStaff.length} staff processed.`,
//   };
// }



"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
// FIX [1-7]: Import all required enums so Prisma query status values are
// type-safe rather than plain string literals.
import {
  StaffStatus,
  OvertimeStatus,
  LoanStatus,
  SalaryAdvanceStatus,
  PayrollStatus,
  PayrollBatchStatus,
  PayrollItemType,
  AllowanceType,
  DeductionType,
} from "@prisma/client";
import type {
  StaffAllowanceProfile,
  StaffDeductionProfile,
  AttendanceSummary,
  OvertimeRequest,
  StaffLoan,
  SalaryAdvance,
} from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayrollOptions = {
  applyAllowances:         boolean;
  applyNSSF:               boolean;
  applyPAYE:               boolean;
  applyLoanDeductions:     boolean;
  applyAdvanceDeductions:  boolean;
  applyStandingDeductions: boolean;
  generatePayslips:        boolean;
};

const DEFAULT_OPTIONS: PayrollOptions = {
  applyAllowances:         true,
  applyNSSF:               true,
  applyPAYE:               true,
  applyLoanDeductions:     true,
  applyAdvanceDeductions:  true,
  applyStandingDeductions: true,
  generatePayslips:        false,
};

type StaffWithProfiles = {
  id:                string;
  basicSalary:       number;
  allowanceProfiles: StaffAllowanceProfile[];
  deductionProfiles: StaffDeductionProfile[];
};

type PayrollItemInput = {
  itemType:       PayrollItemType;
  allowanceType?: AllowanceType;
  deductionType?: DeductionType;
  name:           string;
  amount:         number;
  isPercentage:   boolean;
  percentageOf:   number | null;
};

type ComputedPayrollLine = {
  staffId:           string;
  basicSalary:       number;
  totalAllowances:   number;
  grossSalary:       number;
  taxableIncome:     number;
  nssfEmployee:      number;
  nssfEmployer:      number;
  payeAmount:        number;
  loanDeductions:    number;
  advanceDeductions: number;
  totalDeductions:   number;
  netSalary:         number;
  workingDays:       number;
  daysWorked:        number;
  absentDays:        number;
  overtimeHours:     number;
  overtimePay:       number;
  items:             PayrollItemInput[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBatchNumber(payMonth: number, payYear: number): string {
  const labels = ["JAN","FEB","MAR","APR","MAY","JUN",
                  "JUL","AUG","SEP","OCT","NOV","DEC"];
  return `BATCH-${labels[payMonth - 1]}-${payYear}`;
}

function calculateUgandaPAYE(monthlyTaxable: number): number {
  const annual = monthlyTaxable * 12;
  let annualTax = 0;
  if      (annual <= 2_820_000)   annualTax = 0;
  else if (annual <= 4_020_000)   annualTax = (annual - 2_820_000) * 0.10;
  else if (annual <= 4_920_000)   annualTax = 120_000 + (annual - 4_020_000) * 0.20;
  else if (annual <= 120_000_000) annualTax = 300_000 + (annual - 4_920_000) * 0.30;
  else                            annualTax = 35_124_000 + (annual - 120_000_000) * 0.40;
  return annualTax / 12;
}

function computeStaffPayroll(
  staff:      StaffWithProfiles,
  attendance: AttendanceSummary | undefined,
  overtime:   OvertimeRequest[],
  loans:      StaffLoan[],
  advances:   SalaryAdvance[],
  opts:       PayrollOptions,
): ComputedPayrollLine {
  const { basicSalary } = staff;

  const workingDays = attendance?.totalWorkingDays ?? 22;
  const daysWorked  = attendance?.presentDays      ?? workingDays;
  const absentDays  = attendance?.absentDays       ?? 0;

  const overtimePay   = overtime.reduce((s, r) => s + (r.amountPayable ?? 0), 0);
  const overtimeHours = overtime.reduce((s, r) => s + r.hoursWorked, 0);

  const items: PayrollItemInput[] = [];

  // Allowances
  let totalAllowances = 0;
  if (opts.applyAllowances) {
    for (const a of staff.allowanceProfiles) {
      const amount = a.isPercentage ? (basicSalary * a.amount) / 100 : a.amount;
      // FIX [7]: Use enum values for itemType — PayrollItemType is already the
      // TypeScript type; the actual runtime value must be the enum member, not a string.
      items.push({
        itemType:      PayrollItemType.ALLOWANCE,
        allowanceType: a.allowanceType,
        name:          a.name,
        amount,
        isPercentage:  a.isPercentage,
        percentageOf:  a.isPercentage ? basicSalary : null,
      });
      totalAllowances += amount;
    }
  }

  const grossSalary = basicSalary + totalAllowances + overtimePay;

  let nssfEmployee = 0, nssfEmployer = 0;
  if (opts.applyNSSF) {
    nssfEmployee = grossSalary * 0.05;
    nssfEmployer = grossSalary * 0.10;
  }

  const taxableIncome = grossSalary - nssfEmployee;
  const payeAmount    = opts.applyPAYE ? calculateUgandaPAYE(taxableIncome) : 0;

  const loanDeductions = opts.applyLoanDeductions
    ? loans.reduce((s, l) => s + (l.monthlyInstalment ?? 0), 0)
    : 0;

  const advanceDeductions = opts.applyAdvanceDeductions
    ? advances.reduce((s, a) => s + (a.monthlyRecovery ?? 0), 0)
    : 0;

  let standingDeductionsTotal = 0;
  if (opts.applyStandingDeductions) {
    for (const d of staff.deductionProfiles) {
      const amount = d.isPercentage ? (basicSalary * d.amount) / 100 : d.amount;
      // FIX [7]: Use enum values
      items.push({
        itemType:      PayrollItemType.DEDUCTION,
        deductionType: d.deductionType,
        name:          d.name,
        amount,
        isPercentage:  d.isPercentage,
        percentageOf:  d.isPercentage ? basicSalary : null,
      });
      standingDeductionsTotal += amount;
    }
  }

  const absenceDeduction = absentDays > 0
    ? absentDays * (basicSalary / workingDays)
    : 0;

  // Statutory line items — FIX [7]: enum values
  if (opts.applyNSSF) {
    items.push({
      itemType: PayrollItemType.DEDUCTION, deductionType: DeductionType.NSSF,
      name: "NSSF (5%)", amount: nssfEmployee,
      isPercentage: true, percentageOf: grossSalary,
    });
  }
  if (opts.applyPAYE) {
    items.push({
      itemType: PayrollItemType.DEDUCTION, deductionType: DeductionType.PAYE,
      name: "PAYE Tax", amount: payeAmount,
      isPercentage: false, percentageOf: null,
    });
  }
  if (opts.applyLoanDeductions && loanDeductions > 0) {
    items.push({
      itemType: PayrollItemType.DEDUCTION, deductionType: DeductionType.LOAN_REPAYMENT,
      name: "Loan Repayment", amount: loanDeductions,
      isPercentage: false, percentageOf: null,
    });
  }
  if (opts.applyAdvanceDeductions && advanceDeductions > 0) {
    items.push({
      itemType: PayrollItemType.DEDUCTION, deductionType: DeductionType.CUSTOM,
      name: "Advance Recovery", amount: advanceDeductions,
      isPercentage: false, percentageOf: null,
    });
  }
  if (absenceDeduction > 0) {
    items.push({
      itemType: PayrollItemType.DEDUCTION, deductionType: DeductionType.ABSENCE,
      name: `Absent ${absentDays} day${absentDays === 1 ? "" : "s"}`,
      amount: absenceDeduction, isPercentage: false, percentageOf: null,
    });
  }

  const totalDeductions =
    nssfEmployee + payeAmount + loanDeductions +
    advanceDeductions + standingDeductionsTotal + absenceDeduction;

  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    staffId: staff.id,
    basicSalary, totalAllowances, grossSalary, taxableIncome,
    nssfEmployee, nssfEmployer, payeAmount,
    loanDeductions, advanceDeductions, totalDeductions, netSalary,
    workingDays, daysWorked, absentDays, overtimeHours, overtimePay,
    items,
  };
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function createPayrollBatch(data: {
  schoolId:  string;
  payMonth:  number;
  payYear:   number;
  options?:  Partial<PayrollOptions>;
}) {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const { schoolId, payMonth, payYear } = data;
  const opts: PayrollOptions = { ...DEFAULT_OPTIONS, ...(data.options ?? {}) };

  const payPeriod = new Date(payYear, payMonth - 1, 1).toLocaleString("default", {
    month: "long", year: "numeric",
  });

  const existing = await db.payrollBatch.findUnique({
    where: { schoolId_payMonth_payYear: { schoolId, payMonth, payYear } },
  });
  if (existing) {
    return { ok: false, message: `Payroll batch for ${payPeriod} already exists.` };
  }

  // 1. Load all ACTIVE staff
  const allStaff = await db.staff.findMany({
    where: {
      schoolId,
      // FIX [1]: StaffStatus enum
      status: StaffStatus.ACTIVE,
    },
    include: {
      allowanceProfiles: { where: { isActive: true } },
      deductionProfiles: { where: { isActive: true } },
    },
  });

  if (allStaff.length === 0) {
    return { ok: false, message: "No active staff found for this school." };
  }

  const staffIds    = allStaff.map(s => s.id);
  const periodStart = new Date(payYear, payMonth - 1, 1);
  const periodEnd   = new Date(payYear, payMonth,     0);

  // 2. Bulk-read all supporting data outside the transaction
  const [attendanceSummaries, overtimeRecords, activeLoans, activeAdvances] =
    await Promise.all([
      db.attendanceSummary.findMany({
        where: { staffId: { in: staffIds }, month: payMonth, year: payYear },
      }),
      db.overtimeRequest.findMany({
        where: {
          staffId: { in: staffIds },
          // FIX [2]: OvertimeStatus enum
          status:  OvertimeStatus.APPROVED,
          date:    { gte: periodStart, lte: periodEnd },
        },
      }),
      opts.applyLoanDeductions
        ? db.staffLoan.findMany({
            where: {
              staffId: { in: staffIds },
              // FIX [3]: LoanStatus enum
              status: LoanStatus.ACTIVE,
            },
          })
        : Promise.resolve([] as StaffLoan[]),
      opts.applyAdvanceDeductions
        ? db.salaryAdvance.findMany({
            where: {
              staffId: { in: staffIds },
              // FIX [4]: SalaryAdvanceStatus enum
              status: SalaryAdvanceStatus.DISBURSED,
            },
          })
        : Promise.resolve([] as SalaryAdvance[]),
    ]);

  const attendanceByStaff = new Map(attendanceSummaries.map(a => [a.staffId, a]));

  const overtimeByStaff = new Map<string, OvertimeRequest[]>();
  for (const r of overtimeRecords) {
    if (!overtimeByStaff.has(r.staffId)) overtimeByStaff.set(r.staffId, []);
    overtimeByStaff.get(r.staffId)!.push(r);
  }

  const loansByStaff = new Map<string, StaffLoan[]>();
  for (const l of activeLoans) {
    if (!loansByStaff.has(l.staffId)) loansByStaff.set(l.staffId, []);
    loansByStaff.get(l.staffId)!.push(l);
  }

  const advancesByStaff = new Map<string, SalaryAdvance[]>();
  for (const a of activeAdvances) {
    if (!advancesByStaff.has(a.staffId)) advancesByStaff.set(a.staffId, []);
    advancesByStaff.get(a.staffId)!.push(a);
  }

  // 3. Pre-compute every staff member's payroll (pure CPU, zero DB calls)
  const computed: ComputedPayrollLine[] = allStaff.map(staff =>
    computeStaffPayroll(
      staff,
      attendanceByStaff.get(staff.id),
      overtimeByStaff.get(staff.id)   ?? [],
      loansByStaff.get(staff.id)      ?? [],
      advancesByStaff.get(staff.id)   ?? [],
      opts,
    )
  );

  // 4. Transaction: writes only
  const result = await db.$transaction(
    async (tx) => {
      const batch = await tx.payrollBatch.create({
        data: {
          schoolId,
          batchNumber:     buildBatchNumber(payMonth, payYear),
          payMonth,
          payYear,
          payPeriod,
          // FIX [6]: PayrollBatchStatus enum
          status:          PayrollBatchStatus.DRAFT,
          totalStaffCount: allStaff.length,
          preparedById:    user.id,
          preparedAt:      new Date(),
        },
      });

      let totalGross         = 0;
      let totalNet           = 0;
      let totalAllowancesAcc = 0;
      let totalDeductionsAcc = 0;
      let totalNSSFAcc       = 0;
      let totalPAYEAcc       = 0;

      for (const line of computed) {
        const payroll = await tx.payroll.create({
          data: {
            schoolId,
            staffId:           line.staffId,
            batchId:           batch.id,
            payMonth,
            payYear,
            payPeriod,
            basicSalary:       line.basicSalary,
            totalAllowances:   line.totalAllowances,
            totalDeductions:   line.totalDeductions,
            grossSalary:       line.grossSalary,
            taxableIncome:     line.taxableIncome,
            nssfContribution:  line.nssfEmployee,
            nssfEmployer:      line.nssfEmployer,
            payeAmount:        line.payeAmount,
            loanDeductions:    line.loanDeductions,
            advanceDeductions: line.advanceDeductions,
            netSalary:         line.netSalary,
            workingDays:       line.workingDays,
            daysWorked:        line.daysWorked,
            absentDays:        line.absentDays,
            overtimeHours:     line.overtimeHours,
            overtimePay:       line.overtimePay,
            // FIX [5]: PayrollStatus enum
            status: PayrollStatus.DRAFT,
            items: { create: line.items },
          },
        });

        if (opts.generatePayslips) {
          await tx.payslip.create({
            data: {
              payrollId:   payroll.id,
              schoolId,
              staffId:     line.staffId,
              fileUrl:     "",
              generatedAt: new Date(),
            },
          });
        }

        totalGross         += line.grossSalary;
        totalNet           += line.netSalary;
        totalAllowancesAcc += line.totalAllowances;
        totalDeductionsAcc += line.totalDeductions;
        totalNSSFAcc       += line.nssfEmployee + line.nssfEmployer;
        totalPAYEAcc       += line.payeAmount;
      }

      return tx.payrollBatch.update({
        where: { id: batch.id },
        data: {
          processedCount:   computed.length,
          totalGrossSalary: totalGross,
          totalNetSalary:   totalNet,
          totalAllowances:  totalAllowancesAcc,
          totalDeductions:  totalDeductionsAcc,
          totalNSSF:        totalNSSFAcc,
          totalPAYE:        totalPAYEAcc,
        },
      });
    },
    { timeout: 30_000 },
  );

  revalidatePath(`/staff/payroll`);

  return {
    ok:      true,
    data:    result,
    message: `Payroll batch for ${payPeriod} created — ${allStaff.length} staff processed.`,
  };
}