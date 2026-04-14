import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const staff = await db.staff.findMany({ take: 4, select: { staffId: true, staffType: true }, orderBy: { createdAt: "asc" } });
  const teachers = await db.teacher.findMany({ take: 4, select: { staffNo: true }, orderBy: { createdAt: "asc" } });
  const students = await db.student.findMany({ take: 4, select: { admissionNo: true }, orderBy: { createdAt: "asc" } });
  console.log("Staff IDs:", staff);
  console.log("Teacher staffNos:", teachers);
  console.log("Student admNos:", students);
}
main().catch(console.error).finally(() => db.$disconnect());
