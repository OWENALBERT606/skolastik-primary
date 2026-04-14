// app/(student)/school/[slug]/student/results/page.tsx

import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { GraduationCap, BookOpen, Trophy, AlertCircle } from "lucide-react";

export default async function StudentResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser?.id || authUser.loginAs !== "student") redirect("/login");

  const student = await db.student.findFirst({
    where:  { userId: authUser.id },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, schoolId: true },
  });
  if (!student) redirect("/login");

  // All enrollments with results
  const enrollments = await db.enrollment.findMany({
    where:   { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      academicYear: { select: { year: true } },
      term:         { select: { name: true, termNumber: true } },
      stream: {
        select: {
          name:      true,
          classYear: { select: { classTemplate: { select: { name: true } } } },
        },
      },
      reportCard: {
        select: {
          isPublished:     true,
          averageMarks:    true,
          streamPosition:  true,
          classPosition:   true,
          division:        true,
          totalPoints:     true,
          aggregatePoints: true,
          classTeacherComment: true,
        },
      },
      subjectEnrollments: {
        include: {
          streamSubject: {
            include: {
              subject: { select: { name: true, aLevelCategory: true } },
            },
          },
          subjectFinalMark: {
            select: {
              totalPercentage: true,
              finalGrade:      true,
              gradeDescriptor: true,
              streamPosition:  true,
            },
          },
          subjectResult: {
            select: {
              totalPercentage: true,
              finalGrade:      true,
              gradeDescriptor: true,
              botMarks:        true,
              botOutOf:        true,
              mteMarks:        true,
              mteOutOf:        true,
              eotMarks:        true,
              eotOutOf:        true,
            },
          },
        },
        orderBy: { streamSubject: { subject: { name: "asc" } } },
      },
    },
  });

  // Only show enrollments where at least one subject has results OR report card is published
  const enrollmentsWithResults = enrollments.filter(e => {
    if (e.reportCard?.isPublished) return true;
    return e.subjectEnrollments.some(se => se.subjectFinalMark || se.subjectResult);
  });

  const gradeColor = (grade: string | null | undefined) => {
    if (!grade) return "text-slate-400";
    const g = grade.toUpperCase();
    if (["A", "D1", "D2"].includes(g)) return "text-green-600 dark:text-green-400";
    if (["B", "D3", "C4", "C5", "C6"].includes(g)) return "text-blue-600 dark:text-blue-400";
    if (["C", "P7", "P8"].includes(g)) return "text-amber-600 dark:text-amber-400";
    if (["D", "F9", "F"].includes(g)) return "text-red-600 dark:text-red-400";
    return "text-slate-600 dark:text-slate-300";
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
          <GraduationCap className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Results</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {student.firstName} {student.lastName} · {student.admissionNo}
          </p>
        </div>
      </div>

      {enrollmentsWithResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
          <GraduationCap className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-semibold text-base">No results available yet</p>
          <p className="text-sm mt-1">Your results will appear here once your teachers submit and publish them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {enrollmentsWithResults.map(e => {
            const className = e.stream
              ? `${e.stream.classYear.classTemplate.name} ${e.stream.name}`
              : "—";

            // Deduplicate subjects (multiple papers → one subject)
            const subjectMap = new Map<string, typeof e.subjectEnrollments[number]>();
            for (const se of e.subjectEnrollments) {
              const key = se.streamSubject.subject.name;
              // Prefer the one with subjectFinalMark
              if (!subjectMap.has(key) || se.subjectFinalMark) {
                subjectMap.set(key, se);
              }
            }
            const subjects = Array.from(subjectMap.values());

            const rc = e.reportCard;

            return (
              <div key={e.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                {/* Term header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      {e.term.name} — {e.academicYear.year}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{className}</p>
                  </div>
                  {rc && (
                    <div className="flex items-center gap-3 flex-wrap">
                      {rc.averageMarks != null && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{rc.averageMarks.toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-400">Average</p>
                        </div>
                      )}
                      {rc.streamPosition != null && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-amber-500">#{rc.streamPosition}</p>
                          <p className="text-[10px] text-slate-400">In Class</p>
                        </div>
                      )}
                      {rc.division && (
                        <div className="text-center">
                          <p className="text-base font-bold text-green-600 dark:text-green-400">Div {rc.division}</p>
                          <p className="text-[10px] text-slate-400">Division</p>
                        </div>
                      )}
                      {rc.aggregatePoints != null && (
                        <div className="text-center">
                          <p className="text-base font-bold text-slate-700 dark:text-slate-200">{rc.aggregatePoints} pts</p>
                          <p className="text-[10px] text-slate-400">Aggregate</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject results table */}
                {subjects.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    Results not yet published for this term
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                          <th className="px-5 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subject</th>
                          <th className="px-4 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">BOT</th>
                          <th className="px-4 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">MTE</th>
                          <th className="px-4 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">EOT</th>
                          <th className="px-4 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">Total</th>
                          <th className="px-4 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">Grade</th>
                          <th className="px-4 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Descriptor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {subjects.map(se => {
                          const fm = se.subjectFinalMark;
                          const sr = se.subjectResult;
                          const grade     = fm?.finalGrade     ?? sr?.finalGrade     ?? null;
                          const total     = fm?.totalPercentage ?? sr?.totalPercentage ?? null;
                          const desc      = fm?.gradeDescriptor ?? sr?.gradeDescriptor ?? null;
                          const botMarks  = sr?.botMarks  != null ? `${sr.botMarks}${sr.botOutOf ? `/${sr.botOutOf}` : ""}` : "—";
                          const mteMarks  = sr?.mteMarks  != null ? `${sr.mteMarks}${sr.mteOutOf ? `/${sr.mteOutOf}` : ""}` : "—";
                          const eotMarks  = sr?.eotMarks  != null ? `${sr.eotMarks}${sr.eotOutOf ? `/${sr.eotOutOf}` : ""}` : "—";

                          return (
                            <tr key={se.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                                {se.streamSubject.subject.name}
                                {se.streamSubject.subject.aLevelCategory === "SUBSIDIARY" && (
                                  <span className="ml-1.5 text-[10px] text-slate-400 font-normal">(Sub)</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">{botMarks}</td>
                              <td className="px-4 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">{mteMarks}</td>
                              <td className="px-4 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">{eotMarks}</td>
                              <td className="px-4 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-200">
                                {total != null ? `${total.toFixed(1)}%` : "—"}
                              </td>
                              <td className={`px-4 py-2.5 text-center font-bold text-base ${gradeColor(grade)}`}>
                                {grade ?? "—"}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">{desc ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Teacher comment */}
                {rc?.classTeacherComment && (
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">Class Teacher:</span>{" "}
                      <span className="italic">{rc.classTeacherComment}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
