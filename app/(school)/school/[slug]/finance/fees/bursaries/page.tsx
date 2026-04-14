// // app/school/[slug]/finance/fees/bursaries/page.tsx

// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/config/auth";
// import { redirect } from "next/navigation";
// import { db } from "@/prisma/db";
// import { Session } from "next-auth";
// import BursariesClient from "./components/BursariesClient";

// export default async function BursariesPage({
//   params,
// }: {
//   params: Promise<{ slug: string }>;
// }) {
//   const { slug } = await params;

//   const session  = (await getServerSession(authOptions)) as Session | null;
//   const schoolId = session?.user?.school?.id;
//   const userId   = session?.user?.id;

//   if (!schoolId || !slug || !userId) {
//     redirect("/login");
//   }

//   // Bursary schemes with beneficiary count
//   const bursaries = await db.bursary.findMany({
//     where: { schoolId },
//     orderBy: { createdAt: "desc" },
//     include: {
//       _count: { select: { studentBursaries: true } },
//     },
//   });

//   // Active enrolled students for the assign dialog
//   const students = await db.student.findMany({
//     where: { schoolId, isActive: true },
//     select: {
//       id:        true,
//       firstName: true,
//       lastName:  true,
//       admissionNo: true,
//       enrollments: {
//         where:   { status: "ACTIVE" },
//         select:  {
//           classYear: {
//             select: {
//               classTemplate: { select: { name: true } },
//             },
//           },
//           stream: { select: { name: true } },
//         },
//         take: 1,
//         orderBy: { createdAt: "desc" },
//       },
//     },
//     orderBy: { firstName: "asc" },
//   });

//   const studentsForUI = students.map((s) => {
//     const enrollment = s.enrollments[0];
//     const className  = enrollment?.classYear.classTemplate.name ?? "";
//     const streamName = enrollment?.stream?.name ?? "";
//     return {
//       id:      s.id,
//       name:    `${s.firstName} ${s.lastName}`,
//       admNo:   s.admissionNo,
//       class:   streamName ? `${className} ${streamName}` : className,
//     };
//   });

//   const bursariesForUI = bursaries.map((b) => ({
//     id:               b.id,
//     name:             b.name,
//     code:             b.code,
//     // Determine type from which field is set in schema
//     type:             b.percentage !== null ? "PERCENTAGE" : "FIXED",
//     value:            b.percentage !== null ? b.percentage : (b.fixedAmount ?? 0),
//     description:      b.description ?? "",
//     isActive:         b.isActive,
//     assignedStudents: b._count.studentBursaries,
//   }));

//   return (
//     <div className="p-6">
//       <BursariesClient
//         initialBursaries={bursariesForUI}
//         students={studentsForUI}
//         schoolId={schoolId}
//       />
//     </div>
//   );
// }






// app/school/[slug]/finance/fees/bursaries/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import { Session } from "next-auth";
import BursariesClient from "./components/BursariesClient";
import type { BeneficiaryForUI } from "./components/BursariesClient";

export default async function BursariesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;

  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  // ── Bursary schemes with beneficiary count ────────────────────────────────
  const bursaries = await db.bursary.findMany({
    where:   { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { studentBursaries: true } },
    },
  });

  // ── Active enrolled students for the assign dialog ────────────────────────
  const students = await db.student.findMany({
    where:   { schoolId, isActive: true },
    select: {
      id:          true,
      firstName:   true,
      lastName:    true,
      admissionNo: true,
      enrollments: {
        where:   { status: "ACTIVE" },
        select:  {
          classYear: {
            select: { classTemplate: { select: { name: true } } },
          },
          stream: { select: { name: true } },
        },
        take:    1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { firstName: "asc" },
  });

  // ── Beneficiaries: students who hold at least one bursary ─────────────────
  // Fetch all active StudentBursary rows for this school, grouped by student.
  const studentBursaries = await db.studentBursary.findMany({
    where: { schoolId },
    select: {
      id:        true,
      isActive:  true,
      validFrom: true,
      validUntil: true,
      student: {
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
          enrollments: {
            where:   { status: "ACTIVE" },
            select:  {
              classYear: {
                select: { classTemplate: { select: { name: true } } },
              },
              stream: { select: { name: true } },
            },
            take:    1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
      bursary: {
        select: {
          id:          true,
          name:        true,
          code:        true,
          percentage:  true,
          fixedAmount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by student — one row per student, with an array of their bursaries
  const beneficiaryMap = new Map<string, BeneficiaryForUI>();

  for (const sb of studentBursaries) {
    const s           = sb.student;
    const enrollment  = s.enrollments[0];
    const className   = enrollment?.classYear.classTemplate.name ?? "";
    const streamName  = enrollment?.stream?.name ?? "";

    if (!beneficiaryMap.has(s.id)) {
      beneficiaryMap.set(s.id, {
        studentId:   s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        admNo:       s.admissionNo,
        class:       streamName ? `${className} ${streamName}` : className,
        bursaries:   [],
      });
    }

    beneficiaryMap.get(s.id)!.bursaries.push({
      studentBursaryId: sb.id,
      bursaryName:      sb.bursary.name,
      bursaryCode:      sb.bursary.code,
      type:             sb.bursary.percentage !== null ? "PERCENTAGE" : "FIXED",
      value:            sb.bursary.percentage !== null
                          ? (sb.bursary.percentage ?? 0)
                          : (sb.bursary.fixedAmount ?? 0),
      validFrom:  sb.validFrom  ? sb.validFrom.toISOString()  : null,
      validUntil: sb.validUntil ? sb.validUntil.toISOString() : null,
      isActive:   sb.isActive,
    });
  }

  const beneficiariesForUI = Array.from(beneficiaryMap.values());

  // ── Shape data for UI ──────────────────────────────────────────────────────
  const studentsForUI = students.map((s) => {
    const enrollment = s.enrollments[0];
    const className  = enrollment?.classYear.classTemplate.name ?? "";
    const streamName = enrollment?.stream?.name ?? "";
    return {
      id:    s.id,
      name:  `${s.firstName} ${s.lastName}`,
      admNo: s.admissionNo,
      class: streamName ? `${className} ${streamName}` : className,
    };
  });

  const bursariesForUI = bursaries.map((b) => ({
    id:               b.id,
    name:             b.name,
    code:             b.code,
    type:             b.percentage !== null ? "PERCENTAGE" : "FIXED",
    value:            b.percentage !== null ? b.percentage : (b.fixedAmount ?? 0),
    description:      b.description ?? "",
    isActive:         b.isActive,
    assignedStudents: b._count.studentBursaries,
  }));

  return (
    <div className="p-6">
      <BursariesClient
        initialBursaries={bursariesForUI}
        students={studentsForUI}
        schoolId={schoolId}
        initialBeneficiaries={beneficiariesForUI}
      />
    </div>
  );
}