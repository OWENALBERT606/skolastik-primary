import { getServerSession }  from "next-auth/next";
import { authOptions }        from "@/config/auth";
import { redirect }           from "next/navigation";
import { db }                 from "@/prisma/db";
import { Session }            from "next-auth";
import StudentAccountsPage    from "@/app/(school)/school/[slug]/finance/fees/accounts/components/StudentAccountsClient";

export default async function BursarAccountsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  if (!schoolId) redirect("/login");

  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });
  const activeTermId = activeYear?.terms[0]?.id ?? null;

  const accounts = await db.studentFeeAccount.findMany({
    where:   { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) },
    orderBy: { balance: "desc" },
    include: {
      student: {
        select: {
          id: true, firstName: true, lastName: true, admissionNo: true,
          enrollments: {
            where:   { status: "ACTIVE" },
            select: {
              classYear: { select: { classTemplate: { select: { name: true } } } },
              stream:    { select: { name: true } },
            },
            take: 1, orderBy: { createdAt: "desc" },
          },
        },
      },
      term: { select: { name: true, termNumber: true } },
    },
  });

  const accountsForUI = accounts.map((a) => {
    const enr        = a.student.enrollments[0];
    const className  = enr?.classYear.classTemplate.name ?? "";
    const streamName = enr?.stream?.name ?? "";
    return {
      id:                   a.id,
      studentId:            a.student.id,
      studentName:          `${a.student.firstName} ${a.student.lastName}`,
      admissionNo:          a.student.admissionNo,
      class:                streamName ? `${className} ${streamName}` : className,
      termName:             a.term.name,
      totalInvoiced:        a.totalInvoiced,
      totalPaid:            a.totalPaid,
      totalDiscount:        a.totalDiscount,
      totalPenalty:         a.totalPenalty,
      totalWaived:          a.totalWaived,
      totalRefunded:        a.totalRefunded,
      carryForward:         a.carryForward,
      balance:              a.balance,
      status:               a.status as "ACTIVE" | "CLEARED" | "OVERPAID" | "SUSPENDED",
      autoInvoiceGenerated: a.autoInvoiceGenerated,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <StudentAccountsPage
        accounts={accountsForUI}
        slug={slug}
        basePath="bursar"
      />
    </div>
  );
}
