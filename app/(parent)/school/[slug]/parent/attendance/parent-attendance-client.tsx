"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Filter, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, ShieldCheck } from "lucide-react";

const STATUS_ICON: Record<string, React.ElementType> = {
  PRESENT: CheckCircle2, ABSENT: XCircle, LATE: Clock, EXCUSED: ShieldCheck,
};
const STATUS_COLOR: Record<string, string> = {
  PRESENT: "text-green-600 dark:text-green-400",
  ABSENT:  "text-red-600 dark:text-red-400",
  LATE:    "text-amber-600 dark:text-amber-400",
  EXCUSED: "text-blue-600 dark:text-blue-400",
};
const STATUS_BG: Record<string, string> = {
  PRESENT: "bg-green-50 dark:bg-green-900/20",
  ABSENT:  "bg-red-50 dark:bg-red-900/20",
  LATE:    "bg-amber-50 dark:bg-amber-900/20",
  EXCUSED: "bg-blue-50 dark:bg-blue-900/20",
};

export default function ParentAttendanceClient({ slug }: { slug: string }) {
  const [data,          setData]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [studentFilter, setStudentFilter] = useState("");

  useEffect(() => {
    fetch("/api/parent")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data)   return <div className="flex items-center justify-center min-h-[60vh]"><AlertCircle className="w-8 h-8 text-red-500" /></div>;

  const students = data.students as any[];
  const filtered = studentFilter ? students.filter((s: any) => s.id === studentFilter) : students;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-500" /> Attendance Records
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Last 30 days attendance for your children</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Children</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
      </div>

      {filtered.map((student: any) => {
        const att = student.attendance;
        const rate = att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : null;
        return (
          <div key={student.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Student header */}
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {student.imageUrl ? (
                  <img src={student.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-slate-400 font-mono">{student.admissionNo}</p>
                </div>
              </div>
              {rate !== null && (
                <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${rate >= 90 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : rate >= 75 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                  {rate}% attendance rate
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800">
              {[
                { label: "Total",   value: att.total,   color: "text-slate-900 dark:text-white" },
                { label: "Present", value: att.present, color: "text-green-600 dark:text-green-400" },
                { label: "Absent",  value: att.absent,  color: "text-red-600 dark:text-red-400" },
                { label: "Late",    value: att.late,    color: "text-amber-600 dark:text-amber-400" },
              ].map(({ label, value, color }, i) => (
                <div key={label} className={`p-3 text-center ${i < 3 ? "border-r border-slate-100 dark:border-slate-800" : ""}`}>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Records */}
            {att.records.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {att.records.map((r: any, i: number) => {
                  const Icon  = STATUS_ICON[r.status]  ?? CheckCircle2;
                  const color = STATUS_COLOR[r.status] ?? "text-slate-400";
                  const bg    = STATUS_BG[r.status]    ?? "";
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${bg}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                      <span className="text-xs text-slate-500 w-28 shrink-0 tabular-nums">
                        {new Date(r.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className={`text-xs font-semibold ${color}`}>{r.status}</span>
                      {r.notes && <span className="text-xs text-slate-400 truncate ml-auto">{r.notes}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">No attendance records in the last 30 days</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
