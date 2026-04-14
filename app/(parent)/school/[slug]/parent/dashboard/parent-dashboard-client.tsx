"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap, CalendarDays, CreditCard, Users, AlertCircle,
  BookOpen, BarChart2, Loader2, RefreshCw, Filter, Eye, ArrowLeft,
  CheckCircle2, XCircle, Clock, ShieldCheck, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Enrollment = {
  id: string;
  classYear: { classTemplate: { name: string; level: string } };
  stream:    { id: string; name: string };
  term:      { id: string; name: string; termNumber: number };
  academicYear: { id: string; year: string };
  reportCard: any | null;
  subjectEnrollments: Array<{
    id: string;
    streamSubject: { subject: { name: string; code: string | null } };
    subjectFinalMark: { totalPercentage: number | null; finalGrade: string | null } | null;
    subjectResult:    { totalPercentage: number | null; finalGrade: string | null; projectScore: number | null } | null;
  }>;
};

type Student = {
  id: string; firstName: string; lastName: string;
  admissionNo: string; gender: string; imageUrl: string | null; dob: string | null;
  enrollments: Enrollment[];
  attendance: { total: number; present: number; absent: number; late: number; records: any[] };
  invoices: Array<{
    id: string; termName: string; yearName: string; structureName: string;
    totalAmount: number; paid: number; balance: number; status: string;
  }>;
};

type AcademicYear = { id: string; year: string; isActive: boolean };
type Term = { id: string; name: string; termNumber: number; academicYearId: string; isActive: boolean };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);
}
function gradeColor(g: string | null) {
  if (!g) return "text-slate-400";
  const u = g.toUpperCase();
  if (["D1","D2","A"].includes(u)) return "text-green-600 dark:text-green-400";
  if (["C3","C4","B"].includes(u)) return "text-blue-600 dark:text-blue-400";
  if (["C5","C6","C"].includes(u)) return "text-amber-600 dark:text-amber-400";
  if (["P7","P8","D"].includes(u)) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}
const ATT_ICON: Record<string, React.ElementType> = {
  PRESENT: CheckCircle2, ABSENT: XCircle, LATE: Clock, EXCUSED: ShieldCheck,
};
const ATT_COLOR: Record<string, string> = {
  PRESENT: "text-green-600 dark:text-green-400",
  ABSENT:  "text-red-600 dark:text-red-400",
  LATE:    "text-amber-600 dark:text-amber-400",
  EXCUSED: "text-blue-600 dark:text-blue-400",
};

// ── Student Detail View ───────────────────────────────────────────────────────

