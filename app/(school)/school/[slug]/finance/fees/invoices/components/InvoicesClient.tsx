// app/school/[slug]/finance/fees/invoices/InvoicesClient.tsx
"use client";

import { useState, useTransition } from "react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Badge }     from "@/components/ui/badge";
import { Textarea }  from "@/components/ui/textarea";
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
  Sheet, SheetContent, SheetHeader,
  SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Ban, BadgeDollarSign, ChevronRight,
  FileText, Plus, Search, Loader2,
  CheckCircle2, AlertCircle, Clock,
  Receipt, Info, Check, ChevronsUpDown,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  voidInvoice,
  applyInvoiceDiscount,
  createManualInvoice,
} from "@/actions/fee-account-invoice";
import { ReceiptPrintButton, SchoolInfo } from "../../payments/components/ReceiptPDF";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID";

export type InvoiceItem = {
  id:          string;
  name:        string;
  description: string | null;
  amount:      number;
  quantity:    number;
  unitPrice:   number;
};

export type InvoiceReceipt = {
  receiptNumber: string;
  issuedAt:      string;
};

export type InvoiceForUI = {
  id:                  string;
  invoiceNumber:       string;
  studentFeeAccountId: string;
  studentId:           string;
  studentName:         string;
  admissionNo:         string;
  class:               string;
  totalAmount:         number;
  paidAmount:          number;
  discountAmount:      number;
  waivedAmount:        number;
  balance:             number;
  carryForward:        number;
  status:              InvoiceStatus;
  trigger:             string;
  issueDate:           string;
  dueDate:             string | null;
  notes:               string | null;
  canVoid:             boolean;
  items:               InvoiceItem[];
  receipts:            InvoiceReceipt[];
};

export type StudentOption = {
  accountId:   string;
  studentId:   string;
  studentName: string;
  admissionNo: string;
  balance:     number;
};

