"use client";

import { useState, useCallback, useMemo, useTransition, useEffect } from "react";
import { toast }    from "sonner";
import {
  Users, BookOpen, CheckCircle, Clock, AlertCircle, ChevronRight,
  ThumbsUp, ThumbsDown, User, GraduationCap, UserMinus, UserPlus,
  Eye, Loader2, X, Pencil, Check, Plus, Activity, Search,
  FileText, ArrowRight,
} from "lucide-react";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { cn }      from "@/lib/utils";
import {
  classTeacherApproveMarks,
  classTeacherRejectMarks,
  classTeacherUnenrollStudent,
  classTeacherEnrollStudent,
  classTeacherEditMark,
  getStreamSubjectMarksForReview,
  getUnenrolledStudentsForStream,
} from "@/actions/class-teacher";
import {
  getAOITopicsForStreamSubject,
  createAOITopic,
  updateAOITopic,
} from "@/actions/class-settings";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Student = {
  enrollmentId: string;
  id:           string;
  admissionNo:  string | null;
  firstName:    string;
  lastName:     string;
  gender:       string;
  imageUrl:     string | null;
  subjectCount: number;
  status:       string;
};

type SubjectSummary = {
  streamSubjectId: string;
  subjectName:     string;
  subjectCode:     string | null;
  paperName:       string | null;
  paperNumber:     number | null;
  teachers:        string[];
  totalStudents:   number;
  draft:           number;
  submitted:       number;
  ctApproved:      number;
  approved:        number;
  rejected:        number;
  hasMarks:        boolean;
  pendingReview:   boolean;
  allReviewed:     boolean;
};

type DashData = {
  termId:       string;
  termName:     string;
  academicYear: string;
  students:     Student[];
  subjects:     SubjectSummary[];
  summary: {
    totalStudents:  number;
    totalSubjects:  number;
    pendingReviews: number;
    allReviewed:    number;
  };
};

