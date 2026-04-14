"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Receipt, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import RevenueOverview      from "./components/RevenueOverview";
import SchoolBillingTable   from "./components/SchoolBillingTable";
import RegisterPaymentModal from "./components/RegisterPaymentModal";
import ReceiptModal         from "./components/ReceiptModal";
import TermSelector         from "./components/TermSelector";
import AddTermModal         from "./components/AddTermModal";
import ExpensesTable        from "./components/ExpensesTable";

type School  = { schoolId: string; schoolName: string; isActive: boolean; pricePerTerm: number | null; currency: string };
type Term    = { id: string; name: string; startDate: string; endDate: string };
type Payment = { id: string; receiptNumber: string; amountPaid: number; currency: string; paidAt: string; note?: string | null; schoolId?: string; termId?: string; school: { name: string }; term: { name: string } };
type Expense = { id: string; description: string; amount: number; currency: string; category: string; paidAt: string };

export default function PaymentsPage() {
  const [schools,      setSchools]      = useState<School[]>([]);
  const [terms,        setTerms]        = useState<Term[]>([]);
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [expenses,     setExpenses]     = useState<Expense[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedTerm, setSelectedTerm] = useState("all");

  // Modal state
  const [payModalOpen,    setPayModalOpen]    = useState(false);
  const [payModalSchool,  setPayModalSchool]  = useState<School | null>(null);
  const [receiptPayment,  setReceiptPayment]  = useState<Payment | null>(null);
  const [receiptOpen,     setReceiptOpen]     = useState(false);
  const [editPayment,     setEditPayment]     = useState<Payment | null>(null);
  const [editPayForm,     setEditPayForm]     = useState({ amountPaid: "", note: "", paidAt: "" });
  const [deletePayment,   setDeletePayment]   = useState<Payment | null>(null);
  const [savingPay,       setSavingPay]       = useState(false);
  const [deletingPay,     setDeletingPay]     = useState(false);

  function openEditPayment(p: Payment) {
    setEditPayment(p);
    setEditPayForm({
      amountPaid: String(p.amountPaid),
      note:       p.note ?? "",
      paidAt:     new Date(p.paidAt).toISOString().split("T")[0],
    });
  }

  async function handleSavePayment() {
    if (!editPayment) return;
    setSavingPay(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editPayment.id, ...editPayForm, amountPaid: Number(editPayForm.amountPaid) }),
      });
      if (!res.ok) { toast.error("Failed to update payment"); return; }
      const updated = await res.json();
      setPayments(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast.success("Payment updated");
      setEditPayment(null);
    } finally { setSavingPay(false); }
  }

  async function handleDeletePayment() {
    if (!deletePayment) return;
    setDeletingPay(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletePayment.id }),
      });
      if (!res.ok) { toast.error("Failed to delete payment"); return; }
      setPayments(prev => prev.filter(p => p.id !== deletePayment.id));
      toast.success("Payment deleted");
      setDeletePayment(null);
    } finally { setDeletingPay(false); }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes, pRes, eRes] = await Promise.all([
        fetch("/api/admin/billing"),
        fetch("/api/admin/terms"),
        fetch("/api/admin/payments"),
        fetch("/api/admin/expenses"),
      ]);
      const [s, t, p, e] = await Promise.all([sRes.json(), tRes.json(), pRes.json(), eRes.json()]);
      setSchools(s);
      setTerms(t);
      setPayments(p);
      setExpenses(e);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleRecordPayment(school: School) {
    setPayModalSchool(school);
    setPayModalOpen(true);
  }

  function handlePaymentSuccess(payment: Payment) {
    setPayments(prev => [payment, ...prev]);
    setReceiptPayment(payment);
    setReceiptOpen(true);
  }

  function handleTermCreated(term: Term) {
    setTerms(prev => [term, ...prev]);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments & Revenue</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track school subscriptions, record payments, and monitor system revenue.</p>
        </div>
      </div>

      {/* Revenue overview always visible */}
      <RevenueOverview />

      <Tabs defaultValue="billing">
        <TabsList className="mb-4">
          <TabsTrigger value="billing" className="gap-1.5"><Receipt className="h-4 w-4" />School Billing</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><TrendingUp className="h-4 w-4" />Expenses</TabsTrigger>
        </TabsList>

        {/* ── Billing tab ── */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <TermSelector terms={terms} value={selectedTerm} onChange={setSelectedTerm} />
              <AddTermModal onCreated={handleTermCreated} />
            </div>
            <p className="text-xs text-muted-foreground">
              {terms.length} billing term{terms.length !== 1 ? "s" : ""} · {schools.length} schools
            </p>
          </div>

          <SchoolBillingTable
            schools={schools}
            terms={terms}
            payments={payments}
            selectedTerm={selectedTerm}
            onRecordPayment={handleRecordPayment}
            onPriceUpdated={(schoolId, price) =>
              setSchools(prev => prev.map(s => s.schoolId === schoolId ? { ...s, pricePerTerm: price } : s))
            }
          />

          {/* Recent payments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">School</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Term</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {payments.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">No payments recorded yet.</td></tr>
                  )}
                  {payments.slice(0, 20).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{p.receiptNumber}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{p.school.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.term.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                        UGX {p.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-slate-500">
                        {new Date(p.paidAt).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={() => { setReceiptPayment(p); setReceiptOpen(true); }}
                          >
                            View
                          </button>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openEditPayment(p)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600 ml-2" />
                          </button>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeletePayment(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-600 ml-1" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Expenses tab ── */}
        <TabsContent value="revenue">
          <ExpensesTable initial={expenses} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RegisterPaymentModal
        open={payModalOpen}
        onClose={() => { setPayModalOpen(false); setPayModalSchool(null); }}
        schools={schools}
        terms={terms}
        prefilledSchoolId={payModalSchool?.schoolId}
        onSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        payment={receiptPayment}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />

      {/* Edit payment dialog */}
      <Dialog open={!!editPayment} onOpenChange={o => !o && setEditPayment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (UGX)</label>
              <Input type="number" min={0} value={editPayForm.amountPaid}
                onChange={e => setEditPayForm(f => ({ ...f, amountPaid: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={editPayForm.paidAt}
                onChange={e => setEditPayForm(f => ({ ...f, paidAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Note (optional)</label>
              <Input value={editPayForm.note} placeholder="e.g. Term 1 payment"
                onChange={e => setEditPayForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditPayment(null)}>Cancel</Button>
              <Button className="flex-1" disabled={savingPay} onClick={handleSavePayment}>
                {savingPay ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete payment dialog */}
      <Dialog open={!!deletePayment} onOpenChange={o => !o && setDeletePayment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Payment?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 mt-1">
            Receipt <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{deletePayment?.receiptNumber}</span> — UGX {deletePayment?.amountPaid.toLocaleString()} from <span className="font-semibold">{deletePayment?.school.name}</span> will be permanently removed.
          </p>
          <div className="flex gap-2 pt-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeletePayment(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" disabled={deletingPay} onClick={handleDeletePayment}>
              {deletingPay ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