export type FeeStructureOption = {
  id:          string;
  name:        string;
  totalAmount: number;
  className:   string;
  items:       { feeCategoryId: string; feeCategoryName: string; amount: number }[];
};

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { color: string; icon: React.ElementType }> = {
  DRAFT:     { color: "bg-slate-50 text-slate-500 border-slate-200",   icon: FileText     },
  ISSUED:    { color: "bg-blue-50 text-blue-700 border-blue-200",      icon: FileText     },
  PARTIAL:   { color: "bg-amber-50 text-amber-700 border-amber-200",   icon: Clock        },
  PAID:      { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  OVERDUE:   { color: "bg-red-50 text-red-700 border-red-200",         icon: AlertCircle  },
  CANCELLED: { color: "bg-slate-50 text-slate-400 border-slate-200",   icon: Ban          },
  VOID:      { color: "bg-slate-50 text-slate-400 border-slate-200",   icon: Ban          },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtUGX  = (n: number) => `UGX ${n.toLocaleString()}`;
const fmtDate = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

// ─── Void Invoice Dialog ───────────────────────────────────────────────────────

function VoidInvoiceDialog({
  invoice,
  userId,
  onVoided,
}: {
  invoice:  InvoiceForUI;
  userId:   string;
  onVoided: (id: string) => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, start]  = useTransition();

  const doVoid = () => {
    start(async () => {
      const result = await voidInvoice(invoice.id, reason, userId);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Invoice voided — ledger updated");
      setOpen(false);
      onVoided(invoice.id);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 gap-1">
          <Ban className="w-3 h-3" /> Void
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700">Void Invoice</DialogTitle>
          <DialogDescription>
            Void <strong>{invoice.invoiceNumber}</strong>. A reversal entry will be created in the ledger.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Student</span>
              <span className="font-semibold">{invoice.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-semibold text-red-600">{fmtUGX(invoice.totalAmount)}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Void Reason <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Reason for voiding this invoice…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border-slate-200 resize-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-200">Cancel</Button>
          <Button
            disabled={!reason.trim() || isPending}
            onClick={doVoid}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Voiding…</> : "Void Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Apply Discount / Waiver Dialog ───────────────────────────────────────────

function ApplyDiscountDialog({
  invoice,
  userId,
  onApplied,
}: {
  invoice:   InvoiceForUI;
  userId:    string;
  onApplied: (id: string, delta: number, type: "DISCOUNT" | "WAIVER") => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [isPending, start]  = useTransition();
  const [form,   setForm]   = useState({ type: "DISCOUNT" as "DISCOUNT" | "WAIVER", amount: "", description: "" });

  const maxAmount = invoice.balance;
  const entered   = Number(form.amount) || 0;
  const isOverMax = entered > maxAmount;

  const doApply = () => {
    start(async () => {
      const result = await applyInvoiceDiscount({
        invoiceId:    invoice.id,
        amount:       entered,
        type:         form.type,
        description:  form.description,
        approvedById: userId,
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(`${form.type} of ${fmtUGX(entered)} applied`);
      setOpen(false);
      onApplied(invoice.id, entered, form.type);
      setForm({ type: "DISCOUNT", amount: "", description: "" });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-violet-600 hover:bg-violet-50 gap-1">
          <BadgeDollarSign className="w-3 h-3" /> Discount
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Apply Discount / Waiver</DialogTitle>
          <DialogDescription>
            Reduces balance on <strong>{invoice.invoiceNumber}</strong>. Creates an immutable ledger entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["DISCOUNT", "WAIVER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`border rounded-lg p-2.5 text-xs font-medium transition-all ${
                    form.type === t
                      ? "border-violet-400 bg-violet-50 text-violet-700 border-2"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t === "DISCOUNT" ? "Discount" : "Full Waiver"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Amount (UGX) <span className="text-red-500">*</span></Label>
              {form.type === "WAIVER" && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, amount: invoice.balance.toString() })}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Waive full balance
                </button>
              )}
            </div>
            <Input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`border-slate-200 font-mono ${isOverMax ? "border-red-400 bg-red-50" : ""}`}
              max={maxAmount}
            />
            {isOverMax
              ? <p className="text-xs text-red-600">Exceeds outstanding balance ({fmtUGX(maxAmount)})</p>
              : <p className="text-xs text-slate-400">Balance: {fmtUGX(maxAmount)}</p>
            }
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Academic bursary approval"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-slate-200"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-200">Cancel</Button>
          <Button
            disabled={!form.amount || !form.description.trim() || isOverMax || entered <= 0 || isPending}
            onClick={doApply}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying…</>
              : `Apply ${form.type}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice Detail Sheet ──────────────────────────────────────────────────────

function InvoiceDetailSheet({
  invoice,
  school,
}: {
  invoice: InvoiceForUI;
  school:  SchoolInfo;
}) {
  const cfg = STATUS_CONFIG[invoice.status];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50">
          View <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        {/* Header */}
        <SheetHeader className="pb-4 border-b border-slate-200">
          <SheetTitle className="font-mono text-sm text-slate-600">{invoice.invoiceNumber}</SheetTitle>
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-base font-bold text-slate-900">{invoice.studentName}</p>
              <p className="text-xs text-slate-400">{invoice.admissionNo} · {invoice.class}</p>
            </div>
            <Badge variant="outline" className={`text-[11px] gap-1 ${cfg.color}`}>
              <cfg.icon className="w-3 h-3" />
              {invoice.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="py-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 rounded-lg px-3 py-2.5">
              <p className="text-slate-400 mb-0.5">Issue Date</p>
              <p className="font-semibold text-slate-700">{fmtDate(invoice.issueDate)}</p>
            </div>
            <div className={`rounded-lg px-3 py-2.5 ${invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.balance > 0 ? "bg-red-50" : "bg-slate-50"}`}>
              <p className="text-slate-400 mb-0.5">Due Date</p>
              <p className="font-semibold text-slate-700">{fmtDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Fee Items</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {invoice.items.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center px-4 py-3 text-sm ${
                    i < invoice.items.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-700">{item.name}</p>
                    {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-slate-400">{item.quantity} × {fmtUGX(item.unitPrice)}</p>
                    )}
                  </div>
                  <span className="font-semibold text-slate-800">{fmtUGX(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Summary</p>
            {[
              { label: "Total Invoiced",    value: fmtUGX(invoice.totalAmount),    color: "" },
              { label: "Arrears (prev term)", value: `+ ${fmtUGX(invoice.carryForward)}`, color: "text-red-600",    hidden: !invoice.carryForward || invoice.carryForward <= 0 },
              { label: "Credit (prev term)",  value: `- ${fmtUGX(Math.abs(invoice.carryForward))}`, color: "text-emerald-600", hidden: !invoice.carryForward || invoice.carryForward >= 0 },
              { label: "Discount Applied",  value: `- ${fmtUGX(invoice.discountAmount)}`, color: "text-violet-600", hidden: invoice.discountAmount === 0 },
              { label: "Waiver Applied",    value: `- ${fmtUGX(invoice.waivedAmount)}`,   color: "text-violet-600", hidden: invoice.waivedAmount === 0 },
              { label: "Amount Paid",       value: `- ${fmtUGX(invoice.paidAmount)}`,     color: "text-emerald-600" },
            ].filter((r) => !r.hidden).map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className={`font-semibold ${color || "text-slate-800"}`}>{value}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm">
              <span className="font-bold text-slate-700">Outstanding Balance</span>
              <span className={`font-bold text-base ${invoice.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {fmtUGX(invoice.balance)}
              </span>
            </div>
          </div>

          {/* Receipts */}
          {invoice.receipts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Receipts ({invoice.receipts.length})
              </p>
              <div className="space-y-2">
                {invoice.receipts.map((r) => (
                  <div key={r.receiptNumber} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <code className="text-xs font-mono text-slate-600">{r.receiptNumber}</code>
                      <p className="text-[10px] text-slate-400">{fmtDate(r.issuedAt)}</p>
                    </div>
                    <ReceiptPrintButton
                      receipt={{
                        receiptNumber: r.receiptNumber,
                        studentName:   invoice.studentName,
                        admissionNo:   invoice.admissionNo,
                        studentClass:  invoice.class,
                        invoiceNo:     invoice.invoiceNumber,
                        amount:        invoice.paidAmount,
                        paymentMethod: "CASH",
                        processedAt:   r.issuedAt,
                      }}
                      school={school}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{invoice.notes}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Create Manual Invoice Dialog ─────────────────────────────────────────────

function CreateInvoiceDialog({
  students,
  feeStructures,
  userId,
  onCreated,
  hidden = false,
}: {
  students:      StudentOption[];
  feeStructures: FeeStructureOption[];
  userId:        string;
  onCreated:     (inv: InvoiceForUI) => void;
  hidden?:       boolean;
}) {
  if (hidden) return null;
  const [open,     setOpen]    = useState(false);
  const [isPending, start]     = useTransition();
  const [step,     setStep]    = useState<"form" | "success">("form");
  const [createdNo, setCreatedNo] = useState("");
  const [studentOpen,   setStudentOpen]   = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [form,     setForm]    = useState({
    accountId:      "",
    feeStructureId: "",
    dueDate:        "",
    notes:          "",
  });

  const student   = students.find((s) => s.accountId === form.accountId);
  const structure = feeStructures.find((f) => f.id === form.feeStructureId);

  const isValid = !!form.accountId && !!form.feeStructureId;

  const reset = () => {
    setForm({ accountId: "", feeStructureId: "", dueDate: "", notes: "" });
    setStep("form");
    setCreatedNo("");
  };

  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const doCreate = () => {
    if (!student || !structure) return;
    start(async () => {
      const result = await createManualInvoice({
        studentFeeAccountId: form.accountId,
        dueDate:             form.dueDate ? new Date(form.dueDate) : undefined,
        notes:               form.notes   || undefined,
        createdById:         userId,
        items:               structure.items.map((item) => ({
          feeCategoryId: item.feeCategoryId,
          amount:        item.amount,
          quantity:      1,
        })),
      });
      if (!result.ok) { toast.error(result.error); return; }
      setCreatedNo(result.data.invoiceNumber);
      setStep("success");
      // Build minimal InvoiceForUI for optimistic update
      onCreated({
        id:                  result.data.id,
        invoiceNumber:       result.data.invoiceNumber,
        studentFeeAccountId: form.accountId,
        studentId:           student.studentId,
        studentName:         student.studentName,
        admissionNo:         student.admissionNo,
        class:               "",
        totalAmount:         structure.totalAmount,
        paidAmount:          0,
        discountAmount:      0,
        waivedAmount:        0,
        balance:             structure.totalAmount,
        carryForward:        0,
        status:              "ISSUED",
        trigger:             "MANUAL",
        issueDate:           new Date().toISOString(),
        dueDate:             form.dueDate ? new Date(form.dueDate).toISOString() : null,
        notes:               form.notes || null,
        canVoid:             true,
        items:               structure.items.map((item, i) => ({
          id:          `new-${i}`,
          name:        item.feeCategoryName,
          description: null,
          amount:      item.amount,
          quantity:    1,
          unitPrice:   item.amount,
        })),
        receipts: [],
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) handleClose(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Manual Invoice</DialogTitle>
              <DialogDescription>
                Generate an invoice from a published fee structure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Student */}
              <div className="space-y-1.5">
                <Label>Student <span className="text-red-500">*</span></Label>
                <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal border-slate-200">
                      {student
                        ? <span>{student.studentName} <span className="text-slate-400 text-xs ml-1">{student.admissionNo}</span></span>
                        : <span className="text-slate-400">Search student…</span>
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name or admission no…" />
                      <CommandList>
                        <CommandEmpty>No students found.</CommandEmpty>
                        <CommandGroup>
                          {students.map((s) => (
                            <CommandItem
                              key={s.accountId}
                              value={`${s.studentName} ${s.admissionNo}`}
                              onSelect={() => { setForm({ ...form, accountId: s.accountId }); setStudentOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.accountId === s.accountId ? "opacity-100" : "opacity-0")} />
                              <span className="font-medium">{s.studentName}</span>
                              <span className="text-slate-400 text-xs ml-2">{s.admissionNo}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fee Structure */}
              <div className="space-y-1.5">
                <Label>Fee Structure <span className="text-red-500">*</span></Label>
                <Popover open={structureOpen} onOpenChange={setStructureOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal border-slate-200">
                      {structure
                        ? <span>{structure.name} <span className="text-slate-400 text-xs ml-1">{fmtUGX(structure.totalAmount)}</span></span>
                        : <span className="text-slate-400">Search fee structure…</span>
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name or class…" />
                      <CommandList>
                        <CommandEmpty>No fee structures found.</CommandEmpty>
                        <CommandGroup>
                          {feeStructures.map((fs) => (
                            <CommandItem
                              key={fs.id}
                              value={`${fs.name} ${fs.className}`}
                              onSelect={() => { setForm({ ...form, feeStructureId: fs.id }); setStructureOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.feeStructureId === fs.id ? "opacity-100" : "opacity-0")} />
                              <span className="font-medium">{fs.name}</span>
                              <span className="text-slate-400 text-xs ml-2">{fs.className}</span>
                              <span className="text-slate-400 text-xs ml-2">{fmtUGX(fs.totalAmount)}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {structure && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                    {structure.items.map((item) => (
                      <div key={item.feeCategoryId} className="flex justify-between text-xs">
                        <span className="text-slate-500">{item.feeCategoryName}</span>
                        <span className="font-semibold text-slate-700">{fmtUGX(item.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-1.5 flex justify-between text-xs font-bold">
                      <span>Total</span>
                      <span className="text-blue-700">{fmtUGX(structure.totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <Label className="text-slate-500">Due Date (optional)</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="border-slate-200"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-slate-500">Notes (optional)</Label>
                <Input
                  placeholder="Any notes for this invoice…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="border-slate-200"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="border-slate-200">Cancel</Button>
              <Button
                disabled={!isValid || isPending}
                onClick={doCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                  : "Create Invoice"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Invoice Created!</h3>
              <p className="text-sm text-slate-500 mt-1">Ledger updated · Balance recalculated</p>
            </div>
            {createdNo && (
              <code className="inline-block bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600">
                {createdNo}
              </code>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={reset} className="border-slate-200 text-sm">
                Create Another
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

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ invoices }: { invoices: InvoiceForUI[] }) {
  const active  = invoices.filter((i) => i.status !== "VOID" && i.status !== "CANCELLED");
  const totalOwed     = active.reduce((s, i) => s + i.balance, 0);
  const totalCollected = active.reduce((s, i) => s + i.paidAmount, 0);
  const overdueCount  = invoices.filter((i) => i.status === "OVERDUE").length;
  const paidCount     = invoices.filter((i) => i.status === "PAID").length;

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: "Total Outstanding", value: `UGX ${(totalOwed / 1_000_000).toFixed(2)}M`,       color: "text-amber-600",   bg: "bg-amber-50 border-amber-100",   icon: FileText     },
        { label: "Collected",         value: `UGX ${(totalCollected / 1_000_000).toFixed(2)}M`, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: CheckCircle2 },
        { label: "Overdue",           value: overdueCount,                                       color: "text-red-600",     bg: "bg-red-50 border-red-100",         icon: AlertCircle  },
        { label: "Fully Paid",        value: paidCount,                                          color: "text-blue-700",  bg: "bg-blue-50 border-blue-100",   icon: Receipt      },
      ].map((c) => (
        <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <c.icon className={`w-4 h-4 ${c.color}`} />
            <span className="text-xs font-medium text-slate-500">{c.label}</span>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function InvoicesClient({
  invoices:       initialInvoices,
  students,
  feeStructures,
  slug,
  userId,
  school,
  hideCreateButton = false,
}: {
  invoices:          InvoiceForUI[];
  students:          StudentOption[];
  feeStructures:     FeeStructureOption[];
  slug:              string;
  userId:            string;
  school:            SchoolInfo;
  hideCreateButton?: boolean;
}) {
  const [invoices,     setInvoices]     = useState<InvoiceForUI[]>(initialInvoices);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.studentName.toLowerCase().includes(q) ||
      inv.admissionNo.toLowerCase().includes(q)  ||
      inv.invoiceNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Optimistic handlers
  const handleVoided = (id: string) =>
    setInvoices((p) => p.map((i) => i.id === id ? { ...i, status: "VOID" as const, canVoid: false } : i));

  const handleDiscounted = (id: string, delta: number, type: "DISCOUNT" | "WAIVER") =>
    setInvoices((p) => p.map((i) => {
      if (i.id !== id) return i;
      const newBalance = Math.max(i.balance - delta, 0);
      return {
        ...i,
        balance:        newBalance,
        discountAmount: type === "DISCOUNT" ? i.discountAmount + delta : i.discountAmount,
        waivedAmount:   type === "WAIVER"   ? i.waivedAmount   + delta : i.waivedAmount,
        status:         newBalance === 0 ? "PAID" : i.paidAmount > 0 ? "PARTIAL" : i.status,
      };
    }));

  const handleCreated = (inv: InvoiceForUI) =>
    setInvoices((p) => [inv, ...p]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} this term
          </p>
        </div>
        <CreateInvoiceDialog
          students={students}
          feeStructures={feeStructures}
          userId={userId}
          onCreated={handleCreated}
          hidden={hideCreateButton}
        />
      </div>

      {/* Summary cards */}
      <SummaryCards invoices={invoices} />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search student, admission no or invoice…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 w-80"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white border-slate-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {(["ISSUED","PARTIAL","PAID","OVERDUE","DRAFT","VOID"] as const).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {invoices.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No invoices this term</p>
          <p className="text-xs text-slate-400 mt-1">
            Use "Create Invoice" or enable auto-invoicing in Settings.
          </p>
        </div>
      )}

      {/* Table */}
      {invoices.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                {["Invoice No", "Student", "Total", "Paid", "Balance", "Due Date", "Status", ""].map((h) => (
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
                    No invoices match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => {
                  const cfg     = STATUS_CONFIG[inv.status];
                  const isVoid  = inv.status === "VOID" || inv.status === "CANCELLED";
                  const canEdit = !isVoid && inv.status !== "PAID";

                  return (
                    <TableRow
                      key={inv.id}
                      className={`hover:bg-slate-50/50 transition-colors ${isVoid ? "opacity-50" : ""}`}
                    >
                      {/* Invoice No */}
                      <TableCell className="pl-5">
                        <code className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {inv.invoiceNumber}
                        </code>
                      </TableCell>

                      {/* Student */}
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-800">{inv.studentName}</p>
                        <p className="text-[10px] text-slate-400">
                          {inv.admissionNo}{inv.class ? ` · ${inv.class}` : ""}
                        </p>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-xs font-medium text-slate-700">
                        {fmtUGX(inv.totalAmount)}
                      </TableCell>

                      {/* Paid */}
                      <TableCell className="text-xs font-semibold text-emerald-600">
                        {fmtUGX(inv.paidAmount)}
                      </TableCell>

                      {/* Balance */}
                      <TableCell>
                        <span className={`text-xs font-bold ${inv.balance > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {fmtUGX(inv.balance)}
                        </span>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className={`text-xs whitespace-nowrap ${
                        inv.dueDate && new Date(inv.dueDate) < new Date() && inv.balance > 0
                          ? "text-red-500 font-semibold"
                          : "text-slate-500"
                      }`}>
                        {fmtDate(inv.dueDate)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />
                          {inv.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1">
                          <InvoiceDetailSheet invoice={inv} school={school} />
                          {canEdit && (
                            <ApplyDiscountDialog
                              invoice={inv}
                              userId={userId}
                              onApplied={handleDiscounted}
                            />
                          )}
                          {inv.canVoid && (
                            <VoidInvoiceDialog
                              invoice={inv}
                              userId={userId}
                              onVoided={handleVoided}
                            />
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