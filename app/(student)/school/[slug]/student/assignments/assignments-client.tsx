"use client";

import { useState, useTransition, useRef } from "react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import {
  ClipboardList, Upload, CheckCircle2, Clock, AlertCircle,
  X, FileText, Download, Loader2, ChevronDown,
} from "lucide-react";
import type { AssignmentRow } from "@/actions/lms-assignments";
import { submitAssignment } from "@/actions/lms-assignments";

type Term         = { id: string; name: string; termNumber: number; isActive: boolean };
type AcademicYear = { id: string; year: string; isActive: boolean; terms: Term[] };

type MySubmission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subjectName: string;
  dueDate: string;
  maxScore: number | null;
  termId: string | null;
  termName: string | null;
  fileUrl: string;
  fileName: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

type Props = {
  assignments:   AssignmentRow[];
  submissions:   MySubmission[];
  academicYears: AcademicYear[];
  studentId:     string;
  schoolId:      string;
  slug:          string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUBMITTED: { label: "Submitted", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",    icon: CheckCircle2 },
  GRADED:    { label: "Graded",    color: "text-green-600 bg-green-50 dark:bg-green-900/20",  icon: CheckCircle2 },
  LATE:      { label: "Late",      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",  icon: AlertCircle  },
  RETURNED:  { label: "Returned",  color: "text-slate-600 bg-slate-100 dark:bg-slate-800",    icon: Clock        },
};

async function uploadToR2(file: File): Promise<{ fileUrl: string; fileKey: string } | null> {
  try {
    const res = await fetch(`/api/r2/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`);
    if (!res.ok) return null;
    const { uploadUrl, publicUrl, key } = await res.json();
    const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!put.ok) return null;
    return { fileUrl: publicUrl, fileKey: key };
  } catch { return null; }
}

export default function StudentAssignmentsClient({
  assignments, submissions: initialSubs, academicYears, studentId, schoolId,
}: Props) {
  // Default to active year + active term
  const activeYear  = academicYears.find(y => y.isActive) ?? academicYears[0];
  const activeTerm  = activeYear?.terms.find(t => t.isActive) ?? activeYear?.terms[0];

  const [selectedYearId, setSelectedYearId] = useState(activeYear?.id ?? "");
  const [selectedTermId, setSelectedTermId] = useState(activeTerm?.id ?? "ALL");
  const [tab,  setTab]  = useState<"pending" | "submitted">("pending");
  const [subs, setSubs] = useState(initialSubs);

  // Submit modal state
  const [submittingId, setSubmittingId]   = useState<string | null>(null);
  const [file,         setFile]           = useState<File | null>(null);
  const [error,        setError]          = useState("");
  const [uploading,    setUploading]      = useState(false);
  const [pending,      startTransition]   = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const currentYear = academicYears.find(y => y.id === selectedYearId);

  // Filter assignments/submissions by selected year+term
  const submittedIds = new Set(subs.map(s => s.assignmentId));

  function matchesTerm(termId: string | null) {
    if (selectedTermId === "ALL") return true;
    // If assignment has no termId, show in all terms of selected year
    if (!termId) return true;
    return termId === selectedTermId;
  }

  // Determine if an assignment belongs to the selected year (via termId or dueDate fallback)
  function matchesYear(a: AssignmentRow) {
    if (!currentYear) return false;
    if (a.termId) return currentYear.terms.some(t => t.id === a.termId);
    // Fallback: check dueDate against year string
    return a.dueDate.startsWith(currentYear.year);
  }

  const yearAssignments = assignments.filter(a => matchesYear(a) && matchesTerm(a.termId));
  const pendingItems    = yearAssignments.filter(a => !submittedIds.has(a.id));

  const yearSubs = subs.filter(s => {
    if (!currentYear) return false;
    if (s.termId) return currentYear.terms.some(t => t.id === s.termId) && matchesTerm(s.termId);
    return matchesTerm(s.termId);
  });

  function openSubmit(id: string) {
    setSubmittingId(id); setFile(null); setError("");
  }

  async function handleSubmit() {
    if (!submittingId || !file) { setError("Please select a file."); return; }
    setError(""); setUploading(true);
    const uploaded = await uploadToR2(file);
    setUploading(false);
    if (!uploaded) { setError("Upload failed — please try again."); return; }
    startTransition(async () => {
      const res = await submitAssignment({
        assignmentId: submittingId, studentId, schoolId,
        fileUrl: uploaded.fileUrl, fileKey: uploaded.fileKey,
        fileName: file.name, fileSize: file.size,
      });
      if (!res.ok) { setError((res as any).message ?? "Submission failed."); return; }
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-500" /> Assignments
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Submit assignments and track your grades</p>
      </div>

      {/* Year selector */}
      {academicYears.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Year:</span>
          {academicYears.map(y => (
            <button
              key={y.id}
              onClick={() => {
                setSelectedYearId(y.id);
                const firstTerm = y.terms.find(t => t.isActive) ?? y.terms[0];
                setSelectedTermId(firstTerm?.id ?? "ALL");
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedYearId === y.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {y.year}{y.isActive ? " (Current)" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Term tabs */}
      {currentYear && currentYear.terms.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelectedTermId("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedTermId === "ALL"
                ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Terms
          </button>
          {currentYear.terms.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTermId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedTermId === t.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t.name}{t.isActive ? " ●" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Pending / Submitted tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {(["pending", "submitted"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            {t === "pending" ? `Pending (${pendingItems.length})` : `Submitted (${yearSubs.length})`}
          </button>
        ))}
      </div>

      {/* Submit modal */}
      {submittingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Submit Assignment</h2>
              <button onClick={() => setSubmittingId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</div>}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            >
              {file ? (
                <div className="flex items-center gap-2 justify-center text-sm text-slate-700 dark:text-slate-300">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium truncate max-w-xs">{file.name}</span>
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Click to select your file</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSubmittingId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!file || uploading || pending}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
              >
                {(uploading || pending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "Uploading…" : pending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending list */}
      {tab === "pending" && (
        pendingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
            <CheckCircle2 className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No pending assignments</p>
            <p className="text-sm mt-1">All caught up for this period.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.map(a => {
              const overdue = isPast(new Date(a.dueDate));
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${overdue ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                      <ClipboardList className={`w-4 h-4 ${overdue ? "text-red-500" : "text-amber-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-400">
                        <span>{a.subjectName}</span>
                        {a.termName && <><span>·</span><span>{a.termName}</span></>}
                        <span>·</span>
                        <span className={`flex items-center gap-1 font-medium ${overdue ? "text-red-500" : "text-slate-500"}`}>
                          <Clock className="w-3 h-3" />
                          {overdue ? `Overdue by ${formatDistanceToNow(new Date(a.dueDate))}` : `Due in ${formatDistanceToNow(new Date(a.dueDate))}`}
                        </span>
                        <span>({format(new Date(a.dueDate), "d MMM yyyy HH:mm")})</span>
                        {a.maxScore && <span>· {a.maxScore} pts</span>}
                      </div>
                      {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>}
                    </div>
                    <button
                      onClick={() => openSubmit(a.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                    >
                      <Upload className="w-3 h-3" /> Submit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Submitted list */}
      {tab === "submitted" && (
        yearSubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No submissions for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {yearSubs.map(s => {
              const sc   = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SUBMITTED;
              const Icon = sc.icon;
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg shrink-0 bg-green-50 dark:bg-green-900/20">
                      <Icon className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.assignmentTitle}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${sc.color}`}>
                          <Icon className="w-3 h-3" />{sc.label}
                        </span>
                        {s.score !== null && s.maxScore !== null && (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">{s.score}/{s.maxScore} pts</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>{s.subjectName}</span>
                        {s.termName && <><span>·</span><span>{s.termName}</span></>}
                        <span>· Submitted {format(new Date(s.submittedAt), "d MMM yyyy")}</span>
                        {s.gradedAt && <span>· Graded {format(new Date(s.gradedAt), "d MMM")}</span>}
                      </div>
                      {s.feedback && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{s.feedback}"</p>}
                    </div>
                    <a href={s.fileUrl} target="_blank" rel="noreferrer" download
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                    >
                      <Download className="w-3 h-3" /><span className="hidden sm:inline">{s.fileName}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
