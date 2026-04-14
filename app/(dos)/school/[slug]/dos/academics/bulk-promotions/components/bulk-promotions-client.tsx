// app/(dos)/school/[slug]/dos/academics/bulk-promotions/components/bulk-promotions-client.tsx
"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  Loader2, Users, ArrowRight, CheckCircle2, AlertCircle,
  RefreshCw, GraduationCap, RotateCcw, Minus, ChevronDown,
  TrendingUp, AlertTriangle, Settings2, RotateCcw as Reset,
} from "lucide-react";
import {
  getBulkPromotionStudents,
  getClassYearsForYear,
  executeBulkPromotion,
  type StudentPromotionAction,
  type StudentPromotionEntry,
} from "@/actions/bulk-promotions";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Term = { id: string; name: string; termNumber: number; isActive: boolean };
type Year = { id: string; year: string; isActive: boolean; terms: Term[] };

type Stream    = { id: string; name: string };
type ClassYear = {
  id:            string;
  classTemplate: { id: string; name: string; code: string | null; level: number | null; classLevel: string };
  streams:       Stream[];
  _count:        { enrollments: number };
};

type ReportCard = {
  id: string; isPublished: boolean; classLevel: string;
  division: string | null; aggregatePoints: number | null;
  totalPoints: number | null; principalPasses: number | null; subsidiaryPasses: number | null;
  totalSubjects: number | null; averageMarks: number | null;
  streamPosition: number | null; classPosition: number | null;
};

type StudentRow = {
  enrollmentId:  string;
  studentId:     string;
  firstName:     string;
  lastName:      string;
  admissionNo:   string;
  gender:        string;
  streamId:      string | null;
  streamName:    string | null;
  classLevel:    string;
  reportCard:    ReportCard | null;
  suggested:     StudentPromotionAction;
  action:        StudentPromotionAction;
  toClassYearId: string;
  toStreamId:    string | null;
};

type ExecutionResult = {
  results: Array<{ studentId: string; action: string; ok: boolean; message?: string }>;
  summary: { succeeded: number; failed: number; skipped: number; total: number };
};

// ── Promotion criteria ─────────────────────────────────────────────────────

type PromotionCriteria = {
  // O-Level: which divisions qualify for promotion (U always = repeat)
  promoteDivisions:   string[];
  // A-Level: minimum principal passes required to promote
  minPrincipalPasses: number;
  // A-Level: optional minimum total points
  minTotalPoints:     number | null;
  // Both levels: optional minimum average-marks threshold
  minAverageMarks:    number | null;
  // What to do when a student has no report card yet
  noReportCardAction: StudentPromotionAction;
};

const O_LEVEL_DIVISIONS = ["I", "II", "III", "IV"] as const;

const DEFAULT_O_LEVEL_CRITERIA: PromotionCriteria = {
  promoteDivisions:   ["I", "II", "III", "IV"], // promote Div I–IV, repeat U
  minPrincipalPasses: 1,
  minTotalPoints:     null,
  minAverageMarks:    null,
  noReportCardAction: "SKIP",
};

const DEFAULT_A_LEVEL_CRITERIA: PromotionCriteria = {
  promoteDivisions:   ["I", "II", "III", "IV"],
  minPrincipalPasses: 1, // promote if ≥ 1 principal pass
  minTotalPoints:     null,
  minAverageMarks:    null,
  noReportCardAction: "SKIP",
};

