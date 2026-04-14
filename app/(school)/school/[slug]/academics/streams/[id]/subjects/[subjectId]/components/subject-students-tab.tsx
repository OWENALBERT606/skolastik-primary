"use client";

import { useState } from "react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, MoreVertical, TrendingUp, Minus, TrendingDown,
  Award, UserX, UserCheck, ExternalLink, Download,
} from "lucide-react";
import Link from "next/link";
import EnrollStudentsDialog from "./enroll-students-dialog";
import { unenrollStudentsFromSubject, updateSubjectEnrollmentStatus } from "@/actions/subject-management";
import { toast } from "sonner";

// ── helpers ───────────────────────────────────────────────────────────────

function getGrade(mark: number) {
  if (mark >= 80) return { grade: "D1", color: "text-emerald-600 dark:text-emerald-400" };
  if (mark >= 75) return { grade: "D2", color: "text-green-600 dark:text-green-400" };
  if (mark >= 70) return { grade: "C3", color: "text-teal-600 dark:text-teal-400" };
  if (mark >= 65) return { grade: "C4", color: "text-blue-600 dark:text-blue-400" };
  if (mark >= 60) return { grade: "C5", color: "text-blue-600 dark:text-blue-400" };
  if (mark >= 55) return { grade: "C6", color: "text-indigo-600 dark:text-indigo-400" };
  if (mark >= 50) return { grade: "P7", color: "text-amber-600 dark:text-amber-400" };
  if (mark >= 45) return { grade: "P8", color: "text-orange-600 dark:text-orange-400" };
  return { grade: "F9", color: "text-red-600 dark:text-red-400" };
}

function TrendIcon({ mark }: { mark: number | null }) {
  if (mark === null) return <Minus className="h-4 w-4 text-slate-300 mx-auto" />;
  if (mark >= 70)    return <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />;
  if (mark >= 50)    return <Minus className="h-4 w-4 text-amber-500 mx-auto" />;
  return <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />;
}

// ── component ─────────────────────────────────────────────────────────────

interface SubjectStudentsTabProps {
  streamSubject: any;
  schoolSlug:    string;
  schoolId:      string;
  marksData:     any | null;
  onRefresh:     () => void;
  isTeacher:     boolean;
}

