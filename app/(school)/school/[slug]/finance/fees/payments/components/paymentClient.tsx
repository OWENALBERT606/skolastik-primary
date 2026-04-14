// app/school/[slug]/finance/fees/payments/PaymentsClient.tsx
"use client";

import { useState, useTransition, useCallback } from "react";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Badge }   from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2, Phone, Plus, Receipt,
  Search, Smartphone, Undo2, Building2,
  FileCheck, Info, Loader2, TrendingUp,
  Banknote, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { recordPayment, reverseTransaction, updatePaymentNotes } from "@/actions/fee-payment";
import { ReceiptData, ReceiptDownloadButton, ReceiptPrintButton, SchoolInfo } from "./ReceiptPDF";
// import {
//   ReceiptPrintButton,
//   ReceiptDownloadButton,
//   type ReceiptData,
//   type SchoolInfo,
// } from "./components/ReceiptPDF";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DBPaymentMethod = "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHEQUE" | "ONLINE" | "POS";
type UIMethod = "CASH" | "MTN_MOMO" | "AIRTEL_MONEY" | "BANK_TRANSFER" | "CHEQUE" | "POS" | "ONLINE";

export type StudentForUI = {
  accountId:   string;
  studentId:   string;
  studentName: string;
  admissionNo: string;
  class:       string;
  balance:     number;
  invoiceId:   string | null;
  invoiceNo:   string;
};

// ── TxForUI extended with studentClass + invoiceNo for receipt generation ──
export type TxForUI = {
  id:                  string;
  studentFeeAccountId: string;
  studentName:         string;
  admissionNo:         string;
  amount:              number;
  paymentMethod:       string;
  referenceNumber:     string | null;
  mobileMoneyPhone:    string | null;
  mobileMoneyNetwork:  string | null;
  processedAt:         string;
  receiptNumber:       string | null;
  isReversal:          boolean;
  reversedAt:          string | null;
  description:         string | null;
  // added for receipt PDF — populated in server page & onPosted()
  studentClass?:       string;
  invoiceNo?:          string;
};

// ─── Method meta ──────────────────────────────────────────────────────────────

const METHOD_META: Record<UIMethod, {
  label:       string;
  icon:        React.ElementType;
  color:       string;
  dbMethod:    DBPaymentMethod;
  momoNetwork?: string;
}> = {
  CASH:          { label: "Cash",          icon: Banknote,   color: "bg-emerald-50 text-emerald-700 border-emerald-200",  dbMethod: "CASH"          },
  MTN_MOMO:      { label: "MTN MoMo",      icon: Smartphone, color: "bg-yellow-50 text-yellow-700 border-yellow-200",    dbMethod: "MOBILE_MONEY", momoNetwork: "MTN"    },
  AIRTEL_MONEY:  { label: "Airtel Money",  icon: Phone,      color: "bg-red-50 text-red-700 border-red-200",             dbMethod: "MOBILE_MONEY", momoNetwork: "AIRTEL" },
  BANK_TRANSFER: { label: "Bank Transfer", icon: Building2,  color: "bg-blue-50 text-blue-700 border-blue-200",          dbMethod: "BANK_TRANSFER" },
  CHEQUE:        { label: "Cheque",        icon: FileCheck,  color: "bg-slate-50 text-slate-700 border-slate-200",       dbMethod: "CHEQUE"        },
  POS:           { label: "POS",           icon: Receipt,    color: "bg-teal-50 text-teal-700 border-teal-200",          dbMethod: "POS"           },
  ONLINE:        { label: "Online",        icon: TrendingUp, color: "bg-indigo-50 text-indigo-700 border-indigo-200",    dbMethod: "ONLINE"        },
};

const DB_METHOD_DISPLAY: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CASH:          { label: "Cash",          icon: Banknote,   color: "bg-emerald-50 text-emerald-700 border-emerald-200"  },
  MOBILE_MONEY:  { label: "Mobile Money",  icon: Smartphone, color: "bg-yellow-50 text-yellow-700 border-yellow-200"    },
  BANK_TRANSFER: { label: "Bank Transfer", icon: Building2,  color: "bg-blue-50 text-blue-700 border-blue-200"          },
  CHEQUE:        { label: "Cheque",        icon: FileCheck,  color: "bg-slate-50 text-slate-700 border-slate-200"       },
  POS:           { label: "POS",           icon: Receipt,    color: "bg-teal-50 text-teal-700 border-teal-200"          },
  ONLINE:        { label: "Online",        icon: TrendingUp, color: "bg-indigo-50 text-indigo-700 border-indigo-200"    },
};

