"use client";

import { useState, useTransition } from "react";
import { format, isPast }          from "date-fns";
import {
  ClipboardList, Plus, Pencil, Trash2, Users,
  ChevronDown, CheckCircle2, Clock, AlertCircle,
  Eye, EyeOff, X, FileText, Download,
} from "lucide-react";
import type { AssignmentRow, SubmissionRow } from "@/actions/lms-assignments";
import {
  createAssignment, updateAssignment, deleteAssignment,
  getAssignmentSubmissions, gradeSubmission,
} from "@/actions/lms-assignments";

type SubjectStream = { subjectId: string; subjectName: string; streamId: string; streamName: string };

type Props = {
  assignments:    AssignmentRow[];
  subjectStreams: SubjectStream[];
  teacherId:      string;
  schoolId:       string;
  slug:           string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUBMITTED: { label: "Submitted",  color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",   icon: CheckCircle2 },
  GRADED:    { label: "Graded",     color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle2 },
  LATE:      { label: "Late",       color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: AlertCircle  },
  RETURNED:  { label: "Returned",   color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",   icon: Eye          },
};

// ── Blank form ────────────────────────────────────────────────────────────────

const blank = () => ({
  title:       "",
  description: "",
  dueDate:     "",
  subjectId:   "",
  streamId:    "",
  maxScore:    100,
});

export default function AssignmentsClient({ assignments: initial, subjectStreams, teacherId, schoolId, slug }: Props) {
  const [assignments, setAssignments] = useState(initial);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState(blank());
  const [error,       setError]       = useState("");
  const [pending,     startTransition] = useTransition();

  // Submission panel state
  const [viewingId,    setViewingId]    = useState<string | null>(null);
  const [submissions,  setSubmissions]  = useState<SubmissionRow[]>([]);
  const [loadingSubs,  setLoadingSubs]  = useState(false);

  // Grading state
  const [gradingId,    setGradingId]    = useState<string | null>(null);
  const [gradeScore,   setGradeScore]   = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Unique subjects and streams for the form
  const uniqueSubjects = [...new Map(subjectStreams.map(s => [s.subjectId, s])).values()];
  const streamsForSubject = form.subjectId
    ? subjectStreams.filter(s => s.subjectId === form.subjectId)
    : [];

  function openCreate() {
    setForm(blank());
    setEditId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(a: AssignmentRow) {
    setForm({
      title:       a.title,
      description: a.description ?? "",
      dueDate:     a.dueDate.slice(0, 16), // datetime-local format
      subjectId:   a.subjectId,
      streamId:    a.streamId,
      maxScore:    a.maxScore ?? 100,
    });
    setEditId(a.id);
    setError("");
    setShowForm(true);
  }

  async function openSubmissions(a: AssignmentRow) {
    setViewingId(a.id);
    setLoadingSubs(true);
    const result = await getAssignmentSubmissions(a.id, teacherId);
    setSubmissions(result.ok ? result.data : []);
    setLoadingSubs(false);
  }

  function handleSave() {
    if (!form.title.trim() || !form.dueDate || !form.subjectId || !form.streamId) {
      setError("Title, due date, subject, and class are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      if (editId) {
        const res = await updateAssignment(editId, teacherId, {
          title:       form.title,
          description: form.description || undefined,
          dueDate:     form.dueDate,
          maxScore:    form.maxScore,
        });
        if (!res.ok) { setError(res.message); return; }
        setAssignments(prev => prev.map(a =>
          a.id === editId
            ? { ...a, title: form.title, description: form.description || null, dueDate: new Date(form.dueDate).toISOString(), maxScore: form.maxScore }
            : a
        ));
      } else {
        const res = await createAssignment({ ...form, schoolId, teacherId });
        if (!res.ok) { setError(res.message); return; }
        // Refresh: just close and rely on next navigation; or do a local push with dummy data
        window.location.reload();
        return;
      }
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAssignment(id, teacherId);
      if (res.ok) setAssignments(prev => prev.filter(a => a.id !== id));
    });
  }

  async function handleTogglePublish(a: AssignmentRow) {
    startTransition(async () => {
      await updateAssignment(a.id, teacherId, { isPublished: !a.isPublished });
      setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, isPublished: !x.isPublished } : x));
    });
  }

  function handleGrade(sub: SubmissionRow) {
    setGradingId(sub.id);
    setGradeScore(sub.score?.toString() ?? "");
    setGradeFeedback(sub.feedback ?? "");
  }

  async function submitGrade() {
    if (!gradingId) return;
    startTransition(async () => {
      const res = await gradeSubmission(gradingId, teacherId, {
        score:    gradeScore ? parseFloat(gradeScore) : undefined,
        feedback: gradeFeedback || undefined,
      });
      if (res.ok) {
        setSubmissions(prev => prev.map(s =>
          s.id === gradingId
            ? { ...s, status: "GRADED", score: gradeScore ? parseFloat(gradeScore) : s.score, feedback: gradeFeedback || s.feedback }
            : s
        ));
        setGradingId(null);
      }
    });
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create and manage assignments for your classes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">
                {editId ? "Edit Assignment" : "New Assignment"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Chapter 3 Assignment"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Subject *</label>
                  <select
                    value={form.subjectId}
                    onChange={e => setForm(f => ({ ...f, subjectId: e.target.value, streamId: "" }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">Select subject</option>
                    {uniqueSubjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Class *</label>
                  <select
                    value={form.streamId}
                    onChange={e => setForm(f => ({ ...f, streamId: e.target.value }))}
                    disabled={!form.subjectId}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select class</option>
                    {streamsForSubject.map(s => (
                      <option key={s.streamId} value={s.streamId}>{s.streamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Max Score</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxScore}
                    onChange={e => setForm(f => ({ ...f, maxScore: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Instructions</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Optional assignment instructions…"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={pending}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {pending ? "Saving…" : editId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions panel */}
      {viewingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Submissions ({submissions.length})
              </h2>
              <button onClick={() => { setViewingId(null); setGradingId(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSubs ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading submissions…</div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.map(s => {
                  const sc = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SUBMITTED;
                  const Icon = sc.icon;
                  return (
                    <div key={s.id} className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.studentName}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.admissionNo}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${sc.color}`}>
                          <Icon className="w-3 h-3" />{sc.label}
                        </span>
                        {s.score !== null && (
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.score}</span>
                        )}
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          download
                        >
                          <Download className="w-3 h-3" /> {s.fileName}
                        </a>
                        <button
                          onClick={() => gradingId === s.id ? setGradingId(null) : handleGrade(s)}
                          className="px-2 py-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded font-semibold"
                        >
                          {gradingId === s.id ? "Cancel" : "Grade"}
                        </button>
                      </div>

                      {gradingId === s.id && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={gradeScore}
                              onChange={e => setGradeScore(e.target.value)}
                              placeholder="Score"
                              className="w-24 px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                            />
                            <input
                              value={gradeFeedback}
                              onChange={e => setGradeFeedback(e.target.value)}
                              placeholder="Feedback (optional)"
                              className="flex-1 px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={submitGrade}
                              disabled={pending}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded disabled:opacity-60"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      {s.feedback && gradingId !== s.id && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic pl-1">"{s.feedback}"</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5 pl-1">
                        Submitted {format(new Date(s.submittedAt), "d MMM yyyy HH:mm")}
                        {s.gradedAt && ` · Graded ${format(new Date(s.gradedAt), "d MMM yyyy")}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
          <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm mt-1">Click "New Assignment" to create one for your class.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const overdue = isPast(new Date(a.dueDate));
            return (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${overdue ? "bg-red-50 dark:bg-red-900/20" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                    <ClipboardList className={`w-4 h-4 ${overdue ? "text-red-500" : "text-indigo-500"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                      {!a.isPublished && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Draft</span>
                      )}
                      {overdue && (
                        <span className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded font-semibold">Overdue</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-slate-400">
                      <span>{a.subjectName}</span>
                      <span>·</span>
                      <span>{a.streamName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due {format(new Date(a.dueDate), "d MMM yyyy HH:mm")}
                      </span>
                      {a.maxScore && <span>· Max: {a.maxScore} pts</span>}
                    </div>
                    {a.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openSubmissions(a)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
                    >
                      <Users className="w-3 h-3" />
                      {a.submissionCount}
                    </button>
                    <button
                      onClick={() => handleTogglePublish(a)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={a.isPublished ? "Unpublish" : "Publish"}
                    >
                      {a.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
