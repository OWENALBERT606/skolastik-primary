import { db }          from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = authUser.id;
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get("yearId");
    const termId = searchParams.get("termId");

    const parent = await db.parent.findUnique({
      where: { userId },
      include: {
        school: { select: { id: true, name: true, slug: true, logo: true, motto: true, address: true, contact: true, contact2: true, email: true, email2: true } },
        students: {
          include: {
            enrollments: {
              where: {
                status: { in: ["ACTIVE", "COMPLETED"] },
                ...(yearId ? { academicYearId: yearId } : {}),
                ...(termId ? { termId } : {}),
              },
              orderBy: { createdAt: "desc" },
              include: {
                classYear: { include: { classTemplate: { select: { name: true, level: true } } } },
                stream:    { select: { id: true, name: true } },
                term:      { select: { id: true, name: true, termNumber: true } },
                academicYear: { select: { id: true, year: true } },
                reportCard: true,
                subjectEnrollments: {
                  where: { status: { in: ["ACTIVE", "COMPLETED"] } },
                  include: {
                    streamSubject: { include: { subject: { select: { name: true, code: true, aLevelCategory: true } } } },
                    subjectFinalMark: {
                      select: {
                        totalPercentage: true, finalGrade: true, gradeDescriptor: true,
                        streamPosition: true,
                      },
                    },
                    subjectResult: {
                      select: {
                        totalPercentage: true, finalGrade: true, gradeDescriptor: true,
                        botMarks: true, botOutOf: true,
                        mteMarks: true, mteOutOf: true,
                        eotMarks: true, eotOutOf: true,
                        projectScore: true, projectOutOf: true, projectContribution: true,
                        aoiContribution: true, summativeContribution: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    // Fetch attendance for each student
    const studentIds = parent.students.map(s => s.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await db.studentAttendance.findMany({
      where: { studentId: { in: studentIds }, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
      select: { studentId: true, date: true, status: true, notes: true },
    });

    // Fetch fee accounts and invoices for each student
    const feeAccounts = await db.studentFeeAccount.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { createdAt: "desc" },
      include: {
        invoices: {
          include: {
            feeStructure: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        academicYear: { select: { year: true } },
        term:         { select: { name: true } },
      },
    });

    // Fetch academic years for filters
    const schoolId = parent.school.id;
    const academicYears = await db.academicYear.findMany({
      where: { schoolId },
      orderBy: { year: "desc" },
      select: { id: true, year: true, isActive: true },
    });
    const terms = await db.academicTerm.findMany({
      where: { academicYear: { schoolId } },
      orderBy: [{ academicYear: { year: "desc" } }, { termNumber: "asc" }],
      select: { id: true, name: true, termNumber: true, academicYearId: true, isActive: true },
    });

    // Build per-student attendance summary
    const attendanceByStudent: Record<string, { total: number; present: number; absent: number; late: number; records: any[] }> = {};
    for (const r of attendanceRecords) {
      if (!attendanceByStudent[r.studentId]) {
        attendanceByStudent[r.studentId] = { total: 0, present: 0, absent: 0, late: 0, records: [] };
      }
      const s = attendanceByStudent[r.studentId];
      s.total++;
      if (r.status === "PRESENT") s.present++;
      else if (r.status === "ABSENT") s.absent++;
      else if (r.status === "LATE") s.late++;
      s.records.push(r);
    }

    // Build per-student invoice summary from fee accounts
    const invoicesByStudent: Record<string, any[]> = {};
    for (const acct of feeAccounts) {
      if (!invoicesByStudent[acct.studentId]) invoicesByStudent[acct.studentId] = [];
      for (const inv of acct.invoices) {
        invoicesByStudent[acct.studentId].push({
          id:            inv.id,
          invoiceNumber: inv.invoiceNumber,
          termName:      acct.term?.name         ?? "—",
          yearName:      acct.academicYear?.year  ?? "—",
          structureName: inv.feeStructure?.name   ?? "—",
          totalAmount:   inv.totalAmount,
          paid:          inv.paidAmount,
          balance:       inv.balance,
          status:        inv.status,
        });
      }
    }

    const students = parent.students.map(s => ({
      id:          s.id,
      firstName:   s.firstName,
      lastName:    s.lastName,
      admissionNo: s.admissionNo,
      gender:      s.gender,
      imageUrl:    s.imageUrl,
      dob:         s.dob?.toISOString().split("T")[0] ?? null,
      enrollments: s.enrollments,
      attendance:  attendanceByStudent[s.id] ?? { total: 0, present: 0, absent: 0, late: 0, records: [] },
      invoices:    invoicesByStudent[s.id]   ?? [],
    }));

    return NextResponse.json({ parent, students, academicYears, terms, school: parent.school });
  } catch (error: any) {
    console.error("❌ parent API:", error);
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
