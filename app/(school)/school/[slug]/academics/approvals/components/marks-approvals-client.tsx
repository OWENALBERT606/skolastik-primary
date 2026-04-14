"use client";

import { useState, useTransition } from "react";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { toast }   from "sonner";
import {
  CheckCircle2, ChevronDown, ChevronRight,
  BookOpen, Layers, Eye, Loader2, ShieldCheck,
} from "lucide-react";
import {
  getStreamSubjectMarksDetail,
  approveStreamSubjectMarks,
} from "@/actions/marks-approval";
import {
  computeStreamSubjectResults,
} from "@/actions/result-computation";

// ── types ─────────────────────────────────────────────────────────────────

type SubjectEntry = {
  streamSubjectId: string;
  subjectName:     string;
  subjectCode:     string | null;
  totalStudents:   number;
  examDraft:       number;
  examSubmitted:   number;
  examApproved:    number;
  hasAnyMarks:     boolean;
  allApproved:     boolean;
};

type StreamEntry = { streamId: string; streamName: string; subjects: SubjectEntry[] };
type ClassEntry  = { classYearId: string; className: string; streams: StreamEntry[] };

type Props = {
  data: { academicYear: string; termName: string; termId: string; classes: ClassEntry[] };
  approverId: string;
  schoolId:   string;
  slug:       string;
};

// ── helpers ───────────────────────────────────────────────────────────────

