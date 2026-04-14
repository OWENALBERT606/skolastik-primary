import { redirect }           from "next/navigation";
import { db }                 from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import BursarParentsClient    from "./components/bursar-parents-client";

export default async function BursarParentsPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) redirect("/login");
  const schoolId = school.id;

  const parents = await db.parent.findMany({
    where:   { schoolId },
    orderBy: { firstName: "asc" },
    select: {
      id:          true,
      firstName:   true,
      lastName:    true,
      phone:       true,
      email:       true,
      address:     true,
      occupation:  true,
      relationship: true,
      students: {
        where:   { schoolId },
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
          gender:      true,
          feeAccounts: {
            orderBy: { createdAt: "desc" },
            take:    3,
            select: {
              id:            true,
              balance:       true,
              totalInvoiced: true,
              totalPaid:     true,
              term:          { select: { name: true } },
              academicYear:  { select: { year: true } },
            },
          },
          enrollments: {
            where:   { status: "ACTIVE" },
            take:    1,
            select: {
              classYear: { select: { classTemplate: { select: { name: true } } } },
              stream:    { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const parentsForUI = parents.map(p => ({
    id:           p.id,
    name:         `${p.firstName} ${p.lastName}`,
    phone:        p.phone,
    email:        p.email ?? null,
    address:      p.address ?? null,
    occupation:   p.occupation ?? null,
    relationship: p.relationship ?? null,
    students:     p.students.map(s => {
      const enr = s.enrollments[0];
      return {
        id:          s.id,
        name:        `${s.firstName} ${s.lastName}`,
        admissionNo: s.admissionNo,
        gender:      s.gender,
        class:       enr ? `${enr.classYear.classTemplate.name}${enr.stream ? ` ${enr.stream.name}` : ""}` : "—",
        feeAccounts: s.feeAccounts.map(fa => ({
          id:            fa.id,
          termLabel:     `${fa.academicYear.year} · ${fa.term.name}`,
          totalInvoiced: fa.totalInvoiced,
          totalPaid:     fa.totalPaid,
          balance:       fa.balance,
        })),
      };
    }),
  }));

  return <BursarParentsClient parents={parentsForUI} slug={slug} />;
}
