// components/dashboard/classes/detail-tabs/settings-tab.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Check,
  Edit2,
  FileText,
  Lock,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import {
  getClassSettings,
  upsertAssessmentConfig,
  createExam,
  updateExam,
  deleteExam,
  toggleAssessmentConfigLock,
} from "@/actions/class-settings";
import { ExamType } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ClassSettings = NonNullable<
  Awaited<ReturnType<typeof getClassSettings>>["data"]
>;

type Term = ClassSettings["academicYear"]["terms"][0];

type AssessmentConfig = ClassSettings["assessmentConfigs"][0];

interface SettingsTabProps {
  classYear: any; // from parent — lightweight version
  schoolId:  string;
  userId?:   string;
  onUpdate:  () => void;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  BOT:        "Beginning of Term (BOT)",
  MTE:        "Mid-Term Exam (MTE)",
  EOT:        "End of Term (EOT)",
  MOCK:       "Mock Exam",
  ASSIGNMENT: "Assignment",
};

const EXAM_TYPE_SHORT: Record<ExamType, string> = {
  BOT: "BOT", MTE: "MTE", EOT: "EOT", MOCK: "MOCK", ASSIGNMENT: "ASSIGN",
};

const EXAM_COLORS: Record<string, string> = {
  BOT:  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  MTE:  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  EOT:  "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  MOCK: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  ASSIGNMENT: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function SettingsTab({ classYear, schoolId, userId, onUpdate }: SettingsTabProps) {
  const [settings,     setSettings]     = useState<ClassSettings | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTerm,   setActiveTerm]   = useState<string | null>(null);

  const loadSettings = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else         setIsRefreshing(true);
    try {
      const result = await getClassSettings(classYear.id);
      if (result.ok && result.data) {
        setSettings(result.data);
        // Default to the active term
        const active = result.data.academicYear.terms.find((t: any) => t.isActive);
        setActiveTerm((prev) => prev ?? active?.id ?? result.data!.academicYear.terms[0]?.id ?? null);
      } else {
        toast.error(result.message || "Failed to load settings");
      }
    } catch {
      toast.error("Failed to load class settings");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [classYear.id]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const refresh = () => loadSettings(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-[#5B9BD5]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-slate-500">
        Failed to load.{" "}
        <button className="text-[#5B9BD5] underline" onClick={() => loadSettings()}>Retry</button>
      </div>
    );
  }

  const terms  = settings.academicYear.terms;
  const term   = terms.find((t) => t.id === activeTerm) ?? terms[0];
  const config = settings.assessmentConfigs.find((c) => c.termId === term?.id) ?? null;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#5B9BD5]" />
            Class Settings
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure exams, assessment weights, and AOI topics for{" "}
            <span className="font-medium">{settings.classTemplate.name}</span>
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Term tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {terms.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTerm(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              t.id === activeTerm
                ? "border-[#5B9BD5] text-[#5B9BD5]"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t.name}
            {(t as any).isActive && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                Active
              </span>
            )}
          </button>
        ))}
      </div>

      {term && (
        <div className="space-y-6">
          {/* ── Section 1: Assessment Config ─────────────────────────── */}
          <AssessmentConfigSection
            classYearId={settings.id}
            termId={term.id}
            termName={term.name}
            config={config}
            onSaved={refresh}
          />

          {/* ── Section 1b: Lock / Unlock ────────────────────────────── */}
          <LockSection
            classYearId={settings.id}
            termId={term.id}
            termName={term.name}
            config={config}
            userId={userId ?? ""}
            onSaved={refresh}
          />

          {/* ── Section 2: Exams ─────────────────────────────────────── */}
          <ExamsSection
            classYearId={settings.id}
            term={term}
            config={config}
            onSaved={refresh}
          />
        </div>
      )}

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — ASSESSMENT CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

