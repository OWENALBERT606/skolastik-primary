import bcrypt from "bcryptjs";
import { db } from "./db";
import { UserType } from "@prisma/client";

const currentYear = new Date().getFullYear();

const allPermissions = [
  "dashboard.create",
  "dashboard.read",
  "dashboard.update",
  "dashboard.delete",

  "users.create",
  "users.read",
  "users.update",
  "users.delete",

  "roles.create",
  "roles.read",
  "roles.update",
  "roles.delete",

  "schools.create",
  "schools.read",
  "schools.update",
  "schools.delete",

  "students.create",
  "students.read",
  "students.update",
  "students.delete",

  "teachers.create",
  "teachers.read",
  "teachers.update",
  "teachers.delete",

  "staff.create",
  "staff.read",
  "staff.update",
  "staff.delete",

  "parents.create",
  "parents.read",
  "parents.update",
  "parents.delete",

  "reports.create",
  "reports.read",
  "reports.update",
  "reports.delete",

  "settings.create",
  "settings.read",
  "settings.update",
  "settings.delete",

  "fees.create",
  "fees.read",
  "fees.update",
  "fees.delete",

  "payroll.create",
  "payroll.read",
  "payroll.update",
  "payroll.delete",
];

const userPermissions = [
  "dashboard.read",
  "profile.read",
  "profile.update",
  "orders.read",
  "orders.create",
];

// ─── Clean ────────────────────────────────────────────────────────────────────
// No $transaction — avoids P2028 timeout on large schemas.
// Deletes run directly on db in FK-safe order (children before parents).

