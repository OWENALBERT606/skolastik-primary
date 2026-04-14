"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap, Filter, Loader2, AlertCircle, Award,
  TrendingUp, TrendingDown, Minus, FileText,
  BookOpen, Trophy,
} from "lucide-react";
import ReportCardPreview from "@/app/(school)/school/[slug]/academics/report-cards/report-card-preview";
import ALevelReportCardPreview from "@/app/(school)/school/[slug]/academics/report-cards/alevel-report-card-preview";
import { type ReportCardTheme } from "@/app/(school)/school/[slug]/academics/report-cards/components/report-cards-client";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubjectMark = {
  subjectName:     string;
  subjectCode:     string | null;
  aLevelCategory:  string | null;
  totalPercentage: number | null;
  finalGrade:      string | null;
  gradeDescriptor: string | null;
  botMarks:        number | null;  botOutOf:  number | null;
  mteMarks:        number | null;  mteOutOf:  number | null;
  eotMarks:        number | null;  eotOutOf:  number | null;
  projectScore:    number | null;  projectOutOf: number | null;
  aoiContribution: number | null;
  summativeContribution: number | null;
};

type ReportCard = {
  isPublished:         boolean;
  averageMarks:        number | null;
  streamPosition:      number | null;
  classPosition:       number | null;
  division:            string | null;
  totalPoints:         number | null;
  aggregatePoints:     number | null;
  classTeacherComment: string | null;
  headTeacherComment:  string | null;
};

type Enrollment = {
  id:           string;
  streamId:     string;
  termId:       string;
  classYear:    { classTemplate: { name: string; level: string } };
  stream:       { id: string; name: string };
  term:         { id: string; name: string; termNumber: number };
  academicYear: { id: string; year: string };
  reportCard:   ReportCard | null;
  subjectEnrollments: Array<{
    id: string;
    streamSubject: { subject: { name: string; code: string | null; aLevelCategory: string | null } };
    subjectFinalMark: { totalPercentage: number | null; finalGrade: string | null; gradeDescriptor: string | null; streamPosition: number | null } | null;
    subjectResult:    SubjectMark | null;
  }>;
};

type Student = {
  id:          string;
  firstName:   string;
  lastName:    string;
  admissionNo: string;
  gender:      string;
  imageUrl:    string | null;
  dob:         string | null;
  enrollments: Enrollment[];
  attendance:  { total: number; present: number; absent: number; late: number };
  invoices:    any[];
};

