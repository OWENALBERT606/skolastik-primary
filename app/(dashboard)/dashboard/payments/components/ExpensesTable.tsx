"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddExpenseModal from "./AddExpenseModal";

type Expense = { id: string; description: string; amount: number; currency: string; category: string; paidAt: string };

const fmt = (n: number) => `UGX ${n.toLocaleString("en-UG")}`;

const CAT_COLORS: Record<string, string> = {
  SERVER:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DOMAIN:   "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  SOFTWARE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  OTHER:    "bg-slate-100 text-slate-600",
};

export default function ExpensesTable({ initial }: { initial: Expense[] }) {
  const [expenses, setExpenses] = useState(initial);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", paidAt: "", category: "SERVER" });
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  function openEdit(e: Expense) {
    setEditTarget(e);
    setEditForm({
      description: e.description,
      amount:      String(e.amount),
      paidAt:      new Date(e.paidAt).toISOString().split("T")[0],
      category:    e.category,
    });
  }

  function handleSave() {
    if (!editTarget) return;
    if (!editForm.description || !editForm.amount) { toast.error("All fields required"); return; }
    startSave(async () => {
      const res = await fetch("/api/admin/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, ...editForm, amount: Number(editForm.amount) }),
      });
      if (!res.ok) { toast.error("Failed to update expense"); return; }
      const updated = await res.json();
      setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
      toast.success("Expense updated");
      setEditTarget(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDelete(async () => {
      const res = await fetch("/api/admin/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) { toast.error("Failed to delete expense"); return; }
      setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id));
      toast.success("Expense deleted");
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Server & Hosting Expenses</h3>
        <AddExpenseModal onCreated={e => setExpenses(prev => [e, ...prev])} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {expenses.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">No expenses logged yet.</td></tr>
            )}
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{e.description}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">{fmt(e.amount)}</td>
                <td className="px-4 py-3 text-center text-xs text-slate-500">
                  {new Date(e.paidAt).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[e.category] ?? CAT_COLORS.OTHER}`}>
                    {e.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                      <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteTarget(e)}>
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300">Total</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{fmt(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount (UGX)</label>
                <Input type="number" min={0} value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={editForm.paidAt} onChange={e => setEditForm(f => ({ ...f, paidAt: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
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
              <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSave}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{deleteTarget?.description}</span> — {deleteTarget ? fmt(deleteTarget.amount) : ""} will be permanently removed.
          </p>
          <div className="flex gap-2 pt-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
