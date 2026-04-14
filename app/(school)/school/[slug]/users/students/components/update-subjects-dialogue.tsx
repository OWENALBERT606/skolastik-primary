"use client";

import { useState, useEffect, useCallback } from "react";
import { toast }      from "sonner";
import { Loader2, BookOpen, RefreshCw, AlertCircle } from "lucide-react";
import { Button }     from "@/components/ui/button";
import { Badge }      from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getALevelSubjectsForStream,
  updateStudentSubjectEnrollments,
} from "@/actions/students";

// ── Types ─────────────────────────────────────────────────────────────────

type ALevelSubject = {
  id:             string;
  name:           string;
  code:           string | null;
  aLevelCategory: "MAJOR" | "SUBSIDIARY" | null;
  subjectLevel:   string;
  isGeneralPaper: boolean;
};

type CurrentEnrollment = {
  streamSubjectId: string;
  subjectId:       string;
  subjectName:     string;
  isGeneralPaper:  boolean;
  hasMarks:        boolean;
};

interface Props {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  enrollmentId: string;
  streamId:     string;
  termId:       string;
  schoolId:     string;
  studentName:  string;
  // Subject enrollments already on this enrollment record
  currentSubjectEnrollments: {
    streamSubject: {
      subjectId:   string;
      subject: {
        id:             string;
        name:           string;
        isGeneralPaper: boolean;
      };
    };
    examMarks: any[];
    aoiScores: any[];
    aoiUnits:  any[];
  }[];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function UpdateSubjectsDialog({
  open,
  onOpenChange,
  enrollmentId,
  streamId,
  termId,
  schoolId,
  studentName,
  currentSubjectEnrollments,
}: Props) {
  const [subjects,          setSubjects]          = useState<ALevelSubject[]>([]);
  const [selectedMajorIds,  setSelectedMajorIds]  = useState<Set<string>>(new Set());
  const [selectedSubIds,    setSelectedSubIds]    = useState<Set<string>>(new Set());
  const [loading,           setLoading]           = useState(false);
  const [saving,            setSaving]            = useState(false);

  // Derive locked subject IDs (have marks — cannot be removed)
  const lockedSubjectIds = new Set<string>(
    currentSubjectEnrollments
      .filter(se =>
        (se.examMarks?.length  ?? 0) > 0 ||
        (se.aoiScores?.length ?? 0) > 0 ||
        (se.aoiUnits?.length  ?? 0) > 0
      )
      .map(se => se.streamSubject.subject.id)
  );

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getALevelSubjectsForStream(streamId, termId);
      if (!res.ok || res.data.length === 0) {
        toast.error("No subjects found for this stream/term.");
        return;
      }
      const allSubjects = res.data as ALevelSubject[];
      setSubjects(allSubjects);

      // Pre-select current ACTIVE enrolled subjects
      const activeSubjectIds = new Set<string>(
        currentSubjectEnrollments.map(se => se.streamSubject.subject.id)
      );

      const newMajorIds = new Set<string>();
      const newSubIds   = new Set<string>();

      for (const s of allSubjects) {
        if (!activeSubjectIds.has(s.id)) continue;
        if (s.aLevelCategory === "MAJOR") newMajorIds.add(s.id);
        else                              newSubIds.add(s.id);
      }

      // Always include GP
      const gp = allSubjects.find(s => s.isGeneralPaper);
      if (gp) newSubIds.add(gp.id);

      setSelectedMajorIds(newMajorIds);
      setSelectedSubIds(newSubIds);
    } finally {
      setLoading(false);
    }
  }, [streamId, termId, currentSubjectEnrollments]);

  useEffect(() => {
    if (open) loadSubjects();
  }, [open, loadSubjects]);

  const handleSave = async () => {
    if (selectedMajorIds.size !== 3) {
      toast.error("Please select exactly 3 principal subjects.");
      return;
    }
    const gpSubject  = subjects.find(s => s.isGeneralPaper);
    const hasGP      = gpSubject ? selectedSubIds.has(gpSubject.id) : false;
    if (gpSubject && !hasGP) {
      toast.error("General Paper is compulsory and must remain selected.");
      return;
    }
    const nonGPCount = [...selectedSubIds].filter(id => {
      const s = subjects.find(x => x.id === id);
      return s && !s.isGeneralPaper;
    }).length;
    if (nonGPCount < 1) {
      toast.error("Please select 1 subsidiary subject (besides General Paper).");
      return;
    }
    if (nonGPCount > 1) {
      toast.error("You can only select 1 subsidiary subject.");
      return;
    }

    const allSelectedIds = [...selectedMajorIds, ...selectedSubIds];
    setSaving(true);
    const res = await updateStudentSubjectEnrollments({
      enrollmentId,
      newSubjectIds: allSelectedIds,
      schoolId,
    });
    setSaving(false);

    if (res.ok) {
      toast.success(res.message);
      onOpenChange(false);
      window.location.reload();
    } else {
      toast.error(res.message);
    }
  };

  const majorSubjects      = subjects.filter(s => s.aLevelCategory === "MAJOR");
  const subsidiarySubjects = subjects.filter(s => s.aLevelCategory === "SUBSIDIARY" || s.isGeneralPaper);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            Update Subject Combination
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-slate-400">
            {studentName} — change principal or subsidiary subjects. Subjects with marks already entered cannot be removed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Locked subjects notice */}
            {lockedSubjectIds.size > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Subjects with marks entered are locked and cannot be removed.
                </p>
              </div>
            )}

            {/* Principal subjects */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-400 mb-2">
                Principal Subjects — select 3 ({selectedMajorIds.size}/3)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {majorSubjects.map(s => {
                  const checked  = selectedMajorIds.has(s.id);
                  const locked   = lockedSubjectIds.has(s.id);
                  const disabled = locked || (!checked && selectedMajorIds.size >= 3);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        locked
                          ? "border-zinc-300 dark:border-slate-600 bg-zinc-100 dark:bg-slate-800/80 text-zinc-500 dark:text-slate-500 cursor-not-allowed"
                          : checked
                          ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 cursor-pointer"
                          : disabled
                          ? "border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-[#1a2236] text-zinc-400 dark:text-slate-600 cursor-not-allowed"
                          : "border-zinc-200 dark:border-slate-700 bg-white dark:bg-[#1a2236] text-zinc-800 dark:text-slate-200 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          if (locked) return;
                          setSelectedMajorIds(prev => {
                            const next = new Set(prev);
                            if (next.has(s.id)) next.delete(s.id);
                            else if (next.size < 3) next.add(s.id);
                            return next;
                          });
                        }}
                        className="accent-purple-600"
                      />
                      <span className="flex-1">{s.name}</span>
                      {locked && <Badge className="text-[10px] bg-zinc-200 dark:bg-slate-700 text-zinc-500 border-0">Locked</Badge>}
                      {s.code && !locked && (
                        <span className="text-xs font-mono text-zinc-400 dark:text-slate-500">{s.code}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Subsidiary subjects */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-400 mb-2">
                Subsidiary Subjects — General Paper (compulsory) + 1 more
              </p>
              <div className="grid grid-cols-2 gap-2">
                {subsidiarySubjects.map(s => {
                  const checked    = selectedSubIds.has(s.id);
                  const isGP       = s.isGeneralPaper;
                  const locked     = lockedSubjectIds.has(s.id);
                  const nonGPCount = [...selectedSubIds].filter(id => {
                    const x = subjects.find(a => a.id === id);
                    return x && !x.isGeneralPaper;
                  }).length;
                  const disabled = locked || isGP || (!checked && nonGPCount >= 1);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        isGP
                          ? "border-teal-400 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 cursor-default"
                          : locked
                          ? "border-zinc-300 dark:border-slate-600 bg-zinc-100 dark:bg-slate-800/80 text-zinc-500 dark:text-slate-500 cursor-not-allowed"
                          : checked
                          ? "border-teal-500 bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 cursor-pointer"
                          : disabled
                          ? "border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-[#1a2236] text-zinc-400 dark:text-slate-600 cursor-not-allowed"
                          : "border-zinc-200 dark:border-slate-700 bg-white dark:bg-[#1a2236] text-zinc-800 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          if (isGP || locked) return;
                          setSelectedSubIds(prev => {
                            const next = new Set(prev);
                            if (next.has(s.id)) next.delete(s.id);
                            else next.add(s.id);
                            return next;
                          });
                        }}
                        className="accent-teal-600"
                      />
                      <span className="flex-1">{s.name}</span>
                      {isGP && (
                        <span className="text-[10px] font-semibold bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded">
                          Compulsory
                        </span>
                      )}
                      {locked && !isGP && (
                        <Badge className="text-[10px] bg-zinc-200 dark:bg-slate-700 text-zinc-500 border-0">Locked</Badge>
                      )}
                      {s.code && !isGP && !locked && (
                        <span className="text-xs font-mono text-zinc-400 dark:text-slate-500">{s.code}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-slate-700/60">
              <Button
                type="button" variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
