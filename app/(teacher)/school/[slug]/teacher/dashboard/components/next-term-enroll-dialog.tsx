// app/(teacher)/school/[slug]/teacher/dashboard/components/next-term-enroll-dialog.tsx
"use client";

import { useState, useTransition }                from "react";
import { UserPlus, Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import {
  getTeacherSubjectNextTermData,
  enrollStudentsToNextTermSubject,
} from "@/actions/teacher-portal";

// ── Types ─────────────────────────────────────────────────────────────────

type Student = {
  studentId:                  string;
  studentSubjectEnrollmentId: string;
  firstName:                  string;
  lastName:                   string;
  admissionNo:                string;
  currentEnrollmentId:        string;
  alreadyEnrolledNextTerm:    boolean;
};

type NextTermData = {
  currentTermName:         string;
  nextTerm:                { id: string; name: string };
  nextTermStreamSubjectId: string;
  subjectName:             string;
  subjectCode:             string | null;
  paperName:               string | null;
  streamName:              string;
  classYearId:             string;
  academicYearId:          string;
  streamId:                string;
  students:                Student[];
};

type Props = {
  streamSubjectId: string;
  subjectName:     string;
  paperName:       string | null;
  termName:        string;
  userId:          string;
};

// ── Component ─────────────────────────────────────────────────────────────

export default function NextTermEnrollDialog({
  streamSubjectId, subjectName, paperName, termName, userId,
}: Props) {
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState<NextTermData | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [toast, setToast]         = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function openDialog() {
    setOpen(true);
    setError(null);
    setData(null);
    setSelected(new Set());
    setToast(null);
    setLoading(true);
    try {
      const res = await getTeacherSubjectNextTermData(streamSubjectId, userId);
      if (!res.ok) {
        setError(res.message);
      } else {
        setData(res.data);
        // Pre-select students who are NOT already enrolled
        const preSelected = new Set(
          res.data.students
            .filter(s => !s.alreadyEnrolledNextTerm)
            .map(s => s.studentId)
        );
        setSelected(preSelected);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleStudent(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!data) return;
    const eligible = data.students.filter(s => !s.alreadyEnrolledNextTerm).map(s => s.studentId);
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible));
    }
  }

  function handleEnroll() {
    if (!data || selected.size === 0) return;
    startTransition(async () => {
      const res = await enrollStudentsToNextTermSubject({
        studentIds:              Array.from(selected),
        currentStreamSubjectId:  streamSubjectId,
        nextTermStreamSubjectId: data.nextTermStreamSubjectId,
        nextTermId:              data.nextTerm.id,
        classYearId:             data.classYearId,
        academicYearId:          data.academicYearId,
        streamId:                data.streamId,
        userId,
      });
      setToast({ ok: res.ok, msg: res.message });
      if (res.ok) {
        // Refresh data to reflect updated enrollment state
        setLoading(true);
        const refreshed = await getTeacherSubjectNextTermData(streamSubjectId, userId);
        if (refreshed.ok) {
          setData(refreshed.data);
          setSelected(new Set(
            refreshed.data.students
              .filter(s => !s.alreadyEnrolledNextTerm)
              .map(s => s.studentId)
          ));
        }
        setLoading(false);
      }
    });
  }

  const eligibleCount  = data?.students.filter(s => !s.alreadyEnrolledNextTerm).length ?? 0;
  const allSelected    = eligibleCount > 0 && selected.size === eligibleCount;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); openDialog(); }}
        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400
                   hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        title={`Enroll students into next term for ${subjectName}`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Enroll Next Term
        <ChevronRight className="h-3 w-3 opacity-60" />
      </button>

      {/* Backdrop + Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                          w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                    Enroll Students — Next Term
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {subjectName}{paperName ? ` — ${paperName}` : ""} · {termName}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-lg leading-none mt-0.5"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-slate-500">Loading enrollment data…</span>
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
                </div>
              )}

              {/* Data loaded */}
              {!loading && data && (
                <>
                  {/* Next term info */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3 text-sm">
                    <p className="text-blue-700 dark:text-blue-300 font-medium">
                      Enrolling into: <span className="font-semibold">{data.nextTerm.name}</span>
                    </p>
                    <p className="text-blue-500 dark:text-blue-400 text-xs mt-0.5">
                      {data.subjectName} · {data.streamName} · Same academic year
                    </p>
                  </div>

                  {/* Toast / result */}
                  {toast && (
                    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
                      toast.ok
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400"
                    }`}>
                      {toast.ok
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        : <AlertCircle  className="h-4 w-4 shrink-0 mt-0.5" />
                      }
                      <p>{toast.msg}</p>
                    </div>
                  )}

                  {/* Student list */}
                  {data.students.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No students enrolled in this subject yet.</p>
                  ) : (
                    <div>
                      {/* Select-all row */}
                      {eligibleCount > 0 && (
                        <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer mb-1">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            Select all eligible ({eligibleCount})
                          </span>
                        </label>
                      )}

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        {data.students.map(student => {
                          const isAlready  = student.alreadyEnrolledNextTerm;
                          const isChecked  = selected.has(student.studentId);
                          return (
                            <label
                              key={student.studentId}
                              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                isAlready
                                  ? "bg-green-50/50 dark:bg-green-950/10 cursor-default"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isAlready}
                                checked={isAlready || isChecked}
                                onChange={() => !isAlready && toggleStudent(student.studentId)}
                                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isAlready
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}>
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-xs text-slate-400">{student.admissionNo}</p>
                              </div>
                              {isAlready && (
                                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded shrink-0">
                                  Enrolled
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!loading && data && eligibleCount > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {selected.size} of {eligibleCount} student{eligibleCount !== 1 ? "s" : ""} selected
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEnroll}
                    disabled={selected.size === 0 || isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                               text-white rounded-lg transition-colors"
                  >
                    {isPending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enrolling…</>
                      : <><UserPlus className="h-3.5 w-3.5" /> Enroll {selected.size} Student{selected.size !== 1 ? "s" : ""}</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Footer (no eligible students) */}
            {!loading && data && eligibleCount === 0 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
