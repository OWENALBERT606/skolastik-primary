"use client";

import {
  approveExpense,
  cancelExpense,
  createExpense,
  createVendor,
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  getExpenseSummary,
  getVendors,
  markExpenseAsPaid,
  rejectExpense,
  submitExpenseForApproval,
  updateExpense,
} from "@/actions/expenses";
import { useCallback, useEffect, useState, useTransition } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Expense = {
  id: string;
  expenseNumber: string;
  description: string;
  amount: number;
  expenseDate: string | Date;
  status: string;
  paymentMethod?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
  category?: { id: string; name: string; code: string } | null;
  vendor?: { id: string; name: string } | null;
  createdBy?: { name: string | null } | null;
  approvedBy?: { name: string | null } | null;
};
type Category = { id: string; name: string; code: string };
type Vendor   = { id: string; name: string };
type Summary  = {
  totalAmount: number;
  totalCount: number;
  pendingCount: number;
  byCategory: { category: Category | null; amount: number; count: number }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "UGX " + n.toLocaleString("en-UG", { maximumFractionDigits: 0 });
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-600 border-gray-200",
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED:  "bg-blue-50 text-blue-700 border-blue-200",
  PAID:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-400 border-gray-200",
};
const STATUS_DOT: Record<string, string> = {
  DRAFT:     "bg-gray-400",
  PENDING:   "bg-amber-400 animate-pulse",
  APPROVED:  "bg-blue-500",
  PAID:      "bg-emerald-500",
  REJECTED:  "bg-red-500",
  CANCELLED: "bg-gray-300",
};
const CODE_COLORS: Record<string, string> = {
  SAL:"bg-violet-100 text-violet-700", FOD:"bg-orange-100 text-orange-700",
  UTL:"bg-blue-100 text-blue-700",     FUL:"bg-yellow-100 text-yellow-700",
  MNT:"bg-stone-100 text-stone-700",   STN:"bg-cyan-100 text-cyan-700",
  MED:"bg-red-100 text-red-700",       TRP:"bg-green-100 text-green-700",
  ICT:"bg-indigo-100 text-indigo-700", EVT:"bg-pink-100 text-pink-700",
  CLN:"bg-teal-100 text-teal-700",     LAB:"bg-emerald-100 text-emerald-700",
  SEC:"bg-gray-200 text-gray-700",     INS:"bg-sky-100 text-sky-700",
  OTH:"bg-slate-100 text-slate-600",
};

const PAYMENT_METHODS = ["CASH","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","PETTY_CASH"];
const PAYMENT_LABELS: Record<string, string> = {
  CASH:"Cash", BANK_TRANSFER:"Bank Transfer", MOBILE_MONEY:"Mobile Money",
  CHEQUE:"Cheque", PETTY_CASH:"Petty Cash",
};

const inp =
  "w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 " +
  "placeholder:text-gray-300 transition-all";
const lbl = "block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1.5";

// ─── SlideDrawer ──────────────────────────────────────────────────────────────
function SlideDrawer({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`relative bg-white w-full max-w-[520px] h-full shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="shrink-0 px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
              {subtitle && <p className="text-sm text-blue-200 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── PopModal ─────────────────────────────────────────────────────────────────
function PopModal({ open, onClose, title, subtitle, children, danger }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: React.ReactNode; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-1.5 ${danger ? "bg-gradient-to-r from-red-400 to-red-600" : "bg-gradient-to-r from-blue-500 to-violet-600"}`} />
        <div className="px-6 pt-5 pb-2">
          <h3 className="text-base font-black text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.9) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </div>
  );
}

