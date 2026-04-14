"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Badge }  from "@/components/ui/badge";

type School = { schoolId: string; schoolName: string; isActive: boolean; pricePerTerm: number | null; currency: string };
type Term   = { id: string; name: string };
type Payment = { id: string; receiptNumber: string; amountPaid: number; currency: string; paidAt: string; note?: string | null; school: { name: string }; term: { name: string } };

const fmt = (n: number) => `UGX ${n.toLocaleString("en-UG")}`;

export default function SchoolBillingTable({
  schools: initial, terms, payments, selectedTerm,
  onRecordPayment, onPriceUpdated,
}: {
  schools:         School[];
  terms:           Term[];
  payments:        Payment[];
  selectedTerm:    string;
  onRecordPayment: (s: School) => void;
  onPriceUpdated:  (schoolId: string, price: number) => void;
}) {
  const [schools, setSchools] = useState(initial);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving,  startSave]  = useTransition();

  function startEdit(s: School) {
    setEditId(s.schoolId);
    setEditVal(String(s.pricePerTerm ?? ""));
  }

  function cancelEdit() { setEditId(null); setEditVal(""); }

  function savePrice(schoolId: string) {
    const price = Number(editVal);
    if (!price || price <= 0) { toast.error("Enter a valid price"); return; }
    startSave(async () => {
      const res = await fetch("/api/admin/billing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, pricePerTerm: price }),
      });
      if (!res.ok) { toast.error("Failed to save price"); return; }
      setSchools(prev => prev.map(s => s.schoolId === schoolId ? { ...s, pricePerTerm: price } : s));
      onPriceUpdated(schoolId, price);
      toast.success("Price updated");
      cancelEdit();
    });
  }

  // Compute per-school totals from payments
  function getSchoolStats(schoolId: string) {
    const filtered = selectedTerm === "all"
      ? payments.filter(p => (p as any).schoolId === schoolId)
      : payments.filter(p => (p as any).schoolId === schoolId && (p as any).termId === selectedTerm);
    const totalPaid = filtered.reduce((s, p) => s + p.amountPaid, 0);
    return { totalPaid, paymentCount: filtered.length };
  }

  const termCount = selectedTerm === "all" ? terms.length : 1;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">School</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price/Term</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Terms</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Billed</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Paid</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {schools.length === 0 && (
            <tr><td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">No schools found.</td></tr>
          )}
          {schools.map(s => {
            const { totalPaid } = getSchoolStats(s.schoolId);
            const totalBilled   = (s.pricePerTerm ?? 0) * termCount;
            const balance       = Math.max(totalBilled - totalPaid, 0);
            const isEditing     = editId === s.schoolId;

            return (
              <tr key={s.schoolId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className="font-medium text-slate-800 dark:text-slate-100">{s.schoolName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                        className="w-28 h-7 text-xs text-right" autoFocus />
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={saving} onClick={() => savePrice(s.schoolId)}>
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-600" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                        <X className="h-3 w-3 text-slate-400" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="font-mono text-xs">{s.pricePerTerm ? fmt(s.pricePerTerm) : <span className="text-slate-400">—</span>}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(s)}>
                        <Pencil className="h-3 w-3 text-slate-400" />
                      </Button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-400">{termCount}</td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{fmt(totalBilled)}</td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(totalPaid)}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-mono text-xs font-bold ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {balance > 0 ? fmt(balance) : "✓ Paid"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => onRecordPayment(s)}>
                    <Receipt className="h-3 w-3" /> Pay
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
