"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { toast }  from "sonner";
import { format } from "date-fns";
import {
  CalendarDays, CheckCircle2, Clock, Users, Save, Loader2, ChevronDown,
  XCircle, MinusCircle, ShieldCheck, RefreshCw, BarChart3, TrendingUp,
} from "lucide-react";
import { StudentAttendanceStatus } from "@prisma/client";
import {
  getStreamAttendance,
  markAttendance,
  getClassAttendanceSummary,
} from "@/actions/student-attendance";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stream = {
  streamId:       string;
  streamName:     string;
  className:      string;
  academicYearId: string;
  academicYear:   string;
  isActiveYear:   boolean;
  studentCount:   number;
};

type Term = {
  id:             string;
  name:           string;
  termNumber:     number;
  isActive:       boolean;
  academicYearId: string;
};

type StudentRow = {
  studentId:   string;
  firstName:   string;
  lastName:    string;
  admissionNo: string;
  imageUrl:    string | null;
  gender:      string;
  status:      StudentAttendanceStatus;
  notes:       string | null;
  recordId:    string | null;
};

type SummaryRow = {
  studentId:      string;
  studentName:    string;
  admissionNo:    string;
  total:          number;
  present:        number;
  late:           number;
  absent:         number;
  excused:        number;
  attendanceRate: number;
};

type Props = {
  streams:  Stream[];
  terms:    Term[];
  schoolId: string;
  userId:   string;
  slug:     string;
};

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StudentAttendanceStatus, {
  label: string;
  bg:    string;
  text:  string;
  ring:  string;
  icon:  React.ElementType;
}> = {
  PRESENT: { label: "Present", bg: "bg-green-500 hover:bg-green-600",  text: "text-white", ring: "ring-green-500",  icon: CheckCircle2 },
  ABSENT:  { label: "Absent",  bg: "bg-red-500   hover:bg-red-600",    text: "text-white", ring: "ring-red-500",    icon: XCircle      },
  LATE:    { label: "Late",    bg: "bg-amber-500 hover:bg-amber-600",  text: "text-white", ring: "ring-amber-500",  icon: Clock        },
  EXCUSED: { label: "Excused", bg: "bg-blue-500  hover:bg-blue-600",   text: "text-white", ring: "ring-blue-500",   icon: ShieldCheck  },
};

