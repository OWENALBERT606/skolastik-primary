"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Term = { id: string; name: string; startDate: string; endDate: string };

export default function AddTermModal({ onCreated }: { onCreated: (t: Term) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  function handleSubmit() {
    if (!form.name || !form.startDate || !form.endDate) { toast.error("All fields required"); return; }
    start(async () => {
      const res = await fetch("/api/admin/terms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Failed to create term");
        return;
      }
      const term = await res.json();
      toast.success(`Term "${term.name}" created`);
      onCreated(term);
      setOpen(false);
      setForm({ name: "", startDate: "", endDate: "" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" />Add Term</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Create Billing Term</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Term Name *</Label>
            <Input placeholder="e.g. Term 1 2025" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date *</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={pending} onClick={handleSubmit}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
