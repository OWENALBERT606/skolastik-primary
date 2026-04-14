"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen, Users, CheckCircle2, AlertTriangle, ChevronRight,
  GraduationCap, Layers, Clock, UserX, BarChart3, BookMarked, Search, Hash,
} from "lucide-react";
import { AoiTopicsDialog } from "@/components/aoi-topics-dialog";

type Teacher = { id: string; firstName: string; lastName: string; staffNo: string; role: string };
type Summary = {
  totalStreams: number; totalStreamSubjects: number; unassigned: number;
  totalTeachers: number; marksSubmitted: number; marksApproved: number;
  marksDraft: number; activeYear: string | null; activeTerm: string | null;
};
type Props = {
  teacher: Teacher; summary: Summary; streams: any[]; streamSubjects: any[];
  unassignedSubjects: any[]; teachers: any[]; activeTerm: any;
  slug: string; hasTeachingSubjects: boolean;
};

function SummaryCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function TeacherWorkloadDialog({ open, teacher, slug, onClose, onAoiClick }: {
  open: boolean; teacher: any | null; slug: string; onClose: () => void;
  onAoiClick: (target: AoiTarget) => void;
}) {
  const [search, setSearch] = useState("");
  if (!teacher) return null;

  const assignments: any[] = teacher.streamSubjectAssignments ?? [];
  const filtered = search.trim()
    ? assignments.filter((a: any) => {
        const ss = a.streamSubject;
        const q  = search.toLowerCase();
        return (
          ss.subject.name.toLowerCase().includes(q) ||
          ss.stream.name.toLowerCase().includes(q) ||
          (ss.stream.classYear?.classTemplate?.name ?? "").toLowerCase().includes(q) ||
          (ss.term?.name ?? "").toLowerCase().includes(q)
        );
      })
    : assignments;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setSearch(""); } }}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 shrink-0">
          <DialogTitle className="text-base font-semibold text-white">
            {teacher.firstName} {teacher.lastName}
          </DialogTitle>
          <p className="text-sm text-blue-100 mt-0.5">
            Staff No: {teacher.staffNo} · {assignments.length} subject{assignments.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input placeholder="Search by subject, class or stream…" value={search}
              onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{search ? "No subjects match your search" : "No subjects assigned"}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a: any) => {
                const ss = a.streamSubject;
                const studentCount = ss._count?.studentEnrollments ?? 0;
                return (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                    </div>
                    <Link
                      href={`/school/${slug}/dos/subjects/${ss.id}`}
                      onClick={() => { onClose(); setSearch(""); }}
                      className="flex-1 min-w-0"
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                        {ss.subject.name}
                        {ss.subjectPaper && <span className="ml-1.5 text-xs text-slate-400 font-normal">P{ss.subjectPaper.paperNumber}</span>}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5">
                          <GraduationCap className="h-3 w-3" />
                          {ss.stream.classYear?.classTemplate?.name ?? ""}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5">
                          <Layers className="h-3 w-3" />
                          {ss.stream.name}
                        </span>
                        {ss.term && (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5">
                            <Clock className="h-3 w-3" />
                            {ss.term.name}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{studentCount}</p>
                        <p className="text-xs text-slate-400">students</p>
                      </div>
                      <button
                        onClick={() => { onClose(); setSearch(""); onAoiClick({ streamSubjectId: ss.id, subjectName: ss.subject.name, paperNumber: ss.subjectPaper?.paperNumber, paperName: ss.subjectPaper?.name }); }}
                        title="Manage AOI Topics"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        <Hash className="h-4 w-4" />
                      </button>
                      <Link href={`/school/${slug}/dos/subjects/${ss.id}`} onClick={() => { onClose(); setSearch(""); }}>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex justify-end">
          <Button size="sm" variant="outline" onClick={() => { onClose(); setSearch(""); }}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AoiTarget = { streamSubjectId: string; subjectName: string; paperNumber?: number | null; paperName?: string | null };

export default function DOSDashboardClient({
  teacher, summary, streams, streamSubjects, unassignedSubjects,
  teachers, slug, hasTeachingSubjects,
}: Props) {
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [workloadSearch,  setWorkloadSearch]  = useState("");
  const [aoiTarget,       setAoiTarget]       = useState<AoiTarget | null>(null);

  const filteredTeachers = workloadSearch.trim()
    ? teachers.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(workloadSearch.toLowerCase()) ||
        t.staffNo.toLowerCase().includes(workloadSearch.toLowerCase()) ||
        t.streamSubjectAssignments.some((a: any) =>
          a.streamSubject.subject.name.toLowerCase().includes(workloadSearch.toLowerCase()) ||
          a.streamSubject.stream.name.toLowerCase().includes(workloadSearch.toLowerCase()) ||
          (a.streamSubject.stream.classYear?.classTemplate?.name ?? "").toLowerCase().includes(workloadSearch.toLowerCase())
        )
      )
    : teachers;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl px-6 py-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">Director of Studies — {teacher.firstName} {teacher.lastName}</h1>
            <p className="text-blue-100 text-sm mt-0.5">
              Staff No: {teacher.staffNo}
              {summary.activeYear && ` · ${summary.activeYear}`}
              {summary.activeTerm && ` · ${summary.activeTerm}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 bg-blue-500/40 rounded-xl px-4 py-2">
              <BookMarked className="h-5 w-5 text-blue-100" />
              <span className="text-blue-100 text-sm font-medium">DOS Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Classes",      href: `/school/${slug}/dos/academics/classes`,       icon: Layers },
          { label: "Streams",      href: `/school/${slug}/dos/academics/streams`,       icon: BookOpen },
          { label: "Subjects",     href: `/school/${slug}/dos/academics/subjects`,      icon: BookMarked },
          { label: "Approvals",    href: `/school/${slug}/dos/academics/approvals`,     icon: CheckCircle2 },
          { label: "Report Cards", href: `/school/${slug}/dos/academics/report-cards`,  icon: BarChart3 },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href}
            className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group">
            <Icon className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{label}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={Layers}       label="Total Streams"       value={summary.totalStreams}        color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <SummaryCard icon={BookOpen}     label="Stream Subjects"     value={summary.totalStreamSubjects} color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <SummaryCard icon={UserX}        label="Unassigned Subjects" value={summary.unassigned}          color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <SummaryCard icon={Users}        label="Active Teachers"     value={summary.totalTeachers}       color="bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard icon={Clock}        label="Marks Awaiting Approval" value={summary.marksSubmitted} color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <SummaryCard icon={CheckCircle2} label="Marks Approved"          value={summary.marksApproved}  color="bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400" />
        <SummaryCard icon={BarChart3}    label="Marks in Draft"          value={summary.marksDraft}     color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" />
      </div>

      {/* Unassigned subjects alert */}
      {unassignedSubjects.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
              {unassignedSubjects.length} subject{unassignedSubjects.length > 1 ? "s" : ""} without a teacher
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unassignedSubjects.slice(0, 9).map(ss => (
              <div key={ss.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group">
                <Link href={`/school/${slug}/dos/subjects/${ss.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {ss.subject.name}
                    {ss.subjectPaper && <span className="text-slate-400 ml-1">P{ss.subjectPaper.paperNumber}</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {ss.stream.classYear.classTemplate.name} {ss.stream.name} · {ss.term.name}
                  </p>
                </Link>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => setAoiTarget({ streamSubjectId: ss.id, subjectName: ss.subject.name, paperNumber: ss.subjectPaper?.paperNumber, paperName: ss.subjectPaper?.name })}
                    title="Manage AOI Topics"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </button>
                  <Link href={`/school/${slug}/dos/subjects/${ss.id}`}>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {unassignedSubjects.length > 9 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">+{unassignedSubjects.length - 9} more unassigned subjects</p>
          )}
        </div>
      )}

      {/* Streams overview */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-blue-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">Streams</h2>
          <span className="text-xs text-slate-400">({streams.length})</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {streams.map(stream => {
            const streamSubs = streamSubjects.filter(ss => ss.stream.id === stream.id);
            const assigned   = streamSubs.filter(ss => ss.teacherAssignments.length > 0).length;
            const total      = streamSubs.length;
            const pct        = total > 0 ? Math.round((assigned / total) * 100) : 0;
            return (
              <Link key={stream.id}
                href={`/school/${slug}/dos/academics/streams/${stream.id}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      {stream.classYear.classTemplate.name} {stream.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {stream._count.enrollments} students · {total} subjects
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Teachers assigned</span>
                    <span className={pct === 100 ? "text-green-600 dark:text-green-400 font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                      {assigned}/{total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-amber-400"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Teacher workload */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-blue-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">Teacher Workload</h2>
          <span className="text-xs text-slate-400">({teachers.length} active)</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search teacher, subject, class or stream…" value={workloadSearch}
                onChange={e => setWorkloadSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Staff No</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subjects</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Assigned To</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTeachers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{t.firstName} {t.lastName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs hidden sm:table-cell">{t.staffNo}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={
                      t.streamSubjectAssignments.length === 0
                        ? "border-slate-200 text-slate-400"
                        : t.streamSubjectAssignments.length > 5
                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        : "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    }>
                      {t.streamSubjectAssignments.length}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {t.streamSubjectAssignments.slice(0, 3).map((a: any) => (
                        <span key={a.id} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5">
                          {a.streamSubject.stream.classYear?.classTemplate?.name ?? ""} {a.streamSubject.stream.name} · {a.streamSubject.subject.name}
                        </span>
                      ))}
                      {t.streamSubjectAssignments.length > 3 && (
                        <span className="text-xs text-slate-400">+{t.streamSubjectAssignments.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost"
                      className="text-xs h-7 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      onClick={() => setSelectedTeacher(t)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                    {workloadSearch ? "No teachers match your search" : "No active teachers found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TeacherWorkloadDialog
        open={!!selectedTeacher}
        teacher={selectedTeacher}
        slug={slug}
        onClose={() => setSelectedTeacher(null)}
        onAoiClick={setAoiTarget}
      />

      {aoiTarget && (
        <AoiTopicsDialog
          open={!!aoiTarget}
          onOpenChange={(v) => { if (!v) setAoiTarget(null); }}
          streamSubjectId={aoiTarget.streamSubjectId}
          subjectName={aoiTarget.subjectName}
          paperName={aoiTarget.paperName}
          paperNumber={aoiTarget.paperNumber}
        />
      )}
    </div>
  );
}
