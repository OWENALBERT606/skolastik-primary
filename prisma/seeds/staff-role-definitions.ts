// prisma/seeds/staff-role-definitions.ts
//
// Seeds StaffRoleDefinition records for one or all schools.
// Safe to re-run — uses upsert logic (create or update).
//
// Usage:
//   npx ts-node prisma/seeds/staff-role-definitions.ts <schoolId>   ← one school
//   npx ts-node prisma/seeds/staff-role-definitions.ts               ← all schools

import { PrismaClient, StaffRoleType } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// SHARED DB INSTANCE
// Used by both the exported functions and the CLI runner.
// FIX: removed the undefined getDb() calls — all functions use this single
// module-level client instead.
// ════════════════════════════════════════════════════════════════════════════

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// ROLE DEFINITIONS CATALOGUE
// ════════════════════════════════════════════════════════════════════════════

const ROLE_DEFINITIONS: {
  roleType:      StaffRoleType;
  name:          string;
  code:          string;
  description:   string;
  permissions:   string[];
  dashboardPath?: string;
}[] = [
  // ── Teaching & Academic Leadership ──────────────────────────────────────
  {
    roleType:      StaffRoleType.TEACHER,
    name:          "Teacher",
    code:          "TEACHER",
    description:   "Classroom teacher. Teaches assigned subjects, enters marks and AOI scores.",
    permissions:   [
      "view_classes",
      "view_students",
      "manage_marks",
      "manage_aoi",
      "view_timetable",
      "view_notices",
    ],
    dashboardPath: "/dashboard/teacher",
  },
  {
    roleType:      StaffRoleType.DOS,
    name:          "Director of Studies",
    code:          "DOS",
    description:   "Oversees academic programmes, subject assignments, timetabling and exam schedules.",
    permissions:   [
      "view_classes",
      "manage_classes",
      "view_students",
      "manage_marks",
      "manage_aoi",
      "manage_subjects",
      "manage_timetable",
      "manage_exams",
      "view_reports",
      "view_teachers",
      "manage_assignments",
      "view_notices",
      "manage_notices",
    ],
    dashboardPath: "/dashboard/dos",
  },
  {
    roleType:      StaffRoleType.DEPUTY_HEAD,
    name:          "Deputy Headteacher",
    code:          "DEPUTY_HEAD",
    description:   "Assists the headteacher. Oversees discipline, timetabling and staff coordination.",
    permissions:   [
      "view_classes",
      "manage_classes",
      "view_students",
      "manage_students",
      "view_teachers",
      "manage_assignments",
      "view_reports",
      "manage_reports",
      "view_notices",
      "manage_notices",
      "manage_attendance",
      "view_staff",
    ],
    dashboardPath: "/dashboard/admin",
  },
  {
    roleType:      StaffRoleType.HEAD_TEACHER,
    name:          "Headteacher",
    code:          "HEAD_TEACHER",
    description:   "Overall head of the school. Full access to all modules.",
    permissions:   [
      "view_classes",       "manage_classes",
      "view_students",      "manage_students",
      "view_teachers",      "manage_teachers",
      "view_staff",         "manage_staff",
      "view_reports",       "manage_reports",
      "view_notices",       "manage_notices",
      "manage_attendance",
      "view_finance",       "manage_finance",
      "view_payroll",       "manage_payroll",
      "manage_subjects",    "manage_timetable",
      "manage_exams",       "manage_assignments",
    ],
    dashboardPath: "/dashboard/headteacher",
  },

  // ── Administration ───────────────────────────────────────────────────────
  {
    roleType:      StaffRoleType.SECRETARY,
    name:          "Secretary",
    code:          "SECRETARY",
    description:   "Front office and school administration. Handles admissions, correspondence and records.",
    permissions:   [
      "view_students",
      "manage_students",
      "view_parents",
      "view_notices",
      "manage_notices",
      "view_reports",
    ],
    dashboardPath: "/dashboard/admin",
  },
  {
    roleType:      StaffRoleType.ACCOUNTANT,
    name:          "Accountant",
    code:          "ACCOUNTANT",
    description:   "Manages school fees, invoices, payments, expenses and financial reports.",
    permissions:   [
      "view_students",
      "view_finance",       "manage_finance",
      "manage_fees",        "manage_invoices",
      "manage_payments",    "manage_expenses",
      "view_payroll",       "manage_payroll",
      "view_reports",       "manage_reports",
      "view_notices",
    ],
    dashboardPath: "/dashboard/accounts",
  },
  {
    roleType:      StaffRoleType.ADMIN,
    name:          "Administrator",
    code:          "ADMIN",
    description:   "General school administrator. Access to admin functions across modules.",
    permissions:   [
      "view_students",      "manage_students",
      "view_staff",         "view_teachers",
      "view_reports",
      "view_notices",       "manage_notices",
      "view_finance",
    ],
    dashboardPath: "/dashboard/admin",
  },
  {
    roleType:      StaffRoleType.IT_OFFICER,
    name:          "IT Officer",
    code:          "IT_OFFICER",
    description:   "Manages school ICT infrastructure, devices, network and software systems.",
    permissions:   [
      "view_notices",
      "view_reports",
    ],
    dashboardPath: "/dashboard/admin",
  },

  // ── Specialist Support ───────────────────────────────────────────────────
  {
    roleType:      StaffRoleType.LIBRARIAN,
    name:          "Librarian",
    code:          "LIBRARIAN",
    description:   "Manages the school library — books, borrowing records and reading programmes.",
    permissions:   [
      "view_students",
      "view_notices",
    ],
    dashboardPath: "/dashboard/library",
  },
  {
    roleType:      StaffRoleType.STORE_KEEPER,
    name:          "Store Keeper",
    code:          "STORE_KEEPER",
    description:   "Manages school stores, stock items and inventory movements.",
    permissions:   [
      "view_stores",        "manage_stores",
      "manage_stock",
      "view_notices",
    ],
    dashboardPath: "/dashboard/stores",
  },
  {
    roleType:      StaffRoleType.NURSE,
    name:          "Nurse / Medical Officer",
    code:          "NURSE",
    description:   "Manages student and staff health records, first aid and medical referrals.",
    permissions:   [
      "view_students",
      "view_staff",
      "view_notices",
    ],
    dashboardPath: "/dashboard/admin",
  },
  {
    roleType:      StaffRoleType.COUNSELOR,
    name:          "Guidance & Counselor",
    code:          "COUNSELOR",
    description:   "Provides student guidance, counselling and career advice.",
    permissions:   [
      "view_students",
      "view_notices",
      "view_reports",
    ],
    dashboardPath: "/dashboard/admin",
  },

  // ── General Support Staff ────────────────────────────────────────────────
  {
    roleType:      StaffRoleType.SECURITY,
    name:          "Security Personnel",
    code:          "SECURITY",
    description:   "School security, gate control and premises safety.",
    permissions:   ["view_notices"],
  },
  {
    roleType:      StaffRoleType.COOK,
    name:          "Cook / Catering Staff",
    code:          "COOK",
    description:   "School kitchen and catering services.",
    permissions:   ["view_notices"],
  },
  {
    roleType:      StaffRoleType.CLEANER,
    name:          "Cleaner",
    code:          "CLEANER",
    description:   "School cleaning, sanitation and general maintenance.",
    permissions:   ["view_notices"],
  },
  {
    roleType:      StaffRoleType.DRIVER,
    name:          "Driver",
    code:          "DRIVER",
    description:   "School transport — ferrying students and staff.",
    permissions:   ["view_notices"],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// CORE SEED — one school
// FIX: replaced getDb() with the module-level db instance throughout
// ════════════════════════════════════════════════════════════════════════════

export async function seedStaffRoleDefinitions(schoolId: string) {
  let created = 0;
  let updated = 0;
  let failed  = 0;

  for (const role of ROLE_DEFINITIONS) {
    try {
      const existing = await db.staffRoleDefinition.findUnique({
        where: { schoolId_code: { schoolId, code: role.code } },
      });

      if (existing) {
        await db.staffRoleDefinition.update({
          where: { id: existing.id },
          data: {
            name:          role.name,
            description:   role.description,
            permissions:   role.permissions,
            dashboardPath: role.dashboardPath ?? null,
            isActive:      true,
          },
        });
        updated++;
      } else {
        await db.staffRoleDefinition.create({
          data: {
            schoolId,
            roleType:      role.roleType,
            name:          role.name,
            code:          role.code,
            description:   role.description,
            permissions:   role.permissions,
            dashboardPath: role.dashboardPath ?? null,
            isActive:      true,
          },
        });
        created++;
      }
    } catch (error: any) {
      console.error(`  ✗ Failed: ${role.name} — ${error.message}`);
      failed++;
    }
  }

  return { created, updated, failed };
}

// ════════════════════════════════════════════════════════════════════════════
// SEED ALL SCHOOLS — useful for backfilling existing databases
// ════════════════════════════════════════════════════════════════════════════

export async function seedAllSchools() {
  const schools = await db.school.findMany({
    select: { id: true, name: true },
  });

  if (schools.length === 0) {
    console.log("⚠️  No schools found.");
    return;
  }

  console.log(`\n🏫 Seeding ${schools.length} school(s)...\n`);

  for (const school of schools) {
    console.log(`─── ${school.name} (${school.id})`);
    const result = await seedStaffRoleDefinitions(school.id);
    console.log(`    ✓ ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  }

  console.log("\n🎉 Done.\n");
}

// ════════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// FIX: removed the orphaned main() at the top of the file and the duplicate
// standaloneDb instance. The single module-level db is disconnected in
// the finally block below.
// ════════════════════════════════════════════════════════════════════════════

const isMain =
  typeof require !== "undefined" &&
  require.main === module;

if (isMain) {
  async function run() {
    try {
      const schoolId = process.argv[2];

      if (schoolId) {
        const school = await db.school.findUnique({
          where:  { id: schoolId },
          select: { id: true, name: true },
        });

        if (!school) {
          console.error(`❌ School not found: ${schoolId}`);
          process.exit(1);
        }

        console.log(`\n🏫 Seeding: ${school.name}`);
        const result = await seedStaffRoleDefinitions(school.id);
        console.log(
          `✅ Done — ${result.created} created, ${result.updated} updated, ${result.failed} failed\n`
        );
      } else {
        await seedAllSchools();
      }
    } catch (error) {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    } finally {
      await db.$disconnect();
    }
  }

  run();
}