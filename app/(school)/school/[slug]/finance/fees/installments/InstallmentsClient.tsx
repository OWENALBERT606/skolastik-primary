// app/school/[slug]/finance/fees/installments/InstallmentsClient.tsx
"use client";

import { useState, useTransition } from "react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Badge }     from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader,
  SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Banknote, CheckCircle2, ChevronRight, Clock,
  Plus, Loader2, AlertCircle, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import {
  createInstallmentPlan,
  markInstallmentPaid,
} from "@/actions/fee-bursary-installment";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InstallmentForUI = {
  id:                string;
  installmentNumber: number;
  amount:            number;
  dueDate:           string;
  isPaid:            boolean;
  paidAt:            string | null;
  transactionId:     string | null;
};

export type PlanForUI = {
  id:          string;
  name:        string;
  isActive:    boolean;
  totalAmount: number;
  paidAmount:  number;
  accountId:   string;
  studentId:   string;
  studentName: string;
  admissionNo: string;
  class:       string;
  createdAt:   string;
  installments: InstallmentForUI[];
};

export type StudentOption = {
  accountId:   string;
  studentId:   string;
  studentName: string;
  admissionNo: string;
  balance:     number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtUGX  = (n: number) => `UGX ${n.toLocaleString()}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
const isOverdue = (iso: string) => !false && new Date(iso) < new Date();

// ─── Create Plan Dialog ────────────────────────────────────────────────────────

function CreatePlanDialog({
  students,
  userId,
  onCreated,
}: {
  students:  StudentOption[];
  userId:    string;
  onCreated: (plan: PlanForUI) => void;
}) {
  const [open,     setOpen]    = useState(false);
  const [isPending, start]     = useTransition();
  const [step,     setStep]    = useState<"form" | "success">("form");
  const [form,     setForm]    = useState({
    accountId:    "",
    count:        "3",
    startDate:    "",
    planName:     "",
  });

  const student  = students.find((s) => s.accountId === form.accountId);
  const count    = Math.max(2, Math.min(12, Number(form.count) || 3));
  const perInst  = student ? Math.ceil(student.balance / count) : 0;
  const isValid  = !!form.accountId && !!form.startDate && count >= 2;

  const reset = () => {
    setForm({ accountId: "", count: "3", startDate: "", planName: "" });
    setStep("form");
  };
  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const doCreate = () => {
    if (!student) return;
    start(async () => {
      // Build installment dates: monthly from startDate
      const start0 = new Date(form.startDate);
      const installments = Array.from({ length: count }, (_, i) => {
        const d = new Date(start0);
        d.setMonth(d.getMonth() + i);
        return {
          amount:  i < count - 1 ? perInst : student.balance - perInst * (count - 1),
          dueDate: d,
        };
      });

      const result = await createInstallmentPlan({
        studentFeeAccountId: form.accountId,
        name:                form.planName.trim() || `${count}-Part Payment Plan`,
        installments,
        createdById:         userId,
      });

      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Installment plan created");
      setStep("success");

      // optimistic plan
      onCreated({
        id:          result.data.id,
        name:        result.data.name,
        isActive:    true,
        totalAmount: student.balance,
        paidAmount:  0,
        accountId:   form.accountId,
        studentId:   student.studentId,
        studentName: student.studentName,
        admissionNo: student.admissionNo,
        class:       "",
        createdAt:   new Date().toISOString(),
        installments: installments.map((inst, i) => ({
          id:                `new-${i}`,
          installmentNumber: i + 1,
          amount:            inst.amount,
          dueDate:           inst.dueDate.toISOString(),
          isPaid:            false,
          paidAt:            null,
          transactionId:     null,
        })),
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) handleClose(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4" /> New Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Installment Plan</DialogTitle>
              <DialogDescription>Split a student's balance into scheduled monthly payments.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-1">
              {/* Student */}
              <div className="space-y-1.5">
                <Label>Student <span className="text-red-500">*</span></Label>
                <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select student…" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.length === 0
                      ? <SelectItem value="_none" disabled>No students with outstanding balance</SelectItem>
                      : students.map((s) => (
                          <SelectItem key={s.accountId} value={s.accountId}>
                            <span className="font-medium">{s.studentName}</span>
                            <span className="text-slate-400 text-xs ml-2">{fmtUGX(s.balance)}</span>
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Plan name */}
              <div className="space-y-1.5">
                <Label className="text-slate-500">Plan Name (optional)</Label>
                <Input
                  placeholder="e.g. Term 1 3-Part Plan"
                  value={form.planName}
                  onChange={(e) => setForm({ ...form, planName: e.target.value })}
                  className="border-slate-200"
                />
              </div>

              {/* Count */}
              <div className="space-y-1.5">
                <Label>Number of Installments <span className="text-slate-400 font-normal">(2–12)</span></Label>
                <Input
                  type="number" min={2} max={12}
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  className="border-slate-200 font-mono"
                />
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <Label>First Payment Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="border-slate-200"
                />
              </div>

              {/* Preview */}
              {student && form.startDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-800 space-y-1">
                  <p className="font-bold">{count} monthly installments</p>
                  <p>≈ <strong>{fmtUGX(perInst)}</strong> per installment</p>
                  <p>Total: <strong>{fmtUGX(student.balance)}</strong></p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="border-slate-200">Cancel</Button>
              <Button
                disabled={!isValid || isPending}
                onClick={doCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                  : "Create Plan"}
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
              <h3 className="text-lg font-bold text-slate-900">Plan Created!</h3>
              <p className="text-sm text-slate-500 mt-1">{count} installments scheduled</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={reset} className="border-slate-200 text-sm">Create Another</Button>
              <Button onClick={handleClose} className="bg-slate-800 hover:bg-slate-900 text-white text-sm">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan Detail Sheet ─────────────────────────────────────────────────────────

function PlanDetailSheet({
  plan,
  userId,
  onInstallmentPaid,
}: {
  plan:              PlanForUI;
  userId:            string;
  onInstallmentPaid: (planId: string, instId: string) => void;
}) {
  const [isPending, start] = useTransition();
  const [payingId, setPayingId] = useState<string | null>(null);

  const paidCount = plan.installments.filter((i) => i.isPaid).length;
  const progress  = Math.round((paidCount / plan.installments.length) * 100);

  const doMarkPaid = (instId: string) => {
    setPayingId(instId);
    start(async () => {
      const result = await markInstallmentPaid(instId, "manual");
      setPayingId(null);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Installment marked as paid");
      onInstallmentPaid(plan.id, instId);
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50">
          View <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-slate-200">
          <SheetTitle className="text-base font-bold">{plan.studentName}</SheetTitle>
          <p className="text-xs font-mono text-slate-400">{plan.admissionNo}{plan.class ? ` · ${plan.class}` : ""}</p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xl font-black text-slate-900">{fmtUGX(plan.totalAmount)}</p>
              <p className="text-[10px] uppercase text-slate-400">Total</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xl font-black text-emerald-600">{fmtUGX(plan.paidAmount)}</p>
              <p className="text-[10px] uppercase text-slate-400">Paid</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xl font-black text-amber-600">{fmtUGX(plan.totalAmount - plan.paidAmount)}</p>
              <p className="text-[10px] uppercase text-slate-400">Remaining</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>{paidCount} of {plan.installments.length} paid</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-2.5">
          {plan.installments.map((inst) => {
            const overdue = !inst.isPaid && isOverdue(inst.dueDate);
            return (
              <div
                key={inst.id}
                className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${
                  inst.isPaid
                    ? "border-emerald-200 bg-emerald-50/40"
                    : overdue
                    ? "border-red-200 bg-red-50/30"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  {inst.isPaid
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    : overdue
                    ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    : <Clock className="w-5 h-5 text-slate-300 shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Installment {inst.installmentNumber}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CalendarDays className="w-3 h-3 text-slate-400" />
                      <p className={`text-[10px] ${overdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                        Due: {fmtDate(inst.dueDate)}
                        {inst.isPaid && inst.paidAt ? ` · Paid: ${fmtDate(inst.paidAt)}` : ""}
                        {overdue ? " · OVERDUE" : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-black text-slate-800">{fmtUGX(inst.amount)}</p>
                  {!inst.isPaid && (
                    <Button
                      size="sm"
                      disabled={isPending && payingId === inst.id}
                      onClick={() => doMarkPaid(inst.id)}
                      className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white mt-1.5"
                    >
                      {isPending && payingId === inst.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : "Mark Paid"
                      }
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function InstallmentsClient({
  plans:    initialPlans,
  students,
  slug,
  userId,
}: {
  plans:    PlanForUI[];
  students: StudentOption[];
  slug:     string;
  userId:   string;
}) {
  const [plans, setPlans] = useState<PlanForUI[]>(initialPlans);

  const handleCreated = (plan: PlanForUI) =>
    setPlans((p) => [plan, ...p]);

  const handleInstallmentPaid = (planId: string, instId: string) =>
    setPlans((prev) => prev.map((plan) => {
      if (plan.id !== planId) return plan;
      const inst = plan.installments.find((i) => i.id === instId);
      const paid = inst ? inst.amount : 0;
      return {
        ...plan,
        paidAmount:   plan.paidAmount + paid,
        installments: plan.installments.map((i) =>
          i.id === instId
            ? { ...i, isPaid: true, paidAt: new Date().toISOString() }
            : i
        ),
      };
    }));

  const activeCount   = plans.filter((p) => p.isActive && p.paidAmount < p.totalAmount).length;
  const completedCount= plans.filter((p) => p.paidAmount >= p.totalAmount).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Installment Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeCount} active · {completedCount} completed
          </p>
        </div>
        <CreatePlanDialog students={students} userId={userId} onCreated={handleCreated} />
      </div>

      {/* Empty state */}
      {plans.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Banknote className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-700">No installment plans</p>
          <p className="text-xs text-slate-400 mt-1">Create a plan to split a student's fees into scheduled payments.</p>
        </div>
      )}

      {/* Plans list */}
      <div className="space-y-3">
        {plans.map((plan) => {
          const paidCount = plan.installments.filter((i) => i.isPaid).length;
          const progress  = Math.round((paidCount / plan.installments.length) * 100);
          const isComplete = plan.paidAmount >= plan.totalAmount;
          const nextDue   = plan.installments.find((i) => !i.isPaid);
          const hasOverdue = plan.installments.some((i) => !i.isPaid && isOverdue(i.dueDate));

          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${
                isComplete ? "border-emerald-200" : hasOverdue ? "border-red-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 ${
                    isComplete ? "bg-gradient-to-br from-emerald-400 to-emerald-600" :
                    hasOverdue ? "bg-gradient-to-br from-red-400 to-red-500" :
                                 "bg-gradient-to-br from-blue-400 to-blue-600"
                  }`}>
                    {plan.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{plan.studentName}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {plan.admissionNo}{plan.class ? ` · ${plan.class}` : ""}
                    </p>
                    {plan.name && (
                      <p className="text-[10px] text-slate-400 italic">{plan.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status badges */}
                  <div className="text-right space-y-1">
                    <p className="text-sm font-black text-slate-800">{fmtUGX(plan.totalAmount)}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      {isComplete
                        ? <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">Completed</Badge>
                        : hasOverdue
                        ? <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50">Has Overdue</Badge>
                        : <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 bg-blue-50">Active</Badge>
                      }
                      <span className="text-[10px] text-slate-400">{paidCount}/{plan.installments.length} paid</span>
                    </div>
                    {nextDue && !isComplete && (
                      <p className="text-[10px] text-slate-400">
                        Next: <span className={hasOverdue ? "text-red-500 font-semibold" : ""}>{fmtDate(nextDue.dueDate)}</span>
                      </p>
                    )}
                  </div>

                  <PlanDetailSheet
                    plan={plan}
                    userId={userId}
                    onInstallmentPaid={handleInstallmentPaid}
                  />
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isComplete ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                      hasOverdue ? "bg-gradient-to-r from-red-400 to-red-500" :
                                   "bg-gradient-to-r from-blue-400 to-blue-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span className="text-emerald-600 font-semibold">{fmtUGX(plan.paidAmount)} paid</span>
                  <span className="text-amber-600 font-semibold">{fmtUGX(plan.totalAmount - plan.paidAmount)} remaining</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}