const ALL_STATUSES: StudentAttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function RateBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${
        rate >= 80 ? "text-green-600 dark:text-green-400" :
        rate >= 60 ? "text-amber-600 dark:text-amber-400" :
        "text-red-600 dark:text-red-400"
      }`}>
        {rate}%
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AttendanceClient({
  streams, terms, schoolId, userId, slug: _slug,
}: Props) {
  const [tab, setTab] = useState<"daily" | "reports">("daily");

  // ── Daily tab state ─────────────────────────────────────────────────────────
  const activeStreamDefault = streams.find(s => s.isActiveYear)?.streamId ?? streams[0]?.streamId ?? "";
  const [selectedStreamId,   setSelectedStreamId]   = useState(activeStreamDefault);
  const [date,               setDate]               = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [students,           setStudents]           = useState<StudentRow[]>([]);
  const [termId,             setTermId]             = useState<string | null>(null);
  const [academicYearId,     setAcademicYearId]     = useState<string | null>(null);
  const [alreadyMarked,      setAlreadyMarked]      = useState(false);
  const [isLoading,          setIsLoading]          = useState(false);
  const [isPending,          startTransition]       = useTransition();
  const [edits,              setEdits]              = useState<Record<string, StudentAttendanceStatus>>({});
  const [notes,              setNotes]              = useState<Record<string, string>>({});

  // ── Reports tab state ───────────────────────────────────────────────────────
  const [reportStreamId, setReportStreamId] = useState(activeStreamDefault);
  const [reportTermId,   setReportTermId]   = useState(() => terms.find(t => t.isActive)?.id ?? terms[0]?.id ?? "");
  const [summary,        setSummary]        = useState<SummaryRow[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryLoaded,  setSummaryLoaded]  = useState(false);

  // ── Daily: load attendance ─────────────────────────────────────────────────

  const loadAttendance = useCallback(async () => {
    if (!selectedStreamId || !date) return;
    setIsLoading(true);
    try {
      const result = await getStreamAttendance({ streamId: selectedStreamId, date, schoolId });
      if (result.ok) {
        setStudents(result.data.students);
        setTermId(result.data.termId);
        setAcademicYearId(result.data.academicYearId ?? null);
        setAlreadyMarked(result.data.alreadyMarked ?? false);
        const initEdits: Record<string, StudentAttendanceStatus> = {};
        const initNotes: Record<string, string> = {};
        for (const s of result.data.students) {
          initEdits[s.studentId] = s.status;
          if (s.notes) initNotes[s.studentId] = s.notes;
        }
        setEdits(initEdits);
        setNotes(initNotes);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedStreamId, date, schoolId]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const setStatus = (studentId: string, status: StudentAttendanceStatus) =>
    setEdits(p => ({ ...p, [studentId]: status }));

  const markAll = (status: StudentAttendanceStatus) => {
    const next: Record<string, StudentAttendanceStatus> = {};
    for (const s of students) next[s.studentId] = status;
    setEdits(next);
  };

  const handleSubmit = () => {
    if (!termId || !academicYearId || !selectedStreamId) {
      toast.error("Missing term or academic year — please reload");
      return;
    }
    if (students.length === 0) { toast.error("No students to mark"); return; }

    const records = students.map(s => ({
      studentId: s.studentId,
      status:    edits[s.studentId] ?? "ABSENT",
      notes:     notes[s.studentId] || undefined,
    }));

    startTransition(async () => {
      const result = await markAttendance({
        streamId: selectedStreamId, termId, academicYearId, schoolId,
        date, markedById: userId, records,
      });
      if (result.ok) { toast.success(result.message); setAlreadyMarked(true); }
      else            { toast.error(result.message); }
    });
  };

  const counts = students.reduce(
    (acc, s) => { const st = edits[s.studentId] ?? "ABSENT"; acc[st] = (acc[st] ?? 0) + 1; return acc; },
    {} as Record<StudentAttendanceStatus, number>
  );

  // ── Reports: load summary ──────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    if (!reportStreamId || !reportTermId) return;
    setIsLoadingSummary(true);
    setSummaryLoaded(false);
    try {
      const result = await getClassAttendanceSummary({
        streamId: reportStreamId, schoolId, termId: reportTermId,
      });
      if (result.ok) { setSummary(result.data); setSummaryLoaded(true); }
      else            { toast.error(result.message); }
    } finally {
      setIsLoadingSummary(false);
    }
  }, [reportStreamId, reportTermId, schoolId]);

  const selectedStream = streams.find(s => s.streamId === selectedStreamId);
  const reportStream   = streams.find(s => s.streamId === reportStreamId);
  const reportTerm     = terms.find(t => t.id === reportTermId);

  // ── Filtered terms for the selected report stream's academic year ──────────
  const filteredTerms = reportStream
    ? terms.filter(t => t.academicYearId === reportStream.academicYearId)
    : terms;

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          Student Attendance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          View and manage daily attendance across all streams
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setTab("daily")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            tab === "daily"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Daily Attendance
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            tab === "reports"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Reports
        </button>
      </div>

      {/* ── DAILY TAB ──────────────────────────────────────────────────────── */}
      {tab === "daily" && (
        <div className="space-y-5">

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Stream / Class
              </label>
              <div className="relative">
                <select
                  value={selectedStreamId}
                  onChange={e => setSelectedStreamId(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                >
                  {streams.filter(s => s.isActiveYear).length > 0 && (
                    <optgroup label="Current Year">
                      {streams.filter(s => s.isActiveYear).map(s => (
                        <option key={s.streamId} value={s.streamId}>
                          {s.className} {s.streamName} ({s.studentCount} students)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {streams.filter(s => !s.isActiveYear).length > 0 && (
                    <optgroup label="Past Years">
                      {streams.filter(s => !s.isActiveYear).map(s => (
                        <option key={s.streamId} value={s.streamId}>
                          {s.className} {s.streamName} — {s.academicYear}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={e => setDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <button
              onClick={loadAttendance}
              disabled={isLoading}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Stream info + badge */}
          {selectedStream && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Users className="w-4 h-4" />
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedStream.className} {selectedStream.streamName}
                  </strong>
                  {" — "}{students.length} student{students.length !== 1 ? "s" : ""}
                </span>
              </div>
              {alreadyMarked && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-3 h-3" /> Attendance already marked
                </span>
              )}
            </div>
          )}

          {/* Summary counts */}
          {students.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {ALL_STATUSES.map(st => {
                const cfg = STATUS_CONFIG[st];
                const Icon = cfg.icon;
                return (
                  <div key={st} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                    <Icon className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{counts[st] ?? 0}</div>
                    <div className="text-xs text-slate-400">{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mark all row */}
          {students.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mark all:</span>
              {ALL_STATUSES.map(st => {
                const cfg = STATUS_CONFIG[st];
                return (
                  <button
                    key={st}
                    onClick={() => markAll(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${cfg.bg} ${cfg.text}`}
                  >
                    All {cfg.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Student list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">No students enrolled in this stream</p>
              <p className="text-sm mt-1">Check that students are enrolled for the current term</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Adm No</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student, i) => {
                    const currentStatus = edits[student.studentId] ?? "ABSENT";
                    return (
                      <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {student.imageUrl ? (
                              <img src={student.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-500 shrink-0">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                            )}
                            <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 hidden sm:table-cell">
                          {student.admissionNo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {ALL_STATUSES.map(st => {
                              const cfg = STATUS_CONFIG[st];
                              const isActive = currentStatus === st;
                              return (
                                <button
                                  key={st}
                                  onClick={() => setStatus(student.studentId, st)}
                                  title={cfg.label}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    isActive
                                      ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ${cfg.ring}`
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2 px-3 hidden lg:table-cell">
                          <input
                            type="text"
                            placeholder="Optional note…"
                            value={notes[student.studentId] ?? ""}
                            onChange={e => setNotes(p => ({ ...p, [student.studentId]: e.target.value }))}
                            maxLength={120}
                            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {students.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 sticky bottom-4 shadow-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{students.length}</span> students ·{" "}
                {format(new Date(date), "EEEE, d MMMM yyyy")}
                {alreadyMarked && (
                  <span className="ml-2 text-green-600 dark:text-green-400 text-xs font-medium">(updating existing)</span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isPending || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> {alreadyMarked ? "Update Attendance" : "Submit Attendance"}</>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS TAB ────────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-5">

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Stream / Class
              </label>
              <div className="relative">
                <select
                  value={reportStreamId}
                  onChange={e => { setReportStreamId(e.target.value); setSummaryLoaded(false); }}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                >
                  {streams.filter(s => s.isActiveYear).length > 0 && (
                    <optgroup label="Current Year">
                      {streams.filter(s => s.isActiveYear).map(s => (
                        <option key={s.streamId} value={s.streamId}>
                          {s.className} {s.streamName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {streams.filter(s => !s.isActiveYear).length > 0 && (
                    <optgroup label="Past Years">
                      {streams.filter(s => !s.isActiveYear).map(s => (
                        <option key={s.streamId} value={s.streamId}>
                          {s.className} {s.streamName} — {s.academicYear}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Term
              </label>
              <div className="relative">
                <select
                  value={reportTermId}
                  onChange={e => { setReportTermId(e.target.value); setSummaryLoaded(false); }}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                >
                  {filteredTerms.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.isActive ? " (Active)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={loadSummary}
              disabled={isLoadingSummary}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoadingSummary
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                : <><TrendingUp className="w-3.5 h-3.5" /> Generate Report</>
              }
            </button>
          </div>

          {/* Summary results */}
          {isLoadingSummary ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : !summaryLoaded ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">Select a stream and term, then click Generate Report</p>
            </div>
          ) : summary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
              <MinusCircle className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">No attendance records found for this period</p>
              <p className="text-sm mt-1">Attendance may not have been marked yet for this term</p>
            </div>
          ) : (
            <>
              {/* Class-level summary */}
              {(() => {
                const total   = summary.reduce((a, r) => a + r.total,   0);
                const present = summary.reduce((a, r) => a + r.present + r.late, 0);
                const classRate = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {reportStream?.className} {reportStream?.streamName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {reportTerm?.name} · {summary.length} students · {total} records
                        </p>
                      </div>
                      <div className={`text-2xl font-bold tabular-nums ${
                        classRate >= 80 ? "text-green-600 dark:text-green-400" :
                        classRate >= 60 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-600 dark:text-red-400"
                      }`}>
                        {classRate}%
                      </div>
                    </div>
                    <RateBar rate={classRate} />
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as StudentAttendanceStatus[]).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const Icon = cfg.icon;
                        const count = summary.reduce((a, r) => a + (r as any)[st.toLowerCase()], 0);
                        return (
                          <div key={st} className="text-center">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{count}</div>
                            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                              <Icon className="w-3 h-3" />{cfg.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Per-student table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Adm No</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">P</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">L</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">A</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">E</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[120px]">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {summary
                      .slice()
                      .sort((a, b) => b.attendanceRate - a.attendanceRate)
                      .map((row, i) => (
                        <tr key={row.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {row.studentName}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500 hidden sm:table-cell">
                            {row.admissionNo}
                          </td>
                          <td className="py-3 px-4 text-center text-green-600 dark:text-green-400 font-semibold text-xs tabular-nums">
                            {row.present}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-600 dark:text-amber-400 font-semibold text-xs tabular-nums">
                            {row.late}
                          </td>
                          <td className="py-3 px-4 text-center text-red-600 dark:text-red-400 font-semibold text-xs tabular-nums">
                            {row.absent}
                          </td>
                          <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400 font-semibold text-xs tabular-nums">
                            {row.excused}
                          </td>
                          <td className="py-3 px-4 min-w-[140px]">
                            <RateBar rate={row.attendanceRate} />
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