export default function SubjectStudentsTab({
  streamSubject, schoolSlug, schoolId, marksData, onRefresh,
}: SubjectStudentsTabProps) {
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const cfg = marksData?.assessmentConfig ?? null;

  // Which exams are active in config
  const activeExamTypes: string[] = [
    ...(cfg?.hasBOT ? ["BOT"] : []),
    ...(cfg?.hasMTE ? ["MTE"] : []),
    ...(cfg?.hasEOT ? ["EOT"] : []),
  ];

  // Build summary lookup
  const summaryMap = new Map<string, any>();
  if (marksData?.studentSummaries) {
    for (const s of marksData.studentSummaries) summaryMap.set(s.enrollmentId, s);
  }

  // Sort by total mark desc
  const sorted = [...streamSubject.studentEnrollments].sort((a, b) => {
    const ma = summaryMap.get(a.id)?.totalMark ?? -1;
    const mb = summaryMap.get(b.id)?.totalMark ?? -1;
    return mb - ma;
  });

  const filtered = sorted.filter(e => {
    const s = e.enrollment.student;
    const q = search.toLowerCase();
    const matchSearch = `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUnenroll = async (id: string, name: string) => {
    if (!confirm(`Unenroll ${name} from this subject?`)) return;
    const r = await unenrollStudentsFromSubject({ studentSubjectEnrollmentIds: [id], schoolId });
    if (r.ok) { toast.success(r.message); onRefresh(); } else toast.error(r.message);
  };

  const handleStatus = async (id: string, status: "ACTIVE" | "DROPPED" | "COMPLETED") => {
    setUpdatingStatus(id);
    const r = await updateSubjectEnrollmentStatus({ studentSubjectEnrollmentId: id, status, schoolId });
    if (r.ok) { toast.success(r.message); onRefresh(); } else toast.error(r.message);
    setUpdatingStatus(null);
  };

  const total     = streamSubject.studentEnrollments.length;
  const active    = streamSubject.studentEnrollments.filter((e: any) => e.status === "ACTIVE").length;
  const dropped   = streamSubject.studentEnrollments.filter((e: any) => e.status === "DROPPED").length;
  const completed = streamSubject.studentEnrollments.filter((e: any) => e.status === "COMPLETED").length;

  const th = "text-left px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide";
  const thr = "text-right px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide";
  const thc = "text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide";

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",     value: total,     color: "text-slate-900 dark:text-white" },
          { label: "Active",    value: active,    color: "text-green-600 dark:text-green-400" },
          { label: "Dropped",   value: dropped,   color: "text-red-600 dark:text-red-400" },
          { label: "Completed", value: completed, color: "text-blue-600 dark:text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name or admission number…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DROPPED">Dropped</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <EnrollStudentsDialog
          streamSubjectId={streamSubject.id}
          schoolId={schoolId}
          subjectName={streamSubject.subject.name}
          onSuccess={onRefresh}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Enrolled Students ({filtered.length})
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
            {search || statusFilter !== "all" ? "No students match your filters." : "No students enrolled yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className={th}>Rank</th>
                  <th className={th}>Adm No</th>
                  <th className={th}>Student</th>
                  <th className={th}>Type</th>
                  <th className={th}>Status</th>
                  {/* Per-exam columns */}
                  {activeExamTypes.map(type => (
                    <th key={type} className={thr}>
                      {type}
                      {cfg && (
                        <span className="block text-[10px] font-normal text-slate-400">
                          ({cfg[`${type.toLowerCase()}Weight`]}%)
                        </span>
                      )}
                    </th>
                  ))}
                  <th className={thr}>Total</th>
                  <th className={thc}>Grade</th>
                  <th className={thc}>Trend</th>
                  <th className={thc}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((enrollment, i) => {
                  const student  = enrollment.enrollment.student;
                  const summary  = summaryMap.get(enrollment.id);
                  const total    = summary?.totalMark ?? null;
                  const { grade, color } = total !== null ? getGrade(total) : { grade: "—", color: "text-slate-400" };

                  return (
                    <tr key={enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {i < 3 && total !== null && (
                            <Award className={`h-3.5 w-3.5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-orange-500"}`} />
                          )}
                          <span className="font-medium text-slate-600 dark:text-slate-400">{i + 1}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">{student.admissionNo}</td>
                      <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={enrollment.isCompulsory
                          ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"}>
                          {enrollment.isCompulsory ? "Compulsory" : "Optional"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={
                          enrollment.status === "ACTIVE"    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          enrollment.status === "DROPPED"   ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }>
                          {enrollment.status}
                        </Badge>
                      </td>

                      {/* Per-exam raw marks */}
                      {activeExamTypes.map(type => {
                        const val = summary?.[type.toLowerCase() as "bot" | "mte" | "eot"];
                        return (
                          <td key={type} className="px-3 py-3 text-right tabular-nums">
                            {val !== null && val !== undefined
                              ? <span className="font-medium text-slate-900 dark:text-white">{Number(val).toFixed(1)}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="px-3 py-3 text-right tabular-nums font-bold">
                        {total !== null
                          ? <span className="text-slate-900 dark:text-white">{Number(total).toFixed(1)}%</span>
                          : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>

                      {/* Grade */}
                      <td className="px-3 py-3 text-center">
                        {total !== null
                          ? <span className={`text-xs font-bold ${color}`}>{grade}</span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      {/* Trend */}
                      <td className="px-3 py-3 text-center"><TrendIcon mark={total} /></td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={updatingStatus === enrollment.id}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/school/${schoolSlug}/users/students/${student.id}`} className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" /> View Student
                              </Link>
                            </DropdownMenuItem>
                            {enrollment.status !== "ACTIVE" && (
                              <DropdownMenuItem onClick={() => handleStatus(enrollment.id, "ACTIVE")}>
                                <UserCheck className="h-4 w-4 mr-2" /> Mark Active
                              </DropdownMenuItem>
                            )}
                            {enrollment.status !== "DROPPED" && (
                              <DropdownMenuItem onClick={() => handleStatus(enrollment.id, "DROPPED")}>
                                <UserX className="h-4 w-4 mr-2" /> Mark Dropped
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleUnenroll(enrollment.id, `${student.firstName} ${student.lastName}`)}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" /> Unenroll
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
