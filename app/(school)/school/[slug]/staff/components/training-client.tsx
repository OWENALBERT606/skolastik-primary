// app/(school)/school/[slug]/staff/training/components/training-client.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Plus, RefreshCw, X, Calendar, MapPin,
  Users, DollarSign, Clock, Wifi, Building2, XCircle,
} from "lucide-react";
import {
  getTrainingPrograms,
  createTrainingProgram,
} from "@/actions/staff-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingProgram {
  id: string;
  title: string;
  description?: string | null;
  trainingType: TrainingType;
  status: TrainingStatus;
  provider?: string | null;
  venue?: string | null;
  isOnline: boolean;
  onlineLink?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  totalHours?: number | null;
  maxParticipants?: number | null;
  cost?: number | null;
  _count?: { participants: number };
}

type TrainingType =
  | "INTERNAL" | "EXTERNAL" | "ONLINE"
  | "CONFERENCE" | "WORKSHOP" | "CERTIFICATION";

type TrainingStatus =
  | "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "DEFERRED";

interface Props {
  schoolId: string;
  schoolName: string;
  slug: string;
}

interface CreateForm {
  title: string;
  description: string;
  trainingType: TrainingType;
  provider: string;
  venue: string;
  startDate: string;
  endDate: string;
  totalHours: string;
  maxParticipants: string;
  cost: string;
  isOnline: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_FORM: CreateForm = {
  title: "", description: "", trainingType: "WORKSHOP",
  provider: "", venue: "", startDate: "", endDate: "",
  totalHours: "", maxParticipants: "", cost: "", isOnline: false,
};

const TYPE_STYLES: Record<TrainingType, string> = {
  WORKSHOP:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  INTERNAL:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  EXTERNAL:      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  ONLINE:        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  CONFERENCE:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CERTIFICATION: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<TrainingStatus, string> = {
  PLANNED:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ONGOING:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  DEFERRED:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-UG", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const inputCls =
  "w-full bg-[#0f172a] border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all";
const labelCls =
  "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 bg-[#0d1117] border border-slate-800/60 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-3">
        <BookOpen size={22} className="text-slate-600" />
      </div>
      <p className="text-sm text-slate-500">No training programs yet</p>
      <p className="text-xs text-slate-600 mt-1">
        Create programs to track staff professional development
      </p>
    </div>
  );
}

function ProgramCard({ program }: { program: TrainingProgram }) {
  const enrolled = program._count?.participants ?? 0;
  return (
    <div className="bg-[#0d1117] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all cursor-pointer group">
      {/* Title + badges */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white mb-2 line-clamp-1">
          {program.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_STYLES[program.trainingType]}`}>
            {program.trainingType.charAt(0) + program.trainingType.slice(1).toLowerCase()}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[program.status]}`}>
            {program.status.charAt(0) + program.status.slice(1).toLowerCase()}
          </span>
          {program.isOnline && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/20 flex items-center gap-1">
              <Wifi size={9} /> Online
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{program.description}</p>
      )}

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-slate-500">
        {program.provider && (
          <div className="flex items-center gap-1.5">
            <Building2 size={10} className="shrink-0" />
            {program.provider}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar size={10} className="shrink-0" />
          {fmt(program.startDate)} – {fmt(program.endDate)}
        </div>
        {program.venue && !program.isOnline && (
          <div className="flex items-center gap-1.5">
            <MapPin size={10} className="shrink-0" />
            {program.venue}
          </div>
        )}
        {program.totalHours && (
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="shrink-0" />
            {program.totalHours} hrs
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <Users size={10} />
          <span>
            {enrolled}
            {program.maxParticipants ? ` / ${program.maxParticipants}` : ""} enrolled
          </span>
        </div>
        {program.cost != null && (
          <div className="flex items-center gap-1 text-slate-500">
            <DollarSign size={10} />
            UGX {program.cost.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateModal({
  open,
  form,
  loading,
  onChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  form: CreateForm;
  loading: boolean;
  onChange: (patch: Partial<CreateForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1117] border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50 sticky top-0 bg-[#0d1117] z-10">
          <h2 className="text-base font-semibold text-white">Create Training Program</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={labelCls}>Program Title *</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={e => onChange({ title: e.target.value })}
              placeholder="e.g. Classroom Management Workshop"
              required
            />
          </div>

          {/* Type + Provider */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type *</label>
              <select
                className={inputCls}
                value={form.trainingType}
                onChange={e => onChange({ trainingType: e.target.value as TrainingType })}
              >
                {(["INTERNAL","EXTERNAL","ONLINE","CONFERENCE","WORKSHOP","CERTIFICATION"] as TrainingType[]).map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Provider</label>
              <input
                className={inputCls}
                value={form.provider}
                onChange={e => onChange({ provider: e.target.value })}
                placeholder="Organisation / trainer name"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={e => onChange({ startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input
                type="date"
                className={inputCls}
                value={form.endDate}
                onChange={e => onChange({ endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Hours / Participants / Cost */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Total Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className={inputCls}
                value={form.totalHours}
                onChange={e => onChange({ totalHours: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Max Participants</label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={form.maxParticipants}
                onChange={e => onChange({ maxParticipants: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className={labelCls}>Cost (UGX)</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.cost}
                onChange={e => onChange({ cost: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Online toggle + venue */}
          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              onClick={() => onChange({ isOnline: !form.isOnline })}
              className={`relative w-9 h-5 rounded-full transition-colors ${form.isOnline ? "bg-blue-600" : "bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isOnline ? "translate-x-4" : ""}`} />
            </button>
            <span className="text-sm text-slate-400">Online / virtual training</span>
          </div>

          {!form.isOnline && (
            <div>
              <label className={labelCls}>Venue</label>
              <input
                className={inputCls}
                value={form.venue}
                onChange={e => onChange({ venue: e.target.value })}
                placeholder="Physical location"
              />
            </div>
          )}

          {form.isOnline && (
            <div>
              <label className={labelCls}>Online Link</label>
              <input
                type="url"
                className={inputCls}
                value={form.venue}
                onChange={e => onChange({ venue: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="What will staff learn? Who should attend?"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <RefreshCw size={13} className="animate-spin" />}
              Create Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrainingClient({ schoolId }: Props) {
  const [programs, setPrograms]       = useState<TrainingProgram[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [createOpen, setCreateOpen]   = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm]               = useState<CreateForm>(INITIAL_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTrainingPrograms(schoolId);
      setPrograms((data as TrainingProgram[]) ?? []);
    } catch {
      setError("Failed to load training programs.");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  function handleChange(patch: Partial<CreateForm>) {
    setForm(f => ({ ...f, ...patch }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const res = await createTrainingProgram({
        schoolId,
        title:           form.title,
        description:     form.description || undefined,
        trainingType:    form.trainingType,
        provider:        form.provider    || undefined,
        venue:           form.venue       || undefined,
        isOnline:        form.isOnline,
        startDate:       new Date(form.startDate),
        endDate:         new Date(form.endDate),
        totalHours:      form.totalHours      ? parseFloat(form.totalHours)      : undefined,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants)   : undefined,
        cost:            form.cost            ? parseFloat(form.cost)            : undefined,
      });
      if (!res.ok) {
        setError(res.message ?? "Failed to create program.");
        return;
      }
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      load();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setFormLoading(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const planned   = programs.filter(p => p.status === "PLANNED").length;
  const ongoing   = programs.filter(p => p.status === "ONGOING").length;
  const completed = programs.filter(p => p.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <BookOpen size={16} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Training & Development</h1>
            </div>
            <p className="text-sm text-slate-500 ml-10">Professional development programs for staff</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} /> New Program
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <XCircle size={16} className="shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto text-red-400/60 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Planned",   value: planned,   color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
            { label: "Ongoing",   value: ongoing,   color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/20" },
            { label: "Completed", value: completed, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                <BookOpen size={16} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <Skeleton />
        ) : programs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(p => <ProgramCard key={p.id} program={p} />)}
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreateModal
        open={createOpen}
        form={form}
        loading={formLoading}
        onChange={handleChange}
        onSubmit={handleCreate}
        onClose={() => { setCreateOpen(false); setForm(INITIAL_FORM); }}
      />
    </div>
  );
}