async function cleanDatabase() {
  console.log("🧹 Cleaning up existing data...");

  // Break many-to-many join between User <-> Role first
  const users = await db.user.findMany({ include: { roles: true } });
  for (const user of users) {
    if (user.roles.length > 0) {
      await db.user.update({
        where: { id: user.id },
        data: { roles: { disconnect: user.roles.map((r) => ({ id: r.id })) } },
      });
    }
  }

  // Auth
  await db.session.deleteMany({});
  await db.account.deleteMany({});

  // Audit
  await db.markAuditLog.deleteMany({});

  // Inventory
  await db.stockMovement.deleteMany({});
  await db.stockItem.deleteMany({});
  await db.store.deleteMany({});

  // Expenses
  await db.expense.deleteMany({});
  await db.expenseCategory.deleteMany({});
  await db.vendor.deleteMany({});

  // Fees — children first
  await db.feeNotification.deleteMany({});
  await db.carryForwardLog.deleteMany({});
  await db.bursaryAllocation.deleteMany({});
  await db.installment.deleteMany({});
  await db.installmentPlan.deleteMany({});
  await db.feeReceipt.deleteMany({});
  await db.feeTransaction.deleteMany({});
  await db.invoiceItem.deleteMany({});
  await db.invoice.deleteMany({});
  await db.studentFeeAccount.deleteMany({});
  await db.studentBursary.deleteMany({});
  await db.bursary.deleteMany({});
  await db.penaltyRule.deleteMany({});
  await db.autoInvoiceConfig.deleteMany({});
  await db.feeStructureItem.deleteMany({});
  await db.feeStructure.deleteMany({});
  await db.feeCategory.deleteMany({});

  // HR / Payroll — children first
  await db.noticeAcknowledgement.deleteMany({});
  await db.staffNotice.deleteMany({});
  await db.trainingParticipant.deleteMany({});
  await db.trainingProgram.deleteMany({});
  await db.exitRecord.deleteMany({});
  await db.grievanceRecord.deleteMany({});
  await db.disciplinaryRecord.deleteMany({});
  await db.staffDocument.deleteMany({});
  await db.performanceAppraisal.deleteMany({});
  await db.appraisalCycle.deleteMany({});
  await db.loanRepayment.deleteMany({});
  await db.staffLoan.deleteMany({});
  await db.advanceRepayment.deleteMany({});
  await db.salaryAdvance.deleteMany({});
  await db.statutoryReportItem.deleteMany({});
  await db.statutoryReport.deleteMany({});
  await db.payslip.deleteMany({});
  await db.payrollItem.deleteMany({});
  await db.payroll.deleteMany({});
  await db.payrollBatch.deleteMany({});
  await db.leaveRequest.deleteMany({});
  await db.leaveBalance.deleteMany({});
  await db.overtimeRequest.deleteMany({});
  await db.attendanceSummary.deleteMany({});
  await db.attendanceRecord.deleteMany({});
  await db.employmentHistory.deleteMany({});
  await db.staffContract.deleteMany({});
  await db.staffRole.deleteMany({});
  await db.staffAllowanceProfile.deleteMany({});
  await db.staffDeductionProfile.deleteMany({});
  await db.staff.deleteMany({});
  await db.staffRoleDefinition.deleteMany({});

  // Academic — children first
  await db.subjectFinalMark.deleteMany({});
  await db.subjectResult.deleteMany({});
  await db.reportCard.deleteMany({});
  await db.mark.deleteMany({});
  await db.examMark.deleteMany({});
  await db.exam.deleteMany({});
  await db.studentSubjectEnrollment.deleteMany({});
  await db.enrollmentTransferHistory.deleteMany({});
  await db.enrollment.deleteMany({});
  await db.streamSubjectTeacherHistory.deleteMany({});
  await db.streamSubject.deleteMany({});
  await db.classAssessmentConfig.deleteMany({});
  await db.stream.deleteMany({});
  await db.classSubject.deleteMany({});
  await db.gradeBoundary.deleteMany({});
  await db.gradingConfig.deleteMany({});
  await db.subjectGradeBoundary.deleteMany({});
  await db.subjectGradingScale.deleteMany({});
  await db.subject.deleteMany({});
  await db.teacherYearEnrollment.deleteMany({});
  await db.teacher.deleteMany({});
  await db.student.deleteMany({});
  await db.parent.deleteMany({});
  await db.classYear.deleteMany({});
  await db.classTemplate.deleteMany({});
  await db.academicTerm.deleteMany({});
  await db.academicYear.deleteMany({});

  // School after all school-scoped data is cleared
  await db.school.deleteMany({});

  // Users & roles last
  const deletedUsers = await db.user.deleteMany({});
  console.log("  Deleted users:", deletedUsers.count);

  const deletedRoles = await db.role.deleteMany({});
  console.log("  Deleted roles:", deletedRoles.count);

  console.log("✅ Database cleanup completed.");
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedDatabase() {
  console.log("🌱 Seeding new data...");

  const adminRole = await db.role.create({
    data: {
      displayName: "Administrator",
      roleName: "super_admin",
      description: "Full system access",
      permissions: allPermissions,
    },
  });

  const userRole = await db.role.create({
    data: {
      displayName: "User",
      roleName: "user",
      description: "Basic user access",
      permissions: userPermissions,
    },
  });

  const adminPassword = `Admin@${currentYear}`;
  await db.user.create({
    data: {
      email: "admin@admin.com",
      name: "System Admin",
      firstName: "System",
      lastName: "Admin",
      phone: "1234567890",
      password: await bcrypt.hash(adminPassword, 10),
      userType: UserType.SCHOOL_ADMIN,
      isVerfied: true,
      roles: { connect: { id: adminRole.id } },
    },
  });


  const userPassword = `User@${currentYear}`;
  await db.user.create({
    data: {
      email: "user@user.com",
      name: "Regular User",
      firstName: "Regular",
      lastName: "User",
      phone: "0987654321",
      password: await bcrypt.hash(userPassword, 10),
      userType: UserType.SCHOOL_ADMIN,
      isVerfied: true,
      roles: { connect: { id: userRole.id } },
    },
  });

  console.log("\n✅ Seed completed!");
  console.log("─────────────────────────────────────");
  console.log("  Admin →  admin@admin.com  /", adminPassword);
  console.log("  User  →  user@user.com    /", userPassword);
  console.log("─────────────────────────────────────");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting database seed process...\n");
  try {
    await cleanDatabase();
    await seedDatabase();
    console.log("\n🎉 Done!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });