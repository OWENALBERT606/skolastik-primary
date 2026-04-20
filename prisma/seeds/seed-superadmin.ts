// prisma/seeds/seed-superadmin.ts
// Creates a superadmin user who can access /dashboard
// Usage: npx tsx prisma/seeds/seed-superadmin.ts

import { PrismaClient, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SUPERADMIN = {
  email:     "admin@skolastik.app",
  firstName: "Super",
  lastName:  "Admin",
  phone:     "0700000099",
  password:  "SuperAdmin@2026",
};

async function main() {
  console.log("\n🚀 Seeding superadmin...\n");

  const hashedPassword = await bcrypt.hash(SUPERADMIN.password, 10);

  // Upsert the super_admin role
  const role = await db.role.upsert({
    where:  { roleName: "super_admin" },
    update: {},
    create: {
      displayName: "Super Admin",
      roleName:    "super_admin",
      description: "Full system access — platform administrator",
      permissions: [
        "dashboard.read",  "dashboard.update",
        "schools.create",  "schools.read",  "schools.update",  "schools.delete",
        "users.create",    "users.read",    "users.update",    "users.delete",
        "roles.create",    "roles.read",    "roles.update",    "roles.delete",
        "billing.create",  "billing.read",  "billing.update",  "billing.delete",
        "reports.create",  "reports.read",  "reports.update",  "reports.delete",
        "settings.create", "settings.read", "settings.update", "settings.delete",
      ],
    },
  });
  console.log(`✓ Role: ${role.displayName}`);

  // Remove old superadmin if it exists with a different email
  const oldAdmin = await db.user.findUnique({ where: { email: "superadmin@skolastik.com" } });
  if (oldAdmin) {
    await db.user.delete({ where: { id: oldAdmin.id } });
    console.log("↻ Removed old superadmin@skolastik.com");
  }

  // Upsert the superadmin user
  const existing = await db.user.findUnique({ where: { email: SUPERADMIN.email } });

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data:  {
        password:  hashedPassword,
        status:    true,
        isVerfied: true,
        roles:     { connect: { id: role.id } },
      },
    });
    console.log(`↻ Updated existing user: ${SUPERADMIN.email}`);
  } else {
    await db.user.create({
      data: {
        name:      `${SUPERADMIN.firstName} ${SUPERADMIN.lastName}`,
        firstName: SUPERADMIN.firstName,
        lastName:  SUPERADMIN.lastName,
        phone:     SUPERADMIN.phone,
        email:     SUPERADMIN.email,
        password:  hashedPassword,
        userType:  UserType.SCHOOL_ADMIN,
        status:    true,
        isVerfied: true,
        roles:     { connect: { id: role.id } },
      },
    });
    console.log(`✓ Created superadmin: ${SUPERADMIN.email}`);
  }

  console.log("\n─────────────────────────────────");
  console.log("✅ Done!\n");
  console.log(`  Email   : ${SUPERADMIN.email}`);
  console.log(`  Password: ${SUPERADMIN.password}`);
  console.log(`  URL     : /dashboard\n`);
}

main()
  .catch(e => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
