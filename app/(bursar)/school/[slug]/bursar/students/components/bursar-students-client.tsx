"use client";

import { useState } from "react";
import { Search, Phone, Mail, MapPin, ChevronRight, X, User, CreditCard, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Invoice    = { id: string; invoiceNumber: string; totalAmount: number; paidAmount: number; balance: number; status: string; issueDate: string };
type FeeAccount = { id: string; termLabel: string; totalInvoiced: number; totalPaid: number; totalDiscount: number; balance: number; status: string; invoices: Invoice[] };
type Parent     = { id: string; name: string; phone: string; email: string | null; address: string | null; relationship: string | null };
type Student    = { id: string; name: string; admissionNo: string; gender: string; dob: string | null; class: string; parent: Parent | null; feeAccounts: FeeAccount[] };

const fmt = (n: number) => n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(2)}M` : `UGX ${n.toLocaleString()}`;

const STATUS_COLORS: Record<string, string> = {
  ISSUED:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PARTIAL:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  PAID:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  OVERDUE:   "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  VOID:      "bg-slate-100 text-slate-500",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function BursarStudentsClient({ students, slug }: { students: Student[]; slug: string }) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase()) ||
    (s.parent?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{students.length} active students</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name, admission no, class…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Class</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parent</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-sm text-slate-400">No students found.</td></tr>
            )}
            {filtered.map(s => {
              const totalBalance = s.feeAccounts.reduce((a, fa) => a + fa.balance, 0);
              const latestAccount = s.feeAccounts[0];
              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.admissionNo} · {s.gender}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{s.class}</td>
                  <td className="px-5 py-3.5">
                    {s.parent ? (
                      <>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{s.parent.name}</p>
                        <p className="text-xs text-slate-400">{s.parent.phone}</p>
                      </>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-bold ${totalBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {totalBalance > 0 ? fmt(totalBalance) : "Cleared"}
                    </span>
                    {latestAccount && (
                      <p className="text-[10px] text-slate-400">{latestAccount.termLabel}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selected.name}</h2>
                  <p className="text-xs text-slate-400">{selected.admissionNo} · {selected.class} · {selected.gender}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Parent / Guardian */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Parent / Guardian</h3>
                {selected.parent ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{selected.parent.name}</p>
                      {selected.parent.relationship && (
                        <Badge variant="outline" className="text-[10px] capitalize">{selected.parent.relationship}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" /> {selected.parent.phone}
                    </div>
                    {selected.parent.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" /> {selected.parent.email}
                      </div>
                    )}
                    {selected.parent.address && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {selected.parent.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No parent linked.</p>
                )}
              </div>

              {/* Finance history */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Finance History</h3>
                {selected.feeAccounts.length === 0 ? (
                  <p className="text-sm text-slate-400">No fee records found.</p>
                ) : (
                  <div className="space-y-4">
                    {selected.feeAccounts.map(fa => (
                      <div key={fa.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        {/* Term header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{fa.termLabel}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400">Billed: <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(fa.totalInvoiced)}</span></span>
                            <span className="text-emerald-600 font-semibold">Paid: {fmt(fa.totalPaid)}</span>
                            {fa.balance > 0 && <span className="text-rose-600 font-bold">Owed: {fmt(fa.balance)}</span>}
                            {fa.balance === 0 && fa.totalInvoiced > 0 && <span className="text-emerald-600 font-bold">✓ Cleared</span>}
                          </div>
                        </div>
                        {/* Invoices */}
                        {fa.invoices.length > 0 && (
                          <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {fa.invoices.map(inv => (
                              <div key={inv.id} className="flex items-center justify-between px-4 py-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-slate-400" />
                                  <span className="font-mono text-slate-600 dark:text-slate-400">{inv.invoiceNumber}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-500">{fmt(inv.totalAmount)}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[inv.status] ?? "bg-slate-100 text-slate-500"}`}>
                                    {inv.status}
                                  </span>
                                  {inv.balance > 0 && <span className="text-rose-600 font-semibold">{fmt(inv.balance)} due</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
