// app/(school)/school/[slug]/staff/leave/components/leave-client.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, CheckCircle, XCircle, RefreshCw, X, Clock, TrendingUp,
} from "lucide-react";
import {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/actions/staff-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string | Date;
  endDate: string | Date;
  daysRequested: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  approvedAt?: string | Date | null;
  rejectionReason?: string | null;
  staff: {
    firstName: string;
    lastName: string;
    staffId: string;
  };
  approvedBy?: { name: string } | null;
}

interface Props {
  schoolId: string;
  schoolName: string;
  slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED:  "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  COMPLETED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL:       "Annual",
  SICK:         "Sick",
  MATERNITY:    "Maternity",
  PATERNITY:    "Paternity",
  COMPASSIONATE:"Compassionate",
  STUDY:        "Study",
  UNPAID:       "Unpaid",
  OTHER:        "Other",
};

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
}

const inputCls =
  "w-full bg-[#0f172a] border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20 transition-all";
const labelCls =
  "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-[#0d1117] border border-slate-800/60 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-3">
        <Calendar size={22} className="text-slate-600" />
      </div>
      <p className="text-sm text-slate-500">No leave requests found</p>
      <p className="text-xs text-slate-600 mt-1">Staff requests will appear here</p>
    </div>
  );
}

function RejectModal({
  open,
  loading,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1117] border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
          <h2 className="text-base font-semibold text-white">Reject Leave Request</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Rejection Reason *</label>
            <textarea
              className={inputCls}
              rows={3}
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder="Provide a clear reason for rejection..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!reason.trim() || loading}
              className="flex-1 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <RefreshCw size={13} className="animate-spin" />}
              Reject Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LeaveClient({ schoolId }: Props) {
  const [requests, setRequests]       = useState<LeaveRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string>("");
  const [error, setError]             = useState<string>("");

  // Reject modal state
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLeaveRequests(schoolId, {
        status: (filterStatus as any) || undefined,
      });
      setRequests((data as LeaveRequest[]) ?? []);
    } catch {
      setError("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }, [schoolId, filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await approveLeaveRequest(id);
      if (!res.ok) setError(res.message ?? "Failed to approve");
      else load();
    } finally {
      setActionLoading("");
    }
  }

  async function handleRejectConfirm() {
    if (!rejectId || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      const res = await rejectLeaveRequest(rejectId, rejectReason);
      if (!res.ok) setError(res.message ?? "Failed to reject");
      else { setRejectId(null); setRejectReason(""); load(); }
    } finally {
      setRejectLoading(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const pending   = requests.filter(r => r.status === "PENDING").length;
  const approved  = requests.filter(r => r.status === "APPROVED").length;
  const totalDays = requests
    .filter(r => r.status === "APPROVED")
    .reduce((s, r) => s + r.daysRequested, 0);

  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Calendar size={16} className="text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Leave Management</h1>
            </div>
            <p className="text-sm text-slate-500 ml-10.5">Review and manage staff leave requests</p>
          </div>
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
            { label: "Pending Approval",    value: pending,   icon: Clock,       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
            { label: "Approved (Active)",   value: approved,  icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Total Days Approved", value: totalDays, icon: TrendingUp,  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Requests</option>
            {["PENDING","APPROVED","REJECTED","CANCELLED","COMPLETED"].map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="p-2 bg-[#0d1117] border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <Skeleton />
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-[#0d1117] border border-slate-800/80 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/40 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left">Staff</th>
                  <th className="px-5 py-3.5 text-left">Leave Type</th>
                  <th className="px-5 py-3.5 text-left">Period</th>
                  <th className="px-5 py-3.5 text-center">Days</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-slate-200 font-medium">
                        {r.staff.firstName} {r.staff.lastName}
                      </p>
                      <p className="text-xs font-mono text-slate-500">{r.staff.staffId}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {fmt(r.startDate)} – {fmt(r.endDate)}
                    </td>
                    <td className="px-5 py-4 text-center text-slate-200 font-semibold">
                      {r.daysRequested}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status] ?? ""}`}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actionLoading === r.id}
                            title="Approve"
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {actionLoading === r.id
                              ? <RefreshCw size={15} className="animate-spin" />
                              : <CheckCircle size={16} />
                            }
                          </button>
                          <button
                            onClick={() => { setRejectId(r.id); setRejectReason(""); }}
                            title="Reject"
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : r.approvedBy ? (
                        <span className="text-xs text-slate-600">
                          By {r.approvedBy.name}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      <RejectModal
        open={!!rejectId}
        loading={rejectLoading}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectConfirm}
        onClose={() => { setRejectId(null); setRejectReason(""); }}
      />
    </div>
  );
}