function StudentDetail({ student, slug, onBack }: { student: Student; slug: string; onBack: () => void }) {
  const enrollment = student.enrollments[0] ?? null;
  const subjects   = enrollment?.subjectEnrollments ?? [];
  const att        = student.attendance;
  const attRate    = att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : null;
  const totalOwed  = student.invoices.reduce((s, i) => s + i.balance, 0);

  const subjectsWithMarks = subjects.filter(se =>
    se.subjectFinalMark?.totalPercentage != null || se.subjectResult?.totalPercentage != null
  );
  const avgMark = subjectsWithMarks.length > 0
    ? subjectsWithMarks.reduce((s, se) => s + (se.subjectFinalMark?.totalPercentage ?? se.subjectResult?.totalPercentage ?? 0), 0) / subjectsWithMarks.length
    : null;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          {student.imageUrl ? (
            <img src={student.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
              {student.firstName[0]}{student.lastName[0]}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{student.admissionNo}
              {enrollment && ` · ${enrollment.classYear.classTemplate.name} ${enrollment.stream.name} · ${enrollment.term.name} ${enrollment.academicYear.year}`}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Mark",   value: avgMark != null ? `${avgMark.toFixed(1)}%` : "—",  color: avgMark != null && avgMark >= 60 ? "text-green-600 dark:text-green-400" : avgMark != null && avgMark >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400" },
          { label: "Attendance", value: attRate != null ? `${attRate}%` : "—",              color: attRate != null && attRate >= 90 ? "text-green-600 dark:text-green-400" : attRate != null && attRate >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400" },
          { label: "Subjects",   value: subjects.length,                                    color: "text-slate-900 dark:text-white" },
          { label: "Fee Balance",value: totalOwed > 0 ? fmtCurrency(totalOwed) : "Clear",  color: totalOwed > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className={`text-xl font-bold ${color} truncate`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject performance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Subject Performance</span>
          </div>
          {subjects.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No subjects enrolled</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map(se => {
                const mark  = se.subjectFinalMark?.totalPercentage ?? se.subjectResult?.totalPercentage ?? null;
                const grade = se.subjectFinalMark?.finalGrade      ?? se.subjectResult?.finalGrade      ?? null;
                return (
                  <div key={se.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{se.streamSubject.subject.name}</span>
                    {mark != null && (
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                        <div className={`h-full rounded-full ${mark >= 60 ? "bg-green-500" : mark >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, mark)}%` }} />
                      </div>
                    )}
                    <span className="text-xs font-mono text-slate-500 w-10 text-right">{mark != null ? `${mark.toFixed(0)}%` : "—"}</span>
                    <span className={`text-xs font-bold w-6 text-right ${gradeColor(grade)}`}>{grade ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-800 dark:text-white text-sm">Attendance (30 days)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ l: "Present", v: att.present, c: "text-green-600 dark:text-green-400" }, { l: "Absent", v: att.absent, c: "text-red-600 dark:text-red-400" }, { l: "Late", v: att.late, c: "text-amber-600 dark:text-amber-400" }].map(({ l, v, c }) => (
                <div key={l}><p className={`text-sm font-bold ${c}`}>{v}</p><p className="text-[10px] text-slate-400">{l}</p></div>
              ))}
            </div>
          </div>
          {att.records.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No records</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
              {att.records.slice(0, 14).map((r: any, i: number) => {
                const Icon  = ATT_ICON[r.status]  ?? CheckCircle2;
                const color = ATT_COLOR[r.status] ?? "text-slate-400";
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span className="text-xs text-slate-400 w-24 shrink-0 tabular-nums">
                      {new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                    <span className={`text-xs font-semibold ${color}`}>{r.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fee invoices */}
      {student.invoices.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Fee Summary</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {student.invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{inv.termName} {inv.yearName}</p>
                  <p className="text-xs text-slate-400 truncate">{inv.structureName}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div><p className="text-xs text-slate-400">Total</p><p className="text-sm font-semibold text-slate-900 dark:text-white">{fmtCurrency(inv.totalAmount)}</p></div>
                  <div><p className="text-xs text-slate-400">Paid</p><p className="text-sm font-semibold text-green-600 dark:text-green-400">{fmtCurrency(inv.paid)}</p></div>
                  <div><p className="text-xs text-slate-400">Balance</p><p className={`text-sm font-bold ${inv.balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>{fmtCurrency(inv.balance)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/school/${slug}/parent/results`} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
          <GraduationCap className="w-4 h-4" /> Full Results
        </Link>
        <Link href={`/school/${slug}/parent/attendance`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <CalendarDays className="w-4 h-4" /> Full Attendance
        </Link>
        <Link href={`/school/${slug}/parent/finance`} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <CreditCard className="w-4 h-4" /> Full Finance
        </Link>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ParentDashboardClient({ slug, schoolId }: { slug: string; schoolId: string }) {
  const [data,         setData]         = useState<{ parent: any; students: Student[]; academicYears: AcademicYear[]; terms: Term[] } | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [yearFilter,   setYearFilter]   = useState("");
  const [termFilter,   setTermFilter]   = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.set("yearId", yearFilter);
      if (termFilter) params.set("termId", termFilter);
      const res = await fetch(`/api/parent?${params}`);
      if (!res.ok) throw new Error("Failed to load data");
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [yearFilter, termFilter]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-slate-600 dark:text-slate-400">{error ?? "Failed to load"}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Retry</button>
    </div>
  );

  const { parent, students, academicYears, terms } = data;
  const filteredTerms = yearFilter ? terms.filter(t => t.academicYearId === yearFilter) : terms;

  // If a student is selected, show detail view
  if (selectedStudent) {
    return (
      <div className="max-w-5xl mx-auto">
        <StudentDetail student={selectedStudent} slug={slug} onBack={() => setSelectedStudent(null)} />
      </div>
    );
  }

  // Summary stats
  const totalArrears = students.reduce((s, st) => s + st.invoices.reduce((a, i) => a + i.balance, 0), 0);
  const avgAtt = students.length > 0
    ? students.reduce((s, st) => {
        const r = st.attendance.total > 0 ? ((st.attendance.present + st.attendance.late) / st.attendance.total) * 100 : 0;
        return s + r;
      }, 0) / students.length
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Welcome, {parent?.firstName ?? "Parent"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {students.length} student{students.length !== 1 ? "s" : ""} linked to your account
          </p>
        </div>
        <button onClick={fetchData} className="self-start sm:self-auto p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setTermFilter(""); }}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Years</option>
          {academicYears.map(y => <option key={y.id} value={y.id}>{y.year}{y.isActive ? " (Active)" : ""}</option>)}
        </select>
        <select value={termFilter} onChange={e => setTermFilter(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Terms</option>
          {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}{t.isActive ? " (Active)" : ""}</option>)}
        </select>
        {(yearFilter || termFilter) && (
          <button onClick={() => { setYearFilter(""); setTermFilter(""); }} className="text-xs text-primary hover:underline">Clear</button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,       label: "Children",    value: students.length, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" },
          { icon: BarChart2,   label: "Avg Attend.", value: avgAtt != null ? `${avgAtt.toFixed(0)}%` : "—", color: avgAtt != null && avgAtt < 75 ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
          { icon: CreditCard,  label: "Arrears",     value: totalArrears > 0 ? fmtCurrency(totalArrears) : "Clear", color: totalArrears > 0 ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
          { icon: GraduationCap, label: "Results",   value: "View", color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400", href: `/school/${slug}/parent/results` },
        ].map(({ icon: Icon, label, value, color, href }: any) => {
          const card = (
            <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${href ? "hover:border-primary/30 cursor-pointer transition-colors" : ""}`}>
              <div className={`inline-flex p-2 rounded-lg mb-2 ${color}`}><Icon className="w-4 h-4" /></div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate">{value}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">{label}</p>
            </div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      {/* Students table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">My Children</h2>
          <span className="ml-auto text-xs text-slate-400">{students.length} student{students.length !== 1 ? "s" : ""}</span>
        </div>

        {students.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No students linked</p>
            <p className="text-sm text-slate-400 mt-1">Contact the school to link your children</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Adm No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Attendance</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg Mark</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fee Balance</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map(student => {
                    const enrollment = student.enrollments[0] ?? null;
                    const className  = enrollment ? `${enrollment.classYear.classTemplate.name} ${enrollment.stream.name}` : "—";
                    const att        = student.attendance;
                    const attRate    = att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : null;
                    const subjects   = enrollment?.subjectEnrollments ?? [];
                    const withMarks  = subjects.filter(se => se.subjectFinalMark?.totalPercentage != null || se.subjectResult?.totalPercentage != null);
                    const avgMark    = withMarks.length > 0 ? withMarks.reduce((s, se) => s + (se.subjectFinalMark?.totalPercentage ?? se.subjectResult?.totalPercentage ?? 0), 0) / withMarks.length : null;
                    const balance    = student.invoices.reduce((s, i) => s + i.balance, 0);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {student.imageUrl ? (
                              <img src={student.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                            )}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{student.firstName} {student.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{student.admissionNo}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{className}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold text-sm ${attRate != null && attRate >= 90 ? "text-green-600 dark:text-green-400" : attRate != null && attRate >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                            {attRate != null ? `${attRate}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold text-sm ${avgMark != null && avgMark >= 60 ? "text-green-600 dark:text-green-400" : avgMark != null && avgMark >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                            {avgMark != null ? `${avgMark.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold text-sm ${balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                            {balance > 0 ? fmtCurrency(balance) : "Clear"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {students.map(student => {
                const enrollment = student.enrollments[0] ?? null;
                const className  = enrollment ? `${enrollment.classYear.classTemplate.name} ${enrollment.stream.name}` : "—";
                const att        = student.attendance;
                const attRate    = att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : null;
                const balance    = student.invoices.reduce((s, i) => s + i.balance, 0);

                return (
                  <div key={student.id} className="p-4 flex items-center gap-3">
                    {student.imageUrl ? (
                      <img src={student.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-slate-400 font-mono">{student.admissionNo} · {className}</p>
                      <div className="flex gap-3 mt-1">
                        {attRate != null && <span className={`text-xs font-semibold ${attRate >= 90 ? "text-green-600 dark:text-green-400" : attRate >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{attRate}% att.</span>}
                        {balance > 0 && <span className="text-xs font-semibold text-red-600 dark:text-red-400">Bal: {fmtCurrency(balance)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
