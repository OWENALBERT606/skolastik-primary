"use client";

import { useState, useEffect } from "react";
import { CreditCard, Filter, Loader2, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLES: Record<string, string> = {
  PAID:        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  PARTIAL:     "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  UNPAID:      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  OVERDUE:     "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  CANCELLED:   "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

export default function ParentFinanceClient({ slug }: { slug: string }) {
  const [data,          setData]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [studentFilter, setStudentFilter] = useState("");

  useEffect(() => {
    fetch("/api/parent")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data)   return <div className="flex items-center justify-center min-h-[60vh]"><AlertCircle className="w-8 h-8 text-red-500" /></div>;

  const students = data.students as any[];
  const filtered = studentFilter ? students.filter((s: any) => s.id === studentFilter) : students;

  const totalBilled  = students.reduce((s: number, st: any) => s + st.invoices.reduce((a: number, i: any) => a + i.totalAmount, 0), 0);
  const totalPaid    = students.reduce((s: number, st: any) => s + st.invoices.reduce((a: number, i: any) => a + i.paid, 0), 0);
  const totalBalance = totalBilled - totalPaid;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-500" /> Fees & Finance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fee invoices and payment history for your children</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Billed", value: fmtCurrency(totalBilled), color: "text-slate-900 dark:text-white" },
          { label: "Total Paid",   value: fmtCurrency(totalPaid),   color: "text-green-600 dark:text-green-400" },
          { label: "Balance Due",  value: fmtCurrency(totalBalance), color: totalBalance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className={`text-base sm:text-xl font-bold ${color} truncate`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Children</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
      </div>

      {/* Per-student invoices */}
      {filtered.map((student: any) => {
        const studentTotal   = student.invoices.reduce((s: number, i: any) => s + i.totalAmount, 0);
        const studentPaid    = student.invoices.reduce((s: number, i: any) => s + i.paid, 0);
        const studentBalance = studentTotal - studentPaid;

        return (
          <div key={student.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                {student.imageUrl ? (
                  <img src={student.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-slate-400 font-mono">{student.admissionNo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${studentBalance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  {studentBalance > 0 ? `Balance: ${fmtCurrency(studentBalance)}` : "All Paid"}
                </p>
                <p className="text-xs text-slate-400">Paid: {fmtCurrency(studentPaid)} / {fmtCurrency(studentTotal)}</p>
              </div>
            </div>

            {/* Invoices */}
            {student.invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No invoices found</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {student.invoices.map((inv: any) => (
                  <div key={inv.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{inv.termName} {inv.yearName}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_STYLES[inv.status] ?? STATUS_STYLES.UNPAID}`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{inv.structureName}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:text-right shrink-0">
                      <div>
                        <p className="text-xs text-slate-400">Total</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{fmtCurrency(inv.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Paid</p>
                        <p className="font-semibold text-green-600 dark:text-green-400 text-sm">{fmtCurrency(inv.paid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Balance</p>
                        <p className={`font-bold text-sm ${inv.balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {fmtCurrency(inv.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
