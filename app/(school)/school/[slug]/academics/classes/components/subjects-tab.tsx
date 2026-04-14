// components/dashboard/classes/detail-tabs/subjects-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Book,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAvailableSubjects,
  removeSubjectFromClassYear,
} from "@/actions/class-subject";
import {
  assignSubjectWithPapersToClasses,
  type ClassPaperSelection,
  type PaperAssignment,
} from "@/actions/class-subject-assignment";
import { SubjectType } from "@prisma/client";

// ═════════════════════════════════════════════════════════════════════════
// SUBJECTS TAB
// ═════════════════════════════════════════════════════════════════════════

interface SubjectsTabProps {
  classYear: any;
  schoolId:  string;
  onUpdate:  () => void;
}

export function SubjectsTab({ classYear, schoolId, onUpdate }: SubjectsTabProps) {
  const [showAssignModal,    setShowAssignModal]    = useState(false);
  const [removingSubjectId,  setRemovingSubjectId]  = useState<string | null>(null);
  const [expandedSubjects,   setExpandedSubjects]   = useState<Set<string>>(new Set());

  const handleRemoveSubject = async (classSubjectId: string) => {
    setRemovingSubjectId(classSubjectId);
    try {
      const result = await removeSubjectFromClassYear(classSubjectId);
      if (result?.ok) {
        toast.success(result.message);
        onUpdate();
      } else {
        toast.error(result?.message || "Failed to remove subject");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setRemovingSubjectId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalUniqueSubjects = classYear.classSubjects.length;
  const totalPapers = classYear.classSubjects.reduce(
    (sum: number, cs: any) => sum + (cs.subject.papers?.length || 1),
    0
  );
  const multiPaperSubjects = classYear.classSubjects.filter(
    (cs: any) => cs.subject.papers && cs.subject.papers.length > 1
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Subjects</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage subjects assigned to this class
          </p>
          {totalPapers > totalUniqueSubjects && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {totalUniqueSubjects} subjects · {totalPapers} total papers
              </span>
              {multiPaperSubjects > 0 && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  {multiPaperSubjects} multi-paper
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Assign Subjects
        </button>
      </div>

      {/* Subject list */}
      {classYear.classSubjects.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Book className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No subjects assigned</h4>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Assign subjects to this class to get started</p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Assign Subjects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {classYear.classSubjects.map((cs: any) => {
            const hasPapers    = cs.subject.papers && cs.subject.papers.length > 0;
            const isMultiPaper = hasPapers && cs.subject.papers.length > 1;
            const isExpanded   = expandedSubjects.has(cs.id);

            return (
              <div key={cs.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm">
                      <BookOpen className="w-5 h-5 text-[#5B9BD5]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">{cs.subject.name}</h4>
                        {hasPapers && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            {cs.subject.papers.length} Paper{cs.subject.papers.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {cs.subject.code && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Code: {cs.subject.code}</p>
                        )}
                        {hasPapers && cs.subject.papers.some((p: any) => p.paperCode) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            · Papers: {cs.subject.papers.map((p: any) => p.paperCode || `P${p.paperNumber}`).join(", ")}
                          </p>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          cs.subjectType === "COMPULSORY"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        }`}>
                          {cs.subjectType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMultiPaper && (
                      <button
                        onClick={() => toggleExpanded(cs.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                    {cs.subject.headTeacher && (
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                        <User className="w-4 h-4" />
                        <span>{cs.subject.headTeacher.firstName} {cs.subject.headTeacher.lastName}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveSubject(cs.id)}
                      disabled={removingSubjectId === cs.id}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {removingSubjectId === cs.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isMultiPaper && isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                      Papers ({cs.subject.papers.length})
                    </p>
                    <div className="space-y-2">
                      {cs.subject.papers.map((paper: any) => (
                        <div key={paper.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5B9BD5]" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{paper.name}</span>
                                {paper.paperCode && (
                                  <span className="font-mono text-xs px-2 py-0.5 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 text-[#5B9BD5] rounded">
                                    {paper.paperCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                <span>Max: {paper.maxMarks} marks</span>
                                <span>·</span>
                                <span>Weight: {paper.weight}</span>
                                {paper.aoiCount > 0 && <><span>·</span><span>{paper.aoiCount} AOI</span></>}
                              </div>
                            </div>
                          </div>
                          {!paper.isActive && (
                            <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAssignModal && (
        <AssignSubjectsModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          classYear={classYear}
          schoolId={schoolId}
          onSuccess={() => { setShowAssignModal(false); onUpdate(); }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// HELPERS — shared between steps
// ═════════════════════════════════════════════════════════════════════════

type AvailableSubject = {
  id:                  string;
  name:                string;
  code:                string | null;
  papersCount:         number;
  papers:              {
    id:          string;
    paperNumber: number;
    name:        string;
    paperCode:   string | null;
    maxMarks:    number;
    weight:      number;
    isActive?:   boolean;
  }[];
  isAssigned:          boolean;
  // Returned by getAvailableSubjects — must be present or the cast fails
  assignedSubjectType: SubjectType | undefined;
};

type SubjectConfig = {
  paperWeights: Record<string, number>; // paperId → weight %
};

function weightTotal(w: Record<string, number>) {
  return Object.values(w).reduce((s, v) => s + v, 0);
}

function evenWeights(papers: AvailableSubject["papers"]): Record<string, number> {
  if (papers.length === 0) return {};
  const even = parseFloat((100 / papers.length).toFixed(2));
  const out: Record<string, number> = {};
  papers.forEach((p, i) => {
    out[p.id] = i === papers.length - 1
      ? parseFloat((100 - even * (papers.length - 1)).toFixed(2))
      : even;
  });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════
// ASSIGN SUBJECTS MODAL — two-step with paper selection
// ═════════════════════════════════════════════════════════════════════════

function AssignSubjectsModal({
  isOpen,
  onClose,
  classYear,
  schoolId,
  onSuccess,
}: {
  isOpen:    boolean;
  onClose:   () => void;
  classYear: any;
  schoolId:  string;
  onSuccess: () => void;
}) {
  const [step,               setStep]               = useState<1 | 2>(1);
  const [searchTerm,         setSearchTerm]         = useState("");
  const [selectedIds,        setSelectedIds]        = useState<string[]>([]);
  const [subjectConfigs,     setSubjectConfigs]     = useState<Record<string, SubjectConfig>>({});
  const [availableSubjects,  setAvailableSubjects]  = useState<AvailableSubject[]>([]);
  const [isLoading,          setIsLoading]          = useState(true);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [activeSubjectId,    setActiveSubjectId]    = useState<string | null>(null);
  const [expandedPreview,    setExpandedPreview]    = useState<Set<string>>(new Set());

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchTerm("");
      setSelectedIds([]);
      setSubjectConfigs({});
      setActiveSubjectId(null);
      setExpandedPreview(new Set());
    }
  }, [isOpen]);

  // Load unassigned subjects
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getAvailableSubjects(schoolId, classYear.id, classYear.classLevel)
      .then((data) => setAvailableSubjects(data as AvailableSubject[]))
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setIsLoading(false));
  }, [isOpen, schoolId, classYear.id]);

  // ── Selection logic ────────────────────────────────────────────────────

  const filteredSubjects = availableSubjects.filter(
    (s) =>
      !s.isAssigned &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function toggleSubject(id: string) {
    const subject = availableSubjects.find((s) => s.id === id)!;
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setSubjectConfigs((cfg) => { const n = { ...cfg }; delete n[id]; return n; });
        return prev.filter((x) => x !== id);
      }
      // Auto-initialise config: all active papers at even weights
      const activePapers = subject.papers.filter((p: any) => p.isActive !== false);
      setSubjectConfigs((cfg) => ({
        ...cfg,
        [id]: { paperWeights: evenWeights(activePapers) },
      }));
      return [...prev, id];
    });
  }

  // ── Paper/weight editing ───────────────────────────────────────────────

  function togglePaper(subjectId: string, paperId: string, allPapers: AvailableSubject["papers"]) {
    setSubjectConfigs((cfg) => {
      const current = { ...cfg[subjectId]?.paperWeights };
      if (paperId in current) {
        delete current[paperId];
        const rest = Object.keys(current);
        if (rest.length > 0) {
          const even = parseFloat((100 / rest.length).toFixed(2));
          rest.forEach((pid, i) => {
            current[pid] = i === rest.length - 1
              ? parseFloat((100 - even * (rest.length - 1)).toFixed(2))
              : even;
          });
        }
      } else {
        current[paperId] = 0;
        const all = Object.keys(current);
        const even = parseFloat((100 / all.length).toFixed(2));
        all.forEach((pid, i) => {
          current[pid] = i === all.length - 1
            ? parseFloat((100 - even * (all.length - 1)).toFixed(2))
            : even;
        });
      }
      return { ...cfg, [subjectId]: { paperWeights: current } };
    });
  }

  function setWeight(subjectId: string, paperId: string, value: number) {
    setSubjectConfigs((cfg) => ({
      ...cfg,
      [subjectId]: {
        paperWeights: { ...cfg[subjectId]?.paperWeights, [paperId]: value },
      },
    }));
  }

  // ── Validation ─────────────────────────────────────────────────────────

  // Subjects that actually need step 2 (2+ active papers)
  const multiPaperSelected = selectedIds.filter((id) => {
    const s = availableSubjects.find((x) => x.id === id);
    return (s?.papers?.filter((p: any) => p.isActive !== false).length ?? 0) > 1;
  });

  const needsStep2 = multiPaperSelected.length > 0;

  function getWeightError(subjectId: string): string | null {
    const cfg = subjectConfigs[subjectId];
    if (!cfg) return null;
    const keys = Object.keys(cfg.paperWeights);
    if (keys.length === 0) return "Select at least one paper";
    const total = weightTotal(cfg.paperWeights);
    if (Math.abs(total - 100) > 0.5) return `${total.toFixed(1)}% — must be 100%`;
    return null;
  }

  function canSubmit() {
    if (selectedIds.length === 0) return false;
    for (const id of multiPaperSelected) {
      if (getWeightError(id)) return false;
    }
    return true;
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!canSubmit()) return;
    setIsSubmitting(true);

    try {
      // Build one selection per subject — all going to the same classYearId
      const results = await Promise.all(
        selectedIds.map(async (subjectId) => {
          const subject     = availableSubjects.find((s) => s.id === subjectId)!;
          const activePapers = subject.papers.filter((p: any) => p.isActive !== false);
          const cfg          = subjectConfigs[subjectId];

          let papers: PaperAssignment[] = [];
          if (activePapers.length === 0) {
            // No papers — empty array → StreamSubject.subjectPaperId = null
            papers = [];
          } else if (activePapers.length === 1) {
            // Single paper — auto 100%
            papers = [{ paperId: activePapers[0].id, weightPercentage: 100 }];
          } else {
            // Multi-paper — use whatever the admin configured
            papers = Object.entries(cfg?.paperWeights ?? {}).map(
              ([paperId, weightPercentage]) => ({ paperId, weightPercentage })
            );
          }

          return assignSubjectWithPapersToClasses({
            subjectId,
            schoolId,
            selections: [{ classYearId: classYear.id, papers }],
          });
        })
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        toast.success(`${selectedIds.length} subject${selectedIds.length > 1 ? "s" : ""} assigned successfully`);
        onSuccess();
      } else {
        const succeeded = results.length - failed.length;
        if (succeeded > 0) toast.success(`${succeeded} subject${succeeded > 1 ? "s" : ""} assigned`);
        failed.forEach((r) => toast.error(r.message));
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const selectedSubjects = selectedIds
    .map((id) => availableSubjects.find((s) => s.id === id))
    .filter(Boolean) as AvailableSubject[];

  const focusedSubject = activeSubjectId
    ? selectedSubjects.find((s) => s.id === activeSubjectId)
    : selectedSubjects.find((s) => multiPaperSelected.includes(s.id)) ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl w-full shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
        style={{ maxWidth: step === 2 ? "800px" : "640px" }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-lg">
              <Plus className="w-5 h-5 text-[#5B9BD5]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Assign Subjects to {classYear.classTemplate.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1
                  ? "Select subjects to assign"
                  : "Choose which papers each subject uses in this class"}
              </p>
            </div>
          </div>

          {/* Step indicator — only shown when step 2 is reachable */}
          {needsStep2 && (
            <div className="flex items-center gap-1.5 mr-4">
              {[1, 2].map((n) => (
                <div key={n} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step >= n ? "bg-[#5B9BD5] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}>{n}</div>
                  {n < 2 && <div className="w-4 h-px bg-slate-300 dark:bg-slate-600" />}
                </div>
              ))}
            </div>
          )}

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* STEP 1 — subject selection ─────────────────────────────── */}
          {step === 1 && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subjects…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#5B9BD5]" />
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-10">
                  <Book className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {searchTerm ? "No subjects match your search" : "All subjects are already assigned"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubjects.map((subject) => {
                    const isSelected      = selectedIds.includes(subject.id);
                    const isExpanded      = expandedPreview.has(subject.id);
                    const activePapers    = subject.papers.filter((p: any) => p.isActive !== false);
                    const hasMultiple     = activePapers.length > 1;

                    return (
                      <div key={subject.id} className={`rounded-lg border transition-all overflow-hidden ${
                        isSelected
                          ? "border-[#5B9BD5] bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}>
                        <label className="flex items-center gap-3 p-3.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(subject.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#5B9BD5] focus:ring-[#5B9BD5]/20 bg-white dark:bg-slate-800"
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-900 dark:text-white text-sm">{subject.name}</span>
                                {activePapers.length > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    hasMultiple
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}>
                                    {activePapers.length} Paper{activePapers.length > 1 ? "s" : ""}
                                    {hasMultiple && " — select below"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {subject.code && <span>{subject.code}</span>}
                                {activePapers.length > 0 && (
                                  <span>· {activePapers.map((p) => p.paperCode || `P${p.paperNumber}`).join(", ")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {hasMultiple && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setExpandedPreview((prev) => {
                                  const next = new Set(prev);
                                  next.has(subject.id) ? next.delete(subject.id) : next.add(subject.id);
                                  return next;
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors shrink-0"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </label>

                        {/* Paper preview (expand) */}
                        {hasMultiple && isExpanded && (
                          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 space-y-1.5">
                            {activePapers.map((paper) => (
                              <div key={paper.id} className="flex items-center gap-2 text-xs">
                                <div className="w-1 h-1 rounded-full bg-slate-400" />
                                <span className="text-slate-700 dark:text-slate-300">{paper.name}</span>
                                {paper.paperCode && (
                                  <span className="font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                    {paper.paperCode}
                                  </span>
                                )}
                                <span className="text-slate-400">· {paper.maxMarks}m</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedIds.length > 0 && (
                <div className="p-3 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-lg">
                  <p className="text-sm font-medium text-[#5B9BD5]">
                    {selectedIds.length} subject{selectedIds.length > 1 ? "s" : ""} selected
                    {multiPaperSelected.length > 0 && (
                      <span className="font-normal text-slate-600 dark:text-slate-400 ml-1">
                        · {multiPaperSelected.length} need paper selection in next step
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — paper selection per multi-paper subject ────────── */}
          {step === 2 && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left: subject list */}
              <div className="w-56 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Multi-paper subjects
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  {selectedSubjects
                    .filter((s) => {
                      const ap = s.papers.filter((p: any) => p.isActive !== false);
                      return ap.length > 1;
                    })
                    .map((s) => {
                      const err      = getWeightError(s.id);
                      const isActive = (activeSubjectId ?? multiPaperSelected[0]) === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setActiveSubjectId(s.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                            isActive
                              ? "bg-[#5B9BD5] text-white"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <p className="text-sm font-medium leading-tight truncate">{s.name}</p>
                          {err ? (
                            <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-amber-600 dark:text-amber-400"}`}>
                              ⚠ {err}
                            </p>
                          ) : (
                            <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                              {Object.keys(subjectConfigs[s.id]?.paperWeights ?? {}).length} paper{Object.keys(subjectConfigs[s.id]?.paperWeights ?? {}).length !== 1 ? "s" : ""} selected
                            </p>
                          )}
                        </button>
                      );
                    })}

                  {/* Single-paper / no-paper subjects — show as auto-confirmed */}
                  {selectedSubjects
                    .filter((s) => {
                      const ap = s.papers.filter((p: any) => p.isActive !== false);
                      return ap.length <= 1;
                    })
                    .map((s) => (
                      <div key={s.id} className="flex items-center gap-2 px-3 py-2 text-slate-400 dark:text-slate-500">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <p className="text-xs truncate">{s.name}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right: paper checkboxes + weights */}
              <div className="flex-1 overflow-y-auto p-5">
                {focusedSubject ? (
                  (() => {
                    const activePapers = focusedSubject.papers.filter((p: any) => p.isActive !== false);
                    const cfg          = subjectConfigs[focusedSubject.id];
                    const total        = weightTotal(cfg?.paperWeights ?? {});

                    return (
                      <>
                        <div className="mb-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{focusedSubject.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Select which papers this class will sit and set their weight contribution. Weights must add up to 100%.
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          {activePapers.map((paper) => {
                            const isChecked = paper.id in (cfg?.paperWeights ?? {});
                            const weight    = cfg?.paperWeights[paper.id] ?? 0;

                            return (
                              <div key={paper.id} className={`rounded-lg border transition-colors ${
                                isChecked
                                  ? "border-[#5B9BD5] bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10"
                                  : "border-slate-200 dark:border-slate-700"
                              }`}>
                                <label className="flex items-start gap-3 p-3.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePaper(focusedSubject.id, paper.id, activePapers)}
                                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#5B9BD5] focus:ring-[#5B9BD5]/20 bg-white dark:bg-slate-800"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium text-slate-900 dark:text-white text-sm">{paper.name}</p>
                                      {paper.paperCode && (
                                        <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                                          {paper.paperCode}
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-400">{paper.maxMarks} marks</span>
                                    </div>
                                    {isChecked && (
                                      <div className="mt-2.5 flex items-center gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Weight:</span>
                                        <input
                                          type="number"
                                          min={1}
                                          max={99}
                                          step={1}
                                          value={weight}
                                          onChange={(e) =>
                                            setWeight(focusedSubject.id, paper.id, parseFloat(e.target.value) || 0)
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                        <span className="text-xs text-slate-400">%</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded shrink-0">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>

                        {/* Weight total */}
                        <div className={`mt-4 p-3 rounded-lg border text-sm font-medium ${
                          Math.abs(total - 100) <= 0.5
                            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        }`}>
                          Total: {total.toFixed(1)}%
                          {Math.abs(total - 100) <= 0.5 ? " ✓" : " — must equal 100%"}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <p className="text-slate-400 text-sm">Select a subject on the left</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            {selectedIds.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedIds.length}</span>{" "}
                subject{selectedIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={step === 1 ? onClose : () => setStep(1)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {step === 2 && <ChevronLeft className="w-4 h-4" />}
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {/* Step 1 → Next (only if multi-paper subjects selected) */}
            {step === 1 && needsStep2 && (
              <button
                onClick={() => {
                  setStep(2);
                  setActiveSubjectId(multiPaperSelected[0] ?? null);
                }}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Submit — shown on step 1 when no multi-paper subjects, or on step 2 */}
            {(step === 2 || !needsStep2) && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                ) : (
                  <><Check className="w-4 h-4" /> Assign {selectedIds.length} Subject{selectedIds.length !== 1 ? "s" : ""}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}