type Props = {
  years:      Year[];
  schoolId:   string;
  schoolName: string;
  slug:       string;
  userId:     string;
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function suggestAction(
  rc:         ReportCard | null,
  classLevel: string,
  criteria:   PromotionCriteria,
): StudentPromotionAction {
  if (!rc) return criteria.noReportCardAction;

  // Optional average-marks gate (applies to both levels)
  if (criteria.minAverageMarks !== null && (rc.averageMarks ?? 0) < criteria.minAverageMarks) {
    return "REPEAT";
  }

  if (classLevel === "O_LEVEL") {
    const div = rc.division?.toUpperCase() ?? "";
    return criteria.promoteDivisions.includes(div) ? "PROMOTE" : "REPEAT";
  }

  if (classLevel === "A_LEVEL") {
    // Optional total-points gate
    if (criteria.minTotalPoints !== null && (rc.totalPoints ?? 0) < criteria.minTotalPoints) {
      return "REPEAT";
    }
    return (rc.principalPasses ?? 0) >= criteria.minPrincipalPasses ? "PROMOTE" : "REPEAT";
  }

  return "PROMOTE";
}

function divisionColor(div: string | null | undefined) {
  const d = div?.toUpperCase();
  if (d === "I")   return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (d === "II")  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (d === "III") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  if (d === "IV")  return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

function actionColor(action: StudentPromotionAction) {
  if (action === "PROMOTE") return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  if (action === "REPEAT")  return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

// ════════════════════════════════════════════════════════════════════════════
// SELECT COMPONENT
// ════════════════════════════════════════════════════════════════════════════

function Select({
  value, onChange, disabled = false, placeholder, children, className = "",
}: {
  value: string; onChange: (v: string) => void;
  disabled?: boolean; placeholder?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed pr-8"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
      {children}
    </p>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CRITERIA PANEL
// ════════════════════════════════════════════════════════════════════════════

function CriteriaPanel({
  classLevel,
  criteria,
  onChange,
  onReset,
  previewCounts,
}: {
  classLevel:    string | null;
  criteria:      PromotionCriteria;
  onChange:      (patch: Partial<PromotionCriteria>) => void;
  onReset:       () => void;
  previewCounts: { promote: number; repeat: number; skip: number } | null;
}) {
  const [open, setOpen] = useState(true);

  function toggleDivision(div: string) {
    const current = criteria.promoteDivisions;
    const next = current.includes(div)
      ? current.filter(d => d !== div)
      : [...current, div];
    onChange({ promoteDivisions: next });
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Settings2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Promotion Criteria</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set the conditions for promotion — overrides built-in defaults
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {previewCounts && (
            <span className="text-xs text-slate-500 hidden sm:block">
              <span className="text-blue-600 font-medium">{previewCounts.promote}</span> promote ·{" "}
              <span className="text-orange-600 font-medium">{previewCounts.repeat}</span> repeat ·{" "}
              <span className="text-slate-400 font-medium">{previewCounts.skip}</span> skip
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-5">

          {!classLevel && (
            <p className="text-sm text-slate-400 italic">
              Select a source class above to configure criteria.
            </p>
          )}

          {classLevel === "O_LEVEL" && (
            <>
              {/* Divisions to promote */}
              <div>
                <SectionLabel>Promote students with Division</SectionLabel>
                <p className="text-xs text-slate-500 mb-3">
                  Tick the divisions that should result in promotion. Unticked divisions → Repeat.
                  Division U is always treated as Repeat.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {O_LEVEL_DIVISIONS.map(div => {
                    const checked = criteria.promoteDivisions.includes(div);
                    return (
                      <label
                        key={div}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                          checked
                            ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDivision(div)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-semibold ${divisionColor(div)} px-2 py-0.5 rounded-full`}>
                          Div {div}
                        </span>
                        <span className="text-xs text-slate-500 hidden sm:inline">
                          {div === "I" ? "≤6 pts" : div === "II" ? "7–14" : div === "III" ? "15–20" : "21–25"}
                        </span>
                      </label>
                    );
                  })}
                  <span className="text-xs text-slate-400 px-2">U → always Repeat</span>
                </div>
              </div>
            </>
          )}

          {classLevel === "A_LEVEL" && (
            <>
              {/* Min principal passes */}
              <div>
                <SectionLabel>Minimum principal passes to promote</SectionLabel>
                <p className="text-xs text-slate-500 mb-3">
                  Students with fewer principal passes than this will be marked as Repeat.
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange({ minPrincipalPasses: n })}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                        criteria.minPrincipalPasses === n
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-1">pass{criteria.minPrincipalPasses !== 1 ? "es" : ""} required</span>
                </div>
              </div>

              {/* Min total points (optional) */}
              <div>
                <SectionLabel>Minimum total points (optional)</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">
                  Leave blank to ignore. Students below this points total → Repeat (in addition to pass requirement).
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={21}
                    placeholder="e.g. 6"
                    value={criteria.minTotalPoints ?? ""}
                    onChange={e => onChange({ minTotalPoints: e.target.value ? Number(e.target.value) : null })}
                    className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                               px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-400">points</span>
                  {criteria.minTotalPoints !== null && (
                    <button onClick={() => onChange({ minTotalPoints: null })}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear</button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Min average marks — both levels */}
          {classLevel && (
            <div>
              <SectionLabel>Minimum average marks (optional)</SectionLabel>
              <p className="text-xs text-slate-500 mb-2">
                Leave blank to ignore. Students below this average → Repeat, regardless of division or passes.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 50"
                  value={criteria.minAverageMarks ?? ""}
                  onChange={e => onChange({ minAverageMarks: e.target.value ? Number(e.target.value) : null })}
                  className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                             px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400">%</span>
                {criteria.minAverageMarks !== null && (
                  <button onClick={() => onChange({ minAverageMarks: null })}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear</button>
                )}
              </div>
            </div>
          )}

          {/* No report card action — both levels */}
          {classLevel && (
            <div>
              <SectionLabel>If student has no report card</SectionLabel>
              <div className="flex items-center gap-2">
                {(["PROMOTE", "REPEAT", "SKIP"] as StudentPromotionAction[]).map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onChange({ noReportCardAction: a })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      criteria.noReportCardAction === a
                        ? a === "PROMOTE" ? "bg-blue-600 border-blue-600 text-white"
                          : a === "REPEAT" ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-slate-600 border-slate-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    {a === "PROMOTE" ? "Promote" : a === "REPEAT" ? "Repeat" : "Skip"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live preview + reset */}
          {classLevel && (
            <div className="flex items-center justify-between pt-1">
              {previewCounts ? (
                <p className="text-xs text-slate-500">
                  With current criteria:{" "}
                  <span className="text-blue-600 font-semibold">{previewCounts.promote}</span> would promote,{" "}
                  <span className="text-orange-600 font-semibold">{previewCounts.repeat}</span> would repeat,{" "}
                  <span className="text-slate-400 font-semibold">{previewCounts.skip}</span> would skip
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Load students to see preview counts.</p>
              )}
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors shrink-0 ml-4"
              >
                <Reset className="h-3.5 w-3.5" />
                Reset to defaults
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function BulkPromotionsClient({
  years, schoolId, schoolName, slug, userId,
}: Props) {

  // ── Source config ─────────────────────────────────────────────────────────
  const [srcYearId,      setSrcYearId]      = useState(years.find(y => y.isActive)?.id ?? years[0]?.id ?? "");
  const [srcClassYears,  setSrcClassYears]  = useState<ClassYear[]>([]);
  const [srcClassYearId, setSrcClassYearId] = useState("");
  const [srcTermId,      setSrcTermId]      = useState("");
  const [srcLoading,     setSrcLoading]     = useState(false);

  // ── Destination config ────────────────────────────────────────────────────
  const [dstYearId,         setDstYearId]         = useState("");
  const [dstClassYears,     setDstClassYears]     = useState<ClassYear[]>([]);
  const [dstPromoteClassId, setDstPromoteClassId] = useState("");
  const [dstRepeatClassId,  setDstRepeatClassId]  = useState("");
  const [dstTermId,         setDstTermId]         = useState("");
  const [dstLoading,        setDstLoading]        = useState(false);

  // ── Promotion criteria ────────────────────────────────────────────────────
  const [criteria, setCriteria] = useState<PromotionCriteria>(DEFAULT_O_LEVEL_CRITERIA);

  // ── Students ──────────────────────────────────────────────────────────────
  const [students,    setStudents]    = useState<StudentRow[]>([]);
  const [studLoading, setStudLoading] = useState(false);
  const [studError,   setStudError]   = useState<string | null>(null);
  const [loaded,      setLoaded]      = useState(false);

  // ── Execution ─────────────────────────────────────────────────────────────
  const [isPending,   startTransition] = useTransition();
  const [execResult,  setExecResult]   = useState<ExecutionResult | null>(null);
  const [execError,   setExecError]    = useState<string | null>(null);
  const [showConfirm, setShowConfirm]  = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const srcYear         = years.find(y => y.id === srcYearId);
  const srcTerms        = srcYear?.terms ?? [];
  const dstYear         = years.find(y => y.id === dstYearId);
  const dstTerms        = dstYear?.terms ?? [];
  const dstPromoteClass = dstClassYears.find(c => c.id === dstPromoteClassId);
  const dstRepeatClass  = dstClassYears.find(c => c.id === dstRepeatClassId);

  // Detected class level from selected source class
  const detectedClassLevel =
    srcClassYears.find(c => c.id === srcClassYearId)?.classTemplate.classLevel ?? null;

  const promoteCount = students.filter(s => s.action === "PROMOTE").length;
  const repeatCount  = students.filter(s => s.action === "REPEAT").length;
  const skipCount    = students.filter(s => s.action === "SKIP").length;
  const readyToExec  = dstTermId && dstPromoteClassId && dstRepeatClassId &&
                       students.length > 0 && (promoteCount + repeatCount) > 0;

  // Live preview of what current criteria would produce on loaded students
  const criteriaPreview = useMemo(() => {
    if (students.length === 0) return null;
    let promote = 0, repeat = 0, skip = 0;
    for (const s of students) {
      const a = suggestAction(s.reportCard, s.classLevel, criteria);
      if (a === "PROMOTE") promote++;
      else if (a === "REPEAT") repeat++;
      else skip++;
    }
    return { promote, repeat, skip };
  }, [students, criteria]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function loadSrcClasses(yearId: string) {
    if (!yearId) return;
    setSrcLoading(true);
    setSrcClassYearId("");
    setSrcTermId("");
    setLoaded(false);
    setStudents([]);
    const res = await getClassYearsForYear(schoolId, yearId);
    if (res.ok) setSrcClassYears(res.data);
    setSrcLoading(false);
  }

  async function loadDstClasses(yearId: string) {
    if (!yearId) return;
    setDstLoading(true);
    setDstPromoteClassId("");
    setDstRepeatClassId("");
    setDstTermId("");
    const res = await getClassYearsForYear(schoolId, yearId);
    if (res.ok) setDstClassYears(res.data);
    setDstLoading(false);
  }

  function onSrcClassChange(classYearId: string) {
    setSrcClassYearId(classYearId);
    setLoaded(false);
    setStudents([]);
    // Auto-reset criteria to match detected class level
    const cl = srcClassYears.find(c => c.id === classYearId)?.classTemplate.classLevel;
    setCriteria(cl === "A_LEVEL" ? DEFAULT_A_LEVEL_CRITERIA : DEFAULT_O_LEVEL_CRITERIA);
  }

  async function loadStudents() {
    if (!srcClassYearId || !srcTermId) return;
    setStudLoading(true);
    setStudError(null);
    setLoaded(false);
    setStudents([]);
    setExecResult(null);

    const res = await getBulkPromotionStudents({ classYearId: srcClassYearId, termId: srcTermId, schoolId });

    if (!res.ok) {
      setStudError(res.message);
      setStudLoading(false);
      return;
    }

    const rows: StudentRow[] = res.data.map(e => {
      const level   = e.classYear.classTemplate.classLevel;
      const suggest = suggestAction(e.reportCard as ReportCard | null, level, criteria);
      return {
        enrollmentId:  e.id,
        studentId:     e.student.id,
        firstName:     e.student.firstName,
        lastName:      e.student.lastName,
        admissionNo:   e.student.admissionNo,
        gender:        e.student.gender,
        streamId:      e.stream?.id   ?? null,
        streamName:    e.stream?.name ?? null,
        classLevel:    level,
        reportCard:    e.reportCard as ReportCard | null,
        suggested:     suggest,
        action:        suggest,
        toClassYearId: "",
        toStreamId:    null,
      };
    });

    setStudents(rows);
    setStudLoading(false);
    setLoaded(true);
  }

  // Re-compute suggestions for all loaded students using current criteria
  function applyRules() {
    setStudents(prev => prev.map(s => {
      const newAction = suggestAction(s.reportCard, s.classLevel, criteria);
      return {
        ...s,
        suggested:     newAction,
        action:        newAction,
        toClassYearId: newAction === "PROMOTE" ? dstPromoteClassId
                     : newAction === "REPEAT"  ? dstRepeatClassId
                     : "",
        toStreamId: null,
      };
    }));
  }

  function updateRow(
    studentId: string,
    patch: Partial<Pick<StudentRow, "action" | "toClassYearId" | "toStreamId">>,
  ) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, ...patch } : s));
  }

  function onPromoteClassChange(classYearId: string) {
    setDstPromoteClassId(classYearId);
    setStudents(prev => prev.map(s =>
      s.action === "PROMOTE" ? { ...s, toClassYearId: classYearId, toStreamId: null } : s
    ));
  }

  function onRepeatClassChange(classYearId: string) {
    setDstRepeatClassId(classYearId);
    setStudents(prev => prev.map(s =>
      s.action === "REPEAT" ? { ...s, toClassYearId: classYearId, toStreamId: null } : s
    ));
  }

  function handleExecute() {
    setShowConfirm(false);
    setExecError(null);

    const entries: StudentPromotionEntry[] = [
      ...students.filter(s => s.action !== "SKIP").map(s => ({
        studentId: s.studentId, fromEnrollmentId: s.enrollmentId,
        action: s.action, toClassYearId: s.toClassYearId,
        toStreamId: s.toStreamId ?? null,
        toTermId: dstTermId, toAcademicYearId: dstYearId,
      })),
      ...students.filter(s => s.action === "SKIP").map(s => ({
        studentId: s.studentId, fromEnrollmentId: s.enrollmentId,
        action: "SKIP" as const, toClassYearId: "",
        toStreamId: null, toTermId: dstTermId, toAcademicYearId: dstYearId,
      })),
    ];

    startTransition(async () => {
      const res = await executeBulkPromotion({ entries, schoolId, promotedById: userId, slug });
      if (res.ok) setExecResult(res);
      else setExecError("Execution failed. Please try again.");
    });
  }

  const streamsForClass = (classYearId: string) =>
    dstClassYears.find(c => c.id === classYearId)?.streams ?? [];

  const invalidRows = useMemo(
    () => students.filter(s => s.action !== "SKIP" && !s.toClassYearId).length,
    [students],
  );

  // Auto-load source classes on mount using the pre-selected active year
  useEffect(() => {
    if (srcYearId) loadSrcClasses(srcYearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          Bulk Student Promotion
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure promotion criteria, review results, and promote or repeat students to the next academic year.
          Previous term records are never altered.
        </p>
      </div>

      {/* ── Source + Destination config ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Source */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Source — Current Enrolment</h2>
          </div>
          <div className="space-y-3">
            <div>
              <SectionLabel>Academic Year</SectionLabel>
              <Select value={srcYearId} onChange={v => { setSrcYearId(v); loadSrcClasses(v); }} placeholder="Select year…">
                {years.map(y => <option key={y.id} value={y.id}>{y.year}{y.isActive ? " (Active)" : ""}</option>)}
              </Select>
            </div>
            <div>
              <SectionLabel>Class</SectionLabel>
              {srcLoading
                ? <div className="flex items-center gap-2 text-sm text-slate-400 py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
                : (
                  <Select value={srcClassYearId} onChange={onSrcClassChange}
                    placeholder="Select class…" disabled={!srcYearId || srcClassYears.length === 0}>
                    {srcClassYears.map(cy => (
                      <option key={cy.id} value={cy.id}>
                        {cy.classTemplate.name}
                        {cy._count.enrollments > 0 ? ` (${cy._count.enrollments})` : ""}
                        {cy.classTemplate.classLevel === "A_LEVEL" ? " — A-Level" : ""}
                      </option>
                    ))}
                  </Select>
                )
              }
            </div>
            <div>
              <SectionLabel>Term</SectionLabel>
              <Select value={srcTermId} onChange={v => { setSrcTermId(v); setLoaded(false); setStudents([]); }}
                placeholder="Select term…" disabled={!srcYearId}>
                {srcTerms.map(t => <option key={t.id} value={t.id}>{t.name}{t.isActive ? " (Active)" : ""}</option>)}
              </Select>
            </div>
            <button
              onClick={loadStudents}
              disabled={!srcClassYearId || !srcTermId || studLoading}
              className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {studLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading Students…</>
                : <><RefreshCw className="h-4 w-4" /> Load Students</>
              }
            </button>
          </div>
        </div>

        {/* Destination */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Destination — Next Enrolment</h2>
          </div>
          <div className="space-y-3">
            <div>
              <SectionLabel>Target Academic Year</SectionLabel>
              <Select value={dstYearId} onChange={v => { setDstYearId(v); loadDstClasses(v); }} placeholder="Select target year…">
                {years.map(y => <option key={y.id} value={y.id}>{y.year}{y.isActive ? " (Active)" : ""}</option>)}
              </Select>
            </div>
            <div>
              <SectionLabel>Target Term</SectionLabel>
              <Select value={dstTermId} onChange={setDstTermId} placeholder="Select target term…" disabled={!dstYearId}>
                {dstTerms.map(t => <option key={t.id} value={t.id}>{t.name}{t.isActive ? " (Active)" : ""}</option>)}
              </Select>
            </div>
            {dstLoading && <div className="flex items-center gap-2 text-sm text-slate-400 py-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading classes…</div>}
            {!dstLoading && dstClassYears.length > 0 && (
              <>
                <div>
                  <SectionLabel>Default "Promote To" Class</SectionLabel>
                  <Select value={dstPromoteClassId} onChange={onPromoteClassChange} placeholder="Select promoted class…">
                    {dstClassYears.map(cy => <option key={cy.id} value={cy.id}>{cy.classTemplate.name}</option>)}
                  </Select>
                </div>
                <div>
                  <SectionLabel>Default "Repeat In" Class</SectionLabel>
                  <Select value={dstRepeatClassId} onChange={onRepeatClassChange} placeholder="Select repeat class…">
                    {dstClassYears.map(cy => <option key={cy.id} value={cy.id}>{cy.classTemplate.name}</option>)}
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Promotion Criteria panel ─────────────────────────────────────── */}
      <CriteriaPanel
        classLevel={detectedClassLevel}
        criteria={criteria}
        onChange={patch => setCriteria(prev => ({ ...prev, ...patch }))}
        onReset={() => setCriteria(
          detectedClassLevel === "A_LEVEL" ? DEFAULT_A_LEVEL_CRITERIA : DEFAULT_O_LEVEL_CRITERIA
        )}
        previewCounts={criteriaPreview}
      />

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {studError && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{studError}
        </div>
      )}

      {/* ── Student table ────────────────────────────────────────────────── */}
      {loaded && students.length > 0 && !execResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

          {/* Table toolbar */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                {students.length} Student{students.length !== 1 ? "s" : ""} Loaded
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{promoteCount} promote</span>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">{repeatCount} repeat</span>
                <span className="text-xs text-slate-400 font-medium">{skipCount} skip</span>
                {invalidRows > 0 && (
                  <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{invalidRows} missing target class
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {dstPromoteClassId && dstRepeatClassId && (
                <button
                  onClick={applyRules}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50
                             text-violet-700 dark:text-violet-300 rounded-lg transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Apply Promotion Rules
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[22%]">Student</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[10%]">Stream</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[20%]">Report Card</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[12%]">Suggested</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[12%]">Action</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[15%]">Target Class</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs w-[9%]">Stream</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map(s => {
                  const tgtStreams    = streamsForClass(s.toClassYearId);
                  const isSkip       = s.action === "SKIP";
                  const missingClass = !isSkip && !s.toClassYearId;

                  return (
                    <tr key={s.studentId} className={`transition-colors ${
                      isSkip ? "opacity-50 bg-slate-50/50 dark:bg-slate-800/20"
                      : missingClass ? "bg-red-50/30 dark:bg-red-950/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-xs leading-tight">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">{s.admissionNo}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{s.streamName ?? "—"}</td>
                      <td className="px-3 py-3">
                        {!s.reportCard ? (
                          <span className="text-[11px] text-slate-400 italic">No report card</span>
                        ) : s.classLevel === "O_LEVEL" ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${divisionColor(s.reportCard.division)}`}>
                              Div {s.reportCard.division ?? "?"}
                            </span>
                            {s.reportCard.aggregatePoints != null && (
                              <span className="text-[11px] text-slate-500">Agg {s.reportCard.aggregatePoints}</span>
                            )}
                            {s.reportCard.averageMarks != null && (
                              <span className="text-[11px] text-slate-400">{s.reportCard.averageMarks.toFixed(1)}%</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              (s.reportCard.principalPasses ?? 0) >= criteria.minPrincipalPasses
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                            }`}>
                              {s.reportCard.principalPasses ?? 0}P + {s.reportCard.subsidiaryPasses ?? 0}S
                            </span>
                            {s.reportCard.totalPoints != null && (
                              <span className="text-[11px] text-slate-500">{s.reportCard.totalPoints} pts</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${actionColor(s.suggested)}`}>
                          {s.suggested === "PROMOTE" ? "Promote" : s.suggested === "REPEAT" ? "Repeat" : "Skip"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative">
                          <select
                            value={s.action}
                            onChange={e => {
                              const a = e.target.value as StudentPromotionAction;
                              updateRow(s.studentId, {
                                action: a,
                                toClassYearId: a === "PROMOTE" ? dstPromoteClassId : a === "REPEAT" ? dstRepeatClassId : "",
                                toStreamId: null,
                              });
                            }}
                            className="appearance-none w-full bg-transparent border border-slate-200 dark:border-slate-700
                                       rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-200
                                       focus:outline-none focus:ring-1 focus:ring-blue-500 pr-6"
                          >
                            <option value="PROMOTE">Promote</option>
                            <option value="REPEAT">Repeat</option>
                            <option value="SKIP">Skip</option>
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {isSkip ? <span className="text-[11px] text-slate-400 italic">—</span> : (
                          <div className="relative">
                            <select
                              value={s.toClassYearId}
                              onChange={e => updateRow(s.studentId, { toClassYearId: e.target.value, toStreamId: null })}
                              className={`appearance-none w-full border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 pr-6
                                ${missingClass
                                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                                  : "border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
                                }`}
                            >
                              <option value="">Select…</option>
                              {dstClassYears.map(cy => <option key={cy.id} value={cy.id}>{cy.classTemplate.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {!isSkip && tgtStreams.length > 0 ? (
                          <div className="relative">
                            <select
                              value={s.toStreamId ?? ""}
                              onChange={e => updateRow(s.studentId, { toStreamId: e.target.value || null })}
                              className="appearance-none w-full bg-transparent border border-slate-200 dark:border-slate-700
                                         rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-200
                                         focus:outline-none focus:ring-1 focus:ring-blue-500 pr-6"
                            >
                              <option value="">None</option>
                              {tgtStreams.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                          </div>
                        ) : <span className="text-[11px] text-slate-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />{promoteCount} promote
              </span>
              <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                <RotateCcw className="h-4 w-4" />{repeatCount} repeat
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Minus className="h-4 w-4" />{skipCount} skip
              </span>
            </div>
            <div className="flex items-center gap-3">
              {invalidRows > 0 && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />{invalidRows} row{invalidRows !== 1 ? "s" : ""} missing target class
                </span>
              )}
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!readyToExec || invalidRows > 0 || isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                  : <><GraduationCap className="h-4 w-4" />Execute Promotion</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {loaded && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium text-slate-600 dark:text-slate-400">No active students found</p>
          <p className="text-sm mt-1">No active enrollments for the selected class and term.</p>
        </div>
      )}

      {/* ── Execution results ────────────────────────────────────────────── */}
      {execResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`px-5 py-4 border-b ${
            execResult.summary.failed > 0
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40"
              : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40"
          }`}>
            <div className="flex items-center gap-3">
              {execResult.summary.failed > 0
                ? <AlertCircle  className="h-5 w-5 text-amber-600 shrink-0" />
                : <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              }
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Promotion Complete</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {execResult.summary.succeeded} processed · {execResult.summary.skipped} skipped ·{" "}
                  {execResult.summary.failed > 0
                    ? <span className="text-red-500">{execResult.summary.failed} failed</span>
                    : "0 failed"
                  }
                </p>
              </div>
            </div>
          </div>
          {execResult.summary.failed > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {execResult.results.filter(r => !r.ok).map(r => {
                const st = students.find(s => s.studentId === r.studentId);
                return (
                  <div key={r.studentId} className="flex items-center gap-3 px-5 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {st ? `${st.firstName} ${st.lastName}` : r.studentId}
                    </span>
                    <span className="text-xs text-red-500 ml-auto">{r.message}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-5 py-4 flex justify-end">
            <button
              onClick={() => { setExecResult(null); setLoaded(false); setStudents([]); }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start New Promotion
            </button>
          </div>
        </div>
      )}

      {execError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{execError}
        </div>
      )}

      {/* ── Confirm dialog ───────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md
                          border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Confirm Bulk Promotion</h2>
            <p className="text-sm text-slate-500">You are about to:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <TrendingUp className="h-4 w-4 shrink-0" />
                Promote <strong>{promoteCount}</strong> student{promoteCount !== 1 ? "s" : ""} to{" "}
                {dstPromoteClass?.classTemplate.name ?? "the selected class"}
              </li>
              <li className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <RotateCcw className="h-4 w-4 shrink-0" />
                Repeat <strong>{repeatCount}</strong> student{repeatCount !== 1 ? "s" : ""} in{" "}
                {dstRepeatClass?.classTemplate.name ?? "the selected class"}
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <Minus className="h-4 w-4 shrink-0" />
                Skip <strong>{skipCount}</strong> student{skipCount !== 1 ? "s" : ""} (no changes)
              </li>
            </ul>
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              All previous-term marks and report cards are preserved. New enrollments will be created for the target year/term.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleExecute}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
