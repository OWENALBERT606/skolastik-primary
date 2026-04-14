import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  await db.teacher.deleteMany({});
  await db.staff.deleteMany({});
  await db.user.deleteMany({ where: { userType: "STAFF" } });
  console.log("✓ Cleaned staff, teachers and staff users");
}
main().catch(console.error).finally(() => db.$disconnect());
