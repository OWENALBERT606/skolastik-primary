import { redirect }           from "next/navigation";
import { db }                 from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import BursarStudentsClient   from "./components/bursar-students-client";

export default async function BursarStudentsPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) redirect("/login");
  const schoolId = school.id;

  const students = await db.student.findMany({
    where:   { schoolId, isActive: true },
    orderBy: { firstName: "asc" },
    select: {
      id:          true,
      firstName:   true,
      lastName:    true,
      admissionNo: true,
      gender:      true,
      dob:         true,
      parent: {
        select: {
          id:           true,
          firstName:    true,
          lastName:     true,
          phone:        true,
          email:        true,
          address:      true,
          relationship: true,
        },
      },
      enrollments: {
        where:   { status: "ACTIVE" },
        take:    1,
        orderBy: { createdAt: "desc" },
        select: {
          classYear: { select: { classTemplate: { select: { name: true } } } },
          stream:    { select: { name: true } },
        },
      },
      feeAccounts: {
        orderBy: [{ academicYear: { year: "desc" } }, { term: { termNumber: "desc" } }],
        take:    6,
        select: {
          id:            true,
          balance:       true,
          totalInvoiced: true,
          totalPaid:     true,
          totalDiscount: true,
          status:        true,
          term:          { select: { name: true, termNumber: true } },
          academicYear:  { select: { year: true } },
          invoices: {
            orderBy: { createdAt: "desc" },
            take:    5,
            select: {
              id:            true,
              invoiceNumber: true,
              totalAmount:   true,
              paidAmount:    true,
              balance:       true,
              status:        true,
              issueDate:     true,
            },
          },
        },
      },
    },
  });

  const studentsForUI = students.map(s => {
    const enr = s.enrollments[0];
    return {
      id:          s.id,
      name:        `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      gender:      s.gender,
      dob:         s.dob?.toISOString().split("T")[0] ?? null,
      class:       enr ? `${enr.classYear.classTemplate.name}${enr.stream ? ` ${enr.stream.name}` : ""}` : "—",
      parent:      s.parent ? {
        id:           s.parent.id,
        name:         `${s.parent.firstName} ${s.parent.lastName}`,
        phone:        s.parent.phone,
        email:        s.parent.email ?? null,
        address:      s.parent.address ?? null,
        relationship: s.parent.relationship ?? null,
      } : null,
      feeAccounts: s.feeAccounts.map(fa => ({
        id:            fa.id,
        termLabel:     `${fa.academicYear.year} · ${fa.term.name}`,
        totalInvoiced: fa.totalInvoiced,
        totalPaid:     fa.totalPaid,
        totalDiscount: fa.totalDiscount,
        balance:       fa.balance,
        status:        fa.status,
        invoices:      fa.invoices.map(inv => ({
          id:            inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalAmount:   inv.totalAmount,
          paidAmount:    inv.paidAmount,
          balance:       inv.balance,
          status:        inv.status,
          issueDate:     inv.issueDate.toISOString(),
        })),
      })),
    };
  });

  return <BursarStudentsClient students={studentsForUI} slug={slug} />;
}
