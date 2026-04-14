// components/dashboard/subjects/assign-classes-modal.tsx
//
// Two-step modal for assigning a subject to classes with paper selection.
//
// Step 1: Pick which class years to assign to
// Step 2: For each selected class, choose which papers it takes + weights
//         (weights must sum to 100 for subjects with multiple papers)
//
// Replaces the inline "showAssignClassesModal" block inside subject-detail-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Book,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { assignSubjectWithPapersToClasses, ClassPaperSelection, PaperAssignment } from "@/actions/class-subject-assignment";

// ─── Types ────────────────────────────────────────────────────────────────────

type Paper = {
  id:          string;
  paperNumber: number;
  name:        string;
  paperCode:   string | null;
  maxMarks:    number;
  weight:      number;
  isActive:    boolean;
};

type AvailableClassYear = {
  id:              string;
  classTemplateId: string;
  academicYearId:  string;
  classTemplate:   { id: string; name: string; code: string | null; level: number | null };
  streams:         { id: string }[];
};

interface AssignClassesModalProps {
  isOpen:              boolean;
  onClose:             () => void;
  onSuccess:           () => void;
  subject: {
    id:   string;
    name: string;
    schoolId: string;
    papers?: Paper[];
  };
  unassignedClassYears: AvailableClassYear[];
  academicYearLabel:    string;
}

// ─── Per-class paper config state ─────────────────────────────────────────────