type School = { name: string | null; motto: string | null; logo: string | null; address: string | null; contact: string | null; contact2: string | null; email: string | null; email2: string | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColor(grade: string | null) {
  if (!grade) return "text-slate-400";
  const g = grade.toUpperCase();
  if (["D1","D2","A"].includes(g)) return "text-green-600 dark:text-green-400";
  if (["C3","C4","C5","C6","B"].includes(g)) return "text-blue-600 dark:text-blue-400";
  if (["P7","P8","C"].includes(g)) return "text-amber-600 dark:text-amber-400";
  if (["D"].includes(g)) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function TrendIcon({ mark }: { mark: number | null }) {
  if (mark == null) return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  if (mark >= 60) return <TrendingUp   className="w-3.5 h-3.5 text-green-500" />;
  if (mark >= 40) return <Minus        className="w-3.5 h-3.5 text-amber-500" />;
  return               <TrendingDown  className="w-3.5 h-3.5 text-red-500" />;
}

function fmt(marks: number | null, outOf: number | null) {
  if (marks == null) return "—";
  return outOf ? `${marks}/${outOf}` : String(marks);
}

const DEFAULT_THEME: ReportCardTheme = {
  primaryColor: "#8B1A1A", headerBg: "#8B1A1A", headerText: "#FFFFFF",
  accentColor: "#C9A227", tableHeaderBg: "#8B1A1A", tableHeaderText: "#FFFFFF", footerBg: "#F5F0E8",
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ParentResultsClient({ slug }: { slug: string }) {
  const [data,          setData]          = useState<{ students: Student[]; academicYears: any[]; terms: any[]; school: School } | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [yearFilter,    setYearFilter]    = useState("");
  const [termFilter,    setTermFilter]    = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [viewingRC,     setViewingRC]     = useState<{ streamId: string; termId: string; studentId: string; classLevel: string; academicYear: string; termName: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (yearFilter) params.set("yearId", yearFilter);
    if (termFilter) params.set("termId", termFilter);
    setLoading(true);
    fetch(`/api/parent?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [yearFilter, termFilter]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
  );

  const { students, academicYears, terms, school } = data;
  const filteredTerms = yearFilter ? terms.filter((t: any) => t.academicYearId === yearFilter) : terms;

  // Build result rows: one per enrollment
  const results: Array<{ student: Student; enrollment: Enrollment }> = [];
  for (const student of students) {
    if (studentFilter && student.id !== studentFilter) continue;
    for (const enrollment of student.enrollments) {
      // Only show enrollments with at least one mark or a published report card
      const hasMarks = enrollment.subjectEnrollments.some(
        se => se.subjectFinalMark || se.subjectResult,
      );
      if (!hasMarks && !enrollment.reportCard?.isPublished) continue;
      results.push({ student, enrollment });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Report Card Preview */}
      {viewingRC && (
        viewingRC.classLevel === "A_LEVEL"
          ? <ALevelReportCardPreview
              streamId={viewingRC.streamId}
              termId={viewingRC.termId}
              studentId={viewingRC.studentId}
              format="classic"
              theme={DEFAULT_THEME}
              school={school}
              academicYear={viewingRC.academicYear}
              termName={viewingRC.termName}
              onClose={() => setViewingRC(null)}
            />
          : <ReportCardPreview
              streamId={viewingRC.streamId}
              termId={viewingRC.termId}
              studentId={viewingRC.studentId}
              format="classic"
              theme={DEFAULT_THEME}
              school={school}
              academicYear={viewingRC.academicYear}
              termName={viewingRC.termName}
              hideDateInputs
              onClose={() => setViewingRC(null)}
            />
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-amber-500" /> Academic Results
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View your children's academic performance and report cards</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setTermFilter(""); }}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Years</option>
          {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.year}{y.isActive ? " ✓" : ""}</option>)}
        </select>
        <select value={termFilter} onChange={e => setTermFilter(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Terms</option>
          {filteredTerms.map((t: any) => <option key={t.id} value={t.id}>{t.name}{t.isActive ? " ✓" : ""}</option>)}
        </select>
        <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Children</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        {(yearFilter || termFilter || studentFilter) && (
          <button onClick={() => { setYearFilter(""); setTermFilter(""); setStudentFilter(""); }}
            className="text-xs text-primary hover:underline">Clear</button>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No results found for the selected filters</p>
        </div>
      ) : (
        <div className="space-y-5">
          {results.map(({ student, enrollment }, ri) => {
            const rc        = enrollment.reportCard;
            const className = `${enrollment.classYear.classTemplate.name} ${enrollment.stream.name}`;

            // Deduplicate subjects
            const subjectMap = new Map<string, typeof enrollment.subjectEnrollments[number]>();
            for (const se of enrollment.subjectEnrollments) {
              const key = se.streamSubject.subject.name;
              if (!subjectMap.has(key) || se.subjectFinalMark) subjectMap.set(key, se);
            }
            const subjects = Array.from(subjectMap.values());

            return (
              <div key={ri} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">

                {/* Card header */}
                <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-900/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {className} · {enrollment.term.name} {enrollment.academicYear.year}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {rc?.averageMarks != null && (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-bold rounded-full">
                          Avg: {rc.averageMarks.toFixed(1)}%
                        </span>
                      )}
                      {rc?.streamPosition != null && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-bold rounded-full">
                          #{rc.streamPosition} in class
                        </span>
                      )}
                      {rc?.division && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-bold rounded-full">
                          {rc.division}
                        </span>
                      )}
                      {/* View Report Card button — only when published */}
                      {rc?.isPublished && (
                        <button
                          onClick={() => setViewingRC({
                            streamId:    enrollment.streamId,
                            termId:      enrollment.termId,
                            studentId:   student.id,
                            classLevel:  enrollment.classYear.classTemplate.level,
                            academicYear: enrollment.academicYear.year,
                            termName:    enrollment.term.name,
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Report Card
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject table */}
                {subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subject</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mark</th>
                          {subjects.some(s => s.subjectResult?.projectScore != null) && (
                            <th className="text-center px-4 py-2.5 text-xs font-semibold text-purple-500 uppercase tracking-wide">Project</th>
                          )}
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Grade</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {subjects.map((se, si) => {
                          const fm    = se.subjectFinalMark;
                          const sr    = se.subjectResult as SubjectMark | null;
                          const total = fm?.totalPercentage ?? sr?.totalPercentage ?? null;
                          const grade = fm?.finalGrade      ?? sr?.finalGrade      ?? null;
                          return (
                            <tr key={si} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{se.streamSubject.subject.name}</td>
                              <td className="px-4 py-2.5 text-center">
                                {total != null ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                      <div
                                        className={`h-full rounded-full ${total >= 60 ? "bg-green-500" : total >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                        style={{ width: `${Math.min(100, total)}%` }}
                                      />
                                    </div>
                                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{total.toFixed(1)}%</span>
                                  </div>
                                ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                              </td>
                              {subjects.some(s => s.subjectResult?.projectScore != null) && (
                                <td className="px-4 py-2.5 text-center">
                                  {sr?.projectScore != null
                                    ? <span className="text-purple-700 dark:text-purple-400 font-semibold">{sr.projectScore}</span>
                                    : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                </td>
                              )}
                              <td className="px-4 py-2.5 text-center">
                                <span className={`font-bold text-base ${gradeColor(grade)}`}>{grade ?? "—"}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <TrendIcon mark={total} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">No subject results yet</div>
                )}

                {/* Teacher comment */}
                {rc?.classTeacherComment && (
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
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
