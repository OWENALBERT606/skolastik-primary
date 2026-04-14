"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import {
  BookOpen, ChevronDown, ChevronRight, Download,
  FileEdit, FileText, Loader2, RefreshCw, TrendingDown, TrendingUp, Minus, Upload, Lock,
} from "lucide-react";
import EnterExamMarksDialog from "./enter-exam-marks-dialog";

// ── helpers ───────────────────────────────────────────────────────────────

const EXAM_ORDER = ["BOT", "MTE", "EOT", "MOCK", "ASSIGNMENT"] as const;

function examLabel(type: string) {
  return { BOT: "Beginning of Term", MTE: "Mid-Term", EOT: "End of Term", MOCK: "Mock", ASSIGNMENT: "Assignment" }[type] ?? type;
}

function GradeBadge({ mark }: { mark: number | null }) {
  if (mark === null) return <span className="text-slate-400 text-xs">—</span>;
  let grade = "F9", color = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (mark >= 80) { grade = "D1"; color = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"; }
  else if (mark >= 75) { grade = "D2"; color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"; }
  else if (mark >= 70) { grade = "C3"; color = "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"; }
  else if (mark >= 65) { grade = "C4"; color = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"; }
  else if (mark >= 60) { grade = "C5"; color = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"; }
  else if (mark >= 55) { grade = "C6"; color = "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"; }
  else if (mark >= 50) { grade = "P7"; color = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"; }
  else if (mark >= 45) { grade = "P8"; color = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"; }
  return <Badge className={`${color} border-0 text-xs font-semibold`}>{grade}</Badge>;
}

function TrendIcon({ mark }: { mark: number | null }) {
  if (mark === null) return <Minus className="h-4 w-4 text-slate-400" />;
  if (mark >= 70)    return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (mark >= 50)    return <Minus className="h-4 w-4 text-amber-500" />;
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

// ── props ─────────────────────────────────────────────────────────────────

interface SubjectMarksTabProps {
  streamSubject: any;
  schoolId:      string;
  userId:        string;
  marksData:     any | null;
  isRefreshing:  boolean;
  onRefresh:     () => void;
  isLocked?:      boolean;
}

// ── component ─────────────────────────────────────────────────────────────

export default function SubjectMarksTab({
  streamSubject, schoolId, userId, marksData, isRefreshing, onRefresh, isLocked = false,
}: SubjectMarksTabProps) {
  const [activeExam,       setActiveExam]       = useState<any | null>(null);
  const [showStudentTable, setShowStudentTable] = useState(true);

  // Loading state
  if (!marksData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#5B9BD5]" />
        <p className="text-sm text-slate-500">Loading marks data…</p>
      </div>
    );
  }

  const { enrollments, exams, assessmentConfig, studentSummaries, stats } = marksData;

  const sortedExams = [...(exams ?? [])].sort(
    (a: any, b: any) => EXAM_ORDER.indexOf(a.examType) - EXAM_ORDER.indexOf(b.examType)
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Marks Entry</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {streamSubject.term?.name} · {stats?.totalStudents ?? 0} students enrolled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Students", value: stats?.totalStudents ?? 0,  color: "text-slate-900 dark:text-white" },
          { label: "With Results",   value: stats?.withResults   ?? 0,  color: "text-green-600 dark:text-green-400" },
          { label: "Marks Entered",  value: stats?.withMarks     ?? 0,  color: "text-blue-600 dark:text-blue-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            {label === "With Results" && (stats?.totalStudents ?? 0) > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{stats.completionPercent}% complete</p>
            )}
          </div>
        ))}
      </div>

      {/* Assessment weights */}
      {assessmentConfig && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Assessment Weights
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "BOT", value: assessmentConfig.hasBOT ? assessmentConfig.botWeight : 0 },
              { label: "MTE", value: assessmentConfig.hasMTE ? assessmentConfig.mteWeight : 0 },
              { label: "EOT", value: assessmentConfig.hasEOT ? assessmentConfig.eotWeight : 0 },
            ].filter(w => w.value > 0).map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm">
                <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                <span className="text-slate-400">·</span>
                <span className="text-[#5B9BD5] font-semibold">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedExams.length > 0 ? sortedExams.map((exam: any) => {
          const entered = (studentSummaries ?? []).filter(
            (s: any) => s[exam.examType.toLowerCase() as "bot" | "mte" | "eot"] !== null
          ).length;
          return (
            <ExamCard
              key={exam.id}
              exam={exam}
              entered={entered}
              total={stats?.totalStudents ?? 0}
              onClick={() => setActiveExam(exam)}
              isLocked={isLocked}
            />
          );
        }) : (
          <div className="md:col-span-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-400">
            No exams configured for this term. Create exams in the class Settings tab first.
          </div>
        )}
      </div>

      {/* Student marks table */}
      {(studentSummaries ?? []).length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowStudentTable(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5B9BD5]" />
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                Student Marks Summary ({stats?.totalStudents ?? 0})
              </span>
            </div>
            {showStudentTable
              ? <ChevronDown className="w-4 h-4 text-slate-400" />
              : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {showStudentTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Adm No</th>
                    {sortedExams.map((e: any) => (
                      <th key={e.id} className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {e.examType}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentSummaries.map((s: any, i: number) => (
                    <tr key={s.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.admissionNo}</td>
                      {sortedExams.map((e: any) => {
                        const val = s[e.examType.toLowerCase() as "bot" | "mte" | "eot"];
                        return (
                          <td key={e.id} className="px-4 py-3 text-right">
                            {val !== null && val !== undefined
                              ? <span className="font-medium text-slate-900 dark:text-white">{Number(val).toFixed(1)}</span>
                              : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-bold">
                        {s.totalMark !== null && s.totalMark !== undefined ? (
                          <span className="text-slate-900 dark:text-white font-medium">
                            {Number(s.totalMark).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center"><GradeBadge mark={s.totalMark} /></td>
                      <td className="px-4 py-3 text-center"><TrendIcon mark={s.totalMark} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enter Exam Marks Dialog */}
      {activeExam && (
        <EnterExamMarksDialog
          open={!!activeExam}
          onOpenChange={(open) => { if (!open) { setActiveExam(null); onRefresh(); } }}
          paperStreamSubject={{
            id:                 streamSubject.id,
            studentEnrollments: enrollments,
            subjectPaper:       null,
          }}
          exam={activeExam}
          schoolId={schoolId}
          userId={userId}
          isLocked={isLocked}
        />
      )}
    </div>
  );
}

// ── ExamCard ──────────────────────────────────────────────────────────────

function ExamCard({ exam, entered, total, onClick, isLocked }: {
  exam:      { id: string; name: string; examType: string; maxMarks: number; date?: Date | null };
  entered:   number;
  total:     number;
  onClick:   () => void;
  isLocked?: boolean;
}) {
  const pct = total > 0 ? Math.round((entered / total) * 100) : 0;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-lg shrink-0", isLocked ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30")}>
          {isLocked ? <Lock className="w-5 h-5 text-red-600 dark:text-red-400" /> : <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-white leading-tight">{exam.name}</p>
            {isLocked && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0 text-xs">Locked</Badge>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {examLabel(exam.examType)} · Max: {exam.maxMarks} marks
          </p>
          {exam.date && (
            <p className="text-xs text-slate-400 mt-0.5">{new Date(exam.date).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{entered} of {total} entered</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", isLocked ? "bg-red-400" : "bg-blue-500")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Button size="sm" className={cn("w-full text-white", isLocked ? "bg-red-500 hover:bg-red-600" : "bg-[#5B9BD5] hover:bg-[#4A8BC2]")} onClick={onClick} disabled={isLocked}>
        {isLocked ? (
          <><Lock className="h-4 w-4 mr-2" /> Locked</>
        ) : (
          <><FileEdit className="h-4 w-4 mr-2" />{entered > 0 ? "Update Marks" : "Enter Marks"}</>
        )}
      </Button>
    </div>
  );
}
