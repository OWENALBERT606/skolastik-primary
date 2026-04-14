// app/(school)/school/[slug]/staff/attendance/components/attendance-client.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Plus, RefreshCw, X, CheckCircle, XCircle,
  AlarmClock, Umbrella, ChevronDown,
} from "lucide-react";
import {
  getAttendanceRecords,
  bulkMarkAttendance,
} from "@/actions/staff-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus =
  | "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY"
  | "ON_LEAVE" | "PUBLIC_HOLIDAY" | "WEEKEND" | "EXCUSED";

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string | Date;
  status: AttendanceStatus;
  checkInTime?: string | Date | null;
  checkOutTime?: string | Date | null;
  hoursWorked?: number | null;
  lateMinutes?: number | null;
  lateReason?: string | null;
  absenceReason?: string | null;
  notes?: string | null;
  isManualEntry: boolean;
  staff: {
    firstName: string;
    lastName: string;
    staffId: string;
  };
  enteredBy?: { name: string } | null;
}

interface BulkEntry {
  staffId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

interface Props {
  schoolId: string;
  schoolName: string;
  slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const STATUS_DOT: Record<string, string> = {
  PRESENT:        "bg-blue-500 dark:bg-blue-400",
  ABSENT:         "bg-red-500 dark:bg-red-400",
  LATE:           "bg-amber-500 dark:bg-amber-400",
  HALF_DAY:       "bg-orange-500 dark:bg-orange-400",
  ON_LEAVE:       "bg-blue-500 dark:bg-blue-400",
  PUBLIC_HOLIDAY: "bg-blue-500 dark:bg-blue-400",
  WEEKEND:        "bg-slate-400 dark:bg-slate-400",
  EXCUSED:        "bg-indigo-500 dark:bg-indigo-400",
};

const STATUS_BADGE: Record<string, string> = {
  PRESENT:        "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  ABSENT:         "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  LATE:           "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  HALF_DAY:       "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
  ON_LEAVE:       "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  PUBLIC_HOLIDAY: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  WEEKEND:        "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20",
  EXCUSED:        "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20",
};

const STATUS_OPTIONS: AttendanceStatus[] = [
  "PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE", "EXCUSED",
];

function fmtTime(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(s: string) {
  const sp = s.replace(/_/g, " ");
  return sp.charAt(0) + sp.slice(1).toLowerCase();
}

const inputCls =
  "w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800/60 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ date }: { date: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-3">
        <Activity size={22} className="text-slate-400 dark:text-slate-600" />
      </div>
      <p className="text-sm text-slate-500">
        No attendance records for{" "}
        {new Date(date + "T00:00:00").toLocaleDateString("en-UG", {
          weekday: "long", day: "numeric", month: "long",
        })}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
        Use "Mark Attendance" to record for this date
      </p>
    </div>
  );
}

function BulkMarkModal({
  open, date, loading, entries,
  onChangeEntry, onAddEntry, onRemoveEntry, onSubmit, onClose,
}: {
  open: boolean;
  date: string;
  loading: boolean;
  entries: BulkEntry[];
  onChangeEntry: (idx: number, patch: Partial<BulkEntry>) => void;
  onAddEntry: () => void;
  onRemoveEntry: (idx: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 sticky top-0 bg-white dark:bg-[#0d1117] z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Mark Attendance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(date + "T00:00:00").toLocaleDateString("en-UG", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_130px_90px_90px_1fr_32px] gap-2 px-1">
            {["Staff ID", "Status", "Check In", "Check Out", "Notes", ""].map(h => (
              <span key={h} className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>

          {/* Entry rows */}
          {entries.map((entry, i) => (
            <div key={i} className="grid grid-cols-[1fr_130px_90px_90px_1fr_32px] gap-2 items-center">
              <input
                className={inputCls}
                value={entry.staffId}
                onChange={e => onChangeEntry(i, { staffId: e.target.value })}
                placeholder="Staff ID"
                required
              />
              <div className="relative">
                <select
                  className={inputCls + " appearance-none pr-7"}
                  value={entry.status}
                  onChange={e => onChangeEntry(i, { status: e.target.value as AttendanceStatus })}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                />
              </div>
              <input
                type="time"
                className={inputCls}
                value={entry.checkInTime ?? ""}
                onChange={e => onChangeEntry(i, { checkInTime: e.target.value || undefined })}
                disabled={["ABSENT", "ON_LEAVE", "EXCUSED"].includes(entry.status)}
              />
              <input
                type="time"
                className={inputCls}
                value={entry.checkOutTime ?? ""}
                onChange={e => onChangeEntry(i, { checkOutTime: e.target.value || undefined })}
                disabled={["ABSENT", "ON_LEAVE", "EXCUSED"].includes(entry.status)}
              />
              <input
                className={inputCls}
                value={entry.notes ?? ""}
                onChange={e => onChangeEntry(i, { notes: e.target.value || undefined })}
                placeholder="Optional note"
              />
              <button
                type="button"
                onClick={() => onRemoveEntry(i)}
                className="text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                disabled={entries.length === 1}
              >
                <X size={15} />
              </button>
            </div>
          ))}

          {/* Add row */}
          <button
            type="button"
            onClick={onAddEntry}
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-1"
          >
            <Plus size={13} /> Add another staff member
          </button>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <RefreshCw size={13} className="animate-spin" />}
              Submit Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const BLANK_ENTRY = (): BulkEntry => ({
  staffId: "", status: "PRESENT",
  checkInTime: "", checkOutTime: "", notes: "",
});

export default function AttendanceClient({ schoolId }: Props) {
  const [records, setRecords]           = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [error, setError]               = useState("");
  const [bulkOpen, setBulkOpen]         = useState(false);
  const [bulkEntries, setBulkEntries]   = useState<BulkEntry[]>([BLANK_ENTRY()]);
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const from = new Date(selectedDate + "T00:00:00");
      const to   = new Date(selectedDate + "T23:59:59");
      const data = await getAttendanceRecords(schoolId, { from, to });
      setRecords((data as AttendanceRecord[]) ?? []);
    } catch {
      setError("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedDate]);

  useEffect(() => { load(); }, [load]);

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBulkLoading(true);
    setError("");
    try {
      const res = await bulkMarkAttendance(
        schoolId,
        new Date(selectedDate + "T00:00:00"),
        bulkEntries.map(en => ({
          staffId:      en.staffId,
          status:       en.status,
          checkInTime:  en.checkInTime  ? new Date(`${selectedDate}T${en.checkInTime}`) : undefined,
          checkOutTime: en.checkOutTime ? new Date(`${selectedDate}T${en.checkOutTime}`) : undefined,
          lateMinutes:  undefined,
          notes:        en.notes || undefined,
        })),
      );
      if (!res.ok) {
        setError(res.message ?? "Failed to mark attendance.");
        return;
      }
      setBulkOpen(false);
      setBulkEntries([BLANK_ENTRY()]);
      load();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleChangeEntry(idx: number, patch: Partial<BulkEntry>) {
    setBulkEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }

  const present = records.filter(r => r.status === "PRESENT").length;
  const absent  = records.filter(r => r.status === "ABSENT").length;
  const late    = records.filter(r => r.status === "LATE").length;
  const onLeave = records.filter(r => r.status === "ON_LEAVE").length;

  const displayed = filterStatus ? records.filter(r => r.status === filterStatus) : records;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c10] text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                <Activity size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance</h1>
            </div>
            <p className="text-sm text-slate-500 ml-10">Daily staff attendance tracking and records</p>
          </div>
          <button
            onClick={() => { setBulkEntries([BLANK_ENTRY()]); setBulkOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} /> Mark Attendance
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <XCircle size={16} className="shrink-0" />
            {error}
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-400 dark:text-red-400/60 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stats — clickable filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Present",  value: present, icon: CheckCircle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", status: "PRESENT" },
            { label: "Absent",   value: absent,  icon: XCircle,     color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/20",     status: "ABSENT" },
            { label: "Late",     value: late,    icon: AlarmClock,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/20", status: "LATE" },
            { label: "On Leave", value: onLeave, icon: Umbrella,    color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/20",   status: "ON_LEAVE" },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setFilterStatus(prev => prev === s.status ? "" : s.status)}
              className={`bg-white dark:bg-[#0d1117] border rounded-xl p-4 flex items-center gap-3 text-left transition-all ${
                filterStatus === s.status
                  ? `${s.border} ${s.bg}`
                  : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {filterStatus && (
            <button
              onClick={() => setFilterStatus("")}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X size={12} /> Clear filter
            </button>
          )}
          <button
            onClick={load}
            className="p-2.5 bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <Skeleton />
        ) : records.length === 0 ? (
          <EmptyState date={selectedDate} />
        ) : (
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            {filterStatus && displayed.length < records.length && (
              <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/60 text-xs text-slate-500">
                Showing {displayed.length} of {records.length} records{" — "}
                <button
                  onClick={() => setFilterStatus("")}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  show all
                </button>
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left">Staff</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Check In</th>
                  <th className="px-5 py-3.5 text-center">Check Out</th>
                  <th className="px-5 py-3.5 text-center">Hours</th>
                  <th className="px-5 py-3.5 text-left">Notes</th>
                  <th className="px-5 py-3.5 text-right">Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayed.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">

                    {/* Staff */}
                    <td className="px-5 py-4">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {r.staff.firstName} {r.staff.lastName}
                      </p>
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{r.staff.staffId}</p>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${STATUS_BADGE[r.status] ?? ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? "bg-slate-400"}`} />
                        {statusLabel(r.status)}
                      </span>
                    </td>

                    {/* Times */}
                    <td className="px-5 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      {fmtTime(r.checkInTime)}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      {fmtTime(r.checkOutTime)}
                    </td>

                    {/* Hours */}
                    <td className="px-5 py-4 text-center">
                      {r.hoursWorked != null
                        ? <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{r.hoursWorked.toFixed(1)}h</span>
                        : <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                      }
                      {r.lateMinutes && r.lateMinutes > 0 ? (
                        <p className="text-xs text-amber-500 mt-0.5">{r.lateMinutes}m late</p>
                      ) : null}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-[180px] truncate">
                      {r.notes ?? r.lateReason ?? r.absenceReason ?? "—"}
                    </td>

                    {/* Entry type */}
                    <td className="px-5 py-4 text-right">
                      {r.isManualEntry ? (
                        <span className="text-xs text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                          Manual
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600 dark:text-blue-600/60 bg-blue-50 dark:bg-blue-500/5 px-2 py-0.5 rounded-full">
                          System
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk mark modal */}
      <BulkMarkModal
        open={bulkOpen}
        date={selectedDate}
        loading={bulkLoading}
        entries={bulkEntries}
        onChangeEntry={handleChangeEntry}
        onAddEntry={() => setBulkEntries(prev => [...prev, BLANK_ENTRY()])}
        onRemoveEntry={idx => setBulkEntries(prev => prev.filter((_, i) => i !== idx))}
        onSubmit={handleBulkSubmit}
        onClose={() => { setBulkOpen(false); setBulkEntries([BLANK_ENTRY()]); }}
      />
    </div>
  );
}