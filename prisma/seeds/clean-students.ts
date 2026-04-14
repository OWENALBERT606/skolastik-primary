import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  await db.studentSubjectEnrollment.deleteMany({});
  await db.enrollment.deleteMany({});
  await db.student.deleteMany({});
  await db.user.deleteMany({ where: { userType: "STUDENT" } });
  console.log("✓ Cleaned students, enrollments and student users");
}
main().catch(console.error).finally(() => db.$disconnect());
