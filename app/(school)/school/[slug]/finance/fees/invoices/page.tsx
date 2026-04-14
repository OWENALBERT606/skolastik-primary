// app/school/[slug]/finance/fees/invoices/page.tsx
import { redirect }           from "next/navigation";
import { db }                 from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import InvoicesClient from "./components/InvoicesClient";

export default async function InvoicesPage({
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
  const activeTermId = activeYear?.terms[0]?.id ?? null;

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

  // ── Students for manual invoice creation ───────────────────────────────────
  const feeAccounts = await db.studentFeeAccount.findMany({
    where:   { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) },
    select: {
      id:      true,
      balance: true,
      student: {
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
        },
      },
    },
    orderBy: { student: { firstName: "asc" } },
  });

  // ── Fee structures for this term (for auto-invoice / manual creation) ──────
  const feeStructures = await db.feeStructure.findMany({
    where: {
      schoolId,
      isPublished: true,
      ...(activeTermId ? { termId: activeTermId } : {}),
    },
    select: {
      id:          true,
      name:        true,
      totalAmount: true,
      classYear: {
        select: {
          classTemplate: { select: { name: true } },
        },
      },
      items: {
        select: {
          id:           true,
          amount:       true,
          feeCategory:  { select: { id: true, name: true } },
        },
      },
    },
  });

  // ── Shape data for client ──────────────────────────────────────────────────
  const invoicesForUI = invoices.map((inv) => {
    const enr        = inv.studentFeeAccount.student.enrollments[0];
    const className  = enr?.classYear.classTemplate.name ?? "";
    const streamName = enr?.stream?.name ?? "";
    // canVoid: only DRAFT or ISSUED with no payments
    const canVoid = (inv.status === "DRAFT" || inv.status === "ISSUED") && inv.paidAmount === 0;

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

  const studentsForUI = feeAccounts.map((a) => ({
    accountId:   a.id,
    studentId:   a.student.id,
    studentName: `${a.student.firstName} ${a.student.lastName}`,
    admissionNo: a.student.admissionNo,
    balance:     a.balance,
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
    <div className="min-h-screen bg-slate-50/60 p-6">
      <InvoicesClient
        invoices={invoicesForUI}
        students={studentsForUI}
        feeStructures={feeStructuresForUI}
        slug={slug}
        userId={userId}
        school={{ ...school, address: school.address ?? undefined, contact: school.contact ?? undefined, email: school.email ?? undefined, logo: school.logo ?? undefined, primaryColor: school.primaryColor ?? undefined, accentColor: school.accentColor ?? undefined }}
      />
    </div>
  );
}