"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentRow = {
  id:          string;
  amount:      number;
  method:      string;
  network:     string | null;
  processedAt: string;
  reference:   string | null;
  receiptNo:   string | null;
  studentName: string;
  admNo:       string;
};

function currency(n: number): string {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    CASH:          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    MOBILE_MONEY:  "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    BANK_TRANSFER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    CHEQUE:        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    ONLINE:        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    POS:           "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  };
  const label: Record<string, string> = {
    CASH: "Cash", MOBILE_MONEY: "Mobile Money", BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque", ONLINE: "Online", POS: "POS",
  };
  const cls = map[method] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
      {label[method] ?? method}
    </span>
  );
}

export default function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.admNo.toLowerCase().includes(q) ||
        (p.receiptNo ?? "").toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q),
    );
  }, [payments, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student, receipt, reference..."
          className="pl-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Receipt #</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Student</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Amount</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Method</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Reference</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-10">No payments found</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {p.receiptNo ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{p.studentName}</p>
                      <p className="text-slate-400">{p.admNo}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {currency(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <MethodBadge method={p.method} />
                        {p.network && (
                          <p className="text-[10px] text-slate-400">{p.network}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {p.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {format(new Date(p.processedAt), "dd MMM yy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Showing {filtered.length} of {payments.length} payments
          </div>
        )}
      </Card>
    </div>
  );
}
