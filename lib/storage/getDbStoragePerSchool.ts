import { db } from "@/prisma/db";

// Tables with schoolId — used to estimate each school's share
const TABLES_WITH_SCHOOL_ID = [
  "AcademicYear", "AcademicTerm", "ClassTemplate", "ClassYear",
  "Stream", "StreamSubject", "SubjectPaper", "Subject",
  "Teacher", "Student", "Parent", "Enrollment", "ReportCard",
  "FeeCategory", "FeeStructure", "FeeStructureItem",
  "StudentFeeAccount", "Invoice", "InvoiceItem",
  "FeeTransaction", "FeeReceipt", "InstallmentPlan", "Installment",
  "Bursary", "StudentBursary", "BursaryAllocation",
  "Expense", "ExpenseCategory", "Vendor", "Store", "StoreItem",
  "Staff", "StaffRole", "Payroll", "PayrollBatch",
  "Message", "SchoolEvent", "AppNotification", "AuditLog",
  "TimetableVersion", "TimetableSlot", "SchoolDayConfig", "SchoolDaySlot",
  "SchoolAsset", "SubjectGradingScale", "AOIGradingScale", "GradingConfig",
  "AutoInvoiceConfig", "FeeNotification", "PenaltyRule",
];

type TableSize = { table_name: string; total_bytes: bigint };
type RowFraction = { school_rows: bigint; total_rows: bigint };

export async function getDbStoragePerSchool(schoolId: string): Promise<number> {
  let totalBytes = 0;

  for (const table of TABLES_WITH_SCHOOL_ID) {
    try {
      // Get the true on-disk size of this table (data + indexes + TOAST)
      const sizeRows = await db.$queryRawUnsafe<TableSize[]>(
        `SELECT pg_total_relation_size('"${table}"') AS total_bytes`
      );
      const tableBytes = Number(sizeRows[0]?.total_bytes ?? 0);
      if (tableBytes === 0) continue;

      // Get this school's row fraction vs total rows
      const fracRows = await db.$queryRawUnsafe<RowFraction[]>(
        `SELECT
           COUNT(*) FILTER (WHERE "schoolId" = $1)::bigint AS school_rows,
           COUNT(*)::bigint AS total_rows
         FROM "${table}"`,
        schoolId
      );
      const schoolRows = Number(fracRows[0]?.school_rows ?? 0);
      const totalRows  = Number(fracRows[0]?.total_rows  ?? 1);

      if (totalRows === 0) continue;

      // Proportional share of this table's disk usage
      const fraction = schoolRows / totalRows;
      totalBytes += Math.round(tableBytes * fraction);
    } catch {
      // Table doesn't exist or column differs — skip
    }
  }

  return totalBytes;
}

/**
 * Returns the total PostgreSQL database size (all schemas).
 * Useful for showing the overall DB size on the dashboard.
 */
export async function getTotalDbSize(): Promise<number> {
  try {
    const rows = await db.$queryRaw<{ size: bigint }[]>`
      SELECT pg_database_size(current_database()) AS size
    `;
    return Number(rows[0]?.size ?? 0);
  } catch {
    return 0;
  }
}
