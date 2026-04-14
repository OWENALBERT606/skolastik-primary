// prisma/seeds/seed-demo.ts
//
// Seeds 2 Uganda primary schools with school admin accounts.
//
// What gets created:
//   1. School Admin role
//   2. Admin user per school
//   3. School record linked to its admin
//
// Usage:
//   npx tsx prisma/seeds/seed-demo.ts
//
// Default password for all admin accounts: Password@123

import { PrismaClient, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// SCHOOL DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SCHOOLS = [
  {
    name:    "Demo Primary School",
    motto:   "Excellence in Education",
    slug:    "demo-primary-school",
    code:    "DPS",
    address: "Nakasero, Kampala",
    contact: "0414-230100",
    email:   "info@dps.ac.ug",
    admin: {
      firstName: "Robert",
      lastName:  "Ssemakula",
      email:     "admin@dps.ac.ug",
      phone:     "0701000001",
    },
  },
  {
    name:    "Demo 2 Primary School",
    motto:   "Knowledge is Power",
    slug:    "demo-2-primary-school",
    code:    "DPS2",
    address: "Buganda Road, Kampala",
    contact: "0414-251200",
    email:   "info@dps2.ac.ug",
    admin: {
      firstName: "Grace",
      lastName:  "Namutebi",
      email:     "admin@dps2.ac.ug",
      phone:     "0701000002",
    },
  },
];

const SCHOOL_ADMIN_PERMISSIONS = [
  "dashboard.read",  "dashboard.update",
  "users.create",    "users.read",    "users.update",    "users.delete",
  "students.create", "students.read", "students.update", "students.delete",
  "teachers.create", "teachers.read", "teachers.update", "teachers.delete",
  "staff.create",    "staff.read",    "staff.update",    "staff.delete",
  "parents.create",  "parents.read",  "parents.update",  "parents.delete",
  "reports.create",  "reports.read",  "reports.update",  "reports.delete",
  "settings.create", "settings.read", "settings.update", "settings.delete",
  "fees.create",     "fees.read",     "fees.update",     "fees.delete",
  "payroll.create",  "payroll.read",  "payroll.update",  "payroll.delete",
];

// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — ROLE
// ════════════════════════════════════════════════════════════════════════════

async function seedRole() {
  console.log("\n📋 Step 1 — School admin role...");

  const role = await db.role.upsert({
    where:  { roleName: "school_admin" },
    update: {},
    create: {
      displayName: "School Admin",
      roleName:    "school_admin",
      description: "Full access to a single school's data",
      permissions: SCHOOL_ADMIN_PERMISSIONS,
    },
  });

  console.log(`   ✓  Role: ${role.displayName}`);
  return role;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — ADMIN USERS + SCHOOLS
// ════════════════════════════════════════════════════════════════════════════

async function seedSchools(role: { id: string }, hashedPassword: string) {
  console.log("\n🏫 Step 2 — Schools + admin users...");

  for (const def of SCHOOLS) {
    // 1. Upsert admin user
    let adminUser = await db.user.findUnique({ where: { email: def.admin.email } });

    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          name:      `${def.admin.firstName} ${def.admin.lastName}`,
          firstName: def.admin.firstName,
          lastName:  def.admin.lastName,
          phone:     def.admin.phone,
          email:     def.admin.email,
          password:  hashedPassword,
          userType:  UserType.SCHOOL_ADMIN,
          status:    true,
          isVerfied: true,
          roles:     { connect: { id: role.id } },
        },
      });
      console.log(`   ✓  Admin user: ${def.admin.email}`);
    } else {
      console.log(`   ↻  Admin user already exists: ${def.admin.email}`);
    }

    // 2. Upsert school
    let school = await db.school.findUnique({ where: { code: def.code } });

    if (!school) {
      school = await db.school.create({
        data: {
          name:     def.name,
          motto:    def.motto,
          slug:     def.slug,
          code:     def.code,
          address:  def.address,
          contact:  def.contact,
          email:    def.email,
          isActive: true,
          adminId:  adminUser.id,
          users:    { connect: { id: adminUser.id } },
        },
      });

      // Link school back to admin user
      await db.user.update({
        where: { id: adminUser.id },
        data:  { schoolId: school.id },
      });

      console.log(`   ✓  School: ${school.name} (${school.code})`);
    } else {
      console.log(`   ↻  School already exists: ${def.name}`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀 Seeding schools...");
  console.log("─".repeat(50));

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  const role = await seedRole();
  await seedSchools(role, hashedPassword);

  console.log("\n" + "─".repeat(50));
  console.log("✅ Done!\n");
  console.log("Admin logins (password: Password@123):");
  for (const s of SCHOOLS) {
    console.log(`  ${s.admin.email}`);
  }
  console.log();
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
