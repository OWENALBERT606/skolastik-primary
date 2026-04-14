// app/(school)/school/[slug]/staff/offboarding/components/offboarding-client.tsx
"use client";

import { useState, useEffect } from "react";
import { UserX, Plus, RefreshCw, X, AlertCircle, CheckCircle } from "lucide-react";
import { getExitRecords, initiateOffboarding } from "@/actions/staff-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OffboardingClientProps {
  slug:       string;
  schoolId:   string;
  schoolName: string;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  INITIATED:             "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CLEARANCE_IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PENDING_APPROVAL:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  APPROVED:              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  COMPLETED:             "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

const inputCls =
  "w-full bg-[#0f172a] border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm " +
  "text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#6366f1] " +
  "focus:ring-1 focus:ring-[#6366f1]/20 transition-all";

const labelCls = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

const STEPS     = ["Initiated", "Clearance", "Pending Approval", "Approved", "Completed"];
const STEP_MAP: Record<string, number> = {
  INITIATED: 0, CLEARANCE_IN_PROGRESS: 1, PENDING_APPROVAL: 2, APPROVED: 3, COMPLETED: 4,
};

const CLEARANCE_KEYS = ["clearedLibrary","clearedStore","clearedAccounts","clearedIT","clearedHR","assetsReturned"] as const;
const CLEARANCE_LABELS: Record<string, string> = {
  clearedLibrary:  "Library",
  clearedStore:    "Store",
  clearedAccounts: "Accounts",
  clearedIT:       "IT",
  clearedHR:       "HR",
  assetsReturned:  "Assets",
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, open, onClose, children }: {
  title: string; open: boolean; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1117] border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-700/50 bg-[#0d1117]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Exit Record Card ─────────────────────────────────────────────────────────

function ExitCard({ record }: { record: any }) {
  const step    = STEP_MAP[record.status] ?? 0;
  const cleared = CLEARANCE_KEYS.filter(k => record[k]).length;

  return (
    <div className="bg-[#0d1117] border border-slate-800/80 hover:border-slate-700/60 rounded-2xl p-5 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
            {record.staff.firstName[0]}{record.staff.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {record.staff.firstName} {record.staff.lastName}
            </p>
            <p className="text-xs font-mono text-slate-500">{record.staff.staffId}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[record.status] ?? ""}`}>
            {record.status.replace(/_/g, " ")}
          </span>
          <p className="text-xs text-slate-500 mt-1">{record.exitType.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-red-500/80" : "bg-slate-800"}`} />
        ))}
      </div>
      <div className="flex justify-between text-xs mb-4">
        {STEPS.map((s, i) => (
          <span key={s} className={`${i === 0 ? "" : "text-center flex-1"} ${i <= step ? "text-red-400/80" : "text-slate-700"}`}>{s}</span>
        ))}
      </div>

      {/* Clearance grid */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {CLEARANCE_KEYS.map(k => (
          <div key={k} className="text-center">
            <div className={`h-1.5 rounded-full mb-1 ${record[k] ? "bg-emerald-500" : "bg-slate-800"}`} />
            <span className="text-xs text-slate-600">{CLEARANCE_LABELS[k]}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/60">
        <span>{cleared}/{CLEARANCE_KEYS.length} departments cleared</span>
        <span>Exit: {new Date(record.exitDate).toLocaleDateString()}</span>
      </div>

      {/* Settlement indicators */}
      {(record.finalSalaryPaid || record.gratuityPaid || record.experienceLetterIssued) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/60">
          {record.finalSalaryPaid    && <span className="flex items-center gap-1 text-xs text-emerald-500/70"><CheckCircle size={11}/> Final salary paid</span>}
          {record.gratuityPaid       && <span className="flex items-center gap-1 text-xs text-emerald-500/70"><CheckCircle size={11}/> Gratuity paid</span>}
          {record.experienceLetterIssued && <span className="flex items-center gap-1 text-xs text-emerald-500/70"><CheckCircle size={11}/> Experience letter issued</span>}
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function OffboardingClient({ schoolId, schoolName }: OffboardingClientProps) {
  const [records, setRecords]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [initiateOpen, setInitiateOpen] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    staffId:   "",
    exitType:  "RESIGNATION",
    exitDate:  "",
    noticeDate: "",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getExitRecords(schoolId);
      setRecords(data as any[]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleInitiate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.staffId.trim()) { setErr("Staff ID is required."); return; }
    if (!form.exitDate)        { setErr("Exit date is required."); return; }
    setSaving(true); setErr("");
    try {
      const res = await initiateOffboarding({
        schoolId,
        staffId:    form.staffId,
        exitType:   form.exitType as any,
        exitDate:   new Date(form.exitDate),
        noticeDate: form.noticeDate ? new Date(form.noticeDate) : undefined,
      });
      if (!res.ok) { setErr(res.message); return; }
      setInitiateOpen(false);
      setForm({ staffId: "", exitType: "RESIGNATION", exitDate: "", noticeDate: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  const statuses = ["ALL", "INITIATED", "CLEARANCE_IN_PROGRESS", "PENDING_APPROVAL", "APPROVED", "COMPLETED"];
  const filtered = records.filter(r => statusFilter === "ALL" || r.status === statusFilter);

  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                <UserX size={18} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Offboarding</h1>
            </div>
            <p className="text-sm text-slate-500">{schoolName} — exit and clearance workflows</p>
          </div>
          <button
            onClick={() => { setErr(""); setInitiateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all"
          >
            <Plus size={16} /> Initiate Exit
          </button>
        </div>

        {/* Summary stats */}
        {records.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {["INITIATED","CLEARANCE_IN_PROGRESS","PENDING_APPROVAL","APPROVED","COMPLETED"].map(s => {
              const count = records.filter(r => r.status === s).length;
              return (
                <div key={s} className="bg-[#0d1117] border border-slate-800/80 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.replace(/_/g, " ")}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                statusFilter === s ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#0d1117] border border-slate-800/80 rounded-2xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
              <UserX size={26} className="text-red-500/40" />
            </div>
            <p className="text-sm font-medium text-slate-400">No offboarding records</p>
            <p className="text-xs text-slate-600 mt-1">Initiated exits will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => <ExitCard key={r.id} record={r} />)}
          </div>
        )}
      </div>

      {/* Initiate Modal */}
      <Modal title="Initiate Offboarding" open={initiateOpen} onClose={() => setInitiateOpen(false)}>
        <form onSubmit={handleInitiate} className="p-6 space-y-4">
          {err && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={13} /> {err}
            </div>
          )}
          <div>
            <label className={labelCls}>Staff Database ID *</label>
            <input className={inputCls} placeholder="e.g. clxyz123…"
              value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))} />
            <p className="text-xs text-slate-600 mt-1">The internal Staff.id (cuid), not the staff number</p>
          </div>
          <div>
            <label className={labelCls}>Exit Type</label>
            <select className={inputCls} value={form.exitType}
              onChange={e => setForm(f => ({ ...f, exitType: e.target.value }))}>
              {["RESIGNATION","RETIREMENT","TERMINATION","REDUNDANCY","CONTRACT_EXPIRY","TRANSFER","DEATH"].map(t => (
                <option key={t} value={t}>{t.replace(/_/g," ")}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Notice Date</label>
              <input type="date" className={inputCls} value={form.noticeDate}
                onChange={e => setForm(f => ({ ...f, noticeDate: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Exit Date *</label>
              <input type="date" className={inputCls} value={form.exitDate}
                onChange={e => setForm(f => ({ ...f, exitDate: e.target.value }))} required />
            </div>
          </div>
          <div className="rounded-lg p-3 text-xs bg-amber-500/8 border border-amber-500/15 text-amber-400/80">
            ⚠️ This will set the staff member's status to RESIGNED and begin the clearance workflow.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setInitiateOpen(false)}
              className="flex-1 py-2.5 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
              {saving && <RefreshCw size={13} className="animate-spin" />} Initiate Exit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}