const NEEDS_TXN_REF = new Set<UIMethod>(["MTN_MOMO", "AIRTEL_MONEY", "BANK_TRANSFER", "CHEQUE", "POS", "ONLINE"]);
const NEEDS_PHONE   = new Set<UIMethod>(["MTN_MOMO", "AIRTEL_MONEY"]);

const TXN_REF_LABELS: Partial<Record<UIMethod, string>> = {
  MTN_MOMO:      "MoMo Transaction ID",
  AIRTEL_MONEY:  "Airtel Money Transaction ID",
  BANK_TRANSFER: "Bank Reference / Slip No.",
  CHEQUE:        "Cheque Number",
  POS:           "POS Slip No.",
  ONLINE:        "Online Reference No.",
};
const TXN_REF_PLACEHOLDERS: Partial<Record<UIMethod, string>> = {
  MTN_MOMO:      "e.g. MP250219ABCD",
  AIRTEL_MONEY:  "e.g. AT250219WXYZ",
  BANK_TRANSFER: "e.g. TXN-2025-001234",
  CHEQUE:        "e.g. 000456",
  POS:           "e.g. POS-001234",
  ONLINE:        "e.g. ONL-2025-XYZ",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt     = (n: number) => `UGX ${Math.abs(n).toLocaleString()}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-UG", {
    day: "2-digit", month: "short", year: "numeric",
  });

/** Convert a TxForUI row → ReceiptData shape required by ReceiptPDF */
function toReceiptData(tx: TxForUI): ReceiptData {
  return {
    receiptNumber:       tx.receiptNumber ?? "—",
    studentName:         tx.studentName,
    admissionNo:         tx.admissionNo,
    studentClass:        tx.studentClass,
    invoiceNo:           tx.invoiceNo,
    amount:              tx.amount,
    paymentMethod:       tx.paymentMethod,
    mobileMoneyNetwork:  tx.mobileMoneyNetwork  ?? undefined,
    mobileMoneyPhone:    tx.mobileMoneyPhone     ?? undefined,
    referenceNumber:     tx.referenceNumber      ?? undefined,
    description:         tx.description         ?? undefined,
    processedAt:         tx.processedAt,
    isVoid:              !!tx.reversedAt,
  };
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  accountId: string;
  invoiceId: string;
  amount:    string;
  method:    UIMethod | "";
  txnRef:    string;
  phone:     string;
  notes:     string;
};

const EMPTY_FORM: FormState = {
  accountId: "", invoiceId: "", amount: "",
  method: "", txnRef: "", phone: "", notes: "",
};

// ─── Record Payment Dialog ────────────────────────────────────────────────────

function RecordPaymentDialog({
  students,
  userId,
  school,
  onPosted,
}: {
  students: StudentForUI[];
  userId:   string;
  school:   SchoolInfo;
  onPosted: (tx: TxForUI) => void;
}) {
  const [open,      setOpen]    = useState(false);
  const [step,      setStep]    = useState<"form" | "confirm" | "success">("form");
  const [isPending, start]      = useTransition();
  const [form,      setForm]    = useState<FormState>(EMPTY_FORM);
  const [postedTx,  setPostedTx] = useState<TxForUI | null>(null);

  const student    = students.find((s) => s.accountId === form.accountId);
  const method     = form.method as UIMethod;
  const meta       = method ? METHOD_META[method] : null;
  const enteredAmt = Number(form.amount) || 0;
  const isPartial  = !!student && enteredAmt > 0 && enteredAmt < student.balance;
  const isOverpay  = !!student && enteredAmt > student.balance + 0.01;

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setStep("form");
    setPostedTx(null);
  }, []);

  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const isValid = () => {
    if (!form.accountId || !form.amount || !form.method) return false;
    if (enteredAmt <= 0 || isOverpay)                    return false;
    if (NEEDS_TXN_REF.has(method) && !form.txnRef.trim()) return false;
    if (NEEDS_PHONE.has(method)   && !form.phone.trim())   return false;
    return true;
  };

  const handlePost = () => {
    if (!student || !meta) return;
    start(async () => {
      const result = await recordPayment({
        studentFeeAccountId: form.accountId,
        invoiceId:           form.invoiceId || undefined,
        amount:              enteredAmt,
        paymentMethod:       meta.dbMethod,
        referenceNumber:     form.txnRef || undefined,
        description:         form.notes || `${meta.label} payment – ${student.studentName}`,
        mobileMoneyNetwork:  meta.momoNetwork,
        mobileMoneyPhone:    NEEDS_PHONE.has(method) ? form.phone : undefined,
        recordedById:        userId,
      });

      if (!result.ok) { toast.error(result.error); return; }

      const newTx: TxForUI = {
        id:                  result.data.transaction.id,
        studentFeeAccountId: form.accountId,
        studentName:         student.studentName,
        admissionNo:         student.admissionNo,
        studentClass:        student.class,       // ← for receipt
        invoiceNo:           student.invoiceNo,   // ← for receipt
        amount:              enteredAmt,
        paymentMethod:       meta.dbMethod,
        referenceNumber:     form.txnRef  || null,
        mobileMoneyPhone:    NEEDS_PHONE.has(method) ? form.phone : null,
        mobileMoneyNetwork:  meta.momoNetwork ?? null,
        processedAt:         result.data.transaction.processedAt?.toISOString() ?? new Date().toISOString(),
        receiptNumber:       result.data.receipt.receiptNumber,
        isReversal:          false,
        reversedAt:          null,
        description:         form.notes || null,
      };

      setPostedTx(newTx);
      setStep("success");
      onPosted(newTx);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) handleClose(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">

        {/* ── STEP 1: FORM ──────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Post a payment against a student fee account. Partial payments are allowed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1 max-h-[65vh] overflow-y-auto pr-1">

              {/* Student */}
              <div className="space-y-1.5">
                <Label>Student <span className="text-red-500">*</span></Label>
                <Select
                  value={form.accountId}
                  onValueChange={(v) => {
                    const s = students.find((x) => x.accountId === v);
                    setForm({ ...form, accountId: v, invoiceId: s?.invoiceId ?? "", amount: "" });
                  }}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select student…" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No students with outstanding balances
                      </SelectItem>
                    ) : (
                      students.map((s) => (
                        <SelectItem key={s.accountId} value={s.accountId}>
                          <span className="font-medium">{s.studentName}</span>
                          <span className="text-slate-400 text-xs ml-2">
                            {s.admissionNo}{s.class ? ` · ${s.class}` : ""}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {student && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                    <span className="text-amber-700 font-mono truncate max-w-[60%]">
                      {student.invoiceNo}
                    </span>
                    <span className="font-bold text-amber-800 shrink-0 ml-2">
                      {fmt(student.balance)}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Amount (UGX) <span className="text-red-500">*</span></Label>
                  {student && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, amount: student.balance.toString() })}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Pay full balance
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={`border-slate-200 font-mono text-lg ${isOverpay ? "border-red-400 bg-red-50" : ""}`}
                  min={1}
                />
                {isPartial && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Partial — {fmt(student!.balance - enteredAmt)} will remain outstanding.</span>
                  </div>
                )}
                {isOverpay && (
                  <p className="text-xs text-red-600">Amount exceeds balance ({fmt(student!.balance)})</p>
                )}
              </div>

              {/* Method grid */}
              <div className="space-y-1.5">
                <Label>Payment Method <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(METHOD_META) as [UIMethod, typeof METHOD_META[UIMethod]][]).map(([m, cfg]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, method: m, txnRef: "", phone: "" })}
                      className={`border rounded-lg p-2.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                        form.method === m
                          ? `${cfg.color} border-2`
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <cfg.icon className="w-3.5 h-3.5 shrink-0" />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone (MoMo only) */}
              {NEEDS_PHONE.has(method) && (
                <div className="space-y-1.5">
                  <Label>Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder={method === "MTN_MOMO" ? "07XXXXXXXX" : "075XXXXXXX"}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border-slate-200"
                    maxLength={12}
                  />
                </div>
              )}

              {/* Transaction reference */}
              {NEEDS_TXN_REF.has(method) && (
                <div className="space-y-1.5">
                  <Label>{TXN_REF_LABELS[method]} <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder={TXN_REF_PLACEHOLDERS[method]}
                    value={form.txnRef}
                    onChange={(e) => setForm({ ...form, txnRef: e.target.value })}
                    className="border-slate-200 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Stored permanently on the ledger entry.</p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-slate-500">Notes (optional)</Label>
                <Input
                  placeholder="Any additional notes…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="border-slate-200"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="border-slate-200">Cancel</Button>
              <Button
                disabled={!isValid()}
                onClick={() => setStep("confirm")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Review →
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP 2: CONFIRM ───────────────────────────────────────────── */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>Review carefully — this creates an immutable ledger entry.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                {([
                  ["Student",   student?.studentName],
                  ["Admission", student?.admissionNo],
                  ["Invoice",   student?.invoiceNo],
                  ["Amount",    fmt(enteredAmt)],
                  ["Method",    meta?.label],
                  ...(NEEDS_PHONE.has(method)   ? [["Phone",   form.phone]]                   : []),
                  ...(NEEDS_TXN_REF.has(method) ? [[TXN_REF_LABELS[method], form.txnRef]]     : []),
                  ...(form.notes ? [["Notes", form.notes]] : []),
                ] as [string, string | undefined][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className={`font-semibold ${k === "Amount" ? "text-blue-700 text-base" : "text-slate-800"}`}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {student && (
                <div className={`flex justify-between items-center px-4 py-2.5 rounded-lg border text-sm ${
                  enteredAmt >= student.balance
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}>
                  <span>Balance after this payment</span>
                  <span className="font-bold">{fmt(Math.max(student.balance - enteredAmt, 0))}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("form")} className="border-slate-200">← Back</Button>
              <Button
                onClick={handlePost}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting…</>
                  : "Post Payment"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP 3: SUCCESS + RECEIPT ─────────────────────────────────── */}
        {step === "success" && postedTx && (
          <div className="py-6 text-center space-y-4">
            {/* Checkmark */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Posted!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Receipt generated · Ledger updated · Balance recalculated
              </p>
            </div>

            {/* Receipt number pill */}
            {postedTx.receiptNumber && (
              <code className="inline-block bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700">
                {postedTx.receiptNumber}
              </code>
            )}

            {/* ── Receipt actions ─────────────────────────────────────── */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 space-y-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Receipt
              </p>
              <div className="flex items-center justify-center gap-2">
                <ReceiptPrintButton receipt={toReceiptData(postedTx)} school={school} />
                <ReceiptDownloadButton receipt={toReceiptData(postedTx)} school={school} />
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={reset} className="border-slate-200 text-sm">
                Record Another
              </Button>
              <Button onClick={handleClose} className="bg-slate-800 hover:bg-slate-900 text-white text-sm">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Payment Notes Dialog ────────────────────────────────────────────────

function EditPaymentDialog({
  tx,
  onUpdated,
}: {
  tx:        TxForUI;
  onUpdated: (id: string, description: string, referenceNumber: string) => void;
}) {
  const [open,      setOpen]      = useState(false);
  const [isPending, start]        = useTransition();
  const [desc,      setDesc]      = useState(tx.description ?? "");
  const [ref,       setRef]       = useState(tx.referenceNumber ?? "");

  const handleSave = () => {
    start(async () => {
      const result = await updatePaymentNotes(tx.id, {
        description:     desc     || undefined,
        referenceNumber: ref      || undefined,
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Payment updated");
      onUpdated(tx.id, desc, ref);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Payment Details</DialogTitle>
          <DialogDescription>
            Only notes and reference number can be changed. The amount and method are permanent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Reference Number</Label>
            <Input
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="Bank ref, MoMo ID, cheque no…"
              className="border-slate-200 font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes / Description</Label>
            <Input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Any additional notes…"
              className="border-slate-200 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-200">Cancel</Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reverse Button ───────────────────────────────────────────────────────────

function ReverseButton({
  tx,
  userId,
  onReversed,
}: {
  tx:         TxForUI;
  userId:     string;
  onReversed: (id: string) => void;
}) {
  const [isPending, start]  = useTransition();
  const [open,   setOpen]   = useState(false);
  const [reason, setReason] = useState("Admin correction");

  const doReverse = () => {
    start(async () => {
      const result = await reverseTransaction(tx.id, reason, userId);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Payment reversed — ledger updated");
      setOpen(false);
      onReversed(tx.id);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 gap-1"
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
          Reverse
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reverse this payment?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Creates an immutable reversal ledger entry and recalculates the student's balance.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student</span>
                  <span className="font-semibold text-slate-800">{tx.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-red-600">{fmt(tx.amount)}</span>
                </div>
                {tx.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt</span>
                    <code className="text-xs font-mono text-slate-600">{tx.receiptNumber}</code>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for reversal"
                  className="border-slate-200 text-sm"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={doReverse}
            disabled={isPending || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reversing…</>
              : "Confirm Reversal"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentsClient({
  students,
  transactions: initialTx,
  slug,
  userId,
  school,          // ← new prop: pass from server page
}: {
  students:     StudentForUI[];
  transactions: TxForUI[];
  slug:         string;
  userId:       string;
  school:       SchoolInfo;
}) {
  const [transactions, setTx] = useState<TxForUI[]>(initialTx);
  const [search, setSearch]   = useState("");

  const activePayments = transactions.filter((t) => !t.isReversal && !t.reversedAt);
  const totalCollected = activePayments.reduce((s, t) => s + t.amount, 0);
  const reversalCount  = transactions.filter((t) => t.reversedAt).length;
  const today          = new Date().toDateString();
  const todayCollected = activePayments
    .filter((t) => new Date(t.processedAt).toDateString() === today)
    .reduce((s, t) => s + t.amount, 0);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.studentName.toLowerCase().includes(q)             ||
      t.admissionNo.toLowerCase().includes(q)             ||
      (t.receiptNumber   ?? "").toLowerCase().includes(q) ||
      (t.referenceNumber ?? "").toLowerCase().includes(q)
    );
  });

  const handlePosted   = (tx: TxForUI) => setTx((p) => [tx, ...p]);
  const handleReversed = (id: string)  =>
    setTx((p) => p.map((t) => t.id === id ? { ...t, reversedAt: new Date().toISOString() } : t));
  const handleUpdated  = (id: string, description: string, referenceNumber: string) =>
    setTx((p) => p.map((t) => t.id === id ? { ...t, description, referenceNumber } : t));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable ledger · full and partial payments accepted
          </p>
        </div>
        <RecordPaymentDialog
          students={students}
          userId={userId}
          school={school}
          onPosted={handlePosted}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Collected",     value: `UGX ${(totalCollected / 1_000_000).toFixed(2)}M`, sub: `${activePayments.length} payment${activePayments.length !== 1 ? "s" : ""}`, icon: TrendingUp, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "Today's Collections", value: `UGX ${(todayCollected / 1_000_000).toFixed(2)}M`, sub: "This calendar day",          icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Reversals",           value: reversalCount,                                      sub: "Original entries preserved",  icon: RotateCcw,    color: "text-red-600",     bg: "bg-red-50 border-red-100"         },
        ].map((c) => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs font-medium text-slate-500">{c.label}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search student, receipt or transaction ref…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200 w-96"
        />
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No payments recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Use "Record Payment" to post the first payment.</p>
        </div>
      )}

      {/* Table */}
      {transactions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                {["Receipt", "Student", "Amount", "Method", "Transaction Ref", "Date", "Status", ""].map((h) => (
                  <TableHead
                    key={h}
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400">
                    No payments match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tx) => {
                  const dm         = DB_METHOD_DISPLAY[tx.paymentMethod] ?? DB_METHOD_DISPLAY.CASH;
                  const isVoided   = !!tx.reversedAt;
                  const canReverse = !isVoided && !tx.isReversal;
                  // Show print button for any non-reversal row that has a receipt number
                  const canPrint   = !tx.isReversal && !!tx.receiptNumber;

                  return (
                    <TableRow
                      key={tx.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isVoided || tx.isReversal ? "opacity-50" : ""
                      }`}
                    >
                      {/* Receipt */}
                      <TableCell className="pl-5">
                        {tx.receiptNumber ? (
                          <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {tx.receiptNumber}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>

                      {/* Student */}
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-800">{tx.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{tx.admissionNo}</p>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <span className={`font-bold text-sm ${tx.isReversal ? "text-red-600" : "text-slate-800"}`}>
                          {tx.isReversal ? "−" : ""}UGX {tx.amount.toLocaleString()}
                        </span>
                      </TableCell>

                      {/* Method */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className={`text-[10px] border gap-1 w-fit ${dm.color}`}>
                            <dm.icon className="w-3 h-3" />
                            {tx.mobileMoneyNetwork ? `${tx.mobileMoneyNetwork} MoMo` : dm.label}
                          </Badge>
                          {tx.mobileMoneyPhone && (
                            <span className="text-[10px] text-slate-400">{tx.mobileMoneyPhone}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Transaction ref */}
                      <TableCell>
                        {tx.referenceNumber ? (
                          <code className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {tx.referenceNumber}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(tx.processedAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {tx.isReversal ? (
                          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 gap-1">
                            <RotateCcw className="w-3 h-3" /> Reversal
                          </Badge>
                        ) : isVoided ? (
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                            Reversed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Posted
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions: Print + Edit + Reverse */}
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1">
                          {canPrint && (
                            <ReceiptPrintButton
                              receipt={toReceiptData(tx)}
                              school={school}
                              variant={isVoided ? "ghost" : "outline"}
                            />
                          )}
                          {!tx.isReversal && !isVoided && (
                            <EditPaymentDialog tx={tx} onUpdated={handleUpdated} />
                          )}
                          {canReverse && (
                            <ReverseButton tx={tx} userId={userId} onReversed={handleReversed} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}