function AssessmentConfigSection({
  classYearId,
  termId,
  termName,
  config,
  onSaved,
}: {
  classYearId: string;
  termId:      string;
  termName:    string;
  config:      AssessmentConfig | null;
  onSaved:     () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    hasBOT:    config?.hasBOT    ?? false,
    hasMTE:    config?.hasMTE    ?? true,
    hasEOT:    config?.hasEOT    ?? true,
    botWeight: config?.botWeight ?? 0,
    mteWeight: config?.mteWeight ?? 50,
    eotWeight: config?.eotWeight ?? 50,
  });

  // Reset when config changes (term switch)
  useEffect(() => {
    setForm({
      hasBOT:    config?.hasBOT    ?? false,
      hasMTE:    config?.hasMTE    ?? true,
      hasEOT:    config?.hasEOT    ?? true,
      botWeight: config?.botWeight ?? 0,
      mteWeight: config?.mteWeight ?? 50,
      eotWeight: config?.eotWeight ?? 50,
    });
  }, [config, termId]);

  const set = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Active exam weight total — must equal 100 when using weighted mode
  const activeWeights = [
    form.hasBOT ? form.botWeight : 0,
    form.hasMTE ? form.mteWeight : 0,
    form.hasEOT ? form.eotWeight : 0,
  ];
  const examWeightSum = activeWeights.reduce((s, w) => s + w, 0);
  const activeCount   = [form.hasBOT, form.hasMTE, form.hasEOT].filter(Boolean).length;

  // Simple average: each active exam contributes equally (weights auto-set to 100/n)
  const isSimpleAverage = activeCount > 0 && activeWeights.every(
    (w, i) => ([form.hasBOT, form.hasMTE, form.hasEOT][i] ? Math.abs(w - 100 / activeCount) < 1 : w === 0)
  );

  const weightsValid = Math.abs(examWeightSum - 100) <= 0.5 || activeCount === 0;

  // Auto-distribute weights equally
  const distributeEvenly = () => {
    if (activeCount === 0) return;
    const each = parseFloat((100 / activeCount).toFixed(1));
    const remainder = parseFloat((100 - each * activeCount).toFixed(1));
    const weights = { botWeight: 0, mteWeight: 0, eotWeight: 0 };
    let assigned = 0;
    if (form.hasBOT) { weights.botWeight = each; assigned++; }
    if (form.hasMTE) { weights.mteWeight = each; assigned++; }
    if (form.hasEOT) { weights.eotWeight = each + (assigned === activeCount ? remainder : 0); }
    setForm(f => ({ ...f, ...weights }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await upsertAssessmentConfig({ classYearId, termId, ...form });
      if (result.ok) {
        toast.success(result.message);
        onSaved();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
        <div className="p-2 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-lg">
          <Settings className="w-4 h-4 text-[#5B9BD5]" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
            Assessment Configuration
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {termName} — exam weights and AOI settings
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Exam Weights */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Summative Exams</p>
            <button
              type="button"
              onClick={distributeEvenly}
              disabled={activeCount === 0}
              className="text-xs text-[#5B9BD5] hover:text-[#4A8BC2] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⚖ Distribute evenly
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Enable exams and set how much each contributes to the final mark. Weights must total 100%.
            Use <strong>Distribute evenly</strong> for a simple average across selected exams.
          </p>

          <div className="space-y-3">
            {(["BOT", "MTE", "EOT"] as const).map((type) => {
              const hasKey    = `has${type}` as "hasBOT" | "hasMTE" | "hasEOT";
              const weightKey = `${type.toLowerCase()}Weight` as "botWeight" | "mteWeight" | "eotWeight";
              const isEnabled = form[hasKey];

              return (
                <div key={type} className={`rounded-lg border p-3.5 transition-colors ${
                  isEnabled
                    ? "border-[#5B9BD5]/30 bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10"
                    : "border-slate-200 dark:border-slate-700"
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${EXAM_COLORS[type]}`}>
                        {type}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {EXAM_TYPE_LABELS[type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEnabled && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={form[weightKey]}
                            onChange={(e) => set(weightKey, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      )}
                      <Toggle
                        checked={isEnabled}
                        onChange={(v) => {
                          set(hasKey, v);
                          if (!v) set(weightKey, 0);
                        }}
                      />
                    </div>
                  </div>
                  {isEnabled && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Contributes <strong className="text-[#5B9BD5]">{form[weightKey]}%</strong> to the final mark
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Weight total indicator */}
          <div className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center justify-between ${
            weightsValid
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          }`}>
            <span>
              {isSimpleAverage && activeCount > 0
                ? `Simple average of ${activeCount} exam${activeCount > 1 ? "s" : ""} (${(100 / activeCount).toFixed(1)}% each)`
                : "Weighted total"}
            </span>
            <span>{examWeightSum.toFixed(1)}% {weightsValid ? "✓" : "— must equal 100%"}</span>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !weightsValid}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> Save Configuration</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — EXAMS
// ════════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════════
// SECTION 1b — LOCK / UNLOCK
// ════════════════════════════════════════════════════════════════════════════

function LockSection({
  classYearId, termId, termName, config, userId, onSaved,
}: {
  classYearId: string;
  termId:      string;
  termName:    string;
  config:      AssessmentConfig | null;
  userId:      string;
  onSaved:     () => void;
}) {
  const [isWorking,  setIsWorking]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLocked     = config?.isLocked ?? true;
  const unlockedBy   = (config as any)?.unlockedBy?.name ?? null;
  const unlockedAt   = (config as any)?.unlockedAt
    ? new Date((config as any).unlockedAt).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })
    : null;

  const handleToggle = async () => {
    if (!config) { toast.error("Save assessment config first"); return; }
    setIsWorking(true);
    try {
      const result = await toggleAssessmentConfigLock({
        classYearId, termId, unlock: isLocked, userId,
      });
      if (result.ok) { toast.success(result.message); onSaved(); setShowConfirm(false); }
      else           toast.error(result.message);
    } catch { toast.error("Failed to toggle lock"); }
    finally { setIsWorking(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-blue-100 dark:border-blue-900 bg-blue-600 dark:bg-blue-700 flex items-center gap-3">
        <Lock className="w-5 h-5 text-white" />
        <div>
          <h4 className="font-semibold text-white">Mark Entry Lock</h4>
          <p className="text-xs text-blue-100 mt-0.5">{termName} · Controls whether marks can be entered or edited</p>
        </div>
      </div>

      <div className="p-5 bg-blue-50 dark:bg-blue-950/20">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isLocked
                ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {isLocked ? "🔒 Marks are Locked" : "🔓 Marks are Unlocked"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isLocked
                  ? "Teachers cannot enter or edit marks for this term."
                  : "Teachers can enter and edit marks. Changes are audited."}
              </p>
              {!isLocked && unlockedBy && unlockedAt && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Unlocked by {unlockedBy} on {unlockedAt}
                </p>
              )}
            </div>
          </div>

          {!showConfirm && (
            <button
              onClick={() => isLocked ? setShowConfirm(true) : handleToggle()}
              disabled={isWorking || !config}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isLocked
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              {isWorking
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Lock className="w-4 h-4" />
              }
              {isLocked ? "Unlock for editing" : "Re-lock marks"}
            </button>
          )}
        </div>

        {/* Confirm unlock dialog */}
        {showConfirm && isLocked && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              ⚠ Confirm Unlock
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Unlocking allows teachers to edit submitted and approved marks.
              All changes are audited. Marks will need to go through approval again.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleToggle}
                disabled={isWorking}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, unlock marks
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!config && (
          <p className="mt-3 text-xs text-slate-400">
            ⚠ Save an assessment configuration first to enable lock controls.
          </p>
        )}
      </div>
    </div>
  );
}

function ExamsSection({
  classYearId,
  term,
  config,
  onSaved,
}: {
  classYearId: string;
  term:        Term;
  config:      AssessmentConfig | null;
  onSaved:     () => void;
}) {
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [editingExam,  setEditingExam]  = useState<string | null>(null);
  const [deletingExam, setDeletingExam] = useState<string | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);

  const exams = (term as any).exams ?? [];

  const existingTypes = new Set(exams.map((e: any) => e.examType));

  // Only show exam types that are enabled in the assessment config
  // BOT/MTE/EOT filtered by config; MOCK and ASSIGNMENT always available
  const configuredTypes: ExamType[] = [
    ...(config?.hasBOT ? ["BOT" as ExamType] : []),
    ...(config?.hasMTE ? ["MTE" as ExamType] : []),
    ...(config?.hasEOT ? ["EOT" as ExamType] : []),
    "MOCK" as ExamType,
    "ASSIGNMENT" as ExamType,
  ];

  const availableTypes = configuredTypes.filter(t => !existingTypes.has(t));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              Exams — {term.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {exams.length} exam{exams.length !== 1 ? "s" : ""} configured
            </p>
          </div>
        </div>
        {availableTypes.length > 0 && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#5B9BD5] hover:text-[#4A8BC2] font-medium"
          >
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        )}
      </div>

      <div className="p-5 space-y-3">
        {/* No config warning */}
        {!config && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
            ⚠ Save the Assessment Configuration above first to enable exam creation.
          </div>
        )}

        {/* Existing exams */}
        {exams.length === 0 && !showAddForm && config && (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              No exams configured for {term.name}
            </p>
            {availableTypes.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white text-sm font-medium rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Exam
              </button>
            )}
          </div>
        )}

        {exams.map((exam: any) =>
          editingExam === exam.id ? (
            <ExamEditRow
              key={exam.id}
              exam={exam}
              onSave={async (data) => {
                setIsSaving(true);
                const result = await updateExam(exam.id, data);
                setIsSaving(false);
                if (result.ok) { toast.success(result.message); setEditingExam(null); onSaved(); }
                else toast.error(result.message);
              }}
              onCancel={() => setEditingExam(null)}
              isSaving={isSaving}
            />
          ) : (
            <ExamRow
              key={exam.id}
              exam={exam}
              isDeleting={deletingExam === exam.id}
              onEdit={() => setEditingExam(exam.id)}
              onDelete={async () => {
                setDeletingExam(exam.id);
                const result = await deleteExam(exam.id);
                setDeletingExam(null);
                if (result.ok) { toast.success(result.message); onSaved(); }
                else toast.error(result.message);
              }}
            />
          )
        )}

        {/* Add exam form */}
        {showAddForm && (
          <ExamAddForm
            classYearId={classYearId}
            termId={term.id}
            availableTypes={availableTypes}
            onSave={async (data) => {
              setIsSaving(true);
              const result = await createExam(data);
              setIsSaving(false);
              if (result.ok) { toast.success(result.message); setShowAddForm(false); onSaved(); }
              else toast.error(result.message);
            }}
            onCancel={() => setShowAddForm(false)}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}

function ExamRow({
  exam,
  isDeleting,
  onEdit,
  onDelete,
}: {
  exam:       any;
  isDeleting: boolean;
  onEdit:     () => void;
  onDelete:   () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 group transition-colors">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded shrink-0 ${EXAM_COLORS[exam.examType]}`}>
          {EXAM_TYPE_SHORT[exam.examType as ExamType] ?? exam.examType}
        </span>
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">{exam.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Max {exam.maxMarks} marks
            {exam.date && ` · ${new Date(exam.date).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-[#5B9BD5] hover:bg-[#5B9BD5]/10 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ExamEditRow({
  exam,
  onSave,
  onCancel,
  isSaving,
}: {
  exam:     any;
  onSave:   (data: { name: string; maxMarks: number; date?: Date | null }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name,     setName]     = useState(exam.name);
  const [maxMarks, setMaxMarks] = useState(exam.maxMarks);
  const [date,     setDate]     = useState(exam.date ? new Date(exam.date).toISOString().slice(0, 10) : "");

  return (
    <div className="p-4 rounded-lg border-2 border-[#5B9BD5] bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-1 text-xs font-semibold rounded ${EXAM_COLORS[exam.examType]}`}>
          {exam.examType}
        </span>
        <span className="text-xs text-slate-500">Editing</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Exam Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Max Marks</label>
          <input
            type="number"
            value={maxMarks}
            min={1}
            onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Date (optional)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
          Cancel
        </button>
        <button
          onClick={() => onSave({ name, maxMarks, date: date ? new Date(date) : null })}
          disabled={isSaving || !name.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#5B9BD5] text-white rounded-lg hover:bg-[#4A8BC2] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Save
        </button>
      </div>
    </div>
  );
}

function ExamAddForm({
  classYearId,
  termId,
  availableTypes,
  onSave,
  onCancel,
  isSaving,
}: {
  classYearId:    string;
  termId:         string;
  availableTypes: ExamType[];
  onSave:         (data: any) => void;
  onCancel:       () => void;
  isSaving:       boolean;
}) {
  const [examType, setExamType] = useState<ExamType>(availableTypes[0]);
  const [name,     setName]     = useState(EXAM_TYPE_LABELS[availableTypes[0]] ?? "");
  const [maxMarks, setMaxMarks] = useState(100);
  const [date,     setDate]     = useState("");

  return (
    <div className="p-4 rounded-lg border-2 border-dashed border-[#5B9BD5]/40 bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10 space-y-3">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        New Exam
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
          <select
            value={examType}
            onChange={(e) => {
              const t = e.target.value as ExamType;
              setExamType(t);
              setName(EXAM_TYPE_LABELS[t]);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {availableTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Exam name"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Max Marks</label>
          <input
            type="number"
            value={maxMarks}
            min={1}
            onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
          Cancel
        </button>
        <button
          onClick={() => onSave({ classYearId, termId, examType, name, maxMarks, date: date ? new Date(date) : null })}
          disabled={isSaving || !name.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#5B9BD5] text-white rounded-lg hover:bg-[#4A8BC2] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Create Exam
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED SMALL COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        checked
          ? "bg-[#5B9BD5] text-white"
          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${checked ? "bg-white" : "bg-slate-400"}`} />
      {label ?? (checked ? "On" : "Off")}
    </button>
  );
}

function NumericField({
  label, hint, value, min, max, step = 1, onChange,
}: {
  label: string; hint?: string; value: number;
  min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}