"use client";

import { useState } from "react";
import { Search, Phone, Mail, MapPin, Users, ChevronRight, X, Briefcase, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type FeeAccount = { id: string; termLabel: string; totalInvoiced: number; totalPaid: number; balance: number };
type Student    = { id: string; name: string; admissionNo: string; gender: string; class: string; feeAccounts: FeeAccount[] };
type Parent     = { id: string; name: string; phone: string; email: string | null; address: string | null; occupation: string | null; relationship: string | null; students: Student[] };

const fmt = (n: number) => n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(2)}M` : `UGX ${n.toLocaleString()}`;

export default function BursarParentsClient({ parents, slug }: { parents: Parent[]; slug: string }) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Parent | null>(null);

  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    p.students.some(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.admissionNo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parents / Guardians</h1>
          <p className="text-sm text-slate-500 mt-0.5">{parents.length} registered parents</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name, phone, email or student…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parent</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Outstanding</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-sm text-slate-400">No parents found.</td></tr>
            )}
            {filtered.map(p => {
              const totalBalance = p.students.reduce((s, st) => s + st.feeAccounts.reduce((a, fa) => a + fa.balance, 0), 0);
              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelected(p)}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                    {p.relationship && <p className="text-xs text-slate-400 capitalize">{p.relationship}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Phone className="h-3 w-3 shrink-0" /> {p.phone}
                    </div>
                    {p.email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" /> {p.email}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {p.students.map(s => (
                        <Badge key={s.id} variant="outline" className="text-[10px]">{s.name.split(" ")[0]} · {s.class}</Badge>
                      ))}
                      {p.students.length === 0 && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-bold ${totalBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {totalBalance > 0 ? fmt(totalBalance) : "Cleared"}
                    </span>
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selected.name}</h2>
                {selected.relationship && <p className="text-xs text-slate-400 capitalize mt-0.5">{selected.relationship}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Contact details */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Contact Information</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selected.phone}</span>
                  </div>
                  {selected.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{selected.email}</span>
                    </div>
                  )}
                  {selected.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{selected.address}</span>
                    </div>
                  )}
                  {selected.occupation && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{selected.occupation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Students */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Students ({selected.students.length})
                </h3>
                {selected.students.length === 0 ? (
                  <p className="text-sm text-slate-400">No students linked.</p>
                ) : (
                  <div className="space-y-4">
                    {selected.students.map(s => {
                      const totalBalance = s.feeAccounts.reduce((a, fa) => a + fa.balance, 0);
                      return (
                        <div key={s.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                              <p className="text-xs text-slate-400">{s.admissionNo} · {s.class} · {s.gender}</p>
                            </div>
                            <span className={`text-sm font-bold ${totalBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {totalBalance > 0 ? fmt(totalBalance) : "✓ Cleared"}
                            </span>
                          </div>
                          {s.feeAccounts.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Fee History</p>
                              {s.feeAccounts.map(fa => (
                                <div key={fa.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                                  <span className="text-slate-500">{fa.termLabel}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400">Billed: {fmt(fa.totalInvoiced)}</span>
                                    <span className="text-emerald-600">Paid: {fmt(fa.totalPaid)}</span>
                                    {fa.balance > 0 && <span className="text-rose-600 font-semibold">Owed: {fmt(fa.balance)}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