type ClassConfig = {
  // paperId → weight (0–100)
  paperWeights: Record<string, number>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weightTotal(weights: Record<string, number>): number {
  return Object.values(weights).reduce((s, w) => s + w, 0);
}

function defaultWeights(papers: Paper[]): Record<string, number> {
  if (papers.length === 0) return {};
  const even = parseFloat((100 / papers.length).toFixed(2));
  const weights: Record<string, number> = {};
  papers.forEach((p, i) => {
    // Give any rounding remainder to the last paper
    weights[p.id] = i === papers.length - 1
      ? parseFloat((100 - even * (papers.length - 1)).toFixed(2))
      : even;
  });
  return weights;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignClassesModal({
  isOpen,
  onClose,
  onSuccess,
  subject,
  unassignedClassYears,
  academicYearLabel,
}: AssignClassesModalProps) {
  const activePapers = (subject.papers ?? []).filter((p) => p.isActive);
  const hasPapers    = activePapers.length > 0;
  const singlePaper  = activePapers.length === 1;

  // Step 1: selected class year ids
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);
  // Step 2: per-class paper/weight config
  const [classConfigs, setClassConfigs] = useState<Record<string, ClassConfig>>({});
  // Which step we're on
  const [step, setStep]                 = useState<1 | 2>(1);
  // Which class is highlighted in step 2
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setClassConfigs({});
      setStep(1);
      setActiveClassId(null);
    }
  }, [isOpen]);

  // When a class is selected, initialise its config with default weights
  function toggleClass(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // Deselect — remove config too
        setClassConfigs((cfg) => {
          const next = { ...cfg };
          delete next[id];
          return next;
        });
        return prev.filter((x) => x !== id);
      } else {
        // Select — initialise config
        setClassConfigs((cfg) => ({
          ...cfg,
          [id]: { paperWeights: defaultWeights(activePapers) },
        }));
        return [...prev, id];
      }
    });
  }

  function togglePaper(classId: string, paperId: string) {
    setClassConfigs((cfg) => {
      const current = { ...cfg[classId]?.paperWeights };

      if (paperId in current) {
        // Remove this paper
        delete current[paperId];
        // Rebalance remaining
        const remaining = Object.keys(current);
        if (remaining.length > 0) {
          const even = parseFloat((100 / remaining.length).toFixed(2));
          remaining.forEach((pid, i) => {
            current[pid] = i === remaining.length - 1
              ? parseFloat((100 - even * (remaining.length - 1)).toFixed(2))
              : even;
          });
        }
      } else {
        // Add this paper
        current[paperId] = 0;
        // Rebalance all
        const all = Object.keys(current);
        const even = parseFloat((100 / all.length).toFixed(2));
        all.forEach((pid, i) => {
          current[pid] = i === all.length - 1
            ? parseFloat((100 - even * (all.length - 1)).toFixed(2))
            : even;
        });
      }

      return { ...cfg, [classId]: { paperWeights: current } };
    });
  }

  function setWeight(classId: string, paperId: string, value: number) {
    setClassConfigs((cfg) => ({
      ...cfg,
      [classId]: {
        paperWeights: {
          ...cfg[classId]?.paperWeights,
          [paperId]: value,
        },
      },
    }));
  }

  function canProceedToStep2() {
    return selectedIds.length > 0;
  }

  function getWeightError(classId: string): string | null {
    const cfg = classConfigs[classId];
    if (!cfg || !hasPapers) return null;
    const keys = Object.keys(cfg.paperWeights);
    if (keys.length === 0) return "Select at least one paper";
    const total = weightTotal(cfg.paperWeights);
    if (Math.abs(total - 100) > 0.5) return `Weights sum to ${total.toFixed(1)}%, must be 100%`;
    return null;
  }

  function canSubmit() {
    if (selectedIds.length === 0) return false;
    if (!hasPapers) return true; // No papers → always valid
    for (const id of selectedIds) {
      if (getWeightError(id)) return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!canSubmit()) return;
    setIsSubmitting(true);

    try {
      const selections: ClassPaperSelection[] = selectedIds.map((classYearId) => {
        const cfg = classConfigs[classYearId];
        const papers: PaperAssignment[] = hasPapers
          ? Object.entries(cfg?.paperWeights ?? {}).map(([paperId, weightPercentage]) => ({
              paperId,
              weightPercentage,
            }))
          : [];

        return { classYearId, papers };
      });

      const result = await assignSubjectWithPapersToClasses({
        subjectId: subject.id,
        schoolId:  subject.schoolId,
        selections,
      });

      if (result.ok) {
        toast.success(result.message);
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const selectedClassYears = unassignedClassYears.filter((cy) =>
    selectedIds.includes(cy.id)
  );

  const displayClass = activeClassId
    ? unassignedClassYears.find((cy) => cy.id === activeClassId)
    : selectedClassYears[0] ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
           style={{ maxWidth: hasPapers && step === 2 ? "780px" : "520px" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-lg">
              <Plus className="w-5 h-5 text-[#5B9BD5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Assign {subject.name} to Classes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1
                  ? `Select classes for ${academicYearLabel}`
                  : "Choose which papers each class takes"}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          {hasPapers && (
            <div className="flex items-center gap-1.5 mr-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step >= 1 ? "bg-[#5B9BD5] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
              }`}>1</div>
              <div className="w-4 h-px bg-slate-300 dark:bg-slate-600" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step >= 2 ? "bg-[#5B9BD5] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
              }`}>2</div>
            </div>
          )}

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* STEP 1 — class selection ────────────────────────────────── */}
          {step === 1 && (
            <div className="flex-1 overflow-y-auto p-5">
              {unassignedClassYears.length === 0 ? (
                <div className="text-center py-10">
                  <Book className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    All classes already have this subject assigned for {academicYearLabel}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedClassYears.map((cy) => {
                    const isSelected = selectedIds.includes(cy.id);
                    return (
                      <label
                        key={cy.id}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-[#5B9BD5] bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleClass(cy.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#5B9BD5] focus:ring-[#5B9BD5]/20 bg-white dark:bg-slate-800"
                        />
                        <div className="flex items-center gap-2.5 flex-1">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                            <Book className="w-3.5 h-3.5 text-[#5B9BD5]" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {cy.classTemplate.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {cy.streams.length} stream{cy.streams.length !== 1 ? "s" : ""}
                              {cy.classTemplate.level ? ` · Level ${cy.classTemplate.level}` : ""}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#5B9BD5] shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — paper selection (two columns) ─────────────────── */}
          {step === 2 && hasPapers && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left: class list */}
              <div className="w-52 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Selected classes
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  {selectedClassYears.map((cy) => {
                    const err = getWeightError(cy.id);
                    const isActive = (activeClassId ?? selectedClassYears[0]?.id) === cy.id;
                    return (
                      <button
                        key={cy.id}
                        onClick={() => setActiveClassId(cy.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[#5B9BD5] text-white"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <p className="text-sm font-medium leading-tight">{cy.classTemplate.name}</p>
                        {err ? (
                          <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-amber-600 dark:text-amber-400"}`}>
                            ⚠ {err}
                          </p>
                        ) : (
                          <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                            {Object.keys(classConfigs[cy.id]?.paperWeights ?? {}).length} paper{Object.keys(classConfigs[cy.id]?.paperWeights ?? {}).length !== 1 ? "s" : ""} selected
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: paper checkboxes + weights for active class */}
              <div className="flex-1 overflow-y-auto p-5">
                {displayClass ? (
                  <>
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {displayClass.classTemplate.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Select which papers this class will sit, then set their weight contribution.
                        Weights must add up to 100%.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {activePapers.map((paper) => {
                        const cfg        = classConfigs[displayClass.id];
                        const isChecked  = paper.id in (cfg?.paperWeights ?? {});
                        const weight     = cfg?.paperWeights[paper.id] ?? 0;
                        const total      = weightTotal(cfg?.paperWeights ?? {});
                        const totalColor = Math.abs(total - 100) <= 0.5
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400";

                        return (
                          <div
                            key={paper.id}
                            className={`rounded-lg border transition-colors ${
                              isChecked
                                ? "border-[#5B9BD5] bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10"
                                : "border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <label className="flex items-start gap-3 p-3.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePaper(displayClass.id, paper.id)}
                                disabled={singlePaper}  // single paper always included
                                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#5B9BD5] focus:ring-[#5B9BD5]/20 bg-white dark:bg-slate-800 disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                                    {paper.name}
                                  </p>
                                  {paper.paperCode && (
                                    <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                                      {paper.paperCode}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {paper.maxMarks} marks
                                  </span>
                                </div>

                                {/* Weight input — only shown when checked */}
                                {isChecked && !singlePaper && (
                                  <div className="mt-2.5 flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                      Weight:
                                    </span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={99}
                                      step={1}
                                      value={weight}
                                      onChange={(e) =>
                                        setWeight(displayClass.id, paper.id, parseFloat(e.target.value) || 0)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-xs text-slate-400">%</span>
                                  </div>
                                )}

                                {/* Single paper → always 100% */}
                                {isChecked && singlePaper && (
                                  <p className="mt-1 text-xs text-slate-400">100% weight</p>
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
                    {!singlePaper && (
                      <div className={`mt-4 p-3 rounded-lg border text-sm font-medium ${
                        Math.abs(weightTotal(classConfigs[displayClass.id]?.paperWeights ?? {}) - 100) <= 0.5
                          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      }`}>
                        Total: {weightTotal(classConfigs[displayClass.id]?.paperWeights ?? {}).toFixed(1)}%
                        {Math.abs(weightTotal(classConfigs[displayClass.id]?.paperWeights ?? {}) - 100) <= 0.5
                          ? " ✓"
                          : " — must equal 100%"}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">Select a class on the left</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            {selectedIds.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedIds.length}
                </span>{" "}
                class{selectedIds.length !== 1 ? "es" : ""} selected
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

            {/* Step 1: "Next" (only if papers exist, else go straight to submit) */}
            {step === 1 && hasPapers && !singlePaper && (
              <button
                onClick={() => {
                  setStep(2);
                  setActiveClassId(selectedIds[0] ?? null);
                }}
                disabled={!canProceedToStep2()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Submit on step 1 if no papers (or single paper auto-selected), or on step 2 */}
            {(step === 2 || !hasPapers || singlePaper) && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                ) : (
                  <><Check className="w-4 h-4" /> Assign to {selectedIds.length} Class{selectedIds.length !== 1 ? "es" : ""}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}