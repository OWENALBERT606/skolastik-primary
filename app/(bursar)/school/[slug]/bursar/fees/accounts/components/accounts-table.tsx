"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AccountRow = {
  id:            string;
  totalInvoiced: number;
  totalPaid:     number;
  balance:       number;
  status:        "ACTIVE" | "SUSPENDED" | "CLEARED" | "OVERPAID";
  studentName:   string;
  admNo:         string;
  className:     string;
};

type FilterStatus = "all" | "outstanding" | "paid" | "overpaid";

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: "all",         label: "All"        },
  { key: "outstanding", label: "Outstanding" },
  { key: "paid",        label: "Paid"        },
  { key: "overpaid",    label: "Overpaid"    },
];

function currency(n: number): string {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

function StatusBadge({ status, balance }: { status: AccountRow["status"]; balance: number }) {
  if (status === "OVERPAID") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
        Overpaid
      </span>
    );
  }
  if (balance <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        Cleared
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
      Outstanding
    </span>
  );
}

export default function AccountsTable({ accounts }: { accounts: AccountRow[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [search, setSearch]             = useState("");

  const filtered = useMemo(() => {
    let rows = accounts;
    if (activeFilter === "outstanding") rows = rows.filter((r) => r.balance > 0);
    if (activeFilter === "paid")        rows = rows.filter((r) => r.balance <= 0 && r.status !== "OVERPAID");
    if (activeFilter === "overpaid")    rows = rows.filter((r) => r.status === "OVERPAID");

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.admNo.toLowerCase().includes(q) ||
          r.className.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [accounts, activeFilter, search]);

  const counts = useMemo(() => ({
    all:         accounts.length,
    outstanding: accounts.filter((r) => r.balance > 0).length,
    paid:        accounts.filter((r) => r.balance <= 0 && r.status !== "OVERPAID").length,
    overpaid:    accounts.filter((r) => r.status === "OVERPAID").length,
  }), [accounts]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student, admission no, class..."
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

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Student</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Adm #</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Class</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Invoiced</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Paid</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Balance</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-10">No accounts found</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{a.studentName}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{a.admNo}</td>
                    <td className="px-4 py-3 text-slate-500">{a.className || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{currency(a.totalInvoiced)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{currency(a.totalPaid)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${
                      a.balance > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : a.status === "OVERPAID"
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-400"
                    }`}>
                      {currency(Math.abs(a.balance))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} balance={a.balance} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Showing {filtered.length} of {accounts.length} accounts
          </div>
        )}
      </Card>
    </div>
  );
}
