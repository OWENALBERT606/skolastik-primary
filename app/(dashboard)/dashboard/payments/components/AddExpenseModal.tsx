"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Expense = { id: string; description: string; amount: number; currency: string; category: string; paidAt: string };

export default function AddExpenseModal({ onCreated }: { onCreated: (e: Expense) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ description: "", amount: "", paidAt: today, category: "SERVER" });

  function handleSubmit() {
    if (!form.description || !form.amount || !form.paidAt) { toast.error("All fields required"); return; }
    start(async () => {
      const res = await fetch("/api/admin/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) { toast.error("Failed to add expense"); return; }
      const expense = await res.json();
      toast.success("Expense logged");
      onCreated(expense);
      setOpen(false);
      setForm({ description: "", amount: "", paidAt: today, category: "SERVER" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input placeholder="e.g. Neon DB – April 2025" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input type="number" min={0} placeholder="e.g. 150000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.paidAt} onChange={e => setForm({ ...form, paidAt: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVER">Server / Hosting</SelectItem>
                <SelectItem value="DOMAIN">Domain</SelectItem>
                <SelectItem value="SOFTWARE">Software</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={pending} onClick={handleSubmit}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