interface Props {
  teacher:  { id: string; firstName: string; lastName: string };
  stream:   { id: string; name: string; className: string; classLevel: string; year: string; classYearId: string };
  data:     DashData;
  slug:     string;
  schoolId: string;
  userId:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-lg", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW DIALOG  (approve / reject + view & edit marks)
// ─────────────────────────────────────────────────────────────────────────────

function ReviewDialog({
  subject, approverId, onClose, onDone, slug,
}: {
  subject:    SubjectSummary;
  approverId: string;
  slug:       string;
  onClose:    () => void;
  onDone:     () => void;
}) {
  const [mode,         setMode]         = useState<"approve" | "reject" | null>(null);
  const [comment,      setComment]      = useState("");
  const [reason,       setReason]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [detail,       setDetail]       = useState<any>(null);
  const [loadingDetail,setLoadingDetail]= useState(false);
  const [showMarks,    setShowMarks]    = useState(false);
  // Inline edit state: { markType, markId, value }
  const [editState,    setEditState]    = useState<{ markType: "examMark" | "aoiScore"; markId: string; value: string } | null>(null);
  const [saving,       setSaving]       = useState(false);

  const loadDetail = useCallback(async () => {
    if (detail) { setShowMarks(true); return; }
    setLoadingDetail(true);
    const res = await getStreamSubjectMarksForReview(subject.streamSubjectId);
    setLoadingDetail(false);
    if (res.ok) { setDetail(res.data); setShowMarks(true); }
    else toast.error("Failed to load marks detail");
  }, [subject.streamSubjectId, detail]);

  const handleApprove = async () => {
    if (!comment.trim()) { toast.error("Please add a comment before approving."); return; }
    setLoading(true);
    const res = await classTeacherApproveMarks(subject.streamSubjectId, approverId, comment.trim());
    setLoading(false);
    if (res.ok) { toast.success(res.message); onDone(); onClose(); }
    else toast.error(res.message);
  };

  const handleReject = async () => {
    if (!reason.trim()) { toast.error("Please provide a rejection reason."); return; }
    setLoading(true);
    const res = await classTeacherRejectMarks(subject.streamSubjectId, reason.trim());
    setLoading(false);
    if (res.ok) { toast.success(res.message); onDone(); onClose(); }
    else toast.error(res.message);
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    const val = parseFloat(editState.value);
    if (isNaN(val)) { toast.error("Please enter a valid number."); return; }
    setSaving(true);
    const res = await classTeacherEditMark({ markType: editState.markType, markId: editState.markId, newValue: val });
    setSaving(false);
    if (res.ok) {
      toast.success("Mark updated.");
      // refresh marks detail
      setDetail(null);
      setShowMarks(false);
      setEditState(null);
      loadDetail();
    } else {
      toast.error(res.message);
    }
  };

  const label = subject.paperNumber != null
    ? `${subject.subjectName} — P${subject.paperNumber}`
    : subject.subjectName;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-slate-900 dark:text-white text-base font-semibold leading-tight">
                  Review Marks — {label}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {subject.teachers.join(", ") || "No teacher assigned"} · {subject.totalStudents} student{subject.totalStudents !== 1 ? "s" : ""}
                </DialogDescription>
              </div>
            </div>
            <Link
              href={`/school/${slug}/teacher/subjects/${subject.streamSubjectId}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
            >
              <ArrowRight className="w-3 h-3" /> Full View
            </Link>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Submitted",    value: subject.submitted,  color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
              { label: "CT Approved",  value: subject.ctApproved, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400" },
              { label: "DOS Approved", value: subject.approved,   color: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-lg px-3 py-2.5 text-center", s.color)}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* View/edit marks toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={loadDetail}
            disabled={loadingDetail}
          >
            {loadingDetail
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading marks…</>
              : showMarks
              ? <><Eye className="w-3.5 h-3.5" /> Hide Marks</>
              : <><Eye className="w-3.5 h-3.5" /> View & Edit Student Marks</>
            }
          </Button>

          {/* Marks detail */}
          {showMarks && detail && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  Student Marks
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {detail.studentEnrollments?.length === 0 && (
                  <p className="px-4 py-6 text-xs text-center text-slate-400">No enrolled students.</p>
                )}
                {detail.studentEnrollments?.map((se: any) => {
                  const s = se.enrollment?.student;
                  return (
                    <div key={se.id} className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {s?.firstName} {s?.lastName}
                        <span className="ml-2 font-normal text-slate-400">{s?.admissionNo}</span>
                      </p>

                      {/* Exam marks */}
                      {se.examMarks?.map((em: any) => {
                        const isEditing = editState?.markId === em.id && editState?.markType === "examMark";
                        const locked    = em.status === "APPROVED";
                        return (
                          <div key={em.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                {em.exam?.examType ?? em.exam?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editState.value}
                                    onChange={e => setEditState(p => p ? { ...p, value: e.target.value } : p)}
                                    className="w-16 px-2 py-0.5 text-xs border border-blue-400 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none"
                                    autoFocus
                                  />
                                  <span className="text-xs text-slate-400">/ {em.outOf}</span>
                                  <button onClick={handleSaveEdit} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  <button onClick={() => setEditState(null)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                    {em.marksObtained}/{em.outOf}
                                  </span>
                                  <Badge className={cn("border-0 text-[10px] px-1.5 py-0",
                                    em.status === "APPROVED"              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    em.status === "CLASS_TEACHER_APPROVED"? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                    em.status === "SUBMITTED"             ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-slate-100 text-slate-600"
                                  )}>
                                    {em.status === "CLASS_TEACHER_APPROVED" ? "CT ✓" : em.status}
                                  </Badge>
                                  {!locked && (
                                    <button
                                      onClick={() => setEditState({ markType: "examMark", markId: em.id, value: String(em.marksObtained) })}
                                      className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                      title="Edit mark"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* AOI scores */}
                      {se.aoiScores?.map((sc: any) => {
                        const isEditing = editState?.markId === sc.id && editState?.markType === "aoiScore";
                        const locked    = sc.status === "APPROVED";
                        return (
                          <div key={sc.id} className="flex items-center justify-between rounded-lg bg-blue-50/50 dark:bg-blue-900/10 px-3 py-2 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                AOI {sc.aoiTopic?.topicNumber}: {sc.aoiTopic?.topicName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editState.value}
                                    onChange={e => setEditState(p => p ? { ...p, value: e.target.value } : p)}
                                    className="w-14 px-2 py-0.5 text-xs border border-blue-400 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none"
                                    autoFocus
                                  />
                                  <span className="text-xs text-slate-400">/ {sc.aoiTopic?.maxPoints ?? 3}</span>
                                  <button onClick={handleSaveEdit} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  <button onClick={() => setEditState(null)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                    {sc.score}/{sc.aoiTopic?.maxPoints ?? 3}
                                  </span>
                                  <Badge className={cn("border-0 text-[10px] px-1.5 py-0",
                                    sc.status === "APPROVED"               ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    sc.status === "CLASS_TEACHER_APPROVED" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                    sc.status === "SUBMITTED"              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-slate-100 text-slate-600"
                                  )}>
                                    {sc.status === "CLASS_TEACHER_APPROVED" ? "CT ✓" : sc.status}
                                  </Badge>
                                  {!locked && (
                                    <button
                                      onClick={() => setEditState({ markType: "aoiScore", markId: sc.id, value: String(sc.score) })}
                                      className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                      title="Edit score"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Approve / Reject actions */}
          {subject.submitted > 0 && !mode && (
            <div className="flex gap-2">
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setMode("approve")}>
                <ThumbsUp className="w-4 h-4" /> Approve All
              </Button>
              <Button variant="outline" className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400" onClick={() => setMode("reject")}>
                <ThumbsDown className="w-4 h-4" /> Reject All
              </Button>
            </div>
          )}

          {mode === "approve" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Comment <span className="text-red-500">*</span>
                <span className="font-normal text-slate-400 ml-1">(visible to DOS)</span>
              </label>
              <textarea
                autoFocus rows={3} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="e.g. Marks reviewed and found accurate. Approved for DOS review."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none"
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" disabled={loading || !comment.trim()} onClick={handleApprove}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm Approval
                </Button>
                <Button variant="outline" onClick={() => setMode(null)}><X className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {mode === "reject" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                autoFocus rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Found discrepancies in marks — please revise and resubmit."
                className="w-full px-3 py-2 text-sm border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2" disabled={loading || !reason.trim()} onClick={handleReject}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                  Confirm Rejection
                </Button>
                <Button variant="outline" onClick={() => setMode(null)}><X className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {subject.submitted === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
              No submitted marks pending review for this subject.
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENROLL STUDENT DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function EnrollStudentDialog({
  streamId, classYearId, termId, schoolId, onClose, onDone,
}: {
  streamId:    string;
  classYearId: string;
  termId:      string;
  schoolId:    string;
  onClose:     () => void;
  onDone:      (student: { id: string; firstName: string; lastName: string; admissionNo: string | null; gender: string }) => void;
}) {
  const [students,  setStudents]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    getUnenrolledStudentsForStream(streamId, termId, schoolId).then(res => {
      setLoading(false);
      if (res.ok) setStudents(res.data);
      else toast.error(res.message ?? "Failed to load students");
    });
  }, [streamId, termId, schoolId]);

  const filtered = query.trim()
    ? students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
        (s.admissionNo ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : students;

  const handleEnroll = async (student: any) => {
    setEnrolling(student.id);
    const res = await classTeacherEnrollStudent({ studentId: student.id, streamId, classYearId, termId, schoolId });
    setEnrolling(null);
    if (res.ok) {
      toast.success(res.message);
      setStudents(prev => prev.filter(s => s.id !== student.id));
      onDone(student);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 dark:text-white text-base font-semibold">Enroll Student</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Students not yet enrolled this term
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or admission no…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          {/* List */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                {query ? "No students match your search." : "All school students are already enrolled this term."}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-slate-400">{s.admissionNo ?? "—"} · {s.gender}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={enrolling === s.id}
                      onClick={() => handleEnroll(s)}
                    >
                      {enrolling === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enroll"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-800/50">
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITIES TAB  (AOI topic management)
// ─────────────────────────────────────────────────────────────────────────────

function ActivitiesTab({ subjects, slug }: { subjects: SubjectSummary[]; slug: string }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.streamSubjectId ?? "");
  const [topicsData,        setTopicsData]         = useState<any>(null);
  const [loadingTopics,     setLoadingTopics]       = useState(false);
  // Add topic form
  const [showAdd,   setShowAdd]   = useState(false);
  const [topicName, setTopicName] = useState("");
  const [maxPoints, setMaxPoints] = useState("3");
  const [desc,      setDesc]      = useState("");
  const [saving,    setSaving]    = useState(false);
  // Edit topic
  const [editTopicId,   setEditTopicId]   = useState<string | null>(null);
  const [editTopicName, setEditTopicName] = useState("");
  const [editMaxPts,    setEditMaxPts]    = useState("");
  const [editSaving,    setEditSaving]    = useState(false);
  const [isPending,     startTransition]  = useTransition();

  // Load topics when subject changes
  useEffect(() => {
    if (!selectedSubjectId) return;
    setTopicsData(null);
    setShowAdd(false);
    setEditTopicId(null);
    setLoadingTopics(true);
    getAOITopicsForStreamSubject(selectedSubjectId).then(res => {
      setLoadingTopics(false);
      if (res.ok) setTopicsData(res.data);
      else toast.error("Failed to load AOI topics");
    });
  }, [selectedSubjectId]);

  const handleAddTopic = () => {
    if (!topicName.trim()) { toast.error("Topic name is required."); return; }
    const max = parseFloat(maxPoints);
    if (isNaN(max) || max <= 0) { toast.error("Max points must be a positive number."); return; }
    if (!topicsData?.classSubjectId) { toast.error("Subject configuration not found."); return; }
    const nextNumber = (topicsData.topics?.length ?? 0) + 1;
    setSaving(true);
    startTransition(async () => {
      const res = await createAOITopic({
        classSubjectId: topicsData.classSubjectId,
        topicNumber:    nextNumber,
        topicName:      topicName.trim(),
        maxPoints:      max,
        description:    desc.trim() || undefined,
        subjectPaperId: topicsData.paper?.id ?? null,
      });
      setSaving(false);
      if (res.ok) {
        toast.success(res.message);
        setTopicsData((p: any) => p ? { ...p, topics: [...(p.topics ?? []), res.data] } : p);
        setTopicName(""); setMaxPoints("3"); setDesc(""); setShowAdd(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleEditSave = (topicId: string) => {
    if (!editTopicName.trim()) { toast.error("Topic name is required."); return; }
    const max = parseFloat(editMaxPts);
    if (isNaN(max) || max <= 0) { toast.error("Max points must be a positive number."); return; }
    setEditSaving(true);
    startTransition(async () => {
      const res = await updateAOITopic(topicId, { topicName: editTopicName.trim(), maxPoints: max });
      setEditSaving(false);
      if (res.ok) {
        toast.success("Topic updated.");
        setTopicsData((p: any) => p ? {
          ...p,
          topics: p.topics.map((t: any) => t.id === topicId ? { ...t, topicName: editTopicName.trim(), maxPoints: max } : t),
        } : p);
        setEditTopicId(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  const selectedSubject = subjects.find(s => s.streamSubjectId === selectedSubjectId);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
        Manage Areas of Integration (AOI) topics for each subject. Topics define what continuous assessment activities are tracked.
      </p>

      {/* Subject selector */}
      <div className="flex flex-wrap gap-2">
        {subjects.map(s => {
          const label = s.paperNumber != null ? `${s.subjectName} P${s.paperNumber}` : s.subjectName;
          return (
            <button
              key={s.streamSubjectId}
              onClick={() => setSelectedSubjectId(s.streamSubjectId)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                selectedSubjectId === s.streamSubjectId
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {selectedSubjectId && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {/* Subject header */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedSubject?.paperNumber != null
                  ? `${selectedSubject?.subjectName} — Paper ${selectedSubject?.paperNumber}`
                  : selectedSubject?.subjectName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {topicsData ? `${topicsData.topics?.length ?? 0} topic(s)` : "Loading…"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/school/${slug}/teacher/subjects/${selectedSubjectId}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <ArrowRight className="w-3 h-3" /> Open Subject
              </Link>
              {topicsData && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setShowAdd(p => !p)}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Topic
                </Button>
              )}
            </div>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="px-5 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">New AOI Topic</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Topic name (e.g. Research Skills)"
                    value={topicName}
                    onChange={e => setTopicName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max pts (e.g. 3)"
                    value={maxPoints}
                    onChange={e => setMaxPoints(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                  disabled={saving || isPending || !topicName.trim()}
                  onClick={handleAddTopic}
                >
                  {saving || isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Topic
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Topics list */}
          {loadingTopics ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading topics…</span>
            </div>
          ) : !topicsData ? null : topicsData.topics?.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No AOI topics yet for this subject.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Topic" to create the first one.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {topicsData.topics.map((t: any, i: number) => {
                const isEditing = editTopicId === t.id;
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 group hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {t.topicNumber}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            value={editTopicName}
                            onChange={e => setEditTopicName(e.target.value)}
                            className="px-2 py-1 text-sm border border-indigo-400 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none w-48"
                            autoFocus
                          />
                          <input
                            type="number"
                            value={editMaxPts}
                            onChange={e => setEditMaxPts(e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none w-16"
                            placeholder="pts"
                          />
                          <button onClick={() => handleEditSave(t.id)} disabled={editSaving} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                            {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setEditTopicId(null)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.topicName}</p>
                          {t.description && <p className="text-xs text-slate-400 truncate">{t.description}</p>}
                        </div>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.maxPoints}</p>
                          <p className="text-[10px] text-slate-400">max pts</p>
                        </div>
                        <Badge className="border-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                          {t._count?.aoiScores ?? 0} scores
                        </Badge>
                        <button
                          onClick={() => { setEditTopicId(t.id); setEditTopicName(t.topicName); setEditMaxPts(String(t.maxPoints)); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-all"
                          title="Edit topic"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ClassTeacherDashboardClient({
  teacher, stream, data, slug, schoolId, userId,
}: Props) {
  const [tab,           setTab]           = useState<"overview" | "students" | "marks" | "activities">("overview");
  const [reviewSubject, setReviewSubject] = useState<SubjectSummary | null>(null);
  const [unenrolling,   setUnenrolling]   = useState<string | null>(null);
  const [showEnroll,    setShowEnroll]    = useState(false);
  const [localStudents, setLocalStudents] = useState<Student[]>(data.students);
  const [localSubjects, setLocalSubjects] = useState<SubjectSummary[]>(data.subjects);
  const [localSummary,  setLocalSummary]  = useState(data.summary);

  const handleUnenroll = useCallback(async (enrollmentId: string, name: string) => {
    if (!confirm(`Unenroll ${name} from this class?`)) return;
    setUnenrolling(enrollmentId);
    const res = await classTeacherUnenrollStudent(enrollmentId);
    setUnenrolling(null);
    if (res.ok) {
      toast.success(res.message);
      setLocalStudents(prev => prev.filter(s => s.enrollmentId !== enrollmentId));
      setLocalSummary(prev => ({ ...prev, totalStudents: prev.totalStudents - 1 }));
    } else {
      toast.error(res.message);
    }
  }, []);

  const handleEnrolled = useCallback((student: any) => {
    const newStudent: Student = {
      enrollmentId: "__new__",
      id:           student.id,
      admissionNo:  student.admissionNo,
      firstName:    student.firstName,
      lastName:     student.lastName,
      gender:       student.gender,
      imageUrl:     null,
      subjectCount: 0,
      status:       "ACTIVE",
    };
    setLocalStudents(prev => [...prev, newStudent].sort((a, b) =>
      `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    ));
    setLocalSummary(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
  }, []);

  const handleReviewDone = useCallback(() => {
    setLocalSummary(prev => ({
      ...prev,
      pendingReviews: Math.max(0, prev.pendingReviews - 1),
      allReviewed:    prev.allReviewed + 1,
    }));
  }, []);

  const tabs = useMemo(() => [
    { id: "overview",    label: "Overview",      icon: GraduationCap },
    { id: "students",    label: "Students",      icon: Users },
    { id: "marks",       label: "Marks Review",  icon: BookOpen },
    { id: "activities",  label: "Activities",    icon: Activity },
  ] as const, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">{stream.classLevel.replace("_", "-")}</Badge>
              <Badge variant="outline"   className="text-xs">{data.academicYear} · {data.termName}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {stream.className} — {stream.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Class Teacher: {teacher.firstName} {teacher.lastName}
            </p>
          </div>
          {localSummary.pendingReviews > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                {localSummary.pendingReviews} subject{localSummary.pendingReviews !== 1 ? "s" : ""} pending review
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === "marks" && localSummary.pendingReviews > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {localSummary.pendingReviews}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}       label="Total Students"  value={localSummary.totalStudents}  color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
            <StatCard icon={BookOpen}    label="Subjects"         value={localSummary.totalSubjects}  color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
            <StatCard icon={Clock}       label="Pending Review"   value={localSummary.pendingReviews} sub="Awaiting approval"  color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
            <StatCard icon={CheckCircle} label="Reviewed"         value={localSummary.allReviewed}    sub="Forwarded to DOS"  color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Marks Status by Subject</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {localSubjects.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No subjects in this stream</p>
              ) : (
                localSubjects.map(s => {
                  const label = s.paperNumber != null ? `${s.subjectName} — P${s.paperNumber}` : s.subjectName;
                  return (
                    <div key={s.streamSubjectId} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{label}</p>
                          <p className="text-xs text-slate-400 truncate">{s.teachers.join(", ") || "No teacher"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.submitted > 0 && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs">{s.submitted} pending</Badge>}
                        {s.ctApproved > 0 && <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 text-xs">{s.ctApproved} reviewed</Badge>}
                        {!s.hasMarks && <span className="text-xs text-slate-400">No marks yet</span>}
                        {s.submitted > 0 && (
                          <button onClick={() => { setReviewSubject(s); setTab("marks"); }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                            Review <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Students ── */}
      {tab === "students" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Students ({localStudents.length})
            </h2>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowEnroll(true)}
            >
              <UserPlus className="w-3.5 h-3.5" /> Enroll Student
            </Button>
          </div>
          {localStudents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No students enrolled in this class.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {localStudents.map((s, idx) => (
                <div key={s.enrollmentId} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 group">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-slate-400">
                          {s.admissionNo ?? "—"} · {s.subjectCount} subject{s.subjectCount !== 1 ? "s" : ""}{s.gender ? ` · ${s.gender}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnenroll(s.enrollmentId, `${s.firstName} ${s.lastName}`)}
                    disabled={unenrolling === s.enrollmentId}
                    title="Unenroll from class"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-40"
                  >
                    {unenrolling === s.enrollmentId
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <UserMinus className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Marks Review ── */}
      {tab === "marks" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
            View, edit, and approve marks submitted by subject teachers before they reach the DOS.
          </p>
          {localSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
              <p className="text-sm text-slate-400">No subjects assigned to this stream.</p>
            </div>
          ) : (
            localSubjects.map(s => {
              const label      = s.paperNumber != null ? `${s.subjectName} — P${s.paperNumber}` : s.subjectName;
              const isSelected = reviewSubject?.streamSubjectId === s.streamSubjectId;
              return (
                <div key={s.streamSubjectId} className={cn(
                  "bg-white dark:bg-slate-800 rounded-xl border transition-colors",
                  isSelected         ? "border-indigo-400 dark:border-indigo-600"
                  : s.pendingReview  ? "border-amber-300 dark:border-amber-700"
                  : "border-slate-200 dark:border-slate-700"
                )}>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-2 rounded-lg shrink-0",
                        s.pendingReview ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : s.allReviewed  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                      )}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{label}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {s.teachers.join(", ") || "No teacher assigned"} · {s.totalStudents} student{s.totalStudents !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.rejected   > 0 && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">{s.rejected} rejected</Badge>}
                      {s.submitted  > 0 && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs">{s.submitted} to review</Badge>}
                      {s.ctApproved > 0 && <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 text-xs">{s.ctApproved} approved</Badge>}
                      {s.approved   > 0 && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">{s.approved} DOS ✓</Badge>}
                      {!s.hasMarks && <span className="text-xs text-slate-400 italic">No marks yet</span>}
                      <Button
                        size="sm"
                        variant={s.submitted > 0 ? "default" : "outline"}
                        className={cn("gap-1.5 h-8 text-xs", s.submitted > 0 ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "")}
                        onClick={() => setReviewSubject(s)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {s.submitted > 0 ? "Review" : "View"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Activities ── */}
      {tab === "activities" && (
        <ActivitiesTab subjects={localSubjects} slug={slug} />
      )}

      {/* Enroll dialog */}
      {showEnroll && (
        <EnrollStudentDialog
          streamId={stream.id}
          classYearId={stream.classYearId}
          termId={data.termId}
          schoolId={schoolId}
          onClose={() => setShowEnroll(false)}
          onDone={(s) => { handleEnrolled(s); setShowEnroll(false); }}
        />
      )}

      {/* Review dialog */}
      {reviewSubject && (
        <ReviewDialog
          subject={reviewSubject}
          approverId={userId}
          slug={slug}
          onClose={() => setReviewSubject(null)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  );
}
