"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type School = { schoolId: string; schoolName: string };
type Term   = { id: string; name: string };
type Payment = { id: string; receiptNumber: string; amountPaid: number; currency: string; paidAt: string; note?: string | null; school: { name: string }; term: { name: string } };

export default function RegisterPaymentModal({
  open, onClose, schools, terms, prefilledSchoolId, onSuccess,
}: {
  open:               boolean;
  onClose:            () => void;
  schools:            School[];
  terms:              Term[];
  prefilledSchoolId?: string;
  onSuccess:          (p: Payment) => void;
}) {
  const [pending, start] = useTransition();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    schoolId:  prefilledSchoolId ?? "",
    termId:    "",
    amountPaid: "",
    note:      "",
    paidAt:    today,
  });

  function handleSubmit() {
    if (!form.schoolId || !form.termId || !form.amountPaid) { toast.error("School, term and amount are required"); return; }
    start(async () => {
      const res = await fetch("/api/admin/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amountPaid: Number(form.amountPaid) }),
      });
      if (!res.ok) { toast.error("Failed to record payment"); return; }
      const payment = await res.json();
      toast.success(`Payment recorded — ${payment.receiptNumber}`);
      onSuccess(payment);
      onClose();
      setForm({ schoolId: prefilledSchoolId ?? "", termId: "", amountPaid: "", note: "", paidAt: today });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>School *</Label>
            <Select value={form.schoolId} onValueChange={v => setForm({ ...form, schoolId: v })}>
              <SelectTrigger><SelectValue placeholder="Select school…" /></SelectTrigger>
              <SelectContent>
                {schools.map(s => <SelectItem key={s.schoolId} value={s.schoolId}>{s.schoolName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Term *</Label>
            <Select value={form.termId} onValueChange={v => setForm({ ...form, termId: v })}>
              <SelectTrigger><SelectValue placeholder="Select term…" /></SelectTrigger>
              <SelectContent>
                {terms.length === 0
                  ? <div className="px-3 py-4 text-sm text-slate-400 text-center">No terms yet — create one first.</div>
                  : terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input type="number" min={0} placeholder="e.g. 500000" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Date Paid</Label>
              <Input type="date" value={form.paidAt} onChange={e => setForm({ ...form, paidAt: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea placeholder="e.g. First instalment" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" disabled={pending} onClick={handleSubmit}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Record Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
