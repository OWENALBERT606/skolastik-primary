// Bursar invoices page — fetches students from Enrollment (not just those with fee accounts)
import { redirect }           from "next/navigation";
import { db }                 from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import InvoicesClient from "@/app/(school)/school/[slug]/finance/fees/invoices/components/InvoicesClient";
import BursarCreateInvoiceButton from "./components/bursar-invoices-client";

export default async function BursarInvoicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true, address: true, contact: true, email: true, logo: true, primaryColor: true, accentColor: true },
  });
  if (!school) redirect("/login");

  const schoolId = school.id;
  const userId   = userData.id;

  // ── Active term ────────────────────────────────────────────────────────────
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });
  const activeTermId     = activeYear?.terms[0]?.id ?? null;
  const activeYearId     = activeYear?.id ?? null;

  // ── Invoices for this term ─────────────────────────────────────────────────
  const invoices = await db.invoice.findMany({
    where: {
      studentFeeAccount: {
        schoolId,
        ...(activeTermId ? { termId: activeTermId } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    take:    500,
    include: {
      studentFeeAccount: {
        select: {
          id:           true,
          balance:      true,
          carryForward: true,
          student: {
            select: {
              id:          true,
              firstName:   true,
              lastName:    true,
              admissionNo: true,
              enrollments: {
                where:   { status: "ACTIVE" },
                orderBy: { createdAt: "desc" },
                take:    1,
                select: {
                  classYear: { select: { classTemplate: { select: { name: true } } } },
                  stream:    { select: { name: true } },
                },
              },
            },
          },
        },
      },
      items: {
        select: {
          id:          true,
          description: true,
          amount:      true,
          quantity:    true,
          unitPrice:   true,
          feeCategory: { select: { name: true } },
        },
      },
      receipts: {
        select: { receiptNumber: true, issuedAt: true },
        orderBy: { issuedAt: "desc" },
      },
    },
  });

  // ── Students: fetch from ENROLLMENTS so uninvoiced students appear too ─────
  const enrollments = await db.enrollment.findMany({
    where: {
      status: "ACTIVE",
      student: { schoolId },
      ...(activeTermId  ? { termId:         activeTermId  } : {}),
      ...(activeYearId  ? { academicYearId: activeYearId  } : {}),
    },
    select: {
      student: {
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
          // Existing fee account for this term (may be null)
          feeAccounts: {
            where: {
              schoolId,
              ...(activeTermId  ? { termId:         activeTermId  } : {}),
              ...(activeYearId  ? { academicYearId: activeYearId  } : {}),
            },
            take:   1,
            select: { id: true, balance: true },
          },
        },
      },
    },
    orderBy: { student: { firstName: "asc" } },
  });

  // ── Fee structures for this term ───────────────────────────────────────────
  const feeStructures = await db.feeStructure.findMany({
    where: {
      schoolId,
      isPublished: true,
      ...(activeTermId  ? { termId:         activeTermId  } : {}),
      ...(activeYearId  ? { academicYearId: activeYearId  } : {}),
    },
    select: {
      id:          true,
      name:        true,
      totalAmount: true,
      classYear: { select: { classTemplate: { select: { name: true } } } },
      items: {
        select: {
          id:          true,
          amount:      true,
          feeCategory: { select: { id: true, name: true } },
        },
      },
    },
  });

  // ── Shape data ─────────────────────────────────────────────────────────────
  const invoicesForUI = invoices.map((inv) => {
    const enr        = inv.studentFeeAccount.student.enrollments[0];
    const className  = enr?.classYear.classTemplate.name ?? "";
    const streamName = enr?.stream?.name ?? "";
    const canVoid    = (inv.status === "DRAFT" || inv.status === "ISSUED") && inv.paidAmount === 0;
    return {
      id:                  inv.id,
      invoiceNumber:       inv.invoiceNumber,
      studentFeeAccountId: inv.studentFeeAccountId,
      studentId:           inv.studentFeeAccount.student.id,
      studentName:         `${inv.studentFeeAccount.student.firstName} ${inv.studentFeeAccount.student.lastName}`,
      admissionNo:         inv.studentFeeAccount.student.admissionNo,
      class:               streamName ? `${className} ${streamName}` : className,
      totalAmount:         inv.totalAmount,
      paidAmount:          inv.paidAmount,
      discountAmount:      inv.discountAmount,
      waivedAmount:        inv.waivedAmount,
      balance:             inv.balance,
      carryForward:        inv.studentFeeAccount.carryForward ?? 0,
      status:              inv.status  as "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID",
      trigger:             inv.trigger as string,
      issueDate:           inv.issueDate.toISOString(),
      dueDate:             inv.dueDate?.toISOString() ?? null,
      notes:               inv.notes ?? null,
      canVoid,
      items: inv.items.map((item) => ({
        id:          item.id,
        name:        item.feeCategory.name,
        description: item.description ?? null,
        amount:      item.amount,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
      })),
      receipts: inv.receipts.map((r) => ({
        receiptNumber: r.receiptNumber,
        issuedAt:      r.issuedAt.toISOString(),
      })),
    };
  });

  // Deduplicate by studentId (enrollment may have duplicates)
  const seenStudents = new Set<string>();
  const studentsForUI = enrollments
    .filter((e) => {
      if (seenStudents.has(e.student.id)) return false;
      seenStudents.add(e.student.id);
      return true;
    })
    .map((e) => ({
      accountId:   e.student.feeAccounts[0]?.id ?? e.student.id, // fall back to studentId so dropdown shows them
      studentId:   e.student.id,
      studentName: `${e.student.firstName} ${e.student.lastName}`,
      admissionNo: e.student.admissionNo,
      balance:     e.student.feeAccounts[0]?.balance ?? 0,
      hasAccount:  !!e.student.feeAccounts[0],
    }));

  const feeStructuresForUI = feeStructures.map((fs) => ({
    id:          fs.id,
    name:        fs.name ?? `${fs.classYear.classTemplate.name} Fee Structure`,
    totalAmount: fs.totalAmount,
    className:   fs.classYear.classTemplate.name,
    items:       fs.items.map((i) => ({
      feeCategoryId:   i.feeCategory.id,
      feeCategoryName: i.feeCategory.name,
      amount:          i.amount,
    })),
  }));

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-4">
      {/* Bursar-specific create invoice button (handles students without fee accounts) */}
      <div className="flex justify-end">
        <BursarCreateInvoiceButton
          slug={slug}
          userId={userId}
          schoolId={schoolId}
          academicYearId={activeYearId ?? ""}
          termId={activeTermId ?? ""}
          students={studentsForUI.map(s => ({
            studentId:   s.studentId,
            studentName: s.studentName,
            admissionNo: s.admissionNo,
            hasAccount:  s.hasAccount,
            accountId:   s.accountId,
          }))}
          feeStructures={feeStructuresForUI}
        />
      </div>
      <InvoicesClient
        invoices={invoicesForUI}
        students={studentsForUI}
        feeStructures={feeStructuresForUI}
        slug={slug}
        userId={userId}
        school={{ ...school, address: school.address ?? undefined, contact: school.contact ?? undefined, email: school.email ?? undefined, logo: school.logo ?? undefined, primaryColor: school.primaryColor ?? undefined, accentColor: school.accentColor ?? undefined }}
        hideCreateButton
      />
    </div>
  );
}