// ─── ExpenseDetailModal ───────────────────────────────────────────────────────
function ExpenseDetailModal({ expense, onClose, canApprove, canMarkPaid, onSubmit, onApprove, onReject, onPay, onCancel }: {
  expense: Expense | null; onClose: () => void;
  canApprove: boolean; canMarkPaid: boolean;
  onSubmit:  (id: string) => void;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  onPay:     (id: string) => void;
  onCancel:  (id: string) => void;
}) {
  if (!expense) return null;
  const styleCls = STATUS_STYLES[expense.status] ?? STATUS_STYLES.DRAFT;
  const dotCls   = STATUS_DOT[expense.status]   ?? "bg-gray-400";
  const codeCls  = CODE_COLORS[expense.category?.code ?? ""] ?? "bg-blue-100 text-blue-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 px-6 pt-7 pb-14 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {expense.category?.code && (
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${codeCls}`}>
                {expense.category.code}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${styleCls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
              {expense.status}
            </span>
          </div>
          <p className="font-mono text-blue-200 text-xs mb-1">{expense.expenseNumber}</p>
          <h3 className="text-xl font-black text-white leading-snug">{expense.description}</h3>
          <p className="text-3xl font-black text-white mt-2">{fmt(expense.amount)}</p>
        </div>

        {/* Pull-up card */}
        <div className="-mt-5 bg-white rounded-t-3xl px-6 pt-5 pb-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
            {[
              { label: "Date",       value: fmtDate(expense.expenseDate) },
              { label: "Category",   value: expense.category?.name ?? "—" },
              { label: "Vendor",     value: expense.vendor?.name ?? "—" },
              { label: "Payment",    value: expense.paymentMethod ? (PAYMENT_LABELS[expense.paymentMethod] ?? expense.paymentMethod) : "—" },
              { label: "Ref No.",    value: expense.referenceNo ?? "—" },
              { label: "Created By", value: expense.createdBy?.name ?? "—" },
              ...(expense.approvedBy?.name ? [{ label: "Approved By", value: expense.approvedBy.name }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>

          {expense.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700">{expense.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {expense.status === "DRAFT" && (
              <button onClick={() => { onClose(); onSubmit(expense.id); }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-black transition-colors">
                Submit for Approval
              </button>
            )}
            {expense.status === "PENDING" && canApprove && (
              <>
                <button onClick={() => { onClose(); onApprove(expense.id); }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-black transition-colors">
                  Approve
                </button>
                <button onClick={() => { onClose(); onReject(expense.id); }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-black transition-colors">
                  Reject
                </button>
              </>
            )}
            {expense.status === "APPROVED" && canMarkPaid && (
              <button onClick={() => { onClose(); onPay(expense.id); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black transition-colors">
                Mark as Paid
              </button>
            )}
            {["DRAFT","PENDING"].includes(expense.status) && (
              <button onClick={() => { onClose(); onCancel(expense.id); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                Cancel
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(32px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ExpensesPage({
  schoolId,
  canApprove  = false,
  canMarkPaid = false,
}: {
  schoolId: string;
  canApprove?:  boolean;
  canMarkPaid?: boolean;
}) {
  const [, startTx] = useTransition();
  const [busy, setBusy] = useState(false);

  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors,    setVendors]    = useState<Vendor[]>([]);
  const [loading,    setLoading]    = useState(true);

  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Drawer state
  const [drawer, setDrawer] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null); // null = create, set = edit
  const [form, setForm] = useState({
    categoryId: "", vendorId: "", description: "", amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "", referenceNo: "", notes: "",
  });
  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  const [drawerErr, setDrawerErr] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [addingVendor,  setAddingVendor]  = useState(false);
  // Modal state
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<string | null>(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [payTarget,     setPayTarget]     = useState<string | null>(null);
  const [payMethod,     setPayMethod]     = useState("CASH");
  const [payRef,        setPayRef]        = useState("");
  const [cancelTarget,  setCancelTarget]  = useState<string | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<string | null>(null);

  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    startTx(async () => {
      const [exp, sum, cats, vends] = await Promise.all([
        getExpenses(schoolId, {
          search:     search         || undefined,
          status:     statusFilter   || undefined,
          categoryId: categoryFilter || undefined,
        }),
        getExpenseSummary(schoolId, from, to),
        getExpenseCategories(schoolId),
        getVendors(schoolId, false),
      ]);
      setExpenses(exp as Expense[]);
      setSummary(sum as Summary);
      setCategories(cats as Category[]);
      setVendors(vends as Vendor[]);
      setLoading(false);
    });
  }, [schoolId, search, statusFilter, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  // ── Create expense ─────────────────────────────────────────────────────────
  const openDrawer = () => {
    setEditingExpense(null);
    setForm({ categoryId:"", vendorId:"", description:"", amount:"",
      expenseDate: new Date().toISOString().slice(0,10), paymentMethod:"", referenceNo:"", notes:"" });
    setDrawerErr(""); setDrawer(true);
  };

  const openEditDrawer = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({
      categoryId:    exp.category?.id   ?? "",
      vendorId:      exp.vendor?.id     ?? "",
      description:   exp.description,
      amount:        String(exp.amount),
      expenseDate:   new Date(exp.expenseDate).toISOString().slice(0, 10),
      paymentMethod: exp.paymentMethod  ?? "",
      referenceNo:   exp.referenceNo    ?? "",
      notes:         exp.notes          ?? "",
    });
    setDrawerErr(""); setDrawer(true);
  };

  const handleCreate = async () => {
    if (!form.categoryId)   { setDrawerErr("Category is required.");         return; }
    if (!form.description.trim()) { setDrawerErr("Description is required."); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setDrawerErr("Enter a valid amount greater than 0."); return;
    }
    setBusy(true); setDrawerErr("");
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          categoryId:    form.categoryId,
          vendorId:      form.vendorId    || undefined,
          description:   form.description,
          amount:        Number(form.amount),
          expenseDate:   new Date(form.expenseDate),
          paymentMethod: form.paymentMethod || undefined,
          referenceNo:   form.referenceNo  || undefined,
          notes:         form.notes        || undefined,
        });
      } else {
        await createExpense({
          schoolId,
          categoryId:    form.categoryId,
          vendorId:      form.vendorId    || undefined,
          description:   form.description,
          amount:        Number(form.amount),
          expenseDate:   new Date(form.expenseDate),
          paymentMethod: form.paymentMethod || undefined,
          referenceNo:   form.referenceNo  || undefined,
          notes:         form.notes        || undefined,
        });
      }
      setDrawer(false); load();
    } catch (e: unknown) {
      setDrawerErr(e instanceof Error ? e.message : "Failed to save expense.");
    } finally { setBusy(false); }
  };

  const handleQuickAddVendor = async () => {
    if (!newVendorName.trim()) return;
    setAddingVendor(true);
    try {
      const res = await createVendor({ schoolId, name: newVendorName }) as any;
      const v = res.vendor;
      setVendors(vs => [...vs, { id: v.id, name: v.name }]);
      setForm(f => ({ ...f, vendorId: v.id }));
      setNewVendorName("");
    } finally { setAddingVendor(false); }
  };

  // ── Workflow ───────────────────────────────────────────────────────────────
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(false); }
  };

  const handleSubmitForApproval = (id: string) => act(() => submitExpenseForApproval(id));
  const handleApprove = (id: string) => act(() => approveExpense(id));
  const handleReject  = () => act(async () => {
    await rejectExpense(rejectTarget!, rejectReason);
    setRejectTarget(null); setRejectReason("");
  });
  const handlePay = () => act(async () => {
    await markExpenseAsPaid(payTarget!, { paymentMethod: payMethod, referenceNo: payRef || undefined });
    setPayTarget(null); setPayRef("");
  });
  const handleCancel = () => act(async () => {
    await cancelExpense(cancelTarget!);
    setCancelTarget(null);
  });

  const handleDelete = () => act(async () => {
    await deleteExpense(deleteTarget!);
    setDeleteTarget(null);
  });

  const paidTotal = expenses.filter(e => e.status === "PAID").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen w-[980px]  bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shadow-sm shadow-blue-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Expenses</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {now.toLocaleString("en-UG", { month: "long", year: "numeric" })} · {expenses.length} records
              </p>
            </div>
          </div>
          <button onClick={openDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Expense
          </button>
        </div>
      </header>

      <div className="px-6 py-5 space-y-4 max-w-7xl mx-auto">
        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "This Month",       value: fmt(summary?.totalAmount ?? 0), sub: `${summary?.totalCount ?? 0} expenses`,       color: "text-gray-900" },
            { label: "Pending Approval", value: String(summary?.pendingCount ?? 0), sub: "awaiting review",                        color: "text-amber-600" },
            { label: "Paid Out",         value: fmt(paidTotal),                    sub: "fully disbursed",                         color: "text-emerald-600" },
            { label: "Top Category",     value: summary?.byCategory?.[0]?.category?.name ?? "—", sub: summary?.byCategory?.[0] ? fmt(summary.byCategory[0].amount) : "", color: "text-blue-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 hover:border-blue-200 transition-colors">
              <p className={`text-xl font-black leading-tight truncate ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1.5">{s.label}</p>
              {s.sub && <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Category Breakdown ─────────────────────────────────────────── */}
        {(summary?.byCategory?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Spending by Category — {now.toLocaleString("en-UG", { month: "long" })}
            </p>
            <div className="space-y-2.5">
              {summary!.byCategory
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 6)
                .map(b => {
                  const pct     = summary!.totalAmount > 0 ? Math.round((b.amount / summary!.totalAmount) * 100) : 0;
                  const codeCls = CODE_COLORS[b.category?.code ?? ""] ?? "bg-blue-100 text-blue-700";
                  return (
                    <div key={b.category?.id ?? "unk"} className="flex items-center gap-3">
                      {b.category?.code && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded w-10 text-center shrink-0 ${codeCls}`}>
                          {b.category.code}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 w-28 truncate shrink-0">{b.category?.name ?? "Unknown"}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-36 text-right shrink-0">
                        {fmt(b.amount)} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search description or ref no…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 bg-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400">
            <option value="">All Statuses</option>
            {["DRAFT","PENDING","APPROVED","PAID","REJECTED","CANCELLED"].map(s => (
              <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-200 bg-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading expenses…</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <p className="text-gray-700 font-bold text-base">No expenses found</p>
              <p className="text-gray-400 text-sm mt-1">
                {search || statusFilter || categoryFilter ? "Try adjusting your filters" : "Record your first expense to get started"}
              </p>
              {!search && !statusFilter && !categoryFilter && (
                <button onClick={openDrawer} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add first expense
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100">
                      {[
                        // { label: "Ref No.",     cls: "text-left px-5 py-3.5" },
                        { label: "Date",        cls: "text-left px-5 py-3.5 hidden sm:table-cell" },
                        { label: "Description", cls: "text-left px-5 py-3.5" },
                        { label: "Category",    cls: "text-left px-5 py-3.5 hidden md:table-cell" },
                        // { label: "Vendor",      cls: "text-left px-5 py-3.5 hidden lg:table-cell" },
                        { label: "Amount",      cls: "text-right px-5 py-3.5" },
                        { label: "Status",      cls: "text-left px-5 py-3.5" },
                        { label: "Actions",     cls: "text-right px-5 py-3.5" },
                      ].map(h => (
                        <th key={h.label} className={`${h.cls} text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp, i) => {
                      const styleCls = STATUS_STYLES[exp.status] ?? STATUS_STYLES.DRAFT;
                      const dotCls   = STATUS_DOT[exp.status]   ?? "bg-gray-400";
                      const codeCls  = CODE_COLORS[exp.category?.code ?? ""] ?? "bg-gray-100 text-gray-600";
                      return (
                        <tr key={exp.id}
                          className={`${i < expenses.length - 1 ? "border-b border-gray-50" : ""} hover:bg-blue-50/50 transition-colors group`}>

                          {/* Ref */}
                          {/* <td className="px-5 py-4">
                            <button className="font-mono text-xs text-blue-600 hover:underline whitespace-nowrap" onClick={() => setDetailExpense(exp)}>
                              {exp.expenseNumber}
                            </button>
                          </td> */}

                          {/* Date */}
                          <td className="px-5 py-4 hidden sm:table-cell text-gray-500 text-xs whitespace-nowrap">
                            {fmtDate(exp.expenseDate)}
                          </td>

                          {/* Description */}
                          <td className="px-5 py-4">
                            <button className="text-left" onClick={() => setDetailExpense(exp)}>
                              <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug max-w-[200px] truncate">
                                {exp.description}
                              </p>
                              <p className="text-[11px] text-gray-400 sm:hidden mt-0.5">{fmtDate(exp.expenseDate)}</p>
                            </button>
                          </td>

                          {/* Category */}
                          <td className="px-5 py-4 hidden md:table-cell">
                            {exp.category?.code
                              ? <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${codeCls}`}>{exp.category.code}</span>
                              : <span className="text-gray-300 text-xs italic">—</span>}
                          </td>

                          {/* Vendor */}
                          {/* <td className="px-5 py-4 hidden lg:table-cell">
                            <span className="text-gray-500 text-xs truncate block max-w-[130px]">
                              {exp.vendor?.name ?? <span className="text-gray-300 italic">—</span>}
                            </span>
                          </td> */}

                          {/* Amount */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <span className="font-black text-gray-900 text-sm">{fmt(exp.amount)}</span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${styleCls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                              {exp.status[0] + exp.status.slice(1).toLowerCase()}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setDetailExpense(exp)} title="View details"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              {exp.status === "DRAFT" && (
                                <button onClick={() => openEditDrawer(exp)} title="Edit expense"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {exp.status === "DRAFT" && (
                                <button onClick={() => handleSubmitForApproval(exp.id)}
                                  className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                  Submit
                                </button>
                              )}
                              {exp.status === "PENDING" && canApprove && (
                                <>
                                  <button onClick={() => handleApprove(exp.id)}
                                    className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                    ✓
                                  </button>
                                  <button onClick={() => { setRejectTarget(exp.id); setRejectReason(""); }}
                                    className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                    ✕
                                  </button>
                                </>
                              )}
                              {exp.status === "APPROVED" && canMarkPaid && (
                                <button onClick={() => { setPayTarget(exp.id); setPayMethod("CASH"); setPayRef(""); }}
                                  className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                  Pay
                                </button>
                              )}
                              {["DRAFT","PENDING"].includes(exp.status) && (
                                <button onClick={() => setCancelTarget(exp.id)} title="Cancel expense"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5" />
                                  </svg>
                                </button>
                              )}
                              {["DRAFT","CANCELLED","REJECTED"].includes(exp.status) && (
                                <button onClick={() => setDeleteTarget(exp.id)} title="Delete expense"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  <span className="text-gray-700 font-bold">{expenses.length}</span> expense{expenses.length !== 1 ? "s" : ""} ·
                  total <span className="text-gray-700 font-bold">{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</span>
                </p>
                <button onClick={openDrawer} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add new
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ DRAWER: New / Edit Expense ══════════════════════════════════════ */}
      <SlideDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title={editingExpense ? "Edit Expense" : "New Expense"}
        subtitle={editingExpense ? `Editing ${editingExpense.expenseNumber}` : "Record a new school expenditure"}
      >
        <div className="p-6 space-y-5">
          {drawerErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {drawerErr}
            </div>
          )}

          <div>
            <label className={lbl}>Category <span className="text-red-400">*</span></label>
            <select value={form.categoryId} onChange={setF("categoryId")} className={inp}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Description <span className="text-red-400">*</span></label>
            <input type="text" value={form.description} onChange={setF("description")}
              placeholder="e.g. Purchased food supplies for term 2" className={inp} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Amount (UGX) <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={form.amount} onChange={setF("amount")} placeholder="0" className={inp} />
            </div>
            <div>
              <label className={lbl}>Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.expenseDate} onChange={setF("expenseDate")} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Vendor <span className="text-gray-400 font-normal normal-case text-[11px]">(optional)</span></label>
            <select value={form.vendorId} onChange={setF("vendorId")} className={inp}>
              <option value="">No vendor / select later</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <div className="flex gap-2 mt-2">
              <input type="text" value={newVendorName} onChange={e => setNewVendorName(e.target.value)}
                placeholder="Quick-add new vendor…"
                className="flex-1 border border-blue-100 rounded-xl px-3 py-2 text-xs bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40 placeholder:text-gray-400" />
              <button onClick={handleQuickAddVendor} disabled={!newVendorName.trim() || addingVendor}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl disabled:opacity-40 transition-colors">
                {addingVendor ? "…" : "+ Add"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Payment Method</label>
              <select value={form.paymentMethod} onChange={setF("paymentMethod")} className={inp}>
                <option value="">Select…</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Reference No.</label>
              <input type="text" value={form.referenceNo} onChange={setF("referenceNo")} placeholder="Receipt, bank ref…" className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Notes <span className="text-gray-400 font-normal normal-case text-[11px]">(optional)</span></label>
            <textarea rows={3} value={form.notes} onChange={setF("notes") as any}
              placeholder="Any additional context…" className={`${inp} resize-none`} />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setDrawer(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200">
            {busy ? "Saving…" : editingExpense ? "Save Changes" : "Create Expense"}
          </button>
        </div>
      </SlideDrawer>

      {/* ══ MODAL: Expense Detail ═════════════════════════════════════════════ */}
      <ExpenseDetailModal
        expense={detailExpense}
        onClose={() => setDetailExpense(null)}
        canApprove={canApprove}
        canMarkPaid={canMarkPaid}
        onSubmit={id  => { setDetailExpense(null); handleSubmitForApproval(id); }}
        onApprove={id => { setDetailExpense(null); handleApprove(id); }}
        onReject={id  => { setDetailExpense(null); setRejectTarget(id); setRejectReason(""); }}
        onPay={id     => { setDetailExpense(null); setPayTarget(id); setPayMethod("CASH"); setPayRef(""); }}
        onCancel={id  => { setDetailExpense(null); setCancelTarget(id); }}
      />

      {/* ══ MODAL: Reject ════════════════════════════════════════════════════ */}
      <PopModal open={!!rejectTarget} onClose={() => setRejectTarget(null)} danger
        title="Reject Expense" subtitle="Provide a reason so the submitter can correct and resubmit.">
        <div className="mt-4 space-y-4">
          <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection…"
            className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 placeholder:text-gray-300 resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setRejectTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleReject} disabled={!rejectReason.trim() || busy}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50">
              {busy ? "Rejecting…" : "Reject Expense"}
            </button>
          </div>
        </div>
      </PopModal>

      {/* ══ MODAL: Mark Paid ═════════════════════════════════════════════════ */}
      <PopModal open={!!payTarget} onClose={() => setPayTarget(null)}
        title="Mark as Paid" subtitle="Record how this expense was paid.">
        <div className="mt-4 space-y-4">
          <div>
            <label className={lbl}>Payment Method <span className="text-red-400">*</span></label>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
              className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Reference No. <span className="text-gray-400 font-normal normal-case text-[11px]">(optional)</span></label>
            <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
              placeholder="Bank ref, MM transaction, cheque no…"
              className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 placeholder:text-gray-300" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPayTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handlePay} disabled={busy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 shadow-sm shadow-blue-200">
              {busy ? "Saving…" : "Confirm Payment"}
            </button>
          </div>
        </div>
      </PopModal>

      {/* ══ MODAL: Cancel Confirm ════════════════════════════════════════════ */}
      <PopModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} danger
        title="Cancel this Expense?" subtitle="It will be marked cancelled and cannot be resubmitted.">
        <div className="flex gap-3 mt-5">
          <button onClick={() => setCancelTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Keep It</button>
          <button onClick={handleCancel} disabled={busy}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50">
            {busy ? "Cancelling…" : "Cancel Expense"}
          </button>
        </div>
      </PopModal>

      {/* ══ MODAL: Delete Confirm ════════════════════════════════════════════ */}
      <PopModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} danger
        title="Delete this Expense?" subtitle="This is permanent and cannot be undone.">
        <div className="flex gap-3 mt-5">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Keep It</button>
          <button onClick={handleDelete} disabled={busy}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50">
            {busy ? "Deleting…" : "Delete Permanently"}
          </button>
        </div>
      </PopModal>
    </div>
  );
}