function subjectStatus(s: SubjectEntry) {
  if (!s.hasAnyMarks)    return "empty";
  if (s.allApproved)     return "approved";
  if (s.examSubmitted > 0) return "pending";
  if (s.examDraft > 0)   return "draft";
  return "empty";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200",
    pending:  "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300  border-blue-200",
    draft:    "bg-slate-100 text-slate-600 dark:bg-slate-800    dark:text-slate-400 border-slate-200",
    empty:    "bg-slate-50  text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 border-slate-200",
  };
  const labels: Record<string, string> = {
    approved: "✓ Approved",
    pending:  "Pending Approval",
    draft:    "Draft",
    empty:    "No marks",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${styles[status] ?? styles.empty}`}>
      {labels[status] ?? "—"}
    </Badge>
  );
}

function markColor(status: string) {
  if (status === "APPROVED")               return "text-green-700 dark:text-green-400";
  if (status === "CLASS_TEACHER_APPROVED") return "text-blue-700 dark:text-blue-400";
  if (status === "SUBMITTED")              return "text-amber-600 dark:text-amber-400";
  return "text-slate-500 dark:text-slate-400";
}

// ── main component ────────────────────────────────────────────────────────

export default function MarksApprovalsClient({ data, approverId, schoolId, slug }: Props) {
  const [expandedClasses,  setExpandedClasses]  = useState<Set<string>>(new Set());
  const [expandedStreams,   setExpandedStreams]  = useState<Set<string>>(new Set());
  const [reviewSubject,    setReviewSubject]    = useState<SubjectEntry | null>(null);
  const [detail,           setDetail]           = useState<any | null>(null);
  const [loadingDetail,    setLoadingDetail]    = useState(false);

  const toggleClass  = (id: string) => setExpandedClasses(s  => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleStream = (id: string) => setExpandedStreams(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openReview = async (sub: SubjectEntry) => {
    setReviewSubject(sub);
    setDetail(null);
    setLoadingDetail(true);
    const r = await getStreamSubjectMarksDetail(sub.streamSubjectId);
    if (r.ok && r.data) setDetail(r.data);
    else toast.error(r.message);
    setLoadingDetail(false);
  };

  const totalSubjects = data.classes.reduce((s, c) =>
    s + c.streams.reduce((ss, st) => ss + st.subjects.length, 0), 0);
  const approvedSubjects = data.classes.reduce((s, c) =>
    s + c.streams.reduce((ss, st) => ss + st.subjects.filter(sub => sub.allApproved).length, 0), 0);
  const pendingSubjects = data.classes.reduce((s, c) =>
    s + c.streams.reduce((ss, st) => ss + st.subjects.filter(sub => sub.examSubmitted > 0 && !sub.allApproved).length, 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marks Approvals</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {data.termName} · {data.academicYear} · Review and approve submitted exam marks
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Subjects",    value: totalSubjects,    color: "text-slate-900 dark:text-white" },
          { label: "Pending Approval",  value: pendingSubjects,  color: "text-blue-600 dark:text-blue-400" },
          { label: "Fully Approved",    value: approvedSubjects, color: "text-green-600 dark:text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Classes */}
      {data.classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No stream subjects found for this term.</p>
        </div>
      ) : data.classes.map(cls => (
        <div key={cls.classYearId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Class header */}
          <button
            onClick={() => toggleClass(cls.classYearId)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5B9BD5]/10 rounded-lg">
                <BookOpen className="w-4 h-4 text-[#5B9BD5]" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">{cls.className}</span>
              <span className="text-xs text-slate-400">{cls.streams.length} streams</span>
            </div>
            {expandedClasses.has(cls.classYearId)
              ? <ChevronDown className="w-4 h-4 text-slate-400" />
              : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedClasses.has(cls.classYearId) && (
            <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {cls.streams.map(stream => (
                <div key={stream.streamId}>
                  {/* Stream header */}
                  <button
                    onClick={() => toggleStream(stream.streamId)}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                        {stream.streamName}
                      </span>
                      <span className="text-xs text-slate-400">{stream.subjects.length} subjects</span>
                    </div>
                    {expandedStreams.has(stream.streamId)
                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {expandedStreams.has(stream.streamId) && (
                    <div className="px-6 pb-4 space-y-2">
                      {stream.subjects.map(sub => {
                        const status = subjectStatus(sub);
                        return (
                          <div key={sub.streamSubjectId}
                            className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#5B9BD5]/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded">
                                <BookOpen className="w-3.5 h-3.5 text-[#5B9BD5]" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">{sub.subjectName}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {sub.totalStudents} students ·{" "}
                                  {sub.examApproved} approved ·{" "}
                                  {sub.examSubmitted} pending ·{" "}
                                  {sub.examDraft} draft
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={status} />
                              <Button
                                size="sm" variant="outline"
                                onClick={() => openReview(sub)}
                                className="text-xs"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Review Dialog */}
      {reviewSubject && (
        <ReviewDialog
          sub={reviewSubject}
          detail={detail}
          loading={loadingDetail}
          approverId={approverId}
          slug={slug}
          onClose={() => { setReviewSubject(null); setDetail(null); }}
        />
      )}
    </div>
  );
}

// ── ReviewDialog ──────────────────────────────────────────────────────────

function ReviewDialog({ sub, detail, loading, approverId, slug, onClose }: {
  sub:        SubjectEntry;
  detail:     any | null;
  loading:    boolean;
  approverId: string;
  slug:       string;
  onClose:    () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const r = await approveStreamSubjectMarks({
        streamSubjectId: sub.streamSubjectId,
        approverId,
        schoolId: "",
        slug,
      });
      if (r.ok) {
        toast.success(r.message);
        // Compute results after approval
        await computeStreamSubjectResults({ streamSubjectId: sub.streamSubjectId, slug });
        onClose();
      } else {
        toast.error(r.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{sub.subjectName}</h2>
            {detail && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {detail.className} · {detail.streamName} · {detail.termName}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#5B9BD5]" />
            </div>
          ) : !detail ? (
            <p className="text-center text-slate-500 py-8">Failed to load marks detail.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">#</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Student</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Adm No</th>
                    {detail.exams.map((e: any) => (
                      <th key={e.id} className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">
                        {e.examType}<span className="block font-normal text-[10px] text-slate-400">/{e.maxMarks}</span>
                      </th>
                    ))}
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detail.students.map((s: any, i: number) => (
                    <tr key={s.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white">{s.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{s.admissionNo}</td>
                      {detail.exams.map((e: any) => {
                        const m = s.examByType[e.examType];
                        return (
                          <td key={e.id} className="px-3 py-2.5 text-right">
                            {m ? (
                              <span className={`font-mono font-semibold ${markColor(m.status)}`}>
                                {m.marksObtained}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        {s.allApproved ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Approved</span>
                        ) : s.hasSubmitted ? (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Pending</span>
                        ) : s.hasDraft ? (
                          <span className="text-xs text-slate-400">Draft</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {sub.examSubmitted > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {sub.examSubmitted} mark(s) ready for approval
              </span>
            )}
            {sub.allApproved && (
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> All marks approved
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {sub.examSubmitted > 0 && !sub.allApproved && (
              <Button
                onClick={handleApprove}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Approving…</>
                  : <><ShieldCheck className="w-4 h-4 mr-2" /> Approve All & Compute</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
