"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Plus, RefreshCw, ChevronRight, CheckCircle, Clock,
  X, AlertCircle, Users, TrendingUp, CreditCard, FileText,
  BarChart2, Send, BadgeCheck, Banknote, Loader2,
  ShieldCheck, Calculator, Gift, Minus, Play, Info,
} from "lucide-react";
import {
  getPayrollBatches, getPayrollBatchById,
  submitBatchForApproval, approveBatch, markBatchAsPaid,
  getPayrollSummary,
} from "@/actions/staff-actions";
import { createPayrollBatch, PayrollOptions } from "@/actions/payroll-batch";

// ─── Note: generateStatutoryReport is not yet implemented in staff-actions.
// When you add it, uncomment the import and the statutory buttons below.
// import { generateStatutoryReport } from "@/actions/staff-actions";

interface Props {
  slug: string;
  schoolId: string; // real DB id resolved by the server page — NOT the slug
  schoolName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH_STATUS_STYLES: Record<string, string> = {
  DRAFT:      "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  REVIEW:     "bg-violet-50 text-violet-700 border-violet-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  APPROVED:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  PAID:       "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
  CANCELLED:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DEFAULT_OPTIONS: PayrollOptions = {
  applyAllowances:         true,
  applyNSSF:               true,
  applyPAYE:               true,
  applyLoanDeductions:     true,
  applyAdvanceDeductions:  true,
  applyStandingDeductions: true,
  generatePayslips:        false,
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 " +
  "bg-white border border-gray-200 text-black placeholder-gray-300 " +
  "focus:border-blue-500 focus:ring-blue-300/30 " +
  "dark:bg-[#0f172a] dark:border-slate-700/60 dark:text-slate-200 dark:placeholder-slate-500 " +
  "dark:focus:border-[#6366f1] dark:focus:ring-[#6366f1]/20";

const labelCls =
  "block text-xs font-medium mb-1.5 uppercase tracking-wider text-gray-500 dark:text-slate-400";

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title, open, onClose, children, width = "max-w-lg",
}: {
  title: string; open: boolean; onClose: () => void;
  children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl bg-white border border-gray-200 dark:bg-[#0d1117] dark:border-slate-700/50`}>
        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 z-10 border-gray-200 bg-white dark:border-slate-700/50 dark:bg-[#0d1117]">
          <h2 className="text-base font-semibold text-black dark:text-white">{title}</h2>
          <button onClick={onClose} className="transition-colors text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Toggle row (used in RunPayrollModal) ────────────────────────────────────

function ToggleRow({
  icon: Icon, label, description, value, onChange,
  color = "text-blue-600 dark:text-[#a5b4fc]",
  bgColor = "bg-blue-100 dark:bg-[#6366f1]/15",
  warn,
}: {
  icon: React.ElementType; label: string; description: string;
  value: boolean; onChange: (v: boolean) => void;
  color?: string; bgColor?: string; warn?: string;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
        ${value
          ? "border-blue-200 bg-blue-50/50 dark:border-[#6366f1]/30 dark:bg-[#6366f1]/5"
          : "border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900/40"}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bgColor}`}>
        <Icon size={15} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${value ? "text-black dark:text-white" : "text-gray-500 dark:text-slate-400"}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 leading-snug">{description}</p>
        {warn && !value && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <AlertCircle size={11} /> {warn}
          </p>
        )}
      </div>
      {/* Toggle pill */}
      <div className={`relative w-10 h-5 rounded-full shrink-0 mt-1 transition-colors ${value ? "bg-blue-600 dark:bg-[#6366f1]" : "bg-gray-200 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${value ? "left-5" : "left-0.5"}`} />
      </div>
    </div>
  );
}

function ToggleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 px-1">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Run Payroll Modal (replaces old CreateBatchModal) ───────────────────────

function RunPayrollModal({
  open, onClose, schoolId, onSuccess,
}: {
  open: boolean; onClose: () => void; schoolId: string; onSuccess: () => void;
}) {
  const now = new Date();
  const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
  const [payYear,  setPayYear]  = useState(now.getFullYear());
  const [opts, setOpts] = useState<PayrollOptions>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState<any>(null);

  const toggle = (key: keyof PayrollOptions) =>
    setOpts(o => ({ ...o, [key]: !o[key] }));

  const handleClose = () => {
    if (loading) return;
    setError(""); setSuccess(null);
    setOpts(DEFAULT_OPTIONS);
    onClose();
  };

  async function handleRun() {
    setLoading(true); setError("");
    try {
      const res = await createPayrollBatch({ schoolId, payMonth, payYear, options: opts });
      if (!res.ok) { setError(res.message); return; }
      setSuccess(res.data);
      onSuccess();
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const activeCount = Object.values(opts).filter(Boolean).length;

  return (
    <Modal title="Run Payroll" open={open} onClose={handleClose}>
      <div className="p-6 space-y-6">

        {/* ── Success ── */}
        {success && (
          <div className="rounded-xl border p-4 space-y-3 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium text-sm">
              <CheckCircle size={16} /> Payroll batch created successfully!
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Batch",        success.batchNumber],
                ["Period",       success.payPeriod],
                ["Staff",        success.processedCount],
                ["Net Payroll",  `UGX ${Number(success.totalNetSalary ?? 0).toLocaleString()}`],
                ["NSSF",         opts.applyNSSF ? `UGX ${Number(success.totalNSSF ?? 0).toLocaleString()}` : "Skipped"],
                ["PAYE",         opts.applyPAYE ? `UGX ${Number(success.totalPAYE ?? 0).toLocaleString()}` : "Skipped"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg p-2 bg-white/60 dark:bg-blue-900/30">
                  <p className="text-blue-600 dark:text-blue-400 font-medium">{k}</p>
                  <p className="text-blue-800 dark:text-blue-200 font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <button onClick={handleClose} className="w-full py-2 text-sm rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        )}

        {!success && (
          <>
            {/* Period */}
            <ToggleSection title="Pay Period">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Month</label>
                  <select className={inputCls} value={payMonth} onChange={e => setPayMonth(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <select className={inputCls} value={payYear} onChange={e => setPayYear(Number(e.target.value))}>
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg p-3 text-xs bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>
                  Payroll runs for all <strong>ACTIVE</strong> staff.
                  Components toggled <strong>OFF</strong> are skipped entirely — not calculated or stored.
                </span>
              </div>
            </ToggleSection>

            {/* Earnings */}
            <ToggleSection title="Earnings">
              <ToggleRow icon={Gift} label="Standing Allowances"
                description="Housing, transport, responsibility and other recurring allowances configured per staff"
                value={opts.applyAllowances} onChange={() => toggle("applyAllowances")}
                color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-100 dark:bg-blue-500/15"
              />
            </ToggleSection>

            {/* Statutory */}
            <ToggleSection title="Statutory Deductions">
              <ToggleRow icon={ShieldCheck} label="NSSF"
                description="5% employee + 10% employer contribution on gross salary"
                value={opts.applyNSSF} onChange={() => toggle("applyNSSF")}
                warn="Skipping NSSF may have compliance implications"
                color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-100 dark:bg-blue-500/15"
              />
              <ToggleRow icon={Calculator} label="PAYE Tax"
                description="Uganda Revenue Authority tax brackets applied on taxable income"
                value={opts.applyPAYE} onChange={() => toggle("applyPAYE")}
                warn="Skipping PAYE may have compliance implications"
                color="text-orange-600 dark:text-orange-400" bgColor="bg-orange-100 dark:bg-orange-500/15"
              />
            </ToggleSection>

            {/* Loan & advance recoveries */}
            <ToggleSection title="Loan & Advance Recoveries">
              <ToggleRow icon={CreditCard} label="Loan Repayments"
                description="Monthly instalments for all active staff loans"
                value={opts.applyLoanDeductions} onChange={() => toggle("applyLoanDeductions")}
                color="text-rose-600 dark:text-rose-400" bgColor="bg-rose-100 dark:bg-rose-500/15"
              />
              <ToggleRow icon={CreditCard} label="Salary Advance Recoveries"
                description="Monthly recovery amounts for disbursed salary advances"
                value={opts.applyAdvanceDeductions} onChange={() => toggle("applyAdvanceDeductions")}
                color="text-pink-600 dark:text-pink-400" bgColor="bg-pink-100 dark:bg-pink-500/15"
              />
            </ToggleSection>

            {/* Other deductions */}
            <ToggleSection title="Other Deductions">
              <ToggleRow icon={Minus} label="Standing Deductions"
                description="Welfare, savings, union dues and other recurring deductions"
                value={opts.applyStandingDeductions} onChange={() => toggle("applyStandingDeductions")}
                color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-100 dark:bg-amber-500/15"
              />
            </ToggleSection>

            {/* Output */}
            <ToggleSection title="Output">
              <ToggleRow icon={FileText} label="Generate Payslips"
                description="Creates downloadable payslip records for each staff member"
                value={opts.generatePayslips} onChange={() => toggle("generatePayslips")}
                color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-100 dark:bg-violet-500/15"
              />
            </ToggleSection>

            {/* Summary strip */}
            <div className="rounded-xl border p-3 flex items-center justify-between bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/40">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                <span className="font-semibold text-black dark:text-white">{activeCount}</span> of {Object.keys(opts).length} components active
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {MONTHS[payMonth - 1]} {payYear}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl p-3 text-sm bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3">
              <button onClick={handleClose} disabled={loading}
                className="flex-1 py-2.5 text-sm rounded-xl border transition-colors disabled:opacity-40 text-gray-600 bg-white border-gray-200 hover:bg-gray-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={handleRun} disabled={loading}
                className="flex-1 py-2.5 text-sm text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><Play size={14} /> Run {MONTHS[payMonth - 1]} Payroll</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Batch detail modal ───────────────────────────────────────────────────────

function BatchDetailModal({
  batchId, open, onClose, schoolId, onSuccess,
}: {
  batchId: string | null; open: boolean; onClose: () => void;
  schoolId: string; onSuccess: () => void;
}) {
  const [batch,          setBatch]          = useState<any>(null);
  const [batchLoading,   setBatchLoading]   = useState(false);
  const [actionLoading,  setActionLoading]  = useState("");
  const [paymentRef,     setPaymentRef]     = useState("");
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [actionError,    setActionError]    = useState("");

  useEffect(() => {
    if (open && batchId) {
      setBatch(null); setBatchLoading(true);
      getPayrollBatchById(batchId)
        .then(d => setBatch(d))
        .finally(() => setBatchLoading(false));
    }
  }, [open, batchId]);

  async function handleAction(
    key: string,
    fn: () => Promise<{ ok: boolean; message: string }>,
  ) {
    setActionLoading(key); setActionError("");
    try {
      const res = await fn();
      if (!res.ok) { setActionError(res.message); return; }
      onSuccess(); onClose();
    } catch (e: any) {
      setActionError(e?.message ?? "Action failed");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <Modal
      title={batch ? `Payroll — ${batch.payPeriod}` : "Loading…"}
      open={open}
      onClose={() => { if (actionLoading) return; onClose(); }}
      width="max-w-3xl"
    >
      <div className="p-6 space-y-6">

        {/* Loading skeleton */}
        {batchLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-slate-800" />
              ))}
            </div>
            <div className="h-32 rounded-xl bg-gray-100 dark:bg-slate-800" />
          </div>
        )}

        {!batchLoading && batch && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Staff",   value: batch.totalStaffCount,                              cls: "text-black dark:text-white" },
                { label: "Gross Payroll", value: `${(batch.totalGrossSalary / 1_000_000).toFixed(2)}M`, cls: "text-black dark:text-white" },
                { label: "Net Payroll",   value: `${(batch.totalNetSalary   / 1_000_000).toFixed(2)}M`, cls: "text-blue-600 dark:text-blue-400" },
                { label: "Total NSSF",    value: `${(batch.totalNSSF        / 1_000).toFixed(0)}K`,     cls: "text-amber-600 dark:text-amber-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 border text-center bg-gray-50 border-gray-200 dark:bg-slate-800/40 dark:border-slate-700/30">
                  <p className="text-xs mb-1 text-gray-500 dark:text-slate-500">{s.label}</p>
                  <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Deductions summary */}
            <div className="rounded-xl p-4 border bg-gray-50 border-gray-200 dark:bg-slate-800/20 dark:border-slate-700/30">
              <p className="text-xs uppercase tracking-wider mb-3 text-gray-500 dark:text-slate-500">Deductions Summary</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-slate-500">Total Deductions</p>
                  <p className="text-red-600 font-semibold dark:text-red-400">UGX {batch.totalDeductions?.toLocaleString() ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-500">Total PAYE</p>
                  <p className="text-orange-600 font-semibold dark:text-orange-400">UGX {batch.totalPAYE?.toLocaleString() ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-500">Total NSSF</p>
                  <p className="text-amber-600 font-semibold dark:text-amber-400">UGX {batch.totalNSSF?.toLocaleString() ?? "—"}</p>
                </div>
              </div>
            </div>

            {/* Staff lines table */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-3 text-gray-500 dark:text-slate-500">Staff Payroll Lines</p>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase bg-gray-50 text-gray-500 dark:bg-slate-800/50 dark:text-slate-500">
                      <th className="px-4 py-3 text-left">Staff</th>
                      <th className="px-4 py-3 text-right">Basic</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Deductions</th>
                      <th className="px-4 py-3 text-right font-semibold">Net</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30">
                    {batch.payrolls?.map((p: any) => (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3">
                          <p className="font-medium text-black dark:text-slate-200">{p.staff.firstName} {p.staff.lastName}</p>
                          <p className="text-xs font-mono text-gray-400 dark:text-slate-500">{p.staff.staffId}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 dark:text-slate-400">{(p.basicSalary / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-300">{(p.grossSalary / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">-{(p.totalDeductions / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{(p.netSalary / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${BATCH_STATUS_STYLES[p.status] ?? ""}`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action error */}
            {actionError && (
              <div className="flex items-start gap-2 rounded-xl p-3 text-sm bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> {actionError}
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-5 space-y-3 border-gray-200 dark:border-slate-700/50">

              {/* Statutory reports — uncomment when generateStatutoryReport is implemented */}
              {/* <div className="flex gap-2 flex-wrap">
                <p className="text-xs w-full mb-1 text-gray-500 dark:text-slate-500">Generate Statutory Reports:</p>
                {["NSSF","PAYE","PAYROLL_SUMMARY"].map(type => (
                  <button key={type} onClick={() => handleStatutory(type)} disabled={actionLoading === type}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700/50">
                    {actionLoading === type ? <RefreshCw size={11} className="animate-spin" /> : <FileText size={11} />}
                    {type.replace(/_/g," ")}
                  </button>
                ))}
              </div> */}

              <div className="flex gap-3 flex-wrap">
                {batch.status === "DRAFT" && (
                  <button
                    onClick={() => handleAction("submit", () => submitBatchForApproval(batchId!))}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 bg-violet-600 hover:bg-violet-700"
                  >
                    {actionLoading === "submit" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit for Approval
                  </button>
                )}
                {batch.status === "REVIEW" && (
                  <button
                    onClick={() => handleAction("approve", () => approveBatch(batchId!))}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
                  >
                    {actionLoading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                    Approve Batch
                  </button>
                )}
                {batch.status === "APPROVED" && !payConfirmOpen && (
                  <button onClick={() => setPayConfirmOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors bg-teal-600 hover:bg-teal-700">
                    <Banknote size={14} /> Mark as Paid
                  </button>
                )}
                {payConfirmOpen && (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <input
                      value={paymentRef}
                      onChange={e => setPaymentRef(e.target.value)}
                      placeholder="Payment reference / bank receipt no."
                      className="flex-1 min-w-48 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white border border-gray-200 text-black focus:border-blue-500 dark:bg-[#0f172a] dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#6366f1]"
                    />
                    <button
                      onClick={() => handleAction("pay", () =>
                        markBatchAsPaid(batchId!, { paymentRef, paymentMethod: "BANK_TRANSFER" })
                      )}
                      disabled={!paymentRef || !!actionLoading}
                      className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                    >
                      {actionLoading === "pay" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Confirm
                    </button>
                    <button onClick={() => setPayConfirmOpen(false)}
                      className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Batch card ───────────────────────────────────────────────────────────────

function BatchCard({ batch, onOpen }: { batch: any; onOpen: () => void }) {
  const statusFlow  = ["DRAFT", "REVIEW", "APPROVED", "PAID"];
  const currentStep = statusFlow.indexOf(batch.status);

  return (
    <div
      onClick={onOpen}
      className="group border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg bg-white border-gray-200 hover:border-gray-300 hover:shadow-gray-100/60 dark:bg-[#0d1117] dark:border-slate-800/80 dark:hover:border-[#6366f1]/30 dark:hover:shadow-[#6366f1]/5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-black dark:text-white">{batch.payPeriod}</h3>
          <p className="text-xs font-mono mt-0.5 text-gray-400 dark:text-slate-500">{batch.batchNumber}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${BATCH_STATUS_STYLES[batch.status] ?? ""}`}>
          {batch.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3 bg-gray-50 border border-gray-100 dark:bg-slate-800/50 dark:border-transparent">
          <p className="text-xs mb-1 text-gray-400 dark:text-slate-500">Gross Payroll</p>
          <p className="text-lg font-bold text-black dark:text-white">{(batch.totalGrossSalary / 1_000_000).toFixed(2)}M</p>
        </div>
        <div className="rounded-xl p-3 border bg-blue-50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/10">
          <p className="text-xs mb-1 text-gray-400 dark:text-slate-500">Net Payroll</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{(batch.totalNetSalary / 1_000_000).toFixed(2)}M</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-4 text-gray-400 dark:text-slate-500">
        <span className="flex items-center gap-1"><Users size={11} />{batch.totalStaffCount} staff</span>
        <span className="flex items-center gap-1"><DollarSign size={11} />PAYE: {(batch.totalPAYE / 1000).toFixed(0)}K</span>
        <span className="flex items-center gap-1"><CreditCard size={11} />NSSF: {(batch.totalNSSF / 1000).toFixed(0)}K</span>
      </div>

      {/* Status progress bar */}
      <div className="flex items-center gap-1">
        {statusFlow.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= currentStep ? "bg-blue-500 dark:bg-[#6366f1]" : "bg-gray-100 dark:bg-slate-800"}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {statusFlow.map((s, i) => (
          <span key={s} className={`text-xs ${i <= currentStep ? "text-blue-500 dark:text-[#6366f1]" : "text-gray-300 dark:text-slate-700"}`}>
            {s}
          </span>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between border-gray-100 dark:border-slate-800/60">
        {batch.preparedBy && (
          <span className="text-xs text-gray-400 dark:text-slate-600">By: {batch.preparedBy.name}</span>
        )}
        {batch.paidAt && (
          <span className="text-xs text-blue-600 dark:text-blue-500">
            Paid {new Date(batch.paidAt).toLocaleDateString()}
          </span>
        )}
        <span className="text-xs transition-colors ml-auto flex items-center gap-1 text-blue-500 group-hover:text-blue-700 dark:text-[#6366f1] dark:group-hover:text-[#818cf8]">
          View <ChevronRight size={11} />
        </span>
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function PayrollClient({ slug, schoolId, schoolName }: Props) {
  const [batches,       setBatches]       = useState<any[]>([]);
  const [summary,       setSummary]       = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);
  const [yearFilter,    setYearFilter]    = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    const [b, s] = await Promise.all([
      getPayrollBatches(schoolId),
      getPayrollSummary(schoolId, yearFilter),
    ]);
    setBatches(b as any);
    setSummary(s);
    setLoading(false);
  }, [schoolId, yearFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered  = batches.filter(b => b.payYear === yearFilter);
  const totalPaid = filtered.filter(b => b.status === "PAID").reduce((s, b) => s + b.totalNetSalary, 0);
  const pending   = filtered.filter(b => ["DRAFT", "REVIEW", "APPROVED"].includes(b.status)).length;

  return (
    <div className="min-h-screen bg-gray-50 text-black dark:bg-[#080c10] dark:text-white">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[500px] h-[300px] rounded-full blur-[120px] bg-blue-200/20 dark:bg-blue-500/4" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[200px] rounded-full blur-[100px] bg-blue-200/20 dark:bg-[#6366f1]/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <DollarSign size={16} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Payroll</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-500">
              {schoolName} — monthly payroll batches, approvals and payments
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-all shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-300/30 dark:shadow-blue-500/20"
          >
            <Plus size={16} /> Run Payroll
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Batches This Year", value: filtered.length,                                      color: "text-gray-700 dark:text-slate-400",   bg: "bg-gray-100 dark:bg-slate-800/50",    icon: BarChart2 },
            { label: "Total Paid Out",    value: `${(totalPaid / 1_000_000).toFixed(1)}M`,             color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", icon: Banknote },
            { label: "Total PAYE",        value: `${((summary?.yearlyTotals?.totalPAYE ?? 0) / 1_000_000).toFixed(2)}M`, color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-500/10",   icon: TrendingUp },
            { label: "Pending Batches",   value: pending,                                              color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",    icon: Clock },
          ].map(s => (
            <div key={s.label} className="border rounded-xl p-4 flex items-center gap-3 bg-white border-gray-200 shadow-sm dark:bg-[#0d1117] dark:border-slate-800/80 dark:shadow-none">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Year filter + refresh */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={yearFilter}
            onChange={e => setYearFilter(Number(e.target.value))}
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white border-gray-200 text-black shadow-sm dark:bg-[#0d1117] dark:border-slate-800 dark:text-slate-300 dark:shadow-none"
          >
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="p-2 border rounded-xl transition-all bg-white border-gray-200 text-gray-400 hover:text-gray-600 shadow-sm dark:bg-[#0d1117] dark:border-slate-800 dark:text-slate-500 dark:hover:text-slate-300 dark:shadow-none"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Monthly bar chart */}
        {summary && summary.months.length > 0 && (
          <div className="border rounded-2xl p-5 mb-8 bg-white border-gray-200 shadow-sm dark:bg-[#0d1117] dark:border-slate-800/80 dark:shadow-none">
            <p className="text-xs uppercase tracking-wider mb-4 text-gray-500 dark:text-slate-500">
              Monthly Net Payroll ({yearFilter})
            </p>
            <div className="flex items-end gap-2 h-20">
              {MONTHS.map((m, i) => {
                const month  = summary.months.find((mo: any) => mo.month === i + 1);
                const maxVal = Math.max(...summary.months.map((mo: any) => mo.totalNet), 1);
                const height = month ? (month.totalNet / maxVal) * 100 : 0;
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-gray-700 text-white dark:bg-slate-800">
                      {month ? `${(month.totalNet / 1_000_000).toFixed(1)}M` : "—"}
                    </div>
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        month?.status === "PAID"
                          ? "bg-blue-500"
                          : month
                          ? "bg-blue-500 dark:bg-[#6366f1]"
                          : "bg-gray-100 dark:bg-slate-800"
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs hidden sm:block text-gray-300 dark:text-slate-600">{m.slice(0, 1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Batch grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-2xl p-5 animate-pulse bg-white border-gray-100 dark:bg-[#0d1117] dark:border-slate-800/60">
                <div className="h-4 rounded w-32 mb-2 bg-gray-100 dark:bg-slate-800" />
                <div className="h-3 rounded w-24 mb-4 bg-gray-50 dark:bg-slate-800/60" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-14 rounded-xl bg-gray-50 dark:bg-slate-800/60" />
                  <div className="h-14 rounded-xl bg-gray-50 dark:bg-slate-800/60" />
                </div>
                <div className="h-2 rounded bg-gray-50 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gray-100 text-gray-300 dark:bg-slate-800/50 dark:text-slate-600">
              <DollarSign size={28} />
            </div>
            <p className="font-medium text-gray-700 dark:text-slate-400">No payroll batches for {yearFilter}</p>
            <p className="text-sm mt-1 text-gray-400 dark:text-slate-600">Run the first payroll batch to get started</p>
            <button onClick={() => setCreateOpen(true)}
              className="mt-6 px-4 py-2 text-white text-sm rounded-xl transition-colors bg-blue-600 hover:bg-blue-700">
              Run First Payroll
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(b => (
              <BatchCard key={b.id} batch={b} onOpen={() => setDetailBatchId(b.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <RunPayrollModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        schoolId={schoolId}
        onSuccess={load}
      />
      <BatchDetailModal
        batchId={detailBatchId}
        open={!!detailBatchId}
        onClose={() => setDetailBatchId(null)}
        schoolId={schoolId}
        onSuccess={load}
      />
    </div>
  );
}